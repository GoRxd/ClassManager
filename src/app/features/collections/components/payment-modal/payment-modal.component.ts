import { Component, Input, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../../core/settings/settings.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonInput, IonNote, IonChip, IonLabel, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss'],
  imports: [
    DecimalPipe, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonInput, IonNote, IonChip, IonLabel, TranslatePipe
  ]
})
export class PaymentModalComponent implements OnInit {
  @Input() studentName: string = '';
  @Input() suggestedAmount: number = 0;
  @Input() currentAmount: number = 0;

  private translationService = inject(TranslationService);
  private modalCtrl = inject(ModalController);
  currency = this.translationService.currency;

  amount: number = 0;

  constructor() {
    addIcons({ closeOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    // Both currentAmount and suggestedAmount are now passed in PLN
    this.amount = this.currentAmount > 0 ? this.currentAmount : this.suggestedAmount;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.amount < 0) return;
    this.modalCtrl.dismiss(this.amount, 'confirm');
  }
}
