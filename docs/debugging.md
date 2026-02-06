# Debugging Guide

## Common Errors

### "Failed to load config" in browser console

**Cause**: Using `file://` protocol instead of HTTP server

**Fix**:
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

**Why**: Browser CORS policy blocks `fetch()` to `file://` URLs

### Theme toggle doesn't work

**Check**:
1. CSS syntax: `body.theme-dark` NOT `body.theme-dark :root`
2. Comment syntax: Avoid `*/` in JSDoc comments (closes multiline comment early)
3. Console errors: Look for syntax errors in `theme.js`

**Test**:
```javascript
// In browser console
toggleTheme()
document.body.classList  // Should show theme-light or theme-dark
```

### Overlays appear in wrong positions

**Step 1**: Verify scaling
```javascript
// Check console for scale factors
console.log('Scale:', { scaleX, scaleY });
```

**Step 2**: Validate coordinates
- Ensure `x + width` ≤ `baseImage.width`
- Ensure `y + height` ≤ `baseImage.height`

**Step 3**: Check image dimensions
- `baseImage.width/height` must match actual screenshot size
- Scale ratio: `image.offsetWidth / config.width`

### Config builder shows old data

**Cause**: Didn't run build system after config change

**Fix**:
```bash
node build-system.js
# Refresh browser with Ctrl+Shift+R
```

### Scripts don't appear on main page

**Check**:
1. Does `config.json` exist?
2. Required fields present? (`scriptName`, `version`, `category`, `description`)
3. Valid JSON syntax?
4. Build system run?

**Debug**:
```bash
node build-system.js
# Check console output for warnings
```

## Memory Issues (Config Builder)

### Symptoms

- Browser crashes after 5-10 minutes
- Increasing lag during editing
- Memory profiler shows >500MB

### Root Causes

1. **Unbounded cache growth**: Markdown cache not limited
2. **Event listener accumulation**: Handlers not cleaned up
3. **Detached DOM trees**: Elements not fully removed

### Diagnostic

Open DevTools → Memory → Take snapshot:
- Detached DOM trees: Should be <50
- Event listeners: Should match visible hotspot count

### Prevention

- LRU cache with 50-entry limit
- Clone elements to remove listeners
- Explicit child node removal before parent

## External Library Issues

### Marked.js not loading

**Symptom**: Tooltips show raw markdown
**Check**: Network tab for CDN failure
**Fix**: Add availability check:
```javascript
if (typeof marked !== 'undefined') {
    marked.parse(text);
}
```

### Lucide icons not appearing

**Symptom**: Icon elements missing or unstyled
**Check**: CDN load timing vs. DOM manipulation
**Fix**: Use inline SVG or wait for `DOMContentLoaded`

## Grid Layout Issues

### 2-card layout stretches full width

**Cause**: CSS Grid `1fr` units distribute available space
**Fix**: JavaScript adds `two-cards` class → `repeat(2, 400px)` grid

### Cards overflow on mobile

**Check**: Viewport width vs. `minmax(350px, 1fr)`
**Fix**: Media query breakpoints in CSS

## Browser DevTools

### Essential checks

**Console**: Look for red errors on page load
**Network**: Verify all files load (200 status)
**Elements**: Inspect body classes for theme state
**Performance**: Check for >16ms frame times during hover

### Testing theme system

```javascript
// Check current theme
currentTheme

// Toggle theme
toggleTheme()

// Check body classes
document.body.classList

// Verify CSS variables
getComputedStyle(document.body).getPropertyValue('--bg-primary')
```

### Testing overlays

```javascript
// Check if engine initialized
typeof OverlayEngine

// Check config loaded
// (On script page)
document.querySelector('.script-image-container')

// Count overlays
document.querySelectorAll('.hotspot').length
```
