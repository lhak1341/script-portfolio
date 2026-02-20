# After Effects Scripts Portfolio - AI Development Guide

**🌐 Live Site**: https://lhak1341.github.io/script-portfolio

> This is the AI-focused quick reference. For comprehensive documentation, see [docs/](docs/) directory.

---

## Critical Workflows (MUST Follow)

### After Changing config.json

```bash
node build-system.js  # REQUIRED - syncs 3 data sources
```

**Why**: Config changes don't auto-propagate. Build syncs:
- `scripts/{id}/config.json` → `data/scripts-list.json` → `tools/config-builder.js`

**Forgetting this** → Stale data on main page + config builder dropdown

### After Adding New Script

```bash
node add-script.js script-id "Name" "1.0.0" "Description" "category" "tag1,tag2"
node build-system.js  # REQUIRED
```

### Running Locally

```bash
python3 -m http.server 8000  # HTTP server REQUIRED (not file://)
```

**Why**: Browser CORS blocks `fetch()` to `file://` URLs

---

## Common AI Mistakes (Learn from These!)

### ❌ Theme.js Comment Syntax Error

**WRONG**:
```javascript
/**
 * Shared across: scripts/*/index.html  // ← */ closes comment early!
 */
```

**RIGHT**:
```javascript
/**
 * Shared across: script pages  // Avoid */ in comments
 */
```

**Impact**: Syntax error, theme.js won't load, theme toggle breaks

### ❌ CSS Theme Override Syntax

**WRONG**:
```css
body.theme-dark :root {  /* Can't select :root inside body */
  --bg-primary: #0a0a0a;
}
```

**RIGHT**:
```css
body.theme-dark {  /* Variables directly on body */
  --bg-primary: #0a0a0a;
}
```

**Impact**: Theme toggle doesn't work, colors don't change

### ❌ Deleting Entire OverlayEngine Class

**Mistake**: Removing "dead code" without checking if it's inside a class
**Impact**: Website loads but scripts don't render, setupToggleButton error
**Prevention**: Always check context before deleting multi-line blocks

### ❌ Forgetting Build After Config Change

**Mistake**: Edit `config.json`, refresh browser, expect changes
**Reality**: Build system required to propagate changes
**Fix**: Always run `node build-system.js` after config edits

### ❌ marked.js `sanitize: true` Does Nothing

**WRONG** (silently ignored in marked v8+, which is what the CDN serves):
```javascript
marked.setOptions({ sanitize: true });
return marked.parse(text);
```

**RIGHT** — use DOMPurify on output, fall back to plain text (never raw HTML):
```javascript
const html = marked.parse(text);
// DOMPurify unavailable: fall back to plain text, NOT raw html
return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : sanitizeHTML(text);
```

**Impact**: Live XSS if `sanitize: true` is relied on — the option was removed in marked v8

### ❌ Reading Theme State With `window.matchMedia()` Directly

**WRONG** — ignores manual theme toggle (`currentTheme` override in theme.js):
```javascript
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

**RIGHT** — respects auto/light/dark user override:
```javascript
const isDark = typeof getEffectiveTheme !== 'undefined'
    ? getEffectiveTheme() === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### ❌ Fixing Script Pages Without Fixing the Generator

**Mistake**: Fix a pattern in `scripts/*/index.html` but forget `add-script.js` (the template)
**Impact**: Next `node add-script.js` regenerates the vulnerability
**Fix**: Always apply the same fix to `add-script.js` line ~290 when fixing script page templates

### ❌ `document.querySelectorAll` Inside OverlayEngine Methods

**WRONG** — affects all engines if multiple exist on the page:
```javascript
const hoverTooltips = document.querySelectorAll('.hover-tooltip');
```

**RIGHT** — scope to the instance's container:
```javascript
const hoverTooltips = this.container.querySelectorAll('.hover-tooltip');
```

**Impact**: Wrong engine's tooltips toggled; always use `this.container.querySelectorAll` inside OverlayEngine methods

