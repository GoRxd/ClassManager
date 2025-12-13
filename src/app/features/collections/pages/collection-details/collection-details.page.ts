import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonList, IonListHeader, IonLabel, IonItem, IonNote, IonBadge, ModalController, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { arrowBackOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { CollectionService } from '../../data/collection.service';
import { Collection } from '../../data/collection.model';
import { StudentPaymentStatus } from '../../data/payment-status.model';
import { PaymentModalComponent } from '../../components/payment-modal/payment-modal.component';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-collection-details',
  standalone: true,
  templateUrl: './collection-details.page.html',
  styleUrls: ['./collection-details.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonList, IonListHeader, IonLabel, IonItem, IonNote, IonBadge, IonButton, IonIcon, IonSegment, IonSegmentButton,
    IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class CollectionDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CollectionService);
  private modalCtrl = inject(ModalController);

  collection: Collection | undefined;
  payments: StudentPaymentStatus[] = [];
  suggestedAmount: number = 0;
  segment: 'pending' | 'paid' = 'pending';

  constructor() {
    addIcons({ arrowBackOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  get pendingStudents() {
    return this.payments.filter(p => p.status !== 'PAID');
  }

  get paidStudents() {
    return this.payments.filter(p => p.status === 'PAID');
  }

  async ngOnInit() {
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

        // Calculate suggested amount: Target / Students Count
        if (this.payments.length > 0 && this.collection.targetAmount > 0) {
            this.suggestedAmount = (this.collection.targetAmount / 100) / this.payments.length;
        }
    }
  }

  async quickPay(student: StudentPaymentStatus, event: Event) {
    event.stopPropagation();
    if (!this.collection || this.suggestedAmount <= 0) return;

    const amountInGr = Math.round(this.suggestedAmount * 100);
    await this.service.updatePayment(this.collection.id!, student.studentId, amountInGr);
    await this.load(this.collection.id!);
  }

  async markUnpaid(student: StudentPaymentStatus, event: Event) {
    event.stopPropagation();
    if (!this.collection) return;

    // Set amount to 0, which backend treats as resetting to PENDING
    await this.service.updatePayment(this.collection.id!, student.studentId, 0);
    await this.load(this.collection.id!);
  }

  async openPayment(student: StudentPaymentStatus) {
    if (!this.collection) return;

    const modal = await this.modalCtrl.create({
        component: PaymentModalComponent,
        componentProps: {
            studentName: `${student.firstName} ${student.lastName}`,
            suggestedAmount: this.suggestedAmount,
            currentAmount: student.paidAmount
        }
    });

    modal.onWillDismiss().then(async (res) => {
        if (res.role === 'confirm') {
            const amountInGr = Math.round(res.data * 100);
            await this.service.updatePayment(this.collection!.id!, student.studentId, amountInGr);
            await this.load(this.collection!.id!);
        }
    });

    await modal.present();
  }
}
