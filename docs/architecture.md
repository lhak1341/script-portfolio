# Architecture Documentation

## Configuration-Driven System

### Why JSON Config Files Exist

Overlay coordinates stored in `scripts/{id}/config.json` separate from HTML to allow config builder to generate and update overlays without HTML parsing. Moving coordinates into HTML data attributes breaks config builder save functionality.

### Coordinate Scaling System

Screenshots displayed at variable sizes across devices. Coordinates stored in absolute pixels at original screenshot dimensions (`baseImage.width/height`), scaled via `image.offsetWidth / config.width` ratio at runtime. Without scaling, overlays misalign when image size changes.

### Theme System Architecture

- **Three-state management**: `auto` (follows OS), `light`, `dark`
- **CSS override pattern**: `body.theme-light` and `body.theme-dark` override media queries
- **Media query detection**: `@media (prefers-color-scheme: dark)` for auto mode
- **Storage**: `localStorage.setItem('theme-preference', currentTheme)` persists choice

### Overlay Positioning System

- **Coordinate scaling**: Overlays scale using `image.offsetWidth / config.width` ratio
- **Z-index layering**: Highlights (z-5), hotspots (z-10), tooltips (z-25), lines (z-30)
- **Flexible connectors**: Single-direction lines + multi-segment H-V-H paths
- **Tooltip positioning**: Absolute position from connector end + 15px offset

### Multi-Segment Line System

**Enforced Patterns**:
- 1 segment: `[{type: "horizontal", length: N}]` - straight line
- 3 segments: `[{type: "horizontal"}, {type: "vertical"}, {type: "horizontal"}]` - H-V-H path

**Validation**: `isValidSegmentPattern()` in `overlay-engine.js:313` and `config-builder.js:899`

**Dual-Line Display**:
- **Hover mode** (toggle OFF): Single horizontal line (sum of segments), cleaner UI
- **Show All mode** (toggle ON): Full H-V-H path, shows designed navigation

## File Organization

### Directory Structure

```
scripts/
├── {script-id}/
│   ├── config.json       # Required: metadata + overlays
│   ├── description.md    # Auto-created content
│   └── index.html        # Auto-created showcase page
data/
├── scripts-list.json     # Generated from all configs
js/
├── overlay-engine.js     # Core rendering engine
├── overlay-defaults.js   # Shared color palette
├── theme.js              # Theme management
└── utils.js              # Helper functions
tools/
└── config-builder.html   # Visual editor
```

### Why Directories Can't Move

- **scripts/**: Hardcoded in `generate-system.js:481` scan logic
- **tools/**: Relative paths in config builder (`../scripts/{id}/config.json`)
- **images/**: Config files use relative paths (`../../images/script-screenshots/`)

### CSS Split Rationale

**main.css**: Theme variables, loaded by all pages
**overlay-system.css**: Overlay-specific styles, loaded only by script pages + builder

Config builder must load both to match script page rendering.

## Data Flow Architecture

### Build Process

1. Scan `scripts/` for folders with `config.json`
2. Read each `config.json`
3. Generate `data/scripts-list.json`
4. Sync `tools/config-builder.js` dropdown

### Page Load Flow

**Main Page**:
1. Fetch `data/scripts-list.json`
2. Render script cards
3. Setup filtering/search

**Script Page**:
1. Load `scripts/{id}/config.json`
2. Initialize overlay system
3. Load `description.md` content
4. Render interactive overlays

**Config Builder**:
1. Load dropdown from `scriptData`
2. Fetch selected script's `config.json`
3. Enable visual editing
4. Generate JSON output

## Performance Characteristics

- **Overlay limit**: 50 per page before degradation
- **Config size**: <10KB for sub-100ms load
- **Markdown**: <1000 chars for <5ms processing
- **Script quantity**: 10-20 optimal, degrades >50
