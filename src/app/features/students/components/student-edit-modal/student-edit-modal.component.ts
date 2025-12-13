import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
  IonInput, IonButtons, IonButton, IonIcon, ModalController 
} from '@ionic/angular/standalone';
import { closeOutline, saveOutline, callOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Student } from '../../data/student.model';

@Component({
  selector: 'app-student-edit-modal',
  standalone: true,
  templateUrl: './student-edit-modal.component.html',
  styleUrls: ['./student-edit-modal.component.scss'],
  imports: [
    CommonModule, FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, 
    IonInput, IonButtons, IonButton, IonIcon
  ]
})
export class StudentEditModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() student!: Student;

  localStudent: Partial<Student> = {};

  constructor() {
    addIcons({ closeOutline, saveOutline, callOutline });
  }

  ngOnInit() {
    // Create a shallow copy to edit without affecting the list underneath immediately
    this.localStudent = { ...this.student };
  }

  get isValid(): boolean {
    return !!this.localStudent.firstName && !!this.localStudent.lastName;
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(this.localStudent, 'confirm');
  }
}
