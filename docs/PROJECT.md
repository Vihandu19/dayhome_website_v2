# Serverless Website (AWS)

## Overview

This project is a fully serverless website for a small home business dayhome hosted on AWS. It includes static frontend pages (Home, About, Gallery, Contact) and a serverless backend for handling contact form submissions securely and cost-efficiently.

**Primary audience**: Cold-traffic parents actively searching for childcare - strangers with no prior relationship to the caregiver. All content prioritization decisions flow from this assumption.

The goal is to demonstrate practical AWS cloud architecture fundamentals (SAA-level) while keeping monthly cost under $1 and producing a functional and appealing front end.

---

## Pages

* **Home**: Landing page for cold-traffic parents. Includes a dedicated Trust Signals section (background checks, ECE Level 2, CPR certs, licensing) visible without navigating away. Credibility must be established on this page.
* **About**: Personal story page - caregiver motivation, childcare philosophy, and what makes the environment distinctive. Not a credentials dump.
* **Gallery**: Static image gallery hosted via S3.
* **Contact**: Form page that submits Inquiries to a backend API.

---

## Trust & Operational Requirements

To align with family dayhome business standards, the website must clearly communicate safety, qualifications, and operational transparency. **Trust Signals are displayed on the Home page** in a dedicated section. The About page carries the personal story, not the credentials.

### Required Trust Signals

* **Background Checks**
* Explicitly state that all adults in the home/facility have a clean Police Information Check with a Vulnerable Sector Search.


* **Staff Qualifications**
* Highlight certifications such as Early Childhood Educator (ECE) Level 2.


* **Emergency Preparedness**
* Display up-to-date Child Care First Aid & CPR certifications.


* **Licensing & Agency Affiliation**
* Indicate that the program is licensed.
* Emphasize compliance with government standards and regular inspections.



---

### Operational Details

The website must clearly communicate key operational information for parents:

* **Ages Accepted**
* Clearly specify age ranges served (3 months to 6 years).


* **Hours of Operation**
* Mon - Fri: 7:00 AM - 5:00 PM.


* **Location & Proximity**
* Provide general neighborhood or area description (Riverstone Cranston, Calgary AB).
* Do NOT publish exact home address for privacy and safety reasons.



---

## Design System

### Color Palette (60-30-10 rule)

This project uses a minimal, accessibility-conscious 60-30-10 color system to maintain visual hierarchy and consistency across all pages.

* **60% Primary Background**
* #FFFFFF
* Used for main page backgrounds and primary content areas


* **30% Secondary Surface**
* #D5F0C0
* Used for cards, section blocks, gallery containers, and form backgrounds


* **10% Accent Color**
* Used for buttons, links, hover states, and interactive UI elements



### Design Principles

* Keep layout minimal and content-first.
* Maintain clear visual hierarchy between static content and interactive elements.
* Ensure consistent spacing and reusable components across pages.
* Avoid introducing additional colors to preserve simplicity and maintainability.

### Motion Tokens (Phase 4)

* **`--motion-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1)`** - Standard ease-out for UI transitions (nav, modals, fade-in, button hover).
* **`--motion-spring: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`** - Organic spring curve for tactile interactions (card hover, icon scale hover, button press).

### Micro-Interactions (Phase 4)

* **Button press**: Primary buttons (`.btn-primary`, `.nav-cta`, `.ig-btn`, `.btn-submit`) scale to `0.98` on `:active` for tactile click feedback.
* **Card hover**: `.hero-card`, `.phil-card`, `.day-item` use `--motion-spring` for organic lift and shadow transition.
* **Icon hover**: `.story-img i`, `.tile-photo i` scale to `1.15` on hover using `--motion-spring`.

All micro-interactions respect `prefers-reduced-motion: reduce` - transitions are disabled and transforms are neutralized.

### Typography (Phase 2)

