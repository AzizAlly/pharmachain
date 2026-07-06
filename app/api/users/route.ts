import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'database', 'pharmachain.db');

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password: string;
  role: 'admin' | 'manufacturer' | 'distributor' | 'pharmacy' | 'patient';
  status: 'pending' | 'approved' | 'rejected';
  tmdaNumber: string | null;
  tmdaExpiry: string | null;
  pharmacyLicense: string | null;
  business: string | null;
  region: string | null;
  fleetSize: string | null;
  created_at: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function GET() {
  console.log('📊 GET /api/users called');
  
  try {
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { success: false, error: 'Database not found' },
        { status: 500 }
      );
    }

    const db = new Database(dbPath);
    
    const users = db.prepare(`
      SELECT id, name, email, phone, role, status, tmdaNumber, tmdaExpiry, pharmacyLicense, business, region, fleetSize, created_at
      FROM users 
      WHERE role != 'wholesaler'
      ORDER BY id
    `).all() as User[];
    
    db.close();
    
    const safeUsers = users.map(({ password, ...user }) => user);
    console.log(`✅ Found ${safeUsers.length} users`);
    
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role, status, business, tmdaNumber, tmdaExpiry, pharmacyLicense, region, fleetSize } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'manufacturer', 'distributor', 'pharmacy', 'patient'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be: manufacturer, distributor, pharmacy, or patient' },
        { status: 400 }
      );
    }

    if (role === 'distributor' && !tmdaNumber) {
      return NextResponse.json(
        { success: false, error: 'TMDA License Number is required for Distributors' },
        { status: 400 }
      );
    }

    if (role === 'pharmacy' && !pharmacyLicense) {
      return NextResponse.json(
        { success: false, error: 'Pharmacy License Number is required' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, password, role, status, business, tmdaNumber, tmdaExpiry, pharmacyLicense, region, fleetSize)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name,
      email.toLowerCase(),
      phone || null,
      hashedPassword,
      role,
      status || 'pending',
      business || null,
      tmdaNumber || null,
      tmdaExpiry || null,
      pharmacyLicense || null,
      region || null,
      fleetSize || null
    );

    db.close();

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    
    const updates: string[] = [];
    const values: any[] = [];
    
    const allowedFields = ['status', 'name', 'phone', 'business', 'tmdaNumber', 'tmdaExpiry', 'pharmacyLicense', 'region', 'fleetSize'];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(parseInt(id));
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = db.prepare(query).run(...values);
    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseInt(id));
    if (!user) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role === 'admin') {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
      if (adminCount.count <= 1) {
        db.close();
        return NextResponse.json(
          { success: false, error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(parseInt(id));
    db.close();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}