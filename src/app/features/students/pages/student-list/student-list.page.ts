import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonLabel, IonButton, IonIcon, IonButtons, IonGrid, IonRow, IonCol, 
  ToastController, IonMenuButton, AlertController, IonItemSliding, 
  IonItemOptions, IonItemOption, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, personAddOutline, callOutline, peopleOutline, createOutline, add } from 'ionicons/icons';
import { StudentEditModalComponent } from '../../components/student-edit-modal/student-edit-modal.component';
import { StudentAddModalComponent } from '../../components/student-add-modal/student-add-modal.component';
import { Student } from '../../data/student.model';
import { StudentService } from '../../data/student.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  templateUrl: './student-list.page.html', // Odwołanie do pliku HTML
  styleUrls: ['./student-list.page.scss'],  // Odwołanie do pliku SCSS
  imports: [
    CommonModule, FormsModule, 
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
    IonLabel, IonButton, IonIcon, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonItemSliding, IonItemOptions, IonItemOption,
    IonFab, IonFabButton
  ]
})
export class StudentListPage {
  service = inject(StudentService);
  toastCtrl = inject(ToastController);
  alertCtrl = inject(AlertController);
  modalCtrl = inject(ModalController);
  
  constructor() {
    // Rejestracja ikon
    addIcons({ trashOutline, personAddOutline, callOutline, peopleOutline, createOutline, add });
  }

  async confirmDelete(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this student?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
             this.delete(id);
          }
        }
      ]
    });

    await alert.present();
  }
  
  async delete(id: number) {
      await this.service.remove(id);
      this.showToast('Uczeń usunięty', 'medium');
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: StudentAddModalComponent
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        await this.service.add(res.data.firstName, res.data.lastName, res.data.phone);
        this.showToast('Uczeń dodany pomyślnie!', 'success');
      }
    });

    await modal.present();
  }

  async edit(student: Student) {
    const modal = await this.modalCtrl.create({
      component: StudentEditModalComponent,
      componentProps: {
        student: student
      }
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        await this.service.update(res.data as Student);
        this.showToast('Dane ucznia zaktualizowane', 'success');
      }
    });

    await modal.present();
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  private async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}