* **Font Stack**: `--font-serif: Georgia, "Times New Roman", Times, serif` - intentional serif aesthetic with high-DPI rendering priority (Georgia first, Times New Roman as primary fallback per design intent).
* **Body Readability**: `--line-height-body: 1.7`; `--letter-spacing-body: 0.01em` - applied globally to `body` for elegant serif legibility. Headings retain tight line-heights (1.18-1.3) for visual hierarchy.
* **CSS Variables**: All typography tokens defined in `:root` for maintainability and consistent application.

---

### Gallery Page (Bento Box Layout)

The Gallery page uses a bento-box style grid layout to present images in a structured yet visually dynamic format. Instead of uniform image tiles, the layout uses varied block sizes (small, wide, and large tiles) to create visual hierarchy and storytelling.

This design reflects a calm, home-like dayhome environment. Larger tiles highlight key activities (e.g., outdoor play), while smaller tiles show supporting daily moments (e.g., crafts, toys, and routines).

The layout is implemented using CSS Grid with responsive sizing to ensure consistency across devices while maintaining a clean and minimal aesthetic aligned with the overall design system.

#### Grid Spec

* **Total cells: 10** - 7 photo tiles + 3 text tiles.
* **Base grid: 3 columns**, CSS Grid with named areas for deterministic layout.
* **Tile types:**
* Small (1x1): tight moment shots - crafts, toys, snack setups.
* Wide (2x1): activity scenes - outdoor play, reading corner.
* Large (2x2): hero shot - the primary space or most inviting scene.
* Text (1x1 or 2x1): short copy overlays - e.g. "Licensed & Inspected", "ECE Level 2 Certified", hours blurb.


* **Fixed count** - always exactly 10 cells; no dynamic population, no pagination.
* **Mobile**: collapses to 1-column stack, text tiles remain readable at full width.

#### Photo Content Policy

* Children may appear in photos but must be shot without identifiable faces (from behind, hands/feet only, activity-focused framing).
* No exterior shots that reveal the home's appearance, street number, or surrounding landmarks.
* In-scope subjects: play areas, craft tables, toys, books, outdoor space, food/snack setups, and incidental child presence (faceless).
* No parental consent workflow required - faceless policy eliminates the need.

---

### Contact Page

The Contact page serves as the primary inquiry point for parents and guardians interested in enrolling their child. It is designed to be simple, structured, and low-friction while capturing essential information needed to assess suitability and availability.

#### Contact Form Fields

* Parent / Guardian Name
* Email Address
* Phone Number
* Preferred Contact Method (Email / Phone / Either)
* Child's Age
* Desired Start Date (Optional)
* Care Schedule Needed (Full-time / Part-time / Flexible)
* Message

#### Client-Side Validation Rules

The form implements real-time client-side validation as a strict firewall before invoking the AWS API Gateway. This reduces unnecessary Lambda invocations and protects the SES Sandbox sending limits.

| Field | Validation Rules | Error Message |
|-------|-----------------|---------------|
| Parent / Guardian Name | Required | "Full name is required" |
| Email Address | Required + valid email format (RFC 5322 subset) | "Please enter a valid email address" |
| Phone Number | Required + valid North American format (10 digits, flexible formatting) | "Please enter a valid phone number." |
| Preferred Contact Method | Required (one radio must be selected) | "Please select a preferred contact method" |
| Child's Age | Required + not "Over 6 years" | "We currently serve children 3 months to 6 years old" |
| Care Schedule Needed | Required | "Please select a care schedule" |
| Message | Required + max 1000 characters | "Message must be 1000 characters or fewer" |
| Honeypot (website) | Must be empty | Silent discard (no UI error) |

#### Validation Event Listeners

* **`blur`** - Validates field on focus loss, shows error if invalid
* **`input`** - Clears error immediately when user corrects input (real-time feedback)
* **`change`** - Radio group and age-range validate on selection change

#### Accessibility Patterns

* `aria-invalid="true/false"` toggled on each field to indicate validity state
* `role="alert"` with `aria-live="polite"` on error message containers for screen reader announcement
* `aria-describedby` links each field to its error container (when error exists)
* Focus management: on failed submission, first invalid field receives focus

