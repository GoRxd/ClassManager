import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonInput, IonNote, IonChip, IonLabel, ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
    IonIcon, IonInput, IonNote, IonChip, IonLabel
  ]
})
export class PaymentModalComponent implements OnInit {
  @Input() studentName: string = '';
  @Input() suggestedAmount: number = 0;
  @Input() currentAmount: number = 0;

  amount: number = 0;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    // If already paid something, show that. If not, default to suggested.
    // If suggested is 0 (uncalculated or error), assume 0.
    this.amount = this.currentAmount > 0 ? (this.currentAmount / 100) : this.suggestedAmount;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.amount < 0) return;
    this.modalCtrl.dismiss(this.amount, 'confirm');
  }
}
