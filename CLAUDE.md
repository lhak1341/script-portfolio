# After Effects Scripts Showcase Website

**🌐 Live Site**: https://lhak1341.github.io/script-portfolio

## Project Overview

Interactive showcase website for After Effects scripts with hover-based UI overlays. Each script displays screenshot annotations explaining features through clickable hotspots with connecting lines and tooltips.

The website is automatically deployed via GitHub Pages whenever changes are pushed to the main branch. The site serves as a comprehensive wiki and reference guide for After Effects scripts used in production workflows.

## Quick Start

### Running the Site Locally

```bash
# Start HTTP server (required - can't open index.html directly due to CORS)
python -m http.server 8000

# Visit in browser:
http://localhost:8000
```

### Editing Script Overlays

```bash
# 1. Open config builder in browser:
http://localhost:8000/tools/config-builder.html

# 2. Select script from dropdown
# 3. Create/edit hotspots visually
# 4. Click "Save Configuration" (auto-copies to clipboard)
# 5. Paste into scripts/{script-id}/config.json
# 6. Refresh script page to see changes
```

### After Updating Any config.json

```bash
# Must run this to sync all data sources:
node build-system.js

# This updates:
# - data/scripts-list.json (main page data)
# - tools/config-builder.js (dropdown options)
```

### Adding New Script

```bash
# Quick way:
node add-script.js script-id "Script Name" "1.0.0" "Description" "category" "tag1,tag2"
node build-system.js

# Manual way:
mkdir scripts/my-script
# Create scripts/my-script/config.json with required fields
node build-system.js
```

**That's it!** Everything else below explains WHY things work this way and HOW to debug when they break.

---

## Core Architecture Constraints

### Configuration-Driven System Dependencies

**Why JSON config files**: Overlay coordinates stored in `scripts/{id}/config.json` separate from HTML to allow config builder to generate and update overlays without HTML parsing. Moving coordinates into HTML data attributes breaks config builder save functionality.

**Why coordinate scaling required**: Screenshots displayed at variable sizes across devices. Coordinates stored in absolute pixels at original screenshot dimensions (`baseImage.width/height`), scaled via `image.offsetWidth / config.width` ratio at runtime. Without scaling, overlays misalign when image size changes.

**Why theme detection via media queries**: System `@media (prefers-color-scheme: dark)` detects OS theme automatically. Manual JavaScript theme detection causes flash of unstyled content on page load. 15 CSS custom properties must use media query inheritance or manual override classes won't propagate.

**Tag filtering via URL parameters**: `?tag=composition` enables deep linking and bookmark sharing to filtered views. Using in-memory state breaks page refresh and prevents sharing filtered URLs. Tag matching uses exact array inclusion (`config.tags.includes(tag)`) to prevent partial matches.

### Technical Architecture

#### Overlay Positioning System

- **Coordinate scaling**: Overlays scale using `image.offsetWidth / config.width` ratio to maintain accuracy across display sizes
- **Flexible connector lines**: Support for both single-direction lines and multi-segment H-V-H (horizontal-vertical-horizontal) connectors for flexible tooltip positioning
- **Line rendering**: CSS-based line segments with absolute positioning, supports both legacy `::before` pseudo-elements and new multi-segment DOM elements
- **Tooltip positioning**: Absolute positioning calculated from connector end point + 15px offset, with automatic direction detection for segmented lines
- **Z-index layering**: Highlights (z-5), hotspots (z-10), lines (z-30), tooltips (z-25) prevent visual conflicts

#### Configuration Schema

Each script overlay configuration follows this consolidated structure with theme-aware color system:

```json
{
  "scriptName": "Script Name",
  "version": "1.0.0",
  "description": "Brief script description",
  "category": "Utility Tool",
  "tags": ["tag1", "tag2", "tag3"],
  "pinned": true,
  "baseImage": {
    "src": "../../images/script-screenshots/filename.png",
    "width": 328,
    "height": 612
  },
  "overlays": [
    {
      "id": "unique-identifier",
      "coordinates": {
        "x": 24,
        "y": 66,
        "width": 227,
        "height": 18
      },
      "color": "cyan",
      "line": {
        "direction": "left",
        "length": 150,
        "thickness": 2
      },
      // OR use new 3-segment connector system:
      "line": {
        "segments": [
          { "type": "horizontal", "length": 80 },
          { "type": "vertical", "length": -60 },
          { "type": "horizontal", "length": 40 }
        ],
        "thickness": 2
      },
      "description": {
        "content": "**Bold** and _italic_ markdown support in tooltips"
      }
    }
  ]
}
```

**Schema Breaking Changes**:

