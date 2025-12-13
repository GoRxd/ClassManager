import { Injectable, inject, signal } from '@angular/core';
import { CollectionRepository } from './collection.repository';
import { Collection } from './collection.model';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private repo = inject(CollectionRepository);

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
        deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
    }

    await this.repo.create({
        title,
        description,
        targetAmount: amount * 100, // convert to grosze
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
}
