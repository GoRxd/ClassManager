import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonInput } from '@ionic/angular/standalone';
import { CollectionService } from '../../../collections/data/collection.service';
import { Expense } from '../../data/expense.repository';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonInput
  ],
  templateUrl: './add-expense-modal.component.html',
  styleUrls: ['./add-expense-modal.component.scss']
})
export class AddExpenseModalComponent {
  private modalCtrl = inject(ModalController);
  public collectionService = inject(CollectionService);
  
  @Input() preselectedCollectionId?: number;
  @Input() expense?: Expense;

  selectedCollectionId?: number;
  title: string = '';
  amount: number | null = null;
  
  constructor() {}

  ionViewWillEnter() {
    if (this.expense) {
      this.selectedCollectionId = this.expense.collection_id;
      this.title = this.expense.title;
      this.amount = this.expense.amount_gr / 100;
    } else if (this.preselectedCollectionId) {
      this.selectedCollectionId = this.preselectedCollectionId;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.selectedCollectionId || !this.title || !this.amount) {
      return; 
    }

    this.modalCtrl.dismiss({
      collectionId: this.selectedCollectionId,
      title: this.title,
      amount: this.amount
    }, 'confirm');
  }
}