- **Coordinate consolidation**: Eliminated duplicate `hotspot`/`highlight` coordinate sets. Single `coordinates` object defines both interactive area and visual highlight, reducing file size by 50% and preventing synchronization issues
- **Single color property**: Removed duplicate color definitions in `style.color` and `line.color`. Now uses single `color` property at overlay level that applies to both hotspot highlight and line
- **Theme-aware color system**: Colors now use semantic names instead of hex values. Engine automatically selects light/dark variants based on system theme
- **Default value handling**: `borderRadius` and `thickness` properties now optional with system defaults (4px and 2px respectively)
- **Markdown parser replacement**: Custom 80-line markdown processor replaced with Marked.js library (~16KB). Fixes nested list numbering issues, adds GitHub Flavored Markdown support, eliminates code block formatting bugs

**Available Semantic Colors**:
| Color Name | Light Mode | Dark Mode | Usage |
|------------|------------|-----------|-------|
| `red` | `#ef4444` | `#f87171` | Error states, critical highlights |
| `orange` | `#f97316` | `#fb923c` | Warning states, attention items |
| `yellow` | `#eab308` | `#facc15` | Caution indicators, highlights |
| `green` | `#22c55e` | `#4ade80` | Success states, positive actions |
| `cyan` | `#06b6d4` | `#22d3ee` | Information, primary highlights |
| `purple` | `#a855f7` | `#c084fc` | Special features, secondary actions |
| `pink` | `#ec4899` | `#f472b6` | Creative elements, decorative highlights |

#### Multi-Segment Connector System

**Enforced Patterns**: System validates segments and only accepts two patterns:

- **1 segment**: `[{type: "horizontal", length: N}]` - straight horizontal line
- **3 segments**: `[{type: "horizontal"}, {type: "vertical"}, {type: "horizontal"}]` - H-V-H path

**Validation**: `isValidSegmentPattern()` in `overlay-engine.js:313` and `config-builder.js:899` rejects invalid patterns with console warning, returns fallback `[{type: "horizontal", length: 100}]`

**Configuration Structure**:

```json
"line": {
  "segments": [
    {"type": "horizontal", "length": 80},    // First horizontal: distance before turn
    {"type": "vertical", "length": -60},     // Vertical: up 60px (negative = up)
    {"type": "horizontal", "length": 40}     // Second horizontal: remaining distance
  ],
  "thickness": 2
}
```

**Segment Properties**:

- `type`: `"horizontal"` or `"vertical"` only
- `length`: Pixels (positive = right/down, negative = left/up)
- First segment type determines line starting edge (horizontal starts from left/right edge, vertical from top/bottom)
- Tooltip positioned at final segment endpoint + 15px offset

**Zero-Length Segment Filtering**: `simplifyLineSegments()` in `overlay-engine.js:287` removes segments with `Math.abs(length) ≤ 0.1` before validation. When turning point equals horizontal distance, uses 0.1px minimum instead of 0 to prevent filter removal.

**Dual-Line Display System**:

- **Hover mode** (toggle OFF): Single horizontal line calculated by summing all horizontal segments, tooltip positioned at total horizontal distance end. Cleaner UI with less visual clutter.
- **Show All mode** (toggle ON): Full H-V-H multi-segment path with tooltip at complex endpoint. Designed paths visible to show navigation around overlapping elements.
- Implementation: Creates two line containers (`.hover-line` and `.show-all-line`) and two tooltips (`.hover-tooltip` and `.show-all-tooltip`), toggles visibility via `updateOverlayVisibility()` at `overlay-engine.js:868`

#### Line Connector System Implementation

**Rendering Logic**: `js/overlay-engine.js` detects `line.segments` array and creates individual `div` elements for each segment positioned using calculated coordinates. Legacy `line.direction` creates single CSS `::before` pseudo-element.

**CSS Architecture**: `.line-segment` elements use absolute positioning within `.overlay-line-container`, inheriting color and thickness from parent configuration.

**Scaling Behavior**: Segment lengths scale proportionally with image display size using `Math.min(scaleX, scaleY)` to maintain consistent visual proportions.

#### Main Scripts Data Schema

The `data/scripts-list.json` file contains all script metadata with the following structure:

```json
{
  "scripts": [
    {
      "id": "script-folder-name",
      "name": "Display Name",
      "version": "1.0.0",
      "category": "utility",
      "description": "Brief description of functionality",
      "thumbnail": "images/script-screenshots/filename.png",
      "screenshot": "images/script-screenshots/filename.png",
      "pinned": true,
      "tags": ["tag1", "tag2", "tag3"]
    }
  ],
  "categories": [
    {
      "id": "utility",
      "name": "Utility Tools",
      "color": "#4CAF50",
      "description": "Category description"
    }
  ]
}
```

**Script Properties**:

- `id`: Must match folder name in `scripts/` directory (required)
- `name`: Display name shown in UI (required)
- `version`: Semantic version string (required)
- `category`: Must match category ID from categories array (required)
- `description`: Brief functional description (required)
- `thumbnail`/`screenshot`: Path to screenshot image (required)
- `pinned`: Boolean - when true, script appears at top with pin icon (optional, default: false)
- `tags`: Array of strings for filtering and navigation (optional)

