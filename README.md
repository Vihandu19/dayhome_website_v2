# Happy Times Dayhome

A fully serverless, static website for a licensed family dayhome in Riverstone Cranston, Calgary. Built with vanilla HTML/CSS/JS and deployed on AWS (S3, CloudFront, API Gateway, Lambda, SES) with GitHub Actions CI/CD.

---

## Architecture Diagram

```
                        VISITOR
                           |
                    [HTTPS Request]
                           |
                    +------v-------+
                    |  CloudFront  |  <-- TLS termination (ACM cert)
                    |  (CDN Edge)  |  <-- OAC signs requests to S3
                    +------+-------+
                           |
              +------------+-------------+
              |                          |
       [Static asset request]    [POST /submit-inquiry]
              |                          |
       +--------v-------+       +----------v----------+
       |   Amazon S3    |       |    API Gateway       |
       | (private; OAC  |       |  (HTTP API; throttle:|
       |  auth only)    |       |   2 req/s, burst 5)  |
       +----------------+       +----------+----------+
                                         |
                               +---------v----------+
                               |   Lambda (Node.js)  |
                               |  Validate + Format   |
                               +---------+----------+
                                         |
                               +---------v----------+
                               |     AWS SES         |
                               |  (Sandbox; forwards  |
                               |   to owner inbox)   |
                               +--------------------+


  DEPLOYMENT (GitHub Actions - triggered on push to main)
  ┌─────────────────────────────────────────────────────────┐
  │  Checkout -> node build.js -> aws s3 sync -> CF inval.  │
  └─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES Modules)
- **Static Hosting**: AWS S3 + CloudFront (OAC)
- **Backend**: AWS API Gateway (HTTP API) + Lambda (Node.js)
- **Email**: AWS SES (Sandbox mode)
- **CI/CD**: GitHub Actions
- **Local Mocks**: Mock Service Worker (MSW)

---

## Local Development

```bash
# Install dependencies
npm install

# Development build + serve (includes MSW for contact form testing)
npm run dev
# Opens http://localhost:3000

# Production build (no MSW, clean /dist output)
npm run build:prod
```

The `npm run dev` command compiles templates to `/dist` and serves that directory. The contact form uses MSW to intercept submissions locally — zero production impact.

---

## Deployment

**Automated (primary)**: Push to `main` triggers GitHub Actions. The pipeline runs `npm run build:prod`, syncs `/dist` to S3, and invalidates CloudFront.

**Manual fallback** (see `docs/PROJECT.md`):
```bash
npm run build:prod
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## Repository Structure

```
dayhome-website-v2/
├── .github/workflows/deploy.yml    # CI/CD pipeline
├── assets/                         # Static assets (CSS, JS, fonts, images)
├── dist/                           # Build output (gitignored, deployed to S3)
│   ├── index.html
│   ├── error.html
│   ├── about/index.html
│   ├── gallery/index.html
│   ├── contact/index.html
│   ├── assets/
│   ├── sitemap.xml
│   └── robots.txt
├── partials/                       # Shared HTML components
├── templates/                      # Page templates with placeholders
├── mocks/                          # MSW local development (gitignored)
├── docs/                           # Project documentation
├── sitemap.xml                     # Source sitemap (copied to /dist)
├── robots.txt                      # Source robots.txt (copied to /dist)
├── build.js                        # Build script (ES Modules)
├── package.json
└── README.md
```

---

## Documentation

- [`docs/PROJECT.md`](docs/PROJECT.md) — Comprehensive project specification (architecture, design system, SEO, security, infrastructure)
- [`docs/CONTEXT.md`](docs/CONTEXT.md) — Key decisions and rationale
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — Migration/handoff runbook
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — Web Vitals and caching details
- [`docs/LOCAL_MOCK_SETUP.md`](docs/LOCAL_MOCK_SETUP.md) — MSW local development guide