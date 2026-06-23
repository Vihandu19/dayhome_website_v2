#!/usr/bin/env node
/**
 * Build script for dayhome-website-v2
 * Compiles templates with partials into final HTML files
 * Uses root-relative paths for all assets and links
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// Read all partials (.html and .svg)
const partials = {};
fs.readdirSync(PARTIALS_DIR).forEach(file => {
  const ext = path.extname(file);
  if (ext === '.html' || ext === '.svg') {
    let content = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8');
    // For SVG files, strip internal <style> blocks so CSS fill can take effect
    if (ext === '.svg') {
      content = content.replace(/<style>[\s\S]*?<\/style>/g, '');
    }
    const name = path.basename(file, ext).toUpperCase();
    partials[name] = content;
  }
});

// Page configurations: template -> output path + active nav item
const pages = [
  {
    template: 'index.template.html',
    output: 'index.html',
    active: 'HOME'
  },
  {
    template: 'about.template.html',
    output: 'about/index.html',
    active: 'ABOUT'
  },
  {
    template: 'gallery.template.html',
    output: 'gallery/index.html',
    active: 'GALLERY'
  },
  {
    template: 'contact.template.html',
    output: 'contact/index.html',
    active: 'CONTACT'
  },
  {
    template: 'error.template.html',
    output: 'error.html',
    active: 'NONE'  // No active nav on error page
  }
];

function buildPage(page) {
  const templatePath = path.join(TEMPLATES_DIR, page.template);
  let template = fs.readFileSync(templatePath, 'utf8');

  // Build nav with active state
  let nav = partials.NAV;
  const activeStates = {
    HOME: '',
    ABOUT: '',
    GALLERY: '',
    CONTACT: ''
  };
  if (page.active !== 'NONE') {
    activeStates[page.active] = 'class="active"';
  }
  nav = nav
    .replace('{{ACTIVE_HOME}}', activeStates.HOME)
    .replace('{{ACTIVE_ABOUT}}', activeStates.ABOUT)
    .replace('{{ACTIVE_GALLERY}}', activeStates.GALLERY)
    .replace('{{ACTIVE_CONTACT}}', activeStates.CONTACT);

  // Replace all placeholders
  const output = template
    .replace('{{NAV}}', nav)
    .replace('{{FOOTER}}', partials.FOOTER)
    .replace('{{PRIVACY_MODAL}}', partials.PRIVACY_MODAL)
    .replace('{{SMALL_PLANT}}', partials.SMALL_PLANT || '')
    .replace('{{MEDIUM_PLANT}}', partials.MEDIUM_PLANT || '')
    .replace('{{LARGE_PLANT}}', partials.LARGE_PLANT || '')
    .replace('{{XLARGE_PLANT}}', partials.XLARGE_PLANT || '');

  // Ensure output directory exists
  const outputDir = path.dirname(path.join(ROOT, page.output));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write final HTML
  fs.writeFileSync(path.join(ROOT, page.output), output);
  console.log(`✓ Generated ${page.output}`);
}

// Build all pages
console.log('Building site...\n');
pages.forEach(buildPage);

// Bundle MSW mock worker for local development (localhost only)
async function bundleMswWorker() {
  const mswWorkerSrc = path.join(ROOT, 'mocks', 'browser.js');
  const mswWorkerDest = path.join(ROOT, 'assets', 'msw-worker.js');

  if (!fs.existsSync(mswWorkerSrc)) {
    console.warn('⚠ MSW worker source not found at:', mswWorkerSrc);
    return;
  }

  try {
    await esbuild.build({
      entryPoints: [mswWorkerSrc],
      bundle: true,
      outfile: mswWorkerDest,
      format: 'iife',
      globalName: 'mswWorker',
      platform: 'browser',
      target: 'es2020',
      minify: false,
      sourcemap: false,
    });
    console.log('✓ Bundled MSW worker to assets/msw-worker.js');
  } catch (error) {
    console.error('⚠ Failed to bundle MSW worker:', error.message);
  }
}

// Copy MSW service worker (for Service Worker registration)
// Copy to project root so Service Worker scope covers all routes (/, /contact/, /about/, etc.)
const mswWorkerSrc = path.join(ROOT, 'node_modules', 'msw', 'lib', 'mockServiceWorker.js');
const mswWorkerDest = path.join(ROOT, 'mockServiceWorker.js');
if (fs.existsSync(mswWorkerSrc)) {
  fs.copyFileSync(mswWorkerSrc, mswWorkerDest);
  console.log('✓ Copied MSW service worker to project root (for SW scope)');
} else {
  console.warn('⚠ MSW service worker not found at:', mswWorkerSrc);
}

// Also copy to assets/ for reference
const mswWorkerDestAssets = path.join(ROOT, 'assets', 'mockServiceWorker.js');
if (fs.existsSync(mswWorkerSrc)) {
  fs.copyFileSync(mswWorkerSrc, mswWorkerDestAssets);
}

// Run MSW worker bundling
bundleMswWorker().then(() => {
  console.log('\nBuild complete!');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});