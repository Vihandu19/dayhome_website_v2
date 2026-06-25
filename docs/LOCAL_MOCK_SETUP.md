# Local Mock Environment (MSW)

## Overview

Mock Service Worker (MSW) intercepts the contact form submission to `/submit-inquiry` and validates it using the same rules as the production AWS Lambda. This allows full end-to-end testing locally without deploying to AWS.

## How It Works

1. **Only activates on localhost** - Checks `window.location.hostname` before starting
2. **Intercepts POST to `/submit-inquiry`** - Same endpoint the production form uses
3. **Validates identically to Lambda** - Honeypot, required fields, email, phone, age range, message length
4. **Simulates SES Sandbox** - Documents that only verified emails receive messages
5. **Returns appropriate responses** - 200 for success/honeypot, 400 for validation errors

## Running Locally

```bash
# 1. Install dependencies (one-time)
npm install

# 2. Build site (compiles templates, bundles MSW worker with esbuild)
nmp run build

# 3. Start local server
npm run dev
# OR: npx serve .

```

## Validation Rules Tested

| Rule | Mock Behavior |
|------|---------------|
| Honeypot (`website` field) | Returns 200 OK silently, logs to console |
| Required fields | Returns 400 with field errors |
| Email format | RFC 5322 subset regex |
| Phone | Exactly 10 digits (US/CA) |
| Age range "Under 16 months" | Blocked client-side; Lambda would reject |
| Age range "Over 6 years" | Blocked client-side; Lambda would reject |
| Contact method | Must be Email/Phone/Either |
| Care schedule | Must be full-time/part-time/flexible |
| Message length | Max 1000 characters |
| SES Sandbox | Documented - only verified recipients |

## Console Output

Watch browser DevTools console for:

```
[MSW] Bundled worker loaded
[MSW] Mocking enabled.
[MSW] Mock Service Worker started on localhost
[MSW] Intercepting POST /submit-inquiry
[MSW] Valid submission received: { ageRange: '16-months-2-years', careSchedule: 'full-time', ... }
[MSW] Honeypot triggered - silent discard
```

## Zero Production Impact

- MSW worker **only starts on localhost/127.0.0.1**
- Dynamic script load in contact-form.js fails silently if file missing
- `mockServiceWorker.js` only copied to project root during local build
- `msw-worker.js` only bundled to `assets/` during local build
- GitHub Actions deploy excludes `mocks/`, `mockServiceWorker.js`, `msw-worker.js`
- No MSW code runs in production CloudFront distribution

## Architecture

```
Browser (localhost)
    │
    ▼
contact-form.js ───loads script──► assets/msw-worker.js (bundled IIFE)
    │                                     │
    │                              setupWorker(handlers)
    │                                     │
    │                              serviceWorker: /mockServiceWorker.js
    │                                     │
    ▼                                     ▼
POST /submit-inquiry ◄──intercepted── MSW Service Worker
    │                                     │
    │                              mocks/handlers.js
    │                              validateSubmission()
    │                                     │
    └────────── 200/400 response ◄────────┘
```

## File Structure

```
dayhome-website-v2/
├── mocks/
│   ├── handlers.js      # Validation rules & HTTP handlers
│   └── browser.js       # Worker initialization (localhost only)
├── mockServiceWorker.js     # Copied to root by build.js (for SW scope)
├── assets/
│   ├── mockServiceWorker.js # Also copied to assets (reference)
│   └── js/
│       ├── contact-form.js  # Loads MSW worker on localhost
│       └── msw-worker.js    # Bundled by esbuild (IIFE, gitignored)
├── docs/
│   └── LOCAL_MOCK_SETUP.md   # This file
└── package.json         # npm scripts: build, dev, test:msw
```

## Build Process

The build script (`build.js`) uses esbuild to bundle `mocks/browser.js` (with its imports from `msw/browser` and `mocks/handlers.js`) into a single self-contained IIFE file at `assets/msw-worker.js`. This avoids browser module resolution issues with MSW's internal dependencies.

The `mockServiceWorker.js` (from MSW's lib) is copied to the **project root** so the Service Worker registration scope covers all routes (`/`, `/contact/`, `/about/`, `/gallery/`, etc.).

## Updating Validation Rules

When the production Lambda validation changes, update `mocks/handlers.js`:

1. Modify `validateSubmission()` function
2. Run `npm run build` to re-bundle the worker
3. Test locally with `npm run dev`

The rules in `handlers.js` mirror:
- `client-side` validation in `assets/js/contact-form.js`
- `server-side` validation in AWS Lambda (per PROJECT.md)

## Test Scripts

```bash
# Full validation test (valid submission)
node test-msw-final.js

# Honeypot test (bot detection)
node test-msw-honeypot.js

# Client-side validation test
node test-msw-client-validation.js
```