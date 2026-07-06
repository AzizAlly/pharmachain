import { NextRequest, NextResponse } from 'next/server';
import { ActivityModel } from '@/lib/db';

export async function GET() {
  try {
    const logs = ActivityModel.findAll.all(50);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, details } = body;

    const result = ActivityModel.create.run(userId, action, JSON.stringify(details));
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create log' }, { status: 500 });
  }
}