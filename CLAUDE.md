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
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
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
18. **ESLint is configured**: Run `npm run lint` to check. When adding new shared globals to `js/`, register them in `eslint.config.js` under `projectBrowserGlobals`.
19. **HTML-callable functions**: Add `/* exported funcName */` before functions only called from HTML `onclick` handlers — prevents false "unused variable" ESLint warnings.
20. **marked CDN path changed in v17**: Use `lib/marked.umd.js` — `marked.min.js` at the package root 404s in v17+, leaving `marked` undefined and markdown rendering broken
21. **`python3` not `python`**: This system uses `python3 -m http.server 8000`
22. **`#overlay-toggle` is outside `this.container`**: Use `document.getElementById('overlay-toggle')` in `setupToggleButton()` / `toggleShowAll()` — scoping to the container silently breaks the toggle
23. **`== null` fails ESLint**: Write `=== null || === undefined` instead — `eqeqeq` rule bans loose equality
24. **`debounce()` and `throttle()` already exist**: Both are in `js/utils.js` and available globally on all pages — no need to add new ones
