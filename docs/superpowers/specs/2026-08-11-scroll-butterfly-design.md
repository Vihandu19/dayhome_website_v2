# Scroll-Linked Butterfly - Design

Date: 2026-08-11
Branch: `feature/scroll-butterfly`
Status: Approved, not yet implemented

## Summary

A stylized origami butterfly flies down the Home page as the visitor scrolls, leaving a
dotted trail that draws in behind it. The butterfly sits behind the page content and shows
through the whitespace. Its wings flap on a continuous time-based loop that is independent
of scroll speed.

Scope is the Home page only. About, Gallery, Contact and Error are untouched except for one
shared CSS rule noted below.

## Page geometry (measured 2026-08-11)

| Viewport | Document height | Scroll range |
|---|---|---|
| 1280 x 720 | 1765px | ~1045px (about 1.45 viewports) |
| 375 x 812 | 2764px | ~1950px |

The Home page is short, especially on desktop. The design is calibrated to a brief flight
rather than an elaborate journey.

Section offsets at 1280 x 720: nav 0 (h 77), hero 77 (h 455), about-section 532 (h 408),
info-bar 940 (h 194), cta-section 1134 (h 499), footer 1633 (h 133).

## Decisions

| Decision | Choice |
|---|---|
| Placement | Overlaying the content column, not the gutter |
| Layering | Behind text, cards and images; visible in whitespace |
| Trail reveal | Progressive, drawn in behind the butterfly |
| Reduced motion | Hidden entirely, JS never initialises |
| Scroll binding | CSS `scroll-timeline` primary, rAF plus lerp fallback |
| Path authoring | Generated in JS at 1:1 CSS pixel scale |

## Structural obstacle and its resolution

Every Home section paints an opaque white background. `.hero`, `.info-bar`, `.cta-section`
and `footer` all compute to `rgb(255,255,255)`; only `.about-section` is transparent. An
overlay placed genuinely behind the content would therefore be invisible across roughly 80%
of the page.

Resolution: set `.hero`, `.info-bar` and `.cta-section` to `background: transparent`. Since
`.site` is already `#ffffff` and those sections are also `#ffffff`, this is a visual no-op.

Scoping: `.hero` and `.info-bar` appear only in `index.template.html`. `.cta-section` is
shared with `about.template.html`, where `.site` is also white, so the change is a no-op
there too.

`footer` is also opaque white but is deliberately left alone: the flight ends at the CTA
button, above the footer, so nothing needs to show through it.

Recorded risk: this couples the Home layout to `.site` being white. If those surface tokens
are ever retinted, the sections will go see-through. This is documented in `docs/PROJECT.md`
rather than guarded against in code.

## Layer stack inside `.site`

- `.site` gains `position: relative` (currently `static`).
- Overlay SVG is the first child: `position: absolute; inset: 0; z-index: 0;
  pointer-events: none`.
- Each Home section gains `position: relative; z-index: 1`, so its content paints above the
  overlay while its box stays see-through.

Occlusion then falls out of the existing layout: the mint hero card, the photos and the
info tiles cover the butterfly, and it shows through in the gaps.

Residual: body copy has no background of its own, so the trail can pass behind the gaps
between lines of text. Mitigated by keeping the path off the main text column and verified
visually.

## Coordinate space

`offset-path` on an element resolves in that element's own box; a drawn `<path>` resolves in
the SVG `viewBox`. If the two disagree, the butterfly and trail separate at some viewport
widths. Stretching with `preserveAspectRatio="none"` is not a fix, as it distorts both dot
spacing and the glyph.

Resolution: `viewBox="0 0 W H"` where `W` is `.site`'s client width and `H` its scroll
height, making one user unit exactly one CSS pixel. Both values are set at runtime, so the
`d` attribute is generated in JS from anchor points held as fractions of `W` and `H`.

Accepted cost: this places a JS dependency in front of the CSS path. It runs once at init
and on resize, never per frame, so the scroll animation itself stays on the compositor.

Alternative considered and rejected: hand-author two fixed-aspect SVGs toggled at the 640px
breakpoint. Zero JS for the primary path, but two `d` strings to keep in sync and a
duplicated glyph.

