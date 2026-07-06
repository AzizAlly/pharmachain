const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '..', 'database', 'pharmachain.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

console.log('Creating tables...');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manufacturer', 'wholesaler', 'distributor', 'pharmacy', 'patient')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
    license TEXT,
    business TEXT,
    security_question TEXT,
    security_answer TEXT,
    warehouse TEXT,
    storage_capacity TEXT,
    region TEXT,
    fleet_size TEXT,
    wallet_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    batch_no TEXT UNIQUE NOT NULL,
    expiry_date DATETIME NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT CHECK(status IN ('active', 'transferred', 'expired', 'recalled', 'sold')) DEFAULT 'active',
    current_location TEXT,
    current_owner_id INTEGER,
    manufacturer_id INTEGER NOT NULL,
    tx_hash TEXT,
    block_number INTEGER,
    contract_address TEXT,
    verified_count INTEGER DEFAULT 0,
    last_verified DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (manufacturer_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    batch_no TEXT NOT NULL,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_transit', 'completed', 'cancelled')) DEFAULT 'pending',
    tx_hash TEXT,
    block_number INTEGER,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_id INTEGER NOT NULL,
    batch_no TEXT NOT NULL,
    verified_by INTEGER NOT NULL,
    result INTEGER NOT NULL,
    location TEXT,
    ip_address TEXT,
    tx_hash TEXT,
    block_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    tx_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS blockchain_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number INTEGER UNIQUE NOT NULL,
    tx_hash TEXT NOT NULL,
    event_type TEXT NOT NULL,
    data TEXT NOT NULL,
    processed INTEGER DEFAULT 0,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_medicines_batch ON medicines(batch_no);
  CREATE INDEX IF NOT EXISTS idx_medicines_owner ON medicines(current_owner_id);
  CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer ON medicines(manufacturer_id);
  CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_id);
  CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_id);
  CREATE INDEX IF NOT EXISTS idx_verifications_medicine ON verifications(medicine_id);
  CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_blockchain_sync_processed ON blockchain_sync(processed);
`);

// Insert default admin
const adminCheck = db.prepare(`SELECT * FROM users WHERE email = 'admin@pharmachain.com'`).get();
if (!adminCheck) {
  db.exec(`
    INSERT INTO users (name, email, password, role, status) 
    VALUES ('System Admin', 'admin@pharmachain.com', 'Admin@2024', 'admin', 'approved')
  `);
  console.log('Default admin created');
}

console.log('✅ Database initialized successfully!');

// List all tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`).all();

console.log('📊 Tables created:', tables.map(t => t.name).join(', '));

db.close();
console.log('✅ Database setup complete!');