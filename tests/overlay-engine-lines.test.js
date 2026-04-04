/**
 * Tests for line segment utilities in overlay-engine.js:
 *   OverlayEngine.simplifyLineSegments()
 *   OverlayEngine.createSimpleLine() — segment-collapsing logic
 *
 * Also covers the shared hexToRgba() and positionTooltipForSegmentedLine()
 * from overlay-utils.js which were extracted from mirrored engine/builder methods.
 */
const fs = require('fs');
const path = require('path');

function loadAndExpose(relPath, exportNames) {
    const code = fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
    const exportStatements = exportNames
        .map(n => `try { global["${n}"] = ${n}; } catch(e) {}`)
        .join('\n');
    // eslint-disable-next-line no-new-func
    new Function('global', `${code}\n${exportStatements}`)(global);
}

beforeAll(() => {
    loadAndExpose('js/utils.js', ['debounce', 'sanitizeHTML']);
    loadAndExpose('js/overlay-defaults.js', [
        'OVERLAY_DEFAULTS', 'isValidSegmentPattern', 'buildSegmentedLineSegments', 'configureMarked',
    ]);
    loadAndExpose('js/overlay-utils.js', [
        'resolveOverlayColor', 'safeStyleColor', 'renderMarkdown',
        'hexToRgba', 'positionTooltipForSegmentedLine',
    ]);
    loadAndExpose('js/overlay-engine.js', ['OverlayEngine', 'initializeOverlayEngine']);
});

// ─── simplifyLineSegments ────────────────────────────────────────────────────

describe('OverlayEngine.simplifyLineSegments', () => {
    let engine;

    beforeEach(() => {
        const container = document.createElement('div');
        container.id = 'test-simplify';
        document.body.appendChild(container);
        engine = initializeOverlayEngine('test-simplify');
    });

    afterEach(() => {
        engine.destroy();
        document.getElementById('test-simplify')?.remove();
    });

    test('returns [] for null input', () => {
        expect(engine.simplifyLineSegments(null)).toEqual([]);
    });

    test('returns [] for empty array', () => {
        expect(engine.simplifyLineSegments([])).toEqual([]);
    });

    test('passes through valid single [H] pattern', () => {
        const segs = [{ type: 'horizontal', length: 100 }];
        expect(engine.simplifyLineSegments(segs)).toEqual(segs);
    });

    test('passes through valid [H, V, H] pattern', () => {
        const segs = [
            { type: 'horizontal', length: 80 },
            { type: 'vertical', length: -40 },
            { type: 'horizontal', length: 60 },
        ];
        expect(engine.simplifyLineSegments(segs)).toEqual(segs);
    });

    test('filters out zero-length segments', () => {
        const segs = [
            { type: 'horizontal', length: 100 },
            { type: 'vertical', length: 0 },
        ];
        expect(engine.simplifyLineSegments(segs)).toEqual([
            { type: 'horizontal', length: 100 },
        ]);
    });

    test('returns minimal fallback when all segments are zero-length', () => {
        const segs = [
            { type: 'horizontal', length: 0 },
            { type: 'vertical', length: 0.05 },
        ];
        const result = engine.simplifyLineSegments(segs);
        expect(result).toEqual([{ type: 'horizontal', length: 1 }]);
    });

    test('returns safe fallback for invalid pattern [V, H]', () => {
        const segs = [
            { type: 'vertical', length: 50 },
            { type: 'horizontal', length: 100 },
        ];
        const result = engine.simplifyLineSegments(segs);
        expect(result).toEqual([{ type: 'horizontal', length: 100 }]);
    });
});

// ─── hexToRgba (overlay-utils.js) ────────────────────────────────────────────

describe('hexToRgba', () => {
    test('converts 6-digit hex with hash', () => {
        expect(hexToRgba('#ff8000', 0.5)).toBe('rgba(255, 128, 0, 0.5)');
    });

    test('converts 6-digit hex without hash', () => {
        expect(hexToRgba('0080ff', 1)).toBe('rgba(0, 128, 255, 1)');
    });

    test('returns null for unparseable input', () => {
        expect(hexToRgba('not-a-color', 0.5)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(hexToRgba('', 0.1)).toBeNull();
    });

    test('is case-insensitive', () => {
        expect(hexToRgba('#FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
        expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });
});

// ─── positionTooltipForSegmentedLine (overlay-utils.js) ──────────────────────

describe('positionTooltipForSegmentedLine', () => {
    const coords = { x: 10, y: 20, width: 50, height: 30 };
    // scaleX=1, scaleY=1 for simplicity
    const scaleX = 1;
    const scaleY = 1;
    const offset = 15;

    test('positions tooltip adjacent to hotspot right edge for empty segments', () => {
        const tooltip = document.createElement('div');
        positionTooltipForSegmentedLine(tooltip, [], coords, scaleX, scaleY, offset);
        // (coords.x + coords.width) * scaleX + offset = (10 + 50) * 1 + 15 = 75
        expect(tooltip.style.left).toBe('75px');
        expect(tooltip.style.transform).toBe('translateY(-50%)');
    });

    test('positions tooltip to the right for rightward [H] segment', () => {
        const tooltip = document.createElement('div');
        const segments = [{ type: 'horizontal', length: 100 }];
        positionTooltipForSegmentedLine(tooltip, segments, coords, scaleX, scaleY, offset);
        // startX = coords.x + coords.width = 60; endX = 60 + 100 = 160; left = 160 + 15 = 175
        expect(tooltip.style.left).toBe('175px');
        expect(tooltip.style.right).toBe('auto');
        expect(tooltip.style.transform).toBe('translateY(-50%)');
    });

    test('positions tooltip to the left for leftward [H] segment', () => {
        const tooltip = document.createElement('div');
        const segments = [{ type: 'horizontal', length: -80 }];
        positionTooltipForSegmentedLine(tooltip, segments, coords, scaleX, scaleY, offset);
        // startX = coords.x = 10 (length < 0); endX = 10 + (-80) = -70; right = calc(100% - (-70 - 15)px)
        expect(tooltip.style.left).toBe('auto');
        expect(tooltip.style.transform).toBe('translateY(-50%)');
    });

    test('positions tooltip below for downward [H,V] with vertical last segment', () => {
        const tooltip = document.createElement('div');
        const segments = [
            { type: 'horizontal', length: 100 },
            { type: 'vertical', length: 50 },
        ];
        positionTooltipForSegmentedLine(tooltip, segments, coords, scaleX, scaleY, offset);
        expect(tooltip.style.transform).toBe('translateX(-50%)');
        expect(tooltip.style.bottom).toBe('auto');
    });
});
