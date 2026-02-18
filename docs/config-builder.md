# Config Builder User Guide

## Getting Started

### Access the Builder

```bash
# 1. Start server
python3 -m http.server 8000

# 2. Open in browser
http://localhost:8000/tools/config-builder.html
```

### Select a Script

1. Use dropdown to select existing script
2. Screenshot and existing overlays load automatically
3. Edit mode: Select existing hotspots or create new ones

## Creating Hotspots

### Mode Switching

Toggle checkbox: **Select Mode** ↔ **Create Mode**

- **Select Mode** (default): Click existing hotspots to edit
- **Create Mode**: Click-drag to create new hotspots

### Click-Drag Creation

1. Switch to Create Mode
2. Click and drag on screenshot to draw rectangle
3. Hotspot appears with default properties
4. Edit properties in right panel

### Property Panel

**Hotspot ID**: Unique identifier (auto-generated)

**Position**:
- X: Horizontal position (0-2000px)
- Y: Vertical position (0-2000px)

**Size**:
- Width: Hotspot width
- Height: Hotspot height

**Color**: Choose from 7 theme-aware colors (single-row palette)

**Line Configuration**:
- Horizontal Distance: -300 to 300px (positive = right, negative = left)
- Vertical Distance: -300 to 300px (positive = down, negative = up)
- Turn Point: Where to turn vertically (disabled if vertical = 0)

**Description**: Markdown-supported tooltip content

## Line Configuration

### Distance-Based System

Replaces low-level segment editing with intuitive controls:

**Straight Horizontal Line**:
- Horizontal Distance: 120
- Vertical Distance: 0
- Turn Point: (disabled)

Result: `[{type: "horizontal", length: 120}]`

**H-V-H Path**:
- Horizontal Distance: 120
- Vertical Distance: -80
- Turn Point: 60

Result: `[{horizontal: 60}, {vertical: -80}, {horizontal: 60}]`

### Auto-Conversion Rules

- `vertical === 0` → Generates 1-segment straight line
- `turningPoint === 0` → Auto-sets to `horizontal / 2` (balanced)
- `turningPoint === horizontal` → Special case keeps tooltip at edge

### UI Behavior

- Turn Point field auto-disables when vertical = 0
- Changing vertical from 0 → non-zero auto-populates turn point
- Example guidance shows resulting patterns

## Saving Configuration

### Save Button

1. Click "Save Configuration"
2. JSON auto-copies to clipboard
3. Button shows "Copied! ✓" for 3 seconds

### Paste into Config

1. Open `scripts/{script-id}/config.json`
2. Find `"overlays": [...]` section
3. Paste clipboard content (replaces entire array)
4. Save file

### Rebuild System

```bash
node build-system.js
```

### Verify Changes

1. Refresh script page in browser (Ctrl+Shift+R)
2. Overlays should reflect new configuration

## Memory Management

### Best Practices

**Avoid long editing sessions**: Config builder can accumulate memory over time

**Save frequently**: Save and reload if you notice lag

**Switch scripts**: Triggers cache cleanup

### Performance Tips

- **Limit overlays**: <50 per script for best performance
- **Keep descriptions short**: <1000 chars for smooth processing
- **Throttled inputs**: 100ms debounce on text inputs

## Troubleshooting

### Preview doesn't match script page

**Check**: Is `overlay-system.css` loaded in builder?
**Cause**: Different CSS → different tooltip rendering
**Fix**: Builder must load both `main.css` and `overlay-system.css`

### Coordinates don't match

**Check**: `baseImage.width/height` in config vs. actual screenshot
**Cause**: Scale ratio mismatch
**Fix**: Update config dimensions to match screenshot

### Can't click hotspots

**Check**: Are you in Create Mode?
**Fix**: Toggle to Select Mode to edit existing hotspots

### Save button doesn't copy

**Check**: Browser clipboard permissions
**Fix**: Manually select and copy JSON output
