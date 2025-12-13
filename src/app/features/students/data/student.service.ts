import { Injectable, inject, signal } from '@angular/core';
import { StudentRepository } from './student.repository';
import { Student } from './student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private repo = inject(StudentRepository);
  
  // To jest Twój stan - lista uczniów dostępna dla całej apki
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
}