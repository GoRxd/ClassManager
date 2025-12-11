import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './core/database/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private dbService = inject(DatabaseService);

  constructor() {
    // HACK DO DEBUGOWANIA: (USUNAC W WERSJI FINALNEJ)
    // Przypisujemy serwis do obiektu window, żeby był dostępny w konsoli F12
    (window as any).db = this.dbService;
  }
}