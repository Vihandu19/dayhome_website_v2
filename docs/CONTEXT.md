# Dayhome Website

A serverless, cost-constrained public website for a licensed family dayhome business. Primary audience is cold-traffic parents actively searching for childcare in Calgary, AB.

## Language

**Inquiry**:
A parent's initial contact form submission expressing interest in enrollment.
_Avoid_: Lead, submission, message, request

**Parent**:
The adult (parent or legal guardian) who submits an Inquiry on behalf of a child.
_Avoid_: User, guardian, client, family (as a subject noun)

**Child**:
The minor being considered for enrollment. Not a user of the site.
_Avoid_: Kid, toddler, infant (as generic terms)

**Trust Signals**:
Verified credentials and affiliations displayed publicly to establish caregiver credibility for cold-traffic Parents.
_Avoid_: Qualifications section, credentials block, about info

**Care Schedule**:
The attendance pattern a Parent needs - full-time, part-time, or flexible.
_Avoid_: Schedule, hours needed, availability

**Age Range**:
The structured age bracket selected by a Parent on the Inquiry form. Values: Under 12 months / 1-2 years / 3-4 years / 5-6 years / Over 6 years. Out-of-range selections surface an inline message and block submission.
_Avoid_: Child age, age field, age input

## Architecture Decisions (Phase 1 - Structural Refactor)

### Build-Time Template Compilation
- **Decision**: Use a simple Node.js build script (`build.js`) to compile HTML templates with shared partials.
- **Reasoning**: No runtime cost, zero framework overhead, works with S3 static hosting. Single source of truth for nav/footer/modal eliminates duplication across 4 pages.
- **Implementation**: `partials/` (nav, footer, privacy-modal) + `templates/` (5 page templates) -> `build.js` -> generated HTML files with root-relative paths.

### Root-Relative Paths
- **Decision**: All asset links (`/assets/css/styles.css`, `/assets/js/...`) and internal links (`/about/`, `/gallery/`, `/contact/`) use root-relative paths.
- **Reasoning**: Solves the "relative path hell" problem permanently. Works regardless of directory nesting depth. CloudFront/S3 serves from root.

### Active Navigation State
- **Decision**: Nav partial uses placeholder tokens (`{{ACTIVE_HOME}}`, `{{ACTIVE_ABOUT}}`, etc.) replaced at build time with `class="active"`.
- **Reasoning**: Zero JS required for active state. No flash of unstyled content. Build script knows which page it's building.

### Error Page
- **Decision**: Added `error.template.html` generating `error.html` with full site branding (nav, footer, privacy modal).
- **Reasoning**: Project spec requires custom 404 page. Branded error page maintains trust signals and navigation for lost visitors.

### Contact Form Logic (Externalized — Phase 2)
- **Decision**: Contact page form validation/submission logic extracted to `assets/js/contact-form.js`, loaded via `<script src="/assets/js/contact-form.js">`.
- **Reasoning**: Maintainability — isolates interactive logic from template markup. Enables linting, testing, and caching separately from HTML. Inline script was ~45 lines; extraction keeps templates clean while preserving identical behavior (honeypot, age-range blocking, char counter, radio styling).

### Intentional Serif Stack & Readability (Phase 2)
- **Decision**: Typography defined via CSS custom properties: `--font-serif: Georgia, "Times New Roman", Times, serif`; `--line-height-body: 1.7`; `--letter-spacing-body: 0.01em`. Applied globally to `body`.
- **Reasoning**: Retains serif aesthetic (Times New Roman as primary) but ensures high-DPI rendering with Georgia as first choice. Increased line-height and slight letter-spacing prevent "default/broken" serif appearance; headings retain tight line-heights (1.18–1.3).

### Form & Icon Accessibility (Phase 2)
- **Decision**: All `<i>` icon elements include `aria-hidden="true"` (verified across 40+ instances). Form fields with helper text use `aria-describedby` (message→char-count, age-range→age-note).
- **Reasoning**: Decorative icons hidden from screen readers; descriptive labels linked to live regions for dynamic feedback (char counter, validation alert).

### Files Excluded from S3 Upload
- `partials/`, `templates/`, `build.js`, `docs/` - source files only needed at build time.
- Only generated HTML + `assets/` + `favicon.ico` go to S3.

## Phase 3: Asset Localization & Script Isolation

### Tabler Icons Localized (Phase 3)
- **Decision**: Download Tabler Icons WOFF2 + minified CSS to local `assets/fonts/` and `assets/css/`
- **Removed**: CDN dependency on `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css`
- **CSS Update**: Font path changed from `./fonts/tabler-icons.woff2` to `../fonts/tabler-icons.woff2` (relative from `assets/css/`)
- **Files Changed**: 10 HTML files (5 templates + 5 generated) now reference `/assets/css/tabler-icons.min.css`
- **Benefits**: Offline development, no third-party tracking, no CDN failure risk, identical visual rendering

### Script Resource Optimization (Phase 3)
- **Contact page only** (`/contact/`): Loads `contact-form.js` + `animations.js` + `main.js` (3 scripts)
- **All other pages** (Home, About, Gallery, Error): Load `animations.js` + `main.js` only (2 scripts)
- **Result**: No dead code execution on static informational pages; reduced JS parse/execution overhead
