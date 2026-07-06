import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and data'
      });
    }

    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({
        success: false,
        error: 'Database not found'
      });
    }

    const db = new Database(dbPath);

    // Create pending_transactions table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pending_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Insert pending transaction
    const result = db.prepare(`
      INSERT INTO pending_transactions (type, data)
      VALUES (?, ?)
    `).run(type, JSON.stringify(data));

    db.close();

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        message: 'Transaction added to pending pool'
      }
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    });
  }
}