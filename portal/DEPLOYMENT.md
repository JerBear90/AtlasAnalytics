# Atlas Analytics Portal — Deployment Guide

## Architecture

```
portal.atlasanalytics.com (custom domain)
        │
        ▼
    Railway (2 services in one project)
   ┌─────────────┐
   │   Client     │  ← Nginx serving React SPA
   │   (Docker)   │  ← Proxies /api/* to server
   └──────┬───────┘
          │ (internal or public URL)
   ┌──────┴───────┐
   │   Server      │  ← Express API (Node.js)
   │   (Docker)    │  ← SQLite in persistent volume
   └──────────────┘
```

Both services deploy from the same GitHub repo (`AtlasAnalytics`) with different root directories.

## Prerequisites

- GitHub account with the repo pushed
- Railway account — sign up at [railway.app](https://railway.app) with GitHub
- (Optional) Custom domain with DNS access

## Step 1: Create a Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **Deploy from GitHub repo**
3. Select the `AtlasAnalytics` repository
4. This creates your project — you'll add two services from it

## Step 2: Deploy the Server

1. In your Railway project, click **New** → **GitHub Repo** → select `AtlasAnalytics`
2. Go to **Settings**:
   - Root Directory: `portal/server`
   - Builder: Dockerfile
3. Go to **Variables** and add:
   ```
   JWT_SECRET=<generate with: openssl rand -hex 32>
   PORT=4000
   CLIENT_URL=https://<your-client-domain>
   NODE_ENV=production
   ```
4. Go to **Settings** → **Networking** → **Generate Domain**
   - Note the URL (e.g. `https://atlas-server-production.up.railway.app`)
5. Add a **Volume**:
   - Mount path: `/app/data`
   - This persists the SQLite database across deploys

## Step 3: Deploy the Client

1. Click **New** → **GitHub Repo** → select `AtlasAnalytics` again
2. Go to **Settings**:
   - Root Directory: `portal/client`
   - Builder: Dockerfile
3. Go to **Variables** and add:
   ```
   VITE_API_URL=https://<your-server-domain-from-step-2>/api
   ```
4. Go to **Settings** → **Networking**:
   - Click **Generate Domain** for a `*.up.railway.app` URL
   - Or add a custom domain (see Step 4)

## Step 4: Custom Domain (Optional)

1. On the **Client** service → **Settings** → **Networking** → **Custom Domain**
2. Add `portal.atlasanalytics.com`
3. Railway provides a CNAME target (e.g. `xxx.up.railway.app`)
4. In your DNS provider (SiteGround, Cloudflare, etc.):
   ```
   Type:  CNAME
   Host:  portal
   Value: <railway CNAME target>
   TTL:   3600
   ```
5. Wait for DNS propagation (5–30 minutes)
6. Railway auto-provisions SSL once DNS resolves
7. Update the server's `CLIENT_URL` env var to match the custom domain

## Step 5: Seed the Admin User

Use Railway's shell on the **Server** service:

1. Click the server service → three dots → **Open Shell**
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
     db.prepare('INSERT OR IGNORE INTO users (id,name,email,password_hash,role,user_type,company,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,'Super Admin','admin@atlasanalytics.com',pw,'super_admin','retail','Atlas Analytics, Inc.',now,now);
     console.log('Admin created');
   }
   seed();
   "
   ```

## Step 6: Upload Data

1. Log in at your portal URL
2. Go to **Admin** → **CSV Upload**
3. Upload client product CSV files — the system auto-detects the format

## Step 7: Verify

- `https://<your-client-domain>` → login page
- `https://<your-server-domain>/api/health` → `{"status":"ok"}`

---

## Updating

Push to `master` on GitHub — Railway auto-deploys both services.

```bash
git add -A
git commit -m "your commit message"
git push origin master
```

## Backup

### Via Railway Shell
```bash
# In the server service shell
cat /app/data/portal.db | base64
# Copy output and decode locally
```

### Via Docker (if self-hosted)
```bash
docker cp $(docker-compose ps -q server):/app/data/portal.db ./backup-$(date +%Y%m%d).db
```

## CORS Configuration

The server accepts requests from:
- `http://localhost:5173` (local development)
- `https://portal.atlasanalytics.com`
- `https://atlasanalytics.com`
- `https://www.atlasanalytics.com`
- `*.up.railway.app`
- `*.vercel.app`

To add more origins, edit `portal/server/src/index.ts` in the `cors()` config.

## Environment Variables Reference

### Server (`portal/server`)
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT signing (use `openssl rand -hex 32`) |
| `PORT` | No | Server port (default: `4000`) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g. `https://portal.atlasanalytics.com`) |
| `NODE_ENV` | No | Set to `production` in deployed environments |
| `ADMIN_EMAIL` | No | Email for auto-seeded admin (default: `super@atlas.com`) |
| `ADMIN_PASSWORD` | No | Password for auto-seeded admin (default: `changeme123`) |

### Client (`portal/client`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (e.g. `https://atlas-server.up.railway.app/api`) |

## Troubleshooting

### Login/signup returns errors
- Verify `VITE_API_URL` is set correctly on the client service and points to the server's `/api` path
- Check the server service logs for errors
- Ensure the server's volume is mounted at `/app/data`

### CORS errors in browser console
- Verify `CLIENT_URL` on the server matches the frontend's actual domain
- Check that the domain pattern is in the CORS origin list in `index.ts`

### Database is empty after redeploy
- Ensure a volume is attached to the server service at `/app/data`
- Without a volume, SQLite data is lost on every deploy

### Railway build fails
- Check that root directories are set correctly (`portal/server` and `portal/client`)
- Verify both Dockerfiles exist and build locally with `docker build .`