### ❌ Scoping `#overlay-toggle` to `this.container`

**Mistake**: Using `this.container.querySelector('#overlay-toggle')` in `setupToggleButton()` / `toggleShowAll()`
**Reality**: `#overlay-toggle` lives *above* the engine container in the DOM (it's a sibling, not a child) — must use `document.getElementById('overlay-toggle')`
**Impact**: Toggle silently stops working — querySelector returns null, no error thrown
**Rule**: The `this.container` scoping rule applies to class selectors (`.hover-tooltip` etc.), not to the toggle which is outside the container

### ❌ Using `== null` in null guards (ESLint `eqeqeq` rule)

**WRONG** (fails lint):
```javascript
if (str == null) return '';
```

**RIGHT**:
```javascript
if (str === null || str === undefined) return '';
```

### ❌ Forgetting to Populate `this.tooltips[]` When Appending Tooltips

**Mistake**: Tooltips appended to `imageContainer` but not pushed to `this.tooltips[]`
**Impact**: `clearOverlays()` can't remove them → duplicate tooltip nodes accumulate on every resize
**Fix**: Always `this.tooltips.push(tooltip)` after `imageContainer.appendChild(tooltip)`

### ❌ `@media (prefers-color-scheme: dark)` in config-builder.html

**WRONG** — ignores manual theme toggle (two blocks: color swatches ~line 432, status messages ~line 364):
```css
@media (prefers-color-scheme: dark) { .color-swatch.red { ... } }
```

**RIGHT** — matches the rest of the codebase:
```css
body.theme-dark .color-swatch.red { ... }
```

**Impact**: Swatches and status colors don't update when user manually toggles theme

### ❌ Pinning CDN Versions Without Verifying File Paths

**marked v17+ moved the browser file** — `marked.min.js` no longer exists at the package root:

**WRONG** (404 in marked v17+):
```html
<script src="https://cdn.jsdelivr.net/npm/marked@17.x.x/marked.min.js"></script>
```

**RIGHT** — UMD browser build:
```html
<script src="https://cdn.jsdelivr.net/npm/marked@17.x.x/lib/marked.umd.js"></script>
```

**Impact**: `marked` is undefined → `processMarkdown` falls back to `sanitizeHTML(text)` → raw markdown renders as plain text on all script pages

**Note**: jsDelivr `@latest` can lag behind npm's actual latest. Always verify the file path exists for the pinned version by browsing `https://cdn.jsdelivr.net/npm/<package>@<version>/`.

### ❌ URL Params into innerHTML Without Sanitization

**WRONG**:
```javascript
element.innerHTML = `Showing "${urlParams.get('tag')}"`;
```

**RIGHT**:
```javascript
element.innerHTML = `Showing "${sanitizeHTML(urlParams.get('tag'))}"`;
```

**Impact**: XSS via crafted URL (e.g. `?tag=<img src=x onerror=alert(1)>`)

### ❌ Setting `img.src` Before `onload`/`onerror`

**WRONG** — handler may not be registered before cached images fire synchronously:
```javascript
img.src = url;
img.onload = () => { ... };  // Too late for cached images
```

**RIGHT** — always register handlers before assigning `src`:
```javascript
img.onload = () => { ... };
img.onerror = () => { ... };
img.src = url;  // Set LAST
```

**Impact**: Overlays silently fail to render on repeat page visits (cache hit)

### ❌ Async Event Listeners Without `.catch()`

**WRONG** — errors silently become unhandled promise rejections:
```javascript
input.addEventListener('input', debounce(handleFiltering, 150));
sortFilter.addEventListener('change', handleFiltering);
```

**RIGHT**:
```javascript
input.addEventListener('input', debounce(() => handleFiltering().catch(console.error), 150));
sortFilter.addEventListener('change', () => handleFiltering().catch(console.error));
```

**Impact**: Fetch errors after initial load are invisible; debugging becomes impossible

### ❌ Dynamic `onclick` Using Array Index Instead of Entity ID

**WRONG** — index is captured at render time and goes stale after deletions:
```javascript
item.innerHTML = `<button onclick="builder.deleteHotspot(${index})">`;
```

**RIGHT** — look up current index at click time using a stable ID:
```javascript
item.innerHTML = `<button onclick="builder.deleteHotspotById('${sanitizeHTML(hotspot.id)}')">`;
// Then in the class:
deleteHotspotById(id) { const i = this.hotspots.findIndex(h => h.id === id); ... }
```

**Impact**: Deletes wrong hotspot or silently no-ops after any prior deletion

### ❌ Parallel Implementations in overlay-engine.js vs config-builder.js

**Mistake**: Fixing or guarding a method in `overlay-engine.js` but forgetting the mirrored method in `config-builder.js` (e.g. `getCurrentColorValue`, `processMarkdown`)
**Impact**: Silent divergence — builder crashes on edge cases that the engine handles correctly
**Fix**: When patching either file, grep for the same method name in the other file and apply the same fix

### ❌ Calling engine methods without null-guarding `initializeOverlayEngine()`

**WRONG** — `initializeOverlayEngine()` returns `null` when the container element is missing:
```javascript
const engine = initializeOverlayEngine('overlay-container');
const success = await engine.loadConfig('config.json');  // TypeError if engine is null
```

**RIGHT**:
```javascript
const engine = initializeOverlayEngine('overlay-container');
if (!engine) { console.error('Failed to initialize overlay engine'); return; }
const success = await engine.loadConfig('config.json');
```

**Impact**: TypeError on every script page if the container element is missing or renamed. Fix must also be applied to `add-script.js` (the generator template).

### ❌ `async` DOMContentLoaded Without Error Handling

**WRONG** — `addEventListener` ignores the returned Promise, so rejections are silently swallowed:
```javascript
document.addEventListener('DOMContentLoaded', async function() {
    await loadScriptsList();  // If this rejects, nothing catches it
});
```

**RIGHT** — wrap body in an IIFE with `.catch()`:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    (async function() {
        await loadScriptsList();
    })().catch(err => console.error('Init failed:', err));
});
```

**Impact**: Fetch failures on page load are invisible. This is the DOMContentLoaded variant of rule #26.

### ❌ User-Controlled Content Injected Into Inline Style Attributes

**WRONG** — `sanitizeHTML()` rule applies to style attributes, not just innerHTML:
```javascript
item.innerHTML = `<div style="background: ${colorValue};">`;
```

**RIGHT**:
```javascript
item.innerHTML = `<div style="background: ${sanitizeHTML(colorValue)};">`;
```

**Impact**: CSS injection via crafted config.json color values (e.g. `getCurrentColorValue` returns raw `colorName` verbatim when not found in `OVERLAY_DEFAULTS.COLORS`)

### ❌ ID-Based Deletion Methods Delegating Back to Index-Based Methods

**WRONG** — `deleteHotspotById` calling `deleteHotspot(index)` reintroduces stale-index risk for any external direct callers of `deleteHotspot`:
```javascript
deleteHotspotById(id) {
    const index = this.hotspots.findIndex(h => h.id === id);
    if (index !== -1) this.deleteHotspot(index);  // round-trips through index-based method
}
```

**RIGHT** — inline the deletion logic in the ID-based method:
```javascript
deleteHotspotById(id) {
    const index = this.hotspots.findIndex(h => h.id === id);
    if (index === -1) return;
    // ... inline splice/update logic directly ...
}
```

**Impact**: ID-safe method becomes unsafe if `deleteHotspot(index)` is ever called directly with a stale index; extends rule #27

### ❌ Reverting `#theme-indicator` to a `<div>`

