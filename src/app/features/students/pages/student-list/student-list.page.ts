import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonLabel, IonButton, IonIcon, IonButtons, IonGrid, IonRow, IonCol, 
  IonMenuButton, IonItemSliding, 
  IonItemOptions, IonItemOption, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, personAddOutline, callOutline, peopleOutline, createOutline, add } from 'ionicons/icons';

import { StudentAddModalComponent } from '../../components/student-add-modal/student-add-modal.component';
import { Student } from '../../data/student.model';
import { StudentService } from '../../data/student.service';
import { UiService } from '../../../../core/services/ui.service';
import { FormatService } from '../../../../core/services/format.service';
import { ItemActionService } from '../../../../core/services/item-action.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  templateUrl: './student-list.page.html',
  styleUrls: ['./student-list.page.scss'],
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
  uiService = inject(UiService);
  formatService = inject(FormatService);
  modalCtrl = inject(ModalController);
  router = inject(Router);
  itemAction = inject(ItemActionService);
  
  constructor() {
    addIcons({ trashOutline, personAddOutline, callOutline, peopleOutline, createOutline, add });
  }

  viewStudent(id: number) {
    this.router.navigate(['/students', id]);
  }

  async confirmDelete(id: number, slidingItem?: IonItemSliding) {
    await this.itemAction.handleDelete(
        slidingItem,
        async () => {
             await this.service.remove(id);
        },
        'Confirm Delete',
        'Are you sure you want to delete this student?',
        'Student deleted'
    );
  }
  
  // delete method is no longer needed but if I remove it, ensure no one else calls it. 
  // It seems only confirmDelete called it.
  
  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: StudentAddModalComponent
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        try {
            await this.service.add(res.data.firstName, res.data.lastName, res.data.phone);
            this.uiService.showToast('Student added successfully!', 'success');
        } catch (error) {
            this.uiService.showToast('Failed to add student', 'danger');
        }
      }
    });

    await modal.present();
  }

  async edit(student: Student, slidingItem?: IonItemSliding) {
    await this.itemAction.handleEdit(slidingItem, async () => {
        const modal = await this.modalCtrl.create({
            component: StudentAddModalComponent,
            componentProps: {
              student: student
            }
        });
      
        modal.onWillDismiss().then(async (res) => {
            if (res.role === 'confirm' && res.data) {
              try {
                  await this.service.update(res.data as Student);
                  this.uiService.showToast('Student updated successfully', 'success');
              } catch (error) {
                  this.uiService.showToast('Failed to update student', 'danger');
              }
            }
        });
      
        await modal.present();
    });
  }

  formatPhone(phone: string): string {
    return this.formatService.formatPhone(phone);
  }
}