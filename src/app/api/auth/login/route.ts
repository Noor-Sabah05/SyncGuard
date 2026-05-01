import { NextRequest, NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyPassword, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await initDb();
    const userResult = await db.execute({
      sql: 'SELECT id, name, role, email, password_hash FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    const row = userResult.rows[0];

    if (!row) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = {
      id: Number(row.id),
      name: String(row.name),
      role: String(row.role),
      email: String(row.email),
      password_hash: String(row.password_hash),
    };

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionId = await createSession(user.id);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role, email: user.email },
    });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
