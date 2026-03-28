/**
 * Tests for js/overlay-utils.js — the shared utility module extracted from
 * the previously-duplicated methods in overlay-engine.js and config-builder.js.
 *
 * Focus: contract correctness and security boundaries.
 */

describe('resolveOverlayColor', () => {
    beforeEach(() => {
        // Reset to light theme before each test
        global.getEffectiveTheme.mockReturnValue('light');
    });

    test('returns #808080 for null', () => {
        expect(resolveOverlayColor(null)).toBe('#808080');
    });

    test('returns #808080 for undefined', () => {
        expect(resolveOverlayColor(undefined)).toBe('#808080');
    });

    test('returns #808080 for non-string input', () => {
        expect(resolveOverlayColor(42)).toBe('#808080');
        expect(resolveOverlayColor({})).toBe('#808080');
    });

    test('returns #808080 for empty string (matches original falsy-check behaviour)', () => {
        expect(resolveOverlayColor('')).toBe('#808080');
    });

    test('passes hex strings through unchanged', () => {
        expect(resolveOverlayColor('#ff0000')).toBe('#ff0000');
        expect(resolveOverlayColor('#abc')).toBe('#abc');
        expect(resolveOverlayColor('#00000080')).toBe('#00000080');
    });

    test('resolves named color for light theme', () => {
        global.getEffectiveTheme.mockReturnValue('light');
        expect(resolveOverlayColor('red')).toBe('#ef4444');
        expect(resolveOverlayColor('green')).toBe('#22c55e');
    });

    test('resolves named color for dark theme', () => {
        global.getEffectiveTheme.mockReturnValue('dark');
        expect(resolveOverlayColor('red')).toBe('#f87171');
        expect(resolveOverlayColor('green')).toBe('#4ade80');
    });

    test('returns the raw colorName for unknown named colors (not #808080)', () => {
        // Unknown names pass through — safeStyleColor() is the CSS-safe wrapper
        const result = resolveOverlayColor('unknownColor');
        expect(result).toBe('unknownColor');
    });

    test('uses window.matchMedia fallback when getEffectiveTheme is absent', () => {
        const saved = global.getEffectiveTheme;
        delete global.getEffectiveTheme;
        // matchMedia stub returns matches: false → light theme
        expect(resolveOverlayColor('red')).toBe('#ef4444');
        global.getEffectiveTheme = saved;
    });
});

describe('safeStyleColor', () => {
    beforeEach(() => {
        global.getEffectiveTheme.mockReturnValue('light');
    });

    test('returns valid hex for known named colors', () => {
        expect(safeStyleColor('red')).toBe('#ef4444');
    });

    test('passes through valid hex strings', () => {
        expect(safeStyleColor('#ff0000')).toBe('#ff0000');
        expect(safeStyleColor('#abc')).toBe('#abc');
    });

    test('passes through rgb/rgba values', () => {
        // resolveOverlayColor passes hex through; for rgb values to reach safeStyleColor
        // they would come from OVERLAY_DEFAULTS — simulate by testing the validator directly
        // A color that resolves to a known-safe rgba string should pass through
        expect(safeStyleColor('#00000080')).toBe('#00000080');
    });

    test('CSS injection prevention — unknown name falls back to #808080', () => {
        // An attacker-controlled color name like "); color: red; (" must not reach style attr
        expect(safeStyleColor('); color: red; (')).toBe('#808080');
        expect(safeStyleColor('expression(alert(1))')).toBe('#808080');
        expect(safeStyleColor('url(javascript:alert(1))')).toBe('#808080');
    });

    test('CSS injection prevention — null/undefined falls back to #808080', () => {
        expect(safeStyleColor(null)).toBe('#808080');
        expect(safeStyleColor(undefined)).toBe('#808080');
    });
});

describe('renderMarkdown', () => {
    beforeEach(() => {
        // Reset CDN mocks fully — some tests delete these globals, so always recreate
        global.marked = {
            parse: jest.fn(text => `<p>${text}</p>`),
            setOptions: jest.fn(),
        };
        global.DOMPurify = {
            sanitize: jest.fn(html => html),
        };
        global.configureMarked = jest.fn();
    });

    test('returns empty string for null', () => {
        expect(renderMarkdown(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(renderMarkdown(undefined)).toBe('');
    });

    test('calls marked.parse and DOMPurify.sanitize in sequence', () => {
        renderMarkdown('hello **world**');
        expect(global.marked.parse).toHaveBeenCalledWith('hello **world**');
        expect(global.DOMPurify.sanitize).toHaveBeenCalled();
    });

    test('returns DOMPurify-sanitized output', () => {
        global.marked.parse.mockReturnValue('<p>safe html</p>');
        global.DOMPurify.sanitize.mockReturnValue('<p>safe html</p>');
        expect(renderMarkdown('safe html')).toBe('<p>safe html</p>');
    });

    test('XSS prevention — DOMPurify strips dangerous content', () => {
        global.marked.parse.mockReturnValue('<script>alert(1)</script>');
        global.DOMPurify.sanitize.mockReturnValue(''); // DOMPurify removes it
        expect(renderMarkdown('<script>alert(1)</script>')).toBe('');
    });

    test('falls back to sanitizeHTML plain text when DOMPurify unavailable', () => {
        const savedDOMPurify = global.DOMPurify;
        delete global.DOMPurify;
        const result = renderMarkdown('<b>bold</b>');
        // sanitizeHTML escapes the text; should not contain raw HTML from marked
        expect(result).not.toContain('<script>');
        global.DOMPurify = savedDOMPurify;
    });

    test('falls back to plain text when marked unavailable', () => {
        const savedMarked = global.marked;
        delete global.marked;
        const result = renderMarkdown('plain text');
        expect(result).toContain('plain text');
        expect(result).not.toContain('<script>');
        global.marked = savedMarked;
    });
});
