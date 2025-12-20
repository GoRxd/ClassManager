import { Injectable, inject } from '@angular/core';
import { UiService } from './ui.service';
import { CollectionService } from '../../features/collections/data/collection.service';
import { ExpenseService } from '../../features/expenses/services/expense.service';
import { Expense } from '../../features/expenses/data/expense.repository';
import { StudentCollectionSummary } from '../../features/collections/data/collection.repository';
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

    async equalizePayments(studentId: number, studentName: string, collections: StudentCollectionSummary[], activeStudentCount: number) {
        const state = this.calculateFinancialState(collections, activeStudentCount);

        // SCENARIO 1: STUDENT OWES MONEY (DEFICIT)
        if (state.globalBalance < 0) {
            const amountToPay = Math.abs(state.globalBalance);
            const confirmed = await this.uiService.showConfirm({
                header: this.translationService.translate('STUDENT_INFO.EQUALIZE_PAY_CONFIRM_HEADER'),
                message: this.translationService.translate('STUDENT_INFO.EQUALIZE_PAY_CONFIRM_MSG', { amount: this.formatService.formatMoney(amountToPay) }),
                confirmText: this.translationService.translate('COLLECTIONS.PAY')
            });

            if (confirmed) {
                // Mark ALL active collections as PAID (to recommended amount)
                for (const col of collections) {
                    const recommendedPrice = Math.round(col.targetAmount / activeStudentCount);
                    // Only update if current paid amount is less than recommended
                    if (col.paidAmount < recommendedPrice) {
                        await this.adjustPayment(col.collectionId, studentId, studentName, col.paidAmount, recommendedPrice);
                    }
                }
                this.uiService.showToast(this.translationService.translate('COMMON.SUCCESS'), 'success');
            }
            return;
        }

        // SCENARIO 2: SURPLUS OR BALANCED (REDISTRIBUTE ONLY)
        if (state.deficits.length === 0) {
            this.uiService.showToast(this.translationService.translate('STUDENT_INFO.EQUALIZE_SUCCESS'), 'success');
            return;
        }

        // 2. Distribute Surplus to Deficits
        let surplusPoolGr = state.surplusPoolGr;

        for (const deficitItem of state.deficits) {
            if (surplusPoolGr <= 0) break;

            const needed = deficitItem.deficit ?? 0;
            const canCover = Math.min(surplusPoolGr, needed);

            // Increase deficit item payment
            const newDeficitPayment = deficitItem.paidAmount + canCover;
            await this.adjustPayment(deficitItem.collectionId, studentId, studentName, deficitItem.paidAmount, newDeficitPayment);

            surplusPoolGr -= canCover;
            let amountToDeductFromSurpluses = canCover;

            // Reduce surplus items payments
            for (const surplusItem of state.surpluses) {
                if (amountToDeductFromSurpluses <= 0) break;

                // Track current surplus locally
                if (surplusItem.currentSurplus === undefined) {
                    surplusItem.currentSurplus = surplusItem.surplus ?? 0;
                }

                if (surplusItem.currentSurplus > 0) {
                    const take = Math.min(surplusItem.currentSurplus, amountToDeductFromSurpluses);
                    const newSurplusPayment = surplusItem.paidAmount - take;

                    await this.adjustPayment(surplusItem.collectionId, studentId, studentName, surplusItem.paidAmount, newSurplusPayment);

                    surplusItem.paidAmount = newSurplusPayment;
                    surplusItem.currentSurplus -= take;
                    amountToDeductFromSurpluses -= take;
                }
            }
        }

        this.uiService.showToast(this.translationService.translate('STUDENT_INFO.EQUALIZE_SUCCESS'), 'success');
    }

    async returnSurplus(studentId: number, studentName: string, collections: StudentCollectionSummary[], activeStudentCount: number) {
        const state = this.calculateFinancialState(collections, activeStudentCount);
        let totalRefunded = 0;

        for (const surplusItem of state.surpluses) {
            const refund = surplusItem.surplus ?? 0;
            if (refund > 0) {
                await this.adjustPayment(surplusItem.collectionId, studentId, studentName, surplusItem.paidAmount, surplusItem.recommended);
                totalRefunded += refund;
            }
        }

        if (totalRefunded > 0) {
            this.uiService.showToast(this.translationService.translate('PAYMENT_MANAGEMENT.REFUND_SUCCESS', { amount: this.formatService.formatMoney(totalRefunded) }), 'success');
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

    private calculateFinancialState(collections: StudentCollectionSummary[], activeStudentCount: number) {
        let totalPaid = 0;
        let totalRequired = 0;
        let surplusPoolGr = 0;
        // Extend collection type locally
        interface CalculationResult extends StudentCollectionSummary {
            surplus?: number;
            deficit?: number;
            currentSurplus?: number;
            recommended: number;
        }

        let deficits: CalculationResult[] = [];
        let surpluses: CalculationResult[] = [];

        for (const col of collections) {
            const recommendedPrice = Math.round(col.targetAmount / activeStudentCount);
            const paid = col.paidAmount;

            totalPaid += paid;
            totalRequired += recommendedPrice;

            const diff = paid - recommendedPrice;
            if (diff > 0) {
                surpluses.push({ ...col, surplus: diff, currentSurplus: diff, recommended: recommendedPrice });
                surplusPoolGr += diff;
            } else if (diff < 0) {
                deficits.push({ ...col, deficit: Math.abs(diff), recommended: recommendedPrice });
            }
        }

        return {
            totalPaid,
            totalRequired,
            globalBalance: totalPaid - totalRequired,
            surplusPoolGr,
            deficits,
            surpluses
        };
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
