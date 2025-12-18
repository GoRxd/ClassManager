import { Injectable, inject } from '@angular/core';
import { UiService } from './ui.service';
import { CollectionService } from '../../features/collections/data/collection.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { Expense } from '../../features/expenses/data/expense.repository';
import { FormatService } from './format.service';

@Injectable({
    providedIn: 'root'
})
export class PaymentManagementService {
    private collectionService = inject(CollectionService);
    private expenseService = inject(ExpenseService);
    private uiService = inject(UiService);
    private formatService = inject(FormatService);

    async revertPayment(
        collectionId: number,
        studentId: number,
        studentName: string,
        paidAmount: number,
        onComplete: () => Promise<void>
    ) {
        // 1. Fetch expenses for this collection
        const expenses = await this.expenseService.getExpensesByCollectionId(collectionId);

        // 2. Identify affected expenses
        // We look for the student name in the description. 
        // Format: "Contributors: Name 1, Name 2, ..."

        // Normalize strings for comparison to avoid whitespace/case issues
        const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetName = normalize(studentName);

        const affectedExpenses = expenses.filter(e => {
            if (!e.description) return false;
            return normalize(e.description).includes(targetName);
        });

        if (affectedExpenses.length === 0) {
            // Standard confirmation
            await this.showStandardConfirm(collectionId, studentId, onComplete);
        } else {
            // Advanced confirmation with expense updates
            await this.showAdvancedConfirm(collectionId, studentId, studentName, paidAmount, affectedExpenses, onComplete);
        }
    }

    private async showStandardConfirm(collectionId: number, studentId: number, onComplete: () => Promise<void>) {
        const confirmed = await this.uiService.showConfirm({
            header: 'Undo Payment',
            message: 'Are you sure you want to revert this payment to pending?',
            confirmText: 'Confirm'
        });

        if (confirmed) {
            await this.processRevert(collectionId, studentId, onComplete);
        }
    }

    private async showAdvancedConfirm(
        collectionId: number,
        studentId: number,
        studentName: string,
        paidAmount: number,
        expenses: Expense[],
        onComplete: () => Promise<void>
    ) {
        const confirmed = await this.uiService.showConfirm({
            header: 'Warning: Expenses Affected',
            message: `<p>This student is listed as a contributor in some expenses.</p>` +
                `<p>Reverting this payment will update <strong>${expenses.length} expense(s)</strong> by removing "${studentName}" from contributors and reducing the expense amount(s).</p>` +
                `<p><strong>Note:</strong> We will deduct the student's entire paid amount (${this.formatService.formatMoney(paidAmount)}) distributed across these expenses.</p>`,
            confirmText: 'Revert & Update Expenses'
        });

        if (confirmed) {
            await this.processRevertWithExpenses(collectionId, studentId, studentName, paidAmount, expenses, onComplete);
        }
    }

    private async processRevert(collectionId: number, studentId: number, onComplete: () => Promise<void>) {
        await this.collectionService.updatePayment(collectionId, studentId, 0);

        this.uiService.showToast('Payment reverted to pending', 'medium');

        await onComplete();
    }

    private async processRevertWithExpenses(
        collectionId: number,
        studentId: number,
        studentName: string,
        paidAmount: number,
        expenses: Expense[],
        onComplete: () => Promise<void>
    ) {
        // 1. Update Payment
        await this.collectionService.updatePayment(collectionId, studentId, 0);

        // 2. Update Expenses
        // Strategy: We have TotalPaidAmount. We need to reduce expense amounts.
        // We will iterate through affected expenses and deduct.
        // Ideally we should know EXACTLY how much was contributed to EACH expense, 
        // but simplistic approach is to just remove the student from description and deduct proportional or full amount?
        // Since our 'payout' logic fills expenses sequentially, we can try to infer, 
        // OR simpler: deduct the payment amount from the expenses until we run out of deduction amount, 
        // starting from latest or identifying where he is listed.

        // Actually, simplest consistent logic:
        // The student Paid X. That X was used in these expenses.
        // We should deduct X from these expenses total.
        // We will iterate expenses, and remove the student name.
        // But how much to deduct from WHICH expense?
        // If student is in description, it means they contributed.
        // We can assume equal distribution or simple FIFO?
        // Given the requirement "nie mozemy uzyc automatycznej wartosci kosztu... musimy wiedziec ile zaplacil ten konkretny student"
        // we have `paidAmount`.
        // Let's deduct `paidAmount` from the matching expenses.
        // Caveat: If paidAmount > expense amount (unlikely if multiple contributors), handled.
        // Realistically, the student contributed some part to Expense A, some to Expense B.
        // We will distribute the deduction across the found expenses.

        let amountToDeduct = paidAmount;

        for (const expense of expenses) {
            if (amountToDeduct <= 0) break;

            // Remove name from description
            // desc format: "Contributors: A, B, C"
            let newDesc = expense.description || '';
            // Remove name and potential comma, case insensitive
            const nameRegex = new RegExp(`(?:, )?${this.escapeRegExp(studentName)}(?:, )?`, 'i');
            newDesc = newDesc.replace(nameRegex, '');
            // Cleanup commas
            newDesc = newDesc.replace(/Contributors: , /, 'Contributors: ').replace(/, $/, '');
            if (newDesc.trim() === 'Contributors:') newDesc = '';


            // Determine deduction for this specific expense
            // We can't reduce expense below 0.
            // Also we shouldn't reduce more than the expense amount.
            const currentExpAmount = expense.amount_gr;
            const deduction = Math.min(currentExpAmount, amountToDeduct);

            const newAmount = currentExpAmount - deduction;
            amountToDeduct -= deduction;

            if (newAmount <= 0) {
                // Option requested by user: if expense <= 0, remove it completely
                await this.expenseService.removeExpense(expense.id);
            } else {
                // Update expense
                const amountPLN = this.formatService.toPLN(newAmount);
                await this.expenseService.updateExpense(
                    expense.id,
                    expense.title,
                    amountPLN, // service expects PLN
                    expense.collection_id,
                    expense.products?.map(p => ({
                        name: p.name,
                        quantity: p.quantity,
                        unitPricePLN: this.formatService.toPLN(p.unit_price_gr)
                    })) || [],
                    newDesc
                );
            }
        }

        this.uiService.showToast('Payment reverted & expenses updated', 'success');

        await onComplete();
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