#### Submit Button Soft Cooldown (UX Rate Limit)

On valid submission:
1. Submit button immediately disabled
2. Button text changes to "Submitted"
3. Button retains disabled state (no re-enable) - success overlay replaces form
4. Prevents accidental double-clicks and rapid re-submissions
5. Acts as a client-side complement to API Gateway native throttling (2 req/s, burst 5)

#### Form Design Intent

The form prioritizes clarity and ease of use while collecting only essential information required to evaluate initial fit. It avoids unnecessary complexity to ensure a smooth user experience, especially on mobile devices.

The inclusion of **Care Schedule Needed** helps determine availability alignment early in the process, while **Preferred Contact Method** ensures efficient communication with families.

#### What to Expect

Displayed publicly on the Contact page to set honest expectations for cold-traffic Parents. Intentionally transparent about the mutual-fit filter.

1. **Review of Inquiry** - Submission reviewed for availability alignment with the Parent's stated Care Schedule.
2. **Initial Phone Call** - If there is a potential fit, a short call is scheduled to discuss the child's needs, routines, and expectations.
3. **In-Person Tour** - Parent is invited to visit, meet the caregiver, see the environment, and ask questions.

Enrollment is subject to availability and mutual fit. This is a feature, not a hedge - it sets accurate expectations and filters poor-fit Inquiries early.

---

## Accessibility (Phase 2)

### Icon Handling
* All decorative `<i>` elements (Tabler icons) include `aria-hidden="true"` - 40+ instances verified across templates and generated pages.
* Prevents screen readers from announcing decorative icon glyphs.

### Form Field Descriptions
* **Message textarea**: `aria-describedby="char-count"` links to live character counter.
* **Age range select**: `aria-describedby="age-note"` links to conditional validation alert (role="alert").
* **Radio group**: `role="radiogroup"` with `aria-label="Preferred contact method"` on container.

### Semantic HTML
* `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` structure on all pages.
* `<section>` with `aria-label` where heading not visible (e.g., sidebar).
* `<form>` with `novalidate` - custom validation via JS, native browser validation retained for required fields.

### Motion Reduction
* `@media (prefers-reduced-motion: reduce)` disables all transitions/animations (styles.css:258-282).
* `.fade-in-section` renders immediately without transform/opacity delay.
* Button `:active` scale transforms (`.btn-primary`, `.nav-cta`, `.ig-btn`, `.btn-submit`) are neutralized.
* Card hover spring transitions (`.hero-card`, `.phil-card`, `.day-item`) are disabled.
* Icon hover scale transforms (`.story-img i`, `.tile-photo i`) are disabled.

---

## Architecture

### Frontend (Static Content Routing)

* **AWS CloudFront**: Serves as the single public entry point for the website, providing TLS termination (HTTPS) using a free AWS Certificate Manager (ACM) certificate.
* **Amazon S3**: Stores the static files (`.html`, `.css`, `.js`, and assets). S3 Static Website Hosting is disabled. The bucket remains 100% private.
* **CloudFront Origin Access Control (OAC)**: Restricts direct access to the S3 bucket. S3 evaluates a bucket policy that only permits `s3:GetObject` if the traffic originates from the verified CloudFront distribution, closing the HTTP security leak completely for $0 extra cost.

No frontend framework or server-side rendering is used to minimize cost and complexity.

---

### Backend (Serverless Form Processing)

* AWS Lambda (Node.js runtime)
* API Gateway (HTTP API)

Responsibilities:

* Receive contact form submissions
* Validate input (email format, required fields, message length max 1000 chars)
* Reject malformed or oversized requests
* Send structured Inquiry email via AWS SES

Validation rules:

* All fields except Desired Start Date: required
* Email: format validated (regex)
* Message: max 1000 characters; frontend shows live character counter so Parents self-regulate before submit
* Age Range: out-of-range value blocks submission at frontend; Lambda rejects it server-side as well
* Honeypot field: if populated, request silently discarded (no error returned to caller)

