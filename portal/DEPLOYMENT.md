# Atlas Analytics Portal — Production Deployment

## Architecture

```
portal.atlasanalytics.com (subdomain)
        │
        ▼
   Reverse Proxy (Caddy or nginx + SSL)
        │
   ┌────┴────┐
   │ Client  │  ← Nginx serving React SPA (port 3000)
   │ (nginx) │  ← Proxies /api/* to server
   └────┬────┘
        │
   ┌────┴────┐
   │ Server  │  ← Express API (port 4000)
   │ (Node)  │  ← SQLite database in /app/data/
   └─────────┘
```

## Prerequisites

- A VPS or cloud server (DigitalOcean, AWS Lightsail, Hetzner, etc.)
- Docker and Docker Compose installed
- Domain DNS: `portal.atlasanalytics.com` A record pointing to your server IP

## Step-by-Step Deployment

### 1. DNS Setup (SiteGround or your DNS provider)

Add an A record in your DNS settings:

```
Type: A
Host: portal
Value: <YOUR_SERVER_IP>
TTL: 3600
```

If using SiteGround's DNS zone editor:
- Go to Site Tools > Domain > DNS Zone Editor
- Add an A record for `portal` pointing to your deployment server's IP
- This keeps `www.atlasanalytics.com` on SiteGround/WordPress while `portal.atlasanalytics.com` goes to your VPS

### 2. Server Setup

SSH into your VPS and clone the repo:

```bash
git clone <your-repo-url> /opt/atlas
cd /opt/atlas/portal
```

### 3. Configure Environment

```bash
cp .env.production .env
nano .env
```

Generate a JWT secret:
```bash
openssl rand -hex 32
```

Paste it as the `JWT_SECRET` value. Configure Google OAuth and SendGrid if needed.

### 4. Build and Start

```bash
docker-compose up -d --build
```

This builds both containers and starts them. The client serves on port 3000, the API on port 4000.

### 5. SSL with Caddy (Recommended — Easiest)

Install Caddy on the host:
```bash
apt install -y caddy
```

Create `/etc/caddy/Caddyfile`:
```
portal.atlasanalytics.com {
    reverse_proxy localhost:3000
}
```

Restart Caddy:
```bash
systemctl restart caddy
```

Caddy automatically provisions and renews SSL certificates via Let's Encrypt.

### 5b. Alternative: SSL with nginx + Certbot

If you prefer nginx on the host instead of Caddy:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/portal`:
```nginx
server {
    listen 80;
    server_name portal.atlasanalytics.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and get SSL:
```bash
ln -s /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d portal.atlasanalytics.com
```

### 6. Seed the Database

On first deploy, seed the admin users:

```bash
docker-compose exec server node -e "
  const bcrypt = require('bcryptjs');
  const crypto = require('crypto');
  const Database = require('better-sqlite3');
  const db = new Database('/app/data/portal.db');

  async function seed() {
    const pw = await bcrypt.hash('CHANGE_THIS_PASSWORD', 12);
    const id = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    db.prepare(
      'INSERT OR IGNORE INTO users (id, name, email, password_hash, role, user_type, company, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, 'Atlas Admin', 'admin@atlasanalytics.com', pw, 'super_admin', 'retail', 'Atlas Analytics, Inc.', now, now);
    console.log('Admin user created');
  }
  seed();
"
```

Replace `CHANGE_THIS_PASSWORD` with a strong password.

### 7. Upload Data

1. Log in at `https://portal.atlasanalytics.com` with your admin credentials
2. Go to Admin > CSV Upload
3. Upload your client product CSV files — the system auto-detects the format

### 8. Verify

- Visit `https://portal.atlasanalytics.com` — should show the login page
- Visit `https://portal.atlasanalytics.com/api/health` — should return `{"status":"ok"}`
- Visit `https://www.atlasanalytics.com` — WordPress site should be unaffected

## Updating

To deploy updates:

```bash
cd /opt/atlas
git pull
cd portal
docker-compose up -d --build
```

The SQLite database persists in a Docker volume (`server-data`), so rebuilds don't lose data.

## Backup

Back up the SQLite database:
```bash
docker cp $(docker-compose ps -q server):/app/data/portal.db ./backup-$(date +%Y%m%d).db
```

## CORS

The server is pre-configured to accept requests from:
- `https://portal.atlasanalytics.com`
- `https://atlasanalytics.com`
- `https://www.atlasanalytics.com`

## Troubleshooting

Check logs:
```bash
docker-compose logs -f server
docker-compose logs -f client
```

Restart:
```bash
docker-compose restart
```

Rebuild from scratch:
```bash
docker-compose down
docker-compose up -d --build
```
