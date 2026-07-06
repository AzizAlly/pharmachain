import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

// Define types
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
  manufacturer_name?: string;
  current_owner_name?: string;
  current_owner_role?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function GET() {
  console.log('📊 GET /api/medicines called');
  
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database not found at:', dbPath);
      return NextResponse.json(
        { success: false, error: 'Database not found' },
        { status: 500 }
      );
    }

    const db = new Database(dbPath);
    
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='medicines'").get();
    if (!tableCheck) {
      console.error('❌ Medicines table does not exist');
      db.close();
      return NextResponse.json(
        { success: false, error: 'Medicines table does not exist' },
        { status: 500 }
      );
    }

    const medicines = db.prepare(`
      SELECT 
        m.*, 
        u1.name as manufacturer_name,
        u2.name as current_owner_name,
        u2.role as current_owner_role
      FROM medicines m 
      LEFT JOIN users u1 ON m.manufacturer_id = u1.id 
      LEFT JOIN users u2 ON m.current_owner_id = u2.id 
      ORDER BY m.created_at DESC
    `).all() as Medicine[];
    
    db.close();
    
    console.log(`✅ Found ${medicines.length} medicines`);
    
    return NextResponse.json({ success: true, medicines });
  } catch (error) {
    console.error('❌ Error fetching medicines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medicines: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating medicine:', body);
    
    const { name, category, description, batch_no, expiry_date, price, quantity, manufacturer_id } = body;

    // Validate
    if (!name || !batch_no || !expiry_date || !price || !quantity || !manufacturer_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if batch already exists
    const existing = db.prepare('SELECT * FROM medicines WHERE batch_no = ?').get(batch_no);
    if (existing) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'Batch number already exists' },
        { status: 400 }
      );
    }

    // Insert medicine
    const stmt = db.prepare(`
      INSERT INTO medicines (
        name, category, description, batch_no, expiry_date, 
        price, quantity, manufacturer_id, current_owner_id, current_location, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      category || 'General',
      description || '',
      batch_no.toUpperCase(),
      expiry_date,
      parseFloat(price),
      parseInt(quantity),
      parseInt(manufacturer_id),
      parseInt(manufacturer_id),
      'Manufacturer',
      'active'
    );

    console.log('✅ Medicine created with ID:', result.lastInsertRowid);
    db.close();

    // Add blockchain transaction
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const blockchainResponse = await fetch(`${baseUrl}/api/blockchain/add-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MEDICINE_CREATED',
          data: {
            medicineId: result.lastInsertRowid,
            name: name,
            batch: batch_no.toUpperCase(),
            manufacturerId: manufacturer_id,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const blockchainResult = await blockchainResponse.json();
      console.log('✅ Blockchain transaction added:', blockchainResult);
    } catch (blockchainError) {
      console.error('❌ Error adding blockchain transaction:', blockchainError);
      // Don't fail the request if blockchain fails
    }

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Medicine created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating medicine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create medicine: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    
    console.log(`📝 Updating medicine ${id}:`, body);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Medicine ID required' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (body.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(body.quantity);
    }
    if (body.current_owner_id !== undefined) {
      updates.push('current_owner_id = ?');
      values.push(body.current_owner_id);
    }
    if (body.current_location !== undefined) {
      updates.push('current_location = ?');
      values.push(body.current_location);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }

    if (updates.length === 0) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(parseInt(id));
    const query = `UPDATE medicines SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = db.prepare(query).run(...values);
    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Medicine not found' },
        { status: 404 }
      );
    }

    console.log('✅ Medicine updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Medicine updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating medicine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update medicine: ' + (error as Error).message },
      { status: 500 }
    );
  }
}