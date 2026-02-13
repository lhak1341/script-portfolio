/**
 * Shared overlay configuration defaults
 * Used by both overlay-engine.js and config-builder.js
 */
/* exported OVERLAY_DEFAULTS */
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
