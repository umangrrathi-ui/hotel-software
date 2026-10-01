# Deploying on your own server

Runs the whole app on one Linux VPS with Docker. No Cloudflare/OpenAI account needed.

- **app**: the built app on `workerd` (Cloudflare's open-source Workers runtime). Database (SQLite) and uploaded photos live in the `appdata` Docker volume.
- **caddy**: HTTPS certificates (Let's Encrypt) and reverse proxy.

## 1. Server

- Ubuntu 22.04/24.04, 2 vCPU, 4 GB RAM, 40 GB disk is enough for a pilot (app uses ~400 MB RAM; the image is ~3 GB).
- Ports 80 and 443 must be free. Check with `sudo ss -tlnp | grep -E ':(80|443) '`.
  If another app (for example an n8n proxy) already uses them, either use a separate VPS or add this app to that proxy and remove the `caddy` service.
- Install Docker: `curl -fsSL https://get.docker.com | sh`
- Firewall: `ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable`

## 2. Domain

Create a DNS **A record** for your app domain (e.g. `desk.yourhotel.in`) pointing to the server's IP. Wait until `ping desk.yourhotel.in` shows that IP.

## 3. Install and start

```bash
git clone <this repo> hotel-desk && cd hotel-desk
cp .env.example .env
nano .env        # set APP_DOMAIN and OWNER_SETUP_KEY (openssl rand -base64 24)
docker compose up -d --build
docker compose logs -f app     # wait for "Ready on http://0.0.0.0:8787"
```

Open `https://APP_DOMAIN`.

## 4. First login

1. Click **Owner setup**, enter the `OWNER_SETUP_KEY` from `.env`, your name, email and a password.
2. Create your hotel, then add rooms, services, places.
3. **Team → Add staff** shows a one-time **login code** (valid 7 days). Give it to the staff member privately.
   They open the app → **Have a login code?** → set their own password.
4. Staff forgot password: **Team → Edit → Generate new login code**.
   Owner forgot password: run **Owner setup** again with the setup key and the same email.

Keep `OWNER_SETUP_KEY` secret. Anyone with it can create an owner account on this server.

## 5. Backups (do this on day one)

```bash
mkdir -p backups
crontab -e
# nightly at 02:30, keeps the newest 14 in ./backups
30 2 * * * cd /home/<you>/hotel-desk && docker compose exec -T app node deploy/backup.mjs >> backups/backup.log 2>&1
```

Also copy `./backups` off the server (another VPS, Google Drive, etc.).

**Restore** a backup:

```bash
docker compose stop app
docker compose run --rm -v "$PWD/backups:/backups" app sh -c \
  'rm -rf /data/state && tar -xzf /backups/hotel-YYYY-MM-DD-HH-MM.tar.gz -C /data'
docker compose up -d
```

## 6. Updating

```bash
git pull
docker compose up -d --build     # database migrations run automatically on start
```

## Tests (developers)

```bash
pnpm install --frozen-lockfile
node tests/desk-api.mjs && node tests/auth-api.mjs
node node_modules/typescript/bin/tsc --noEmit
```

## Limits of this setup

- One server, one SQLite database: fine for a few hotels. For many hotels, the same code can be deployed to Cloudflare Workers (D1/R2) or moved to Postgres.
- The app is served with `wrangler dev --local`, which runs the real `workerd` runtime but is not Cloudflare's hosted platform. Pilot first.
- No email sending: login codes are shared by the hotel admin.