**Category Properties**:

- `id`: Unique identifier matching script.category values (required)
- `name`: Display name for category filter dropdown (required)
- `color`: Hex color for category pills (required)
- `description`: Category description text (required)

#### Markdown Processing Architecture

- **Library integration**: Marked.js v5.0+ loaded via CDN on all pages (index.html, script pages, config builder)
- **Configuration settings**: GitHub Flavored Markdown enabled, line breaks disabled, sanitization disabled for trusted content
- **Processing locations**:
  - Tooltip descriptions via `overlay.description.content` in config.json files
  - Script page content via `description.md` files loaded dynamically
  - Config builder preview tooltips during hotspot creation
- **Supported markdown features**: Headers (H1-H6), nested lists (unlimited depth), code blocks with preserved special characters, bold/italic text, links
- **Performance impact**: Marked.js adds ~16KB minified, processes average tooltip (50 characters) in <1ms
- **Fallback behavior**: If Marked.js fails to load, `processMarkdown()` returns `<p>{text}</p>` wrapper with console warning
- **Breaking change impact**: Replaces custom 80-line processor that failed on nested numbered lists and incorrectly formatted underscores in code blocks

#### Theme System Implementation

- **Three-state theme management**: System defaults to `auto` (follows OS preference), users can override to `light` or `dark` modes
- **Manual theme override architecture**:
  - CSS classes `body.theme-light` and `body.theme-dark` override `@media (prefers-color-scheme)` rules
  - JavaScript `localStorage.setItem('theme-preference', currentTheme)` persists user choice across sessions
  - Click handler on theme indicator cycles through: `auto` → `light` → `dark` → `auto`
- **Cross-page theme consistency**: All script pages use identical theme management code, share localStorage state
- **Real-time system theme detection**: `matchMedia('prefers-color-scheme: dark')` with change listeners, only active when `currentTheme === 'auto'`
- **CSS variable cascade**: 82 theme-specific CSS rules with manual override classes taking precedence over system media queries
- **Theme indicator states**:
  - `Auto (Light)` / `Auto (Dark)`: Follows system preference, shows current effective theme
  - `Light Mode` / `Dark Mode`: User-forced theme, ignores system changes
- **Manual override scope**: Covers 16 CSS custom properties, category color variants, toggle switch styling across all pages

#### Architecture Changes & Implementation Updates

**Configuration Schema Breaking Changes**:

- **Coordinate consolidation**: `overlay.hotspot` and `overlay.highlight` merged into single `overlay.coordinates` object
- **Theme-aware color system**: Colors changed from hex values to semantic names (`#3498db` → `cyan`), automatically resolve to light/dark variants
- **Default value centralization**: `OVERLAY_DEFAULTS` constant in engine provides system-wide defaults (borderRadius: 4px, thickness: 2px)
- **Breaking change impact**: All existing `config.json` files require migration to new schema

**Engine Implementation Updates**:

- **Color resolution system**: `getCurrentColorValue()` method maps semantic colors to theme-appropriate hex values using `matchMedia()` detection
- **Centralized defaults**: `OVERLAY_DEFAULTS` object contains predefined color palette with light/dark variants for 7 colors
- **Highlight rendering**: Positioned at `(0,0)` relative to hotspot container instead of separate absolute positioning
- **Toggle mechanism**: Replaced button click events with checkbox change events, state synchronization through `updateOverlayVisibility()`

**Configuration Builder Interface Changes**:

- **Padding reduction**: Interface elements use 1rem instead of 2rem spacing, reducing vertical scroll requirement from 800px to 600px viewport height
- **Mode switching mechanism**: Single checkbox input replaces two separate buttons, eliminates state synchronization issues between select/create modes
- **Coordinate input system**: Number inputs allow direct pixel value entry (X: 0-2000, Y: 0-2000), replacing display-only coordinate readouts that required mouse interaction for all adjustments
- **Color selection layout**: 7 color options in horizontal 40px circles, removed 120px height container and text labels, reduces color panel from 180px to 50px height
- **Hotspot list display**: Shows 3 data points (ID, direction arrow, color dot) instead of 6 (coordinates, dimensions, styling), reduces list item height from 80px to 40px
- **Header structure**: Removed 60px "Script Selection" section and 40px placeholder messaging, reducing total interface height by 100px

### Visual Configuration Builder

#### Hotspot Creation Workflow

- **Toggle-based mode switching**: Single checkbox toggles between select mode (default) and create mode for clear workflow separation
- **Click-drag selection**: Mouse events create rectangular hotspot boundaries when in create mode, automatic coordinate calculation
- **Pixel-precise editing**: Dedicated number inputs for Position (X, Y) and Size (Width, Height) allow 1-pixel adjustments
- **Visual property panel**: Hotspot ID input, single-row color palette (7 theme-aware colors), line distance controls, markdown description field
- **Real-time preview**: All changes instantly update visual overlay preview using same positioning logic as production engine

