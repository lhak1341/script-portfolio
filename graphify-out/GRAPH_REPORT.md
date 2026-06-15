# Graph Report - .  (2026-06-15)

## Corpus Check
- Corpus is ~23,645 words - fits in a single context window. You may not need a graph.

## Summary
- 186 nodes · 264 edges · 38 communities (10 shown, 28 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Configuration Builder Core Logic|Configuration Builder Core Logic]]
- [[_COMMUNITY_Build and Script Generation|Build and Script Generation]]
- [[_COMMUNITY_Overlay Engine Core Rendering|Overlay Engine Core Rendering]]
- [[_COMMUNITY_UI Utilities and Script Cards|UI Utilities and Script Cards]]
- [[_COMMUNITY_Overlay Configuration and Utilities|Overlay Configuration and Utilities]]
- [[_COMMUNITY_System Architecture and Documentation|System Architecture and Documentation]]
- [[_COMMUNITY_Theme Management System|Theme Management System]]
- [[_COMMUNITY_ESLint Configuration and Globals|ESLint Configuration and Globals]]
- [[_COMMUNITY_Config Builder Guide and Patterns|Config Builder Guide and Patterns]]
- [[_COMMUNITY_Build System Documentation|Build System Documentation]]
- [[_COMMUNITY_Versioning Toolkit Documentation|Versioning Toolkit Documentation]]
- [[_COMMUNITY_SP Comp Setup Module|SP Comp Setup Module]]
- [[_COMMUNITY_SP Deadline Module|SP Deadline Module]]
- [[_COMMUNITY_Script Usage Analyzer Documentation|Script Usage Analyzer Documentation]]
- [[_COMMUNITY_Overlay Engine Source File|Overlay Engine Source File]]
- [[_COMMUNITY_Theme Management Source File|Theme Management Source File]]
- [[_COMMUNITY_Common Utility Source File|Common Utility Source File]]
- [[_COMMUNITY_Config Builder Tool Source|Config Builder Tool Source]]
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
- [[_COMMUNITY_SP Comp Edit Documentation|SP Comp Edit Documentation]]
- [[_COMMUNITY_SP SRT Importer Page|SP SRT Importer Page]]
- [[_COMMUNITY_SP SRT Importer Documentation|SP SRT Importer Documentation]]
- [[_COMMUNITY_Expression Usage Analyzer Page|Expression Usage Analyzer Page]]
- [[_COMMUNITY_Khoa Sharing Toolbar Page|Khoa Sharing Toolbar Page]]
- [[_COMMUNITY_Khoa Sharing Toolbar Documentation|Khoa Sharing Toolbar Documentation]]

## God Nodes (most connected - your core abstractions)
1. `ConfigurationBuilder` - 53 edges
2. `OverlayEngine` - 23 edges
3. `sanitizeHTML()` - 6 edges
4. `applyTheme()` - 5 edges
5. `resolveOverlayColor()` - 5 edges
6. `renderMarkdown()` - 5 edges
7. `generateScriptsList()` - 4 edges
8. `setupFilters()` - 4 edges
9. `handleFiltering()` - 4 edges
10. `getEffectiveTheme()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `OverlayEngine` --implements--> `Coordinate Scaling System`  [INFERRED]
  js/overlay-engine.js → docs/architecture.md
- `OverlayEngine` --implements--> `Multi-Segment Line System`  [INFERRED]
  js/overlay-engine.js → docs/architecture.md
- `resolveOverlayColor()` --calls--> `getEffectiveTheme()`  [INFERRED]
  js/overlay-utils.js → js/theme.js
- `renderMarkdown()` --calls--> `configureMarked()`  [INFERRED]
  js/overlay-utils.js → js/overlay-defaults.js
- `renderMarkdown()` --calls--> `sanitizeHTML()`  [INFERRED]
  js/overlay-utils.js → js/utils.js

## Hyperedges (group relationships)
- **Build Sync Pipeline** — generate_system_js, update_config_builder_js, config_builder_js [INFERRED 0.95]
- **Overlay Rendering System** — overlay_engine_js, overlay_utils_js, overlay_defaults_js, utils_js [INFERRED 0.95]
- **Usage Analysis Scripts** — effect_usage_analyzer_index, expression_usage_analyzer_index, find_replace_expression_index [INFERRED 0.85]
- **Project Versioning Scripts** — sp_versioning_setup_toolkit_index, sp_versioning_csv_index [INFERRED 0.95]

## Communities (38 total, 28 thin omitted)

### Community 1 - "Build and Script Generation"
Cohesion: 0.11
Nodes (17): generateScriptsList, args, createScript(), escapeHtml(), fs, path, { execSync }, steps (+9 more)

### Community 3 - "UI Utilities and Script Cards"
Cohesion: 0.14
Nodes (12): CATEGORY_NAMES, createScriptCard(), getCategoryName(), handleFiltering(), initializeOverlayEngine(), loadScriptsList(), renderScriptCards(), setupFilters() (+4 more)

### Community 4 - "Overlay Configuration and Utilities"
Cohesion: 0.16
Nodes (8): configureMarked(), isValidSegmentPattern(), OVERLAY_DEFAULTS, hexToRgba(), positionTooltipForSegmentedLine(), renderMarkdown(), resolveOverlayColor(), safeStyleColor()

### Community 5 - "System Architecture and Documentation"
Cohesion: 0.33
Nodes (7): Coordinate Scaling System, docs/architecture.md, Multi-Segment Line System, ConfigurationBuilder, js/overlay-defaults.js, OverlayEngine, js/overlay-utils.js

### Community 6 - "Theme Management System"
Cohesion: 0.67
Nodes (5): applyTheme(), getEffectiveTheme(), setupThemeDetection(), toggleTheme(), updateThemeIndicator()

### Community 8 - "ESLint Configuration and Globals"
Cohesion: 0.5
Nodes (3): globals, js, projectBrowserGlobals

### Community 9 - "Config Builder Guide and Patterns"
Cohesion: 0.67
Nodes (3): Config Builder User Guide, H-V-H Path Pattern, Straight Horizontal Line Pattern

## Knowledge Gaps
- **52 isolated node(s):** `fs`, `path`, `CATEGORIES`, `fs`, `path` (+47 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConfigurationBuilder` connect `Configuration Builder Core Logic` to `Overlay Configuration and Utilities`, `Config Builder Tool Interface`?**
  _High betweenness centrality (0.263) - this node is a cross-community bridge._
- **Why does `OverlayEngine` connect `Overlay Engine Core Rendering` to `UI Utilities and Script Cards`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `renderMarkdown()` connect `Overlay Configuration and Utilities` to `Overlay Engine Core Rendering`, `UI Utilities and Script Cards`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `sanitizeHTML()` (e.g. with `.loadConfig()` and `.updateScriptMetadata()`) actually correct?**
  _`sanitizeHTML()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `resolveOverlayColor()` (e.g. with `.getCurrentColorValue()` and `.getCurrentColorValue()`) actually correct?**
  _`resolveOverlayColor()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `CATEGORIES` to the rest of the system?**
  _52 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Configuration Builder Core Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._