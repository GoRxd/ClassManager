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

      // === WEB CONFIGURATION ===
      if (platform === 'web') {

        const jeepSqlite = document.querySelector('jeep-sqlite');

        if (!jeepSqlite) {

          const jeepEl = document.createElement('jeep-sqlite');
          // IMPORTANT: Enable autoSave to prevent state loss.
          jeepEl.setAttribute('autoSave', 'true');
          document.body.appendChild(jeepEl);


          await customElements.whenDefined('jeep-sqlite');
          console.log('✅ <jeep-sqlite> defined');
        }


        await this.sqlite.initWebStore();
        console.log('✅ WebStore initialized');
      }

      // === CREATE CONNECTION ===
      this.db = await this.sqlite.createConnection(
        'class_manager_db',
        false,
        'no-encryption',
        1,
        false
      );


      await this.db.open();
      // === WEB CHECK: IS STORE OPEN ===
      // createConnection can be faster than initWebStore sometimes.
      if (platform === 'web') {
        // Handle "WebStore is not open yet" error
        // Force check and save
        await this.sqlite.saveToStore('class_manager_db');
      }

      await this.db.execute(CREATE_TABLES_SQL);

      // MIGRATION: Ensure 'description' column exists in 'expenses'
      try {
        await this.db.run('ALTER TABLE expenses ADD COLUMN description TEXT');
      } catch (e) {
        // Ignore error if column likely already exists
      }


      if (platform === 'web') {
        await this.sqlite.saveToStore('class_manager_db');
      }

      console.log('✅ Database ready! (Platform: ' + platform + ')');
      this.dbReady.set(true);

    } catch (e) {
      console.error('❌ Critical database error:', e);
      // If error is "WebStore is not open", try refreshing.
      // Browser might block IndexedDB on first load.
    }
  }

  async query<T>(statement: string, values: any[] = []): Promise<T[]> {
    if (!this.dbReady()) throw new Error('Database not ready!');
    const result = await this.db.query(statement, values);
    return (result.values as T[]) || [];
  }

  async run(statement: string, values: any[] = []) {
    if (!this.dbReady()) throw new Error('Database not ready!');
    const result = await this.db.run(statement, values);

    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore('class_manager_db');
    }
    return result;
  }
}