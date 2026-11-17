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
