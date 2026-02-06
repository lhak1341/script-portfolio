# Configuration Reference

## Script Config Schema

Each `scripts/{id}/config.json` follows this structure:

```json
{
  "scriptName": "Script Name",
  "version": "1.0.0",
  "description": "Brief functional description",
  "category": "utility|workflow|automation",
  "tags": ["tag1", "tag2"],
  "pinned": false,
  "baseImage": {
    "src": "../../images/script-screenshots/filename.png",
    "width": 328,
    "height": 612
  },
  "overlays": [
    {
      "id": "unique-id",
      "coordinates": { "x": 24, "y": 66, "width": 227, "height": 18 },
      "color": "cyan",
      "line": {
        "direction": "left",
        "length": 150,
        "thickness": 2
      },
      "description": {
        "content": "**Bold** and _italic_ markdown"
      }
    }
  ]
}
```

## Multi-Segment Lines

Replace simple `line.direction` with `line.segments`:

```json
"line": {
  "segments": [
    { "type": "horizontal", "length": 80 },
    { "type": "vertical", "length": -60 },
    { "type": "horizontal", "length": 40 }
  ],
  "thickness": 2
}
```

## Theme-Aware Colors

| Color | Light | Dark | Usage |
|-------|-------|------|-------|
| `red` | #ef4444 | #f87171 | Errors, critical |
| `orange` | #f97316 | #fb923c | Warnings |
| `yellow` | #eab308 | #facc15 | Caution |
| `green` | #22c55e | #4ade80 | Success |
| `cyan` | #06b6d4 | #22d3ee | Info, primary |
| `purple` | #a855f7 | #c084fc | Special features |
| `pink` | #ec4899 | #f472b6 | Creative elements |

## Scripts List Schema

Generated `data/scripts-list.json`:

```json
{
  "scripts": [
    {
      "id": "script-folder-name",
      "name": "Display Name",
      "version": "1.0.0",
      "category": "utility",
      "description": "Brief description",
      "thumbnail": "images/script-screenshots/file.png",
      "pinned": true,
      "tags": ["tag1", "tag2"]
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

## Required Fields

**config.json**:
- `scriptName`, `version`, `description`, `category` (required)
- `baseImage.src`, `baseImage.width`, `baseImage.height` (required)
- `tags`, `pinned`, `overlays` (optional)

**scripts-list.json** (auto-generated):
- `id`, `name`, `version`, `category`, `description`, `thumbnail` (required)
- `pinned`, `tags` (optional)

## Breaking Changes

### Schema Consolidation

- **Old**: Separate `hotspot` and `highlight` coordinate objects
- **New**: Single `coordinates` object
- **Impact**: Reduces file size 50%, prevents sync issues

### Color System

- **Old**: Hex values (`#3498db`)
- **New**: Semantic names (`cyan`)
- **Impact**: Auto theme-switching, consistent palette

### Markdown Processing

- **Old**: Custom 80-line processor
- **New**: Marked.js library
- **Impact**: Fixes nested lists, code blocks, adds GFM support
