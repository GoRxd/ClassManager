import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonInput, IonIcon, IonLabel, IonGrid, IonRow, IonCol, IonTextarea } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline } from 'ionicons/icons';
import { CollectionService } from '../../../collections/data/collection.service';
import { Expense } from '../../data/expense.repository';
import { SettingsService } from '../../../../core/settings/settings.service';
import { FormatService } from '../../../../core/services/format.service';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonInput,
    IonIcon, IonLabel, IonGrid, IonRow, IonCol, IonTextarea
  ],
  templateUrl: './add-expense-modal.component.html',
  styleUrls: ['./add-expense-modal.component.scss']
})
export class AddExpenseModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  public collectionService = inject(CollectionService);
  private settingsService = inject(SettingsService);
  private formatService = inject(FormatService);

  currency = this.settingsService.currency;

  @Input() preselectedCollectionId?: number;
  @Input() expense?: Expense;

  selectedCollectionId?: number;
  title: string = '';
  description: string = '';
  amount: number | null = null;

  products: { name: string; quantity: number; unitPrice: number }[] = [];

  constructor() {
    addIcons({ add, trashOutline });
  }

  ngOnInit() {
    if (this.expense) {
      this.selectedCollectionId = this.expense.collection_id;
      this.title = this.expense.title;
      this.description = this.expense.description || '';
      this.amount = this.formatService.toPLN(this.expense.amount_gr);

      if (this.expense.products) {
        this.products = this.expense.products.map(p => ({
          name: p.name,
          quantity: p.quantity,
          unitPrice: this.formatService.toPLN(p.unit_price_gr)
        }));
      }
    } else if (this.preselectedCollectionId) {
      this.selectedCollectionId = this.preselectedCollectionId;
    }
  }

  addProduct() {
    this.products.push({ name: '', quantity: 1, unitPrice: 0 });
    // Update total to ensure consistency (even if 0 difference, it resets manual override which is likely desired when modifying list)
    this.updateTotal();
  }

  removeProduct(index: number) {
    this.products.splice(index, 1);
    this.updateTotal();
  }

  updateTotal() {
    // Always calculate sum if products exist
    if (this.products.length > 0) {
      const sum = this.products.reduce((acc, p) => acc + (p.quantity * (p.unitPrice || 0)), 0);
      // Round to 2 decimals safely
      this.amount = Math.round(sum * 100) / 100;
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.selectedCollectionId || !this.title || this.amount === null || this.amount <= 0) {
      return;
    }

    const data = {
      collectionId: this.selectedCollectionId,
      title: this.title,
      description: this.description,
      amount: this.amount,
      products: this.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unitPricePLN: p.unitPrice
      }))
    };

    if (this.expense) {
      this.modalCtrl.dismiss({ ...this.expense, ...data, id: this.expense.id }, 'confirm');
    } else {
      this.modalCtrl.dismiss(data, 'confirm');
    }
  }
}
