import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    license TEXT,
    business TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    status TEXT DEFAULT 'active',
    current_location TEXT,
    current_owner_id INTEGER,
    manufacturer_id INTEGER NOT NULL,
    verified_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manufacturer_id) REFERENCES users(id)
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
    status TEXT DEFAULT 'pending',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (from_id) REFERENCES users(id),
    FOREIGN KEY (to_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create admin user - with type assertion
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get('admin@pharmachain.com') as any;
if (!adminExists) {
  const hashedPassword = hashPassword('Admin@2024');
  db.prepare(`
    INSERT INTO users (name, email, phone, password, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('System Admin', 'admin@pharmachain.com', '+255 888 123 456', hashedPassword, 'admin', 'approved');
  console.log('✅ Admin created');
}

// Export models
export const UserModel = {
  findByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  findById: db.prepare("SELECT * FROM users WHERE id = ?"),
  findAll: db.prepare("SELECT * FROM users ORDER BY created_at DESC"),
  findPending: db.prepare("SELECT * FROM users WHERE status = 'pending'"),
  create: db.prepare("INSERT INTO users (name, email, phone, password, role, status, license, business) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  update: db.prepare("UPDATE users SET status = ? WHERE id = ?"),
  delete: db.prepare("DELETE FROM users WHERE id = ? AND role != 'admin'"),
  verifyPassword: (email: string, password: string) => {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return null;
    return hashPassword(password) === user.password ? user : null;
  }
};

export const MedicineModel = {
  create: db.prepare("INSERT INTO medicines (name, category, description, batch_no, expiry_date, price, quantity, manufacturer_id, current_owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
  findAll: db.prepare("SELECT m.*, u.name as manufacturer_name FROM medicines m LEFT JOIN users u ON m.manufacturer_id = u.id ORDER BY m.created_at DESC"),
  findByBatch: db.prepare("SELECT m.*, u.name as manufacturer_name FROM medicines m LEFT JOIN users u ON m.manufacturer_id = u.id WHERE m.batch_no = ?"),
  findByManufacturer: db.prepare("SELECT * FROM medicines WHERE manufacturer_id = ? ORDER BY created_at DESC"),
  update: db.prepare("UPDATE medicines SET current_location = ?, current_owner_id = ?, status = ? WHERE id = ?"),
  updateQuantity: db.prepare("UPDATE medicines SET quantity = quantity - ? WHERE id = ?")
};

export const TransferModel = {
  create: db.prepare("INSERT INTO transfers (medicine_id, batch_no, from_id, to_id, quantity, status) VALUES (?, ?, ?, ?, ?, ?)"),
  findAll: db.prepare("SELECT t.*, u1.name as from_name, u2.name as to_name, m.name as medicine_name FROM transfers t LEFT JOIN users u1 ON t.from_id = u1.id LEFT JOIN users u2 ON t.to_id = u2.id LEFT JOIN medicines m ON t.medicine_id = m.id ORDER BY t.date DESC")
};

export const ActivityModel = {
  create: db.prepare("INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)"),
  findAll: db.prepare("SELECT a.*, u.name as user_name FROM activity_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT ?")
};