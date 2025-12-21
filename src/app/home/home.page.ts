import { Component, inject, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote,
  IonIcon, IonRefresher, IonRefresherContent,
  IonItemSliding, IonItemOptions, IonItemOption, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, walletOutline, timeOutline, createOutline, trashOutline, peopleOutline, calendarOutline } from 'ionicons/icons';
import { StudentService } from '../features/students/data/student.service';
import { CollectionService } from '../features/collections/data/collection.service';
import { FinanceService } from '../features/finance/data/finance.service';
import { ExpenseService } from '../features/expenses/services/expense.service';
import { UiService } from '../core/services/ui.service';
import { ItemActionService } from '../core/services/item-action.service';
import { AddExpenseModalComponent } from '../features/expenses/components/add-expense-modal/add-expense-modal.component';
import { Expense } from '../features/expenses/data/expense.repository';
import { SettingsService } from '../core/settings/settings.service';
import { AppHeaderComponent } from '../core/components/app-header/app-header.component';
import { EmptyStateComponent } from '../core/components/empty-state/empty-state.component';
import { MoneyPipe } from '../core/pipes/money.pipe';
import { TranslatePipe } from '../core/pipes/translate.pipe';
import { TranslationService } from '../core/services/translation.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    DatePipe, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote,
    IonIcon, IonRefresher, IonRefresherContent,
    IonItemSliding, IonItemOptions, IonItemOption,
    AppHeaderComponent, EmptyStateComponent, MoneyPipe, TranslatePipe
  ],
})
export class HomePage {
  private studentService = inject(StudentService);
  private collectionService = inject(CollectionService);
  public financeService = inject(FinanceService);
  private expenseService = inject(ExpenseService);
  private uiService = inject(UiService);
  private modalCtrl = inject(ModalController);
  private itemAction = inject(ItemActionService);
  private translationService = inject(TranslationService);

  public settingsService = inject(SettingsService); // Public so template can access methods if needed, but safer to expose signal

  public activeStudents: WritableSignal<number> = signal(0);
  public activeCollections: WritableSignal<number> = signal(0);

  // Finance service manages its own signals
  get treasury() { return this.financeService.treasury; }
  get recentExpenses() { return this.financeService.recentExpenses; }

  constructor() {
    addIcons({ arrowUpOutline, arrowDownOutline, walletOutline, timeOutline, createOutline, trashOutline, peopleOutline, calendarOutline });
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData(event?: any) {
    try {
      // 1. Load Services Data
      await this.financeService.loadDashboardData();

      const studentsCount = await this.studentService.getActiveCount();
      this.activeStudents.set(studentsCount);

      const collectionsCount = await this.collectionService.getActiveCount();
      this.activeCollections.set(collectionsCount);

    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      if (event) event.target.complete();
    }
  }

  handleRefresh(event: any) {
    this.loadData(event);
  }

  async edit(expense: Expense, slidingItem?: IonItemSliding) {
    await this.itemAction.handleEdit(slidingItem, async () => {
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
            res.data.collectionId,
            res.data.products || []
          );

          await this.uiService.showToast(this.translationService.translate('EXPENSES.UPDATE_SUCCESS'), 'success');
          await this.loadData();
        }
      });

      await modal.present();
    });
  }

  async confirmDelete(id: number, slidingItem?: IonItemSliding) {
    await this.itemAction.handleDelete(
      slidingItem,
      async () => {
        await this.expenseService.removeExpense(id);
        await this.loadData();
      },
      this.translationService.translate('EXPENSES.DELETE_CONFIRM_TITLE'),
      this.translationService.translate('EXPENSES.DELETE_CONFIRM_TEXT'),
      this.translationService.translate('EXPENSES.DELETE_SUCCESS')
    );
  }
}
