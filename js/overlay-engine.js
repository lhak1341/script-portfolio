/**
 * Overlay Engine - Core functionality for interactive script showcases
 * Requires: OVERLAY_DEFAULTS (from overlay-defaults.js)
 *
 * @module overlay-engine
 * @public initializeOverlayEngine(containerId) — factory; returns OverlayEngine or null
 * @public OverlayEngine class — loadConfig, destroy
 */

class OverlayEngine {
    constructor(container) {
        this.container = container;
        this.config = null;
        this.overlays = [];
        this.tooltips = [];
        this.showAllMode = false;
        this.setupToggleButton();
    }

    /**
     * Get color value based on current theme.
     * Delegates to resolveOverlayColor() in overlay-utils.js.
     */
    getCurrentColorValue(colorName) {
        return resolveOverlayColor(colorName);
    }

    /**
     * Load and apply overlay configuration
     */
    async loadConfig(configPath) {
        try {
            // Add cache-busting parameter to avoid stale JSON
            const cacheBuster = Date.now();
            const response = await fetch(`${configPath}?v=${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse JSON with better error handling
            const text = await response.text();
            try {
                this.config = JSON.parse(text);
            } catch (jsonError) {
                console.error('Invalid JSON in config file:', jsonError);
                console.error('Response text:', text.substring(0, 200));
                throw new Error(`Invalid JSON in config file: ${jsonError.message}`);
            }

            this.createOverlays();
            return true;
        } catch (error) {
            console.error('Failed to load overlay config:', error);
            // Show a fallback message
            if (this.container) {
                this.container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">
                    <p>Failed to load overlay configuration.</p>
                    <p>Config path: ${sanitizeHTML(configPath)}</p>
                    <p>Error: ${sanitizeHTML(error.message)}</p>
                </div>`;
            }
            return false;
        }
    }

    /**
     * Apply configuration directly
     */
    applyConfig(config) {
        this.config = config;
        this.createOverlays();
    }

