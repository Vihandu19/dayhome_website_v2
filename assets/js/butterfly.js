/**
 * Scroll-linked butterfly (home page only).
 *
 * Always: sizes the overlay viewBox 1:1 with CSS pixels and generates the
 * flight path, so offset-path and the drawn trail share one coordinate space.
 * Only when the browser lacks CSS scroll-driven animation: runs a rAF loop
 * that lerps toward scroll progress and writes the same two properties the
 * CSS would have animated.
 */
document.addEventListener('DOMContentLoaded', function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const site = document.querySelector('.site');
  const svg = document.querySelector('.bfly-track');
  if (!site || !svg) return;

  const trail = svg.querySelector('.bfly-trail');
  const mask = svg.querySelector('.bfly-trail-mask');
  const bfly = svg.querySelector('.bfly');
  if (!trail || !mask || !bfly) return;

  const nav = site.querySelector('nav');
  const footer = site.querySelector('footer');
  const cta = site.querySelector('.cta-section .btn-primary');
  const wings = svg.querySelectorAll('.bfly-wing');

  const native = window.CSS && CSS.supports('animation-timeline', 'scroll()');

  let frame = 0;
  let current = 0;
  let resizeTimer = 0;
  let flaps = 14;

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  // Anchors as fractions of the column, so the meander keeps its character at
  // any width. Swing is clamped so it stays inside .site and never overflows.
  // Anchor count is set against the wave so it stays well sampled - too few
  // points per half-cycle and the bezier smoothing flattens the meander out.
  function anchors(width, startY, endY) {
    const narrow = width <= 640;
    const count = narrow ? 6 : 9;
    const turns = narrow ? 1.5 : 2;
    // Narrow screens have no slack in the centre, so ride the ragged right
    // edge of the text where the whitespace actually is.
    const amp = narrow ? width * 0.14 : Math.min(width * 0.22, 150);
    const mid = narrow ? width * 0.76 : width * 0.5;
    const points = [];

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      points.push([mid + Math.sin(t * Math.PI * turns) * amp, startY + (endY - startY) * t]);
    }

    return points;
  }

  // Catmull-Rom through the anchors, converted to cubic beziers.
  function toPath(points) {
    if (points.length < 2) return '';

    let d = 'M' + round(points[0][0]) + ' ' + round(points[0][1]);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || points[i + 1];

      d += 'C' + round(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + round(p1[1] + (p2[1] - p0[1]) / 6) +
           ',' + round(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + round(p2[1] - (p3[1] - p1[1]) / 6) +
           ',' + round(p2[0]) + ' ' + round(p2[1]);
    }

    return d;
  }

  function restHeight() {
    return footer ? footer.offsetHeight : 0;
  }

  // Sections are position:relative for stacking, which makes offsetTop relative
  // to the section rather than to .site. Measure against .site instead.
  function topWithinSite(el) {
    return el.getBoundingClientRect().top - site.getBoundingClientRect().top;
  }

  function apply(value) {
    bfly.style.offsetDistance = (value * 100).toFixed(2) + '%';
    mask.style.strokeDashoffset = (100 - value * 100).toFixed(2);

    // Fallback only: CSS drives the wings off the same timeline where it can.
    // Beats track scroll position, so the wings hold still when the page does.
    const open = 0.65 + 0.35 * Math.cos(2 * Math.PI * value * flaps);
    for (let i = 0; i < wings.length; i++) {
      const s = wings[i].classList.contains('bfly-wing--m') ? -open : open;
      wings[i].style.transform = 'scaleY(' + s.toFixed(3) + ')';
    }
  }

  function progress() {
    const max = document.documentElement.scrollHeight - window.innerHeight - restHeight();
    if (max <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / max));
  }

  function tick() {
    const target = progress();
    current += (target - current) * 0.12;

    // Park the loop once it has settled; a scroll event restarts it.
    if (Math.abs(target - current) < 0.0005) {
      current = target;
      apply(current);
      frame = 0;
      return;
    }

    apply(current);
    frame = window.requestAnimationFrame(tick);
  }

  function kick() {
    if (!frame) frame = window.requestAnimationFrame(tick);
  }

  function layout() {
    const width = site.clientWidth;
    const height = site.scrollHeight;
    const startY = (nav ? topWithinSite(nav) + nav.offsetHeight : 0) + 40;
    const endY = cta ? topWithinSite(cta) + cta.offsetHeight / 2 : height * 0.9;

    if (width <= 0 || endY - startY < 100) {
      svg.style.display = 'none';
      return false;
    }

    svg.style.display = '';
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    const d = toPath(anchors(width, startY, endY));
    trail.setAttribute('d', d);
    mask.setAttribute('d', d);
    bfly.style.offsetPath = 'path("' + d + '")';

    document.documentElement.style.setProperty('--bfly-rest', restHeight() + 'px');

    // One beat per ~90px of scroll, so the rate feels the same on a short
    // desktop page and a long phone one.
    const range = document.documentElement.scrollHeight - window.innerHeight - restHeight();
    flaps = Math.max(6, Math.min(40, Math.round(range / 90)));
    document.documentElement.style.setProperty('--bfly-flaps', String(flaps));

    if (!native) {
      current = progress();
      apply(current);
    }

    return true;
  }

  // .site can still measure zero on the first frame after DOMContentLoaded, so
  // retry across a few frames rather than latching the hidden state.
  function ensureLayout(attempts) {
    if (layout() || attempts <= 0) return;
    window.requestAnimationFrame(function() { ensureLayout(attempts - 1); });
  }

  ensureLayout(10);

  // Images settling changes .site's height, so the path needs regenerating.
  window.addEventListener('load', layout);

  if (!native) {
    window.addEventListener('scroll', kick, { passive: true });
    kick();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(function() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    }).observe(site);
  }
});
