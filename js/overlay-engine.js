/**
 * Overlay Engine - Core functionality for interactive script showcases
 */

class OverlayEngine {
    constructor(container) {
        this.container = container;
        this.config = null;
        this.overlays = [];
        this.showAllMode = false;
        this.setupToggleButton();
    }

    /**
     * Load and apply overlay configuration
     */
    async loadConfig(configPath) {
        try {
            console.log('Loading config from:', configPath);
            // Add cache-busting parameter to avoid stale JSON
            const cacheBuster = Date.now();
            const response = await fetch(`${configPath}?v=${cacheBuster}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.config = await response.json();
            console.log('Config loaded:', this.config);
            this.createOverlays();
            return true;
        } catch (error) {
            console.error('Failed to load overlay config:', error);
            // Show a fallback message
            if (this.container) {
                this.container.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">
                    <p>Failed to load overlay configuration.</p>
                    <p>Config path: ${configPath}</p>
                    <p>Error: ${error.message}</p>
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

        console.log('Loading image:', this.config.baseImage.src);
        img.src = this.config.baseImage.src;
        img.alt = this.config.scriptName || 'Script Screenshot';

        // Wait for image to load before creating overlays
        img.onload = () => {
            console.log('Image loaded successfully');
            this.createOverlayElements(imageContainer);
            imageContainer.classList.add('loaded');
        };

        img.onerror = () => {
            console.error('Failed to load image:', this.config.baseImage.src);
            imageContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: #666;">
                <p>Failed to load image: ${this.config.baseImage.src}</p>
                <p>Please check the image path.</p>
            </div>`;
        };

        if (img.complete && img.naturalWidth > 0) {
            console.log('Image already loaded');
            this.createOverlayElements(imageContainer);
            imageContainer.classList.add('loaded');
        }
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

        console.log('Scale factors:', { scaleX, scaleY });
        console.log('Image dimensions:', { 
            actual: { width: img.offsetWidth, height: img.offsetHeight },
            config: { width: this.config.baseImage.width, height: this.config.baseImage.height }
        });

        this.config.overlays.forEach((overlay, index) => {
            console.log('Creating overlay:', overlay.id || index);
            const hotspot = this.createHotspot(overlay, scaleX, scaleY, index, imageContainer);
            imageContainer.appendChild(hotspot);
            this.overlays.push(hotspot);
        });

        console.log(`Created ${this.overlays.length} overlays`);
    }

    /**
     * Create a hotspot element with highlight, line, and tooltip
     */
    createHotspot(overlay, scaleX, scaleY, index, imageContainer) {
        const hotspot = document.createElement('div');
        hotspot.className = 'hotspot';
        hotspot.id = `hotspot-${overlay.id || index}`;

        // Position and size hotspot
        const left = overlay.hotspot.x * scaleX;
        const top = overlay.hotspot.y * scaleY;
        const width = overlay.hotspot.width * scaleX;
        const height = overlay.hotspot.height * scaleY;

        hotspot.style.left = `${left}px`;
        hotspot.style.top = `${top}px`;
        hotspot.style.width = `${width}px`;
        hotspot.style.height = `${height}px`;

        console.log(`Hotspot ${overlay.id}:`, { left, top, width, height });

        // Store current overlay for highlight creation
        this.currentOverlay = overlay;

        // Create highlight
        if (overlay.highlight) {
            const highlight = this.createHighlight(overlay.highlight, scaleX, scaleY);
            hotspot.appendChild(highlight);
        }

        // Create line
        if (overlay.line) {
            const line = this.createLine(overlay.line);
            hotspot.appendChild(line);
        }

        // Create description tooltip positioned relative to the image container
        if (overlay.description) {
            const tooltip = this.createTooltipAbsolute(overlay, scaleX, scaleY, imageContainer);
            imageContainer.appendChild(tooltip);
            
            // Link tooltip to hotspot for hover behavior
            hotspot.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
            });
            hotspot.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }

