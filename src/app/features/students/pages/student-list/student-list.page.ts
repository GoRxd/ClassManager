import { Component, inject, computed, OnDestroy } from '@angular/core';
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
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';
import { AppSearchComponent } from '../../../../core/components/app-search/app-search.component';
import { EmptyStateComponent } from '../../../../core/components/empty-state/empty-state.component';
import { SearchService } from '../../../../core/services/search.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../core/services/translation.service';

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
    IonFab, IonFabButton,
    AppHeaderComponent,
    AppSearchComponent,
    EmptyStateComponent,
    TranslatePipe
  ]
})
export class StudentListPage implements OnDestroy {
  service = inject(StudentService);
  searchService = inject(SearchService);
  uiService = inject(UiService);
  formatService = inject(FormatService);
  modalCtrl = inject(ModalController);
  router = inject(Router);
  itemAction = inject(ItemActionService);
  translationService = inject(TranslationService);

  filteredStudents = computed(() => {
    return this.searchService.filter(
      this.service.students(),
      s => [s.firstName, s.lastName, s.phone]
    );
  });

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
      this.translationService.translate('COMMON.DELETE_CONFIRM_TITLE'),
      this.translationService.translate('STUDENTS.DELETE_CONFIRM_MSG'),
      this.translationService.translate('COMMON.ITEM_DELETED')
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
          this.uiService.showToast(this.translationService.translate('COMMON.ITEM_ADDED'), 'success');
        } catch (error) {
          this.uiService.showToast(this.translationService.translate('COMMON.ERROR_ADD'), 'danger');
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
            this.uiService.showToast(this.translationService.translate('COMMON.ITEM_UPDATED'), 'success');
          } catch (error) {
            this.uiService.showToast(this.translationService.translate('COMMON.ERROR_UPDATE'), 'danger');
          }
        }
      });

      await modal.present();
    });
  }

  formatPhone(phone: string): string {
    return this.formatService.formatPhone(phone);
  }

  ngOnDestroy() {
    this.searchService.clearQuery();
  }
}