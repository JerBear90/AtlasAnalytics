# Atlas Analytics - Website Upgrade Proposal

**Prepared for:** Atlas Analytics Inc.
**Prepared by:** Jeramee
**Date:** March 15, 2026
**Version:** 4.0 (Revised — Portal Options A/B)

---

## Executive Summary

Following your scope and direction memo, this proposal outlines a phased approach to upgrading the Atlas Analytics website. The goal is to reflect Atlas' current scale, strengthen institutional credibility, support hiring, improve SEO performance, and build a scalable client portal and API foundation.

**UPDATE (v4.0):** Per client feedback, the phase order has been resequenced to prioritize the Client Portal — recognizing its importance for client delivery and productization. Phase 1 offers two approaches: Option A (Custom API Portal) or Option B (CSV-Based Dashboard Portal). The client selects one. The website pages (Phases 2-3) are already fully coded and require only Elementor translation.

All seven core pages (Homepage, Team, Careers, Testimonials, Dashboard, Blog listing, Blog post template) are production-ready HTML/CSS with responsive design, SEO meta descriptions, and consistent cross-linking.

---

## Phased Approach (Resequenced)

### Phase 1 -- Client Portal (Choose One Option)

**Priority: High — Client delivery and productization. Select Option A or Option B.**

---

#### Option A — Custom API Portal (Weeks 1-6)

Full custom-built portal with a RESTful API backend, real-time data endpoints, and developer documentation. Best for: scalable product offering, third-party integrations, programmatic data access, and future monetization.

| Deliverable | Description | Est. Hours |
|---|---|---|
| Portal Architecture & Technical Spec | Infrastructure decision (WordPress membership vs. standalone app), database schema, user role definitions, authentication flow diagrams, environment setup documentation | 10-12 hrs |
| Cloud Infrastructure Setup | Server provisioning (AWS/GCP), managed PostgreSQL database, environment configuration (staging + production), CI/CD pipeline, SSL/domain setup for portal subdomain | 10-14 hrs |
| Authentication System | OAuth 2.0 (Google login) + API key-based auth. JWT token management. Password reset flow. Session handling and security hardening. Account lockout and brute-force protection | 14-18 hrs |
| Multi-Tier User System | Role-based access: Retail, Institutional, Enterprise, Admin. Per-role dashboard views and data access permissions. User management admin panel. Invitation and onboarding workflows | 12-16 hrs |
| Custom Dashboard Views | Configurable dashboard layouts per user type. Institutional clients see full component breakdowns; retail clients see summary views. Saved preferences per account. Responsive dashboard UI. Interactive charts and data visualizations | 16-22 hrs |
| API Endpoints & Data Layer | RESTful API for GDP nowcasts, trade indicators, component forecasts. Pagination, sorting, field selection. Rate limiting and usage tiers. Webhook and real-time alerts | 14-18 hrs |
| Developer Documentation Portal | Interactive OpenAPI/Swagger docs. Sandbox environment. Getting started guide, code examples in Python, R, JavaScript | 6-8 hrs |
| Data Export | CSV and JSON export for all accessible datasets. Scheduled report delivery (email). Export audit logging for compliance. Download history per user | 10-12 hrs |
| Portal MVP Build | Membership-gated pages, branded login/registration flow, account settings, onboarding sequence for new users, notification preferences, help/support page | 16-22 hrs |
| Testing & QA | End-to-end testing across user roles, cross-browser testing, load testing, security penetration testing, staging environment validation | 8-12 hrs |

**Option A Estimate:** 116-154 hours
**Option A Cost:** $7,540 - $10,010

---

#### Option B — CSV-Based Dashboard Portal (Weeks 1-4)

Streamlined portal that ingests data from CSV files and displays it through interactive dashboards. No custom API or developer documentation. Best for: faster time-to-market, lower cost, simpler data pipeline, and clients who don't need programmatic access.

