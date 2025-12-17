import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';

export interface ExpenseProduct {
  id: number;
  expense_id: number;
  name: string;
  quantity: number;
  unit_price_gr: number;
}

export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount_gr: number;
  collection_id: number;
  created_at: number;
  products?: ExpenseProduct[];
}

@Injectable({ providedIn: 'root' })
export class ExpenseRepository {
  private db = inject(DatabaseService);

  async getRecent(limit: number = 5): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?`;
    const expenses = await this.db.query<Expense>(sql, [limit]);
    return this.attachProducts(expenses);
  }

  async addExpense(title: string, amountGr: number, collectionId: number, products: { name: string, quantity: number, unit_price_gr: number }[] = [], description?: string): Promise<void> {
    const sql = `INSERT INTO expenses (title, amount_gr, collection_id, description) VALUES (?, ?, ?, ?)`;

    const result = await this.db.run(sql, [title, amountGr, collectionId, description || null]);

    // In capacitor-sqlite, result.changes.lastId contains the ID of inserted row
    const expenseId = result.changes?.lastId;

    if (expenseId && products.length > 0) {
      await this.addProducts(expenseId, products);
    }

    console.log('Zapisano wydatek w pamięci telefonu!');
  }

  async removeExpense(expenseId: number): Promise<void> {
    // Cascade delete should handle products, but to be safe/explicit or if cascade fails (depends on pragma)
    // We configured ON DELETE CASCADE in schema, which usually works if foreign keys are enabled.
    // However, DatabaseService setup might not strictly enable FKs on every connection open (though good practice).
    // Let's rely on schema but we could also delete products manually.
    const sql = `DELETE FROM expenses WHERE id = ?`;
    await this.db.run(sql, [expenseId]);
  }

  async updateExpense(id: number, title: string, amountGr: number, collectionId: number, products: { name: string, quantity: number, unit_price_gr: number }[] = [], description?: string): Promise<void> {
    const sql = `UPDATE expenses SET title = ?, amount_gr = ?, collection_id = ?, description = ? WHERE id = ?`;
    await this.db.run(sql, [title, amountGr, collectionId, description || null, id]);

    // Replace products: delete old, add new
    await this.db.run('DELETE FROM expense_products WHERE expense_id = ?', [id]);

    if (products.length > 0) {
      await this.addProducts(id, products);
    }
  }

  async getExpensesByCollectionId(collectionId: number): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses WHERE collection_id = ?`;
    const expenses = await this.db.query<Expense>(sql, [collectionId]);
    return this.attachProducts(expenses);
  }

  async getAll(): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses ORDER BY created_at DESC`;
    const expenses = await this.db.query<Expense>(sql);
    return this.attachProducts(expenses);
  }

  private async addProducts(expenseId: number, products: { name: string, quantity: number, unit_price_gr: number }[]) {
    // Bulk insert would be better but simple loop is fine for small scale
    for (const p of products) {
      await this.db.run(
        `INSERT INTO expense_products (expense_id, name, quantity, unit_price_gr) VALUES (?, ?, ?, ?)`,
        [expenseId, p.name, p.quantity, p.unit_price_gr]
      );
    }
  }

  private async attachProducts(expenses: Expense[]): Promise<Expense[]> {
    if (expenses.length === 0) return [];

    const ids = expenses.map(e => e.id).join(',');
    const sql = `SELECT * FROM expense_products WHERE expense_id IN (${ids})`;
    const products = await this.db.query<ExpenseProduct>(sql);

    const productMap = new Map<number, ExpenseProduct[]>();
    products.forEach(p => {
      const list = productMap.get(p.expense_id) || [];
      list.push(p);
      productMap.set(p.expense_id, list);
    });

    return expenses.map(e => ({
      ...e,
      products: productMap.get(e.id) || []
    }));
  }
}
