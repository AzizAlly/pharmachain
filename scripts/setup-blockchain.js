const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

function setupBlockchain() {
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database not found at:', dbPath);
      console.log('Creating database directory...');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      console.log('✅ Database directory created');
    }

    const db = new Database(dbPath);

    // Create blockchain table - using block_index instead of index (reserved keyword)
    db.exec(`
      CREATE TABLE IF NOT EXISTS blockchain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_index INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        transactions TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        hash TEXT NOT NULL,
        nonce INTEGER NOT NULL,
        difficulty INTEGER DEFAULT 4
      )
    `);

    // Create pending transactions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS pending_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if genesis block exists
    const genesisCheck = db.prepare('SELECT * FROM blockchain WHERE block_index = 0').get();
    
    if (!genesisCheck) {
      // Create genesis block
      const genesisBlock = {
        block_index: 0,
        timestamp: new Date().toISOString(),
        transactions: JSON.stringify([]),
        previous_hash: '0',
        hash: 'genesis_hash',
        nonce: 0,
        difficulty: 4
      };

      db.prepare(`
        INSERT INTO blockchain (block_index, timestamp, transactions, previous_hash, hash, nonce, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        genesisBlock.block_index,
        genesisBlock.timestamp,
        genesisBlock.transactions,
        genesisBlock.previous_hash,
        genesisBlock.hash,
        genesisBlock.nonce,
        genesisBlock.difficulty
      );

      console.log('✅ Genesis block created');
    } else {
      console.log('✅ Genesis block already exists');
    }

    db.close();
    console.log('✅ Blockchain setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up blockchain:', error);
    process.exit(1);
  }
}

setupBlockchain();