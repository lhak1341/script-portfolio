# After Effects Scripts Showcase Website

## Project Overview
Interactive showcase website for After Effects scripts with hover-based UI overlays. Each script displays screenshot annotations explaining features through clickable hotspots with connecting lines and tooltips.

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
- **Line rendering**: CSS `::before` pseudo-elements positioned at hotspot edges using `left: 100%` and `right: 100%` for directional extension
- **Tooltip positioning**: Absolute positioning calculated from hotspot center + line length + 15px offset, with direction-specific transform centering
- **Z-index layering**: Highlights (z-5), hotspots (z-10), lines (z-30), tooltips (z-25) prevent visual conflicts

#### Configuration Schema
Each script overlay configuration follows this consolidated structure with theme-aware color system:
```json
{
  "scriptName": "Script Name",
  "version": "1.0.0", 
  "description": "Brief script description",
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
      "style": {
        "color": "cyan", "borderRadius": 4
      },
      "line": {
        "direction": "left", "length": 150,
        "color": "cyan", "thickness": 2
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
- **Theme-aware color system**: Colors now use semantic names (`red`, `orange`, `yellow`, `green`, `cyan`, `purple`, `pink`) instead of hex values. Engine automatically selects light/dark variants based on system theme (e.g., `cyan`: light `#06b6d4` → dark `#22d3ee`)
- **Default value handling**: `borderRadius` and `thickness` properties now optional with system defaults (4px and 2px respectively)

#### Theme System Implementation
- **CSS custom properties**: 16 variables for colors, backgrounds, shadows automatically switch based on system preference
- **Real-time detection**: JavaScript `matchMedia('prefers-color-scheme: dark')` with event listeners for instant theme changes
- **Complete dark mode coverage**: All interface elements adapt to theme changes, including:
  - Script screenshot backgrounds (`--bg-tertiary` replaces hardcoded `#f8f9fa`)
  - Version badges (`--bg-tertiary` replaces hardcoded `#e9ecef`)
  - Category pills (dark-specific color variants: green `#2d5a3d→#90ee90`, blue `#1e3a5f→#87ceeb`, brown `#5d4e37→#ffd700`)
  - Tag elements (`--bg-tertiary` and `--border-color` replace hardcoded grays)
  - Script content sections (new `.script-content` CSS class with theme-aware typography)
- **RGBA color calculations**: Added `--accent-color-rgb: 102, 126, 234` for transparency calculations (e.g., `rgba(var(--accent-color-rgb), 0.1)`)
- **Theme indicator**: Header displays current theme with sun/moon icons

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

**Configuration Builder Interface Redesign**:
- **Compact layout system**: Reduced padding throughout interface (container: `2rem→1rem`, panels: `2rem→1rem`, form groups: `1.5rem→1rem`)
- **Simplified mode switching**: Single iOS-style toggle for "Create Hotspot Mode" replaces dual-button approach (select mode is default)
- **Editable coordinate inputs**: Real-time X/Y/Width/Height number inputs replace read-only coordinate display for pixel-precise adjustments
- **Clean color palette**: Borderless color dots in single horizontal row, removed text labels and background container
- **Minimal hotspot list**: Shows only ID, direction arrow, and color indicator - removed coordinate/size details for cleaner selection interface
- **Streamlined sections**: Removed redundant "Script Selection" header and placeholder messaging for focused workflow

**Script Page Content Structure**:
- **Semantic HTML sections**: Added `.script-content` CSS class for structured content areas below screenshots
- **Theme-aware typography**: All text colors use CSS variables (`--text-primary`, `--text-secondary`) instead of hardcoded values
- **Consistent tag styling**: `.script-tags` flex layout with theme-appropriate colors

