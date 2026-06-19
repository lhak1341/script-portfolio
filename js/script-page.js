/**
 * Script page — metadata binding from config to page DOM.
 * Only loaded by scripts/*/index.html. Depends on utils.js (sanitizeHTML).
 */

/* exported bindScriptMeta */

/**
 * Bind config metadata to script page DOM elements.
 * Called after engine.loadConfig() resolves — the engine returns the config,
 * and the page decides what to do with it.
 *
 * @param {Object} config - Parsed config.json
 */
function bindScriptMeta(config) {
    const title = document.querySelector('.site-title');
    const subtitle = document.querySelector('.site-subtitle');
    if (title) title.textContent = config.scriptName;
    if (subtitle) subtitle.textContent = config.description;

    const header = document.querySelector('.header .container');
    if (!header) return;
    const badgeContainer = header.querySelector('[style*="margin-top"]');
    if (badgeContainer) {
        badgeContainer.innerHTML = `
            <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">v${sanitizeHTML(config.version)}</span>
            <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; margin-left: 0.5rem;">${sanitizeHTML(config.category)}</span>
        `;
    }

    if (config.tags) {
        const tagsContainer = document.querySelector('.script-tags-section .script-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = [...config.tags].sort().map(tag =>
                `<a href="../../index.html?tag=${encodeURIComponent(tag)}" class="tag">${sanitizeHTML(tag)}</a>`
            ).join(' ');
        }
    }
}
