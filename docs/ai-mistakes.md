# AI Mistake Catalogue

Patterns that have silently broken this codebase before. Load this when working on the relevant area.

## Build & Workflow

1. **Forgetting build after config change** — Edit `config.json`, run `node build-system.js`. Without it: stale data on main page and config builder dropdown.
2. **Fixing `scripts/*/index.html` without fixing `add-script.js`** — The template is at `add-script.js` ~line 170. The fix reappears on the next `node add-script.js` otherwise.

## JavaScript / Syntax

3. **`*/` in JSDoc comments** — `Shared across: scripts/*/index.html` closes the comment early. Use `scripts/* pages` or similar. Syntax error → theme.js won't load.
4. **`marked.js sanitize: true` is a no-op** — Removed in marked v8. Use `DOMPurify.sanitize(marked.parse(text))`; fall back to `sanitizeHTML(text)` not raw HTML.
5. **`marked.setOptions()` inside a per-call function** — Mutates global `marked.defaults` on every render. Use a module-level `_markedConfigured` flag. Also remove stale options like `smartypants: false` (removed in v8).
6. **`marked` CDN path changed in v17** — `marked.min.js` 404s; use `lib/marked.umd.js`.
7. **`== null` fails ESLint `eqeqeq` rule** — Write `=== null || === undefined` instead.
8. **`async` DOMContentLoaded without `.catch()`** — Use `(async function(){...})().catch(console.error)`; raw async callback swallows rejections.
9. **Async event listeners without `.catch()`** — `el.addEventListener('change', asyncFn)` swallows rejections. Use `() => asyncFn().catch(console.error)`.
10. **`innerHTML +=` destroys child event listeners** — Use `insertAdjacentHTML('beforeend', html)` to append.

## DOM & Scoping

11. **`document.querySelectorAll` inside OverlayEngine methods** — Use `this.container.querySelectorAll()` for class-scoped selectors; but `document.getElementById('overlay-toggle')` for `#overlay-toggle` (it lives outside the container).
12. **`initializeOverlayEngine()` can return null** — Always guard: `if (!engine) return;` before calling any engine method. Fix the generator too (`add-script.js`).
13. **Setting `img.src` before `onload`/`onerror`** — Register handlers first, set `src` last. Cached images fire synchronously.
14. **`element.style.background = 'var(--x)'`** — Assign via `.style.setProperty('background', 'var(--x)')` instead; direct assignment silently ignores `var()`.
15. **`lucide.createIcons()` per card** — Call once after `renderScriptCards` finishes; per-card `setTimeout` causes O(N) full-DOM scans.
16. **`setTimeout` for init waits** — Move the call into the same `DOMContentLoaded` listener that creates the instance instead.

## Security

17. **URL params into `innerHTML` without sanitization** — Always `sanitizeHTML(urlParams.get('key'))` before insertion.
18. **`getCurrentColorValue()` in `innerHTML` style strings** — Use `safeStyleColor()` / `getSafeColorValue()` instead; unknown color names pass through verbatim → CSS injection.
19. **User-controlled content in inline style attributes** — Apply `sanitizeHTML()` to style attribute values too, not just innerHTML content.
20. **`sanitizeHTML()` for URL path segments** — Use `encodeURIComponent()` for dynamic values in `href` paths; `sanitizeHTML` doesn't prevent URL injection.
21. **`pushState` without a `popstate` listener** — Pair every `window.history.pushState()` with `window.addEventListener('popstate', ...)` or Back/Forward shows stale content.

## CSS / Theme

22. **`body.theme-dark :root` selector** — Invalid. Use `body.theme-dark { --var: value; }` directly.
23. **`@media (prefers-color-scheme: dark)` in config-builder.html** — Use `body.theme-dark .selector` to match the rest of the codebase (two blocks: color swatches ~line 432, status messages ~line 364).
24. **`window.matchMedia()` for theme state** — Use `getEffectiveTheme()` from `theme.js`; `matchMedia` ignores the manual toggle.
25. **`#theme-indicator` reverted to `<div>`** — Must stay a `<button>` with `aria-label` for keyboard/screen-reader access.
26. **Stale CSS axis when repositioning absolute elements** — When setting `left`, also set `right: 'auto'`; same for `top`/`bottom`. Stale opposite-axis values cause invisible glitches.

## Accessibility

27. **`role="button"` without keydown handler** — Add `keydown` Enter/Space handler to fulfill the ARIA button contract; `focusin` alone is insufficient.
28. **Script cards as `<div>` + click handler** — Must be `<a href="scripts/${id}/index.html">` for keyboard navigation and right-click "Open in new tab". `a.script-card` in `main.css` resets link defaults.

## OverlayEngine internals

