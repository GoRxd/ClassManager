import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonInput, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline, callOutline, personAddOutline, createOutline } from 'ionicons/icons';
import { Student } from '../../data/student.model';
import { FormatService } from '../../../../core/services/format.service';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-student-add-modal',
  standalone: true,
  templateUrl: './student-add-modal.component.html',
  styleUrls: ['./student-add-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonInput, TranslatePipe
  ]
})
export class StudentAddModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private formatService = inject(FormatService);

  @Input() student?: Student;

  newName = '';
  newLastname = '';
  newPhone = '';

  constructor() {
    addIcons({ closeOutline, saveOutline, callOutline, personAddOutline, createOutline });
  }

  ngOnInit() {
    if (this.student) {
      this.newName = this.student.firstName;
      this.newLastname = this.student.lastName;
      this.newPhone = this.student.phone || '';
    }
  }

  get isEditing(): boolean {
    return !!this.student;
  }

  get isPhoneValid(): boolean {
    if (!this.newPhone) return true;
    const cleaned = this.formatService.cleanPhone(this.newPhone);
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

    const data = {
      firstName: this.newName,
      lastName: this.newLastname,
      phone: this.newPhone ? this.formatService.cleanPhone(this.newPhone) : undefined
    };

    if (this.student) {
      this.modalCtrl.dismiss({ ...this.student, ...data }, 'confirm');
    } else {
      this.modalCtrl.dismiss(data, 'confirm');
    }
  }
}
