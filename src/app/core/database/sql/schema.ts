export const CREATE_TABLES_SQL = `
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        target_amount_gr INTEGER NOT NULL,
        deadline_at INTEGER,
        is_archived INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING',
        paid_amount_gr INTEGER DEFAULT 0,
        paid_at INTEGER,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(collection_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        amount_gr INTEGER NOT NULL,
        collection_id INTEGER,
        type TEXT DEFAULT 'MANUAL',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expense_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price_gr INTEGER DEFAULT 0,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    );

    DROP VIEW IF EXISTS v_treasury_status;
    CREATE VIEW v_treasury_status AS
    SELECT 
        IFNULL((
            SELECT SUM(p.paid_amount_gr) 
            FROM payments p
            JOIN students s ON p.student_id = s.id 
            WHERE s.is_active = 1
        ), 0) as total_income,
        IFNULL((SELECT SUM(amount_gr) FROM expenses), 0) as total_expenses,
        (
            IFNULL((
                SELECT SUM(p.paid_amount_gr) 
                FROM payments p
                JOIN students s ON p.student_id = s.id 
                WHERE s.is_active = 1
            ), 0) - 
            IFNULL((SELECT SUM(amount_gr) FROM expenses), 0)
        ) as current_balance;

    CREATE INDEX IF NOT EXISTS idx_payments_collection ON payments(collection_id);
    CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_collection ON expenses(collection_id);
    CREATE INDEX IF NOT EXISTS idx_expense_products_expense ON expense_products(expense_id);
`;