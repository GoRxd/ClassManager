import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, ModalController } from '@ionic/angular/standalone';
import { DatabaseService } from './core/database/database.service';
import { SettingsService } from './core/settings/settings.service';
import { OnboardingModalComponent } from './features/onboarding/onboarding-modal/onboarding-modal.component';
import { addIcons } from 'ionicons';
import { homeOutline, peopleOutline, walletOutline, statsChartOutline, settingsOutline, receiptOutline } from 'ionicons/icons';
import { StatusBar } from '@capacitor/status-bar';
import { TranslatePipe } from './core/pipes/translate.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private dbService = inject(DatabaseService);
  private settingsService = inject(SettingsService);
  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ homeOutline, peopleOutline, walletOutline, statsChartOutline, settingsOutline, receiptOutline });

    if (Capacitor.getPlatform() !== 'web') {
      StatusBar.show();
    }
    
    // HACK DO DEBUGOWANIA: (USUNAC W WERSJI FINALNEJ)
    // Przypisujemy serwis do obiektu window, żeby był dostępny w konsoli F12
    (window as any).db = this.dbService;
  }

  async ngOnInit() {
    await this.checkOnboarding();
  }

  async checkOnboarding() {
    const hasSeen = await this.settingsService.checkOnboardingStatus();
    if (!hasSeen) {
      const modal = await this.modalCtrl.create({
        component: OnboardingModalComponent,
        componentProps: { isFirstLaunch: true },
        backdropDismiss: false // Force user to interact
      });
      await modal.present();
    }
  }
}