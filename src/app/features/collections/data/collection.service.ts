import { Injectable, inject, signal } from '@angular/core';
import { CollectionRepository } from './collection.repository';
import { Collection } from './collection.model';
import { FormatService } from '../../../core/services/format.service';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private repo = inject(CollectionRepository);
  private formatService = inject(FormatService);

  public collections = signal<Collection[]>([]);

  constructor() {
    this.loadCollections();
  }

  async loadCollections() {
    const data = await this.repo.getAll();
    this.collections.set(data);
  }

  async getActiveCount(): Promise<number> {
    return this.repo.countActive();
  }

  async addDetailed(title: string, description: string, amount: number, deadline?: string) {
    let deadlineTs = null;
    if (deadline) {
      deadlineTs = this.formatService.toTimestamp(deadline);
    }

    await this.repo.create({
      title,
      description,
      targetAmount: this.formatService.toGrosze(amount),
      deadline: deadlineTs,
      isArchived: false
    });
    await this.loadCollections();
  }

  async getDetails(id: number) {
    const collection = await this.repo.getById(id);
    const payments = await this.repo.getPayments(id);
    return { collection, payments };
  }

  async updatePayment(collectionId: number, studentId: number, amount: number) {
    await this.repo.upsertPayment(collectionId, studentId, amount);
    // Reload if needed, but usually we just refresh the details view
  }

  async getStudentCollections(studentId: number) {
    return this.repo.getStudentCollections(studentId);
  }

  async updateDetailed(id: number, title: string, description: string, amount: number, deadline?: string) {
    let deadlineTs = null;
    if (deadline) {
      deadlineTs = this.formatService.toTimestamp(deadline);
    }

    await this.repo.update(id, {
      title,
      description,
      targetAmount: this.formatService.toGrosze(amount),
      deadline: deadlineTs
    });
    await this.loadCollections();
  }

  async remove(id: number) {
    await this.repo.remove(id);
    await this.loadCollections();
  }

}