29. **Deleting the OverlayEngine class** — "Dead code" inside a class is not dead. Always check context before deleting multi-line blocks.
30. **Forgetting `this.tooltips.push(tooltip)`** — Tooltips not tracked in `this.tooltips[]` can't be removed by `clearOverlays()` → duplicates accumulate on resize.
31. **`overlay.line.segments` without null guard** — `overlay.description` can exist without `overlay.line`. Guard before accessing `.segments`.
32. **`initializeOverlayEngine()` returns null — no guard** — Rule #12 applies to every call site, including generated pages from `add-script.js`.
33. **Parallel implementations in engine vs builder** — `overlay-engine.js` and `config-builder.js` now share `resolveOverlayColor`, `safeStyleColor`, `renderMarkdown` via `js/overlay-utils.js`. When patching a shared method, grep for its name in both files and check the shared source first.
34. **`_deleteHotspot(index)` (dead index-based method)** — Must remain deleted; its presence risks regression (rules #27/#37 from original catalogue).
35. **`createHotspot()` IDs must be stable** — Use `generateUniqueId('hotspot')`; sequential `hotspot-${length+1}` collides after deletions.
36. **`positionTooltipForSegmentedLine` — empty segments guard** — Add `if (segments.length === 0) return;` before accessing `segments[0]` in both engine and builder preview.
37. **`dynamic onclick` — use ID not index** — Capture `hotspot.id`, use `findIndex` at click time; array indices go stale after deletions.
38. **ID-based methods must not delegate to index-based methods** — Inline the logic; delegating reintroduces the stale-index risk.
39. **`loadImageFromPath` race condition** — Use a `_loadSeq` counter; increment on call, check inside `onload` to abort stale loads when the user switches scripts quickly.
40. **`processMarkdown(null)` throws in marked v17+** — Guard with `if (text === null || text === undefined) return '';` at the top of both implementations.
41. **Deep-clone hotspots on load and export** — `JSON.parse(JSON.stringify(...))` on both `loadConfiguration()` and `exportConfiguration()`; direct references allow mutation to corrupt parsed data.
42. **Writing optional hotspot fields without guard** — Before `hotspot.description.content = val`, add `if (!hotspot.description) hotspot.description = {};`.
43. **`updatePropertiesPanel()` must guard optional fields** — `const segs = hotspot.line ? hotspot.line.segments : []` and `hotspot.description?.content ?? ''`.
44. **`loadImage(file)` declared `async` with no `await`** — Misleading; callers `await`-ing it get back immediately before the file is read.

## Config / HTML pages

45. **New script pages need DOMPurify before marked** — Load order: `dompurify/.../purify.min.js` then `marked/.../marked.umd.js`.
46. **Script pages with stale placeholder content** — `.script-content` div must be empty (populated from `description.md`); remove any `<h2>About This Script</h2>` or `<li>Professional After Effects integration</li>` left over from old templates.
47. **`replace_all: true` self-corrupting constant declarations** — Add the constant declaration as a targeted edit first, then do `replace_all` on usage sites; otherwise the constant's own initializer gets replaced → `ReferenceError`.
48. **CDN version pinning without verifying file paths** — Check `https://cdn.jsdelivr.net/npm/<package>@<version>/` to confirm the path exists before pinning.
49. **`utils.js` load order** — Must be: `utils.js` → `theme.js` → `overlay-defaults.js` → `overlay-utils.js` → `overlay-engine.js`.
50. **`generateUniqueId` must be in `projectBrowserGlobals`** — Register in `eslint.config.js` with other utils globals, or ESLint flags it as `no-undef`.
51. **HTML-callable functions need `/* exported funcName */`** — Prevents false "unused variable" ESLint warnings for functions only called from HTML `onclick` handlers.
52. **`lucide.createIcons({ nodes: [el] })` for targeted refresh** — Pass `{ nodes: [el] }` when only one element's icons changed to avoid a full DOM scan.
53. **Verify function parameters are consumed in the body** — A param listed in the signature but never read silently drops the caller's intent. Search the body for each param name after editing a signature.
54. **`this.currentImage` shape is path-dependent** — `loadImage(file)` sets `{ element, width, height, file }`, `loadImageFromPath` sets `{ element, width, height, path }`. Access both: `this.currentImage.path || this.currentImage.file?.name || 'screenshot.png'`.
55. **Tooltip visibility loops outside `overlays.forEach`** — `hoverTooltips` and `showAllTooltips` are container-wide lists; querying them inside `this.overlays.forEach` causes O(N²) DOM writes.
56. **`img.onerror` wipes container** — After `imageContainer.innerHTML = ...` in the onerror handler, reset `this.overlays = []; this.tooltips = [];` to remove stale references.
57. **`convertLegacyLineToSegments` mirrored in builder** — Check config-builder.js when editing this method in overlay-engine.js.
58. **`createHighlight`, `createSimpleLine`, `createLine` take overlay as parameter** — Never read overlay/scaleX/scaleY from instance state inside these methods; pass as explicit parameters.
