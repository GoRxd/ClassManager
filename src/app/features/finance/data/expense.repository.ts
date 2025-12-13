import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';

export interface Expense {
  id: number;
  title: string;
  amount_gr: number;
  created_at: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseRepository {
  private db = inject(DatabaseService);

  async getRecent(limit: number = 5): Promise<Expense[]> {
    const sql = `SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?`;
    return this.db.query<Expense>(sql, [limit]);
  }
}
