import { Injectable, inject } from '@angular/core';
import { UiService } from './ui.service';
import { CollectionService } from '../../features/collections/data/collection.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { Expense } from '../../features/expenses/data/expense.repository';
import { FormatService } from './format.service';
import { TranslationService } from './translation.service';

@Injectable({
    providedIn: 'root'
})
export class PaymentManagementService {
    private collectionService = inject(CollectionService);
    private expenseService = inject(ExpenseService);
    private uiService = inject(UiService);
    private formatService = inject(FormatService);
    private translationService = inject(TranslationService);

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
            header: this.translationService.translate('PAYMENT_MANAGEMENT.UNDO_TITLE'),
            message: this.translationService.translate('PAYMENT_MANAGEMENT.UNDO_TEXT'),
            confirmText: this.translationService.translate('COMMON.CONFIRM')
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
            header: this.translationService.translate('PAYMENT_MANAGEMENT.EXPENSES_AFFECTED_TITLE'),
            message: `<p>${this.translationService.translate('PAYMENT_MANAGEMENT.EXPENSES_AFFECTED_TEXT_1')}</p>` +
                `<p>${this.translationService.translate('PAYMENT_MANAGEMENT.EXPENSES_AFFECTED_TEXT_2', { count: expenses.length, name: studentName })}</p>` +
                `<p><strong>${this.translationService.translate('COMMON.NOTE')}:</strong> ${this.translationService.translate('PAYMENT_MANAGEMENT.EXPENSES_AFFECTED_NOTE', { amount: this.formatService.formatMoney(paidAmount) })}</p>`,
            confirmText: this.translationService.translate('PAYMENT_MANAGEMENT.REVERT_BUTTON')
        });

        if (confirmed) {
            await this.processRevertWithExpenses(collectionId, studentId, studentName, paidAmount, expenses, onComplete);
        }
    }

    async adjustPayment(
        collectionId: number,
        studentId: number,
        studentName: string,
        oldAmountGr: number,
        newAmountGr: number
    ) {
        if (newAmountGr >= oldAmountGr) {
            await this.collectionService.updatePayment(collectionId, studentId, newAmountGr);
            return;
        }

        const reductionAmountGr = oldAmountGr - newAmountGr;
        const expenses = await this.expenseService.getExpensesByCollectionId(collectionId);

        const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
        const targetName = normalize(studentName);

        const affectedExpenses = expenses.filter(e => {
            if (!e.description) return false;
            return normalize(e.description).includes(targetName);
        });

        if (affectedExpenses.length > 0) {
            await this.applyDeduction(affectedExpenses, studentName, reductionAmountGr, newAmountGr === 0);
        }

        await this.collectionService.updatePayment(collectionId, studentId, newAmountGr);
    }

    async equalizePayments(studentId: number, studentName: string, collections: any[], activeStudentCount: number) {
        for (const col of collections) {
            const recommendedPrice = Math.round(col.targetAmount / activeStudentCount);
            if (col.paidAmount !== recommendedPrice) {
                await this.adjustPayment(col.collectionId, studentId, studentName, col.paidAmount, recommendedPrice);
            }
        }
    }

    private async processRevert(collectionId: number, studentId: number, onComplete: () => Promise<void>) {
        await this.collectionService.updatePayment(collectionId, studentId, 0);

        this.uiService.showToast(this.translationService.translate('PAYMENT_MANAGEMENT.REVERT_SUCCESS'), 'medium');

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
        await this.adjustPayment(collectionId, studentId, studentName, paidAmount, 0);

        this.uiService.showToast(this.translationService.translate('PAYMENT_MANAGEMENT.REVERT_WITH_EXPENSES_SUCCESS'), 'success');
        await onComplete();
    }

    private async applyDeduction(expenses: Expense[], studentName: string, totalReductionGr: number, removeName: boolean) {
        let remainingReduction = totalReductionGr;

        for (const expense of expenses) {
            if (remainingReduction <= 0) break;

            let newDesc = expense.description || '';
            if (removeName) {
                const nameRegex = new RegExp(`(?:, )?${this.escapeRegExp(studentName)}(?:, )?`, 'i');
                newDesc = newDesc.replace(nameRegex, '');
                newDesc = newDesc.replace(/Contributors: , /, 'Contributors: ').replace(/, $/, '');
                if (newDesc.trim() === 'Contributors:') newDesc = '';
            }

            const currentExpAmount = expense.amount_gr;
            const deduction = Math.min(currentExpAmount, remainingReduction);
            const newAmount = currentExpAmount - deduction;
            remainingReduction -= deduction;

            if (newAmount <= 0) {
                await this.expenseService.removeExpense(expense.id);
            } else {
                const amountPLN = this.formatService.toPLN(newAmount);
                await this.expenseService.updateExpense(
                    expense.id,
                    expense.title,
                    amountPLN,
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
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
