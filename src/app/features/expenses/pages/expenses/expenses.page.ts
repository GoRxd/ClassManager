import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../../data/expense.repository';
import { ExpenseService } from '../../services/expense.service';
import { UiService } from '../../../../core/services/ui.service';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonGrid, IonRow, IonCol,
  IonFab, IonFabButton, ModalController,
  IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, arrowBackOutline, timeOutline, walletOutline, add, createOutline, trashOutline } from 'ionicons/icons';
import { AddExpenseModalComponent } from '../../components/add-expense-modal/add-expense-modal.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
    IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonGrid, IonRow, IonCol,
    IonFab, IonFabButton, IonItemSliding, IonItemOptions, IonItemOption
  ],
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss']
})
export class ExpensesPage implements OnInit {
  private expenseService = inject(ExpenseService);
  private modalCtrl = inject(ModalController);
  private uiService = inject(UiService);

  recentExpenses = signal<Expense[]>([]);
  allExpenses = signal<Expense[]>([]);
  viewMode = signal<'recent' | 'history'>('recent');

  constructor() {
    addIcons({ calendarOutline, arrowBackOutline, timeOutline, walletOutline, add, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadRecent();
  }

  async loadRecent() {
    const expenses = await this.expenseService.getRecent(5);
    this.recentExpenses.set(expenses);
  }

  async showHistory() {
    this.viewMode.set('history');
    const expenses = await this.expenseService.getAll();
    this.allExpenses.set(expenses);
  }

  showRecent() {
    this.viewMode.set('recent');
  }

  async openAddExpenseModal() {
    const modal = await this.modalCtrl.create({
      component: AddExpenseModalComponent
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        // Service handles conversion
        await this.expenseService.addExpense(res.data.title, res.data.amount, res.data.collectionId);
        
        await this.uiService.showToast('Expense added successfully', 'success');
        await this.refreshList();
      }
    });

    await modal.present();
  }

  async edit(expense: Expense) {
    const modal = await this.modalCtrl.create({
      component: AddExpenseModalComponent,
      componentProps: {
        expense: expense
      }
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        await this.expenseService.updateExpense(
          expense.id,
          res.data.title,
          res.data.amount,
          res.data.collectionId
        );
        
        await this.uiService.showToast('Expense updated successfully', 'success');
        await this.refreshList();
      }
    });

    await modal.present();
  }

  async confirmDelete(id: number) {
    const confirmed = await this.uiService.showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this expense?'
    );

    if (confirmed) {
      this.delete(id);
    }
  }

  async delete(id: number) {
    await this.expenseService.removeExpense(id);
    await this.uiService.showToast('Expense deleted', 'medium');
    await this.refreshList();
  }

  private async refreshList() {
    if (this.viewMode() === 'recent') {
      await this.loadRecent();
    } else {
      const all = await this.expenseService.getAll();
      this.allExpenses.set(all);
    }
  }
}
