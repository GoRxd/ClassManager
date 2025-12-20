import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../core/database/database.service';
import { Student } from './student.model';

@Injectable({ providedIn: 'root' })
export class StudentRepository {
  private db = inject(DatabaseService);

  async getAllRaw(): Promise<any[]> {
    return this.db.query('SELECT * FROM students');
  }

  async addStudent(student: Student) {
    const sql = `INSERT INTO students (first_name, last_name, phone) VALUES (?, ?, ?)`;
    await this.db.run(sql, [student.firstName, student.lastName, student.phone || null]);
  }

  async getAll(): Promise<Student[]> {
    const sql = `SELECT * FROM students WHERE is_active = 1 ORDER BY last_name ASC`;
    const res = await this.db.query<any>(sql);


    return res.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      isActive: !!row.is_active
    }));
  }

  async updateStudent(student: Student) {
    const sql = `UPDATE students SET first_name = ?, last_name = ?, phone = ? WHERE id = ?`;
    await this.db.run(sql, [student.firstName, student.lastName, student.phone || null, student.id]);
  }

  // Soft delete
  async deleteStudent(id: number) {
    const sql = `UPDATE students SET is_active = 0 WHERE id = ?`;
    await this.db.run(sql, [id]);
  }

  async countActive(): Promise<number> {
    const res = await this.db.query<{ count: number }>(`SELECT COUNT(*) as count FROM students WHERE is_active = 1`);
    return res[0]?.count || 0;
  }

  async getById(id: number): Promise<Student | undefined> {
    const sql = `SELECT * FROM students WHERE id = ?`;
    const res = await this.db.query<any>(sql, [id]);
    if (!res.length) return undefined;

    const row = res[0];
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      isActive: !!row.is_active
    };
  }
}