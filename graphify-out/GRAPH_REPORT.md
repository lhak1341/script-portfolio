# Graph Report - .  (2026-05-09)

## Corpus Check
- Corpus is ~25,242 words - fits in a single context window. You may not need a graph.

## Summary
- 202 nodes · 295 edges · 26 communities (15 shown, 11 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Configuration Builder Logic|Configuration Builder Logic]]
- [[_COMMUNITY_Overlay Core & Markdown|Overlay Core & Markdown]]
- [[_COMMUNITY_Portfolio UI & Filtering|Portfolio UI & Filtering]]
- [[_COMMUNITY_Overlay Utilities & Rendering|Overlay Utilities & Rendering]]
- [[_COMMUNITY_Script Pages & Schema|Script Pages & Schema]]
- [[_COMMUNITY_Segmented Line Tests|Segmented Line Tests]]
- [[_COMMUNITY_System Generation Utilities|System Generation Utilities]]
- [[_COMMUNITY_Core Architecture Principles|Core Architecture Principles]]
- [[_COMMUNITY_Script Creation Utility|Script Creation Utility]]
- [[_COMMUNITY_Theme Management|Theme Management]]
- [[_COMMUNITY_Engine Initialization Tests|Engine Initialization Tests]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_Config Data Updates|Config Data Updates]]
- [[_COMMUNITY_Test Setup|Test Setup]]
- [[_COMMUNITY_Build & Data Sync|Build & Data Sync]]
- [[_COMMUNITY_Build System Orchestrator|Build System Orchestrator]]
- [[_COMMUNITY_Overlay Utils Tests|Overlay Utils Tests]]
- [[_COMMUNITY_Sanitization Tests|Sanitization Tests]]
- [[_COMMUNITY_Theme Architecture|Theme Architecture]]
- [[_COMMUNITY_Script Template Utilities|Script Template Utilities]]
- [[_COMMUNITY_Script List Schema|Script List Schema]]
- [[_COMMUNITY_Color System|Color System]]
- [[_COMMUNITY_CORS Debugging|CORS Debugging]]

## God Nodes (most connected - your core abstractions)
1. `ConfigurationBuilder` - 53 edges
2. `OverlayEngine` - 23 edges
3. `Script Config Schema` - 10 edges
4. `sanitizeHTML()` - 6 edges
5. `applyTheme()` - 5 edges
6. `resolveOverlayColor()` - 5 edges
7. `renderMarkdown()` - 5 edges
8. `Overlay Engine Class` - 5 edges
9. `generateScriptsList()` - 4 edges
10. `setupFilters()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Overlay Engine Class` --rationale_for--> `Coordinate Scaling System`  [INFERRED]
  js/overlay-engine.js → docs/architecture.md
- `Create Script Utility` --rationale_for--> `Template Sync Requirement`  [INFERRED]
  add-script.js → docs/ai-mistakes.md
- `Shared Markdown Renderer` --rationale_for--> `Marked.js Sanitization Rationale`  [INFERRED]
  js/overlay-utils.js → docs/ai-mistakes.md
- `Get Effective Theme` --rationale_for--> `Theme System Architecture`  [INFERRED]
  js/theme.js → docs/architecture.md
- `Generate Scripts List` --shares_data_with--> `Scripts List Data`  [EXTRACTED]
  generate-system.js → data/scripts-list.json

## Hyperedges (group relationships)
- **Build Pipeline** — buildsystem_node, generatesystem_generatescriptslist, updateconfigbuilder_updateconfigbuilderdata [EXTRACTED 1.00]
- **Overlay Rendering System** — overlayengine_overlayengine, overlayutils_rendermarkdown, overlayutils_resolveoverlaycolor, overlayutils_positiontooltipforsegmentedline [INFERRED 0.85]
- **Cross-cutting Utilities** — utils_sanitizehtml, theme_geteffectivetheme [INFERRED 0.75]
- **Script Page Rendering Flow** — schema_script_config, color_system_semantic, sp_comp_edit_index [INFERRED 0.85]

