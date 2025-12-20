import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../database/database.service';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';

import { StudentRepository } from '../../features/students/data/student.repository';
import { CollectionRepository } from '../../features/collections/data/collection.repository';
import { ExpenseRepository } from '../../features/expenses/data/expense.repository';

export interface BackupData {
    version: number;
    timestamp: number;
    data: {
        students: any[];
        collections: any[];
        payments: any[];
        expenses: any[];
        expense_products: any[];
    };
}

@Injectable({
    providedIn: 'root'
})
export class BackupService {
    private db = inject(DatabaseService);
    private platform = inject(Platform);

    private studentRepo = inject(StudentRepository);
    private collectionRepo = inject(CollectionRepository);
    private expenseRepo = inject(ExpenseRepository);

    async exportData(): Promise<string> {
        const students = await this.studentRepo.getAllRaw();
        const collections = await this.collectionRepo.getAllRaw();
        const payments = await this.collectionRepo.getAllPaymentsRaw();
        const expenses = await this.expenseRepo.getAllRaw();
        const expense_products = await this.expenseRepo.getAllProductsRaw();

        const backup: BackupData = {
            version: 1,
            timestamp: Date.now(),
            data: {
                students,
                collections,
                payments,
                expenses,
                expense_products
            }
        };

        return JSON.stringify(backup, null, 2);
    }

    async createBackupFile(): Promise<void> {
        const json = await this.exportData();
        const fileName = `class_manager_backup_${new Date().toISOString().split('T')[0]}.json`;

        try {
            const result = await Filesystem.writeFile({
                path: fileName,
                data: json,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });

            if (this.platform.is('capacitor')) {
                await Share.share({
                    title: 'Class Manager Backup',
                    text: 'Here is your backup file.',
                    url: result.uri,
                    dialogTitle: 'Save Backup'
                });
            } else {
                // Web fallback: Download file
                const blob = new Blob([json], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error('Backup failed', e);
            throw e;
        }
    }

    async restoreData(jsonString: string): Promise<void> {
        let backup: BackupData;
        try {
            backup = JSON.parse(jsonString);
        } catch (e) {
            throw new Error('Invalid JSON format');
        }

        if (!backup.data || !backup.version) {
            throw new Error('Invalid backup file structure');
        }

        // Construct SQL Transaction
        const sql = [
            'PRAGMA foreign_keys = OFF;', // Disable foreign keys to avoid constraints during clear
            'DELETE FROM expense_products;',
            'DELETE FROM expenses;',
            'DELETE FROM payments;',
            'DELETE FROM collections;',
            'DELETE FROM students;',
            ...this.generateInsertSQL('students', backup.data.students),
            ...this.generateInsertSQL('collections', backup.data.collections),
            ...this.generateInsertSQL('payments', backup.data.payments),
            ...this.generateInsertSQL('expenses', backup.data.expenses),
            ...this.generateInsertSQL('expense_products', backup.data.expense_products),
            'PRAGMA foreign_keys = ON;'
        ].join('\n');

        await this.db.executeBatch(sql);
    }

    private generateInsertSQL(table: string, rows: any[]): string[] {
        if (!rows || rows.length === 0) return [];
        return rows.map(row => {
            const keys = Object.keys(row).join(', ');
            const values = Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'number') return val;
                // Escape single quotes for SQL
                return `'${String(val).replace(/'/g, "''")}'`;
            }).join(', ');
            return `INSERT INTO ${table} (${keys}) VALUES (${values});`;
        });
    }
}
