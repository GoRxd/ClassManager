import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../../core/settings/settings.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonInput, IonTextarea, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, addCircleOutline } from 'ionicons/icons';
import { Collection } from '../../data/collection.model';
import { FormatService } from '../../../../core/services/format.service';

import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-collection-add-modal',
  standalone: true,
  templateUrl: './collection-add-modal.component.html',
  styleUrls: ['./collection-add-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonInput, IonTextarea, TranslatePipe
  ]
})
export class CollectionAddModalComponent implements OnInit {
  private translationService = inject(TranslationService);
  private formatService = inject(FormatService);
  private modalCtrl = inject(ModalController);
  currency = this.translationService.currency;

  @Input() collection?: Collection;

  title = '';
  description = '';
  amount: number | null = null;
  deadline: string = ''; // ISO string from ion-datetime

  constructor() {
    addIcons({ closeOutline, saveOutline, addCircleOutline });
  }

  ngOnInit() {
    if (this.collection) {
      this.title = this.collection.title;
      this.description = this.collection.description;
      this.amount = this.formatService.toPLN(this.collection.targetAmount);
      if (this.collection.deadline) {
        this.deadline = new Date(this.collection.deadline * 1000).toISOString();
      }
    }
  }

  get isEditing(): boolean {
    return !!this.collection;
  }

  get canSave(): boolean {
    return !!this.title && this.amount !== null && this.amount > 0;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.canSave) return;

    const data = {
      title: this.title,
      description: this.description,
      amount: this.amount,
      deadline: this.deadline
    };

    if (this.collection) {
      this.modalCtrl.dismiss({ ...this.collection, ...data }, 'confirm');
    } else {
      this.modalCtrl.dismiss(data, 'confirm');
    }
  }
}