#### Intuitive Line Configuration System

Replaces low-level segment editing with high-level distance parameters:

**Distance-Based Controls**:

- **Horizontal Distance** (-300 to 300px): Total horizontal distance to tooltip. Positive = right, negative = left.
- **Vertical Distance** (-300 to 300px): Vertical offset from hotspot center. Positive = down, negative = up. Set to 0 for straight horizontal line.
- **Turn Point** (0 to 300px): How far to go horizontally before turning vertically. Always positive, direction inferred from horizontal distance sign. Disabled when vertical distance is 0.

**Auto-Conversion Logic** (`config-builder.js:156`):

- `verticalDistance === 0` → Generates `[{horizontal: H}]` (1 segment)
- `verticalDistance !== 0, turningPoint === 0` → Auto-sets turning point to `horizontalDistance / 2` for balanced path
- `turningPoint === horizontalDistance` → Special case generates `[0.1, V, H-0.1]` to keep tooltip at edge while satisfying 3-segment pattern
- Otherwise → Generates `[turningPoint * direction, V, remainingHorizontal]`

**Zero-Value Handling**: Fixed JavaScript `||` operator treating `0` as falsy. Now checks `value !== ''` before parsing, allowing vertical distance of 0 to create straight lines (`config-builder.js:729`).

**UI State Management**:

- Turn Point field automatically disabled (opacity 0.5, pointer-events none) when vertical distance is 0 via `updateTurningPointState()` at `config-builder.js:395`
- When changing vertical distance from 0 to non-zero, turn point auto-populates to half of horizontal distance and updates UI input value
- Example guidance shows resulting segment patterns: "Straight right: H=120, V=0 → [H]"

#### Configuration Management

- **Script selection**: Dropdown loads existing `config.json` files from `scripts/{id}/` directories
- **Cache-busting**: `fetch()` requests include timestamp parameters to bypass browser caching
- **Direct array output**: Generates `"overlays": [...]` format (not wrapped in `{"overlays": [...]}` object), eliminating need to strip outer braces during copy-paste to config.json
- **Auto-copy**: Configuration automatically copied to clipboard on save, button changes to "Copied! ✓" for 3 seconds
- **Hot reload**: Configuration changes immediately visible in both builder and script pages

#### Memory Management and Performance

**Browser "Out of Memory" Crashes Pattern**

**Symptoms**: Browser tabs crash with "Out of Memory" error after 5-10 minutes of continuous config builder use; lag increases progressively; DevTools Memory profiler shows >500MB consumption.

**Root Causes Identified**:

1. **Unbounded Cache Growth** (`config-builder.js:33`):

   - Markdown cache accumulated entries indefinitely across all script editing sessions
   - Each description edit creates new cache entry without eviction
   - Cache hit rate meaningless when cache grows to thousands of entries

2. **Event Listener Accumulation** (`config-builder.js:1446`):

   - Every render attached new click handlers to DOM elements
   - Old event listeners remained in memory without cleanup
   - Hundreds of orphaned listeners accumulated per hotspot after multiple edits

3. **Circular DOM References** (`config-builder.js:1446`):

   - Parent-child element relationships prevented garbage collection
   - `innerHTML` references kept child nodes in memory after parent removal
   - `cloneNode(false)` only cloned parent, leaving child references dangling

4. **Cross-Script Cache Accumulation**:
   - Cache persisted when switching between scripts
   - Memory accumulated across all scripts edited in single session

**Architectural Solutions**:

- **LRU Cache with Size Limit** (`config-builder.js:1327`): Maximum 50 entries with oldest-entry eviction prevents unbounded growth
- **Event Listener Cleanup via Cloning** (`config-builder.js:1456`): Clone node without listeners, replace original, remove clone breaks circular references
- **Explicit Child Node Removal** (`config-builder.js:1453`): `while (element.firstChild) removeChild(firstChild)` before parent removal
- **Cache Clearing on Script Switch** (`config-builder.js:266`): `clearCache()` called in `loadSelectedScript()` prevents cross-script accumulation

**Diagnostic Steps for Memory Issues**:

1. Open DevTools → Memory → Take heap snapshot
2. Check `Detached DOM tree` count (should be <50 during normal use)
3. Monitor event listeners count in Elements panel (should match visible hotspot count)
4. Profile memory allocation over 5 minutes of continuous editing
5. Check if memory drops after switching scripts (indicates cache cleanup working)

**Prevention Strategy**: Always pair DOM manipulation with explicit cleanup; cache unbounded data with size limits and eviction policies; validate memory behavior during continuous-use testing.

**Unnecessary Re-render Performance Pattern**

**Symptoms**: UI feels laggy when clicking hotspots; selection changes take 50-200ms; typing in inputs shows visible delay.

**Root Cause**: Hotspot selection triggered `renderHotspots()` which rebuilt all overlay DOM elements, re-processed markdown, re-attached event listeners. Only selection visual state needed updating, not full DOM reconstruction.

