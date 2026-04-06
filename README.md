# Atlas Analytics

Economic data analytics platform with a client portal for GDP nowcasting, trade flow analysis, and financial indicators.

## Project Structure

```
├── portal/                # Client Portal
│   ├── client/            # React + TypeScript + Vite + Tailwind
│   ├── server/            # Express + TypeScript + SQLite
│   └── data/              # Client product CSV data files
├── landing-page-mockups/  # Static HTML page designs
└── README.md
```

## Portal Features

- JWT authentication (email/password + Google SSO)
- User roles: Retail, Institutional, Enterprise, Admin, Super Admin
- Two user types with distinct dashboard experiences:
  - **Retail**: Weekly Time Series, Quarterly Time Series, Financial Targets, Net Exports, Private Inventories
  - **Academic**: Headline GDP, Core GDP, State GDP with model training metadata
- Super Admin "View As" toggle to preview both user type experiences
- User profiles with company, subscriber, contact, and service period fields
- CSV ingestion pipeline with auto-detection for 5 file formats
- Portal sections: Contents, Insights, Support with workbook metadata
- Interactive charts (line, bar, waterfall) via Chart.js
- Data export (CSV/JSON) with role-enforced format restrictions
- Admin panel for CSV uploads and user management
- Editable user profiles in Settings
- Responsive dark-themed UI

## Quick Start

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

### URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Deployment

The portal deploys as two Docker services (client + server). See [portal/DEPLOYMENT.md](portal/DEPLOYMENT.md) for full instructions covering:

- **Railway** (recommended) — push-to-deploy from GitHub
- **Docker on VPS** — AWS EC2, DigitalOcean, Lightsail, etc.

Production URL: `https://portal.atlasanalytics.com`

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Chart.js |
| Backend  | Express, TypeScript, better-sqlite3                |
| Auth     | JWT, bcrypt, Google OAuth 2.0                      |
| Testing  | Jest, fast-check (property-based)                  |
| Deploy   | Docker, Railway                                    |

## Tests

```bash
cd portal/server
npm test
```

## CSV File Formats

The pipeline auto-detects these formats on upload:

| Format | Key Headers |
|--------|-------------|
| Weekly Time Series | `Prediction Year-Quarter`, `Core GDP`, `GDP` |
| Weekly Financial Targets | `Atlas Analytics Price Targets` (section header) |
| NX Results | `Date`, `Trade Balance`, `NX Results` |
| PI Results | `Date`, `Private Inventories` |
| Generic Economic Data | `country_code`, `indicator_type`, `quarter`, `value` |

## License

Proprietary — Atlas Analytics, Inc.
