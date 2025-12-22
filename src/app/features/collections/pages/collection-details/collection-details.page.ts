import { Component, inject, OnInit } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonList, IonListHeader, IonLabel, IonItem, IonNote, IonBadge, ModalController, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonItemSliding, IonItemOptions, IonItemOption, IonProgressBar
} from '@ionic/angular/standalone';
import { arrowBackOutline, checkmarkCircleOutline, closeCircleOutline, cardOutline } from 'ionicons/icons';
import { SettingsService } from '../../../../core/settings/settings.service';
import { ExpenseService } from '../../../expenses/services/expense.service';
import { PaymentManagementService } from '../../../../core/services/payment-management.service';
import { UiService } from '../../../../core/services/ui.service';
import { FormatService } from '../../../../core/services/format.service';

import { CollectionService } from '../../data/collection.service';
import { Collection } from '../../data/collection.model';
import { StudentPaymentStatus } from '../../data/payment-status.model';
import { Expense } from '../../../expenses/data/expense.repository';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { addIcons } from 'ionicons';
import { ItemActionService } from '../../../../core/services/item-action.service';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-collection-details',
  standalone: true,
  templateUrl: './collection-details.page.html',
  styleUrls: ['./collection-details.page.scss'],
  imports: [
    PercentPipe, FormsModule,
    IonContent,
    IonList, IonLabel, IonItem, IonNote, IonButton, IonIcon, IonSegment, IonSegmentButton,
    IonItemSliding, IonItemOptions, IonItemOption, IonProgressBar,
    AppHeaderComponent, MoneyPipe, TranslatePipe
  ]
})
export class CollectionDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CollectionService);
  private modalCtrl = inject(ModalController);
  private itemAction = inject(ItemActionService);
  public translationService = inject(TranslationService);
  private settingsService = inject(SettingsService);
  private expenseService = inject(ExpenseService);
  private paymentManagement = inject(PaymentManagementService);
  public uiService = inject(UiService);
  public formatService = inject(FormatService);

  collection: Collection | undefined;
  payments: StudentPaymentStatus[] = [];
  expenses: Expense[] = [];
  segment: 'pending' | 'paid' = 'pending';
  currency = this.translationService.currency;

  constructor() {
    addIcons({ arrowBackOutline, checkmarkCircleOutline, closeCircleOutline, cardOutline });
  }

  get totalCollected(): number {
    return this.payments.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  }

  get progress(): number {
    if (!this.collection || this.collection.targetAmount === 0) return 0;
    return this.totalCollected / this.collection.targetAmount;
  }

  get pendingStudents() {
    return this.payments.filter(p => p.status !== 'PAID');
  }

  get paidStudents() {
    return this.payments.filter(p => p.status === 'PAID');
  }

  get suggestedAmount(): number {
    if (!this.collection || this.payments.length === 0) return 0;
    return this.collection.targetAmount / this.payments.length;
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(+id);
    }
  }

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(+id);
    }
  }

  async load(id: number) {
    const data = await this.service.getDetails(id);
    if (data.collection) {
      this.collection = data.collection;
      this.payments = data.payments;
      this.expenses = await this.expenseService.getExpensesByCollectionId(id);
    }
  }

  async quickPay(student: StudentPaymentStatus, event: Event, slidingItem?: IonItemSliding) {
    event.stopPropagation();
    if (!this.collection || this.suggestedAmount <= 0) {
      slidingItem?.close();
      return;
    }

    await this.itemAction.handleEdit(slidingItem, async () => {
      const amountInGr = Math.round(this.suggestedAmount);
      await this.service.updatePayment(this.collection!.id!, student.studentId, amountInGr);
      await this.load(this.collection!.id!);
    });
  }

  async markUnpaid(student: StudentPaymentStatus, event: Event, slidingItem?: IonItemSliding) {
    event.stopPropagation();
    if (!this.collection) {
      slidingItem?.close();
      return;
    }

    await this.paymentManagement.revertPayment(
      this.collection.id!,
      student.studentId,
      `${student.firstName} ${student.lastName}`,
      student.paidAmount || 0,
      async () => {
        await this.load(this.collection!.id!);
        slidingItem?.close();
      }
    );
  }

  async openPayment(student: StudentPaymentStatus) {
    if (!this.collection) return;

    const modal = await this.modalCtrl.create({
      component: PaymentModalComponent,
      componentProps: {
        studentName: `${student.firstName} ${student.lastName}`,
        suggestedAmount: this.suggestedAmount / 100,
        currentAmount: (student.paidAmount || 0) / 100
      }
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm') {
        const amountInGr = this.formatService.toGrosze(res.data);
        await this.service.updatePayment(this.collection!.id!, student.studentId, amountInGr);
        await this.load(this.collection!.id!);
      }
    });

    await modal.present();
  }

  async payOut() {
    if (!this.collection || this.totalCollected <= 0) return;

    // Calculate how much has already been paid out
    const totalCollectedGr = this.totalCollected; 

    if (totalCollectedGr !== this.collection.targetAmount) {
       this.uiService.showToast(this.translationService.translate('COLLECTIONS.PAY_OUT_EXACT_AMOUNT_WARNING'), 'warning');
       return;
    }

    const totalExpensedGr = this.expenses.reduce((sum, e) => sum + e.amount_gr, 0);
    const availableToPayOutGr = totalCollectedGr - totalExpensedGr;

    if (availableToPayOutGr <= 0) {
      this.uiService.showToast(this.translationService.translate('COLLECTIONS.PAY_OUT_NO_FUNDS'), 'warning');
      return;
    }

    const availableToPayOutPLN = this.formatService.toPLN(availableToPayOutGr);

    let description = '';
    const sortedPayments = [...this.payments]
      .filter(p => p.status === 'PAID' && (p.paidAmount || 0) > 0)
      .sort((a, b) => (a.paidAt || 0) - (b.paidAt || 0));

    const contributingStudents: string[] = [];
    let runningPaymentTotal = 0;
    const startRange = totalExpensedGr;
    const endRange = totalExpensedGr + availableToPayOutGr;

    for (const p of sortedPayments) {
      const pStart = runningPaymentTotal;
      const pEnd = runningPaymentTotal + (p.paidAmount || 0);

      // Check overlap with [startRange, endRange]
      const overlapStart = Math.max(pStart, startRange);
      const overlapEnd = Math.min(pEnd, endRange);

      if (overlapEnd > overlapStart) {
        contributingStudents.push(`${p.firstName} ${p.lastName}`);
      }

      runningPaymentTotal += (p.paidAmount || 0);
    }

    if (contributingStudents.length > 0) {
      description = this.translationService.translate('COLLECTIONS.CONTRIBUTORS_LIST', { list: contributingStudents.join(', ') });
    }

    const confirmed = await this.uiService.showConfirm({
      header: this.translationService.translate('COLLECTIONS.PAY_OUT_CONFIRM_TITLE'),
      message: this.translationService.translate('COLLECTIONS.PAY_OUT_CONFIRM_TEXT', {
        amount: this.formatService.formatMoney(availableToPayOutGr),
        currency: this.currency()
      }),
      confirmText: this.translationService.translate('COMMON.CONFIRM')
    });

    if (confirmed) {
      if (!this.collection) return;

      await this.expenseService.addExpense(
        this.translationService.translate('COLLECTIONS.PAYOUT_EXPENSE_TITLE', { name: this.collection.title }),
        availableToPayOutPLN,
        this.collection.id!,
        [],
        description
      );

      this.uiService.showToast(this.translationService.translate('COLLECTIONS.PAY_OUT_SUCCESS'), 'success');
      // Reload to update expenses list
      await this.load(this.collection.id!);
    }
  }
}