**Architectural Solution** (`config-builder.js:903`):

- **Selective Visual Updates**: `updateSelectionVisuals()` method modifies CSS borders without DOM manipulation
- **Cached Markdown Processing**: `processMarkdown()` checks Map cache before calling `marked.parse()`
- **Event Handler Replacement**: Changed selection clicks from full re-render to visual-only update

**Performance Impact**:

- Selection clicks: 50-200ms → <5ms
- Markdown processing: 5-10ms → <1ms (cached)
- DOM operations during typing: ~1000/second → ~10/second (100ms throttle remains)

**Input Throttling** (`config-builder.js:363`):

- Debounce input events to 100ms (maximum 10 updates/second) prevents render thrashing during typing
- Immediate update on `blur`/`change` events ensures final value commits
- Reduces continuous adjustment overhead by 99%

**Stylesheet Loading**: Config builder loads `overlay-system.css` in addition to `main.css` (line 8). Without this, tooltip markdown styling (bold, code, italic) renders differently in preview vs actual pages, causing line-break inconsistencies.

### Main Landing Page (✅ Complete)

#### Script Discovery System

- **Responsive grid layout**: CSS Grid with `repeat(auto-fit, minmax(350px, 1fr))` adapts to screen width, displays 3+ scripts per row on desktop
- **Two-card layout optimization**: JavaScript adds `two-cards` class when exactly 2 scripts display, constrains cards to 400px width with `repeat(2, 400px)` grid template to maintain proportions instead of stretching
- **Multi-filter search**: Text search across names/descriptions + category dropdown + sorting options
- **Interactive tag filtering**: Script card tags use click handlers with `stopPropagation()` to prevent card navigation, update URL parameters with `pushState()`, clear search input, trigger `handleFiltering()` for instant results
- **Filter notification system**: Displays "Showing scripts tagged with 'tagname'" banner with inline SVG tag icon (22px, `--text-secondary` color) and Clear button for easy filter removal
- **URL parameter handling**: `?tag=composition` automatically filters and shows notification banner
- **Pinned scripts system**: Scripts marked with `"pinned": true` automatically sort to top of list, display 24px accent-colored pin icon rotated 45° clockwise in top-right corner, feature blue border with gradient background overlay and shadow effects

### Icon Rendering Pattern

**Why inline SVG for tag icons**: Lucide.js CDN dynamically replaces icon elements after page load, causing icons to appear after CSS styling already applied. Race condition breaks icon colors and sizing. Inline SVG with `stroke="currentColor"` inherits text color immediately, eliminates timing dependency.

**Diagnostic**: If icons don't appear or have wrong colors → check if Lucide loaded before icon replacement. Solution: Use inline SVG or wait for `DOMContentLoaded` before Lucide initialization.

### Tooltip Width Constraints

**Why 320px max-width** (`overlay-system.css:159`): Prevents lines exceeding 65-70 characters (readability limit for body text). Values >400px force horizontal scrolling on mobile viewports (min width 375px - 40px padding = 335px usable). Values <250px break code blocks with identifiers like `removeEventListener()`.

**Why 200px min-width**: Prevents narrow tooltips (1-2 words) from appearing as small boxes. Without minimum, tooltip `"OK"` renders 30px wide, visually lost against screenshot. Consistent width aids visual scanning.

## Technical Dependencies & Constraints

### Why HTTP Server Required

**CORS Policy Restriction**: Browser blocks `fetch()` requests to `file://` URLs for security. Opening `index.html` directly shows "Failed to load config" errors. Must run via HTTP server (`python -m http.server 8000` or equivalent) to load JSON files.

**Diagnostic**: `Failed to load resource: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, https` → indicates file:// protocol in use.

### Why Fixed Directory Structure

**Script discovery via directory scan**: Build system scans `scripts/` directory for folders containing `config.json`. Renaming `scripts/` directory breaks `generate-system.js` scan logic (line 481). Moving script folders outside `scripts/` excludes them from build.

**Screenshot path resolution**: Config files use `../../images/script-screenshots/filename.png` (relative to `scripts/{id}/`). Changing directory depth breaks image loading. Absolute paths break when deploying to subdirectories (GitHub Pages uses `/script-portfolio/`).

**Config builder path assumptions**: Builder loads configs via `../scripts/{id}/config.json` (relative to `tools/`). Moving `tools/` or `scripts/` directories breaks relative path resolution without updating hardcoded paths in `config-builder.js:288`.

### Performance Characteristics and Limits

#### Processing Constraints

- **Overlay rendering limit**: Each script supports maximum 50 overlays before DOM performance degrades (tested with 100+ overlays causing 300ms+ hover delay)
- **Image scaling calculations**: Window resize events throttled to 16ms intervals (60fps) to prevent UI blocking during rapid window changes
- **Configuration file size**: Individual config.json files limited to ~10KB for sub-100ms load times via fetch() with cache-busting timestamps
- **Markdown processing capacity**: Marked.js processes tooltip content up to 1000 characters without noticeable delay (<5ms), longer content may cause hover lag

