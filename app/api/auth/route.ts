import { env } from 'cloudflare:workers';
import { one, all, run, id, now, hash, clean, fail, rate, clientIp } from '@/lib/desk';
import { hashPassword, verifyPassword, startSession, endSession, getStaffUser } from '@/app/auth';
export const dynamic = 'force-dynamic';

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
function strong(p: string) { if (p.length < 8 || p.length > 200) fail('Use a password of at least 8 characters.'); }

export async function GET() {
  return Response.json({ user: await getStaffUser() });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) fail('Invalid request origin.', 403);
    const b: any = await req.json(), action = b.action, t = now(), ip = clientIp(req);
    const email = clean(b.email, 150).toLowerCase(), password = String(b.password ?? '');

    if (action === 'logout') { await endSession(); return Response.json({ ok: true }); }

    if (action === 'login') {
      await rate('login-ip:' + ip, 50); await rate('login:' + email, 10);
      const u = await one('SELECT * FROM users WHERE email=?', email);
      if (!u || !await verifyPassword(password, u.pass)) fail('Incorrect email or password.', 401);
      await startSession(u.id);
      return Response.json({ ok: true });
    }

    // Owner account: needs the server's OWNER_SETUP_KEY. Re-running it for an existing email resets that password.
    if (action === 'register') {
      await rate('register-ip:' + ip, 10);
      const key = String((env as any).OWNER_SETUP_KEY || '');
      if (key.length < 12 || String(b.setupKey ?? '') !== key) fail('Invalid setup key.', 403);
      const name = clean(b.name, 100);
      if (!emailOk(email) || !name) fail('Enter your name and a valid email.');
      strong(password);
      const existing = await one('SELECT id FROM users WHERE email=?', email);
      let uid = existing?.id;
      if (uid) {
        await run('UPDATE users SET pass=?,name=? WHERE id=?', await hashPassword(password), name, uid);
        await run('DELETE FROM staff_sessions WHERE user=?', uid);
      } else {
        uid = id();
        await run('INSERT INTO users (id,email,name,pass,created) VALUES (?,?,?,?,?)', uid, email, name, await hashPassword(password), t);
      }
      await startSession(uid);
      return Response.json({ ok: true });
    }

    // Staff account: one-time login code issued by the hotel administrator.
    if (action === 'activate') {
      await rate('activate-ip:' + ip, 20); await rate('activate:' + email, 8);
      const code = clean(b.code, 40).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const invites = await all('SELECT * FROM members WHERE email=? AND active=1 AND invite IS NOT NULL AND invite_until>?', email, t);
      let m: any = null;
      for (const row of invites) if (await hash(row.id + code) === row.invite) m = row;
      if (!m) fail('Incorrect or expired login code. Ask your hotel administrator for a new one.', 401);
      strong(password);
      let u = await one('SELECT * FROM users WHERE email=?', email);
      if (u) {
        // A code from one hotel must never take over a login that other hotels also use.
        const elsewhere = await one('SELECT 1 AS x FROM members WHERE email=? AND hotel!=? UNION SELECT 1 FROM hotels WHERE owner=? AND id!=?', email, m.hotel, u.id, m.hotel);
        if (elsewhere) {
          await run('UPDATE members SET invite=NULL,invite_until=NULL WHERE id=?', m.id);
          fail('This email already has a login used by another hotel. Sign in with that password instead.', 409);
        }
        await run('UPDATE users SET pass=? WHERE id=?', await hashPassword(password), u.id);
        await run('DELETE FROM staff_sessions WHERE user=?', u.id);
      } else {
        u = { id: id() };
        await run('INSERT INTO users (id,email,name,pass,created) VALUES (?,?,?,?,?)', u.id, email, clean(b.name, 100) || m.name, await hashPassword(password), t);
      }
      await run('UPDATE members SET invite=NULL,invite_until=NULL,user=? WHERE id=? AND (user IS NULL OR user=?)', u.id, m.id, u.id);
      await startSession(u.id);
      return Response.json({ ok: true });
    }

    fail('Unknown action.');
  } catch (e: any) {
    console.error('auth', e.message);
    return Response.json({ error: e.status ? e.message : 'Could not sign in. Please retry.' }, { status: e.status || 503 });
  }
}