---

### Email Delivery

* AWS Simple Email Service (SES)
* Used to forward Inquiries to a verified email address
* **Sandbox Operational Boundary**: The AWS SES account intentionally remains in the SES Sandbox. Because the contact form forwards inbound inquiries strictly to the verified dayhome owner's inbox, requesting production access is unnecessary. This provides a hard infrastructure boundary against external spam routing at zero cost.
* Email is structured for fast triage - high-signal fields first:
1. Child's Age Range
2. Care Schedule Needed
3. Desired Start Date
4. Preferred Contact Method
5. Parent name + contact details
6. Message body

---

## CI/CD Pipeline (GitHub Actions)

### Overview

All deployments are automated via GitHub Actions. On every push to `main`, the pipeline compiles the site locally, syncs the output to S3, and invalidates the CloudFront cache - no manual AWS Console interaction required after initial setup.

The client (dayhome owner) edits content directly in the GitHub UI. Any save to `main` triggers a deploy automatically. From their perspective: edit a file, click commit, site updates in under 60 seconds.

### IAM Deployment User

A dedicated IAM user (`dayhome-gh-actions-deploy`) is created with a least-privilege inline policy scoped strictly to what the pipeline needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3SyncAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

**No console access. No other AWS permissions.** The access key ID and secret are stored as GitHub Actions repository secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) and never appear in code or logs.

### Workflow File

Location: `.github/workflows/deploy.yml`

```yaml
name: Deploy to S3

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build site
        run: node build.js

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Sync to S3
        run: |
          aws s3 sync . s3://${{ secrets.S3_BUCKET_NAME }} \
            --delete \
            --exclude "partials/*" \
            --exclude "templates/*" \
            --exclude "docs/*" \
            --exclude "build.js" \
            --exclude ".git/*" \
            --exclude ".github/*" \
            --exclude ".DS_Store" \
            --exclude "*.md"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Access key for `dayhome-gh-actions-deploy` IAM user |
| `AWS_SECRET_ACCESS_KEY` | Secret key for `dayhome-gh-actions-deploy` IAM user |
| `S3_BUCKET_NAME` | S3 bucket name (no `s3://` prefix) |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID (e.g. `E1ABCDEF123456`) |

### Client Content Management

The dayhome owner has collaborator access to the GitHub repository with **Write** role. They can edit any file directly in the GitHub UI without installing Git or touching AWS. Every commit to `main` triggers the pipeline automatically.

GitHub enforces a 100MB per-file limit and a 1GB repository soft cap - sufficient protection against accidental large asset uploads for a site of this scope.

---

## Storage Security: S3 Bucket Policy + OAC

### Design Intent

The S3 bucket is 100% private. **Block All Public Access is ON.** No object is directly reachable via an S3 URL. All traffic must flow through CloudFront, enforced at two layers:

1. **Origin Access Control (OAC)** - CloudFront cryptographically signs every request to S3 using SigV4. S3 can verify the signature and confirm the request originated from the authorized distribution.
2. **Bucket Policy** - Explicitly allows `s3:GetObject` only when the request comes from the specific CloudFront distribution. All other principals, including direct S3 URL access, are implicitly denied.

This eliminates the HTTP security leak present in older OAI (Origin Access Identity) setups and costs $0 extra.

### S3 Bucket Policy

Applied to the bucket after the CloudFront distribution is created. Replace placeholder values before applying.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOACOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

**Key design decisions:**
* `Principal` is scoped to `cloudfront.amazonaws.com` (the service), not a wildcard or IAM user.
* `Condition` pins the allow to a specific distribution ARN - not all CloudFront distributions in the account.
* `Action` is limited to `s3:GetObject` only. The deployment IAM user handles writes separately.
* No `s3:ListBucket` on the public policy - directory listing is not exposed.

### OAC Configuration (CloudFront Console)

When creating the CloudFront distribution:

