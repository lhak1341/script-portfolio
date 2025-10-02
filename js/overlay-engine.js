/**
 * Overlay Engine - Core functionality for interactive script showcases
 */

// Default configuration constants - centralized for easy modification
const OVERLAY_DEFAULTS = {
    BORDER_RADIUS: 4,    // px - default border radius for highlights
    LINE_THICKNESS: 2,   // px - default line thickness
    
    // Predefined color palette - optimized for light/dark themes
    COLORS: {
        red: { light: '#ef4444', dark: '#f87171' },      // Red 500/400
        orange: { light: '#f97316', dark: '#fb923c' },   // Orange 500/400
        yellow: { light: '#eab308', dark: '#facc15' },   // Yellow 500/400
        green: { light: '#22c55e', dark: '#4ade80' },    // Green 500/400
        cyan: { light: '#06b6d4', dark: '#22d3ee' },     // Cyan 500/400
        purple: { light: '#a855f7', dark: '#c084fc' },   // Purple 500/400
        pink: { light: '#ec4899', dark: '#f472b6' }      // Pink 500/400
    }
};

class OverlayEngine {
    constructor(container) {
        this.container = container;
        this.config = null;
        this.overlays = [];
        this.showAllMode = false;
        this.setupToggleButton();
    }

    /**
     * Get color value based on current theme
     */
    getCurrentColorValue(colorName) {
        // Handle legacy hex colors
        if (colorName.startsWith('#')) {
            return colorName;
        }
        // Handle new color system
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return OVERLAY_DEFAULTS.COLORS[colorName] ? 
            OVERLAY_DEFAULTS.COLORS[colorName][isDark ? 'dark' : 'light'] : 
            colorName;
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

        console.log(`Hotspot ${overlay.id}:`, { left, top, width, height });

        // Store current overlay and scale factors for highlight creation
        this.currentOverlay = overlay;
        this.currentScaleX = scaleX;
        this.currentScaleY = scaleY;

        // Create highlight
        const highlight = this.createHighlight(coords, overlay.style, scaleX, scaleY);
        hotspot.appendChild(highlight);

        // Create two lines: one simple for hover, one complex for show-all mode
        if (overlay.line) {
            // Simple line for hover (always 1-segment horizontal)
            const hoverLine = this.createSimpleLine(overlay.line, coords, scaleX, scaleY);
            hoverLine.classList.add('hover-line');
            hotspot.appendChild(hoverLine);

            // Complex line for show-all mode (original multi-segment)
            const showAllLine = this.createLine(overlay.line);
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

            // Complex tooltip for show-all mode (positioned at end of multi-segment line)
            const showAllTooltip = this.createTooltipAbsolute(overlay, scaleX, scaleY, imageContainer);
            showAllTooltip.classList.add('show-all-tooltip');
            showAllTooltip.style.display = 'none'; // Hidden by default
            imageContainer.appendChild(showAllTooltip);

            // Link tooltips to hotspot for hover behavior
            hotspot.addEventListener('mouseenter', () => {
                if (!this.showAllMode) {
                    hoverTooltip.style.opacity = '1';
                }
            });
            hotspot.addEventListener('mouseleave', () => {
                // Only hide tooltip if not in "show all" mode
                if (!this.showAllMode) {
                    hoverTooltip.style.opacity = '0';
                }
            });
        }

        return hotspot;
    }

    /**
     * Create highlight element
     */
    createHighlight(coords, styleConfig, scaleX, scaleY) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';

        // Position relative to hotspot (now always at 0,0 since coords match)
        highlight.style.left = '0px';
        highlight.style.top = '0px';
        highlight.style.width = `${coords.width * scaleX}px`;
        highlight.style.height = `${coords.height * scaleY}px`;

        // Use color from overlay or line config (single source of truth)
        const overlayColor = this.currentOverlay?.color || styleConfig?.color;
        if (overlayColor) {
            const colorValue = this.getCurrentColorValue(overlayColor);
            highlight.style.borderColor = colorValue;
            // Create semi-transparent background
            const rgb = this.hexToRgb(colorValue);
            if (rgb) {
                highlight.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
            }
        }

