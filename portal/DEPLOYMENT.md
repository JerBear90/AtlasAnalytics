# Atlas Analytics Portal — Deployment Guide

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with your production values
docker-compose up -d
```

## Production Deployment

### Prerequisites
- Docker & Docker Compose
- Domain: `portal.atlasanalytics.com` pointed to your server
- SSL certificate (Let's Encrypt recommended)

### SSL Setup
1. Use a reverse proxy (Caddy, Traefik, or nginx) in front of the containers
2. Caddy auto-provisions SSL:
   ```
   portal.atlasanalytics.com {
       reverse_proxy client:3000
   }
   ```
3. Or use Certbot with nginx for Let's Encrypt certificates

### Database Migrations
```bash
docker-compose exec server node dist/db/migrate.js
```

### Environment Variables
See `.env.example` for all required variables. Key ones:
- `JWT_SECRET` — must be a strong random string
- `DATABASE_URL` — PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for OAuth
- `VITE_API_URL` — set at build time for the client

### Subdomain Configuration
The portal runs on `portal.atlasanalytics.com`, separate from the WordPress marketing site. CORS is pre-configured to allow requests from both domains.
