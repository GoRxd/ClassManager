import { Injectable, inject } from '@angular/core';
import { ExpenseRepository, Expense } from '../data/expense.repository';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private repository = inject(ExpenseRepository);

  getRecent(limit: number = 5): Promise<Expense[]> {
    return this.repository.getRecent(limit);
  }

  getAll(): Promise<Expense[]> {
    return this.repository.getAll();
  }

  // Accepts amount in PLN and converts to grosze
  addExpense(title: string, amountPLN: number, collectionId: number): Promise<void> {
    const amountGr = Math.round(amountPLN * 100);
    return this.repository.addExpense(title, amountGr, collectionId);
  }

  removeExpense(expenseId: number): Promise<void> {
    return this.repository.removeExpense(expenseId);
  }

  getExpensesByCollectionId(collectionId: number): Promise<Expense[]> {
    return this.repository.getExpensesByCollectionId(collectionId);
  }
}
