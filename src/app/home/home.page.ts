import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, 
  IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, 
  IonIcon, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, arrowDownOutline, walletOutline, timeOutline } from 'ionicons/icons';
import { StudentService } from '../features/students/data/student.service';
import { CollectionService } from '../features/collections/data/collection.service';
import { FinanceService } from '../features/finance/data/finance.service';
import { TreasuryStatus } from '../features/finance/data/treasury.repository';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, 
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonNote, 
    IonIcon, IonRefresher, IonRefresherContent
  ],
})
export class HomePage {
  private studentService = inject(StudentService);
  private collectionService = inject(CollectionService);
  public financeService = inject(FinanceService); // Public to access signals directly if needed
  
  // Local signals/computed could be used, or just bind directly to service signals
  public activeStudents: WritableSignal<number> = signal(0);
  public activeCollections: WritableSignal<number> = signal(0);
  
  // Finance service manages its own signals, we can alias them or use them directly in template
  // For template simplicity, let's keep local aliases or simple accessors
  get treasury() { return this.financeService.treasury; }
  get recentExpenses() { return this.financeService.recentExpenses; }

  constructor() {
    addIcons({ arrowUpOutline, arrowDownOutline, walletOutline, timeOutline });
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData(event?: any) {
    try {
      // 1. Load Services Data
      await this.financeService.loadDashboardData();
      
      const studentsCount = await this.studentService.getActiveCount();
      this.activeStudents.set(studentsCount);

      const collectionsCount = await this.collectionService.getActiveCount();
      this.activeCollections.set(collectionsCount);

    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      if (event) event.target.complete();
    }
  }

  handleRefresh(event: any) {
    this.loadData(event);
  }
}