**Mistake**: Changing `<button id="theme-indicator">` back to `<div>` during refactoring or "cleanup"
**Reality**: The indicator is a `<button>` in all HTML pages and the `add-script.js` template — this is intentional for keyboard and screen reader accessibility
**Impact**: Theme toggle unreachable by keyboard; not announced by screen readers
**Rule**: `#theme-indicator` must always be a `<button>` with `aria-label`; `theme.js` updates the label dynamically via `updateThemeIndicator()`

### ❌ Script Cards as `<div>` + Click Handler Instead of `<a>`

**Mistake**: Using `document.createElement('div')` with `addEventListener('click', () => window.location.href = ...)` for script cards
**Reality**: `createScriptCard()` returns an `<a href="scripts/${id}/index.html">` element — this provides keyboard navigation, right-click "Open in new tab", and correct screen reader semantics for free
**Impact**: Cards unreachable by Tab key; can't be opened in a new tab; not announced as links
**Rule**: Script cards must be `<a>` elements; `css/main.css` has the `a.script-card` rule to reset link defaults (`display: block; text-decoration: none; color: inherit`)

### ❌ Accessing `overlay.line.segments` Without a Null Guard

**WRONG** — `overlay.description` can exist without `overlay.line`:
```javascript
const segments = overlay.line.segments;  // TypeError if no line
```