1. Origin domain: select the S3 bucket (not the static website endpoint - use the REST endpoint: `your-bucket.s3.amazonaws.com`)
2. Origin access: select **Origin access control settings (recommended)**
3. Create a new OAC with:
   * Signing behavior: **Sign requests (recommended)**
   * Signing protocol: **SigV4**
4. Copy the generated bucket policy from the CloudFront console and apply it to the S3 bucket

**S3 Static Website Hosting must remain disabled.** Enabling it exposes a public HTTP endpoint that bypasses CloudFront entirely.

### Verification

After setup, confirm the security boundary holds:

```bash
# Direct S3 URL should return 403 Access Denied
curl -I https://YOUR_BUCKET_NAME.s3.amazonaws.com/index.html

# CloudFront URL should return 200 OK
curl -I https://YOUR_CLOUDFRONT_DOMAIN/index.html
```

A 403 on the direct S3 URL confirms OAC + bucket policy is working correctly.

---

## Performance & Discovery Optimization

For a detailed engineering breakdown of the on-page SEO strategy, Web Vitals asset optimization (WebP/CLS mitigation), and CloudFront edge caching configurations utilized to protect the project's financial guardrails, see [PERFORMANCE.md](./PERFORMANCE.md).

---

## Security Design Decisions

This project follows a security-by-default serverless design without the multi-dollar overhead of a VPC or a WAF.

### Edge & Storage Security

* S3 Bucket has **Block All Public Access** turned **ON**.
* CloudFront **Origin Access Control (OAC)** secures the origin channel via cryptographic request signing (SigV4).
* Direct bypass of the CDN via S3 URLs is blocked at the IAM layer via the S3 Bucket Policy - scoped to the specific CloudFront distribution ARN.

### CI/CD Security

* GitHub Actions uses a dedicated least-privilege IAM user (`dayhome-gh-actions-deploy`).
* Permissions scoped to `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the target bucket, and `cloudfront:CreateInvalidation` on the target distribution only.
* AWS credentials stored as GitHub Actions encrypted repository secrets - never in code or logs.
* Client (dayhome owner) has GitHub collaborator Write access for content editing. No AWS access granted.

### API Security

* Input validation performed in Lambda.
* Request size limits enforced at application level.
* CORS restricted to approved domain only.
* **Native Route Throttling**: API Gateway native throttling is explicitly configured on the submission route (e.g., standard rate limit of 2 requests per second, burst limit of 5). This builds a zero-cost financial guardrail against automated denial-of-wallet spamming without requiring an AWS WAF.

### IAM Security

* Lambda uses least-privilege IAM role.
* Permissions limited strictly to:
* `ses:SendEmail`
* CloudWatch Logs access

### Abuse Prevention (lightweight)

* Basic payload validation.
* Honeypot field for bot filtering (one hidden input, one Lambda check; silently discards filled submissions).
* No public database exposure.

### Notes

AWS WAF is excluded to maintain a strict <$1/month budget. CloudFront is included for TLS termination - at dayhome traffic scale (hundreds of visits/month) the cost is cents, not dollars. No custom VPC is used, as the Lambda function runs in the default public space to reach AWS SES for free, avoiding a costly $32+/month NAT Gateway requirement.

---

## Infrastructure Design

### AWS Services Used

* S3 (Static asset storage; private asset origin; S3 Static Website Hosting disabled)
* CloudFront (Public edge routing, OAC token signing, TLS termination via free ACM certificate)
* API Gateway (HTTP API endpoint with native route throttling)
* Lambda (Node.js form processor)
* SES (Email delivery gateway kept inside sandbox)
* CloudWatch Logs (Basic execution monitoring)

### DNS

* External domain provider (Route 53 hosted zones are bypassed to save $0.50/month base fee).
* CloudFront distribution domain name is mapped via a CNAME record at the external registrar.

### File Structure

```text
dayhome-website-v2/
|
├── .github/
│   └── workflows/
│       └── deploy.yml              <-- GitHub Actions CI/CD pipeline
|
├── index.html                  <-- Generated homepage (from template)
├── error.html                  <-- Generated custom 404 page (from template)
├── favicon.ico                 <-- Website tab icon
├── build.js                    <-- Build script (run locally before deploy)
|
├── partials/                   <-- Shared HTML components (source of truth)
│   ├── nav.html
│   ├── footer.html
│   └── privacy-modal.html
|
├── templates/                  <-- Page templates with placeholders
│   ├── index.template.html
│   ├── about.template.html
│   ├── gallery.template.html
│   ├── contact.template.html
│   └── error.template.html
|
├── about/
│   └── index.html              <-- Generated (URL: /about/)
|
├── gallery/
│   └── index.html              <-- Generated (URL: /gallery/)
|
├── contact/
│   └── index.html              <-- Generated (URL: /contact/)
|
├── assets/                     <-- Static assets (served via CloudFront)
│   ├── css/
│   │   ├── styles.css
│   │   └── tabler-icons.min.css  <-- Tabler Icons CSS (Phase 3: localized from CDN)
│   ├── js/
│   │   ├── main.js
│   │   ├── animations.js
│   │   └── contact-form.js       <-- Contact form logic (extracted Phase 2)
│   ├── fonts/
│   │   └── tabler-icons.woff2    <-- Tabler Icons font (Phase 3: localized from CDN)
│   └── images/
│       ├── caregiver.jpg
│       ├── playroom.jpg
│       └── outdoor-area.jpg
|
└── docs/                       <-- Kept locally (Exclude from S3 upload)
    ├── PROJECT.md
    └── CONTEXT.md

