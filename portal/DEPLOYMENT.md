# Atlas Analytics Portal — Deployment Guide

## Architecture

```
portal.atlasanalytics.com (subdomain)
        │
        ▼
    Railway (2 services)
   ┌─────────────┐
   │   Client     │  ← Nginx serving React SPA
   │   (Docker)   │  ← Proxies /api/* to server
   └──────┬───────┘
          │
   ┌──────┴───────┐
   │   Server      │  ← Express API (Node.js)
   │   (Docker)    │  ← SQLite in persistent volume
   └──────────────┘
```

## Deploy to Railway (Recommended)

### Prerequisites

- GitHub account with the repo pushed
- Railway account (sign up at [railway.app](https://railway.app) with GitHub)

### Step 1: Create the Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select the `AtlasAnalytics` repository
4. Railway will create a project — you'll configure two services from it

### Step 2: Deploy the Server

1. In your Railway project, click "New Service" > "GitHub Repo" > select `AtlasAnalytics`
2. Go to the service Settings:
   - Set **Root Directory** to `portal/server`
   - Set **Builder** to Dockerfile
3. Go to the Variables tab and add:
   ```
   JWT_SECRET=<run: openssl rand -hex 32>
   PORT=4000
   CLIENT_URL=https://portal.atlasanalytics.com
   NODE_ENV=production
   ```
4. Go to Settings > Networking and click "Generate Domain" (or add custom domain later)
5. Add a **Volume**: mount path `/app/data` — this persists the SQLite database across deploys

### Step 3: Deploy the Client

1. Click "New Service" > "GitHub Repo" > select `AtlasAnalytics` again
2. Go to the service Settings:
   - Set **Root Directory** to `portal/client`
   - Set **Builder** to Dockerfile
3. Go to the Variables tab and add:
   ```
   VITE_API_URL=https://<your-server-service>.railway.app/api
   ```
   Replace with the server's Railway domain from Step 2.
4. Go to Settings > Networking:
   - Click "Generate Domain" for testing
   - Or add custom domain `portal.atlasanalytics.com`

### Step 4: Custom Domain (portal.atlasanalytics.com)

1. In the Client service on Railway, go to Settings > Networking > Custom Domain
2. Add `portal.atlasanalytics.com`
3. Railway will give you a CNAME target (something like `xxx.up.railway.app`)
4. In SiteGround DNS Zone Editor (Site Tools > Domain > DNS Zone Editor):
   ```
   Type: CNAME
   Host: portal
   Value: <railway CNAME target>
   TTL: 3600
   ```
5. Wait for DNS propagation (5-30 minutes)
6. Railway auto-provisions SSL once DNS resolves

### Step 5: Seed the Admin User

Option A — Use Railway's shell:
1. In the Server service, click the three dots > "Open Shell"
2. Run:
   ```bash
   node -e "
   const bcrypt = require('bcryptjs');
   const crypto = require('crypto');
   const Database = require('better-sqlite3');
   const db = new Database('/app/data/portal.db');
   async function seed() {
     const pw = await bcrypt.hash('YOUR_SECURE_PASSWORD', 12);
     const id = crypto.randomBytes(16).toString('hex');
     const now = new Date().toISOString();
     db.prepare('INSERT OR IGNORE INTO users (id,name,email,password_hash,role,user_type,company,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,'Atlas Admin','admin@atlasanalytics.com',pw,'super_admin','retail','Atlas Analytics, Inc.',now,now);
     console.log('Admin created');
   }
   seed();
   "
   ```

Option B — Hit the health endpoint first to trigger auto-migration, then use the seed script.

### Step 6: Upload Data

1. Log in at `https://portal.atlasanalytics.com`
2. Go to Admin > CSV Upload
3. Upload your client product CSV files — the system auto-detects the format:
   - Weekly Time Series
   - Weekly Financial Targets
   - NX Results
   - PI Results
   - Generic economic data (country_code, indicator_type, etc.)

### Step 7: Verify

- `https://portal.atlasanalytics.com` — login page
- `https://portal.atlasanalytics.com/api/health` — should return `{"status":"ok"}`
- `https://www.atlasanalytics.com` — WordPress site unaffected

---

## Alternative: Docker on a VPS

If you prefer self-hosting (AWS EC2, DigitalOcean, Lightsail, etc.):

### 1. DNS Setup

Add an A record in your DNS:
```
Type: A
Host: portal
Value: <your server IP>
TTL: 3600
```

### 2. Server Setup

```bash
ssh user@your-server
git clone <repo-url> /opt/atlas
cd /opt/atlas/portal
```

### 3. Configure

```bash
cp .env.production .env
nano .env
# Set JWT_SECRET (run: openssl rand -hex 32)
```

### 4. Build and Start

```bash
docker-compose up -d --build
```

### 5. SSL with Caddy

```bash
# Install Caddy
sudo apt install -y caddy   # or yum on Amazon Linux

# Configure
sudo tee /etc/caddy/Caddyfile << 'EOF'
portal.atlasanalytics.com {
    reverse_proxy localhost:3000
}
EOF

sudo systemctl restart caddy
```

Caddy auto-provisions SSL via Let's Encrypt.

---

## Updating

### Railway
Push to GitHub — Railway auto-deploys on every push to `master`.

### Docker/VPS
```bash
cd /opt/atlas
git pull
cd portal
docker-compose up -d --build
```

## Backup

### Railway
The SQLite database lives in the mounted volume. Use Railway's shell to copy it:
```bash
# In Railway shell
cat /app/data/portal.db | base64
# Copy output and decode locally
```

### Docker/VPS
```bash
docker cp $(docker-compose ps -q server):/app/data/portal.db ./backup-$(date +%Y%m%d).db
```

## CORS Configuration

The server accepts requests from:
- `https://portal.atlasanalytics.com`
- `https://atlasanalytics.com`
- `https://www.atlasanalytics.com`
- `http://localhost:5173` (development)

## Troubleshooting

### Railway
- Check service logs in the Railway dashboard
- Verify environment variables are set correctly
- Ensure the volume is mounted at `/app/data` for the server

### Docker
```bash
docker-compose logs -f server
docker-compose logs -f client
docker-compose restart
```
