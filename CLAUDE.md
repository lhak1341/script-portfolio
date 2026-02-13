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
python -m http.server 8000  # HTTP server REQUIRED (not file://)
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

CORS policy blocks `fetch()` to `file://` URLs. Must use HTTP server (`python -m http.server 8000`) to load JSON configs.

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
python -m http.server 8000  # To run site locally
node add-script.js ...    # To create new script (then run build)
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
4. **HTTP server required**: Use `python -m http.server 8000`, NOT `file://`
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
