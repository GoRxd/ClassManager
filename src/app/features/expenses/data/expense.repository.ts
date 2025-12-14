import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';

export interface Expense {
  id: number;
  title: string;
  amount_gr: number;
  collection_id: number;
  created_at: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseRepository {
  private db = inject(DatabaseService);

  async getRecent(limit: number = 5): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?`;
    return this.db.query<Expense>(sql, [limit]);
  }

  async addExpense(title: string, amountGr: number, collectionId: number): Promise<void> {     
      const sql = `INSERT INTO expenses (title, amount_gr, collection_id) VALUES (?, ?, ?)`;
      
      await this.db.run(sql, [title, amountGr, collectionId]);
      
      console.log('Zapisano wydatek w pamięci telefonu!');
  }

  async removeExpense(expenseId: number): Promise<void> {
    const sql = `DELETE FROM expenses WHERE id = ?`;
    await this.db.run(sql, [expenseId]);
  }

  async getExpensesByCollectionId(collectionId: number): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses WHERE collection_id = ?`;
    return this.db.query<Expense>(sql, [collectionId]);
  }

  async getAll(): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses ORDER BY created_at DESC`;
    return this.db.query<Expense>(sql);
  }
}
