# Build System

## Commands

### `node build-system.js`

Complete build orchestrator. **Run this after ANY config.json change.**

What it does:
1. Runs `generate-system.js` to create missing files
2. Runs `update-config-builder.js` to sync dropdown

Output:
- `data/scripts-list.json` (from all config files)
- `tools/config-builder.js` scriptData updated
- Missing `description.md` and `index.html` created

### `node generate-system.js`

Scans `scripts/` and creates missing files:
- `description.md` with template content
- `index.html` showcase pages
- Updates `scripts-list.json`

### `node update-config-builder.js`

Syncs config builder dropdown from `scripts-list.json`:
- Updates `scriptData` object in `tools/config-builder.js`
- Enables script selection in visual editor

### `node add-script.js`

Quick script creation:

```bash
node add-script.js script-id "Script Name" "1.0.0" "Description" "category" "tag1,tag2"
```

Creates:
- `scripts/script-id/` directory
- `config.json` with provided metadata
- Placeholder `description.md`
- Standard `index.html`

**Always run `node build-system.js` after!**

## Directory Scanning

### What Gets Included

Only directories in `scripts/` containing `config.json`

```
scripts/
├── my-script/          ← Has config.json ✓
│   └── config.json
├── another-script/     ← Has config.json ✓
│   └── config.json
└── incomplete/         ← No config.json ✗ (skipped)
```

### What Gets Auto-Created

Missing files auto-generated during build:

- `description.md`: Template with placeholder content
- `index.html`: Standard overlay showcase page

Config builder sync happens automatically.

## Data Flow

```
Individual config.json files
        ↓
  generate-system.js (scans scripts/)
        ↓
  scripts-list.json (aggregated data)
        ↓
  update-config-builder.js (sync)
        ↓
  config-builder.js scriptData (dropdown)
```

## Critical Dependencies

**After changing config.json**:
1. MUST run `node build-system.js`
2. Refresh browser to see changes

**Why**: Config changes don't auto-propagate. Build system syncs 3 data sources:
- Individual `scripts/{id}/config.json`
- Aggregated `data/scripts-list.json`
- Config builder `scriptData` object

Forgetting build → stale data in main page + config builder dropdown

## Validation

### Config File Validation

Build system checks for required fields:
- `scriptName`, `version`, `category`, `description`
- Missing fields → script skipped with warning

### Category Validation

`add-script.js` validates category:
- Must be: `utility`, `workflow`, or `automation`
- Invalid → error and exit

### Path Validation

Screenshot paths must:
- Exist in `images/script-screenshots/`
- Use relative path from script directory
- Format: `../../images/script-screenshots/filename.png`

## Common Issues

**Stale dropdown in config builder**:
- Cause: Forgot to run `build-system.js`
- Fix: Run build command, refresh browser

**Script not appearing on main page**:
- Cause: Missing required fields in `config.json`
- Fix: Check console for warnings, add missing fields

**Screenshot not loading**:
- Cause: Incorrect `baseImage.src` path
- Fix: Verify path is relative and file exists
