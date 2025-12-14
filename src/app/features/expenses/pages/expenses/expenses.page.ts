import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../../data/expense.repository';
import { ExpenseService } from '../../services/expense.service';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonGrid, IonRow, IonCol,
  IonFab, IonFabButton, ModalController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, arrowBackOutline, timeOutline, walletOutline, add } from 'ionicons/icons';
import { AddExpenseModalComponent } from '../../components/add-expense-modal/add-expense-modal.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
    IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonGrid, IonRow, IonCol,
    IonFab, IonFabButton
  ],
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss']
})
export class ExpensesPage implements OnInit {
  private expenseService = inject(ExpenseService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  recentExpenses = signal<Expense[]>([]);
  allExpenses = signal<Expense[]>([]);
  viewMode = signal<'recent' | 'history'>('recent');

  constructor() {
    addIcons({ calendarOutline, arrowBackOutline, timeOutline, walletOutline, add });
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
        
        const toast = await this.toastCtrl.create({
          message: 'Expense added successfully',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();

        // Refresh lists
        if (this.viewMode() === 'recent') {
          await this.loadRecent();
        } else {
          const all = await this.expenseService.getAll();
          this.allExpenses.set(all);
        }
      }
    });

    await modal.present();
  }
}
