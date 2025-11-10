/**
 * Visual Configuration Builder for Overlay System
 */

// Default configuration constants - must match overlay-engine.js
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

class ConfigurationBuilder {
    constructor() {
        this.mode = 'select'; // 'select' or 'create'
        this.currentImage = null;
        this.currentScript = null;
        this.hotspots = [];
        this.selectedHotspot = null;
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionRect = null;
        this.selectedColor = 'green'; // Default color
        this.markdownCache = new Map(); // Cache processed markdown
        this.maxCacheSize = 50; // Limit cache to prevent unbounded growth
        
        // Script metadata mapping
        this.scriptData = {
    'effect-usage-analyzer': {
        name: 'Effect Usage Analyzer',
        version: '0.0.4',
        description: 'What effects are being used and where to find them in active project',
        image: 'EffectUsageAnalyzer_0.0.4.png'
    },
    'expression-usage-analyzer': {
        name: 'Expression Usage Analyzer',
        version: '0.0.1',
        description: 'What expressions are being used and where to find them in active project',
        image: 'ExpressionUsageAnalyzer_0.0.1.png'
    },
    'find-replace-expression': {
        name: 'Find and Replace in Expression',
        version: '1.0.0',
        description: 'Find and replace expressions across entire projects',
        image: 'FindAndReplaceInExpression.png'
    },
    'khoa-sharing-toolbar': {
        name: 'Khoa’s Sharing Toolbar',
        version: '1.0.2',
        description: 'Curated collection of Khoa’s useful script snippets',
        image: 'KhoaSharingToolbar_1.0.2.png'
    },
    'sp-comp-edit': {
        name: 'SP Comp Edit',
        version: '1.1.3',
        description: 'Quick add 3D pass into AE comp, and update footage version',
        image: 'SPCompEdit_1.1.3.png'
    },
    'sp-comp-setup': {
        name: 'SP Comp Setup',
        version: '1.0.2',
        description: 'Automate multipass comp setup, with auto-interpretation and custom template supported',
        image: 'SPCompSetup_1.0.2.png'
    },
    'sp-deadline': {
        name: 'SP Deadline',
        version: '1.0.2',
        description: 'Submit AE 2024 job to Deadline render farm',
        image: 'SPDeadline_1.0.2.png'
    },
    'sp-srt-importer': {
        name: 'SP SRT Importer',
        version: '0.2.1',
        description: 'Import and export SRT subtitle to/from markered text layer',
        image: 'SPSRTImporter_0.2.1.png'
    },
    'sp-versioning-csv': {
        name: 'SP Versioning CSV',
        version: '0.1.0',
        description: 'Automate versioning from one master to multiple language versions',
        image: 'SPVersioningCSV_0.1.0.png'
    },
    'sp-versioning-setup-toolkit': {
        name: 'SP Versioning Setup Toolkit',
        version: '0.2.3',
        description: 'Setup master project for CSV versioning workflow',
        image: 'SPVersioningSetupToolkit_0.2.3.png'
    }
        };
        
        this.init();
    }

    init() {
        this.populateScriptDropdown();
        this.setupEventListeners();
        this.updateModeButtons();
        this.setupColorPalette();
    }

    /**
     * Populate script dropdown dynamically from scriptData
     */
    populateScriptDropdown() {
        const selector = document.getElementById('script-selector');

        // Sort scripts alphabetically by name
        const sortedScripts = Object.entries(this.scriptData).sort((a, b) => {
            return a[1].name.localeCompare(b[1].name);
        });

        // Add options for each script
        sortedScripts.forEach(([scriptId, scriptInfo]) => {
            const option = document.createElement('option');
            option.value = scriptId;
            option.textContent = `${scriptInfo.name} v${scriptInfo.version}`;
            selector.appendChild(option);
        });
    }

