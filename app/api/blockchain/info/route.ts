import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

// Define types
interface Block {
  id: number;
  block_index: number;
  timestamp: string;
  transactions: string;
  previous_hash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

interface PendingTransaction {
  id: number;
  type: string;
  data: string;
  timestamp: string;
}

export async function GET() {
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({
        success: false,
        error: 'Database not found'
      });
    }

    const db = new Database(dbPath);

    // Check if blockchain table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='blockchain'").get();
    if (!tableCheck) {
      // Create blockchain table if it doesn't exist - using block_index
      db.prepare(`
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
      `).run();

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
    }

    // Get blockchain info with proper typing
    const chain = db.prepare('SELECT * FROM blockchain ORDER BY block_index ASC').all() as Block[];
    const pendingTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_transactions'").get();
    
    let pendingTransactions: PendingTransaction[] = [];
    if (pendingTableCheck) {
      pendingTransactions = db.prepare('SELECT * FROM pending_transactions ORDER BY id ASC').all() as PendingTransaction[];
    }

    db.close();

    // Calculate stats
    const totalTransactions = chain.reduce((sum: number, block: Block) => {
      try {
        const txs = JSON.parse(block.transactions);
        return sum + (Array.isArray(txs) ? txs.length : 0);
      } catch {
        return sum;
      }
    }, 0);

    // Check if chain is valid
    let isValid = true;
    for (let i = 1; i < chain.length; i++) {
      const current = chain[i];
      const previous = chain[i - 1];
      if (current.previous_hash !== previous.hash) {
        isValid = false;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        info: {
          chainLength: chain.length,
          totalTransactions: totalTransactions,
          pendingTransactions: pendingTransactions.length,
          difficulty: 4,
          isValid: isValid,
          isMining: false
        },
        chain: chain
      }
    });
  } catch (error) {
    console.error('Blockchain info error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    });
  }
}