# After Effects Scripts Portfolio

## Non-negotiable commands

```bash
npm run build   # REQUIRED after any scripts/{id}/config.json change — syncs 3 data sources
npm run serve   # HTTP server required — browser CORS blocks fetch() to file://
```

## Two non-obvious failure modes

**`marked.js sanitize: true` is a no-op** (removed in v8). Always:
`DOMPurify.sanitize(marked.parse(text))` — fall back to `sanitizeHTML(text)`, never raw HTML.

**Fixing `scripts/*/index.html` templates?** Also fix `add-script.js` (the generator).
The fix disappears on the next `node add-script.js` otherwise.

## More detail

- Architecture, build system, config schema → `docs/`
- Past AI mistakes with examples → `docs/ai-mistakes.md`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For a codebase question or exploration with no map in hand, start from graphify-out/GRAPH_REPORT.md before grepping. When a report, plan or named file already says where to work, go there directly.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- `graphify-out/` is untracked; a post-commit hook (`graphify hook install`, per clone) rebuilds it. Run `graphify update .` yourself only before querying uncommitted changes, after doc-only edits, or once on a fresh clone.
