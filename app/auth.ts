import { cookies } from 'next/headers';
import { one, run, id, now, hash } from '@/lib/desk';

export type StaffUser = { userId: string; displayName: string; email: string; fullName: string | null };

export const SESSION_COOKIE = 'staff_session';
const SESSION_DAYS = 30;
// Cloudflare's workerd caps PBKDF2 at 100k iterations.
const ITERATIONS = 100000;

const hex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => new Uint8Array((s.match(/../g) || []).map(x => parseInt(x, 16)));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${await derive(password, salt, ITERATIONS)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, iter, salt, expected] = String(stored || '').split('$');
  if (kind !== 'pbkdf2' || !salt || !expected) return false;
  const actual = await derive(password, unhex(salt), Number(iter));
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length && i < expected.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function startSession(userId: string) {
  const token = id() + id(), expires = now() + SESSION_DAYS * 86400000;
  await run('INSERT INTO staff_sessions VALUES (?,?,?)', await hash(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 86400 });
}

export async function endSession() {
  const jar = await cookies(), token = jar.get(SESSION_COOKIE)?.value;
  if (token) await run('DELETE FROM staff_sessions WHERE id=?', await hash(token));
  jar.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

// Staff identity comes only from the server-side session cookie, never from request headers.
export async function getStaffUser(): Promise<StaffUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const u = await one('SELECT u.id,u.email,u.name FROM staff_sessions s JOIN users u ON u.id=s.user WHERE s.id=? AND s.expires>?', await hash(token), now());
  if (!u) return null;
  return { userId: u.id, email: u.email, displayName: u.name || u.email, fullName: u.name || null };
}
