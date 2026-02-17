const globals = require('globals');
const js = require('@eslint/js');

// Project globals defined in one JS file, used in others via <script> tag load order.
// Listed here so ESLint doesn't flag cross-file usages as no-undef.
// 'no-redeclare' is configured with builtinGlobals:false so files that define
// these (e.g. utils.js defines sanitizeHTML) don't get a spurious redeclaration error.
const projectBrowserGlobals = {
    // js/utils.js
    sanitizeHTML: 'readonly',
    debounce: 'readonly',
    throttle: 'readonly',
    compareSemver: 'readonly',
    // js/overlay-defaults.js
    OVERLAY_DEFAULTS: 'readonly',
    // js/overlay-engine.js
    OverlayEngine: 'readonly',
    initializeOverlayEngine: 'readonly',
    loadScriptsList: 'readonly',
    renderScriptCards: 'readonly',
    handleFiltering: 'readonly',
    setupFilters: 'readonly',
    showLoadingError: 'readonly',
    getCategoryName: 'readonly',
    getFallbackScriptsData: 'readonly',
    // js/theme.js
    getEffectiveTheme: 'readonly',
    setupThemeDetection: 'readonly',
};

module.exports = [
    // Base recommended rules for all files
    js.configs.recommended,

    // Browser scripts (js/ + config-builder.js)
    {
        files: ['js/**/*.js', 'tools/config-builder.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                // CDN libraries loaded via <script> tags in HTML
                DOMPurify: 'readonly',
                marked: 'readonly',
                lucide: 'readonly',
                ...projectBrowserGlobals,
            },
        },
        rules: {
            // Prevent type coercion bugs
            'eqeqeq': ['error', 'always'],
            // Enforce modern variable declarations
            'no-var': 'error',
            'prefer-const': 'warn',
            // Warn on unused variables (prefix _ to suppress)
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // Suppress false positives for project globals that are also declared in this file
            'no-redeclare': ['error', { builtinGlobals: false }],
            // HTML-defined globals (e.g. showTagFilterMessage in index.html inline script)
            // and UMD module.exports guards are real cross-boundary patterns — warn not error
            'no-undef': 'warn',
        },
    },

    // Node.js build scripts and config
    {
        files: [
            'build-system.js',
            'add-script.js',
            'generate-system.js',
            'update-config-builder.js',
            'eslint.config.js',
        ],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // Node scripts use explicit require() so undefined vars are real bugs
            'no-undef': 'error',
        },
    },

    // Ignore generated/vendored files
    {
        ignores: ['node_modules/', 'data/scripts-list.json'],
    },
];