        // Apply border radius (use default if not specified)
        const borderRadius = styleConfig?.borderRadius || OVERLAY_DEFAULTS.BORDER_RADIUS;
        highlight.style.borderRadius = `${borderRadius}px`;

        return highlight;
    }

    /**
     * Create simple single-segment horizontal line for hover state
     */
    createSimpleLine(lineConfig, coords, scaleX, scaleY) {
        const container = document.createElement('div');
        container.className = 'overlay-line-container';

        // Use color from overlay or line config
        const overlayColor = this.currentOverlay?.color || lineConfig.color || 'cyan';
        const lineColor = this.getCurrentColorValue(overlayColor);
        const thickness = lineConfig.thickness || OVERLAY_DEFAULTS.LINE_THICKNESS;

        // Calculate total horizontal distance from segments
        const segments = lineConfig.segments;
        let totalHorizontal = 0;
        segments.forEach(seg => {
            if (seg.type === 'horizontal') {
                totalHorizontal += seg.length;
            }
        });

        // Create single horizontal segment
        const scale = Math.min(scaleX, scaleY);
        const simpleSegments = [{type: 'horizontal', length: totalHorizontal}];

        this.createSegmentedLine(container, simpleSegments, lineColor, thickness, scaleX, scaleY);

        return container;
    }

    /**
     * Create line element - supports both single direction lines and multi-segment connectors
     */
    createLine(lineConfig) {
        const container = document.createElement('div');
        container.className = 'overlay-line-container';

        // Use color from overlay or line config (single source of truth)
        const overlayColor = this.currentOverlay?.color || lineConfig.color || 'cyan';
        const lineColor = this.getCurrentColorValue(overlayColor);
        const thickness = lineConfig.thickness || OVERLAY_DEFAULTS.LINE_THICKNESS;

        // Use unified multi-segment system
        const scaleX = this.currentScaleX || 1;
        const scaleY = this.currentScaleY || 1;

        // Simplify segments: remove segments with zero length
        const simplifiedSegments = this.simplifyLineSegments(lineConfig.segments);

        this.createSegmentedLine(container, simplifiedSegments, lineColor, thickness, scaleX, scaleY);

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
        if (!this.isValidSegmentPattern(filtered)) {
            console.warn('Invalid segment pattern detected. Expected [H] or [H,V,H]. Got:', filtered);
            // Return a safe fallback
            return [{ type: 'horizontal', length: 100 }];
        }

        return filtered;
    }

    /**
     * Validate that segments follow the required pattern:
     * - 1 segment: [H]
     * - 3 segments: [H, V, H]
     */
    isValidSegmentPattern(segments) {
        if (segments.length === 1) {
            return segments[0].type === 'horizontal';
        }
        if (segments.length === 3) {
            return segments[0].type === 'horizontal' &&
                   segments[1].type === 'vertical' &&
                   segments[2].type === 'horizontal';
        }
        // Any other length is invalid
        return false;
    }

    /**
     * Create multi-segment line (horizontal-vertical-horizontal)
     */
    createSegmentedLine(container, segments, lineColor, thickness, scaleX, scaleY) {
        let currentX = 0;
        let currentY = 0;
        const scale = Math.min(scaleX, scaleY); // Use consistent scaling
        const firstSegment = segments[0];

        // Start from hotspot edge based on first segment direction
        if (firstSegment.type === 'horizontal') {
            if (firstSegment.length > 0) {
                // Starting horizontal right - start from right edge
                container.style.left = '100%';
                container.style.top = '50%';
                container.style.transform = 'translateY(-50%)';
            } else {
                // Starting horizontal left - start from left edge
                container.style.left = '0%';
                container.style.top = '50%';
                container.style.transform = 'translateY(-50%)';
            }
        } else {
            if (firstSegment.length > 0) {
                // Starting vertical down - start from bottom edge
                container.style.left = '50%';
                container.style.top = '100%';
                container.style.transform = 'translateX(-50%)';
            } else {
                // Starting vertical up - start from top edge
                container.style.left = '50%';
                container.style.top = '0%';
                container.style.transform = 'translateX(-50%)';
            }
        }

        // Create each segment
        segments.forEach((segment, index) => {
            const segmentEl = document.createElement('div');
            segmentEl.className = `line-segment segment-${index}`;
            segmentEl.style.position = 'absolute';
            segmentEl.style.backgroundColor = lineColor;
            segmentEl.style.opacity = '1'; // Ensure visibility

            // Apply scaling to segment lengths
            const scaledLength = segment.length * scale;

            if (segment.type === 'horizontal') {
                const width = Math.abs(scaledLength);
                segmentEl.style.width = `${width}px`;
                segmentEl.style.height = `${thickness}px`;

                // Position segment
                if (scaledLength >= 0) {
                    // Going right
                    segmentEl.style.left = `${currentX}px`;
                } else {
                    // Going left
                    segmentEl.style.left = `${currentX - width}px`;
                }
                segmentEl.style.top = `${currentY - thickness/2}px`;

                currentX += scaledLength;
            } else { // vertical
                const height = Math.abs(scaledLength);
                segmentEl.style.width = `${thickness}px`;
                segmentEl.style.height = `${height}px`;

                // Position segment
                segmentEl.style.left = `${currentX - thickness/2}px`;
                if (scaledLength >= 0) {
                    // Going down
                    segmentEl.style.top = `${currentY}px`;
                } else {
                    // Going up
                    segmentEl.style.top = `${currentY - height}px`;
                }

                currentY += scaledLength;
            }

            container.appendChild(segmentEl);
        });

        // Store final position for tooltip positioning
        container.setAttribute('data-end-x', currentX);
        container.setAttribute('data-end-y', currentY);

        console.log('Multi-segment line created:', {
            segments: segments.length,
            endPosition: { x: currentX, y: currentY },
            color: lineColor,
            thickness,
            scale,
            startEdge: firstSegment.type === 'horizontal' ? (firstSegment.length > 0 ? 'right' : 'left') : (firstSegment.length > 0 ? 'bottom' : 'top')
        });
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
            tooltip.style.top = `${endY}px`;
            tooltip.style.transform = 'translateY(-50%)';
        } else {
            // Going left
            const endX = hotspotLeft + scaledHorizontal;
            const endY = hotspotTop + hotspotHeight / 2;
            tooltip.style.right = `calc(100% - ${endX}px)`;
            tooltip.style.top = `${endY}px`;
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

        // Get coordinates (support both old and new format)
        const coords = this.getOverlayCoordinates(overlay);

        // Calculate hotspot center position
        const hotspotCenterX = (coords.x + coords.width / 2) * scaleX;
        const hotspotCenterY = (coords.y + coords.height / 2) * scaleY;

        const offset = 15; // Space between line end and tooltip

        // Use unified multi-segment positioning
        this.positionTooltipForSegmentedLine(tooltip, overlay, hotspotCenterX, hotspotCenterY, scaleX, scaleY, offset);

        return tooltip;
    }

    /**
     * Position tooltip for segmented line system
     */
    positionTooltipForSegmentedLine(tooltip, overlay, hotspotCenterX, hotspotCenterY, scaleX, scaleY, offset) {
        // Use simplified segments for positioning
        const segments = this.simplifyLineSegments(overlay.line.segments);
        const scale = Math.min(scaleX, scaleY);
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        // Calculate starting position based on hotspot edge
        let startX, startY;
        const coords = this.getOverlayCoordinates(overlay);
        const hotspotLeft = coords.x * scaleX;
        const hotspotTop = coords.y * scaleY;
        const hotspotWidth = coords.width * scaleX;
        const hotspotHeight = coords.height * scaleY;

        // Also store these for debugging
        console.log(`Hotspot bounds for ${overlay.id}:`, {
            coords,
            scaled: { left: hotspotLeft, top: hotspotTop, width: hotspotWidth, height: hotspotHeight },
            scaleFactors: { scaleX, scaleY, scale }
        });

        if (firstSegment.type === 'horizontal') {
            startY = hotspotTop + hotspotHeight / 2; // Middle of hotspot vertically
            if (firstSegment.length > 0) {
                // Starting from right edge
                startX = hotspotLeft + hotspotWidth;
            } else {
                // Starting from left edge
                startX = hotspotLeft;
            }
        } else {
            startX = hotspotLeft + hotspotWidth / 2; // Middle of hotspot horizontally
            if (firstSegment.length > 0) {
                // Starting from bottom edge
                startY = hotspotTop + hotspotHeight;
            } else {
                // Starting from top edge
                startY = hotspotTop;
            }
        }

        // Calculate final position after all segments
        let endX = startX;
        let endY = startY;

        segments.forEach(segment => {
            if (segment.type === 'horizontal') {
                endX += segment.length * scale;
            } else {
                endY += segment.length * scale;
            }
        });

        // Position tooltip at end of segmented line with no gap
        if (lastSegment.type === 'horizontal') {
            // Last segment is horizontal - position tooltip left/right of end point
            if (lastSegment.length > 0) {
                // Line ends going right, tooltip to the right (no gap)
                tooltip.style.left = `${endX}px`;
                tooltip.style.transform = 'translateY(-50%)';
            } else {
                // Line ends going left, tooltip to the left (no gap)
                tooltip.style.right = `calc(100% - ${endX}px)`;
                tooltip.style.transform = 'translateY(-50%)';
            }
            tooltip.style.top = `${endY}px`;

            // Clear other positioning
            tooltip.style.bottom = 'auto';
        } else {
            // Last segment is vertical - position tooltip above/below end point
            if (lastSegment.length > 0) {
                // Line ends going down, tooltip below (no gap)
                tooltip.style.top = `${endY}px`;
                tooltip.style.transform = 'translateX(-50%)';
            } else {
                // Line ends going up, tooltip above (no gap)
                tooltip.style.bottom = `calc(100% - ${endY}px)`;
                tooltip.style.transform = 'translateX(-50%)';
            }
            tooltip.style.left = `${endX}px`;

            // Clear other positioning
            tooltip.style.right = 'auto';
        }

        console.log(`Segmented tooltip for ${overlay.id}:`, {
            segments: segments.length,
            startPosition: { x: startX, y: startY },
            endPosition: { x: endX, y: endY },
            lastSegment: lastSegment,
            hotspotBounds: { left: hotspotLeft, top: hotspotTop, width: hotspotWidth, height: hotspotHeight }
        });
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
     * Process markdown using Marked.js library
     */
    processMarkdown(text) {
        if (typeof marked === 'undefined') {
            console.warn('Marked.js not loaded, falling back to plain text');
            return `<p>${text}</p>`;
        }
        
        // Configure marked for consistent rendering
        marked.setOptions({
            gfm: true,          // GitHub Flavored Markdown
            breaks: false,      // Don't convert \n to <br>
            sanitize: false,    // We trust our content
            smartypants: false  // Don't convert quotes to smart quotes
        });
        
        return marked.parse(text);
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
        const badgeContainer = header.querySelector('[style*="margin-top"]');
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">v${config.version}</span>
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; margin-left: 0.5rem;">${config.category}</span>
            `;
        }

        // Update tags
        if (config.tags) {
            // Look for either old structure (.script-tags) or new structure (.script-tags-section .script-tags)
            let tagsContainer = document.querySelector('.script-tags-section .script-tags');
            if (!tagsContainer) {
                tagsContainer = document.querySelector('.script-tags');
                // If we found old structure, upgrade it
                if (tagsContainer && tagsContainer.previousElementSibling?.tagName === 'H3') {
                    const h3 = tagsContainer.previousElementSibling;
                    const newSection = document.createElement('div');
                    newSection.className = 'script-tags-section';
                    newSection.innerHTML = `
                        <svg class="tag-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        <div class="script-tags"></div>
                    `;
                    h3.parentNode.replaceChild(newSection, h3);
                    tagsContainer.remove();
                    tagsContainer = newSection.querySelector('.script-tags');
                    
                    // Re-initialize Lucide icons
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
            
            if (tagsContainer) {
                tagsContainer.innerHTML = [...config.tags].sort().map(tag => 
                    `<a href="../../index.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`
                ).join(' ');
            }
        }
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
     * Get overlay coordinates
     */
    getOverlayCoordinates(overlay) {
        return overlay.coordinates || { x: 0, y: 0, width: 0, height: 0 };
    }

    /**
     * Get current hotspot being processed (utility method)
     */
    getCurrentHotspot() {
        if (this.currentOverlay) {
            return this.getOverlayCoordinates(this.currentOverlay);
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
        if (this.showAllMode) {
            // Show all overlays permanently with complex multi-segment lines
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const hoverLines = overlay.querySelectorAll('.hover-line');
                const showAllLines = overlay.querySelectorAll('.show-all-line');
                const hoverTooltips = document.querySelectorAll('.hover-tooltip');
                const showAllTooltips = document.querySelectorAll('.show-all-tooltip');

                highlights.forEach(h => h.style.opacity = '1');
                // Hide simple hover lines and tooltips
                hoverLines.forEach(l => l.style.display = 'none');
                hoverTooltips.forEach(t => t.style.display = 'none');
                // Show complex lines and tooltips
                showAllLines.forEach(l => {
                    l.style.display = '';
                    l.style.opacity = '1';
                });
                showAllTooltips.forEach(t => {
                    t.style.display = '';
                    t.style.opacity = '1';
                });
            });
        } else {
            // Return to hover-only mode with simple horizontal lines
            this.overlays.forEach(overlay => {
                const highlights = overlay.querySelectorAll('.highlight');
                const hoverLines = overlay.querySelectorAll('.hover-line');
                const showAllLines = overlay.querySelectorAll('.show-all-line');
                const hoverTooltips = document.querySelectorAll('.hover-tooltip');
                const showAllTooltips = document.querySelectorAll('.show-all-tooltip');

                highlights.forEach(h => h.style.opacity = '');
                // Show simple hover lines and tooltips
                hoverLines.forEach(l => {
                    l.style.display = '';
                    l.style.opacity = '';
                });
                hoverTooltips.forEach(t => {
                    t.style.display = '';
                    t.style.opacity = '';
                });
                // Hide complex lines and tooltips
                showAllLines.forEach(l => l.style.display = 'none');
                showAllTooltips.forEach(t => t.style.display = 'none');
            });
        }
    }

    /**
     * Toggle show all overlays mode (legacy method for compatibility)
     */
    toggleShowAll() {
        const toggleInput = document.getElementById('overlay-toggle');
        this.showAllMode = !this.showAllMode;
        
        if (toggleInput) {
            toggleInput.checked = this.showAllMode;
        }
        
        this.updateOverlayVisibility();
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
                "pinned": true,
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
                "pinned": false,
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
                "pinned": true,
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
                "pinned": true,
                "tags": ["find", "replace", "expressions", "batch"]
            }
        ],
        "categories": [
            {
                "id": "utility",
                "name": "Utility",
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
    const card = document.createElement('div');
    card.className = `script-card ${script.pinned ? 'pinned' : ''}`;
    card.addEventListener('click', () => {
        window.location.href = `scripts/${script.id}/index.html`;
    });

    card.innerHTML = `
        <div class="script-thumbnail">
            <img src="${script.thumbnail || script.screenshot}" alt="${script.name}" loading="lazy">
            ${script.pinned ? '<i data-lucide="pin" class="pin-icon"></i>' : ''}
        </div>
        <div class="script-info">
            <h3 class="script-title">${script.name}</h3>
            <div class="script-meta">
                <span class="script-version">v${script.version}</span>
                <span class="script-category category-${script.category}" data-category="${script.category}">${getCategoryName(script.category)}</span>
            </div>
            <p class="script-description">${script.description}</p>
            ${script.tags ? `
                <div class="script-tags">
                    ${[...script.tags].sort().map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
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
            // Update URL and trigger filtering
            const url = new URL(window.location);
            url.searchParams.set('tag', tag);
            window.history.pushState({}, '', url);
            
            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Trigger filtering
            handleFiltering();
            
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
            handleFiltering();
            
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

    // Initialize Lucide icons for the new card
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 0);
    }

    return card;
}

/**
 * Get category display name
 */
function getCategoryName(categoryId) {
    const categories = {
        'utility': 'Utility',
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
            handleFiltering();
            
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
                return b.version.localeCompare(a.version);
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OverlayEngine, initializeOverlayEngine };
}