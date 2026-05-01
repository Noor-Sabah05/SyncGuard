import { NextRequest, NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { hashPassword, createSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, role, email, password } = await request.json();

    if (!name?.trim() || !role?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await initDb();
    const existingResult = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = hashPassword(password);
    const info = await db.execute({
      sql: 'INSERT INTO users (name, role, email, password_hash) VALUES (?, ?, ?, ?)',
      args: [name.trim(), role.trim(), email.toLowerCase().trim(), password_hash],
    });

    const userId = Number(info.lastInsertRowid);
    const sessionId = await createSession(userId);

    const res = NextResponse.json({
      success: true,
      user: { id: userId, name: name.trim(), role: role.trim(), email: email.toLowerCase().trim() },
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
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