**File Modification Summary**:
- `js/overlay-engine.js`: Color resolution system, defaults constants, theme detection integration (23 new lines)
- `css/main.css`: Added `--accent-color-rgb` variable for RGBA calculations (2 new variables)
- `css/overlay-system.css`: Added `.script-content` styling with 40 new lines of theme-aware typography
- `tools/config-builder.html`: Complete UI overhaul with Lucide icons, color palette, theme integration (200+ line changes)
- `tools/config-builder.js`: Color system integration, theme-aware preview updates (modification scope unknown)
- `scripts/sp-comp-setup/config.json`: Migrated 3 overlays from hex colors to semantic names (`#3498db` → `cyan`, `orange`, `purple`)
- `scripts/sp-comp-setup/index.html`: Replaced hardcoded styling with `.script-content` class structure
- `data/scripts-list.json`: Standardized script properties from `"featured"` to `"pinned"` for consistency with codebase (3 scripts marked as pinned)
- `js/overlay-engine.js`: Added `lucide.createIcons()` call in `renderScriptCards()` to initialize pin icons after DOM creation, implemented pinned-first sorting in `loadScriptsList()` to ensure pinned scripts appear at top on initial page load

### Visual Configuration Builder (✅ Complete)

#### Hotspot Creation Workflow
- **Toggle-based mode switching**: Single checkbox toggles between select mode (default) and create mode for clear workflow separation
- **Click-drag selection**: Mouse events create rectangular hotspot boundaries when in create mode, automatic coordinate calculation
- **Pixel-precise editing**: Dedicated number inputs for Position (X, Y) and Size (Width, Height) allow 1-pixel adjustments
- **Visual property panel**: Hotspot ID input, single-row color palette (7 theme-aware colors), line direction/length controls, markdown description field
- **Real-time preview**: All changes instantly update visual overlay preview using same positioning logic as production engine

#### Configuration Management
- **Script selection**: Dropdown loads existing `config.json` files from `scripts/{id}/` directories
- **Cache-busting**: `fetch()` requests include timestamp parameters to bypass browser caching
- **Copy-paste workflow**: JSON output with instructions to manually update script config files
- **Hot reload**: Configuration changes immediately visible in both builder and script pages

### Main Landing Page (✅ Complete)

#### Script Discovery System
- **Grid layout**: Script cards with screenshots, descriptions, version badges, tag lists
- **Multi-filter search**: Text search across names/descriptions + category dropdown + sorting options
- **Tag-based navigation**: Clicking script tags filters main page to show only scripts with that exact tag
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
- **Unified layout**: Header with script name/version, centered screenshot with overlays, left-aligned description sections
- **Clickable tags**: Navigate back to main page with automatic tag filtering
- **Feature documentation**: Key features list and implementation details below interactive screenshot

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
- **Modern browsers only**: Chrome/Firefox/Safari/Edge current versions for CSS custom properties and fetch API
- **Local HTTP server required**: JSON file loading blocked by CORS policy in file:// protocol
- **JavaScript enabled**: Overlay engine, theme detection, and configuration builder require JavaScript

### File System Architecture
- **Fixed directory structure**: Scripts must follow `scripts/{id}/index.html` and `scripts/{id}/config.json` pattern
- **Image path dependencies**: Screenshot paths relative to script directory as `../../images/script-screenshots/{filename}`
- **JSON structure requirements**: Missing overlay properties cause rendering failures without graceful degradation

### Performance Characteristics
- **Coordinate calculation overhead**: Scaling calculations run on every window resize and configuration change
- **CSS transition limitations**: 0.3s transition duration fixed across all hover states
- **Memory usage**: All overlay elements remain in DOM, hidden via opacity rather than creation/destruction

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

## Project Structure
```
project-root/
├── index.html                    # Main landing page with search/filter
├── css/
│   ├── main.css                 # Global styles + theme system (15 CSS variables)
│   └── overlay-system.css       # Hotspot, highlight, line, tooltip components
├── js/
│   ├── overlay-engine.js        # OverlayEngine class + main page functionality
│   ├── utils.js                 # Helper functions (debounce, DOM utils)
│   └── config-builder.js        # Visual configuration interface (ConfigurationBuilder class)
├── images/
│   └── script-screenshots/      # PNG screenshots for overlay system
├── scripts/
│   └── sp-comp-setup/          # Example: working script with 2 configured overlays
│       ├── index.html          # Script page with overlay integration
│       └── config.json         # Overlay coordinates and styling
├── tools/
│   └── config-builder.html     # Visual overlay configuration interface
└── data/
    └── scripts-list.json       # Master script metadata (fallback data included)
```