## Path geometry

- Anchor points expressed as fractions of `W` and `H`, joined with smooth cubic beziers.
- Horizontal swing clamped to `min(0.22 * W, 150px)`, so it meanders visibly at 375px
  without becoming a wide zigzag at 900px. The clamp also keeps the path inside `.site`, so
  no overflow handling is needed.
- Seven anchors on desktop, four on mobile. This is the mobile path-complexity reduction,
  and it also shortens the walk for `getPointAtLength` in the fallback.
- The flight runs from just below the nav to the CTA button.
- Exact anchor positions to be tuned by eye against the rendered page.

## Scroll mapping

Scroll progress maps from the top of the document to the point where the footer enters view,
so the butterfly arrives at "Submit an inquiry" as that section lands and rests through the
final ~130px of footer scroll.

Expressed declaratively via `animation-range`, with `--bfly-rest` set to the footer height.

The footer is not the same height at both breakpoints (133px at 1280x720, 227px at 375x812),
so `--bfly-rest` cannot be a single hardcoded value. It is written by the same JS that sets
the viewBox, from the measured footer height, and refreshed by the resize observer. This
keeps it correct without duplicating a magic number per media query.

## The glyph

Origami rather than illustration: flat facets, straight edges, no curves.

- Each wing is two triangles in two tones of the existing palette, `#3B6D11` for the lit
  facet and `#97C459` for the folded one. The two-tone facet split is what reads as folded
  paper, with no shading or gradients.
- A hairline body and two antennae strokes.
- Roughly ten polygons total.
- Around 26px on desktop, 22px on mobile. Marginalia scale, not mascot scale.
- Reuses the same green as `.content-plant path`, so it reads as a sibling of the existing
  plant illustrations.

### Nesting

```
g.butterfly          <- offset-path, offset-distance, offset-rotate: auto
  g.butterfly-wings  <- wing-flap keyframes, never touched by scroll
    g.wing--l  g.wing--r
  path.butterfly-body
```

The flap lives on a nested group, so it composes with the path transform instead of
competing for the same property. This is what makes the wing animation independent of scroll
speed.

Flap: `scaleX` on each wing, hinged at the body centreline via `transform-box: fill-box`, on
a 700ms `ease-in-out` infinite loop. `offset-rotate: auto` turns the butterfly to face its
direction of travel.

## The trail

`#97C459`, `stroke-width: 2`, round caps, `stroke-dasharray: 2 10`, giving round dots with
generous spacing.

### Progressive reveal

`stroke-dashoffset` is already spoken for by the dot pattern, so animating it directly would
march the dots along the path like a marquee rather than reveal them.

The reveal therefore uses a second element: a thick stroked path used as a `<mask>` over the
dotted one, with `pathLength="100"` so its dashoffset is a plain 100-to-0 percentage and the
CSS never needs the real path length. This matters because the `d` is generated at runtime.

Recorded risk: an animated mask is the single most likely part of this to cost frames on a
low-end phone. Documented retreat if measurement shows a problem: drop the mask, reveal a
plain thin line, and keep the dots static.

## Motion binding

### CSS primary

```css
@supports (animation-timeline: scroll()) {
  .butterfly  { animation: bfly-fly linear both;
                animation-timeline: scroll(root block);
                animation-range: normal calc(100% - var(--bfly-rest)); }
  .trail-mask { animation: bfly-draw linear both;
                animation-timeline: scroll(root block);
                animation-range: normal calc(100% - var(--bfly-rest)); }
}
@keyframes bfly-fly  { to { offset-distance: 100%; } }
@keyframes bfly-draw { to { stroke-dashoffset: 0; } }
```

Confirmed supported in the preview engine (Chromium 148): `animation-timeline: scroll()`,
`offset-path`, `offset-distance`, `offset-rotate: auto`, `stroke-dashoffset`.

Wider support, checked 2026-08-11: current Chrome, Edge, Firefox and Safari all support
scroll-driven animations, at roughly 84% of global traffic. Secondary sources disagree on
the exact version floors (one gives Firefox 132+ and Safari 18+, another points to Safari
26), so pin the precise numbers against caniuse at implementation time. The decision does
not hinge on it: Safari does support it in current versions, so up-to-date iPhone traffic
gets the compositor path, and the remaining share falls to the fallback as intended.