| Deliverable | Description | Est. Hours |
|---|---|---|
| Portal Architecture & Technical Spec | Infrastructure decision, database schema, user role definitions, CSV ingestion pipeline design, environment setup documentation | 6-8 hrs |
| Cloud Infrastructure Setup | Server provisioning (AWS/GCP), managed database, environment configuration (staging + production), CI/CD pipeline, SSL/domain setup | 6-8 hrs |
| Authentication System | OAuth 2.0 (Google login). JWT token management. Password reset flow. Session handling and security hardening | 8-10 hrs |
| Multi-Tier User System | Role-based access: Retail, Institutional, Enterprise, Admin. Per-role dashboard views and data access permissions. User management admin panel | 8-10 hrs |
| CSV Ingestion Pipeline | Automated CSV upload and parsing. Data validation and error handling. Scheduled imports. Version history for uploaded datasets | 6-8 hrs |
| Custom Dashboard Views | Configurable dashboard layouts per user type. Interactive charts and data visualizations. Saved preferences per account. Responsive dashboard UI | 12-16 hrs |
| Data Export | CSV and JSON export for all accessible datasets. Scheduled report delivery (email). Export audit logging for compliance | 6-8 hrs |
| Portal MVP Build | Membership-gated pages, branded login/registration flow, account settings, onboarding sequence for new users | 10-14 hrs |
| Testing & QA | End-to-end testing across user roles, cross-browser testing, staging environment validation | 4-6 hrs |

**Option B Estimate:** 66-88 hours
**Option B Cost:** $4,290 - $5,720

---

> **Which option is right for Atlas?** Option A is the stronger long-term play if you plan to offer programmatic data access, support third-party integrations, or monetize the data through API subscriptions. Option B gets you to market faster and at lower cost — ideal if clients primarily need a visual dashboard and CSV downloads. Option B can be upgraded to Option A later if demand grows.

---

### Phase 2 -- Website Core Pages (Weeks 5-7 or 7-9, depending on Phase 1 option)

**Status: Fully Coded -- Elementor Translation Only**

| Deliverable | Status | Remaining Work | Est. Hours |
|---|---|---|---|
| Team Page | Fully Coded | Elementor widget translation, photo swaps | 2-3 hrs |
| Careers Page | Fully Coded | Elementor widget translation, ATS placeholder | 2-3 hrs |
| Testimonials & Media Page | Fully Coded | Elementor widget translation, logo permissions | 2-3 hrs |
| Global Nav & Cross-Linking | Fully Coded | Elementor header/footer template | 1-2 hrs |
| SEO Meta Descriptions | Complete | Yoast SEO plugin configuration | 1-2 hrs |

**Phase 3 Estimate:** 8-13 hours
**Phase 3 Cost:** $520 - $845

---

### Phase 3 -- Homepage, Blog & SEO Hardening (Weeks 6-8 or 8-10, depending on Phase 1 option)

| Deliverable | Status | Remaining Work | Est. Hours |
|---|---|---|---|
| Homepage | Fully Coded | Elementor widget translation | 3-4 hrs |
| Blog / Insights Pages | Fully Coded | Elementor blog template translation | 2-3 hrs |
| Dashboard Page SEO | Complete | Yoast configuration only | 0.5 hr |
| SEO Keyword Implementation | Meta tags complete | Yoast full configuration, H1/H2 audit | 2-3 hrs |
| Structured Data / Schema Markup | Not started | Organization, Article, FAQ schema | 2-3 hrs |
| Performance & Accessibility Audit | Responsive complete | Image compression, Elementor optimization | 2-3 hrs |
| Job Posting Template System | Not started | Dynamic job listing template, ATS hooks | 3-4 hrs |

**Phase 4 Estimate:** 15-21 hours
**Phase 4 Cost:** $975 - $1,365

---

## Cost Summary

### If Option A (Custom API Portal):

| Phase | Timeline | Hours | Cost Range |
|---|---|---|---|
| Phase 1 Option A -- Custom API Portal | Weeks 1-6 | 116-154 hrs | $7,540 - $10,010 |
| Phase 2 -- Website Core Pages | Weeks 7-9 | 8-13 hrs | $520 - $845 |
| Phase 3 -- Homepage, Blog & SEO | Weeks 8-10 | 15-21 hrs | $975 - $1,365 |
| **Total (Option A)** | **~10 weeks** | **139-188 hrs** | **$9,035 - $12,220** |

### If Option B (CSV-Based Dashboard Portal):

| Phase | Timeline | Hours | Cost Range |
|---|---|---|---|
| Phase 1 Option B -- CSV Dashboard Portal | Weeks 1-4 | 66-88 hrs | $4,290 - $5,720 |
| Phase 2 -- Website Core Pages | Weeks 5-7 | 8-13 hrs | $520 - $845 |
| Phase 3 -- Homepage, Blog & SEO | Weeks 6-8 | 15-21 hrs | $975 - $1,365 |
| **Total (Option B)** | **~8 weeks** | **89-122 hrs** | **$5,785 - $7,930** |

