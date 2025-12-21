import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle } from '@ionic/angular/standalone';
import { DatabaseService } from './core/database/database.service';
import { SettingsService } from './core/settings/settings.service';
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
export class AppComponent {
  private dbService = inject(DatabaseService);
  private settingsService = inject(SettingsService);

  constructor() {
    addIcons({ homeOutline, peopleOutline, walletOutline, statsChartOutline, settingsOutline, receiptOutline });

    StatusBar.show();
    
    // HACK DO DEBUGOWANIA: (USUNAC W WERSJI FINALNEJ)
    // Przypisujemy serwis do obiektu window, żeby był dostępny w konsoli F12
    (window as any).db = this.dbService;
  }
}