    /**
     * Create overlay elements from configuration
     */
    createOverlays() {
        if (!this.config || !this.config.overlays) {
            console.error('No config or overlays found');
            return;
        }

        // Clear existing overlays
        this.clearOverlays();

        // Find or create image container
        let imageContainer = this.container.querySelector('.script-image-container');
        if (!imageContainer) {
            imageContainer = this.container;
            if (!imageContainer.classList.contains('script-image-container')) {
                imageContainer.classList.add('script-image-container');
            }
        }

        // Create or update the main image
        let img = imageContainer.querySelector('.script-image');
        if (!img) {
            img = document.createElement('img');
            img.className = 'script-image';
            imageContainer.appendChild(img);
        }

        img.alt = this.config.scriptName || 'Script Screenshot';

        // Set handlers before src so cached images don't fire before handlers are registered
        img.onload = () => {
            this.createOverlayElements(imageContainer);
            imageContainer.classList.add('loaded');
        };

        img.onerror = () => {
            console.error('Failed to load image:', this.config.baseImage.src);
            imageContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">
                <p>Failed to load image: ${sanitizeHTML(this.config.baseImage.src)}</p>
                <p>Please check the image path.</p>
            </div>`;
            // Reset internal state — the innerHTML wipe orphaned all overlay/tooltip nodes
            this.overlays = [];
            this.tooltips = [];
        };

        img.src = this.config.baseImage.src;
    }

    /**
     * Create individual overlay elements
     */
    createOverlayElements(imageContainer) {
        const img = imageContainer.querySelector('.script-image');
        if (!img || !img.offsetWidth || !img.offsetHeight) {
            console.error('Image not properly loaded or has no dimensions');
            return;
        }

        // Calculate scale factors
        const scaleX = img.offsetWidth / this.config.baseImage.width;
        const scaleY = img.offsetHeight / this.config.baseImage.height;

        this.config.overlays.forEach((overlay, index) => {
            const hotspot = this.createHotspot(overlay, scaleX, scaleY, index, imageContainer);
            imageContainer.appendChild(hotspot);
            this.overlays.push(hotspot);
        });
    }

    /**
     * Create a hotspot element with highlight, line, and tooltip
     */
    createHotspot(overlay, scaleX, scaleY, index, imageContainer) {
        const hotspot = document.createElement('div');
        hotspot.className = 'hotspot';
        hotspot.id = `hotspot-${overlay.id || index}`;
        hotspot.setAttribute('tabindex', '0');
        hotspot.setAttribute('role', 'button');
        const rawLabel = (overlay.description && overlay.description.content)
            ? overlay.description.content
            : (overlay.id || `Hotspot ${index + 1}`);
        // Strip markdown syntax so screen readers don't announce raw asterisks, backticks, etc.
        const hotspotLabel = rawLabel
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim();
        hotspot.setAttribute('aria-label', hotspotLabel);

        // Get coordinates (support both old and new format)
        const coords = this.getOverlayCoordinates(overlay);
        
        // Position and size hotspot
        const left = coords.x * scaleX;
        const top = coords.y * scaleY;
        const width = coords.width * scaleX;
        const height = coords.height * scaleY;

        hotspot.style.left = `${left}px`;
        hotspot.style.top = `${top}px`;
        hotspot.style.width = `${width}px`;
        hotspot.style.height = `${height}px`;

        // Create highlight
        const highlight = this.createHighlight(coords, overlay.style, scaleX, scaleY, overlay);
        hotspot.appendChild(highlight);

        // Create two lines: one simple for hover, one complex for show-all mode
        if (overlay.line) {
            // Simple line for hover (always 1-segment horizontal)
            const hoverLine = this.createSimpleLine(overlay.line, coords, scaleX, scaleY, overlay);
            hoverLine.classList.add('hover-line');
            hotspot.appendChild(hoverLine);

            // Complex line for show-all mode (original multi-segment)
            const showAllLine = this.createLine(overlay.line, overlay, scaleX, scaleY);
            showAllLine.classList.add('show-all-line');
            showAllLine.style.display = 'none'; // Hidden by default
            hotspot.appendChild(showAllLine);
        }

        // Create two tooltips: one simple for hover, one complex for show-all
        if (overlay.description) {
            // Simple tooltip for hover (positioned at end of horizontal line)
            const hoverTooltip = this.createSimpleTooltipAbsolute(overlay, scaleX, scaleY, imageContainer);
            hoverTooltip.classList.add('hover-tooltip');
            imageContainer.appendChild(hoverTooltip);
            this.tooltips.push(hoverTooltip);

            // Complex tooltip for show-all mode (positioned at end of multi-segment line)
            const showAllTooltip = this.createTooltipAbsolute(overlay, scaleX, scaleY, imageContainer);
            showAllTooltip.classList.add('show-all-tooltip');
            showAllTooltip.style.display = 'none'; // Hidden by default
            imageContainer.appendChild(showAllTooltip);
            this.tooltips.push(showAllTooltip);

            // Link tooltips to hotspot for hover and keyboard focus behavior
            const showHoverTooltip = () => {
                if (!this.showAllMode) {
                    hoverTooltip.style.opacity = '1';
                }
            };
            const hideHoverTooltip = () => {
                if (!this.showAllMode) {
                    hoverTooltip.style.opacity = '0';
                }
            };
            hotspot.addEventListener('mouseenter', showHoverTooltip);
            hotspot.addEventListener('mouseleave', hideHoverTooltip);
            hotspot.addEventListener('focusin', showHoverTooltip);
            hotspot.addEventListener('focusout', hideHoverTooltip);
            // Enter/Space fulfill the ARIA button contract (activate = show tooltip)
            hotspot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showHoverTooltip();
                }
            });
        }

        return hotspot;
    }

    /**
     * Create highlight element
     */
    createHighlight(coords, styleConfig, scaleX, scaleY, overlay) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';

        // Position relative to hotspot (now always at 0,0 since coords match)
        highlight.style.left = '0px';
        highlight.style.top = '0px';
        highlight.style.width = `${coords.width * scaleX}px`;
        highlight.style.height = `${coords.height * scaleY}px`;

        // Use color from overlay or line config (single source of truth)
        const overlayColor = overlay?.color || styleConfig?.color;
        if (overlayColor) {
            const colorValue = this.getCurrentColorValue(overlayColor);
            highlight.style.borderColor = colorValue;
            const rgba = hexToRgba(colorValue, 0.1);
            if (rgba) highlight.style.background = rgba;
        }

        // Apply border radius (use default if not specified)
        const borderRadius = styleConfig?.borderRadius || OVERLAY_DEFAULTS.BORDER_RADIUS;
        highlight.style.borderRadius = `${borderRadius}px`;

        return highlight;
    }

    /**
     * Create simple single-segment horizontal line for hover state
     */
    createSimpleLine(lineConfig, coords, scaleX, scaleY, overlay) {
        const container = document.createElement('div');
        container.className = 'overlay-line-container';

        const overlayColor = overlay?.color || lineConfig.color || 'cyan';
        const lineColor = this.getCurrentColorValue(overlayColor);
        const thickness = lineConfig.thickness || OVERLAY_DEFAULTS.LINE_THICKNESS;

        // Use simplifyLineSegments so zero-length and invalid segments are handled
        // consistently with createLine, then collapse to a single horizontal segment.
        const simplified = this.simplifyLineSegments(lineConfig.segments || []);
        let totalHorizontal = 0;
        simplified.forEach(seg => {
            if (seg.type === 'horizontal') totalHorizontal += seg.length;
        });

        const simpleSegments = [{type: 'horizontal', length: totalHorizontal || 1}];
        buildSegmentedLineSegments(container, simpleSegments, lineColor, thickness, scaleX, scaleY);

        return container;
    }

    /**
     * Create line element - supports both single direction lines and multi-segment connectors
     */
    createLine(lineConfig, overlay, scaleX, scaleY) {
        const container = document.createElement('div');
        container.className = 'overlay-line-container';

        const overlayColor = overlay?.color || lineConfig.color || 'cyan';
        const lineColor = this.getCurrentColorValue(overlayColor);
        const thickness = lineConfig.thickness || OVERLAY_DEFAULTS.LINE_THICKNESS;

        scaleX = scaleX || 1;
        scaleY = scaleY || 1;

        const simplifiedSegments = this.simplifyLineSegments(lineConfig.segments);
        buildSegmentedLineSegments(container, simplifiedSegments, lineColor, thickness, scaleX, scaleY);

        return container;
    }

    /**
     * Simplify line segments by removing zero-length segments
     */
    simplifyLineSegments(segments) {
        if (!segments || segments.length === 0) return [];

        // Filter out segments with zero or near-zero length
        const filtered = segments.filter(seg => Math.abs(seg.length) > 0.1);

        // If we filtered down to nothing, return a minimal segment
        if (filtered.length === 0) {
            return [{ type: 'horizontal', length: 1 }];
        }

        // Validate pattern: must be [H] or [H,V,H]
        if (!isValidSegmentPattern(filtered)) {
            console.warn('Invalid segment pattern detected. Expected [H] or [H,V,H]. Got:', filtered);
            // Return a safe fallback
            return [{ type: 'horizontal', length: 100 }];
        }

        return filtered;
    }

    /**
     * Create simple tooltip positioned at end of horizontal line
     */
    createSimpleTooltipAbsolute(overlay, scaleX, scaleY, imageContainer) {
        const tooltip = document.createElement('div');
        tooltip.className = 'description-tooltip';

        // Process markdown-like formatting
        const content = this.processMarkdown(overlay.description.content);
        tooltip.innerHTML = content;

        // Get coordinates
        const coords = this.getOverlayCoordinates(overlay);

        // Calculate hotspot position
        const hotspotLeft = coords.x * scaleX;
        const hotspotTop = coords.y * scaleY;
        const hotspotWidth = coords.width * scaleX;
        const hotspotHeight = coords.height * scaleY;

        // If no line config, position tooltip directly adjacent to the hotspot
        if (!overlay.line) {
            tooltip.style.left = `${hotspotLeft + hotspotWidth + 8}px`;
            tooltip.style.top = `${hotspotTop + hotspotHeight / 2}px`;
            tooltip.style.transform = 'translateY(-50%)';
            return tooltip;
        }

        // Calculate total horizontal distance from segments
        const segments = overlay.line.segments;
        let totalHorizontal = 0;
        segments.forEach(seg => {
            if (seg.type === 'horizontal') {
                totalHorizontal += seg.length;
            }
        });

        const scale = Math.min(scaleX, scaleY);
        const scaledHorizontal = totalHorizontal * scale;

        // Position tooltip at end of horizontal line
        if (totalHorizontal >= 0) {
            // Going right
            const endX = hotspotLeft + hotspotWidth + scaledHorizontal;
            const endY = hotspotTop + hotspotHeight / 2;
            tooltip.style.left = `${endX}px`;
            tooltip.style.right = 'auto';
            tooltip.style.top = `${endY}px`;
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translateY(-50%)';
        } else {
            // Going left
            const endX = hotspotLeft + scaledHorizontal;
            const endY = hotspotTop + hotspotHeight / 2;
            tooltip.style.right = `calc(100% - ${endX}px)`;
            tooltip.style.left = 'auto';
            tooltip.style.top = `${endY}px`;
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translateY(-50%)';
        }

        return tooltip;
    }

    /**
     * Create tooltip positioned absolutely relative to image container
     */
    createTooltipAbsolute(overlay, scaleX, scaleY, imageContainer) {
        const tooltip = document.createElement('div');
        tooltip.className = 'description-tooltip';

        // Process markdown-like formatting
        const content = this.processMarkdown(overlay.description.content);
        tooltip.innerHTML = content;

        const segments = overlay.line ? this.simplifyLineSegments(overlay.line.segments) : [];
        positionTooltipForSegmentedLine(
            tooltip, segments, this.getOverlayCoordinates(overlay), scaleX, scaleY, 0
        );

        return tooltip;
    }


    /**
     * Process markdown using Marked.js library.
     * Delegates to renderMarkdown() in overlay-utils.js.
     */
    processMarkdown(text) {
        return renderMarkdown(text);
    }

    /**
     * Load and render markdown content from description.md
     */
    async loadDescription(scriptPath) {
        try {
            const response = await fetch(`${scriptPath}/description.md?v=${Date.now()}`);
            if (!response.ok) {
                console.warn('No description.md found, using fallback content');
                return null;
            }
            const markdown = await response.text();
            return this.processMarkdown(markdown);
        } catch (error) {
            console.error('Error loading description.md:', error);
            return null;
        }
    }

    /**
     * Update script metadata from config
     */
    updateScriptMetadata(config) {
        // Update title and subtitle
        const title = document.querySelector('.site-title');
        const subtitle = document.querySelector('.site-subtitle');
        if (title) title.textContent = config.scriptName;
        if (subtitle) subtitle.textContent = config.description;

        // Update version and category badges
        const header = document.querySelector('.header .container');
        if (!header) return;
        const badgeContainer = header.querySelector('[style*="margin-top"]');
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">v${sanitizeHTML(config.version)}</span>
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; margin-left: 0.5rem;">${sanitizeHTML(config.category)}</span>
            `;
        }

        // Update tags
        if (config.tags) {
            const tagsContainer = document.querySelector('.script-tags-section .script-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = [...config.tags].sort().map(tag =>
                    `<a href="../../index.html?tag=${encodeURIComponent(tag)}" class="tag">${sanitizeHTML(tag)}</a>`
                ).join(' ');
            }
        }
    }

    /**
     * Get overlay coordinates
     */
    getOverlayCoordinates(overlay) {
        return overlay.coordinates || { x: 0, y: 0, width: 0, height: 0 };
    }

    /**
     * Clear all overlays
     */
    clearOverlays() {
        this.overlays.forEach(overlay => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        this.overlays = [];
        this.tooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        this.tooltips = [];
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.config) {
            this.createOverlays();
        }
    }

    /**
     * Setup toggle button functionality
     */
    setupToggleButton() {
        const toggleInput = document.getElementById('overlay-toggle');
        if (toggleInput) {
            toggleInput.addEventListener('change', () => {
                this.showAllMode = toggleInput.checked;
                this.updateOverlayVisibility();
            });
        }
    }

    /**
     * Update overlay visibility based on current mode
     */
    updateOverlayVisibility() {
        // Query global tooltip sets once — applying them per-overlay is O(N²)
        const hoverTooltips = this.container.querySelectorAll('.hover-tooltip');
        const showAllTooltips = this.container.querySelectorAll('.show-all-tooltip');

        if (this.showAllMode) {
            // Show all overlays permanently with complex multi-segment lines
            hoverTooltips.forEach(t => t.style.display = 'none');
            showAllTooltips.forEach(t => { t.style.display = ''; t.style.opacity = '1'; });
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const hoverLines = overlay.querySelectorAll('.hover-line');
                const showAllLines = overlay.querySelectorAll('.show-all-line');

                highlights.forEach(h => h.style.opacity = '1');
                // Hide simple hover lines
                hoverLines.forEach(l => l.style.display = 'none');
                // Show complex lines
                showAllLines.forEach(l => { l.style.display = ''; l.style.opacity = '1'; });
            });
        } else {
            // Return to hover-only mode with simple horizontal lines
            hoverTooltips.forEach(t => { t.style.display = ''; t.style.opacity = ''; });
            showAllTooltips.forEach(t => t.style.display = 'none');
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const hoverLines = overlay.querySelectorAll('.hover-line');
                const showAllLines = overlay.querySelectorAll('.show-all-line');

                highlights.forEach(h => h.style.opacity = '');
                // Show simple hover lines
                hoverLines.forEach(l => { l.style.display = ''; l.style.opacity = ''; });
                // Hide complex lines
                showAllLines.forEach(l => l.style.display = 'none');
            });
        }
    }

    /**
     * Destroy the overlay engine
     */
    destroy() {
        this.clearOverlays();
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        this.config = null;
        this.container = null;
    }
}

/**
 * Global function to initialize overlay engine
 */
function initializeOverlayEngine(containerId, configPath) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return null;
    }

    const engine = new OverlayEngine(container);
    
    if (configPath) {
        engine.loadConfig(configPath).catch(err => console.error('loadConfig failed:', err));
    }

    // Handle window resize — debounced to avoid thrashing createOverlays() on every pixel
    engine._resizeHandler = debounce(() => engine.handleResize(), 150);
    window.addEventListener('resize', engine._resizeHandler);

    return engine;
}

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
/* exported setupFilters */
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
/* exported showLoadingError */
function showLoadingError() {
    const grid = document.getElementById('scripts-grid');
    if (grid) {
        grid.innerHTML = '<div class="loading">Failed to load scripts. Please try again later.</div>';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OverlayEngine, initializeOverlayEngine };
}