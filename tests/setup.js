/**
 * Jest test environment setup.
 *
 * Defines browser globals that the source files expect, then loads
 * js/overlay-utils.js and explicitly exposes its functions on `global`
 * so all test files can call them without importing.
 */
const fs = require('fs');
const path = require('path');

// ── Browser API stubs ──────────────────────────────────────────────────────

// jsdom doesn't implement matchMedia; provide a minimal stub
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false, // default: light mode
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    })),
});

// ── CDN library mocks ─────────────────────────────────────────────────────

global.marked = {
    parse: jest.fn(text => `<p>${text}</p>`),
    setOptions: jest.fn(),
};

global.DOMPurify = {
    sanitize: jest.fn(html => html),
};

// ── Project globals ───────────────────────────────────────────────────────

global.OVERLAY_DEFAULTS = {
    COLORS: {
        red:    { light: '#ef4444', dark: '#f87171' },
        green:  { light: '#22c55e', dark: '#4ade80' },
        blue:   { light: '#3b82f6', dark: '#60a5fa' },
        yellow: { light: '#eab308', dark: '#facc15' },
    },
};

global.configureMarked = jest.fn();
global.getEffectiveTheme = jest.fn().mockReturnValue('light');
global.lucide = { createIcons: jest.fn() };

// ── Load source files, expose functions on global ─────────────────────────
// new Function() creates non-strict scope so function declarations are visible;
// we then explicitly assign each export to global so test files can access them.

function loadAndExpose(relPath, exportNames) {
    const code = fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
    const exportStatements = exportNames
        .map(n => `try { global["${n}"] = ${n}; } catch(e) {}`)
        .join('\n');
    // eslint-disable-next-line no-new-func
    new Function('global', `${code}\n${exportStatements}`)(global);
}

// Load real utils.js so sanitizeHTML tests exercise the actual production code
loadAndExpose('js/utils.js', ['debounce', 'throttle', 'sanitizeHTML', 'generateUniqueId']);
loadAndExpose('js/overlay-utils.js', ['resolveOverlayColor', 'safeStyleColor', 'renderMarkdown']);
