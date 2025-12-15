import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';

import { Collection } from './collection.model';

@Injectable({ providedIn: 'root' })
export class CollectionRepository {
  private db = inject(DatabaseService);

  async countActive(): Promise<number> {
    const res = await this.db.query<{count: number}>('SELECT COUNT(*) as count FROM collections WHERE is_archived = 0');
    return res[0]?.count || 0;
  }

  async getAll(): Promise<Collection[]> {
    const sql = `SELECT * FROM collections WHERE is_archived = 0 ORDER BY CASE WHEN deadline_at IS NULL THEN 1 ELSE 0 END, deadline_at ASC, created_at DESC`;
    const res = await this.db.query<any>(sql);
    
    return res.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      targetAmount: row.target_amount_gr,
      deadline: row.deadline_at,
      isArchived: !!row.is_archived,
      createdAt: row.created_at
    }));
  }

  async create(collection: Collection): Promise<void> {
    const sql = `INSERT INTO collections (title, description, target_amount_gr, deadline_at) VALUES (?, ?, ?, ?)`;
    await this.db.run(sql, [
      collection.title, 
      collection.description, 
      collection.targetAmount, 
      collection.deadline || null
    ]);
  }

  async getById(id: number): Promise<Collection | undefined> {
    const sql = `SELECT * FROM collections WHERE id = ?`;
    const res = await this.db.query<any>(sql, [id]);
    if (!res.length) return undefined;
    
    const row = res[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      targetAmount: row.target_amount_gr,
      deadline: row.deadline_at,
      isArchived: !!row.is_archived,
      createdAt: row.created_at
    };
  }

  async getPayments(collectionId: number): Promise<import('./payment-status.model').StudentPaymentStatus[]> {
    const sql = `
        SELECT 
            s.id as student_id, s.first_name, s.last_name, 
            p.paid_amount_gr, p.paid_at, p.status
        FROM students s 
        LEFT JOIN payments p ON s.id = p.student_id AND p.collection_id = ?
        WHERE s.is_active = 1
        ORDER BY s.last_name ASC
    `;
    const res = await this.db.query<any>(sql, [collectionId]);
    return res.map(row => ({
        studentId: row.student_id,
        firstName: row.first_name,
        lastName: row.last_name,
        paidAmount: row.paid_amount_gr || 0,
        paidAt: row.paid_at || null,
        status: (row.status || 'PENDING') as any
    }));
  }

  async upsertPayment(collectionId: number, studentId: number, amount: number) {
    // Check if exists
    const check = await this.db.query('SELECT id FROM payments WHERE collection_id = ? AND student_id = ?', [collectionId, studentId]);
    
    if (check.length > 0) {
        // Update
        await this.db.run(
            `UPDATE payments SET paid_amount_gr = ?, paid_at = strftime('%s', 'now'), status = ? WHERE collection_id = ? AND student_id = ?`,
            [amount, amount > 0 ? 'PAID' : 'PENDING', collectionId, studentId]
        );
    } else {
        // Insert
        await this.db.run(
            `INSERT INTO payments (collection_id, student_id, paid_amount_gr, paid_at, status) VALUES (?, ?, ?, strftime('%s', 'now'), ?)`,
            [collectionId, studentId, amount, amount > 0 ? 'PAID' : 'PENDING']
        );
    }
  }

  async getStudentCollections(studentId: number): Promise<any[]> {
    const sql = `
        SELECT 
            c.id as collection_id, c.title, c.target_amount_gr, c.deadline_at,
            p.paid_amount_gr, p.status, p.paid_at
        FROM collections c
        LEFT JOIN payments p ON c.id = p.collection_id AND p.student_id = ?
        WHERE c.is_archived = 0
        ORDER BY CASE WHEN p.status = 'PAID' THEN 1 ELSE 0 END, c.deadline_at ASC
    `;
    const res = await this.db.query<any>(sql, [studentId]);
    return res.map(row => ({
        collectionId: row.collection_id,
        title: row.title,
        targetAmount: row.target_amount_gr,
        deadline: row.deadline_at,
        paidAmount: row.paid_amount_gr || 0,
        status: (row.status || 'PENDING') as 'PENDING' | 'PAID',
        paidAt: row.paid_at
    }));
  }
}
