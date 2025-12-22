import { Component, inject, signal, OnInit, computed, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Expense } from '../../data/expense.repository';
import { ExpenseService } from '../../services/expense.service';
import { UiService } from '../../../../core/services/ui.service';
import {
  IonContent, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonGrid, IonRow, IonCol,
  IonFab, IonFabButton, ModalController,
  IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, arrowBackOutline, timeOutline, walletOutline, add, createOutline, trashOutline } from 'ionicons/icons';
import { AddExpenseModalComponent } from '../../components/add-expense-modal/add-expense-modal.component';
import { ItemActionService } from '../../../../core/services/item-action.service';
import { SettingsService } from '../../../../core/settings/settings.service';

import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';
import { AppSearchComponent } from '../../../../core/components/app-search/app-search.component';
import { EmptyStateComponent } from '../../../../core/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SearchService } from '../../../../core/services/search.service';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    DatePipe,
    IonContent,
    IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton,
    IonFab, IonFabButton, IonItemSliding, IonItemOptions, IonItemOption,
    AppHeaderComponent, AppSearchComponent, EmptyStateComponent, MoneyPipe, TranslatePipe
  ],
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss']
})
export class ExpensesPage implements OnInit, OnDestroy {
  private expenseService = inject(ExpenseService);
  private modalCtrl = inject(ModalController);
  private uiService = inject(UiService);
  private itemAction = inject(ItemActionService);
  private settingsService = inject(SettingsService);
  private searchService = inject(SearchService);
  private translationService = inject(TranslationService);

  recentExpenses = signal<Expense[]>([]);
  allExpenses = signal<Expense[]>([]);
  viewMode = signal<'recent' | 'history'>('recent');

  filteredExpenses = computed(() => {
    const list = this.viewMode() === 'recent' ? this.recentExpenses() : this.allExpenses();
    return this.searchService.filter(list, e => [e.title, e.description]);
  });

  constructor() {
    addIcons({ calendarOutline, arrowBackOutline, timeOutline, walletOutline, add, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadRecent();
  }

  async ionViewWillEnter() {
    await this.refreshList();
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
        await this.expenseService.addExpense(
          res.data.title,
          res.data.amount,
          res.data.collectionId,
          res.data.products || [],
          res.data.description
        );

        await this.uiService.showToast(this.translationService.translate('EXPENSES.ADD_SUCCESS'), 'success');
        await this.refreshList();
      }
    });

    await modal.present();
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
            res.data.products || [],
            res.data.description
          );

          await this.uiService.showToast(this.translationService.translate('EXPENSES.UPDATE_SUCCESS'), 'success');
          await this.refreshList();
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
        await this.refreshList();
      },
      this.translationService.translate('EXPENSES.DELETE_CONFIRM_TITLE'),
      this.translationService.translate('EXPENSES.DELETE_CONFIRM_TEXT'),
      this.translationService.translate('EXPENSES.DELETE_SUCCESS')
    );
  }

  // delete method refactored into anonymous function callback of confirmDelete handles logic internally


  private async refreshList() {
    if (this.viewMode() === 'recent') {
      await this.loadRecent();
    } else {
      const all = await this.expenseService.getAll();
      this.allExpenses.set(all);
    }
  }

  ngOnDestroy() {
    this.searchService.clearQuery();
  }
}
