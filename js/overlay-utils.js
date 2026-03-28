/**
 * Shared utilities for overlay-engine.js and config-builder.js.
 *
 * Load order: utils.js → theme.js → overlay-defaults.js → overlay-utils.js
 * Then: overlay-engine.js  OR  config-builder.js
 *
 * These functions were previously duplicated (and diverging) as class methods
 * in both files. Single-source fixes here propagate to both automatically.
 */

/* exported resolveOverlayColor, safeStyleColor, renderMarkdown */

/**
 * Resolve a color name to a CSS value for the current theme.
 * Handles legacy hex strings (#rrggbb) and named colors from OVERLAY_DEFAULTS.COLORS.
 * Returns '#808080' for null/undefined/non-string input.
 *
 * @param {string} colorName - Hex string or OVERLAY_DEFAULTS.COLORS key
 * @returns {string} CSS color value
 */
function resolveOverlayColor(colorName) {
    // Falsy check (matches original OverlayEngine.getCurrentColorValue behaviour):
    // rejects null, undefined, empty string, non-string types
    if (!colorName || typeof colorName !== 'string') {
        return '#808080';
    }
    // Pass legacy hex colors through unchanged
    if (colorName.startsWith('#')) {
        return colorName;
    }
    // Use manual theme override if available (respects user's light/dark toggle)
    const effectiveTheme = typeof getEffectiveTheme !== 'undefined'
        ? getEffectiveTheme()
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const isDark = effectiveTheme === 'dark';
    return OVERLAY_DEFAULTS.COLORS[colorName]
        ? OVERLAY_DEFAULTS.COLORS[colorName][isDark ? 'dark' : 'light']
        : colorName;
}

/**
 * Like resolveOverlayColor but validates the result is safe for use in an
 * inline style attribute string. Falls back to '#808080' for any value that
 * isn't hex or rgb/rgba — prevents CSS injection via crafted config.json colors.
 *
 * Use this for:  style="background: ${safeStyleColor(hotspot.color)};"
 * NOT needed for: element.style.background = val  (DOM property assignment is safe)
 *
 * @param {string} colorName - Hex string or OVERLAY_DEFAULTS.COLORS key
 * @returns {string} CSS-safe color value
 */
function safeStyleColor(colorName) {
    const value = resolveOverlayColor(colorName);
    if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\(/.test(value)) {
        return value;
    }
    return '#808080';
}

/**
 * Parse markdown text to sanitized HTML.
 *
 * - Returns '' for null/undefined input
 * - Falls back to escaped plain text if marked.js or DOMPurify is unavailable
 * - Does NOT cache results (config-builder.js adds its own LRU cache on top)
 *
 * @param {string} text - Markdown source
 * @returns {string} Sanitized HTML string
 */
function renderMarkdown(text) {
    if (text === null || text === undefined) return '';
    if (typeof marked === 'undefined') {
        console.warn('Marked.js not loaded, falling back to plain text');
        return `<p>${sanitizeHTML(text)}</p>`;
    }
    configureMarked();
    const html = marked.parse(text);
    // DOMPurify is required; marked v8+ removed built-in sanitization
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html);
    }
    // DOMPurify unavailable: fall back to escaped plain text to prevent XSS
    return sanitizeHTML(text);
}
