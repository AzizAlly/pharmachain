import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

interface Medicine {
  id: number;
  name: string;
  category: string;
  description: string;
  batch_no: string;
  expiry_date: string;
  price: number;
  quantity: number;
  manufacturer_id: number;
  current_owner_id: number;
  current_location: string;
  status: string;
  verified_count: number;
  created_at: string;
}

interface Transfer {
  id: number;
  medicine_id: number;
  batch_no: string;
  from_id: number;
  to_id: number;
  quantity: number;
  status: string;
  date: string;
  from_name?: string;
  to_name?: string;
  medicine_name?: string;
}

export async function GET() {
  console.log('📊 GET /api/transfers called');
  
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { success: false, error: 'Database not found' },
        { status: 500 }
      );
    }

    const db = new Database(dbPath);
    
    const transfers = db.prepare(`
      SELECT 
        t.*,
        u1.name as from_name,
        u2.name as to_name,
        m.name as medicine_name,
        m.batch_no
      FROM transfers t
      LEFT JOIN users u1 ON t.from_id = u1.id
      LEFT JOIN users u2 ON t.to_id = u2.id
      LEFT JOIN medicines m ON t.medicine_id = m.id
      ORDER BY t.date DESC
    `).all() as Transfer[];
    
    db.close();
    
    return NextResponse.json({ success: true, transfers });
  } catch (error) {
    console.error('❌ Error fetching transfers:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicine_id, batch_no, from_id, to_id, quantity } = body;

    if (!medicine_id || !from_id || !to_id || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicine_id) as Medicine | undefined;
    
    if (!medicine) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      );
    }

    if (medicine.quantity < parseInt(quantity)) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'Insufficient quantity available' },
        { status: 400 }
      );
    }

    const beginTransaction = db.prepare('BEGIN TRANSACTION');
    const commitTransaction = db.prepare('COMMIT');
    const rollbackTransaction = db.prepare('ROLLBACK');

    try {
      beginTransaction.run();

      const transferStmt = db.prepare(`
        INSERT INTO transfers (medicine_id, batch_no, from_id, to_id, quantity, status, date)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      const transferResult = transferStmt.run(
        parseInt(medicine_id),
        batch_no,
        parseInt(from_id),
        parseInt(to_id),
        parseInt(quantity),
        'completed'
      );

      const newQuantity = medicine.quantity - parseInt(quantity);
      const updateStmt = db.prepare(`
        UPDATE medicines 
        SET 
          quantity = ?,
          current_owner_id = ?,
          current_location = ?,
          status = ?
        WHERE id = ?
      `);
      
      updateStmt.run(
        newQuantity,
        parseInt(to_id),
        'In Transit',
        newQuantity === 0 ? 'transferred' : 'active',
        parseInt(medicine_id)
      );

      commitTransaction.run();

      const transfer = db.prepare(`
        SELECT 
          t.*,
          u1.name as from_name,
          u2.name as to_name,
          m.name as medicine_name
        FROM transfers t
        LEFT JOIN users u1 ON t.from_id = u1.id
        LEFT JOIN users u2 ON t.to_id = u2.id
        LEFT JOIN medicines m ON t.medicine_id = m.id
        WHERE t.id = ?
      `).get(transferResult.lastInsertRowid) as Transfer | undefined;

      db.close();

      // Add blockchain transaction
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/blockchain/add-transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'MEDICINE_TRANSFERRED',
            data: {
              transferId: transferResult.lastInsertRowid,
              medicineId: parseInt(medicine_id),
              batchNo: batch_no,
              fromId: parseInt(from_id),
              toId: parseInt(to_id),
              quantity: parseInt(quantity),
              timestamp: new Date().toISOString()
            }
          })
        });
      } catch (blockchainError) {
        console.error('❌ Error adding blockchain transaction:', blockchainError);
      }
      
      return NextResponse.json({
        success: true,
        transfer: transfer,
        message: 'Transfer completed successfully'
      });
    } catch (error) {
      rollbackTransaction.run();
      db.close();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error creating transfer:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}