    /**
     * Get color value based on current theme
     */
    getCurrentColorValue(colorName) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return OVERLAY_DEFAULTS.COLORS[colorName][isDark ? 'dark' : 'light'];
    }

    /**
     * Setup color palette event listeners
     */
    setupColorPalette() {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                colorOptions.forEach(opt => opt.classList.remove('active'));
                // Add active class to clicked option
                option.classList.add('active');
                // Update selected color
                this.selectedColor = option.dataset.color;
                // Update current hotspot if selected
                if (this.selectedHotspot) {
                    this.updateCurrentHotspot();
                }
            });
        });
    }

    setupEventListeners() {
        // Mode toggle
        document.getElementById('create-mode-toggle').addEventListener('change', (e) => {
            this.setMode(e.target.checked ? 'create' : 'select');
        });

        // Canvas interactions
        const canvas = document.getElementById('image-canvas');
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Property inputs
        this.setupPropertyListeners();
    }

    /**
     * Convert intuitive distance parameters to segments
     * Always returns either [H] or [H, V, H]
     */
    convertDistancesToSegments(horizontalDistance, verticalDistance, turningPoint) {
        // If no vertical distance, create a straight line (ignore turning point)
        if (verticalDistance === 0) {
            return [
                {type: 'horizontal', length: horizontalDistance}
            ];
        }

        // When there's vertical distance, always use H-V-H pattern
        // Turn point represents how far to go before turning vertically
        const direction = horizontalDistance >= 0 ? 1 : -1;

        // If turning point equals absolute horizontal distance, means "turn immediately"
        // This keeps tooltip at the edge: [0.1, V, H-0.1] pattern
        // Use 0.1 instead of 0 to avoid being filtered out by simplifyLineSegments
        if (turningPoint === Math.abs(horizontalDistance)) {
            const minSegment = 0.1 * direction;
            return [
                {type: 'horizontal', length: minSegment},
                {type: 'vertical', length: verticalDistance},
                {type: 'horizontal', length: horizontalDistance - minSegment}
            ];
        }

        // Otherwise, turn after going some distance
        const signedTurnPoint = turningPoint * direction;
        const remainingHorizontal = horizontalDistance - signedTurnPoint;

        return [
            {type: 'horizontal', length: signedTurnPoint},
            {type: 'vertical', length: verticalDistance},
            {type: 'horizontal', length: remainingHorizontal}
        ];
    }

    /**
     * Convert segments back to distance parameters for UI display
     */
    convertSegmentsToDistances(segments) {
        const seg1 = segments[0] || {type: 'horizontal', length: 0};
        const seg2 = segments[1] || {type: 'vertical', length: 0};
        const seg3 = segments[2] || {type: 'horizontal', length: 0};

        // Calculate total horizontal distance
        let horizontalDistance = 0;
        if (seg1.type === 'horizontal') horizontalDistance += seg1.length;
        if (seg3.type === 'horizontal') horizontalDistance += seg3.length;

        // Vertical distance is the middle segment
        const verticalDistance = seg2.type === 'vertical' ? seg2.length : 0;

        // Turning point is always returned as positive (absolute value)
        // Direction is inferred from horizontal distance sign
        const turningPoint = (seg1.type === 'horizontal' && segments.length === 3) ? Math.abs(seg1.length) : 0;

        return {
            horizontalDistance,
            verticalDistance,
            turningPoint
        };
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info', duration = 5000) {
        const status = document.getElementById('script-status');
        const content = status.querySelector('.status-content');
        
        content.textContent = message;
        status.className = `status-${type}`;
        status.style.display = 'block';
        
        if (duration > 0) {
            setTimeout(() => {
                status.style.display = 'none';
            }, duration);
        }
    }

    /**
     * Load selected script from dropdown
     */
    async loadSelectedScript() {
        const scriptId = document.getElementById('script-selector').value;

        // Clear cache when switching scripts to prevent memory buildup
        this.clearCache();

        if (!scriptId) {
            // Clear everything when no script selected
            this.currentScript = null;
            this.currentImage = null;
            this.hotspots = [];
            this.selectedHotspot = null;
            document.getElementById('image-canvas').innerHTML = '';
            this.updateHotspotList();
            this.updatePropertiesPanel();
            document.getElementById('script-status').style.display = 'none';
            return;
        }

        this.showStatus(`Loading ${scriptId}...`, 'info', 0);

        this.currentScript = scriptId;
        const scriptInfo = this.scriptData[scriptId];

        // Load the screenshot
        const imagePath = `../images/script-screenshots/${scriptInfo.image}`;
        try {
            await this.loadImageFromPath(imagePath);
            
            // Try to load existing configuration
            const configPath = `../scripts/${scriptId}/config.json`;
            let configLoaded = false;
            try {
                // Add cache-busting parameter like in overlay engine
                const cacheBuster = Date.now();
                const response = await fetch(`${configPath}?v=${cacheBuster}`);
                if (response.ok) {
                    const config = await response.json();
                    console.log('Builder loaded config:', config); // Debug log
                    this.loadConfiguration(config);
                    configLoaded = true;
                    this.showStatus(`✅ Loaded ${scriptInfo.name} with ${config.overlays?.length || 0} existing hotspots`, 'success');
                }
            } catch (error) {
                console.error('Failed to load config in builder:', error);
            }
            
            if (!configLoaded) {
                this.showStatus(`✅ Loaded ${scriptInfo.name} - Ready to create hotspots!`, 'success');
            }
            
        } catch (error) {
            console.error('Failed to load script:', error);
            this.showStatus(`❌ Failed to load script image: ${scriptInfo.image}`, 'error');
        }
    }

    /**
     * Load image from path instead of file upload
     */
    async loadImageFromPath(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = {
                    element: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    path: imagePath
                };
                this.displayImage();
                resolve();
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${imagePath}`));
            };
            img.src = imagePath;
        });
    }

    /**
     * Save configuration - show instructions for direct update
     */
    async saveConfiguration() {
        if (!this.currentScript) {
            alert('Please select a script first');
            return;
        }

        const config = this.generateConfiguration();

        // Show the JSON for copying
        const jsonOutput = document.getElementById('json-output');
        const copyBtn = document.getElementById('copy-btn');

        jsonOutput.textContent = config;
        jsonOutput.style.display = 'block';
        copyBtn.style.display = 'block';

        // Auto-copy to clipboard
        try {
            await navigator.clipboard.writeText(config);
            copyBtn.textContent = 'Copied! ✓';
            copyBtn.style.background = '#4CAF50';
            setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
                copyBtn.style.background = '#667eea';
            }, 3000);
        } catch (error) {
            console.log('Auto-copy failed, user will need to click copy button');
        }
    }

    /**
     * Generate configuration - returns just the overlays array content as a string
     */
    generateConfiguration() {
        // Return formatted string: "overlays": [...]
        return `"overlays": ${JSON.stringify(this.hotspots, null, 2)}`;
    }

    setupPropertyListeners() {
        // Coordinate and numeric inputs - need throttling for performance during continuous adjustments
        const throttledInputs = [
            'hotspot-id', 'hotspot-x', 'hotspot-y', 'hotspot-width', 'hotspot-height',
            'horizontal-distance', 'vertical-distance', 'turning-point'
        ];

        // Description textarea - no throttling needed, only update on blur/change
        const descriptionInput = document.getElementById('description-text');

        // Throttle function to limit update frequency for coordinate inputs
        let updateTimeout;
        const throttledUpdate = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                this.updateCurrentHotspot();
            }, 100); // Update after 100ms of no input (10 updates/second max)
        };

        // Setup throttled inputs (coordinates, numeric fields)
        throttledInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Use throttled update for continuous input
                element.addEventListener('input', throttledUpdate);
                // Immediate update on blur/change
                element.addEventListener('change', this.updateCurrentHotspot.bind(this));
            }
        });

        // Setup description textarea - only update on blur/change for responsive typing
        if (descriptionInput) {
            descriptionInput.addEventListener('blur', this.updateCurrentHotspot.bind(this));
            descriptionInput.addEventListener('change', this.updateCurrentHotspot.bind(this));
        }

        // Special listener for vertical distance to enable/disable turning point
        const verticalDistanceInput = document.getElementById('vertical-distance');
        if (verticalDistanceInput) {
            verticalDistanceInput.addEventListener('input', () => {
                this.updateTurningPointState();
            });
        }
    }

    /**
     * Enable/disable turning point input based on vertical distance
     */
    updateTurningPointState() {
        const verticalDistance = parseFloat(document.getElementById('vertical-distance').value) || 0;
        const turningPointInput = document.getElementById('turning-point');
        const turningPointGroup = turningPointInput.closest('.form-group');

        if (verticalDistance === 0) {
            // Disable turning point when no vertical distance
            turningPointInput.disabled = true;
            turningPointInput.value = 0;
            turningPointGroup.style.opacity = '0.5';
            turningPointGroup.style.pointerEvents = 'none';
        } else {
            // Enable turning point when there's vertical distance
            turningPointInput.disabled = false;
            turningPointGroup.style.opacity = '1';
            turningPointGroup.style.pointerEvents = 'auto';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }

    async loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = {
                    element: img,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    file: file
                };
                this.displayImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    displayImage() {
        const canvas = document.getElementById('image-canvas');
        const uploadArea = document.getElementById('upload-area');
        
        // Clear existing content
        canvas.innerHTML = '';
        
        // Add image
        const img = document.createElement('img');
        img.src = this.currentImage.element.src;
        img.className = 'workspace-image';
        img.draggable = false;
        canvas.appendChild(img);
        
        // Reset hotspots
        this.hotspots = [];
        this.selectedHotspot = null;
        this.updateHotspotList();
        this.updatePropertiesPanel();
    }

    setMode(mode) {
        this.mode = mode;
        this.updateModeButtons();
        this.clearSelection();
    }

    updateModeButtons() {
        document.getElementById('create-mode-toggle').checked = (this.mode === 'create');
    }

    handleMouseDown(e) {
        if (!this.currentImage) return;

        const canvas = document.getElementById('image-canvas');
        const rect = canvas.getBoundingClientRect();
        const img = canvas.querySelector('.workspace-image');
        const imgRect = img.getBoundingClientRect();

        // Check if click is on image
        const x = e.clientX - imgRect.left;
        const y = e.clientY - imgRect.top;

        if (x < 0 || y < 0 || x > img.offsetWidth || y > img.offsetHeight) return;

        if (this.mode === 'create') {
            this.startSelection(x, y);
        }
        // Remove selectHotspotAt call - users now click directly on hotspots/tooltips to select
    }

    handleMouseMove(e) {
        if (!this.isSelecting || this.mode !== 'create') return;

        const canvas = document.getElementById('image-canvas');
        const img = canvas.querySelector('.workspace-image');
        const imgRect = img.getBoundingClientRect();

        const x = e.clientX - imgRect.left;
        const y = e.clientY - imgRect.top;

        this.updateSelection(x, y);
    }

    handleMouseUp(e) {
        if (!this.isSelecting || this.mode !== 'create') return;

        const canvas = document.getElementById('image-canvas');
        const img = canvas.querySelector('.workspace-image');
        const imgRect = img.getBoundingClientRect();

        const x = e.clientX - imgRect.left;
        const y = e.clientY - imgRect.top;

        this.endSelection(x, y);
    }

    startSelection(x, y) {
        this.isSelecting = true;
        this.selectionStart = { x, y };
        
        // Create selection rectangle
        this.selectionRect = document.createElement('div');
        this.selectionRect.className = 'selection-rect';
        document.getElementById('image-canvas').appendChild(this.selectionRect);
        
        this.updateSelection(x, y);
    }

    updateSelection(x, y) {
        if (!this.selectionRect || !this.selectionStart) return;

        const left = Math.min(this.selectionStart.x, x);
        const top = Math.min(this.selectionStart.y, y);
        const width = Math.abs(x - this.selectionStart.x);
        const height = Math.abs(y - this.selectionStart.y);

        this.selectionRect.style.left = `${left}px`;
        this.selectionRect.style.top = `${top}px`;
        this.selectionRect.style.width = `${width}px`;
        this.selectionRect.style.height = `${height}px`;
    }

    endSelection(x, y) {
        if (!this.selectionStart) return;

        const left = Math.min(this.selectionStart.x, x);
        const top = Math.min(this.selectionStart.y, y);
        const width = Math.abs(x - this.selectionStart.x);
        const height = Math.abs(y - this.selectionStart.y);

        // Only create hotspot if selection is large enough
        if (width > 10 && height > 10) {
            this.createHotspot(left, top, width, height);
        }

        this.clearSelection();
    }

    clearSelection() {
        this.isSelecting = false;
        this.selectionStart = null;
        
        if (this.selectionRect) {
            this.selectionRect.remove();
            this.selectionRect = null;
        }
    }

    createHotspot(x, y, width, height) {
        // Convert to image coordinates
        const img = document.querySelector('.workspace-image');
        const scaleX = this.currentImage.width / img.offsetWidth;
        const scaleY = this.currentImage.height / img.offsetHeight;

        const hotspot = {
            id: `hotspot-${this.hotspots.length + 1}`,
            coordinates: {
                x: Math.round(x * scaleX),
                y: Math.round(y * scaleY),
                width: Math.round(width * scaleX),
                height: Math.round(height * scaleY)
            },
            color: this.selectedColor,
            line: {
                segments: [
                    {type: 'horizontal', length: -120}, // left direction with negative horizontal
                    {type: 'vertical', length: 0},
                    {type: 'horizontal', length: 0}
                ],
                thickness: OVERLAY_DEFAULTS.LINE_THICKNESS
            },
            description: {
                content: 'Add description here with **bold** and _italic_ formatting'
            }
        };

        this.hotspots.push(hotspot);
        this.selectedHotspot = hotspot;
        this.updateHotspotList();
        this.updatePropertiesPanel();
        this.renderHotspots();
    }


    updateHotspotList() {
        const list = document.getElementById('hotspot-list');
        const countBadge = document.getElementById('hotspot-count');
        
        // Update counter
        countBadge.textContent = this.hotspots.length;
        
        if (this.hotspots.length === 0) {
            list.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: 6px;">
                    <i data-lucide="target" style="width: 48px; height: 48px; margin-bottom: 0.5rem; opacity: 0.6;"></i>
                    <div>No hotspots created yet</div>
                    <div style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">Switch to "Create Hotspot" mode and click-drag on the image</div>
                </div>
            `;
            return;
        }

        list.innerHTML = '';
        this.hotspots.forEach((hotspot, index) => {
            const item = document.createElement('div');
            item.className = `hotspot-item ${hotspot === this.selectedHotspot ? 'active' : ''}`;
            
            // Get direction icon
            const directionIcons = { 
                left: '<i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>', 
                right: '<i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>', 
                top: '<i data-lucide="arrow-up" style="width: 14px; height: 14px;"></i>', 
                bottom: '<i data-lucide="arrow-down" style="width: 14px; height: 14px;"></i>' 
            };
            const directionIcon = directionIcons[hotspot.line.direction] || '<i data-lucide="link" style="width: 14px; height: 14px;"></i>';
            
            item.innerHTML = `
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <strong style="color: var(--text-primary);">${hotspot.id}</strong>
                        <span style="font-size: 0.9rem;">${directionIcon}</span>
                        <div style="width: 12px; height: 12px; background: ${this.getCurrentColorValue(hotspot.color)}; border-radius: 2px; border: 1px solid var(--border-color);"></div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-danger btn-small" onclick="builder.deleteHotspot(${index})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                    </button>
                </div>
            `;
            
            // Remove click handler - users now click directly on hotspots/tooltips to select
            list.appendChild(item);
        });
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('hotspot-properties');

        if (!this.selectedHotspot) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';

        // Update form fields
        document.getElementById('hotspot-id').value = this.selectedHotspot.id;
        document.getElementById('hotspot-x').value = this.selectedHotspot.coordinates.x;
        document.getElementById('hotspot-y').value = this.selectedHotspot.coordinates.y;
        document.getElementById('hotspot-width').value = this.selectedHotspot.coordinates.width;
        document.getElementById('hotspot-height').value = this.selectedHotspot.coordinates.height;
        // Update distance-based line configuration
        const distances = this.convertSegmentsToDistances(this.selectedHotspot.line.segments);
        document.getElementById('horizontal-distance').value = distances.horizontalDistance;
        document.getElementById('vertical-distance').value = distances.verticalDistance;
        document.getElementById('turning-point').value = distances.turningPoint;
        document.getElementById('description-text').value = this.selectedHotspot.description.content;

        // Update color palette selection
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => opt.classList.remove('active'));
        const activeColor = document.querySelector(`[data-color="${this.selectedHotspot.color}"]`);
        if (activeColor) {
            activeColor.classList.add('active');
            this.selectedColor = this.selectedHotspot.color;
        }

        // Update turning point state based on vertical distance
        this.updateTurningPointState();
    }

    updateCurrentHotspot() {
        if (!this.selectedHotspot) return;

        // Update properties from form
        this.selectedHotspot.id = document.getElementById('hotspot-id').value;
        this.selectedHotspot.coordinates.x = parseInt(document.getElementById('hotspot-x').value) || 0;
        this.selectedHotspot.coordinates.y = parseInt(document.getElementById('hotspot-y').value) || 0;
        this.selectedHotspot.coordinates.width = parseInt(document.getElementById('hotspot-width').value) || 1;
        this.selectedHotspot.coordinates.height = parseInt(document.getElementById('hotspot-height').value) || 1;
        this.selectedHotspot.color = this.selectedColor;

        // Update line configuration using distance-based system
        // Use ?? instead of || to allow 0 values
        const horizontalDistanceValue = document.getElementById('horizontal-distance').value;
        const verticalDistanceValue = document.getElementById('vertical-distance').value;
        const turningPointValue = document.getElementById('turning-point').value;

        const horizontalDistance = horizontalDistanceValue !== '' ? parseInt(horizontalDistanceValue) : 120;
        const verticalDistance = verticalDistanceValue !== '' ? parseInt(verticalDistanceValue) : 0;
        let turningPoint = turningPointValue !== '' ? parseInt(turningPointValue) : 0;

        // Smart default: when vertical distance is non-zero and turning point is 0,
        // set turning point to half of horizontal distance for balanced path
        if (verticalDistance !== 0 && turningPoint === 0) {
            turningPoint = Math.abs(Math.round(horizontalDistance / 2));
            // Update the UI to reflect this
            document.getElementById('turning-point').value = turningPoint;
        }

        // Convert distances to segments
        const segments = this.convertDistancesToSegments(horizontalDistance, verticalDistance, turningPoint);

        this.selectedHotspot.line = {
            segments: segments,
            thickness: OVERLAY_DEFAULTS.LINE_THICKNESS
        };
        this.selectedHotspot.description.content = document.getElementById('description-text').value;

        this.updateHotspotList();

        // Selective re-render: only update the selected hotspot instead of all
        this.renderSingleHotspot(this.selectedHotspot);

        // Show live feedback
        this.showStatus(`Updated "${this.selectedHotspot.id}" properties`, 'success', 2000);
    }

    /**
     * Selective re-render: only update the selected hotspot
     * Much faster than full re-render for continuous adjustments
     */
    renderSingleHotspot(hotspot) {
        if (!this.currentImage || !hotspot) return;

        const canvas = document.getElementById('image-canvas');
        const img = canvas.querySelector('.workspace-image');
        if (!img) return;

        // Remove only this hotspot's preview elements
        const hotspotId = hotspot.id;
        const existingElements = canvas.querySelectorAll(`[data-hotspot-id="${hotspotId}"]`);
        existingElements.forEach(el => {
            if (el.innerHTML) el.innerHTML = '';
            if (el.parentNode) el.parentNode.removeChild(el);
        });

        // Calculate scale
        const scaleX = img.offsetWidth / this.currentImage.width;
        const scaleY = img.offsetHeight / this.currentImage.height;

        // Render just this hotspot
        this.renderFullHotspotPreview(hotspot, scaleX, scaleY, canvas);
    }

    renderHotspots() {
        if (!this.currentImage) return;

        // Clean up existing overlays with proper memory management
        this.cleanupPreviousRender();

        const canvas = document.getElementById('image-canvas');

        const img = canvas.querySelector('.workspace-image');
        if (!img) return;

        // Calculate scale
        const scaleX = img.offsetWidth / this.currentImage.width;
        const scaleY = img.offsetHeight / this.currentImage.height;

        // Render each hotspot with full preview
        this.hotspots.forEach((hotspot, index) => {
            this.renderFullHotspotPreview(hotspot, scaleX, scaleY, canvas);
        });
    }

    /**
     * Render complete preview including hotspot, highlight, line, and tooltip
     */
    renderFullHotspotPreview(hotspot, scaleX, scaleY, canvas) {
        // Create hotspot container
        const hotspotContainer = document.createElement('div');
        hotspotContainer.className = 'preview-element hotspot-preview';
        hotspotContainer.setAttribute('data-hotspot-id', hotspot.id); // For selective removal
        hotspotContainer.style.position = 'absolute';
        hotspotContainer.style.left = `${hotspot.coordinates.x * scaleX}px`;
        hotspotContainer.style.top = `${hotspot.coordinates.y * scaleY}px`;
        hotspotContainer.style.width = `${hotspot.coordinates.width * scaleX}px`;
        hotspotContainer.style.height = `${hotspot.coordinates.height * scaleY}px`;
        hotspotContainer.style.zIndex = '10';
        hotspotContainer.style.cursor = 'pointer';
        
        // Add click handler to select this hotspot
        hotspotContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedHotspot = hotspot;
            this.updateHotspotList();
            this.updatePropertiesPanel();
            this.updateSelectionVisuals();
        });
        
        // Add selection border if this is the selected hotspot
        if (hotspot === this.selectedHotspot) {
            hotspotContainer.style.border = '2px dashed rgba(102, 126, 234, 0.8)';
            hotspotContainer.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        }

        // Create highlight
        if (hotspot.color) {
            const highlight = document.createElement('div');
            highlight.className = 'preview-element highlight-preview';
            highlight.setAttribute('data-hotspot-id', hotspot.id); // For selective removal
            highlight.style.position = 'absolute';
            highlight.style.left = `${hotspot.coordinates.x * scaleX}px`;
            highlight.style.top = `${hotspot.coordinates.y * scaleY}px`;
            highlight.style.width = `${hotspot.coordinates.width * scaleX}px`;
            highlight.style.height = `${hotspot.coordinates.height * scaleY}px`;

            const colorValue = this.getCurrentColorValue(hotspot.color);
            highlight.style.border = `2px solid ${colorValue}`;
            highlight.style.borderRadius = `${OVERLAY_DEFAULTS.BORDER_RADIUS}px`;
            highlight.style.backgroundColor = this.hexToRgba(colorValue, 0.1);
            highlight.style.pointerEvents = 'none';
            highlight.style.zIndex = '5';
            canvas.appendChild(highlight);
        }

        // Create line (append to hotspot container like real engine)
        if (hotspot.line) {
            const line = this.createPreviewLine(hotspot, scaleX, scaleY, hotspotContainer);
            hotspotContainer.appendChild(line);
        }

        // Create tooltip
        if (hotspot.description) {
            const tooltip = this.createPreviewTooltip(hotspot, scaleX, scaleY);
            tooltip.setAttribute('data-hotspot-id', hotspot.id); // For selective removal
            // Add click handler to tooltip as well
            tooltip.style.cursor = 'pointer';
            tooltip.style.pointerEvents = 'auto';
            tooltip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedHotspot = hotspot;
                this.updateHotspotList();
                this.updatePropertiesPanel();
                this.updateSelectionVisuals();
            });
            canvas.appendChild(tooltip);
        }

        canvas.appendChild(hotspotContainer);
    }

    /**
     * Update selection visuals without full re-render
     * Only updates borders/highlights for performance
     */
    updateSelectionVisuals() {
        const canvas = document.getElementById('image-canvas');
        const allHotspotContainers = canvas.querySelectorAll('.hotspot-preview');

        allHotspotContainers.forEach(container => {
            const hotspotId = container.getAttribute('data-hotspot-id');
            const isSelected = this.selectedHotspot && this.selectedHotspot.id === hotspotId;

            if (isSelected) {
                container.style.border = '2px dashed rgba(102, 126, 234, 0.8)';
                container.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            } else {
                container.style.border = 'none';
                container.style.backgroundColor = 'transparent';
            }
        });
    }

    /**
     * Create preview line - shows complex multi-segment path like "Show All" mode
     */
    createPreviewLine(hotspot, scaleX, scaleY, hotspotContainer) {
        const lineColor = this.getCurrentColorValue(hotspot.color);
        const thickness = OVERLAY_DEFAULTS.LINE_THICKNESS;

        // Show full multi-segment path like "Show All Overlays" mode
        // This helps visualize the designed connector paths during configuration
        return this.createPreviewSegmentedLine(hotspot, scaleX, scaleY, lineColor, thickness);
    }

    /**
     * Create simple horizontal line preview
     */
    createPreviewSimpleLine(hotspot, scaleX, scaleY, lineColor, thickness) {
        const container = document.createElement('div');
        container.className = 'preview-element overlay-line-container';
        container.style.position = 'absolute';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '15';

        // Calculate total horizontal distance from segments
        const segments = hotspot.line.segments;
        let totalHorizontal = 0;
        segments.forEach(seg => {
            if (seg.type === 'horizontal') {
                totalHorizontal += seg.length;
            }
        });

        const scale = Math.min(scaleX, scaleY);
        const scaledHorizontal = totalHorizontal * scale;

        // Position based on horizontal direction
        if (totalHorizontal >= 0) {
            // Going right - start from right edge
            container.style.left = '100%';
            container.style.top = '50%';
            container.style.transform = 'translateY(-50%)';
        } else {
            // Going left - start from left edge
            container.style.left = '0%';
            container.style.top = '50%';
            container.style.transform = 'translateY(-50%)';
        }

        // Create single horizontal segment
        const segmentEl = document.createElement('div');
        segmentEl.className = 'preview-element line-segment segment-0';
        segmentEl.style.position = 'absolute';
        segmentEl.style.backgroundColor = lineColor;
        segmentEl.style.opacity = '1';
        segmentEl.style.zIndex = '30';

        const width = Math.abs(scaledHorizontal);
        segmentEl.style.width = `${width}px`;
        segmentEl.style.height = `${thickness}px`;

        if (scaledHorizontal >= 0) {
            segmentEl.style.left = '0px';
        } else {
            segmentEl.style.left = `${-width}px`;
        }
        segmentEl.style.top = `${-thickness/2}px`;

        container.appendChild(segmentEl);
        return container;
    }

    /**
     * Convert legacy single-direction line format to multi-segment format
     */
    convertLegacyLineToSegments(legacyLine) {
        const direction = legacyLine.direction;
        const length = legacyLine.length;

        let segment1Type, segment1Length;

        switch (direction) {
            case 'left':
                segment1Type = 'horizontal';
                segment1Length = -length;
                break;
            case 'right':
                segment1Type = 'horizontal';
                segment1Length = length;
                break;
            case 'top':
                segment1Type = 'vertical';
                segment1Length = -length;
                break;
            case 'bottom':
                segment1Type = 'vertical';
                segment1Length = length;
                break;
            default:
                segment1Type = 'horizontal';
                segment1Length = length;
        }

        return {
            segments: [
                {type: segment1Type, length: segment1Length},
                {type: segment1Type === 'horizontal' ? 'vertical' : 'horizontal', length: 0},
                {type: segment1Type, length: 0}
            ],
            thickness: OVERLAY_DEFAULTS.LINE_THICKNESS
        };
    }

    /**
     * Validate segment pattern matches required format
     * Only [H] or [H, V, H] allowed
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
        return false;
    }

    /**
     * Create preview for multi-segment line (H-V-H system)
     */
    createPreviewSegmentedLine(hotspot, scaleX, scaleY, lineColor, thickness) {
        const container = document.createElement('div');
        container.className = 'preview-element overlay-line-container';
        container.style.position = 'absolute';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '15';
        container.style.opacity = '1'; // Always visible in preview

        const segments = hotspot.line.segments;

        // Validate pattern
        if (!this.isValidSegmentPattern(segments)) {
            console.warn('Invalid segment pattern in preview. Expected [H] or [H,V,H]. Got:', segments);
            // Show error in preview
            container.style.border = '2px solid red';
            container.style.padding = '4px';
            container.innerHTML = '<span style="color: red; font-size: 10px;">Invalid pattern</span>';
            return container;
        }

        const scale = Math.min(scaleX, scaleY);
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
        let currentX = 0;
        let currentY = 0;

        segments.forEach((segment, index) => {
            const segmentEl = document.createElement('div');
            segmentEl.className = `preview-element line-segment segment-${index}`;
            segmentEl.style.position = 'absolute';
            segmentEl.style.backgroundColor = lineColor;
            segmentEl.style.opacity = '1';
            segmentEl.style.zIndex = '30';

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

        return container;
    }

    /**
     * Create preview tooltip - positioned at end of multi-segment line
     */
    createPreviewTooltip(hotspot, scaleX, scaleY) {
        const tooltip = document.createElement('div');
        tooltip.className = 'preview-element tooltip-preview description-tooltip';
        tooltip.innerHTML = this.processMarkdown(hotspot.description.content);

        // Only set positioning styles, inherit everything else from CSS
        tooltip.style.position = 'absolute';
        tooltip.style.opacity = '1'; // Always visible in preview
        tooltip.style.zIndex = '25';

        const offset = 15; // Same offset as real engine

        // Position at end of multi-segment line (like "Show All" mode)
        this.positionTooltipForSegmentedLinePreview(tooltip, hotspot, scaleX, scaleY, offset);

        return tooltip;
    }

    /**
     * Position tooltip at end of simple horizontal line
     */
    positionTooltipForSimpleLine(tooltip, hotspot, scaleX, scaleY) {
        const segments = hotspot.line.segments;
        let totalHorizontal = 0;
        segments.forEach(seg => {
            if (seg.type === 'horizontal') {
                totalHorizontal += seg.length;
            }
        });

        const scale = Math.min(scaleX, scaleY);
        const scaledHorizontal = totalHorizontal * scale;

        const hotspotLeft = hotspot.coordinates.x * scaleX;
        const hotspotTop = hotspot.coordinates.y * scaleY;
        const hotspotWidth = hotspot.coordinates.width * scaleX;
        const hotspotHeight = hotspot.coordinates.height * scaleY;

        const offset = 15;

        if (totalHorizontal >= 0) {
            // Going right
            const endX = hotspotLeft + hotspotWidth + scaledHorizontal + offset;
            const endY = hotspotTop + hotspotHeight / 2;
            tooltip.style.left = `${endX}px`;
            tooltip.style.top = `${endY}px`;
            tooltip.style.transform = 'translateY(-50%)';
        } else {
            // Going left
            const endX = hotspotLeft + scaledHorizontal - offset;
            const endY = hotspotTop + hotspotHeight / 2;
            tooltip.style.right = `calc(100% - ${endX}px)`;
            tooltip.style.top = `${endY}px`;
            tooltip.style.transform = 'translateY(-50%)';
        }
    }


    /**
     * Position tooltip for segmented line preview - matches main engine positioning
     */
    positionTooltipForSegmentedLinePreview(tooltip, hotspot, scaleX, scaleY, offset) {
        const segments = hotspot.line.segments;
        const scale = Math.min(scaleX, scaleY);
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        // Calculate starting position based on hotspot edge
        let startX, startY;
        const hotspotLeft = hotspot.coordinates.x * scaleX;
        const hotspotTop = hotspot.coordinates.y * scaleY;
        const hotspotWidth = hotspot.coordinates.width * scaleX;
        const hotspotHeight = hotspot.coordinates.height * scaleY;

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
    }

    /**
     * Convert hex to rgba
     */
    hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(52, 152, 219, ${alpha})`;
        
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Process markdown for tooltip preview using Marked.js
     */
    processMarkdown(text) {
        // Check cache first for performance
        if (this.markdownCache.has(text)) {
            return this.markdownCache.get(text);
        }

        // Limit cache size to prevent memory leaks
        if (this.markdownCache.size >= this.maxCacheSize) {
            // Remove oldest entry (first entry in Map)
            const firstKey = this.markdownCache.keys().next().value;
            this.markdownCache.delete(firstKey);
        }

        if (typeof marked === 'undefined') {
            console.warn('Marked.js not loaded, falling back to plain text');
            const fallback = `<p>${text}</p>`;
            this.markdownCache.set(text, fallback);
            return fallback;
        }

        // Configure marked for consistent rendering
        marked.setOptions({
            gfm: true,          // GitHub Flavored Markdown
            breaks: false,      // Don't convert \n to <br>
            sanitize: false,    // We trust our content
            smartypants: false  // Don't convert quotes to smart quotes
        });

        const result = marked.parse(text);
        this.markdownCache.set(text, result);
        return result;
    }

    deleteHotspot(index) {
        const hotspot = this.hotspots[index];
        if (!hotspot) return;

        // Confirm deletion
        const confirmed = confirm(`Delete hotspot "${hotspot.id}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        this.hotspots.splice(index, 1);
        if (this.selectedHotspot === hotspot) {
            this.selectedHotspot = null;
        }
        this.updateHotspotList();
        this.updatePropertiesPanel();
        this.renderHotspots();
        this.showStatus(`Deleted hotspot "${hotspot.id}"`, 'success', 3000);
    }

    deleteCurrentHotspot() {
        if (!this.selectedHotspot) return;

        const index = this.hotspots.indexOf(this.selectedHotspot);
        if (index !== -1) {
            this.deleteHotspot(index);
        }
    }

    exportConfiguration() {
        const scriptName = document.getElementById('script-name').value || 'Untitled Script';
        const version = document.getElementById('script-version').value || '1.0.0';
        const description = document.getElementById('script-description').value || 'Script description';

        const config = {
            scriptName: scriptName,
            version: version,
            description: description,
            baseImage: {
                src: this.currentImage ? `path/to/${this.currentImage.file.name}` : 'screenshot.png',
                width: this.currentImage ? this.currentImage.width : 800,
                height: this.currentImage ? this.currentImage.height : 600
            },
            overlays: this.hotspots
        };

        const jsonOutput = document.getElementById('json-output');
        const copyBtn = document.getElementById('copy-btn');
        
        jsonOutput.textContent = JSON.stringify(config, null, 2);
        jsonOutput.style.display = 'block';
        copyBtn.style.display = 'block';

        // Also trigger download
        this.downloadJSON(config, `${scriptName.replace(/\s+/g, '-').toLowerCase()}-config.json`);
    }

    downloadJSON(config, filename) {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importConfiguration() {
        document.getElementById('import-input').click();
    }

    handleImportFile(e) {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.json')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.loadConfiguration(config);
            } catch (error) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }

    loadConfiguration(config) {
        // Load hotspots
        this.hotspots = config.overlays || [];
        this.selectedHotspot = null;
        
        this.updateHotspotList();
        this.updatePropertiesPanel();
        this.renderHotspots();
    }

    /**
     * Clean up memory from previous render - remove elements and event listeners
     */
    cleanupPreviousRender() {
        const canvas = document.getElementById('image-canvas');
        const existingOverlays = canvas.querySelectorAll('.preview-element');

        // Properly remove all preview elements with their children and event listeners
        existingOverlays.forEach(overlay => {
            // Remove all child nodes to break circular references
            while (overlay.firstChild) {
                overlay.removeChild(overlay.firstChild);
            }
            // Clone node without event listeners (cleaner approach)
            const clone = overlay.cloneNode(false);
            // Remove the original element
            if (overlay.parentNode) {
                overlay.parentNode.replaceChild(clone, overlay);
                clone.parentNode.removeChild(clone);
            }
        });

        // Force garbage collection hint (browser decides if/when to run)
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Clear cache when switching scripts to prevent memory buildup
     */
    clearCache() {
        this.markdownCache.clear();
        console.log('Cache cleared');
    }

}

// Initialize the builder
let builder;

document.addEventListener('DOMContentLoaded', function() {
    builder = new ConfigurationBuilder();
});

// Global functions for button clicks
function loadSelectedScript() {
    builder.loadSelectedScript();
}

function deleteCurrentHotspot() {
    builder.deleteCurrentHotspot();
}

function saveConfiguration() {
    builder.saveConfiguration();
}

function exportConfiguration() {
    builder.exportConfiguration();
}


function copyToClipboard() {
    const jsonOutput = document.getElementById('json-output');
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

