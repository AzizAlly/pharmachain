import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

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

// Simple SHA256 hash function
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Calculate block hash
function calculateHash(blockIndex: number, timestamp: string, transactions: string, previousHash: string, nonce: number): string {
  const data = blockIndex + timestamp + transactions + previousHash + nonce;
  return sha256(data);
}

// Proof of work
function mineBlock(blockIndex: number, timestamp: string, transactions: string, previousHash: string, difficulty: number): { hash: string, nonce: number } {
  let nonce = 0;
  let hash = '';
  const prefix = '0'.repeat(difficulty);
  
  do {
    hash = calculateHash(blockIndex, timestamp, transactions, previousHash, nonce);
    nonce++;
  } while (!hash.startsWith(prefix));
  
  return { hash, nonce: nonce - 1 };
}

export async function POST() {
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({
        success: false,
        error: 'Database not found'
      });
    }

    const db = new Database(dbPath);

    // Check if pending_transactions table exists
    const pendingTableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pending_transactions'").get();
    if (!pendingTableCheck) {
      db.close();
      return NextResponse.json({
        success: false,
        error: 'No pending transactions table found'
      });
    }

    // Get pending transactions with proper typing
    const pendingTransactions = db.prepare('SELECT * FROM pending_transactions ORDER BY id ASC').all() as PendingTransaction[];
    
    if (pendingTransactions.length === 0) {
      db.close();
      return NextResponse.json({
        success: false,
        error: 'No pending transactions to mine'
      });
    }

    // Get the last block with proper typing
    const lastBlock = db.prepare('SELECT * FROM blockchain ORDER BY block_index DESC LIMIT 1').get() as Block | undefined;
    
    if (!lastBlock) {
      db.close();
      return NextResponse.json({
        success: false,
        error: 'No genesis block found'
      });
    }

    // Create new block
    const newIndex = lastBlock.block_index + 1;
    const timestamp = new Date().toISOString();
    const transactionsJson = JSON.stringify(pendingTransactions.map((tx: PendingTransaction) => ({
      id: tx.id,
      type: tx.type,
      data: JSON.parse(tx.data || '{}'),
      timestamp: tx.timestamp
    })));

    // Mine the block
    const difficulty = 4;
    const { hash, nonce } = mineBlock(newIndex, timestamp, transactionsJson, lastBlock.hash, difficulty);

    // Insert the new block
    db.prepare(`
      INSERT INTO blockchain (block_index, timestamp, transactions, previous_hash, hash, nonce, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      newIndex,
      timestamp,
      transactionsJson,
      lastBlock.hash,
      hash,
      nonce,
      difficulty
    );

    // Clear pending transactions
    db.prepare('DELETE FROM pending_transactions').run();

    db.close();

    return NextResponse.json({
      success: true,
      data: {
        block: {
          index: newIndex,
          timestamp: timestamp,
          transactions: pendingTransactions.length,
          previous_hash: lastBlock.hash,
          hash: hash,
          nonce: nonce,
          difficulty: difficulty
        },
        message: `Block #${newIndex} mined successfully with ${pendingTransactions.length} transactions`
      }
    });
  } catch (error) {
    console.error('Mining error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    });
  }
}