#### Browser Resource Usage

- **Memory allocation**: Each loaded script page maintains ~50-200 DOM elements in memory for overlay system (hotspots, highlights, lines, tooltips)
- **CSS transition overhead**: 0.3s transition duration applied to all hover states, concurrent hover events on different elements may cause stutter
- **Theme switching impact**: Manual theme changes trigger CSS custom property recalculation across ~80 variables, causes 50-100ms UI pause
- **CDN dependency load times**: Marked.js (~16KB) and Lucide icons (~45KB) add 200-500ms to initial page load depending on connection speed

#### Known Performance Limits

- **Script quantity threshold**: Main page grid tested with 10-20 scripts, performance degrades with 50+ scripts (500ms+ initial load) due to parallel image loading overhead
- **Concurrent overlay hover**: Multiple simultaneous overlay hover states (>3) can cause CSS animation conflicts and reduced responsiveness
- **Mobile touch performance**: Overlay system designed for hover states, touch devices require CSS hover state persistence causing memory buildup
- **Screenshot file size**: Optimal PNG screenshots should be <100KB each, larger files cause layout shift during image loading

**Monitoring recommendations**: Use DevTools Performance tab to identify bottlenecks when adding new scripts or overlays. Watch for >16ms frame times during hover interactions.

## Debugging Methodology

### Overlay Positioning Issues

When overlays appear in wrong locations:

**Step 1: Verify scaling calculations**

```javascript
// Check browser console for these debug logs
console.log('Scale factors:', { scaleX, scaleY });
console.log('Image dimensions:', {
  actual: img.offsetWidth,
  config: config.width,
});
```

**Step 2: Validate configuration data**

- **Coordinate boundaries**: Ensure hotspot x+width and y+height don't exceed image dimensions
- **File paths**: Verify screenshot src paths resolve correctly from script directory
- **JSON syntax**: Malformed JSON breaks entire overlay loading without error messages

**Step 3: Test interaction states**

- **Hover detection**: Check if hotspot div covers intended UI area in browser dev tools
- **Z-index conflicts**: Verify line z-index (30) renders above tooltip z-index (25)
- **CSS variable inheritance**: Confirm theme variables load correctly across stylesheets

### Configuration Builder Problems

When builder shows incorrect previews or fails to load:

**Diagnostic Questions:**

1. **Does script selector populate?** Missing options indicate hardcoded script data problems
2. **Do coordinates match between builder and script page?** Discrepancy indicates scaling logic differences
3. **Does cache-busting work?** Browser shows old config despite JSON file changes
4. **Are click events registering?** Dev tools event listeners tab shows active mouse handlers

**Common Failure Patterns:**

- **Image loading failures**: Network tab shows 404s for screenshot paths
- **Coordinate scaling mismatches**: Builder and script page use different image dimensions
- **JSON parsing errors**: Silent failures when config.json contains syntax errors
- **Event handler conflicts**: Multiple overlapping mouse event listeners interfere with hotspot creation

### Theme System Debugging

When theme switching fails or appears inconsistent:

**Step 1: Verify media query detection**

```javascript
// Browser console check
window.matchMedia('(prefers-color-scheme: dark)').matches;
```

**Step 2: Inspect CSS variable inheritance**

- **Root level**: Check `:root` selector contains both light and dark theme variable definitions
- **Component level**: Verify individual components use `var(--variable-name)` instead of hardcoded colors
- **Media query precedence**: Dark theme `@media` rules must come after light theme definitions

**Step 3: Test cross-component consistency**

- **Tooltip styling**: Description tooltips should match theme of surrounding interface
- **Border colors**: Input fields, cards, and navigation elements should all use same border variable
- **Transition smoothness**: Theme changes should animate over 0.3s without flickering

### External Library Integration Failure Patterns

**Symptoms**: Features work intermittently; functionality breaks after browser refresh; elements render incorrectly on initial load but fix themselves after user interaction.

**Root Cause**: Race conditions between library loading and DOM-dependent code execution. CDN libraries load asynchronously while local JavaScript executes immediately.

**Common Patterns**:

- **CDN timing dependencies**: `marked.parse()` called before Marked.js loads from CDN
- **Dynamic element replacement**: Lucide.js replaces DOM elements after CSS rules applied to original elements
- **Missing error handling**: No fallback behavior when external libraries fail to load
- **Initialization order assumptions**: Local code assumes library availability without verification

**Diagnostic Steps**:

1. **Check library availability**: `typeof marked !== 'undefined'` before function calls
2. **Inspect network timing**: DevTools Network tab shows CDN load timing vs script execution
3. **Verify DOM state**: Are elements in expected state when styling/interaction code runs?
4. **Test offline behavior**: Does site break completely without CDN access?