        return hotspot;
    }

    /**
     * Create highlight element
     */
    createHighlight(highlightConfig, scaleX, scaleY) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';

        // Position relative to hotspot
        const offsetX = (highlightConfig.x * scaleX) - (this.getCurrentHotspot().x * scaleX);
        const offsetY = (highlightConfig.y * scaleY) - (this.getCurrentHotspot().y * scaleY);

        highlight.style.left = `${offsetX}px`;
        highlight.style.top = `${offsetY}px`;
        highlight.style.width = `${highlightConfig.width * scaleX}px`;
        highlight.style.height = `${highlightConfig.height * scaleY}px`;

        if (highlightConfig.color) {
            highlight.style.borderColor = highlightConfig.color;
            // Create semi-transparent background
            const rgb = this.hexToRgb(highlightConfig.color);
            if (rgb) {
                highlight.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
            }
        }

        if (highlightConfig.borderRadius) {
            highlight.style.borderRadius = `${highlightConfig.borderRadius}px`;
        }

        return highlight;
    }

    /**
     * Create line element
     */
    createLine(lineConfig) {
        const line = document.createElement('div');
        line.className = `overlay-line line-${lineConfig.direction}`;

        // Set CSS custom properties for line dimensions
        line.style.setProperty('--line-length', `${lineConfig.length}px`);
        line.style.setProperty('--line-thickness', `${lineConfig.thickness || 2}px`);
        
        // Set the line color directly and use !important to override CSS
        const lineColor = lineConfig.color || '#3498db';
        line.style.backgroundColor = lineColor;
        line.style.setProperty('--line-color', lineColor);

        // Position line at the edge of the hotspot
        switch (lineConfig.direction) {
            case 'left':
                line.style.left = '0px';
                line.style.top = '50%';
                line.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                line.style.right = '0px';
                line.style.top = '50%';
                line.style.transform = 'translateY(-50%)';
                break;
            case 'top':
                line.style.top = '0px';
                line.style.left = '50%';
                line.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                line.style.bottom = '0px';
                line.style.left = '50%';
                line.style.transform = 'translateX(-50%)';
                break;
        }

        console.log(`Line created for ${lineConfig.direction}:`, {
            color: lineColor,
            length: lineConfig.length,
            thickness: lineConfig.thickness
        });

        return line;
    }

    /**
     * Create description tooltip
     */
    createTooltip(descriptionConfig, lineConfig) {
        const tooltip = document.createElement('div');
        tooltip.className = 'description-tooltip';
        
        // Process markdown-like formatting
        const content = this.processMarkdown(descriptionConfig.content);
        tooltip.innerHTML = content;

        // Position tooltip at the end of the line
        if (lineConfig) {
            this.positionTooltip(tooltip, lineConfig);
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

        // Calculate hotspot center position
        const hotspotCenterX = (overlay.hotspot.x + overlay.hotspot.width / 2) * scaleX;
        const hotspotCenterY = (overlay.hotspot.y + overlay.hotspot.height / 2) * scaleY;

        // Calculate tooltip position based on line direction
        const direction = overlay.line.direction;
        const length = overlay.line.length * Math.min(scaleX, scaleY); // Scale the line length
        const offset = 15; // Space between line end and tooltip

        switch (direction) {
            case 'left':
                tooltip.style.right = `calc(100% - ${hotspotCenterX - length - offset}px)`;
                tooltip.style.top = `${hotspotCenterY}px`;
                tooltip.style.transform = 'translateY(-50%)';
                tooltip.style.left = 'auto';
                tooltip.style.bottom = 'auto';
                break;
            case 'right':
                tooltip.style.left = `${hotspotCenterX + length + offset}px`;
                tooltip.style.top = `${hotspotCenterY}px`;
                tooltip.style.transform = 'translateY(-50%)';
                tooltip.style.right = 'auto';
                tooltip.style.bottom = 'auto';
                break;
            case 'top':
                tooltip.style.left = `${hotspotCenterX}px`;
                tooltip.style.bottom = `calc(100% - ${hotspotCenterY - length - offset}px)`;
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.top = 'auto';
                tooltip.style.right = 'auto';
                break;
            case 'bottom':
                tooltip.style.left = `${hotspotCenterX}px`;
                tooltip.style.top = `${hotspotCenterY + length + offset}px`;
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.bottom = 'auto';
                tooltip.style.right = 'auto';
                break;
        }

        console.log(`Tooltip for ${overlay.id}:`, {
            direction,
            hotspotCenter: { x: hotspotCenterX, y: hotspotCenterY },
            length,
            position: {
                left: tooltip.style.left,
                right: tooltip.style.right,
                top: tooltip.style.top,
                bottom: tooltip.style.bottom
            }
        });

        return tooltip;
    }

    /**
     * Position tooltip at the end of the line (legacy method)
     */
    positionTooltip(tooltip, lineConfig) {
        const direction = lineConfig.direction;
        const length = lineConfig.length;
        const offset = 15; // Space between line end and tooltip

        switch (direction) {
            case 'left':
                tooltip.style.right = `${length + offset}px`;
                tooltip.style.top = '50%';
                tooltip.style.transform = 'translateY(-50%)';
                tooltip.style.left = 'auto';
                tooltip.style.bottom = 'auto';
                break;
            case 'right':
                tooltip.style.left = `${length + offset}px`;
                tooltip.style.top = '50%';
                tooltip.style.transform = 'translateY(-50%)';
                tooltip.style.right = 'auto';
                tooltip.style.bottom = 'auto';
                break;
            case 'top':
                tooltip.style.bottom = `${length + offset}px`;
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.top = 'auto';
                tooltip.style.right = 'auto';
                break;
            case 'bottom':
                tooltip.style.top = `${length + offset}px`;
                tooltip.style.left = '50%';
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.bottom = 'auto';
                tooltip.style.right = 'auto';
                break;
        }
    }

    /**
     * Process basic markdown formatting
     */
    processMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Get current hotspot being processed (utility method)
     */
    getCurrentHotspot() {
        if (this.currentOverlay && this.currentOverlay.hotspot) {
            return this.currentOverlay.hotspot;
        }
        return { x: 0, y: 0 };
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
        const toggleBtn = document.getElementById('overlay-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleShowAll();
            });
        }
    }

    /**
     * Toggle show all overlays mode
     */
    toggleShowAll() {
        this.showAllMode = !this.showAllMode;
        const toggleBtn = document.getElementById('overlay-toggle');
        
        if (this.showAllMode) {
            // Show all overlays permanently
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const lines = overlay.querySelectorAll('.overlay-line');
                const tooltips = document.querySelectorAll('.description-tooltip');
                
                highlights.forEach(h => h.style.opacity = '1');
                lines.forEach(l => l.style.opacity = '1');
                tooltips.forEach(t => t.style.opacity = '1');
            });
            
            if (toggleBtn) {
                toggleBtn.innerHTML = '👁️‍🗨️ Hide Overlays';
                toggleBtn.style.background = '#dc3545';
            }
        } else {
            // Return to hover-only mode by removing inline opacity styles
            // This allows CSS hover states to work again
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const lines = overlay.querySelectorAll('.overlay-line');
                const tooltips = document.querySelectorAll('.description-tooltip');
                
                highlights.forEach(h => h.style.opacity = '');
                lines.forEach(l => l.style.opacity = '');
                tooltips.forEach(t => t.style.opacity = '');
            });
            
            if (toggleBtn) {
                toggleBtn.innerHTML = '👁️ Show All Overlays';
                toggleBtn.style.background = '#6c757d';
            }
        }
    }

    /**
     * Destroy the overlay engine
     */
    destroy() {
        this.clearOverlays();
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
        engine.loadConfig(configPath);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        engine.handleResize();
    });

    return engine;
}

