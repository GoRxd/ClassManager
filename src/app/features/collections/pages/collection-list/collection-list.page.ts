import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, 
  IonButton, IonIcon, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonRefresher, IonRefresherContent, ModalController,
  IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { walletOutline, addOutline, timeOutline, add } from 'ionicons/icons';
import { CollectionService } from '../../data/collection.service';
import { Collection } from '../../data/collection.model';
import { CollectionAddModalComponent } from '../../components/collection-add-modal/collection-add-modal.component';

@Component({
  selector: 'app-collection-list',
  standalone: true,
  templateUrl: './collection-list.page.html',
  styleUrls: ['./collection-list.page.scss'],
  imports: [
    CommonModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, 
    IonButton, IonIcon, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonRefresher, IonRefresherContent,
    IonFab, IonFabButton
  ]
})
export class CollectionListPage {
  service = inject(CollectionService);
  modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ walletOutline, addOutline, timeOutline, add });
  }

  isOverdue(col: Collection): boolean {
    if (!col.deadline) return false;
    // Check if deadline is in the past (deadline is unix timestamp in seconds)
    return (col.deadline * 1000) < Date.now();
  }

  refresh(event: any) {
    this.service.loadCollections().then(() => event.target.complete());
  }

  async presentAddModal() {
    const modal = await this.modalCtrl.create({
      component: CollectionAddModalComponent
    });

    modal.onWillDismiss().then(async (res) => {
      if (res.role === 'confirm' && res.data) {
        try {
            const d = res.data;
            await this.service.addDetailed(d.title, d.description, d.amount, d.deadline);
        } catch (error) {
            // Error handling usually in service or global, but here we can toggle loading or show toast if we had uiService injected
            console.error('Failed to add collection', error);
        }
      }
    });

    await modal.present();
  }
}
