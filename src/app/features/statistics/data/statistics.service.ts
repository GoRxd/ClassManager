import { Injectable, inject } from '@angular/core';
import { CollectionRepository } from '../../collections/data/collection.repository';
import { ExpenseRepository, Expense } from '../../expenses/data/expense.repository';
import { Collection } from '../../collections/data/collection.model';
import { FormatService } from '../../../core/services/format.service';

export interface CashFlowData {
  labels: string[];
  income: number[];
  expenses: number[];
}

export interface ExpenseStructureData {
  labels: string[];
  data: number[];
}

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private colRepo = inject(CollectionRepository);
  private expRepo = inject(ExpenseRepository);
  private formatService = inject(FormatService);

  async getCashFlowData(): Promise<CashFlowData> {
    const expenses = await this.expRepo.getAll();
    const collections = await this.colRepo.getAll();
    
    // We need to fetch payments for each collection. 
    // This might be heavy, but for a class manager it's fine.
    let allPayments: { date: number, amount: number }[] = [];

    for (const c of collections) {
      if (c.id) {
        const payments = await this.colRepo.getPayments(c.id);
        const paid = payments.filter(p => p.status === 'PAID' && p.paidAt && p.paidAmount > 0);
        allPayments.push(...paid.map(p => ({ date: p.paidAt!, amount: p.paidAmount })));
      }
    }

    // Group by month (last 6 months)
    const months = 6;
    const now = new Date();
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleString('default', { month: 'short' }); // e.g. 'Jan'
      labels.push(label);

      // Start and end of this month
      const start = new Date(year, month, 1).getTime();
      const end = new Date(year, month + 1, 0, 23, 59, 59).getTime();

      const incomeSum = allPayments
        .filter(p => (p.date * 1000) >= start && (p.date * 1000) <= end)
        .reduce((sum, p) => sum + p.amount, 0);

      const expenseSum = expenses
        .filter(e => (e.created_at * 1000) >= start && (e.created_at * 1000) <= end)
        .reduce((sum, e) => sum + e.amount_gr, 0);

      // Convert to PLN
      incomeData.push(this.formatService.toPLN(incomeSum));
      expenseData.push(this.formatService.toPLN(expenseSum));
    }

    return { labels, income: incomeData, expenses: expenseData };
  }

  async getExpenseStructureData(): Promise<ExpenseStructureData> {
    const expenses = await this.expRepo.getAll();
    const collections = await this.colRepo.getAll();
    const colMap = new Map<number, string>();
    collections.forEach(c => colMap.set(c.id!, c.title));

    // Group by collection
    const structure = new Map<string, number>();

    for (const e of expenses) {
      const colName = colMap.get(e.collection_id) || 'Unknown'; 
      const val = structure.get(colName) || 0;
      structure.set(colName, val + e.amount_gr);
    }

    const labels: string[] = [];
    const data: number[] = [];

    structure.forEach((amount, label) => {
      labels.push(label);
      data.push(this.formatService.toPLN(amount));
    });

    return { labels, data };
  }
}
