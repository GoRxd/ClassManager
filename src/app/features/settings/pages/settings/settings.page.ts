import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SettingsService } from '../../../../core/settings/settings.service';

import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

import { addIcons } from 'ionicons';
import { moonOutline, cashOutline, globeOutline, informationCircleOutline } from 'ionicons/icons';
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AppHeaderComponent, TranslatePipe]
})
export class SettingsPage {
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);

  constructor() {
    addIcons({ moonOutline, cashOutline, globeOutline, informationCircleOutline });
  }

  // Expose signals for template
  theme = this.settingsService.theme;
  currency = this.settingsService.currency;
  language = this.translationService.currentLang;

  availableCurrencies = ['PLN', 'USD', 'EUR', 'GBP'];

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
