import { Component, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList,
  IonButton, IonIcon, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonRefresher, IonRefresherContent, ModalController,
  IonFab, IonFabButton, IonItemSliding, IonItemOptions, IonItemOption, IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { walletOutline, addOutline, timeOutline, add, createOutline, trashOutline } from 'ionicons/icons';
import { CollectionService } from '../../data/collection.service';
import { Collection } from '../../data/collection.model';
import { CollectionAddModalComponent } from '../../components/collection-add-modal/collection-add-modal.component';
import { UiService } from '../../../../core/services/ui.service';
import { ItemActionService } from '../../../../core/services/item-action.service';
import { SettingsService } from '../../../../core/settings/settings.service';
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';
import { AppSearchComponent } from '../../../../core/components/app-search/app-search.component';
import { EmptyStateComponent } from '../../../../core/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../../../core/pipes/money.pipe';
import { SearchService } from '../../../../core/services/search.service';

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
    IonFab, IonFabButton, IonItemSliding, IonItemOptions, IonItemOption, IonItem,
    AppHeaderComponent, AppSearchComponent, EmptyStateComponent, MoneyPipe
  ]
})
export class CollectionListPage implements OnDestroy {
  service = inject(CollectionService);
  searchService = inject(SearchService);
  modalCtrl = inject(ModalController);
  uiService = inject(UiService);
  itemAction = inject(ItemActionService);
  settingsService = inject(SettingsService);

  filteredCollections = computed(() => {
    return this.searchService.filter(
      this.service.collections(),
      c => [c.title, c.description]
    );
  });

  constructor() {
    addIcons({ walletOutline, addOutline, timeOutline, add, createOutline, trashOutline });
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
          this.uiService.showToast('Collection added successfully', 'success');
        } catch (error) {
          this.uiService.showToast('Failed to add collection', 'danger');
        }
      }
    });

    await modal.present();
  }

  async edit(col: Collection, slidingItem?: IonItemSliding) {
    await this.itemAction.handleEdit(slidingItem, async () => {
      const modal = await this.modalCtrl.create({
        component: CollectionAddModalComponent,
        componentProps: {
          collection: col
        }
      });

      modal.onWillDismiss().then(async (res) => {
        if (res.role === 'confirm' && res.data) {
          try {
            const d = res.data;
            if (col.id) {
              await this.service.updateDetailed(col.id, d.title, d.description, d.amount, d.deadline);
              this.uiService.showToast('Collection updated successfully', 'success');
            }
          } catch (error) {
            this.uiService.showToast('Failed to update collection', 'danger');
          }
        }
      });

      await modal.present();
    });
  }

  async confirmDelete(id: number | undefined, slidingItem?: IonItemSliding) {
    if (!id) {
      slidingItem?.close();
      return;
    }

    await this.itemAction.handleDelete(
      slidingItem,
      async () => {
        await this.service.remove(id);
      },
      'Confirm Delete',
      'Are you sure you want to delete this collection? This will also delete all associated payments.',
      'Collection deleted'
    );
  }

  ngOnDestroy() {
    this.searchService.clearQuery();
  }
}
