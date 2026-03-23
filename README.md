# Atlas Analytics

Economic data analytics platform with a client portal for GDP nowcasting, trade flow analysis, and financial indicators.

## Project Structure

```
├── portal/              # MVP Client Portal (Phase 1)
│   ├── client/          # React + TypeScript + Vite + Tailwind
│   └── server/          # Express + TypeScript + SQLite
├── landing-page-mockups/  # Static HTML page designs for future Elementor build
└── README.md
```

## Portal Features

- OAuth 2.0 authentication (email/password + Google SSO)
- Multi-tier user roles: Retail, Institutional, Enterprise, Admin
- Role-scoped data access and dashboard views
- CSV ingestion pipeline with validation and error reporting
- Interactive charts (line, bar, waterfall) via Chart.js
- Data export (CSV/JSON) with role-enforced format restrictions
- Admin panel for CSV uploads and user management
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
npm run seed    # Creates admin + demo users with sample data
npm run dev
```

### Client
```bash
cd portal/client
npm install
npm run dev
```

### Default Accounts
| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@atlas.com   | admin123   |
| Demo  | demo@atlas.com    | demo1234   |

### URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Chart.js |
| Backend  | Express, TypeScript, better-sqlite3  |
| Auth     | JWT, bcrypt, Google OAuth 2.0        |
| Testing  | Jest, fast-check (property-based)    |
| Deploy   | Docker, nginx                        |

## Tests

```bash
cd portal/server
npm test
```

33 tests across 6 suites covering auth, CSV pipeline, data serialization, role permissions, dashboard scoping, and export enforcement.

## Environment Variables

See `portal/server/.env.example` and `portal/.env.example` for required configuration including JWT secret, Google OAuth credentials, and API URL.

## License

Proprietary — Atlas Analytics Inc.
