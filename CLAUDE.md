# After Effects Scripts Showcase Website

**🌐 Live Site**: https://lhak1341.github.io/script-portfolio

## Project Overview
Interactive showcase website for After Effects scripts with hover-based UI overlays. Each script displays screenshot annotations explaining features through clickable hotspots with connecting lines and tooltips.

The website is automatically deployed via GitHub Pages whenever changes are pushed to the main branch. The site serves as a comprehensive wiki and reference guide for After Effects scripts used in production workflows.

## Current Implementation Status

### Core System (✅ Complete)
- **Interactive overlay engine**: Hover detection with CSS transitions, hotspot boundaries trigger tooltip display
- **Configuration-driven architecture**: JSON files at `scripts/{id}/config.json` define overlay coordinates, styling, and content
- **Live preview system**: Real-time hotspot visualization with working hover states in configuration builder
- **Automatic light/dark theme**: System theme detection using `@media (prefers-color-scheme: dark)` with 15 CSS custom properties
- **Tag-based navigation**: Clickable tags navigate to `index.html?tag={name}` with exact tag array filtering

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
        "x": 24, "y": 66, "width": 227, "height": 18
      },
      "color": "cyan",
      "line": {
        "direction": "left", "length": 150,
        "thickness": 2
      },
      // OR use new 3-segment connector system:
      "line": {
        "segments": [
          {"type": "horizontal", "length": 80},
          {"type": "vertical", "length": -60},
          {"type": "horizontal", "length": 40}
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

**Script Page Content Structure**:
- **Semantic HTML sections**: Added `.script-content` CSS class for structured content areas below screenshots
- **Theme-aware typography**: All text colors use CSS variables (`--text-primary`, `--text-secondary`) instead of hardcoded values
- **Consistent tag styling**: `.script-tags` flex layout with theme-appropriate colors

**Recent File Modifications**:
- `js/overlay-engine.js`: Replaced 80-line custom markdown processor with Marked.js integration, added color resolution system with 7 semantic color mappings, implemented pin icon initialization timing fix (67 lines modified)
- `css/main.css`: Removed 125+ lines of duplicate theme CSS rules, consolidated category styling into media queries, added `--accent-color-rgb` variable for RGBA calculations
- `css/overlay-system.css`: Added `.script-content` styling rules (40 new lines), removed unused color variation classes (30 lines removed), consolidated code block styling for tooltips and descriptions
- `tools/config-builder.html`: Added Marked.js CDN integration, reduced interface height by 100px through padding/layout changes, replaced dual-button mode switching with single checkbox
- `tools/config-builder.js`: Replaced 35-line custom markdown processor with Marked.js calls, updated hotspot creation to use single color property, removed unused color system variables
- `scripts/sp-comp-setup/config.json`: Migrated 7 overlays from dual-color schema (`style.color` + `line.color`) to single `color` property, changed hex colors to semantic names
- `generate-system.js`: Added Marked.js CDN script tag to HTML template for all auto-generated script pages
- `index.html`: Added Marked.js CDN integration, theme detection system with localStorage persistence, Lucide icon integration
- `data/scripts-list.json`: Updated 3 script entries from `"featured": true` to `"pinned": true` for naming consistency

### Visual Configuration Builder (✅ Complete)

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
- **Streamlined output**: Generates `"overlays": [...]` format directly (not wrapped in object), eliminating need to strip outer braces during copy-paste
- **Auto-copy**: Configuration automatically copied to clipboard on save, button changes to "Copied! ✓" for 3 seconds
- **Hot reload**: Configuration changes immediately visible in both builder and script pages

#### Memory Management and Performance
**Problem**: Browser "Oh snap!" crashes after continuous pixel-by-pixel adjustments due to memory leak accumulating thousands of orphaned DOM elements.

**Root Cause**: `cleanupPreviousRender()` used `cloneNode(false)` which only cloned parent elements without children. Child elements (line segments, tooltip content) remained in memory without references, preventing garbage collection. Combined with re-rendering on every keystroke (60+ times/second), memory consumption grew exponentially.

**Solution** (`config-builder.js:1342`):
- Clear `innerHTML` before removing parent elements to ensure child element cleanup
- Call `removeChild()` instead of clone/replace pattern to properly detach from DOM
- Optional `window.gc()` hint for browsers with exposed garbage collection

**Input Throttling** (`config-builder.js:363`):
- Debounce input events to 100ms (maximum 10 updates/second) instead of re-rendering on every keystroke
- Immediate update on `blur`/`change` events for final value confirmation
- Reduces DOM operations from ~1000/second to ~10/second during continuous adjustments

**Stylesheet Loading**: Config builder now loads `overlay-system.css` in addition to `main.css` (line 8). Ensures tooltip markdown styling (bold, code, italic) matches script pages, prevents line-break discrepancies between preview and actual rendering.

### Main Landing Page (✅ Complete)

#### Script Discovery System
- **Responsive grid layout**: CSS Grid with `repeat(auto-fit, minmax(350px, 1fr))` adapts to screen width, displays 3+ scripts per row on desktop
- **Two-card layout optimization**: JavaScript adds `two-cards` class when exactly 2 scripts display, constrains cards to 400px width with `repeat(2, 400px)` grid template to maintain proportions instead of stretching
- **Multi-filter search**: Text search across names/descriptions + category dropdown + sorting options
- **Interactive tag filtering**: Script card tags use click handlers with `stopPropagation()` to prevent card navigation, update URL parameters with `pushState()`, clear search input, trigger `handleFiltering()` for instant results
- **Filter notification system**: Displays "Showing scripts tagged with 'tagname'" banner with inline SVG tag icon (22px, `--text-secondary` color) and Clear button for easy filter removal
- **URL parameter handling**: `?tag=composition` automatically filters and shows notification banner
- **Pinned scripts system**: Scripts marked with `"pinned": true` automatically sort to top of list, display 24px accent-colored pin icon rotated 45° clockwise in top-right corner, feature blue border with gradient background overlay and shadow effects

#### Navigation Architecture
- **Sticky navigation**: Search bar and filters remain accessible while scrolling
- **Breadcrumb system**: "Back to Scripts" links from individual script pages
- **Filter state management**: URL parameters preserve search state across page navigations

### Individual Script Pages (✅ Complete)

#### Interactive Features
- **Hover-triggered overlays**: Hotspot areas show highlight boxes, connecting lines, and positioned tooltips on mouse enter
- **iPhone-style toggle switch**: 42×24px iOS-style toggle replaces basic button, with `cubic-bezier(0.4, 0.0, 0.2, 1)` animations and theme-aware styling (`#e5e5ea→#39393d` backgrounds, automatic accent color integration)
- **Toggle display modes**: Switch between hover-only and permanent overlay visibility using checkbox input with synchronized state management
- **Responsive scaling**: Overlay coordinates scale proportionally with image display size
- **Markdown rendering**: Tooltip content supports `**bold**` and `_italic_` formatting with custom colored styling

#### Content Structure
- **Script card metadata layout**: Version badge and category pill display on same horizontal line using `.script-meta` flexbox container (gap: 0.75rem), replacing vertical stacking
- **Category name consolidation**: "Utility Tools" shortened to "Utility" across data files, template generators, and hardcoded references for consistent naming
- **Unified layout**: Header with script name/version, centered screenshot with overlays, left-aligned description sections
- **Tag section styling**: Tags display in single-line layout with visual separation (2rem margin-top, 1.5rem padding-top, 1px border-top using `--border-color`)
- **Inline SVG tag icons**: 22px tag icons rendered as inline SVG (`stroke="currentColor"`, `--text-secondary` color) to avoid Lucide timing issues, eliminates need for dynamic icon replacement
- **Alphabetical tag sorting**: Tags sorted using `[...config.tags].sort()` across all generation files (generate-system.js, add-script.js, overlay-engine.js) and display with 0.9rem font-size for subtle hierarchy
- **Clickable tags**: Navigate back to main page with automatic tag filtering via `encodeURIComponent(tag)` URL parameters
- **Feature documentation**: Key features list and implementation details below interactive screenshot

#### Tooltip Styling
**Fixed CSS constraints** (`overlay-system.css:159`):
- `max-width: 320px` - prevents tooltips from becoming too wide for readability
- `min-width: 200px` - ensures consistent visual presence, prevents narrow tooltips
- `font-size: 13px` with `line-height: 1.4` - optimized for ~50-65 characters per line at max width
- `padding: 10px 14px` with `border-radius: 6px` - compact spacing with rounded corners
- `box-shadow: var(--card-shadow)` - theme-aware elevation consistent with card elements

**Content auto-wrapping**: Width determined by content length between min/max bounds, `word-wrap: break-word` prevents overflow on long unbroken strings.

## Development Setup

### Starting Local Server
Run from project root directory:

**Python (most common):**
```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

### Accessing Configuration Builder
Once server is running, access the visual overlay configuration tool at:
`http://localhost:8000/tools/config-builder.html`

## Technical Dependencies & Constraints

### Browser Requirements
- **Modern browsers only**: Chrome/Firefox/Safari/Edge current versions for CSS custom properties, fetch API, and `matchMedia()` theme detection
- **Local HTTP server required**: JSON file loading blocked by CORS policy in file:// protocol
- **JavaScript enabled**: Overlay engine, theme detection, and configuration builder require JavaScript
- **External CDN dependency**: Lucide icons loaded from `https://unpkg.com/lucide@latest/dist/umd/lucide.js` for UI icons and pin indicators

### File System Architecture
- **Fixed directory structure**: Scripts must follow `scripts/{id}/index.html` and `scripts/{id}/config.json` pattern
- **Image path dependencies**: Screenshot paths relative to script directory as `../../images/script-screenshots/{filename}`
- **JSON structure requirements**: Missing overlay properties cause rendering failures without graceful degradation

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
- **Script quantity threshold**: Main page grid layout optimized for 10-20 scripts, performance degrades with 50+ scripts due to image loading overhead
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
console.log('Scale factors:', {scaleX, scaleY});
console.log('Image dimensions:', {actual: img.offsetWidth, config: config.width});
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
window.matchMedia('(prefers-color-scheme: dark)').matches
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
    "width": 328, "height": 612
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
1. Dropdown populated from hardcoded `scriptData` object
2. Script selection loads existing `config.json` via fetch with cache-busting
3. Overlay creation updates in-memory configuration
4. Save outputs `{"overlays": [...]}` for manual config file update

### Breaking Changes and Dependencies

**Critical Path Dependencies**:
- Config builder requires `scriptData` object synchronization with `scripts-list.json`
- Script pages depend on `config.json` existence for overlay engine initialization  
- Main page filtering requires `scripts-list.json` generation from config files
- Description loading depends on `description.md` file presence

**File Structure Requirements**:
- Script directories must match `id` field in `scripts-list.json`
- Screenshot paths must resolve from `images/script-screenshots/` directory
- Config files must contain `baseImage.src` with correct relative paths

**Build System Constraints**:
- Script directories without `config.json` files are ignored during build
- Missing `description.md` or `index.html` files cause auto-generation during build
- Config builder dropdown becomes stale without running sync step after config changes
- Screenshot paths in `config.json` must resolve to actual files in `images/script-screenshots/`

## Project Structure
```
project-root/
├── index.html                    # Main landing page with search/filter
├── build-system.js              # Complete build: scan + generate + sync
├── generate-system.js           # Core file structure generator  
├── update-config-builder.js     # Config builder dropdown synchronization
├── add-script.js                # New script creation utility
├── css/
│   ├── main.css                 # Global styles + theme system (15 CSS variables)
│   └── overlay-system.css       # Hotspot, highlight, line, tooltip components
├── js/
│   ├── overlay-engine.js        # OverlayEngine class + main page functionality
│   ├── utils.js                 # Helper functions (debounce, DOM utils)
│   └── config-builder.js        # Visual configuration interface (ConfigurationBuilder class)
├── images/
│   └── script-screenshots/      # PNG screenshots for overlay system
├── scripts/                     # Script directories (scanned at build time)
│   ├── sp-comp-setup/          
│   │   ├── config.json         # Required: Script metadata + overlay coordinates
│   │   ├── description.md      # Auto-created: Dynamic content loaded by engine
│   │   └── index.html          # Auto-created: Script showcase page
│   ├── [9 other scripts]/      # Same structure, discovered automatically
├── tools/
│   └── config-builder.html     # Visual overlay configuration interface
└── data/
    └── scripts-list.json       # Generated from scripts/ directory scan
```