**Architectural Solution**: Add availability checks (`if (typeof library !== 'undefined')`) and fallback implementations for all external library dependencies. Use `DOMContentLoaded` listeners for library initialization code.

**Prevention Strategy**: Never assume external library availability. Implement graceful degradation for all CDN dependencies and provide fallback implementations that maintain core functionality.

### Grid Layout Proportional Scaling Issues

**Symptoms**: Card layouts stretch unexpectedly when displaying specific quantities; 2-card layouts expand to full width while 3+ cards maintain appropriate proportions.

**Root Cause**: CSS Grid `1fr` units distribute available space equally among grid items, causing cards to stretch beyond intended proportions when fewer items are present than the design assumes.

**Common Patterns**:

- **Auto-fit scaling assumptions**: `repeat(auto-fit, minmax(min, 1fr))` assumes minimum card count for proportion calculations
- **Missing quantity-specific constraints**: No layout adaptation based on actual item count
- **Transform scaling issues**: Container-level transforms affect child layout calculations and border rendering

**Diagnostic Questions**:

1. **Does layout break at specific quantities?** Isolates quantity-dependent vs general layout issues
2. **Do containers overflow or underflow?** Identifies whether items expand or contract unexpectedly
3. **Are proportions maintained at different screen sizes?** Tests responsive behavior vs fixed-quantity issues

**Architectural Solution**: Dynamic CSS class application based on item count (`two-cards`, `three-cards`) with quantity-specific grid templates (`repeat(2, 400px)` vs `repeat(auto-fit, minmax(350px, 1fr))`).

**Prevention Strategy**: Define explicit grid templates for each expected quantity range rather than relying on flexible units for all scenarios.

## Browser Compatibility & Deployment

### Tested Configurations

- **Chrome 90+**: Full functionality including CSS custom properties and fetch API
- **Firefox 88+**: Complete feature support with proper media query detection
- **Safari 14+**: All features working, theme detection responds to system changes
- **Edge 90+**: Full compatibility with Chromium-based architecture

### Deployment Requirements

- **Static file hosting**: No server-side processing required beyond HTTP file serving
- **HTTPS recommended**: Service workers and some fetch API features prefer secure contexts
- **Directory structure preservation**: Relative paths break if file organization changes
- **Cache headers**: Configure long cache times for images, short cache for JSON configs

### Known Limitations

- **Mobile responsiveness**: Fixed coordinate system doesn't adapt to touch interfaces
- **Image format constraints**: Only supports standard web image formats (PNG, JPG, WebP)
- **Configuration validation**: No schema validation prevents malformed config files from breaking pages
- **Accessibility**: Overlay system lacks keyboard navigation and screen reader support

## Dynamic Build System

### System Architecture

The portfolio scans the `scripts/` directory at build time to generate `scripts-list.json`. No hardcoded script data exists - all information comes from individual `config.json` files found in script directories.

**Build Process**: File system scan of `scripts/` → read each `config.json` → generate `scripts-list.json` → sync config builder dropdown options

### Build Commands

#### `node build-system.js` - Complete Build

Executes full system generation:

- Scans `scripts/` directory for folders containing `config.json` files
- Creates missing `description.md` and `index.html` files for discovered scripts
- Generates `scripts-list.json` from all found config files
- Updates config builder dropdown with current script list

#### `node generate-system.js` - File Structure Generator

Creates missing script files for directories that have `config.json` but lack other files:

- Description markdown with structured content template
- HTML showcase pages with overlay engine integration
- Screenshots extracted from `baseImage.src` paths in config files

#### `node update-config-builder.js` - Config Builder Sync

Updates hardcoded script metadata in `tools/config-builder.js` dropdown from `scripts-list.json`.

#### `node add-script.js` - New Script Creator

Creates complete script structure with single command:

```bash
node add-script.js script-id "Script Name" "1.0.0" "Description" "category" "tag1,tag2"
```

### Script File Structure

Each script requires three files for system recognition:

```
scripts/
├── script-id/
│   ├── config.json      # Required: Script metadata + overlay configurations
│   ├── description.md   # Auto-created: Content loaded via engine.loadDescription()
│   └── index.html       # Auto-created: Showcase page with overlay system
```

**Directory Scanning Logic**:

- Only directories containing `config.json` are included in scripts list
- Screenshot filenames extracted from `config.json` `baseImage.src` property
- Categories and tags collected from all config files to build filter dropdown
- Missing `description.md` or `index.html` files auto-generated during build

### Adding New Scripts

**Manual Process**:

```bash
# Create directory and config
mkdir scripts/my-new-script
# Edit scripts/my-new-script/config.json with required fields
node build-system.js
```

**Helper Script Process**:

```bash
node add-script.js my-script "My Script" "1.0.0" "Description" "utility" "tag1,tag2"
node build-system.js
```

**Required Config Fields**:

