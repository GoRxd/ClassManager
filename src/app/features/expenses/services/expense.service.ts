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
  addExpense(title: string, amountPLN: number, collectionId: number, products: { name: string, quantity: number, unitPricePLN: number }[] = [], description?: string): Promise<void> {
    const amountGr = Math.round(amountPLN * 100);
    const productsGr = products.map(p => ({
      name: p.name,
      quantity: p.quantity,
      unit_price_gr: Math.round(p.unitPricePLN * 100)
    }));
    return this.repository.addExpense(title, amountGr, collectionId, productsGr, description);
  }

  updateExpense(id: number, title: string, amountPLN: number, collectionId: number, products: { name: string, quantity: number, unitPricePLN: number }[] = [], description?: string): Promise<void> {
    const amountGr = Math.round(amountPLN * 100);
    const productsGr = products.map(p => ({
      name: p.name,
      quantity: p.quantity,
      unit_price_gr: Math.round(p.unitPricePLN * 100)
    }));
    return this.repository.updateExpense(id, title, amountGr, collectionId, productsGr, description);
  }

  removeExpense(expenseId: number): Promise<void> {
    return this.repository.removeExpense(expenseId);
  }

  getExpensesByCollectionId(collectionId: number): Promise<Expense[]> {
    return this.repository.getExpensesByCollectionId(collectionId);
  }
}