```

---

## Build & Deployment Process

### Local Compilation

Run locally before deploying to S3:

```bash
node build.js
```

This compiles templates with partials, injects active nav states, and writes final HTML with root-relative paths (`/assets/...`, `/about/`, etc.) that work at any directory depth.

### Asset Localization (Phase 3)
- **Decision**: Remove external CDN dependency for Tabler Icons webfont. Download WOFF2 font and minified CSS locally into `assets/fonts/` and `assets/css/`.
- **Reasoning**: Eliminates third-party tracking risk, enables fully offline development, removes runtime network dependency for icon rendering. Font path in CSS updated from `./fonts/...` to relative `../fonts/...` to resolve from `assets/css/`.
- **Impact**: All 10 HTML files (5 templates + 5 generated) now reference `/assets/css/tabler-icons.min.css` locally. Visual parity maintained - identical icon rendering.

### Resource Optimization - Script Isolation (Phase 3)
- **Decision**: Verify `contact-form.js` loads exclusively on the contact page layout; `animations.js` and `main.js` load on all pages.
- **Reasoning**: Prevents dead code execution on static informational pages (Home, About, Gallery, Error). Reduces unnecessary JS parsing/execution.
- **Implementation**: Template structure already enforced this isolation - `contact.template.html` includes all three scripts; other templates include only `animations.js` and `main.js`. Build process preserves this correctly in generated pages.

### Files Excluded from S3 Upload
- `partials/`, `templates/`, `build.js`, `docs/`, `.github/` - source files only needed at build time or CI/CD.
- Only generated HTML + `assets/` + `favicon.ico` go to S3.

### Deployment Mechanics

**Automated (primary)**: GitHub Actions triggers on every push to `main`. The pipeline runs `build.js`, syncs to S3, and invalidates CloudFront. No manual steps required.

**Manual fallback**: Direct AWS CLI deployment if pipeline is unavailable.

```bash
# 1. Compile templates
node build.js

# 2. Sync compiled site and assets to the private S3 bucket
aws s3 sync . s3://your-dayhome-s3-bucket-name \
  --delete \
  --exclude "partials/*" \
  --exclude "templates/*" \
  --exclude "docs/*" \
  --exclude "build.js" \
  --exclude ".git/*" \
  --exclude ".github/*" \
  --exclude ".DS_Store" \
  --exclude "*.md"

# 3. Invalidate CloudFront edge caches
aws cloudfront create-invalidation \
  --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"
```
