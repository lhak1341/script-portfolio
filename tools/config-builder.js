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
        version: '0.1.6',
        description: 'Quick add 3D pass into AE comp, and update footage version',
        image: 'SPCompEdit_0.1.6.png'
    },
    'sp-comp-setup': {
        name: 'SP Comp Setup',
        version: '0.8.2',
        description: 'Automate multipass comp setup, with auto-interpretation and custom template supported',
        image: 'SPCompSetup_0.8.2.png'
    },
    'sp-deadline': {
        name: 'SP Deadline',
        version: '1.0.1',
        description: 'Submit AE 2024 job to Deadline render farm',
        image: 'SPDeadline_1.0.1.png'
    },
    'sp-srt-importer': {
        name: 'SP SRT Importer',
        version: '0.2.0',
        description: 'Import and export SRT subtitle to/from markered text layer',
        image: 'SPSRTImporter_0.2.0.png'
    },
    'sp-versioning-csv': {
        name: 'SP Versioning CSV',
        version: '0.1.0',
        description: 'Automate versioning from one master to multiple language versions',
        image: 'SPVersioningCSV_0.1.0.png'
    },
    'sp-versioning-setup-toolkit': {
        name: 'SP Versioning Setup Toolkit',
        version: '0.2.2',
        description: 'Setup master project for CSV versioning workflow',
        image: 'SPVersioningSetupToolkit_0.2.2.png'
    }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateModeButtons();
        this.setupColorPalette();
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
        
        jsonOutput.textContent = JSON.stringify(config, null, 2);
        jsonOutput.style.display = 'block';
        copyBtn.style.display = 'block';

        // Show clear instructions
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            background: #e3f2fd;
            border: 1px solid #2196F3;
            border-radius: 6px;
            padding: 1rem;
            margin: 1rem 0;
            font-size: 0.9rem;
            line-height: 1.5;
        `;
        instructions.innerHTML = `
            <strong><i data-lucide="clipboard-list" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i>Next Steps:</strong><br>
            1. Click "Copy to Clipboard" below<br>
            2. Open: <code>scripts/${this.currentScript}/config.json</code><br>
            3. Replace the <code>"overlays": [...]</code> section with the copied content<br>
            4. Save the file<br>
            5. Refresh your script page to see changes
        `;

        // Insert instructions before JSON output
        jsonOutput.parentNode.insertBefore(instructions, jsonOutput);

        // Auto-copy to clipboard
        try {
            await navigator.clipboard.writeText(jsonOutput.textContent);
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
     * Generate configuration object - now returns only overlays array
     */
    generateConfiguration() {        
        return {
            "overlays": this.hotspots
        };
    }

    setupPropertyListeners() {
        const inputs = [
            'hotspot-id', 'hotspot-x', 'hotspot-y', 'hotspot-width', 'hotspot-height', 
            'line-direction', 'line-length', 'description-text'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', this.updateCurrentHotspot.bind(this));
                element.addEventListener('change', this.updateCurrentHotspot.bind(this));
            }
        });
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
            style: {
                color: this.selectedColor
            },
            line: {
                direction: 'left',
                length: 120,
                color: this.selectedColor
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
                        <div style="width: 12px; height: 12px; background: ${this.getCurrentColorValue(hotspot.style.color)}; border-radius: 2px; border: 1px solid var(--border-color);"></div>
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
        document.getElementById('line-direction').value = this.selectedHotspot.line.direction;
        document.getElementById('line-length').value = this.selectedHotspot.line.length;
        document.getElementById('description-text').value = this.selectedHotspot.description.content;

        // Update color palette selection
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(opt => opt.classList.remove('active'));
        const activeColor = document.querySelector(`[data-color="${this.selectedHotspot.style.color}"]`);
        if (activeColor) {
            activeColor.classList.add('active');
            this.selectedColor = this.selectedHotspot.style.color;
        }
    }

    updateCurrentHotspot() {
        if (!this.selectedHotspot) return;

        // Update properties from form
        this.selectedHotspot.id = document.getElementById('hotspot-id').value;
        this.selectedHotspot.coordinates.x = parseInt(document.getElementById('hotspot-x').value) || 0;
        this.selectedHotspot.coordinates.y = parseInt(document.getElementById('hotspot-y').value) || 0;
        this.selectedHotspot.coordinates.width = parseInt(document.getElementById('hotspot-width').value) || 1;
        this.selectedHotspot.coordinates.height = parseInt(document.getElementById('hotspot-height').value) || 1;
        this.selectedHotspot.style.color = this.selectedColor;
        this.selectedHotspot.line.direction = document.getElementById('line-direction').value;
        this.selectedHotspot.line.length = parseInt(document.getElementById('line-length').value);
        this.selectedHotspot.line.color = this.selectedColor;
        this.selectedHotspot.description.content = document.getElementById('description-text').value;

        this.updateHotspotList();
        this.renderHotspots();
        
        // Show live feedback
        this.showStatus(`Updated "${this.selectedHotspot.id}" properties`, 'success', 2000);
    }

    renderHotspots() {
        if (!this.currentImage) return;

        // Remove existing overlays
        const canvas = document.getElementById('image-canvas');
        const existingOverlays = canvas.querySelectorAll('.preview-element');
        existingOverlays.forEach(overlay => overlay.remove());

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
            this.renderHotspots();
        });
        
        // Add selection border if this is the selected hotspot
        if (hotspot === this.selectedHotspot) {
            hotspotContainer.style.border = '2px dashed rgba(102, 126, 234, 0.8)';
            hotspotContainer.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        }

        // Create highlight
        if (hotspot.style) {
            const highlight = document.createElement('div');
            highlight.className = 'preview-element highlight-preview';
            highlight.style.position = 'absolute';
            highlight.style.left = `${hotspot.coordinates.x * scaleX}px`;
            highlight.style.top = `${hotspot.coordinates.y * scaleY}px`;
            highlight.style.width = `${hotspot.coordinates.width * scaleX}px`;
            highlight.style.height = `${hotspot.coordinates.height * scaleY}px`;
            
            const colorValue = this.getCurrentColorValue(hotspot.style.color);
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
            // Add click handler to tooltip as well
            tooltip.style.cursor = 'pointer';
            tooltip.style.pointerEvents = 'auto';
            tooltip.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedHotspot = hotspot;
                this.updateHotspotList();
                this.updatePropertiesPanel();
                this.renderHotspots();
            });
            canvas.appendChild(tooltip);
        }

        canvas.appendChild(hotspotContainer);
    }

    /**
     * Create preview line - matches real overlay engine structure exactly
     */
    createPreviewLine(hotspot, scaleX, scaleY, hotspotContainer) {
        // Create line element positioned relative to hotspot (like real engine)
        const line = document.createElement('div');
        line.className = `preview-element overlay-line line-${hotspot.line.direction}`;
        line.style.position = 'absolute';
        line.style.pointerEvents = 'none';
        line.style.zIndex = '15';

        // Scale the line dimensions like the real engine
        const scaledLength = hotspot.line.length * Math.min(scaleX, scaleY);
        const thickness = OVERLAY_DEFAULTS.LINE_THICKNESS;
        
        // Set CSS custom properties like real engine
        line.style.setProperty('--line-length', `${scaledLength}px`);
        line.style.setProperty('--line-thickness', `${thickness}px`);
        
        const lineColor = this.getCurrentColorValue(hotspot.line.color);
        line.style.setProperty('--line-color', lineColor);

        // Position line at hotspot edge like real engine (relative positioning)
        switch (hotspot.line.direction) {
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

        // Create the visual line using ::before pseudo-element styles directly
        const pseudoElement = document.createElement('div');
        pseudoElement.style.position = 'absolute';
        pseudoElement.style.backgroundColor = lineColor;
        pseudoElement.style.content = '';
        
        switch (hotspot.line.direction) {
            case 'left':
                pseudoElement.style.width = `${scaledLength}px`;
                pseudoElement.style.height = `${thickness}px`;
                pseudoElement.style.top = '50%';
                pseudoElement.style.right = '100%';
                pseudoElement.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                pseudoElement.style.width = `${scaledLength}px`;
                pseudoElement.style.height = `${thickness}px`;
                pseudoElement.style.top = '50%';
                pseudoElement.style.left = '100%';
                pseudoElement.style.transform = 'translateY(-50%)';
                break;
            case 'top':
                pseudoElement.style.width = `${thickness}px`;
                pseudoElement.style.height = `${scaledLength}px`;
                pseudoElement.style.bottom = '100%';
                pseudoElement.style.left = '50%';
                pseudoElement.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                pseudoElement.style.width = `${thickness}px`;
                pseudoElement.style.height = `${scaledLength}px`;
                pseudoElement.style.top = '100%';
                pseudoElement.style.left = '50%';
                pseudoElement.style.transform = 'translateX(-50%)';
                break;
        }

        line.appendChild(pseudoElement);
        return line;
    }

    /**
     * Create preview tooltip
     */
    createPreviewTooltip(hotspot, scaleX, scaleY) {
        const tooltip = document.createElement('div');
        tooltip.className = 'preview-element tooltip-preview';
        tooltip.innerHTML = this.processMarkdown(hotspot.description.content);
        
        // Apply tooltip styling to match script page
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 10px 14px;
            border-radius: 6px;
            font-family: var(--font-sans);
            font-size: 13px;
            font-weight: 400;
            line-height: 1.4;
            letter-spacing: -0.0125em;
            max-width: 280px;
            min-width: 180px;
            box-shadow: var(--card-shadow);
            z-index: 25;
            pointer-events: none;
            word-wrap: break-word;
            white-space: normal;
        `;

        // Use EXACT same calculation as real overlay engine
        const hotspotCenterX = (hotspot.coordinates.x + hotspot.coordinates.width / 2) * scaleX;
        const hotspotCenterY = (hotspot.coordinates.y + hotspot.coordinates.height / 2) * scaleY;
        const length = hotspot.line.length * Math.min(scaleX, scaleY); // Same scaling as real engine
        const offset = 15; // Same offset as real engine

        switch (hotspot.line.direction) {
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

        return tooltip;
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
     * Process markdown for tooltip preview
     */
    processMarkdown(text) {
        // Check if dark mode
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const boldColor = isDark ? '#fb923c' : 'var(--text-primary)';
        const italicColor = isDark ? '#22d3ee' : 'var(--text-secondary)';
        const italicOpacity = isDark ? '1' : '0.9';
        
        // Code styling
        const codeBackground = isDark ? '#2d2d2d' : 'var(--bg-tertiary)';
        const codeColor = isDark ? '#e5e5e5' : 'var(--text-primary)';
        const codeBorder = isDark ? '#404040' : 'var(--border-color)';
        
        return text
            .replace(/`(.*?)`/g, `<code style="font-family: var(--font-mono); font-size: 0.9em; padding: 0.15em 0.4em; border-radius: 3px; background: ${codeBackground}; color: ${codeColor}; border: 1px solid ${codeBorder};">$1</code>`)
            .replace(/\*\*(.*?)\*\*/g, `<strong style="font-weight: 700; color: ${boldColor};">$1</strong>`)
            .replace(/__(.*?)__/g, `<strong style="font-weight: 700; color: ${boldColor};">$1</strong>`)
            .replace(/\*(.*?)\*/g, `<em style="font-style: italic; color: ${italicColor}; opacity: ${italicOpacity};">$1</em>`)
            .replace(/_(.*?)_/g, `<em style="font-style: italic; color: ${italicColor}; opacity: ${italicOpacity};">$1</em>`);
    }

    deleteHotspot(index) {
        this.hotspots.splice(index, 1);
        if (this.selectedHotspot === this.hotspots[index]) {
            this.selectedHotspot = null;
        }
        this.updateHotspotList();
        this.updatePropertiesPanel();
        this.renderHotspots();
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