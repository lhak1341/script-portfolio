/**
 * Tests for initializeOverlayEngine() from js/overlay-engine.js.
 *
 * Guards the contract from CLAUDE.md rule #34:
 * "initializeOverlayEngine() can return null — always guard before calling methods"
 */
const fs = require('fs');
const path = require('path');

// Load overlay-defaults.js then overlay-engine.js, exposing their globals
function loadAndExpose(relPath, exportNames) {
    const code = fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
    const exportStatements = exportNames
        .map(n => `try { global["${n}"] = ${n}; } catch(e) {}`)
        .join('\n');
    // eslint-disable-next-line no-new-func
    new Function('global', `${code}\n${exportStatements}`)(global);
}

beforeAll(() => {
    // Load in the same order as HTML pages: utils → overlay-defaults → overlay-utils → overlay-engine
    loadAndExpose('js/utils.js', ['debounce', 'throttle', 'sanitizeHTML', 'generateUniqueId']);
    loadAndExpose('js/overlay-defaults.js', [
        'OVERLAY_DEFAULTS', 'isValidSegmentPattern', 'buildSegmentedLineSegments', 'configureMarked',
    ]);
    loadAndExpose('js/overlay-utils.js', ['resolveOverlayColor', 'safeStyleColor', 'renderMarkdown']);
    loadAndExpose('js/overlay-engine.js', ['OverlayEngine', 'initializeOverlayEngine']);
});

describe('initializeOverlayEngine', () => {
    test('returns null when container element does not exist', () => {
        const engine = initializeOverlayEngine('nonexistent-container-id');
        expect(engine).toBeNull();
    });

    test('returns an OverlayEngine instance when container exists', () => {
        const container = document.createElement('div');
        container.id = 'test-overlay-container';
        document.body.appendChild(container);

        const engine = initializeOverlayEngine('test-overlay-container');
        expect(engine).not.toBeNull();
        expect(engine).toBeInstanceOf(OverlayEngine);

        engine.destroy();
        document.body.removeChild(container);
    });

    test('OverlayEngine exposes loadConfig and destroy methods', () => {
        const container = document.createElement('div');
        container.id = 'test-overlay-api';
        document.body.appendChild(container);

        const engine = initializeOverlayEngine('test-overlay-api');
        expect(typeof engine.loadConfig).toBe('function');
        expect(typeof engine.destroy).toBe('function');

        engine.destroy();
        document.body.removeChild(container);
    });
});
