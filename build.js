#!/usr/bin/env node
/**
 * Build script for dayhome-website-v2
 * Compiles templates with partials into final HTML files in /dist
 * Uses root-relative paths for all assets and links
 * MSW bundling only runs in development (NODE_ENV !== 'production')
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PARTIALS_DIR = path.join(ROOT, 'partials');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const ASSETS_DIR = path.join(ROOT, 'assets');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Clean and create /dist directory
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Read all partials (.html and .svg)
const partials = {};
fs.readdirSync(PARTIALS_DIR).forEach(file => {
  const ext = path.extname(file);
  if (ext === '.html' || ext === '.svg') {
    let content = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8');
    if (ext === '.svg') {
      content = content.replace(/<style>[\s\S]*?<\/style>/g, '');
    }
    const name = path.basename(file, ext).toUpperCase();
    partials[name] = content;
  }
});

// Page configurations: template -> output path + active nav item
const pages = [
  { template: 'index.template.html', output: 'index.html', active: 'HOME' },
  { template: 'about.template.html', output: 'about/index.html', active: 'ABOUT' },
  { template: 'gallery.template.html', output: 'gallery/index.html', active: 'GALLERY' },
  { template: 'contact.template.html', output: 'contact/index.html', active: 'CONTACT' },
  { template: 'error.template.html', output: 'error.html', active: 'NONE' }
];

function buildPage(page) {
  const templatePath = path.join(TEMPLATES_DIR, page.template);
  let template = fs.readFileSync(templatePath, 'utf8');

  let nav = partials.NAV;
  const activeStates = { HOME: '', ABOUT: '', GALLERY: '', CONTACT: '' };
  if (page.active !== 'NONE') {
    activeStates[page.active] = 'class="active"';
  }
  nav = nav
    .replace('{{ACTIVE_HOME}}', activeStates.HOME)
    .replace('{{ACTIVE_ABOUT}}', activeStates.ABOUT)
    .replace('{{ACTIVE_GALLERY}}', activeStates.GALLERY)
    .replace('{{ACTIVE_CONTACT}}', activeStates.CONTACT);

  const output = template
    .replace('{{NAV}}', nav)
    .replace('{{FOOTER}}', partials.FOOTER)
    .replace('{{PRIVACY_MODAL}}', partials.PRIVACY_MODAL)
    .replace('{{SMALL_PLANT}}', partials.SMALL_PLANT || '')
    .replace('{{MEDIUM_PLANT}}', partials.MEDIUM_PLANT || '')
    .replace('{{LARGE_PLANT}}', partials.LARGE_PLANT || '')
    .replace('{{XLARGE_PLANT}}', partials.XLARGE_PLANT || '')
    .replace('{{BUTTERFLY}}', partials.BUTTERFLY || '');

  const outputDir = path.dirname(path.join(DIST, page.output));
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(DIST, page.output), output);
  console.log(`✓ Generated dist/${page.output}`);
}

console.log('Building site...\n');
pages.forEach(buildPage);

// Copy static assets to /dist (synchronous, completes before MSW step)
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(ASSETS_DIR, path.join(DIST, 'assets'));
console.log('✓ Copied assets/ to dist/assets/');

fs.copyFileSync(path.join(ROOT, 'sitemap.xml'), path.join(DIST, 'sitemap.xml'));
fs.copyFileSync(path.join(ROOT, 'robots.txt'), path.join(DIST, 'robots.txt'));
fs.copyFileSync(path.join(ROOT, 'google659f7d4e9d3e2ab4.html'), path.join(DIST, 'google659f7d4e9d3e2ab4.html'));
console.log('✓ Copied sitemap.xml and robots.txt to dist/');

// MSW bundling — ONLY in development, targets /dist directly
async function bundleMswWorker() {
  if (IS_PRODUCTION) {
    console.log('✓ Production build — skipping MSW bundling');
    return;
  }

  const mswWorkerSrc = path.join(ROOT, 'mocks', 'browser.js');
  // Output DIRECTLY into /dist/assets so local server finds it
  const mswWorkerDest = path.join(DIST, 'assets', 'msw-worker.js');

  if (!fs.existsSync(mswWorkerSrc)) {
    console.warn('⚠ MSW worker source not found at:', mswWorkerSrc);
    return;
  }

  // Ensure dist/assets exists (it does from copyRecursive above)
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

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
    console.log('✓ Bundled MSW worker to dist/assets/msw-worker.js');
  } catch (error) {
    console.error('⚠ Failed to bundle MSW worker:', error.message);
  }

  // Copy mockServiceWorker.js to /dist ROOT (for SW scope over all routes)
  const mswRuntimeSrc = path.join(ROOT, 'node_modules', 'msw', 'lib', 'mockServiceWorker.js');
  const mswRuntimeDest = path.join(DIST, 'mockServiceWorker.js');
  if (fs.existsSync(mswRuntimeSrc)) {
    fs.copyFileSync(mswRuntimeSrc, mswRuntimeDest);
    console.log('✓ Copied MSW service worker to dist/ (for SW scope)');
  } else {
    console.warn('⚠ MSW service worker not found at:', mswRuntimeSrc);
  }
}

await bundleMswWorker();
console.log('\nBuild complete! Output in /dist');