**Rate:** $65/hour
**Payment Terms:** 50% deposit per phase, balance on delivery

> **Upgrade Path:** If the client starts with Option B and later wants API access, the upgrade from B → A is estimated at 50-66 hours / $3,250-$4,290, since the portal infrastructure, auth, and dashboards are already in place.

---

## What's Already Complete

All seven pages are production-ready with:

- **Fully responsive design** — tested at 1024px, 768px, and 480px breakpoints
- **Consistent global navigation** — Home, Team, Testimonials, Insights, Dashboard, Careers, Client Login, Request a Demo
- **SEO meta descriptions** — keyword-optimized titles and descriptions on all pages
- **Cross-linking** — all internal links working, logo links to homepage
- **Homepage features** — audience segmentation tabs, ROY/JACK product sections, subscribe form, client login placeholder
- **Blog / Insights** — listing page with category filters, featured post, podcast embed, newsletter signup, plus a full article template with sample post
- **Brand system** — dark cosmic theme, Encode Sans Condensed typography, coral accent (#e8546a)

---

## Technical Q&A — Portal & API Architecture

Answers to the client's questions on hosting, portal structure, authentication, costs, and data access.

### 1. Hosting

**Recommendation:** Separate the portal/API from the WordPress marketing site.

- **WordPress site** stays on current hosting (Hostinger or similar) — it handles the public-facing pages, blog, and SEO content.
- **Portal + API** should run on a cloud provider (AWS or GCP recommended) using a lightweight framework (Node.js/Express or Python/FastAPI) with a managed database (PostgreSQL on RDS or Cloud SQL).
- This separation means the marketing site and the product infrastructure scale independently. WordPress doesn't become a bottleneck when client usage grows.

**Scalability path:** Start with a single server instance + managed database. As usage grows, add a load balancer, horizontal scaling (auto-scaling groups), and a CDN for static assets. The API is designed stateless from day one, so scaling out is straightforward.

### 2. Portal Structure

**Multiple user types — yes.** The portal will support role-based access with at least three tiers:

| Role | Dashboard View | Data Access | Export |
|---|---|---|---|
| Retail | Summary GDP nowcasts, headline indicators | Current quarter only, limited countries | CSV summary |
| Institutional | Full component breakdowns, waterfall charts, trade flows | Full historical, all 38 countries | CSV + JSON + scheduled reports |
| Enterprise | Custom dashboards, white-label options, dedicated support | Full access + API keys + webhooks | All formats + API |
| Admin | User management, usage analytics, billing | Full system access | Audit logs |

- Custom dashboard views are configurable per role. Institutional clients see the full waterfall decomposition; retail clients see a simplified summary.
- Saved preferences per account (default country, date range, favorite indicators).
- **User limits:** No practical limit on accounts. The database and auth system scale horizontally. At 10K+ concurrent users, we'd add caching and connection pooling — but that's well beyond initial launch needs.

### 3. Authentication

**OAuth 2.0 — yes, supported out of the box.**

- Google login (OAuth 2.0) for portal access — one-click sign-in for clients.
- API key-based auth for programmatic access — clients generate keys from their portal dashboard.
- JWT tokens for session management with configurable expiration.
- Optional: SSO integration for enterprise clients (SAML 2.0) can be added as a follow-up if needed.

### 4. Ongoing Costs (Beyond Development)

| Item | Estimated Monthly Cost | Notes |
|---|---|---|
| Cloud hosting (AWS/GCP) | $50-200/mo | Scales with usage. Starts low with a single instance |
| Managed database (PostgreSQL) | $30-100/mo | RDS or Cloud SQL, depends on storage/compute |
| Domain + SSL | $15-20/mo | If separate subdomain for portal (e.g., portal.atlasanalytics.com) |
| Email/transactional (SendGrid, etc.) | $0-20/mo | For password resets, scheduled reports, alerts |
| CDN (CloudFront/Cloudflare) | $0-20/mo | Free tier covers most early usage |
| Monitoring (Datadog, UptimeRobot) | $0-30/mo | Basic monitoring is free; advanced alerting adds cost |
| WordPress hosting + Elementor Pro | Existing | Already covered by current setup |

**Total estimated ongoing:** $95-390/month depending on usage tier. Starts at the low end and scales with client count.

### 5. Data Access & Export

**CSV and JSON export — built into Phase 1 (Portal).**

- Users can download any dataset they have access to as CSV or JSON directly from the dashboard.
- Institutional and Enterprise clients get scheduled report delivery via email (weekly/monthly PDF or CSV).
- API clients (Phase 2) get programmatic access to the same data via GET endpoints with format selection (`?format=csv` or `?format=json`).
- Export audit logging for compliance — every download is tracked with timestamp, user, and dataset.
- **This is not a custom feature — it's included in the portal scope.** The export system is part of the core deliverable.

---

## Next Steps (Revised)

1. **Thursday Call** — Walk through all seven coded pages in the browser. Discuss portal approach and confirm Option A vs. Option B.
2. **Portal Scoping Session** — Dedicated 60-minute session to define user roles, dashboard views per tier, and data access rules. This feeds directly into the Phase 1 architecture spec.
3. **Infrastructure Decision** — Confirm cloud provider preference (AWS vs. GCP) and whether Atlas has existing infrastructure or database access to build against.
4. **Phase 1 Kickoff** — Begin portal architecture and MVP build. Target: 6 weeks (Option A) or 4 weeks (Option B).
5. **Client Asset Handoff** — Photos, testimonial approvals, and press links needed before Phases 2-3 (website Elementor work) can begin. These can be collected in parallel with Phase 1.
6. **Phases 2 + 3** — Website Elementor translation runs after Phase 1 completes. Target: 3-4 weeks.
7. **Staged Go-Live** — Portal beta with select clients first, then public website pages.

---

## What I Need From You

To keep the timeline on track, I'll need the following before Elementor build begins:

**Photos & Headshots**
- Professional headshots for all team members (executive team, core team, advisory board)
- Any branded office/workspace photos for use as section backgrounds or hero imagery
- Preferred image format: JPG or PNG, minimum 800x800px for headshots

**Testimonials & Client Approval**
- Written confirmation that all testimonial quotes are approved for public use
- Client logos with permission to display on the Testimonials page (SVG or high-res PNG preferred)
- Any real names/titles that need to be changed or anonymized

**Press & Media**
- Live URLs for all press articles referenced on the Testimonials page (Financial Times, Bloomberg, MIT Tech Review, Nature, The Economist, Wired)
- Confirmation on which articles are real vs. placeholder — I'll swap in actual links and update excerpts accordingly

**Blog & Thought Leadership**
- Confirm whether the sample blog post content (Nighttime Luminosity study) should remain as-is or be replaced with a real published piece
- Substack account URL for cross-post linking
- Podcast hosting URL or embed code if the podcast section should be functional

**SEO & Keywords**
- Review and approve the 15-25 priority keyword list (to be drafted collaboratively)
- Any specific search terms or phrases the sales team hears from prospects

**WordPress Environment**
- Confirm WordPress hosting provider and admin access
- Confirm active Elementor Pro license
- List any existing plugins currently installed (to avoid conflicts)
- Staging environment URL if available (preferred for build before go-live)

**Portal Decision (Phase 1)**
- Choose Option A (Custom API Portal) or Option B (CSV-Based Dashboard Portal)
- If Option A: access to existing data pipeline/database or documentation on how forecast data is currently stored
- If Option A: desired rate limit tiers and pricing model (if monetizing API access)
- If Option B: sample CSV files or documentation on current data format
- Preferred cloud hosting: AWS, GCP, or other
- Target client use cases: internal dashboards, third-party integrations, reseller/white-label, academic research

---

## Recommended Discussion Points for Thursday's Call

1. **Review coded pages** — walk through all seven live HTML files to confirm design/content before Elementor translation
2. **Portal decision** — choose Option A (Custom API Portal) or Option B (CSV Dashboard Portal)
3. **Asset collection** — agree on a deadline for photos, quotes, and press links
4. **Blog direction** — confirm sample content or provide real first post
5. **Infrastructure** — confirm cloud provider preference and existing data pipeline access
6. **Timeline preferences** — confirm if phased rollout works or if any phase should be accelerated
7. **WordPress environment** — confirm hosting, Elementor Pro license status, and any existing plugins/theme
