/**
 * Shared utilities for overlay-engine.js and config-builder.js.
 *
 * Load order: utils.js → theme.js → overlay-defaults.js → overlay-utils.js
 * Then: overlay-engine.js  OR  config-builder.js
 *
 * These functions were previously duplicated (and diverging) as class methods
 * in both files. Single-source fixes here propagate to both automatically.
 */

/* exported resolveOverlayColor, safeStyleColor, renderMarkdown, hexToRgba, positionTooltipForSegmentedLine */

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
 * Convert a hex color string to an rgba() CSS value.
 * Returns null when hex cannot be parsed (callers decide the fallback).
 * Replaces the diverging OverlayEngine.hexToRgb() + ConfigurationBuilder.hexToRgba() pair.
 *
 * @param {string} hex - CSS hex color (#rrggbb or rrggbb)
 * @param {number} alpha - Alpha value 0–1
 * @returns {string|null} e.g. 'rgba(255, 128, 0, 0.1)' or null
 */
function hexToRgba(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Position a tooltip element at the end of a segmented line.
 * Extracted from the identical OverlayEngine and ConfigurationBuilder implementations.
 *
 * @param {HTMLElement} tooltip
 * @param {Array<{type:string,length:number}>} segments - Pre-resolved, non-empty segments array
 * @param {{x:number,y:number,width:number,height:number}} coords - Hotspot coordinates (unscaled)
 * @param {number} scaleX
 * @param {number} scaleY
 * @param {number} offset - Gap between line end and tooltip edge (px)
 */
function positionTooltipForSegmentedLine(tooltip, segments, coords, scaleX, scaleY, offset) {
    // No segments — position tooltip flush with the right edge of the hotspot
    if (!segments || segments.length === 0) {
        tooltip.style.left = `${(coords.x + coords.width) * scaleX + offset}px`;
        tooltip.style.right = 'auto';
        tooltip.style.top = `${(coords.y + coords.height / 2) * scaleY}px`;
        tooltip.style.bottom = 'auto';
        tooltip.style.transform = 'translateY(-50%)';
        return;
    }

    const scale = Math.min(scaleX, scaleY);
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    const hotspotLeft = coords.x * scaleX;
    const hotspotTop = coords.y * scaleY;
    const hotspotWidth = coords.width * scaleX;
    const hotspotHeight = coords.height * scaleY;

    let startX, startY;
    if (firstSegment.type === 'horizontal') {
        startY = hotspotTop + hotspotHeight / 2;
        startX = firstSegment.length > 0 ? hotspotLeft + hotspotWidth : hotspotLeft;
    } else {
        startX = hotspotLeft + hotspotWidth / 2;
        startY = firstSegment.length > 0 ? hotspotTop + hotspotHeight : hotspotTop;
    }

    let endX = startX;
    let endY = startY;
    segments.forEach(segment => {
        if (segment.type === 'horizontal') {
            endX += segment.length * scale;
        } else {
            endY += segment.length * scale;
        }
    });

    if (lastSegment.type === 'horizontal') {
        if (lastSegment.length > 0) {
            tooltip.style.left = `${endX + offset}px`;
            tooltip.style.right = 'auto';
            tooltip.style.transform = 'translateY(-50%)';
        } else {
            tooltip.style.right = `calc(100% - ${endX - offset}px)`;
            tooltip.style.left = 'auto';
            tooltip.style.transform = 'translateY(-50%)';
        }
        tooltip.style.top = `${endY}px`;
        tooltip.style.bottom = 'auto';
    } else {
        if (lastSegment.length > 0) {
            tooltip.style.top = `${endY + offset}px`;
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translateX(-50%)';
        } else {
            tooltip.style.bottom = `calc(100% - ${endY - offset}px)`;
            tooltip.style.top = 'auto';
            tooltip.style.transform = 'translateX(-50%)';
        }
        tooltip.style.left = `${endX}px`;
        tooltip.style.right = 'auto';
    }
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
