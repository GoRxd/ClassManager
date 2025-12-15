import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonBadge, IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkCircle, checkmarkCircleOutline, walletOutline, timeOutline, alertCircleOutline } from 'ionicons/icons';
import { StudentService } from '../../data/student.service';
import { CollectionService } from '../../../collections/data/collection.service';
import { Student } from '../../data/student.model';
import { UiService } from '../../../../core/services/ui.service';
import { FormatService } from '../../../../core/services/format.service';
import { StudentCollectionSummary } from '../../../collections/data/collection.repository';

@Component({
  selector: 'app-student-info',
  standalone: true,
  imports: [
    CommonModule, 
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, 
    IonList, IonItem, IonLabel, IonNote, IonIcon, IonButton, IonBadge, IonSkeletonText
  ],
  templateUrl: './student-info.page.html',
  styleUrls: ['./student-info.page.scss']
})
export class StudentInfoPage implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private collectionService = inject(CollectionService);
  private uiService = inject(UiService);
  public formatService = inject(FormatService);

  student = signal<Student | undefined>(undefined);
  collections = signal<StudentCollectionSummary[]>([]);
  totalDebt = signal<number>(0);
  unpaidCount = signal<number>(0);
  loading = signal<boolean>(true);

  constructor() {
    addIcons({ arrowBackOutline, checkmarkCircleOutline, walletOutline, timeOutline, alertCircleOutline, checkmarkCircle });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadData(+id);
    }
  }

  activeStudentCount = signal<number>(0);

  async loadData(id: number) {
    this.loading.set(true);
    try {
      const s = await this.studentService.getById(id);
      this.student.set(s);

      // Fetch active student count for calculation
      const count = await this.studentService.getActiveCount();
      this.activeStudentCount.set(count);

      if (s && s.id) {
        const cols = await this.collectionService.getStudentCollections(s.id);
        this.collections.set(cols);
        this.calculateDebt(cols, count);
      }
    } finally {
      this.loading.set(false);
    }
  }

  calculateDebt(cols: StudentCollectionSummary[], studentCount: number) {
     if (studentCount === 0) {
        this.totalDebt.set(0);
        this.unpaidCount.set(0);
        return;
     }

     let debt = 0;
     let unpaid = 0;
     
     for (const c of cols) {
        const perStudentCost = Math.round(c.targetAmount / studentCount);
        // Store the calculated cost on the object for easy access in template/logic
        c.perStudentCost = perStudentCost;

        if (c.status !== 'PAID') {
            debt += (perStudentCost - c.paidAmount);
            unpaid++;
        }
     }
     this.totalDebt.set(debt);
     this.unpaidCount.set(unpaid);
  }

  async handleCollectionClick(collection: StudentCollectionSummary) {
     if (collection.status === 'PAID') {
         await this.markAsUnpaid(collection);
     } else {
         await this.markAsPaid(collection);
     }
  }

  async markAsPaid(collection: StudentCollectionSummary) {
     const s = this.student();
     if (!s || !s.id) return;
     
     // Use the calculated per-student cost
     const amountToPay = collection.perStudentCost || collection.targetAmount;

     await this.collectionService.updatePayment(collection.collectionId, s.id, amountToPay);
     this.uiService.showToast(`Payment marked for: ${collection.title}`, 'success');
     await this.loadData(s.id);
  }

  async markAsUnpaid(collection: StudentCollectionSummary) {
      const s = this.student();
      if (!s || !s.id) return;

      const confirmed = await this.uiService.showConfirm(
          'Undo Payment',
          `Are you sure you want to mark "${collection.title}" as unpaid?`,
          'Undo Payment'
      );

      if (confirmed) {
          await this.collectionService.updatePayment(collection.collectionId, s.id, 0);
          this.uiService.showToast(`Payment undone for: ${collection.title}`, 'medium');
          await this.loadData(s.id);
      }
  }
}
