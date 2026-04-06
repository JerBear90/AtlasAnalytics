# Atlas Analytics

Economic data analytics platform with a client portal for GDP nowcasting, trade flow analysis, and financial indicators.

## Project Structure

```
├── portal/                # Client Portal
│   ├── client/            # React + TypeScript + Vite + Tailwind (Frontend)
│   ├── server/            # Express + TypeScript + SQLite (API)
│   └── data/              # Client product CSV data files
├── landing-page-mockups/  # Static HTML page designs
└── README.md
```

## Portal Features

- JWT authentication (email/password + Google SSO)
- User roles: Retail, Institutional, Enterprise, Admin, Super Admin
- Two user types with distinct dashboard experiences:
  - Retail: Overview, Quarterly Time Series, Weekly Time Series, Financial Targets, Net Exports, Private Inventories
  - Academic: Overview, Headline GDP, Core GDP, State GDP with model training metadata
- Overview dashboard with draggable, rearrangeable charts (layout saved to localStorage)
- Super Admin "View As" toggle to preview both user type experiences
- User profiles with company, subscriber, contact, and service period fields
- CSV ingestion pipeline with auto-detection for 7 file formats
- Multi-file upload (up to 20 files at once)
- Inline tab-specific filters (Year, Quarter, Month, Section)
- Portal sections: Contents, Insights, Support with workbook metadata
- Interactive charts (line, bar, waterfall) with Weekly/Monthly toggle and View Details
- Data export (CSV/JSON) with role-enforced format restrictions
- Admin panel for CSV uploads and user management
- Editable user profiles in Settings
- Fully mobile responsive dark-themed UI

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Server
```bash
cd portal/server
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Client
```bash
cd portal/client
npm install
npm run dev
```

### Seed Client Product Data
```bash
cd portal/server
npx ts-node src/db/seedClientData.ts
```

### Default Accounts
| Role        | Email              | Password  |
|-------------|--------------------|-----------|
| Super Admin | super@atlas.com    | super123  |
| Admin       | admin@atlas.com    | admin123  |
| Demo        | demo@atlas.com     | demo1234  |

### Local URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Deploy to Railway

The portal runs as two separate Railway services from the same GitHub repo.

### Step 1: Create the Server Service
1. In your Railway project, click "New" > "GitHub Repo" > select `AtlasAnalytics`
2. Go to Settings > set Root Directory to `portal/server`
3. Builder: Dockerfile
4. Add Variables:
   - `JWT_SECRET` = (run `openssl rand -hex 32`)
   - `PORT` = `4000`
   - `CLIENT_URL` = `https://<your-client-service>.up.railway.app`
   - `NODE_ENV` = `production`
5. Add a Volume: mount path `/app/data` (persists the SQLite database)
6. Go to Settings > Networking > Generate Domain
7. Note the server URL (e.g., `https://atlasanalytics-server-production.up.railway.app`)

### Step 2: Create the Client Service
1. Click "New" > "GitHub Repo" > select `AtlasAnalytics` again (creates a second service)
2. Go to Settings > set Root Directory to `portal/client`
3. Builder: Dockerfile
4. Add Variables:
   - `VITE_API_URL` = `https://<your-server-url-from-step-1>/api`
5. Go to Settings > Networking > Generate Domain (or add custom domain `portal.atlasanalytics.com`)

### Step 3: Custom Domain (optional)
1. On the client service, go to Settings > Networking > Custom Domain
2. Add `portal.atlasanalytics.com`
3. Railway gives you a CNAME target
4. In your DNS provider, add: `CNAME portal -> <railway-cname-target>`

### Step 4: Seed Admin User
Use Railway's shell on the server service to create your admin account. See [portal/DEPLOYMENT.md](portal/DEPLOYMENT.md) for the seed command.

### Updating
Push to `master` — Railway auto-deploys both services.

## Tech Stack

| Layer       | Technology                                                     |
|-------------|----------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Chart.js, Axios      |
| Backend     | Node.js, Express, TypeScript                                    |
| Database    | SQLite (better-sqlite3)                                         |
| Auth        | JWT (jsonwebtoken), bcrypt.js, Google OAuth 2.0 (Passport.js)   |
| CSV Parsing | csv-parse                                                       |
| File Upload | Multer                                                          |
| Routing     | React Router v6                                                 |
| HTTP        | Axios (client), CORS (server)                                   |
| Testing     | Jest, ts-jest, fast-check (property-based)                      |
| Build       | Vite (client), tsc (server)                                     |
| Deploy      | Docker, nginx, Railway                                          |
| SSL         | Railway (auto) or Caddy/Certbot (self-hosted)                   |

## Tests

```bash
cd portal/server
npm test
```

## CSV File Formats

The pipeline auto-detects these formats on upload:

| Format | Key Headers / Detection |
|--------|------------------------|
| Quarterly Time Series | `US GDP (SAAR)`, `Atlas Predicted (SAAR)` |
| Weekly Time Series | `Prediction Year-Quarter`, `Core GDP`, `GDP` |
| Weekly Financial Targets | `Atlas Analytics Price Targets` (section header) |
| NX Results | `Date`, `Trade Balance`, `NX Results` |
| PI Results | `Date`, `Private Inventories` |
| Academic GDP (Headline/Core/State) | `BEA Actual`, `Atlas Predictions` (type from filename) |
| Generic Economic Data | `country_code`, `indicator_type`, `quarter`, `value` |

## License

Proprietary — Atlas Analytics, Inc.
