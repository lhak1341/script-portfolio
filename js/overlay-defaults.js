/**
 * Shared overlay configuration defaults and utilities
 * Used by both overlay-engine.js and config-builder.js
 */
/* exported OVERLAY_DEFAULTS, isValidSegmentPattern, buildSegmentedLineSegments, configureMarked */

// ---------------------------------------------------------------------------
// Segment helpers
// ---------------------------------------------------------------------------

/**
 * Validate that segments follow the required pattern: [H] or [H, V, H]
 */
function isValidSegmentPattern(segments) {
    if (segments.length === 1) {
        return segments[0].type === 'horizontal';
    }
    if (segments.length === 3) {
        return segments[0].type === 'horizontal' &&
               segments[1].type === 'vertical' &&
               segments[2].type === 'horizontal';
    }
    return false;
}

/**
 * Position a line container from the hotspot edge, then create and append
 * one DOM element per segment.  Stores the cumulative end position in
 * data-end-x / data-end-y for downstream tooltip positioning.
 *
 * @param {HTMLElement} container      - the line wrapper element
 * @param {Array}       segments       - validated segment array ([H] or [H,V,H])
 * @param {string}      lineColor      - CSS color string
 * @param {number}      thickness      - line thickness in px
 * @param {number}      scaleX         - horizontal scale factor
 * @param {number}      scaleY         - vertical scale factor
 * @param {string}      [extraClass]   - optional extra CSS class for each segment el
 */
function buildSegmentedLineSegments(container, segments, lineColor, thickness, scaleX, scaleY, extraClass) {
    const scale = Math.min(scaleX, scaleY);
    const firstSegment = segments[0];
    let currentX = 0;
    let currentY = 0;

    // Anchor the container to the correct hotspot edge
    if (firstSegment.type === 'horizontal') {
        container.style.top = '50%';
        container.style.transform = 'translateY(-50%)';
        container.style.left = firstSegment.length > 0 ? '100%' : '0%';
    } else {
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.top = firstSegment.length > 0 ? '100%' : '0%';
    }

    segments.forEach((segment, index) => {
        const segmentEl = document.createElement('div');
        const baseClass = `line-segment segment-${index}`;
        segmentEl.className = extraClass ? `${extraClass} ${baseClass}` : baseClass;
        segmentEl.style.position = 'absolute';
        segmentEl.style.backgroundColor = lineColor;
        segmentEl.style.opacity = '1';

        const scaledLength = segment.length * scale;

        if (segment.type === 'horizontal') {
            const width = Math.abs(scaledLength);
            segmentEl.style.width = `${width}px`;
            segmentEl.style.height = `${thickness}px`;
            segmentEl.style.left = scaledLength >= 0 ? `${currentX}px` : `${currentX - width}px`;
            segmentEl.style.top = `${currentY - thickness / 2}px`;
            currentX += scaledLength;
        } else {
            const height = Math.abs(scaledLength);
            segmentEl.style.width = `${thickness}px`;
            segmentEl.style.height = `${height}px`;
            segmentEl.style.left = `${currentX - thickness / 2}px`;
            segmentEl.style.top = scaledLength >= 0 ? `${currentY}px` : `${currentY - height}px`;
            currentY += scaledLength;
        }

        container.appendChild(segmentEl);
    });

    container.setAttribute('data-end-x', currentX);
    container.setAttribute('data-end-y', currentY);
}

// ---------------------------------------------------------------------------
// Markdown configuration
// ---------------------------------------------------------------------------

let _markedConfigured = false;

/**
 * Configure marked.js once per page load.
 * Calling this inside every processMarkdown() invocation is safe — the flag
 * ensures setOptions() only mutates global state on the first call.
 */
function configureMarked() {
    if (typeof marked === 'undefined' || _markedConfigured) return;
    marked.setOptions({
        gfm: true,     // GitHub Flavored Markdown
        breaks: false, // Don't convert \n to <br>
    });
    _markedConfigured = true;
}

// ---------------------------------------------------------------------------
// Defaults object
// ---------------------------------------------------------------------------

const OVERLAY_DEFAULTS = {
    BORDER_RADIUS: 4,    // px - default border radius for highlights
    LINE_THICKNESS: 2,   // px - default line thickness

    // Predefined color palette - optimized for light/dark themes
    COLORS: {
        red: { light: '#ef4444', dark: '#f87171' },      // Red 500/400
        orange: { light: '#f97316', dark: '#fb923c' },   // Orange 500/400
        yellow: { light: '#eab308', dark: '#facc15' },   // Yellow 500/400
        green: { light: '#22c55e', dark: '#4ade80' },    // Green 500/400
        cyan: { light: '#06b6d4', dark: '#22d3ee' },     // Cyan 500/400
        purple: { light: '#a855f7', dark: '#c084fc' },   // Purple 500/400
        pink: { light: '#ec4899', dark: '#f472b6' }      // Pink 500/400
    }
};
