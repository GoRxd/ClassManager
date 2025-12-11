import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAppInitializer, inject } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { DatabaseService } from './app/core/database/database.service';

import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

jeepSqlite(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),

    provideAppInitializer(() => {
        const dbService = inject(DatabaseService);
        return dbService.initializeDatabase();
    }),
  ],
});