Firefox note to verify: some sources report Firefox requires an explicit
`animation-duration` (any non-zero value) for a scroll-driven animation to run. Test this
and add the declaration if confirmed.

`animation-range` shorthand syntax with a `calc()` end value needs a quick validity check in
each engine before relying on it.

### Fallback

Once past the reduced-motion guard, `butterfly.js` runs setup (viewBox, generated `d`,
`offset-path`) on both paths, then checks `CSS.supports('animation-timeline','scroll()')`
and starts a loop only if false.

- Lerps a stored value toward scroll progress at ~0.12 per frame.
- Writes the same two properties as inline styles.
- Parks itself when `|target - current| < 0.0005` and restarts on the next scroll event, so
  it does not hold a rAF open on a static page.
- Butterfly and trail read from the same smoothed value, so a fast flick cannot desync the
  glyph from its own trail.

This smoothing is where the anti-jitter requirement lives. On the CSS path there is nothing
to smooth: position is already a pure function of scroll offset, evaluated off the main
thread.

Consequence to accept: the two paths feel subtly different. CSS tracks scroll rigidly; the
fallback trails behind it slightly.

## Degradation

| Condition | Behaviour |
|---|---|
| `prefers-reduced-motion: reduce` | `display: none` in CSS; JS returns before generating anything. No path, no listeners, no observer. Preference is checked once at init; a live mid-session toggle needs a reload. |
| JS disabled | Partial ships with `d=""`, so nothing paints and there is no stray artifact. |
| Scroll range <= 0 | Script bails and hides the overlay. |
| Print | Hidden via `@media print`. |
| Assistive tech | `aria-hidden="true"`, `focusable="false"`, `pointer-events: none`. |

Resize is handled by a `ResizeObserver` on `.site`, debounced ~150ms, recomputing the
viewBox and regenerating both the `d` and the `offset-path`. Observing `.site` rather than
the window catches content reflow as well as viewport change.

## Files

| File | Change |
|---|---|
| `partials/butterfly.svg` | New. Trail path plus butterfly glyph. Follows the existing plant-partial convention. |
| `build.js` | One line: `.replace('{{BUTTERFLY}}', partials.BUTTERFLY \|\| '')`, matching the plant placeholders. |
| `templates/index.template.html` | `{{BUTTERFLY}}` inside `.site`, plus a `butterfly.js` script tag. Home only. |
| `assets/css/styles.css` | New section: positioning, wing-flap keyframes, scroll-driven animations, `@supports` block, reduced-motion hide, print hide. Plus `position: relative` on `.site` and the three transparent section backgrounds. |
| `assets/js/butterfly.js` | New. Path generation plus the fallback loop. |
| `docs/PROJECT.md` | Document the component and the transparent-background coupling. |

`build.js` strips `<style>` blocks out of `.svg` partials, so all styling must live in
`styles.css`. This is consistent with how the plant partials work.

## Verification

There is no test framework in this repo; the existing `test-msw-*.js` files are ad-hoc
scripts. Verification is browser-driven. Playwright is already a dependency and is used for
the scripted parts.

1. Screenshot Home and About before and after the transparency change and confirm a genuine
   visual no-op.
2. At 1280x720 and 375x812, confirm the butterfly tracks the path and the trail draws in
   behind it, at several scroll positions.
3. Confirm the four-anchor mobile path renders as intended.
4. Performance: scripted smooth scroll at mobile viewport, counting long frames against a
   baseline with the overlay hidden. This measurement decides whether the animated mask
   survives or the documented retreat is taken.
5. Force the fallback loop on and hammer it with random `scrollTop` jumps; confirm it eases
   rather than teleporting.
6. Emulate reduced motion; confirm nothing renders and nothing is observed.
7. Confirm About, Gallery and Contact are undisturbed, particularly About via the shared
   `.cta-section` rule.
8. Rebuild and confirm `dist/index.html` contains the injected partial.

The measurement most likely to send this back to the drawing board is the mask on mobile.
Everything else is fairly predictable.
