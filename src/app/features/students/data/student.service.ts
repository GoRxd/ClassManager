import { Injectable, inject, signal } from '@angular/core';
import { Share } from '@capacitor/share';
import { TranslationService } from '../../../core/services/translation.service';
import { FormatService } from '../../../core/services/format.service';
import { StudentRepository } from './student.repository';
import { Student } from './student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private repo = inject(StudentRepository);
  private translationService = inject(TranslationService);
  private formatService = inject(FormatService);

  students = signal<Student[]>([]);

  constructor() {
    this.loadStudents();
  }

  async loadStudents() {
    const data = await this.repo.getAll();
    this.students.set(data);
  }

  async add(firstName: string, lastName: string, phone?: string) {
    await this.repo.addStudent({ 
        firstName, 
        lastName, 
        phone,
        isActive: true 
    });
    await this.loadStudents(); 
  }
  
  async update(student: Student) {
    await this.repo.updateStudent(student);
    await this.loadStudents();
  }

  async remove(id: number) {
      await this.repo.deleteStudent(id);
      await this.loadStudents();
  }

  async getActiveCount(): Promise<number> {
    return this.repo.countActive();
  }

  async getById(id: number): Promise<Student | undefined> {
    return this.repo.getById(id);
  }

  async sendPaymentReminder(student: Student, amount: number, currency: string) {
    if (!student) return;

    const message = this.translationService.translate('STUDENT_INFO.REMINDER_MESSAGE', {
      name: student.firstName,
      amount: this.formatService.formatMoney(amount),
      currency: currency
    });

    try {
      await Share.share({
        title: this.translationService.translate('STUDENT_INFO.REMIND_BUTTON'),
        text: message,
        dialogTitle: this.translationService.translate('STUDENT_INFO.REMIND_BUTTON'),
      });
    } catch (error) {
      console.error('Error sharing reminder:', error);
    }
  }
}