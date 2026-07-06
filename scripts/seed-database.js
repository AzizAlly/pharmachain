const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

// SHA-256 hash function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function seedDatabase() {
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database not found at:', dbPath);
      console.log('Please run: npm run setup-blockchain first');
      process.exit(1);
    }

    const db = new Database(dbPath);

    // Check if users already exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count > 0) {
      console.log('ℹ️ Users already exist, skipping seed');
      db.close();
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    // Insert sample users with hashed passwords
    const users = [
      ['System Admin', 'admin@pharmachain.com', hashPassword('admin123'), 'admin', 'approved'],
      ['Test Manufacturer', 'manufacturer@pharmachain.com', hashPassword('password123'), 'manufacturer', 'approved'],
      ['Test Wholesaler', 'wholesale@pharmachain.com', hashPassword('password123'), 'wholesaler', 'approved'],
      ['Test Distributor', 'distributor@pharmachain.com', hashPassword('password123'), 'distributor', 'approved'],
      ['Test Pharmacy', 'pharmacy@pharmachain.com', hashPassword('password123'), 'pharmacy', 'approved'],
      ['Test Patient', 'patient@pharmachain.com', hashPassword('password123'), 'patient', 'approved'],
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const user of users) {
      try {
        insertUser.run(...user);
        console.log(`✅ Created user: ${user[0]} (${user[1]})`);
      } catch (error) {
        console.log(`ℹ️ User ${user[0]} already exists`);
      }
    }

    db.close();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();