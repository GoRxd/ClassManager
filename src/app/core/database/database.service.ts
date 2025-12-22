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

      if (platform === 'web') {
        console.log('🌐 Web platform detected, initializing jeep-sqlite...');

        // Ensure the custom element is defined
        await customElements.whenDefined('jeep-sqlite');
        console.log('✅ <jeep-sqlite> defined');

        let jeepSqliteEl = document.querySelector('jeep-sqlite');

        if (!jeepSqliteEl) {
          console.warn('🏗️ <jeep-sqlite> not found in index.html, creating dynamically...');
          jeepSqliteEl = document.createElement('jeep-sqlite');
          document.body.appendChild(jeepSqliteEl);
        }

        if ((jeepSqliteEl as any).componentOnReady) {
          await (jeepSqliteEl as any).componentOnReady();
          console.log('✅ <jeep-sqlite> component ready');
        }

        // Enable autoSave
        jeepSqliteEl.setAttribute('autoSave', 'true');

        await this.sqlite.initWebStore();
        console.log('✅ WebStore initialized');

        // Small delay for the web store internal state to sync
        await new Promise(resolve => setTimeout(resolve, 200));
      }



      this.db = await this.sqlite.createConnection(
        'class_manager_db',
        false,
        'no-encryption',
        1,
        false
      );


      await this.db.open();
      // createConnection can be faster than initWebStore sometimes.
      if (platform === 'web') {
        // Handle "WebStore is not open yet" error
        // Force check and save
        await this.sqlite.saveToStore('class_manager_db');
      }

      await this.db.execute(CREATE_TABLES_SQL);

      // MIGRATION: Ensure 'description' column exists in 'expenses'
      const tableInfo = await this.db.query("PRAGMA table_info(expenses)");
      const hasDescription = tableInfo.values?.some((col: any) => col.name === 'description');

      if (!hasDescription) {
        try {
          await this.db.run('ALTER TABLE expenses ADD COLUMN description TEXT');
        } catch (e) {
          console.log('Column description might already exist, ignoring.');
        }
      }

      // MIGRATION: Ensure 'type' column exists in 'expenses'
      const hasType = tableInfo.values?.some((col: any) => col.name === 'type');
      if (!hasType) {
        try {
          await this.db.run("ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'MANUAL'");
        } catch (e) {
          console.log('Column type might already exist, ignoring.');
        }
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

  async executeBatch(statements: string) {
    if (!this.dbReady()) throw new Error('Database not ready!');
    const result = await this.db.execute(statements);

    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore('class_manager_db');
    }
    return result;
  }
}