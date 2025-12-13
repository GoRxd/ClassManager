import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { TreasuryRepository, TreasuryStatus } from './treasury.repository';
import { ExpenseRepository, Expense } from './expense.repository';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private treasuryRepo = inject(TreasuryRepository);
  private expenseRepo = inject(ExpenseRepository);

  public treasury = signal<TreasuryStatus>({
    total_income: 0,
    total_expenses: 0,
    current_balance: 0
  });

  public recentExpenses = signal<Expense[]>([]);

  constructor() {}

  async loadDashboardData() {
    // 1. Load Treasury
    const status = await this.treasuryRepo.getStatus();
    this.treasury.set(status);

    // 2. Load Recent Expenses
    const expenses = await this.expenseRepo.getRecent(5);
    this.recentExpenses.set(expenses);
  }
}
