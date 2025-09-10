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
- **Theme-aware color system**: Colors now use semantic names instead of hex values. Engine automatically selects light/dark variants based on system theme
- **Default value handling**: `borderRadius` and `thickness` properties now optional with system defaults (4px and 2px respectively)

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
- `index.html`: Theme detection system with automatic light/dark mode switching, Lucide icon integration for theme indicators and UI elements
- `css/overlay-system.css`: Theme-aware `.script-content` typography styling with 40 new lines using CSS variables for light/dark mode compatibility
- `tools/config-builder.html`: Complete visual overhaul with compact layout, iOS-style toggles, borderless color palette, real-time coordinate editing (120+ line UI restructure)
- `tools/config-builder.js`: Theme-aware preview updates, color system integration for semantic color mapping (40+ line functionality expansion)
- `scripts/sp-comp-setup/config.json`: Configuration migration from hex colors to semantic names for theme compatibility (`#3498db` → `cyan`, etc.)
- `scripts/sp-comp-setup/index.html`: Structured content sections using `.script-content` class for consistent theme-aware styling

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
- **Unified layout**: Header with script name/version, centered screenshot with overlays, left-aligned description sections
- **Tag section styling**: Tags display in single-line layout with visual separation (2rem margin-top, 1.5rem padding-top, 1px border-top using `--border-color`)
- **Inline SVG tag icons**: 22px tag icons rendered as inline SVG (`stroke="currentColor"`, `--text-secondary` color) to avoid Lucide timing issues, eliminates need for dynamic icon replacement
- **Alphabetical tag sorting**: Tags sorted using `[...config.tags].sort()` across all generation files (generate-system.js, add-script.js, overlay-engine.js) and display with 0.9rem font-size for subtle hierarchy
- **Clickable tags**: Navigate back to main page with automatic tag filtering via `encodeURIComponent(tag)` URL parameters
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
- **Modern browsers only**: Chrome/Firefox/Safari/Edge current versions for CSS custom properties, fetch API, and `matchMedia()` theme detection
- **Local HTTP server required**: JSON file loading blocked by CORS policy in file:// protocol
- **JavaScript enabled**: Overlay engine, theme detection, and configuration builder require JavaScript
- **External CDN dependency**: Lucide icons loaded from `https://unpkg.com/lucide@latest/dist/umd/lucide.js` for UI icons and pin indicators

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

### Icon Rendering and Timing Issues

**Symptoms**: Icons disappear on page load, only visible after theme switching; inconsistent icon visibility across different loading states.

**Root Cause**: Dynamic icon library replacement creates timing dependency between CSS rule application and DOM element replacement. Lucide.js replaces `<i data-lucide="tag">` elements with `<svg>` elements asynchronously, invalidating CSS selectors targeting the original elements.

**Diagnostic Steps**:
1. **Verify CSS selector targets**: Check if selectors target pre-replacement (`i[data-lucide]`) or post-replacement (`svg[data-lucide]`) elements
2. **Test timing dependency**: Does manual `lucide.createIcons()` call fix visibility?
3. **Inspect DOM state**: Are elements `<i>` or `<svg>` when CSS rules should apply?

**Architectural Solution**: Replace dynamic icon loading with inline SVG elements to eliminate timing dependencies. Use `stroke="currentColor"` with theme-aware CSS custom properties for color inheritance.

**Prevention Strategy**: Avoid CSS styling of dynamically replaced elements. Use inline SVG with CSS custom properties or CSS classes targeting stable selectors.

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