## Communities (26 total, 11 thin omitted)

### Community 1 - "Overlay Core & Markdown"
Cohesion: 0.15
Nodes (5): buildSegmentedLineSegments(), configureMarked(), isValidSegmentPattern(), OVERLAY_DEFAULTS, OverlayEngine

### Community 2 - "Portfolio UI & Filtering"
Cohesion: 0.14
Nodes (12): CATEGORY_NAMES, createScriptCard(), getCategoryName(), handleFiltering(), initializeOverlayEngine(), loadScriptsList(), renderScriptCards(), setupFilters() (+4 more)

### Community 3 - "Overlay Utilities & Rendering"
Cohesion: 0.24
Nodes (5): hexToRgba(), positionTooltipForSegmentedLine(), renderMarkdown(), resolveOverlayColor(), safeStyleColor()

### Community 4 - "Script Pages & Schema"
Cohesion: 0.2
Nodes (11): Effect Usage Analyzer Page, Expression Usage Analyzer Page, Find & Replace in Expression Page, Khoa Sharing Toolbar Page, Script Config Schema, SP Comp Edit Page, SP Comp Setup Page, SP Deadline Page (+3 more)

### Community 5 - "Segmented Line Tests"
Cohesion: 0.2
Nodes (8): container, coords, fs, path, result, segments, segs, tooltip

### Community 6 - "System Generation Utilities"
Cohesion: 0.36
Nodes (7): CATEGORIES, createDirectoryIfNotExists(), fs, generateScriptsList(), main(), path, scanScriptDirectories()

### Community 7 - "Core Architecture Principles"
Cohesion: 0.32
Nodes (8): Marked.js Sanitization Rationale, Coordinate Scaling System, Configuration Builder Class, Overlay Engine Class, Position Tooltip for Segmented Line, Shared Markdown Renderer, Resolve Overlay Color, Sanitize HTML

### Community 8 - "Script Creation Utility"
Cohesion: 0.4
Nodes (5): args, createScript(), escapeHtml(), fs, path

### Community 9 - "Theme Management"
Cohesion: 0.67
Nodes (5): applyTheme(), getEffectiveTheme(), setupThemeDetection(), toggleTheme(), updateThemeIndicator()

### Community 10 - "Engine Initialization Tests"
Cohesion: 0.33
Nodes (4): container, engine, fs, path

### Community 12 - "Project Documentation"
Cohesion: 0.4
Nodes (5): Config Builder User Guide, Configuration Reference, Memory Issues Management, Debugging Guide, Documentation README

### Community 13 - "ESLint Configuration"
Cohesion: 0.5
Nodes (3): globals, js, projectBrowserGlobals

### Community 16 - "Build & Data Sync"
Cohesion: 0.67
Nodes (4): Build System Orchestrator, Generate Scripts List, Scripts List Data, Update Config Builder Data

## Knowledge Gaps
- **53 isolated node(s):** `fs`, `path`, `CATEGORIES`, `fs`, `path` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConfigurationBuilder` connect `Configuration Builder Logic` to `Overlay Utilities & Rendering`, `Overlay Core & Markdown`, `Config Builder Interactions`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `OverlayEngine` connect `Overlay Core & Markdown` to `Portfolio UI & Filtering`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `renderMarkdown()` connect `Overlay Utilities & Rendering` to `Overlay Core & Markdown`, `Portfolio UI & Filtering`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `Script Config Schema` (e.g. with `SP Versioning Setup Toolkit Page` and `Find & Replace in Expression Page`) actually correct?**
  _`Script Config Schema` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `sanitizeHTML()` (e.g. with `.loadConfig()` and `.updateScriptMetadata()`) actually correct?**
  _`sanitizeHTML()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `CATEGORIES` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Configuration Builder Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._