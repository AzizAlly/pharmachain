import { NextRequest, NextResponse } from 'next/server';
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

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function calculateHash(blockIndex: number, timestamp: string, transactions: string, previousHash: string, nonce: number): string {
  const data = blockIndex + timestamp + transactions + previousHash + nonce;
  return sha256(data);
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

    const chain = db.prepare('SELECT * FROM blockchain ORDER BY block_index ASC').all() as Block[];
    db.close();

    if (chain.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          message: 'Blockchain is empty (genesis block not found)'
        }
      });
    }

    // Verify each block
    let isValid = true;
    let errors: string[] = [];

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      
      // Verify genesis block
      if (i === 0) {
        if (block.previous_hash !== '0') {
          isValid = false;
          errors.push(`Genesis block has invalid previous_hash: ${block.previous_hash}`);
        }
        continue;
      }

      const previousBlock = chain[i - 1];
      
      // Verify previous hash
      if (block.previous_hash !== previousBlock.hash) {
        isValid = false;
        errors.push(`Block ${block.block_index} has invalid previous_hash`);
      }

      // Verify hash
      const calculatedHash = calculateHash(
        block.block_index,
        block.timestamp,
        block.transactions,
        block.previous_hash,
        block.nonce
      );

      if (calculatedHash !== block.hash) {
        isValid = false;
        errors.push(`Block ${block.block_index} has invalid hash`);
      }

      // Verify difficulty (should start with 4 zeros)
      const prefix = '0'.repeat(block.difficulty || 4);
      if (!block.hash.startsWith(prefix)) {
        isValid = false;
        errors.push(`Block ${block.block_index} hash doesn't meet difficulty requirement`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: isValid,
        errors: errors,
        totalBlocks: chain.length,
        message: isValid ? 'Blockchain is valid ✅' : 'Blockchain has errors ❌'
      }
    });
  } catch (error) {
    console.error('Verify blockchain error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    });
  }
}