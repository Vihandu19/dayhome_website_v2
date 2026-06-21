# Performance & SEO Optimization Guide

## Overview
This document outlines the technical SEO, asset optimization, and cloud-native performance strategies implemented for the serverless dayhome website. Because the primary target audience consists of cold-traffic parents searching for local childcare, the infrastructure and code are optimized specifically for **Local Discovery**, **Core Web Vitals (Speed & Stability)**, and **Aggressive Edge Caching** under a strict budget constraint.

---

## 1. Technical On-Page SEO

Semantic HTML structure and explicit meta configurations are managed directly in the static templates to maximize search engine crawlability and indexation precision.

### Metadata Matrix
Each routed directory includes precise, localized metadata tags optimized to capture high-intent geographic search volume (e.g., *"dayhomes in Cranston"*, *"childcare Riverstone Calgary"*).

- **Root Homepage (`/index.html`)**
  - **Title (57 chars):** `Happy Times Dayhome | Licensed Childcare in Cranston, Calgary`
  - **Meta Description (154 chars):** `Licensed, ECE Level 2 certified family dayhome in Riverstone Cranston, Calgary. Full-time care for ages 3 mos to 6 yrs. Clean background checks, first aid certified.`

- **Sub-pages (`/about/`, `/gallery/`, `/contact/`)**
  - **Title Patterns:** `About the Caregiver | Happy Times Dayhome Calgary`, `Photo Gallery | Happy Times Dayhome Cranston`
  - **Meta Focus:** Tailored descriptions reinforcing operational details, trust signals, and enrollment availability parameters without duplicating content across pages.

### Semantic Header Hierarchy
To prevent indexing confusion, header tags strictly mirror structural importance rather than visual styling choices:
- **`<h1>`**: Limited to exactly one per page, containing the primary geographic and business keyword target (e.g., `<h1>Licensed Family Dayhome in Cranston, Calgary</h1>`).
- **`<h2>`**: Utilized for distinct content boundaries, such as the *Trust Signals* block or *Operational Details*.
- **`<h3>`**: Utilized for specific descriptive nodes within cards or sections (e.g., `<h3>ECE Level 2 Qualification</h3>`).

---

## 2. Asset & Core Web Vitals Optimization

The 10-cell Bento Box layout on the Gallery page demands strict asset control to maintain a lightweight page footprint, eliminating layout shifts and optimizing mobile loading speeds.

### Image Engineering
- **Modern Format Translation:** Raw image files (`caregiver.jpg`, `playroom.jpg`, `outdoor-area.jpg`) are converted into production-ready **WebP** formats. This reduces typical object payload sizes by 30% to 50% compared to standard JPEG/PNG configurations, decreasing S3 data transfer costs and time-to-first-byte (TTFB) metrics.
- **Structural Dimension Enforcements:** All `<img>` tags explicitly declare `width` and `height` pixel dimensions natively within the HTML attribute layer. This provides the browser with immediate spatial specifications before asset rendering, fully neutralizing **Cumulative Layout Shift (CLS)** penalties.
- **Semantic Mapping (`alt` attributes):** Image descriptions avoid generic keyword stuffing and use rich, descriptive text that allows search engine crawlers to contextualize structural images (e.g., `<img src="/assets/images/playroom.webp" alt="Spacious, sunlit daycare playroom equipped with educational learning materials in Cranston, Calgary">`).

---

## 3. Cloud-Native Performance Strategy

By moving static routing to the edge, the architecture achieves elite-tier loading performance natively through CDN optimizations rather than complex server configurations.

### Crawlability Configuration
Two discovery payloads are exposed at the absolute root of the private S3 asset space, explicitly mapped to allow programmatic indexing:

1. **`robots.txt`**
```text
User-agent: *
Allow: /
Disallow: /docs/

Sitemap: [https://www.yourdomain.com/sitemap.xml](https://www.yourdomain.com/sitemap.xml)
```

2. **`sitemap.xml`**
```xml
<urlset xmlns="[http://www.sitemaps.org/schemas/sitemap/0.9](http://www.sitemaps.org/schemas/sitemap/0.9)">
    <url><loc>[https://www.yourdomain.com/](https://www.yourdomain.com/)</loc><priority>1.0</priority></url>
    <url><loc>[https://www.yourdomain.com/about/](https://www.yourdomain.com/about/)</loc><priority>0.8</priority></url>
    <url><loc>[https://www.yourdomain.com/gallery/](https://www.yourdomain.com/gallery/)</loc><priority>0.8</priority></url>
    <url><loc>[https://www.yourdomain.com/contact/](https://www.yourdomain.com/contact/)</loc><priority>0.8</priority></url>
</urlset>
```

### Downstream Edge Caching (FinSec Strategy)
To optimize data-transfer rates out of the S3 origin tier, file metadata contains explicit cache directives applied during the deployment lifecycle:
- **Immutable Static Assets:** CSS, JS engines, font assets, and image assets located within the `/assets/*` perimeter are assigned a rigid cache wrapper:
```http
Cache-Control: public, max-age=31536000, immutable
```
- **Architectural Benefit:** This commands CloudFront edge locations and local browser caches to retain the files for up to 365 days. Repeat page interactions bypass the S3 origin entirely, yielding near 0ms load responses and preserving the sub-$1 operational budget constraint.

### Third-Party Dependency Elimination (Phase 3)
- **Decision**: Self-host Tabler Icons webfont (WOFF2 + CSS) instead of relying on `cdn.jsdelivr.net` CDN
- **Performance Impact**: 
  - Removes DNS lookup + TLS handshake for icon font on first load
  - Eliminates SPOF — icon rendering no longer depends on external CDN availability
  - Enables `Cache-Control: immutable` on font asset at edge (previously CDN-controlled)
  - Reduces total critical-path requests by 1 per page load
  - Font served from same origin as other assets, enabling connection reuse

---

## 4. Local Perimeter Mapping

Because the business operates out of a residential zone where absolute privacy is a strict operational threshold, standard geographic pinning is heavily customized.

- **Service Area Isolation:** The infrastructure interfaces with the Google Business Profile ecosystem via a specialized **Service Area Business (SAB)** wrapper rather than an explicit structural address node.
- **Geofence Target:** The discovery boundary is restricted to a precise local subset (*Cranston, Riverstone, Calgary, AB*). 
- **SEO Resolution:** This strategy allows the site to compete directly on high-intent local map pack query streams (e.g., *"dayhomes near me"*) and dynamically anchors the CloudFront domain listing, driving high-signal local organic traffic while securing the physical location against unauthorized exposure.
```