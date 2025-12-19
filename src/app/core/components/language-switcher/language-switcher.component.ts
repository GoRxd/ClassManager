import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { languageOutline } from 'ionicons/icons';
import { TranslationService } from '../../services/translation.service';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [CommonModule, IonButton, IonIcon],
    template: `
    <ion-button fill="clear" (click)="toggleLanguage()" color="light">
      <ion-icon slot="start" name="language-outline"></ion-icon>
      {{ translationService.currentLang() === 'pl' ? 'PL' : 'EN' }}
    </ion-button>
  `,
    styles: [`
    ion-button {
      --padding-start: 8px;
      --padding-end: 8px;
    }
  `]
})
export class LanguageSwitcherComponent {
    public translationService = inject(TranslationService);

    constructor() {
        addIcons({ languageOutline });
    }

    toggleLanguage() {
        const nextLang = this.translationService.currentLang() === 'pl' ? 'en' : 'pl';
        this.translationService.setLanguage(nextLang);
    }
}