/**
 * Load scripts list for main page
 */
async function loadScriptsList() {
    try {
        const response = await fetch('data/scripts-list.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderScriptCards(data.scripts);
        return data;
    } catch (error) {
        console.error('Failed to load scripts list:', error);
        // Fallback to hardcoded data if fetch fails
        const fallbackData = getFallbackScriptsData();
        renderScriptCards(fallbackData.scripts);
        return fallbackData;
    }
}

/**
 * Fallback scripts data when JSON file can't be loaded
 */
function getFallbackScriptsData() {
    return {
        "scripts": [
            {
                "id": "sp-comp-setup",
                "name": "SP Comp Setup",
                "version": "0.8.2",
                "category": "utility",
                "description": "Streamlined composition setup with auto-interpretation and template management",
                "thumbnail": "images/script-screenshots/SPCompSetup_0.8.2.png",
                "screenshot": "images/script-screenshots/SPCompSetup_0.8.2.png",
                "featured": true,
                "tags": ["composition", "setup", "automation", "template"]
            },
            {
                "id": "sp-comp-edit",
                "name": "SP Comp Edit",
                "version": "0.1.6",
                "category": "workflow",
                "description": "Advanced composition editing tools with batch operations and property management",
                "thumbnail": "images/script-screenshots/SPCompEdit_0.1.6.png",
                "screenshot": "images/script-screenshots/SPCompEdit_0.1.6.png",
                "featured": false,
                "tags": ["editing", "batch", "properties", "workflow"]
            },
            {
                "id": "sp-srt-importer",
                "name": "SP SRT Importer",
                "version": "0.2.0",
                "category": "automation",
                "description": "Automated SRT subtitle file import with timing and formatting options",
                "thumbnail": "images/script-screenshots/SPSRTImporter_0.2.0.png",
                "screenshot": "images/script-screenshots/SPSRTImporter_0.2.0.png",
                "featured": true,
                "tags": ["subtitle", "import", "srt", "timing"]
            },
            {
                "id": "find-replace-expression",
                "name": "Find and Replace in Expression",
                "version": "1.0.0",
                "category": "utility",
                "description": "Powerful search and replace functionality for expressions across entire projects",
                "thumbnail": "images/script-screenshots/FindAndReplaceInExpression.png",
                "screenshot": "images/script-screenshots/FindAndReplaceInExpression.png",
                "featured": true,
                "tags": ["find", "replace", "expressions", "batch"]
            }
        ],
        "categories": [
            {
                "id": "utility",
                "name": "Utility Tools",
                "color": "#4CAF50"
            },
            {
                "id": "automation", 
                "name": "Automation",
                "color": "#2196F3"
            },
            {
                "id": "workflow",
                "name": "Workflow", 
                "color": "#FF9800"
            }
        ]
    };
}

/**
 * Render script cards on main page
 */
function renderScriptCards(scripts) {
    const grid = document.getElementById('scripts-grid');
    if (!grid) return;

    grid.innerHTML = '';

    scripts.forEach(script => {
        const card = createScriptCard(script);
        grid.appendChild(card);
    });
}

/**
 * Create individual script card
 */
function createScriptCard(script) {
    const card = document.createElement('div');
    card.className = `script-card ${script.featured ? 'featured' : ''}`;
    card.addEventListener('click', () => {
        window.location.href = `scripts/${script.id}/index.html`;
    });

    card.innerHTML = `
        <div class="script-thumbnail">
            <img src="${script.thumbnail || script.screenshot}" alt="${script.name}" loading="lazy">
        </div>
        <div class="script-info">
            <h3 class="script-title">${script.name}</h3>
            <span class="script-version">v${script.version}</span>
            <p class="script-description">${script.description}</p>
            <span class="script-category category-${script.category}">${getCategoryName(script.category)}</span>
            ${script.tags ? `
                <div class="script-tags">
                    ${script.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

/**
 * Get category display name
 */
function getCategoryName(categoryId) {
    const categories = {
        'utility': 'Utility Tools',
        'automation': 'Automation',
        'workflow': 'Workflow'
    };
    return categories[categoryId] || categoryId;
}

/**
 * Setup filters and search
 */
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (searchInput) {
        searchInput.addEventListener('input', handleFiltering);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFiltering);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFiltering);
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

    // Apply sorting
    const sortFilter = document.getElementById('sort-filter')?.value;
    switch (sortFilter) {
        case 'name':
            filteredScripts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'newest':
            filteredScripts.sort((a, b) => b.version.localeCompare(a.version));
            break;
        case 'category':
            filteredScripts.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }

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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OverlayEngine, initializeOverlayEngine };
}