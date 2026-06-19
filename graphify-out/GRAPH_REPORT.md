# Graph Report - script-portfolio  (2026-06-19)

## Corpus Check
- 33 files · ~23,732 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 394 nodes · 461 edges · 55 communities (28 shown, 27 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd31c50d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Configuration Builder Core Logic|Configuration Builder Core Logic]]
- [[_COMMUNITY_Build and Script Generation|Build and Script Generation]]
- [[_COMMUNITY_Overlay Engine Core Rendering|Overlay Engine Core Rendering]]
- [[_COMMUNITY_UI Utilities and Script Cards|UI Utilities and Script Cards]]
- [[_COMMUNITY_Overlay Configuration and Utilities|Overlay Configuration and Utilities]]
- [[_COMMUNITY_System Architecture and Documentation|System Architecture and Documentation]]
- [[_COMMUNITY_Theme Management System|Theme Management System]]
- [[_COMMUNITY_Config Builder Tool Interface|Config Builder Tool Interface]]
- [[_COMMUNITY_ESLint Configuration and Globals|ESLint Configuration and Globals]]
- [[_COMMUNITY_Config Builder Guide and Patterns|Config Builder Guide and Patterns]]
- [[_COMMUNITY_Build System Documentation|Build System Documentation]]
- [[_COMMUNITY_Versioning Toolkit Documentation|Versioning Toolkit Documentation]]
- [[_COMMUNITY_SP Comp Setup Module|SP Comp Setup Module]]
- [[_COMMUNITY_SP Deadline Module|SP Deadline Module]]
- [[_COMMUNITY_Script Usage Analyzer Documentation|Script Usage Analyzer Documentation]]
- [[_COMMUNITY_Test Framework Configuration|Test Framework Configuration]]
- [[_COMMUNITY_Overlay Engine Source File|Overlay Engine Source File]]
- [[_COMMUNITY_Theme Management Source File|Theme Management Source File]]
- [[_COMMUNITY_Common Utility Source File|Common Utility Source File]]
- [[_COMMUNITY_Config Builder Tool Source|Config Builder Tool Source]]
- [[_COMMUNITY_Project Root Landing Page|Project Root Landing Page]]
- [[_COMMUNITY_Project Configuration Documentation|Project Configuration Documentation]]
- [[_COMMUNITY_AI Mistakes and Lessons|AI Mistakes and Lessons]]
- [[_COMMUNITY_Script Creation Utility|Script Creation Utility]]
- [[_COMMUNITY_Script Card Rendering Logic|Script Card Rendering Logic]]
- [[_COMMUNITY_Theme System Architecture Notes|Theme System Architecture Notes]]
- [[_COMMUNITY_Versioning Setup Toolkit Page|Versioning Setup Toolkit Page]]
- [[_COMMUNITY_Find and Replace Tool Page|Find and Replace Tool Page]]
- [[_COMMUNITY_Find and Replace Tool Documentation|Find and Replace Tool Documentation]]
- [[_COMMUNITY_Effect Usage Analyzer Page|Effect Usage Analyzer Page]]
- [[_COMMUNITY_Versioning CSV Tool Page|Versioning CSV Tool Page]]
- [[_COMMUNITY_SP Comp Edit Page|SP Comp Edit Page]]
- [[_COMMUNITY_SP SRT Importer Page|SP SRT Importer Page]]
- [[_COMMUNITY_SP SRT Importer Documentation|SP SRT Importer Documentation]]
- [[_COMMUNITY_Expression Usage Analyzer Page|Expression Usage Analyzer Page]]
- [[_COMMUNITY_Khoa Sharing Toolbar Page|Khoa Sharing Toolbar Page]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `ConfigurationBuilder` - 53 edges
2. `OverlayEngine` - 23 edges
3. `AI Mistake Catalogue` - 9 edges
4. `sanitizeHTML()` - 7 edges
5. `Build System` - 7 edges
6. `Configuration Reference` - 7 edges
7. `Config Builder User Guide` - 7 edges
8. `renderMarkdown()` - 6 edges
9. `Configuration-Driven System` - 6 edges
10. `Debugging Guide` - 6 edges

## Surprising Connections (you probably didn't know these)
- `OverlayEngine` --implements--> `Coordinate Scaling System`  [INFERRED]
  js/overlay-engine.js → docs/architecture.md
- `OverlayEngine` --implements--> `Multi-Segment Line System`  [INFERRED]
  js/overlay-engine.js → docs/architecture.md
- `renderMarkdown()` --calls--> `configureMarked()`  [INFERRED]
  js/overlay-utils.js → js/overlay-defaults.js
- `renderMarkdown()` --calls--> `sanitizeHTML()`  [INFERRED]
  js/overlay-utils.js → js/utils.js
- `ConfigurationBuilder` --calls--> `js/overlay-defaults.js`  [EXTRACTED]
  tools/config-builder.js → js/overlay-defaults.js

## Hyperedges (group relationships)
- **Build Sync Pipeline** — generate_system_js, update_config_builder_js, config_builder_js [INFERRED 0.95]
- **Overlay Rendering System** — overlay_engine_js, overlay_utils_js, overlay_defaults_js, utils_js [INFERRED 0.95]
- **Usage Analysis Scripts** — effect_usage_analyzer_index, expression_usage_analyzer_index, find_replace_expression_index [INFERRED 0.85]
- **Project Versioning Scripts** — sp_versioning_setup_toolkit_index, sp_versioning_csv_index [INFERRED 0.95]

## Communities (55 total, 27 thin omitted)

### Community 1 - "Build and Script Generation"
Cohesion: 0.06
Nodes (30): 2-card layout stretches full width, Browser DevTools, Cards overflow on mobile, code:bash (python3 -m http.server 8000), code:javascript (// In browser console), code:javascript (// Check console for scale factors), code:bash (node build-system.js), code:bash (node build-system.js) (+22 more)

### Community 2 - "Overlay Engine Core Rendering"
Cohesion: 0.11
Nodes (19): CATEGORY_NAMES, createScriptCard(), getCategoryName(), handleFiltering(), initializeOverlayEngine(), loadScriptsList(), renderScriptCards(), setupFilters() (+11 more)

### Community 3 - "UI Utilities and Script Cards"
Cohesion: 0.07
Nodes (27): Access the Builder, Auto-Conversion Rules, Best Practices, Can't click hotspots, Click-Drag Creation, code:bash (# 1. Start server), code:bash (node build-system.js), Config Builder User Guide (+19 more)

### Community 4 - "Overlay Configuration and Utilities"
Cohesion: 0.15
Nodes (5): buildSegmentedLineSegments(), configureMarked(), isValidSegmentPattern(), OVERLAY_DEFAULTS, OverlayEngine

### Community 5 - "System Architecture and Documentation"
Cohesion: 0.11
Nodes (17): generateScriptsList, args, createScript(), escapeHtml(), fs, path, { execSync }, steps (+9 more)

### Community 6 - "Theme Management System"
Cohesion: 0.1
Nodes (19): Build System, Category Validation, code:bash (node add-script.js script-id "Script Name" "1.0.0" "Descript), code:block2 (scripts/), code:block3 (Individual config.json files), Commands, Common Issues, Config File Validation (+11 more)

### Community 7 - "Config Builder Tool Interface"
Cohesion: 0.17
Nodes (11): configureMarked(), hexToRgba(), positionTooltipForSegmentedLine(), renderMarkdown(), resolveOverlayColor(), safeStyleColor(), applyTheme(), getEffectiveTheme() (+3 more)

### Community 8 - "ESLint Configuration and Globals"
Cohesion: 0.12
Nodes (16): Architecture Documentation, Build Process, code:block1 (scripts/), Configuration-Driven System, Coordinate Scaling System, CSS Split Rationale, Data Flow Architecture, Directory Structure (+8 more)

### Community 9 - "Config Builder Guide and Patterns"
Cohesion: 0.14
Nodes (13): Breaking Changes, code:json ({), code:json ("line": {), code:json ({), Color System, Configuration Reference, Markdown Processing, Multi-Segment Lines (+5 more)

### Community 10 - "Build System Documentation"
Cohesion: 0.2
Nodes (9): Accessibility, AI Mistake Catalogue, Build & Workflow, Config / HTML pages, CSS / Theme, DOM & Scoping, JavaScript / Syntax, OverlayEngine internals (+1 more)

### Community 11 - "Versioning Toolkit Documentation"
Cohesion: 0.29
Nodes (6): After Effects Scripts Portfolio, code:bash (npm run build   # REQUIRED after any scripts/{id}/config.jso), graphify, More detail, Non-negotiable commands, Two non-obvious failure modes

### Community 12 - "SP Comp Setup Module"
Cohesion: 0.33
Nodes (7): Coordinate Scaling System, docs/architecture.md, Multi-Segment Line System, ConfigurationBuilder, js/overlay-defaults.js, OverlayEngine, js/overlay-utils.js

### Community 13 - "SP Deadline Module"
Cohesion: 0.33
Nodes (5): badgeContainer, header, subtitle, tagsContainer, title

### Community 14 - "Script Usage Analyzer Documentation"
Cohesion: 0.33
Nodes (5): Documentation, For AI Agents, For Humans, Quick Navigation, When to Use Which Doc

### Community 15 - "Test Framework Configuration"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 16 - "Overlay Engine Source File"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 17 - "Theme Management Source File"
Cohesion: 0.33
Nodes (5): Key Features, Quick Start Workflow, Reference, Required Folder Structure, Template

### Community 18 - "Common Utility Source File"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 19 - "Config Builder Tool Source"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 20 - "Project Root Landing Page"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 21 - "Project Configuration Documentation"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 22 - "AI Mistakes and Lessons"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 23 - "Script Creation Utility"
Cohesion: 0.33
Nodes (5): About This Script, Compatibility, How It Works, Installation, Key Features

### Community 24 - "Script Card Rendering Logic"
Cohesion: 0.4
Nodes (4): Key Features, Pools, Quick Start Workflow, Reference

### Community 25 - "Theme System Architecture Notes"
Cohesion: 0.5
Nodes (3): globals, js, projectBrowserGlobals

### Community 26 - "Versioning Setup Toolkit Page"
Cohesion: 0.67
Nodes (3): Config Builder User Guide, H-V-H Path Pattern, Straight Horizontal Line Pattern

## Knowledge Gaps
- **177 isolated node(s):** `fs`, `path`, `CATEGORIES`, `fs`, `path` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConfigurationBuilder` connect `Configuration Builder Core Logic` to `Overlay Configuration and Utilities`, `Config Builder Tool Interface`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `renderMarkdown()` connect `Config Builder Tool Interface` to `Overlay Engine Core Rendering`, `Overlay Configuration and Utilities`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `sanitizeHTML()` connect `Overlay Engine Core Rendering` to `Config Builder Tool Interface`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `sanitizeHTML()` (e.g. with `.loadConfig()` and `createScriptCard()`) actually correct?**
  _`sanitizeHTML()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `CATEGORIES` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Configuration Builder Core Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Build and Script Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._