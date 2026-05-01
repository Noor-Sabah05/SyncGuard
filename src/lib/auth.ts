import crypto from 'crypto';
import { db, initDb } from './db';

export const SESSION_COOKIE = 'sg_session';
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
    try {
        const [salt, hash] = stored.split(':');
        const derived = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
        return false;
    }
}

export interface SessionUser {
    id: number;
    name: string;
    role: string;
    email: string;
}

export async function createSession(userId: number): Promise<string> {
    const id = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
    await initDb();
    await db.execute({
        sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
        args: [id, userId, expiresAt],
    });
    return id;
}

export async function getSession(sessionId: string | undefined | null): Promise<SessionUser | null> {
    if (!sessionId) return null;
    await initDb();
    const result = await db.execute({
        sql: `
      SELECT u.id, u.name, u.role, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')
    `,
        args: [sessionId],
    });
    const row = result.rows[0];

    if (!row) return null;

    return {
        id: Number(row.id),
        name: String(row.name),
        role: String(row.role),
        email: String(row.email),
    };
}

export async function deleteSession(sessionId: string): Promise<void> {
    await initDb();
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [sessionId] });
}
