import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
  IonIcon, IonInput, ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, callOutline, personAddOutline } from 'ionicons/icons';

@Component({
  selector: 'app-student-add-modal',
  standalone: true,
  templateUrl: './student-add-modal.component.html',
  styleUrls: ['./student-add-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, 
    IonIcon, IonInput
  ]
})
export class StudentAddModalComponent {
  private modalCtrl = inject(ModalController);

  newName = '';
  newLastname = '';
  newPhone = '';

  constructor() {
    addIcons({ closeOutline, saveOutline, callOutline, personAddOutline });
  }

  get isPhoneValid(): boolean {
    if (!this.newPhone) return true;
    const cleaned = this.newPhone.replace(/[\s-]/g, '');
    return /^\d{9}$/.test(cleaned);
  }

  get canSave(): boolean {
    return !!this.newName && !!this.newLastname && this.isPhoneValid;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (!this.canSave) return;

    this.modalCtrl.dismiss({
      firstName: this.newName,
      lastName: this.newLastname,
      phone: this.newPhone ? this.newPhone.replace(/[\s-]/g, '') : undefined
    }, 'confirm');
  }
}
