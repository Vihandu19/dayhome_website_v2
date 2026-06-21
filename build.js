#!/usr/bin/env node
/**
 * Build script for dayhome-website-v2
 * Compiles templates with partials into final HTML files
 * Uses root-relative paths for all assets and links
 */

const fs = require('fs');
const path = require('path');

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
console.log('\nBuild complete!');