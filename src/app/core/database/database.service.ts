import { Injectable, signal, WritableSignal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { CREATE_TABLES_SQL } from './sql/schema';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  public dbReady: WritableSignal<boolean> = signal(false);

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase() {
    try {
      const platform = Capacitor.getPlatform();

      // === KONFIGURACJA WEB (PRZEGLĄDARKA) ===
      if (platform === 'web') {
        // 1. Sprawdź czy element już istnieje (żeby nie dodawać go 2 razy)
        const jeepSqlite = document.querySelector('jeep-sqlite');
        
        if (!jeepSqlite) {
            // 2. Stwórz element dynamicznie
            const jeepEl = document.createElement('jeep-sqlite');
            // WAŻNE: Włączamy autoSave - to zapobiega błędom utraty stanu
            jeepEl.setAttribute('autoSave', 'true'); 
            document.body.appendChild(jeepEl);
            
            // 3. Czekamy na definicję komponentu
            await customElements.whenDefined('jeep-sqlite');
            console.log('✅ Element <jeep-sqlite> zdefiniowany');
        }

        // 4. Inicjalizujemy WebStore
        await this.sqlite.initWebStore();
        console.log('✅ WebStore initialized');
      }

      // === TWORZENIE POŁĄCZENIA (WSPÓLNE) ===
      this.db = await this.sqlite.createConnection(
        'class_manager_db',
        false,
        'no-encryption',
        1,
        false
      );

      // Otwarcie i SQL
      await this.db.open();
      // === WAŻNE DLA WEBA: SPRAWDZENIE CZY STORE JEST OTWARTY ===
      // Czasami createConnection jest szybsze niż initWebStore
      if (platform === 'web') {
          // Tu często był błąd "WebStore is not open yet"
          // Wymuszamy sprawdzenie i ewentualnie zapis
          await this.sqlite.saveToStore('class_manager_db');
      }

      await this.db.execute(CREATE_TABLES_SQL);
      
      // Zapis końcowy dla weba
      if (platform === 'web') {
        await this.sqlite.saveToStore('class_manager_db');
      }

      console.log('✅ Baza danych gotowa! (Platforma: ' + platform + ')');
      this.dbReady.set(true);

    } catch (e) {
      console.error('❌ Krytyczny błąd bazy danych:', e);
      // Jeśli błąd dotyczy "WebStore is not open", spróbuj odświeżyć stronę,
      // bo czasem przeglądarka blokuje IndexedDB przy pierwszym loadzie.
    }
  }

  async query<T>(statement: string, values: any[] = []): Promise<T[]> {
    if (!this.dbReady()) throw new Error('Baza nie jest gotowa!');
    const result = await this.db.query(statement, values);
    return (result.values as T[]) || [];
  }

  async run(statement: string, values: any[] = []) {
    if (!this.dbReady()) throw new Error('Baza nie jest gotowa!');
    const result = await this.db.run(statement, values);
    
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore('class_manager_db');
    }
    return result;
  }
}