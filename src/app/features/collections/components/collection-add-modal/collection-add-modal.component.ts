import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonInput, IonTextarea, ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-collection-add-modal',
  standalone: true,
  templateUrl: './collection-add-modal.component.html',
  styleUrls: ['./collection-add-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
    IonIcon, IonInput, IonTextarea
  ]
})
export class CollectionAddModalComponent {
  title = '';
  description = '';
  amount: number | null = null;
  deadline: string = ''; // ISO string from ion-datetime

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeOutline, saveOutline });
  }

  get canSave(): boolean {
    return !!this.title && this.amount !== null && this.amount > 0;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.canSave) return;

    this.modalCtrl.dismiss({
      title: this.title,
      description: this.description,
      amount: this.amount,
      deadline: this.deadline
    }, 'confirm');
  }
}
