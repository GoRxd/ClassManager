import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonSelect, IonSelectOption,
  IonItemDivider
} from '@ionic/angular/standalone';
import { UiService } from '../../../../core/services/ui.service';
import { BackupService } from '../../../../core/services/backup.service';
import { SettingsService } from '../../../../core/settings/settings.service';

import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

import { addIcons } from 'ionicons';
import { moonOutline, cashOutline, globeOutline, informationCircleOutline, cloudDownloadOutline, cloudUploadOutline } from 'ionicons/icons';
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    AppHeaderComponent,
    TranslatePipe,
    IonContent, IonList, IonItem, IonLabel, IonIcon, IonSelect, IonSelectOption,
    IonItemDivider
  ]
})
export class SettingsPage {
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);

  constructor() {
    addIcons({ moonOutline, cashOutline, globeOutline, informationCircleOutline, cloudDownloadOutline, cloudUploadOutline });
  }

  // Expose signals for template
  theme = this.settingsService.theme;
  currency = this.settingsService.currency;
  language = this.translationService.currentLang;

  availableCurrencies = ['PLN', 'USD', 'EUR', 'GBP'];

  private backupService = inject(BackupService);
  private uiService = inject(UiService);

  async backup() {
    try {
      await this.backupService.createBackupFile();
      // On Web, the download handles the success, on Mobile, the Share dialog does.
      // We can still show a toast.
      this.uiService.showToast(this.translationService.translate('SETTINGS.BACKUP_SUCCESS'), 'success');
    } catch (e) {
      this.uiService.showToast(this.translationService.translate('SETTINGS.BACKUP_ERROR'), 'danger');
    }
  }

  triggerRestore() {
    document.getElementById('file-upload')?.click();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const json = e.target.result;
      try {
        await this.backupService.restoreData(json);
        this.uiService.showToast(this.translationService.translate('SETTINGS.RESTORE_SUCCESS'), 'success');
        // Ideally we should reload data in services, but a restart is safer for now or we trigger a global reload.
        // For now, let's just show success. 
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        console.error(err);
        this.uiService.showToast(this.translationService.translate('SETTINGS.RESTORE_ERROR'), 'danger');
      }
    };
    reader.readAsText(file);
  }

  updateTheme(ev: any) {
    this.settingsService.setTheme(ev.detail.value);
  }

  changeCurrency(ev: any) {
    this.settingsService.setCurrency(ev.detail.value);
  }

  changeLanguage(ev: any) {
    this.translationService.setLanguage(ev.detail.value);
  }
}

