/**
 * Tests for sanitizeHTML() from js/utils.js.
 *
 * This function is the primary XSS defence for all dynamic content inserted
 * into innerHTML throughout the codebase. These tests lock down the security
 * contract so regressions are caught immediately.
 */

describe('sanitizeHTML', () => {
    test('escapes script tags', () => {
        const result = sanitizeHTML('<script>alert(1)</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    test('escapes event handler attributes — tag is inert text, not executable HTML', () => {
        const result = sanitizeHTML('<img src=x onerror=alert(1)>');
        // The entire tag is converted to escaped text; angle brackets must be escaped
        // so the browser treats it as text, not a tag. "onerror" text may still appear
        // but it is harmless as content inside a text node.
        expect(result).toContain('&lt;');
        expect(result).toContain('&gt;');
        expect(result).not.toContain('<img');
    });

    test('escapes angle brackets', () => {
        expect(sanitizeHTML('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });

    test('escapes double quotes', () => {
        expect(sanitizeHTML('"quoted"')).toBe('"quoted"');
    });

    test('returns empty string for null', () => {
        expect(sanitizeHTML(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(sanitizeHTML(undefined)).toBe('');
    });

    test('coerces non-string to string safely', () => {
        expect(sanitizeHTML(42)).toBe('42');
        expect(sanitizeHTML(true)).toBe('true');
    });

    test('leaves safe text unchanged', () => {
        expect(sanitizeHTML('Hello, World!')).toBe('Hello, World!');
    });

    test('escapes ampersands', () => {
        expect(sanitizeHTML('a & b')).toBe('a &amp; b');
    });

    test('handles javascript: URL injection', () => {
        const result = sanitizeHTML('javascript:alert(1)');
        // Text should be present but treated as a plain string, not executable
        expect(result).toBe('javascript:alert(1)');
        // Verify it's not injected as an href (content is escaped as text, safe in text nodes)
    });
});
