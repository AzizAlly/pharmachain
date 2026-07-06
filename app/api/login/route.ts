import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = UserModel.verifyPassword(email, password);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'pending') {
      return NextResponse.json({ success: false, error: 'Account pending approval' }, { status: 403 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}