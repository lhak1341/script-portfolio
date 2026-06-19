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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OverlayEngine, initializeOverlayEngine };
}