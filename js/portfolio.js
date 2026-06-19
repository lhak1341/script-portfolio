/**
 * Portfolio page — script listing, filtering, and card rendering.
 * Only loaded by index.html. Depends on utils.js (sanitizeHTML, debounce, compareSemver).
 */

/* exported setupFilters, showLoadingError */

/**
 * Cached scripts list data — avoids re-fetching on every search keystroke
 */
let _scriptsListCache = null;

/**
 * Load scripts list for main page
 */
async function loadScriptsList() {
    if (_scriptsListCache) {
        return _scriptsListCache;
    }
    const grid = document.getElementById('scripts-grid');
    if (grid) {
        grid.innerHTML = '<div class="loading" style="grid-column: 1/-1;">Loading scripts</div>';
    }
    try {
        const response = await fetch('data/scripts-list.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        _scriptsListCache = data;
        // Sort scripts with pinned at top before rendering
        const sortedScripts = [...data.scripts].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.name.localeCompare(b.name); // Default to name sort
        });
        renderScriptCards(sortedScripts);
        return data;
    } catch (error) {
        console.error('Failed to load scripts list:', error);
        const grid = document.getElementById('scripts-grid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Failed to load scripts</p>
                    <p style="font-size: 0.9rem;">Make sure to use an HTTP server: <code>npm run serve</code></p>
                </div>`;
        }
        return { scripts: [], categories: [] };
    }
}

/**
 * Render script cards on main page
 */
function renderScriptCards(scripts) {
    const grid = document.getElementById('scripts-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (scripts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No scripts found</p>
                <p style="font-size: 0.9rem;">Try adjusting your search or clearing the filters.</p>
            </div>`;
        grid.classList.remove('two-cards');
        return;
    }

    scripts.forEach(script => {
        const card = createScriptCard(script);
        grid.appendChild(card);
    });

    // Add class for two-card layout to constrain width
    if (scripts.length === 2) {
        grid.classList.add('two-cards');
    } else {
        grid.classList.remove('two-cards');
    }

    // Initialize Lucide icons for the new script cards (especially pin icons)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Create individual script card
 */
function createScriptCard(script) {
    const card = document.createElement('a');
    card.href = `scripts/${encodeURIComponent(script.id)}/index.html`;
    card.className = `script-card ${script.pinned ? 'pinned' : ''}`;

    card.innerHTML = `
        <div class="script-thumbnail">
            <img src="${sanitizeHTML(script.thumbnail || script.screenshot)}" alt="${sanitizeHTML(script.name)}" loading="lazy">
            ${script.pinned ? '<i data-lucide="pin" class="pin-icon"></i>' : ''}
        </div>
        <div class="script-info">
            <h3 class="script-title">${sanitizeHTML(script.name)}</h3>
            <div class="script-meta">
                <span class="script-version">v${sanitizeHTML(script.version)}</span>
                <span class="script-category category-${sanitizeHTML(script.category)}" data-category="${sanitizeHTML(script.category)}">${sanitizeHTML(getCategoryName(script.category))}</span>
            </div>
            <p class="script-description">${sanitizeHTML(script.description)}</p>
            ${script.tags ? `
                <div class="script-tags">
                    ${[...script.tags].sort().map(tag => `<span class="tag" data-tag="${sanitizeHTML(tag)}">${sanitizeHTML(tag)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

    // Add click handlers for tags
    const tagElements = card.querySelectorAll('.tag[data-tag]');
    tagElements.forEach(tagElement => {
        tagElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            e.preventDefault();

            const tag = tagElement.dataset.tag;
            // Normalize to lowercase so URL round-trips consistently with the case-insensitive filter
            const url = new URL(window.location);
            url.searchParams.set('tag', tag.toLowerCase());
            window.history.pushState({}, '', url);

            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = '';
            }

            // Trigger filtering
            handleFiltering().catch(console.error);

            // Show tag filter message
            if (typeof showTagFilterMessage === 'function') {
                showTagFilterMessage(tag);
            }
        });
    });

    // Add click handlers for categories
    const categoryElements = card.querySelectorAll('.script-category[data-category]');
    categoryElements.forEach(categoryElement => {
        categoryElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            e.preventDefault();

            const category = categoryElement.dataset.category;
            // Set category filter dropdown and trigger filtering
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) {
                categoryFilter.value = category;
            }

            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = '';
            }

            // Clear any tag filters
            const url = new URL(window.location);
            url.searchParams.delete('tag');
            window.history.pushState({}, '', url);

            // Trigger filtering
            handleFiltering().catch(console.error);

            // Hide tag filter message if it exists
            const tagFilterMessage = document.querySelector('.tag-filter-message');
            if (tagFilterMessage) {
                tagFilterMessage.remove();
            }

            // Show category filter message
            if (typeof showCategoryFilterMessage === 'function') {
                const categoryName = getCategoryName(category);
                showCategoryFilterMessage(category, categoryName);
            }
        });
    });

    return card;
}

const CATEGORY_NAMES = {
    'utility': 'Utility',
    'automation': 'Automation',
    'workflow': 'Workflow'
};

/**
 * Get category display name
 */
function getCategoryName(categoryId) {
    return CATEGORY_NAMES[categoryId] || categoryId;
}

/**
 * Setup filters and search
 */
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => handleFiltering().catch(console.error), 150));
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = categoryFilter.value;

            // Clear any tag filters
            const url = new URL(window.location);
            url.searchParams.delete('tag');
            window.history.pushState({}, '', url);

            // Hide tag filter message if it exists
            const tagFilterMessage = document.querySelector('.tag-filter-message');
            if (tagFilterMessage) {
                tagFilterMessage.remove();
            }

            // Trigger filtering
            handleFiltering().catch(console.error);

            // Show category filter message if a category is selected
            if (selectedCategory && typeof showCategoryFilterMessage === 'function') {
                const categoryName = getCategoryName(selectedCategory);
                showCategoryFilterMessage(selectedCategory, categoryName);
            } else {
                // Remove category filter message if "All Categories" is selected
                const categoryMessage = document.getElementById('category-filter-message');
                if (categoryMessage) {
                    categoryMessage.remove();
                }
            }
        });
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', () => handleFiltering().catch(console.error));
    }
}

/**
 * Handle filtering and search
 */
async function handleFiltering() {
    const data = await loadScriptsList();
    if (!data) return;

    let filteredScripts = [...data.scripts];

    // Check if we're filtering by a specific tag from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = urlParams.get('tag');

    if (tagFilter) {
        // Filter by exact tag match
        filteredScripts = filteredScripts.filter(script =>
            script.tags && script.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())
        );
    } else {
        // Apply general search filter
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
        if (searchTerm) {
            filteredScripts = filteredScripts.filter(script =>
                script.name.toLowerCase().includes(searchTerm) ||
                script.description.toLowerCase().includes(searchTerm) ||
                (script.tags && script.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
    }

    // Apply category filter
    const categoryFilter = document.getElementById('category-filter')?.value;
    if (categoryFilter) {
        filteredScripts = filteredScripts.filter(script => script.category === categoryFilter);
    }

    // Apply sorting with pinned scripts always at top
    const sortFilter = document.getElementById('sort-filter')?.value;
    filteredScripts.sort((a, b) => {
        // First priority: pinned scripts come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Second priority: chosen sort method
        switch (sortFilter) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'newest':
                return compareSemver(b.version, a.version);
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return a.name.localeCompare(b.name);
        }
    });

    renderScriptCards(filteredScripts);
}

/**
 * Show loading error
 */
function showLoadingError() {
    const grid = document.getElementById('scripts-grid');
    if (grid) {
        grid.innerHTML = '<div class="loading">Failed to load scripts. Please try again later.</div>';
    }
}
