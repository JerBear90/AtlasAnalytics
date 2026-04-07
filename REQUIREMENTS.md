# Atlas Analytics Portal — Requirements

## Overview

A client-facing economic data analytics portal for GDP nowcasting, trade flow analysis, and financial indicators. The portal serves two distinct user types (Retail and Academic) with role-based access control and a Super Admin management layer.

## User Roles

| Role | Access Level |
|------|-------------|
| Retail | Current quarter data, limited countries, summary components, CSV export |
| Institutional | Full history, all 38 countries, full breakdown, CSV + JSON export |
| Enterprise | Full history, all 38 countries, custom components, all export formats |
| Admin | Everything above + user management |
| Super Admin | Everything above + CSV upload, SSO config, tab visibility control, "View As" toggle |

## User Types

- Retail: Overview, Quarterly Time Series, Weekly Time Series, Financial Targets, Net Exports, Private Inventories
- Academic: Overview, Headline GDP, Core GDP, State GDP with model training metadata

Super Admins can switch between user type views via a "View As" toggle.

## Authentication

- Email/password login and registration
- JWT-based session management
- Password reset flow (request + confirm)
- Google SSO (OAuth 2.0 via Passport.js), configurable by admins in Settings
- Automatic 401 handling with redirect to login

## Dashboard

- KPI cards with trend indicators (up/down/flat)
- Interactive charts: line, bar, waterfall
- Overview page with draggable, rearrangeable chart cards (order persisted to localStorage)
- Tab-based navigation for data series, components, and portal sections
- Inline tab-specific filters (Year, Quarter, Month, Section)
- Global filters: Date Range, Quarter
- Paginated data tables (15 rows per page)

## Tab Visibility

- Super Admins can enable/disable individual sidebar tabs from Settings
- Applies globally to all users
- Configurable tabs:
  - Data Series (Retail): Overview, Quarterly Time Series, Weekly Time Series, Financial Targets
  - Data Series (Academic): Headline GDP, Core GDP, State GDP
  - Components: Net Exports, Private Inventories
  - Portal: Contents, Insights, Support
- Stored server-side in app_settings (key-value)
- All tabs enabled by default

## Portal Sections

- Contents: Workbook metadata and descriptions
- Insights: Analytical commentary
- Support: Help and contact information

## CSV Ingestion

- Admin CSV upload page with drag-and-drop
- Multi-file upload (up to 20 files at once)
- Auto-detection of 7 file formats:
  - Quarterly Time Series
  - Weekly Time Series
  - Weekly Financial Targets
  - NX Results (Net Exports)
  - PI Results (Private Inventories)
  - Academic GDP (Headline/Core/State, detected from filename)
  - Generic economic data (country_code, indicator_type, quarter, value)
- Two upload modes:
  - Append (default): adds new rows alongside existing data
  - Replace: clears old data for the detected type before importing
- Validation with row-level error reporting
- Upload history tracking

## Data Export

- CSV and JSON export formats
- Role-enforced format restrictions
- Filtered export based on current dashboard state

## User Management

- Admin user list with pagination
- Role assignment (Admin and Super Admin)
- User type assignment

## User Profiles

- Editable fields: name, company, subscriber, primary contact, service period (start/end), workbook description
- Profile view and edit mode in Settings
- Email and role displayed (read-only)

## Settings

- Update display name
- Change password (current + new + confirm)
- Edit profile fields
- Google SSO configuration (Admin+)
- Tab visibility management (Super Admin only)
- Session logout

## UI/UX

- Dark-themed design
- Fully mobile responsive
- Sidebar navigation with collapsible mobile drawer
- Section grouping: Data Series, Filters, Components, Portal, Admin, Account
- User info display at sidebar bottom (name, email, role badge)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Chart.js, Axios |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken), bcrypt.js, Google OAuth 2.0 (Passport.js) |
| CSV Parsing | csv-parse |
| File Upload | Multer |
| Routing | React Router v6 |
| Testing | Jest, ts-jest, fast-check (property-based) |
| Build | Vite (client), tsc (server) |
| Containerization | Docker, nginx |

## API Structure

- `POST /api/auth/login` — email/password login
- `POST /api/auth/register` — user registration
- `POST /api/auth/logout` — session logout
- `GET /api/auth/google` — Google OAuth initiation
- `GET /api/users/me` — current user profile
- `PUT /api/users/me` — update name
- `PUT /api/users/me/profile` — update profile fields
- `PUT /api/users/me/password` — change password
- `GET /api/users` — list users (Admin)
- `PUT /api/users/:id/role` — assign role (Admin)
- `GET /api/dashboard/data` — dashboard data with filters
- `GET /api/dashboard/filters` — available filter options
- `GET /api/dashboard/overview` — overview charts
- `GET /api/export` — data export
- `POST /api/csv/upload` — CSV file upload (Admin)
- `GET /api/settings/sso` — SSO config (Admin)
- `PUT /api/settings/sso` — update SSO config (Admin)
- `GET /api/settings/tab-visibility` — tab visibility (all authenticated)
- `PUT /api/settings/tab-visibility` — update tab visibility (Super Admin)
- `GET /api/health` — health check
