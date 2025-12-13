import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';

export interface TreasuryStatus {
  total_income: number;
  total_expenses: number;
  current_balance: number;
}

@Injectable({ providedIn: 'root' })
export class TreasuryRepository {
  private db = inject(DatabaseService);

  async getStatus(): Promise<TreasuryStatus> {
    const res = await this.db.query<TreasuryStatus>('SELECT * FROM v_treasury_status');
    return res[0] || { total_income: 0, total_expenses: 0, current_balance: 0 };
  }
}
