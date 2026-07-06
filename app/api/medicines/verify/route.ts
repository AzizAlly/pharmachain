import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

export async function GET() {
  console.log('📊 GET /api/medicines called');
  
  try {
    const db = new Database(dbPath);
    
    // Get all medicines with manufacturer name
    const medicines = db.prepare(`
      SELECT m.*, u.name as manufacturer_name 
      FROM medicines m 
      LEFT JOIN users u ON m.manufacturer_id = u.id 
      ORDER BY m.created_at DESC
    `).all();
    
    db.close();
    
    console.log(`📊 Found ${medicines.length} medicines`);
    
    return NextResponse.json({ success: true, medicines });
  } catch (error) {
    console.error('❌ Error fetching medicines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating medicine:', body);
    
    const { name, category, description, batch_no, expiry_date, price, quantity, manufacturer_id } = body;

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
      INSERT INTO medicines (name, category, description, batch_no, expiry_date, price, quantity, manufacturer_id, current_owner_id, current_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      category || 'General',
      description || '',
      batch_no,
      expiry_date,
      parseFloat(price),
      parseInt(quantity),
      manufacturer_id,
      manufacturer_id, // current_owner_id = manufacturer
      'Manufacturer' // current_location
    );

    console.log('✅ Medicine created with ID:', result.lastInsertRowid);
    db.close();

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Medicine created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating medicine:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create medicine' },
      { status: 500 }
    );
  }
}