```json
{
  "scriptName": "Display Name",
  "version": "1.0.0",
  "description": "Functional description",
  "category": "utility|workflow|automation",
  "tags": ["keyword", "feature"],
  "pinned": false,
  "baseImage": {
    "src": "../../images/script-screenshots/filename.png",
    "width": 328,
    "height": 612
  },
  "overlays": []
}
```

### Data Flow Architecture

**Main Page Load**:

1. `overlay-engine.js` fetches `data/scripts-list.json`
2. Renders script cards with category/tag filtering
3. Tag navigation creates URL parameters for filtering

**Individual Script Page Load**:

1. `overlay-engine.js` loads `scripts/{id}/config.json`
2. Initializes overlay system with coordinates/styling
3. Loads `description.md` content, overrides HTML placeholders
4. Renders dynamic tag links from config data

**Config Builder Operation**:

1. Dropdown dynamically populated via `populateScriptDropdown()` from `scriptData` object on page load (`config-builder.js:111`)
2. Script selection loads existing `config.json` via fetch with cache-busting timestamp
3. Overlay creation updates in-memory configuration
4. Save outputs `{"overlays": [...]}` format for manual config file update

**Dynamic Dropdown Architecture** (`config-builder.html:537`, `config-builder.js:111`):

- HTML contains only placeholder `<option value="">Select a script...</option>`
- JavaScript populates remaining options from `scriptData` on initialization
- Scripts sorted alphabetically by name via `localeCompare()`
- Eliminates dual-maintenance requirement (HTML + JS data sync)
- Running `build-system.js` updates `scriptData` → automatic dropdown synchronization

### Breaking Changes and Dependencies

**Data Priority Conflict Pattern**

**Symptoms**: Config builder shows outdated script versions/screenshots despite `config.json` files being updated; main page displays correct data but builder remains stale; `build-system.js` runs successfully but changes don't propagate to builder.

**Root Cause** (`generate-system.js:496-503`): Screenshot path extraction logic prioritized hardcoded `SCRIPT_DATA` over actual `config.json` files. When both sources existed, hardcoded data won despite being obsolete.

**Diagnostic Questions**:

1. Does main page show correct version but builder shows old? → Data priority bug
2. Did you run `build-system.js` but see no changes? → Check data source order
3. Are screenshots updated in `config.json` but not appearing? → Check extraction logic priority

**Architectural Solution**: Reverse priority order - `config.baseImage.src` checked first, `SCRIPT_DATA` only as fallback when config missing. Single source of truth principle: live config files override legacy hardcoded data.

**Prevention Strategy**: Always prioritize runtime-editable sources over build-time defaults; validate data flow direction matches "live overwrites static" pattern; test synchronization by updating config and verifying changes propagate through all consumers.

**Critical Path Dependencies**:

- Config builder `scriptData` object must sync with `scripts-list.json` via `update-config-builder.js`
- Script pages require `config.json` existence for overlay engine initialization
- Main page filtering requires `scripts-list.json` generated from all `config.json` files
- Description loading requires `description.md` file presence in script directory

**File Structure Requirements**:

- Script directories must match `id` field in `scripts-list.json`
- Screenshot paths in `config.json` must resolve from `images/script-screenshots/` directory
- Config files must contain `baseImage.src` with correct relative paths (`../../images/script-screenshots/filename.png`)

**Build System Constraints**:

- Script directories without `config.json` are ignored during scan
- Missing `description.md` or `index.html` auto-generate during build with template content
- Screenshot path extraction reads from `config.baseImage.src` (line 500), falls back to `SCRIPT_DATA[id].image` (line 502) if missing
- Build must complete before config builder reflects config.json changes

## File Organization Constraints

### Why `css/` Split into Two Files

**main.css**: Theme system (15 CSS variables) loaded by all pages. Moving theme variables into overlay-system.css breaks main page which doesn't load overlay styles.

**overlay-system.css**: Component-specific styles (hotspots, tooltips, lines) loaded only by script pages and config builder. Config builder must load this to match script page tooltip markdown rendering. Without it, bold/italic/code blocks render differently in preview vs actual.

**What breaks if merged**: Single CSS file forces main landing page to load unused overlay styles (~200 lines), increases page weight without benefit.

### Why `scripts/` Directory Separate from `tools/`

**Build system assumption**: `generate-system.js:481` uses `fs.readdirSync('scripts/')` to discover all script folders. Hardcoded directory name prevents easy reconfiguration.

**Prevents tool pollution**: Keeping config-builder.html outside scripts/ directory ensures build system doesn't treat it as script, preventing auto-generation of `tools/config.json` which would break builder logic.

### Why `data/scripts-list.json` Generated (Not Handwritten)

**Single source of truth**: All script metadata originates from individual `scripts/{id}/config.json` files. Handwriting scripts-list.json creates dual-maintenance burden and synchronization issues.

**Build command requirement**: After changing any `config.json`, must run `node build-system.js` to propagate changes to scripts-list.json and config-builder.js. Forgetting this causes stale data display.