**RIGHT** — guard before accessing:
```javascript
if (!overlay.line) {
    // fall back: position tooltip adjacent to hotspot
    return tooltip;
}
const segments = overlay.line.segments;
```

**Impact**: Crashes `createSimpleTooltipAbsolute` and `positionTooltipForSegmentedLine` for any overlay with `description` but no `line` config; all subsequent hotspots on the page silently fail to render

### ❌ Using `getCurrentColorValue()` Directly in `innerHTML` Style Strings

**WRONG** — `sanitizeHTML()` prevents HTML injection but not CSS injection; `getCurrentColorValue()` returns raw `colorName` verbatim for unknown colors:
```javascript
style="background: ${sanitizeHTML(this.getCurrentColorValue(hotspot.color))};"
```

**RIGHT** — use `getSafeColorValue()` in `config-builder.js` (validates hex/#rgb/rgba, falls back to `#808080`):
```javascript
style="background: ${sanitizeHTML(this.getSafeColorValue(hotspot.color))};"
```

**Impact**: CSS injection via crafted color values in config.json. Note: DOM property assignment (`.style.border = val`) is safe; this rule applies only to inline style strings inside `innerHTML`.

### ❌ `role="button"` Elements Without `keydown` Enter/Space Handler

**WRONG** — tooltip shows on `focusin` but `Enter`/`Space` do nothing, violating the ARIA button contract:
```javascript
hotspot.setAttribute('role', 'button');
hotspot.addEventListener('focusin', showTooltip);
// Missing keydown handler
```

**RIGHT** — add keyboard activation:
```javascript
hotspot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTooltip(); }
});
```

**Impact**: Keyboard users focused via Tab see the tooltip on focus, but pressing Enter/Space (expected activation keys per ARIA spec) does nothing

### ❌ Calling `marked.setOptions()` Inside a Per-Call Function

**WRONG** — mutates global `marked.defaults` on every tooltip/markdown render:
```javascript
function processMarkdown(text) {
    marked.setOptions({ gfm: true, breaks: false });  // runs N times
    return marked.parse(text);
}
```

**RIGHT** — use a module-level one-time flag:
```javascript
let _markedConfigured = false;
function processMarkdown(text) {
    if (!_markedConfigured) {
        marked.setOptions({ gfm: true, breaks: false });
        _markedConfigured = true;
    }
    return marked.parse(text);
}
```

**Impact**: Global `marked.defaults` mutated on every hotspot render. Also note: `marked.setOptions` silently ignores unknown options (like removed `smartypants: false`) with no warning — remove stale option keys when spotted.

### ❌ Assuming `this.currentImage` Has a Consistent Shape

**Mistake**: Accessing `this.currentImage.file.name` in a method reachable via both image-loading paths
**Reality**: Two paths set different properties on `this.currentImage`:
- `loadImage(file)` (file upload): `{ element, width, height, file }` — `.file` is a `File` object
- `loadImageFromPath(path)` (dropdown): `{ element, width, height, path }` — `.path` is a string

**Fix**: `this.currentImage.path || this.currentImage.file?.name || 'screenshot.png'`

**Impact**: `TypeError` in any method that assumes only one loading path was used (e.g. `exportConfiguration()`)

---

## Architecture Gotchas

### Why Config Files Are Separate from HTML

Config builder needs JSON to generate/update overlays without parsing HTML. If coordinates move to HTML data attributes → builder save breaks.

### Why Coordinates Are Stored at Original Size

Screenshots display at variable sizes. Coordinates stored at original screenshot dimensions (`baseImage.width/height`), scaled at runtime via `image.offsetWidth / config.width`. Without scaling → overlays misalign on resize.

### Why HTTP Server Is Required

CORS policy blocks `fetch()` to `file://` URLs. Must use HTTP server (`python3 -m http.server 8000`) to load JSON configs.

### Why Build System Exists

**Single source of truth**: Individual `config.json` files
**Aggregated data**: `scripts-list.json` (for main page)
**Dropdown sync**: `config-builder.js` scriptData (for visual editor)

Build system keeps all 3 in sync. No hardcoded script data anywhere.

---

## Quick File Map

```
scripts/{id}/
├── config.json        # Source of truth (edit this)
├── description.md     # Auto-created content
└── index.html         # Auto-created showcase page

data/
└── scripts-list.json  # Generated from configs (don't edit)

js/
├── overlay-engine.js  # Core rendering
├── overlay-defaults.js # Shared OVERLAY_DEFAULTS
├── theme.js           # Theme management (95 lines extracted)
└── utils.js           # Helper functions

tools/
├── config-builder.html # Visual editor
└── config-builder.js   # Editor logic (scriptData synced from scripts-list.json)

css/
├── main.css           # Theme system (all pages)
└── overlay-system.css # Overlay styles (script pages + builder only)
```

---

## Command Guardrails

### ✅ SAFE - Always Run These

```bash
node build-system.js      # After ANY config.json change
python3 -m http.server 8000  # To run site locally
node add-script.js ...    # To create new script (then run build)
npm run lint              # Check JS quality (ESLint)
```

### npm Scripts (package.json)

Shortcuts for common commands:
```bash
npm run build       # alias for: node build-system.js
npm run serve       # alias for: python3 -m http.server 8000
npm run new-script  # alias for: node add-script.js
npm run lint        # alias for: eslint js/ tools/config-builder.js *.js
```

### New Script Page Checklist

When creating a new `scripts/{id}/index.html`, the script block **must** load DOMPurify before marked:
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.3.1/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@17.0.2/lib/marked.umd.js"></script>
```
DOMPurify MUST come before marked.js. Missing it leaves markdown XSS unfixed.

### ⚠️ CAREFUL - Directory Operations

**DON'T**:
- Rename `scripts/` directory → breaks `generate-system.js:481`
- Move `tools/` directory → breaks relative paths `../scripts/{id}/`
- Change screenshot directory depth → breaks `../../images/` paths

### 🚫 NEVER

- Commit without running `npm run lint` — aim for 0 errors (warnings are pre-existing debt)
- Commit without running `node build-system.js` after config changes
- Edit `data/scripts-list.json` directly (it's generated)
- Use `git add -A` without checking for `*.bak` and `test*.html` files
- Add `*/` in multiline JSDoc comments (syntax error)
- Use `body.theme-dark :root` CSS syntax (invalid)

---

## Breaking Change Patterns

### Changes That Require Rebuild

✅ **Must run** `node build-system.js`:
- Edit `scripts/{id}/config.json`
- Add new script directory
- Change script version/name/category
- Update tags or pinned status

❌ **No rebuild needed**:
- Edit `description.md` (loaded dynamically)
- Change CSS/theme files
- Update JavaScript (excluding `config-builder.js` scriptData)

### Changes That Need Browser Hard Refresh

- CSS file modifications
- JavaScript file changes
- After running build system

**Hard refresh**: Ctrl+Shift+R (Cmd+Shift+R on Mac)

---

## Detailed Documentation

- **[Architecture](docs/architecture.md)** - System design, data flow, performance limits
- **[Configuration](docs/configuration.md)** - Schema reference, breaking changes, color palette
- **[Build System](docs/build-system.md)** - Commands, validation, dependencies
- **[Debugging](docs/debugging.md)** - Common errors, diagnostic steps, DevTools usage
- **[Config Builder](docs/config-builder.md)** - Visual editor guide, hotspot creation, memory management

---

## TL;DR for AI Agents

1. **After config.json changes**: Run `node build-system.js` (REQUIRED)
2. **Avoid `*/` in comments**: Closes multiline comment (syntax error)
3. **CSS theme syntax**: `body.theme-dark` NOT `body.theme-dark :root`
4. **HTTP server required**: Use `python3 -m http.server 8000`, NOT `file://`
5. **Don't move directories**: `scripts/`, `tools/`, `images/` paths are hardcoded
6. **Check before deleting**: "Dead code" might be class methods (happened with OverlayEngine)
7. **Hard refresh after changes**: Ctrl+Shift+R to bypass cache
8. **marked.js `sanitize: true` is a no-op**: Use `DOMPurify.sanitize(marked.parse(text))` instead
9. **New script pages need DOMPurify**: Load `dompurify/dist/purify.min.js` before marked.js
10. **Theme state**: Use `getEffectiveTheme()` from theme.js, not `window.matchMedia()` directly
11. **URL params → innerHTML**: Always wrap with `sanitizeHTML()` first
12. **`config-builder.html` needs `theme.js`**: Load `../js/theme.js` before `config-builder.js` so `getEffectiveTheme()` is available
13. **Fix generator too**: When fixing `scripts/*/index.html` templates, also fix `add-script.js` (the generator template at line ~290)
14. **DOMPurify fallback = plain text**: Use `sanitizeHTML(text)` not raw `html` when DOMPurify is unavailable
15. **OverlayEngine queries**: Use `this.container.querySelectorAll()` not `document.querySelectorAll()` inside class methods
16. **Tooltip tracking**: Push tooltips to `this.tooltips[]` on creation so `clearOverlays()` can remove them
17. **config-builder.html dark styles**: Use `body.theme-dark .selector` not `@media (prefers-color-scheme: dark)` — two blocks need this (color swatches, status messages)
18. **ESLint is configured**: Run `npm run lint` to check. Any function from `js/utils.js` (or other shared `js/` files) used cross-file must be listed in `eslint.config.js` under `projectBrowserGlobals` — this applies both when adding new globals *and* when first using an existing util in a new file (e.g. `generateUniqueId` was already in utils.js but not registered, causing `no-undef`).
19. **HTML-callable functions**: Add `/* exported funcName */` before functions only called from HTML `onclick` handlers — prevents false "unused variable" ESLint warnings.
20. **marked CDN path changed in v17**: Use `lib/marked.umd.js` — `marked.min.js` at the package root 404s in v17+, leaving `marked` undefined and markdown rendering broken
21. **`python3` not `python`**: This system uses `python3 -m http.server 8000`
22. **`#overlay-toggle` is outside `this.container`**: Use `document.getElementById('overlay-toggle')` in `setupToggleButton()` / `toggleShowAll()` — scoping to the container silently breaks the toggle
23. **`== null` fails ESLint**: Write `=== null || === undefined` instead — `eqeqeq` rule bans loose equality
24. **`debounce()` and `throttle()` already exist**: Both are in `js/utils.js` and available globally on all pages — no need to add new ones
25. **`img.src` last**: Set `img.onload`/`img.onerror` *before* `img.src` — cached images fire synchronously, skipping handlers registered after
26. **Async event listeners need `.catch()`**: `el.addEventListener('change', asyncFn)` swallows rejections — use `() => asyncFn().catch(console.error)` instead
27. **Dynamic `onclick` → use ID, not index**: Array indices go stale after deletions; capture a stable `hotspot.id` and look up index with `findIndex` at click time
28. **`utils.js` before `theme.js`**: Load order in all HTML pages must be `utils.js` → `theme.js` → `overlay-defaults.js` → `overlay-engine.js` — if `theme.js` ever calls a utils global it would silently break with reversed order
29. **`img.onerror` wipes container**: After `imageContainer.innerHTML = ...` in the onerror handler, reset `this.overlays = []; this.tooltips = [];` — the wipe orphans those nodes, leaving stale references
30. **Async functions called without `.catch()`**: Any `async` function call that returns a Promise must have `.catch()` attached — e.g. `engine.loadConfig(path).catch(console.error)` — unhandled rejections are invisible
31. **`lucide.createIcons()` once per render, not per card**: Call it once after `renderScriptCards` finishes; per-card `setTimeout(() => lucide.createIcons(), 0)` inside `createScriptCard` causes N redundant full-DOM scans
32. **No `setTimeout` for init waits**: Don't use `setTimeout(fn, N)` to wait for a class instance to be ready — move the call into the same `DOMContentLoaded` listener that creates the instance (blocking scripts guarantee the instance exists before the listener fires)
33. **Mirror fixes across both engines**: `overlay-engine.js` and `config-builder.js` share parallel method implementations — when fixing a guard in one, check the same method in the other
34. **`initializeOverlayEngine()` can return null**: Always guard — `if (!engine) { return; }` before calling any engine methods; fix the generator too (`add-script.js`)
35. **`async` DOMContentLoaded needs `.catch()`**: Use `(async function(){...})().catch(console.error)` — a raw `async` DOMContentLoaded callback swallows rejections silently
36. **Style attributes need `sanitizeHTML()` too**: `style="background: ${sanitizeHTML(val)}"` — CSS injection via inline styles; `getCurrentColorValue` returns raw `colorName` verbatim for unknown colors
37. **ID-based methods must not delegate to index-based methods**: If `deleteHotspotById` calls `deleteHotspot(index)`, the stale-index risk is reintroduced for direct external callers — inline the logic
38. **`#theme-indicator` is a `<button>`**: All pages and `add-script.js` use `<button id="theme-indicator">` — never revert to `<div>` (breaks keyboard and screen reader access); `theme.js` updates its `aria-label` dynamically
39. **Script cards are `<a href>` links**: `createScriptCard()` returns `<a href="scripts/${id}/index.html">` — never revert to `<div>` + click handler; `a.script-card` in `main.css` resets link defaults
40. **`overlay.line` may be absent even when `overlay.description` is present**: Guard with `if (!overlay.line)` before accessing `.segments` in `createSimpleTooltipAbsolute` and `positionTooltipForSegmentedLine`; guard `hotspot.line` before accessing `.direction` in `updateHotspotList` — missing guards crash hotspot rendering and the hotspot list panel
41. **`getCurrentColorValue()` is unsafe in `innerHTML` style strings**: Use `getSafeColorValue()` in `config-builder.js` instead — it validates the result is hex or rgb/rgba and falls back to `#808080` for unknown colors (CSS injection risk)
42. **`role="button"` needs `keydown` for Enter/Space**: Any element with `role="button"` must handle `keydown` Enter/Space to fulfill the ARIA button contract — `focusin` alone is insufficient
43. **`marked.setOptions()` belongs outside per-call functions**: Use a module-level `_flag` boolean so it only runs once — calling it inside `processMarkdown()` mutates global defaults on every render; also remove stale options like `smartypants: false` (removed in marked v8)
44. **`createHotspot()` IDs must be stable**: Use `generateUniqueId('hotspot')` — sequential `hotspot-${length+1}` collides after deletions (ID reuse breaks `findIndex` lookups and generated config.json)
45. **`updatePropertiesPanel()` must guard optional hotspot fields**: A hotspot loaded from config.json may lack `line` or `description` — guard both: `const segs = hotspot.line ? hotspot.line.segments : []` and `hotspot.description?.content ?? ''`
46. **`positionTooltipForSegmentedLine()` and `positionTooltipForSegmentedLinePreview()` must guard empty segments**: `segments[0]` is `undefined` if array is empty — add `if (segments.length === 0) return;` before accessing elements in both the engine and the builder preview
47. **Rapid script switching race condition**: `loadImageFromPath` is async — if the user switches scripts before the image loads, the stale onload fires and overwrites the current state. Use a `_loadSeq` counter: increment at call start, check inside the onload callback and after the await to abort stale loads
48. **Dead index-based deletion methods must be removed**: `_deleteHotspot(index)` (and any similar index-based variants) must be deleted — their presence risks regression even if currently unused (rules #27/#37)
49. **`loadImage(file)` must not be `async` without returning a Promise**: The method used `FileReader` callbacks internally — declaring it `async` with no `await` and no returned Promise is misleading; callers `await`-ing it get back immediately before the file is read
50. **`innerHTML +=` destroys child event listeners**: Use `insertAdjacentHTML('beforeend', html)` to append content — `innerHTML +=` serializes and re-parses the entire subtree, silently removing all JS listeners on existing children
51. **`generateUniqueId` must be in `projectBrowserGlobals`**: It's exported from `js/utils.js` and available globally — register it in `eslint.config.js` like `sanitizeHTML` and `debounce`, or ESLint flags it as `no-undef`
52. **Tooltip visibility loops belong outside `overlays.forEach`**: `hoverTooltips` and `showAllTooltips` are container-wide node lists — iterating them inside `this.overlays.forEach` causes O(N²) DOM writes; query once and loop once outside the per-overlay iteration
53. **`element.style.background = 'var(--x)'` is silently broken**: Assigning a `var()` string to `.style.background` (or any `.style.*`) does NOT resolve CSS custom properties — use `element.style.setProperty('background', 'var(--x)')` instead
54. **`processMarkdown()` must guard against `null`/`undefined` input**: `marked.parse(null)` throws a TypeError in marked v17+; add `if (text === null || text === undefined) return '';` at the top of both engine and builder `processMarkdown()` implementations
55. **Deep-clone hotspots when reading _and_ writing**: `loadConfiguration()` must use `JSON.parse(JSON.stringify(config.overlays || []))` — a direct reference allows later mutations to corrupt parsed data. `exportConfiguration()` must also clone: `overlays: JSON.parse(JSON.stringify(this.hotspots))` — without this, post-export mutation of the config object corrupts builder state
56. **`createHighlight`, `createSimpleLine`, `createLine` take overlay as a parameter**: Never read overlay/scaleX/scaleY from instance state (`this.currentOverlay` etc.) inside these methods — pass them as explicit parameters from `createHotspot()` to avoid mid-loop shared state corruption
57. **Writing to optional hotspot fields also needs a guard**: Rule #45 guards reads (`hotspot.description?.content ?? ''`); the write path crashes identically — before `hotspot.description.content = val`, add `if (!hotspot.description) hotspot.description = {};`
58. **Audit existing script pages for stale placeholder content**: Pages created before the current template may contain `<h2>About This Script</h2>` or `<li>Professional After Effects integration</li>` — the `.script-content` div must be an empty container (with only a comment), populated dynamically from `description.md`
59. **Clear opposite CSS axis when repositioning absolutely-positioned elements**: When setting `left`, also set `right:'auto'`; when setting `right`, set `left:'auto'`; same for `top`/`bottom` — stale values from a previous position silently conflict with newly-set opposite-axis values, causing invisible layout glitches when tooltips are toggled between show/hover modes
60. **Verify function parameters are actually consumed in the body**: Parameters listed in a function signature but never read silently drop the caller's intent — e.g. an `offset = 15` passed by the caller becomes 0px with no error if the function body ignores it. After editing a function signature, search the body for each param name to confirm it's used
