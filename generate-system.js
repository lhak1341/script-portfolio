#!/usr/bin/env node

/**
 * System Generator for After Effects Scripts Portfolio
 * 
 * This script:
 * 1. Scans the config-builder hardcoded script data
 * 2. Creates missing config.json files for all scripts
 * 3. Generates placeholder index.html files for all scripts
 * 4. Updates scripts-list.json dynamically from config files
 */

const fs = require('fs');
const path = require('path');

// Hardcoded script data from config-builder.js
const SCRIPT_DATA = {
    'sp-comp-setup': {
        name: 'SP Comp Setup',
        version: '0.8.2',
        description: 'Streamlined composition setup with auto-interpretation and template management',
        category: 'utility',
        tags: ['composition', 'setup', 'automation', 'template'],
        image: 'SPCompSetup_0.8.2.png',
        pinned: true
    },
    'sp-comp-edit': {
        name: 'SP Comp Edit',
        version: '0.1.6',
        description: 'Advanced composition editing tools with batch operations and property management',
        category: 'workflow',
        tags: ['editing', 'batch', 'properties', 'workflow'],
        image: 'SPCompEdit_0.1.6.png',
        pinned: false
    },
    'sp-versioning-setup-toolkit': {
        name: 'SP Versioning Setup Toolkit',
        version: '0.2.2',
        description: 'Complete project versioning system with automated backup and restoration',
        category: 'workflow',
        tags: ['versioning', 'backup', 'project', 'management'],
        image: 'SPVersioningSetupToolkit_0.2.2.png',
        pinned: false
    },
    'sp-versioning-csv': {
        name: 'SP Versioning CSV',
        version: '0.1.0',
        description: 'CSV-based version tracking and export system for project management',
        category: 'utility',
        tags: ['csv', 'export', 'tracking', 'data'],
        image: 'SPVersioningCSV_0.1.0.png',
        pinned: false
    },
    'sp-srt-importer': {
        name: 'SP SRT Importer',
        version: '0.2.0',
        description: 'Automated SRT subtitle file import with timing and formatting options',
        category: 'automation',
        tags: ['subtitle', 'import', 'srt', 'timing'],
        image: 'SPSRTImporter_0.2.0.png',
        pinned: true
    },
    'sp-deadline': {
        name: 'SP Deadline',
        version: '1.0.1',
        description: 'Deadline render farm integration with job submission and monitoring',
        category: 'automation',
        tags: ['deadline', 'render', 'farm', 'submission'],
        image: 'SPDeadline_1.0.1.png',
        pinned: false
    },
    'effect-usage-analyzer': {
        name: 'Effect Usage Analyzer',
        version: '0.0.4',
        description: 'Comprehensive analysis tool for tracking effect usage across projects',
        category: 'utility',
        tags: ['analysis', 'effects', 'tracking', 'optimization'],
        image: 'EffectUsageAnalyzer_0.0.4.png',
        pinned: false
    },
    'expression-usage-analyzer': {
        name: 'Expression Usage Analyzer',
        version: '0.0.1',
        description: 'Advanced expression analysis and optimization tool for After Effects projects',
        category: 'utility',
        tags: ['expressions', 'analysis', 'optimization', 'debugging'],
        image: 'ExpressionUsageAnalyzer_0.0.1.png',
        pinned: false
    },
    'find-replace-expression': {
        name: 'Find and Replace in Expression',
        version: '1.0.0',
        description: 'Powerful search and replace functionality for expressions across entire projects',
        category: 'utility',
        tags: ['find', 'replace', 'expressions', 'batch'],
        image: 'FindAndReplaceInExpression.png',
        pinned: true
    },
    'khoa-sharing-toolbar': {
        name: 'Khoa Sharing Toolbar',
        version: '1.0.2',
        description: 'Collaborative toolbar for team sharing and project management features',
        category: 'workflow',
        tags: ['sharing', 'collaboration', 'toolbar', 'team'],
        image: 'KhoaSharingToolbar_1.0.2.png',
        pinned: false
    }
};

// Category definitions
const CATEGORIES = {
    utility: { name: 'Utility', color: '#4CAF50', description: 'Essential tools for everyday After Effects work' },
    automation: { name: 'Automation', color: '#2196F3', description: 'Scripts that automate repetitive tasks and workflows' },
    workflow: { name: 'Workflow', color: '#FF9800', description: 'Tools to enhance and streamline your creative workflow' }
};

function createDirectoryIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

function createConfigFile(scriptId, scriptData) {
    const scriptDir = path.join('scripts', scriptId);
    createDirectoryIfNotExists(scriptDir);
    
    const configPath = path.join(scriptDir, 'config.json');
    
    // Check if config already exists
    if (fs.existsSync(configPath)) {
        console.log(`Config already exists for ${scriptId}, skipping...`);
        return;
    }
    
    const config = {
        scriptName: scriptData.name,
        version: scriptData.version,
        description: scriptData.description,
        category: scriptData.category,
        tags: scriptData.tags,
        pinned: scriptData.pinned,
        baseImage: {
            src: `../../images/script-screenshots/${scriptData.image}`,
            width: 328,
            height: 612
        },
        overlays: []
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Created config.json for ${scriptId}`);
}

function createDescriptionFile(scriptId, scriptData) {
    const scriptDir = path.join('scripts', scriptId);
    const descriptionPath = path.join(scriptDir, 'description.md');
    
    // Check if description.md already exists
    if (fs.existsSync(descriptionPath)) {
        console.log(`Description.md already exists for ${scriptId}, skipping...`);
        return;
    }
    
    const description = `# About This Script

${scriptData.description}

This script provides powerful functionality for After Effects users, designed to streamline workflows and enhance productivity. The interface is carefully crafted to be both intuitive and feature-rich.

## Key Features

- Professional After Effects integration
- Intuitive user interface design
- Advanced functionality and options  
- Streamlined workflow optimization
- Comprehensive feature set
- Reliable performance and stability

## How It Works

1. **Launch**: Access the script from your After Effects Scripts menu
2. **Configure**: Set up your preferences and options
3. **Execute**: Run the script functionality with your chosen settings
4. **Results**: Review and apply the generated output

## Installation

Simply run the script from your After Effects Scripts menu. No additional setup required.

## Compatibility

- After Effects CC 2019 and later
- Windows and macOS supported
- No additional plugins required
`;
    
    fs.writeFileSync(descriptionPath, description);
    console.log(`Created description.md for ${scriptId}`);
}

function createIndexHtmlFile(scriptId, scriptData) {
    const scriptDir = path.join('scripts', scriptId);
    const indexPath = path.join(scriptDir, 'index.html');
    
    // Check if index.html already exists
    if (fs.existsSync(indexPath)) {
        console.log(`Index.html already exists for ${scriptId}, skipping...`);
        return;
    }
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scriptData.name} - After Effects Scripts Portfolio</title>
    <link rel="stylesheet" href="../../css/main.css">
    <link rel="stylesheet" href="../../css/overlay-system.css">
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
</head>
<body>
    <header class="header">
        <div class="container">
            <div style="position: absolute; top: 1rem; right: 2rem; opacity: 0.7; font-size: 0.8rem; color: var(--header-subtitle); display: flex; align-items: center; gap: 0.3rem; cursor: pointer; transition: opacity 0.2s ease;" id="theme-indicator" title="Click to toggle theme">
                <i data-lucide="moon" style="width: 14px; height: 14px;"></i>
                Dark Mode
            </div>
            <nav style="margin-bottom: 1rem;">
                <a href="../../index.html" style="color: var(--header-subtitle); text-decoration: none; font-size: 0.9rem;">&larr; Back to Scripts</a>
            </nav>
            <h1 class="site-title">${scriptData.name}</h1>
            <p class="site-subtitle">${scriptData.description}</p>
            <div style="margin-top: 1rem;">
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">v${scriptData.version}</span>
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; margin-left: 0.5rem;">${CATEGORIES[scriptData.category]?.name || scriptData.category}</span>
            </div>
        </div>
    </header>

    <main class="main-content">
        <div class="container">
            <div class="script-showcase">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div class="toggle-switch">
                        <span class="toggle-switch-label">Show All Overlays</span>
                        <label class="toggle-switch-container">
                            <input type="checkbox" id="overlay-toggle" class="toggle-switch-input">
                            <span class="toggle-switch-slider"></span>
                        </label>
                    </div>
                </div>
                <div id="overlay-container" class="script-image-container">
                    <!-- Overlay system will be initialized here -->
                </div>
                
                <div class="script-content">
                    <h2>About This Script</h2>
                    <p>
                        ${scriptData.description}
                    </p>
                    <p>
                        This script provides powerful functionality for After Effects users. Configure the overlay system using the configuration builder to highlight key features and interface elements.
                    </p>
                    
                    <h3>Key Features</h3>
                    <ul>
                        <li>Professional After Effects integration</li>
                        <li>Intuitive user interface design</li>
                        <li>Advanced functionality and options</li>
                        <li>Streamlined workflow optimization</li>
                        <li>Comprehensive feature set</li>
                    </ul>
                    
                    <div class="script-tags-section">
                        <svg class="tag-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        <div class="script-tags">
                            ${[...scriptData.tags].sort().map(tag => `<a href="../../index.html?tag=${encodeURIComponent(tag)}" class="tag">${tag}</a>`).join(' ')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 After Effects Scripts Portfolio</p>
        </div>
    </footer>

    <script src="../../js/utils.js"></script>
    <script src="../../js/overlay-engine.js"></script>
    <script>
        // Theme management with manual override (shared with main page)
        let currentTheme = 'auto'; // 'auto', 'light', 'dark'
        
        function getEffectiveTheme() {
            if (currentTheme === 'auto') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return currentTheme;
        }
        
        function applyTheme() {
            const effectiveTheme = getEffectiveTheme();
            const body = document.body;
            
            // Remove existing theme classes
            body.classList.remove('theme-light', 'theme-dark');
            
            // Apply theme class (CSS will override system detection)
            if (currentTheme !== 'auto') {
                body.classList.add(\`theme-\${effectiveTheme}\`);
            }
            
            updateThemeIndicator(effectiveTheme);
        }
        
        function updateThemeIndicator(effectiveTheme = null) {
            const indicator = document.getElementById('theme-indicator');
            if (!indicator) return;
            
            if (!effectiveTheme) effectiveTheme = getEffectiveTheme();
            
            let icon, text;
            if (currentTheme === 'auto') {
                icon = effectiveTheme === 'dark' ? 'moon' : 'sun';
                text = effectiveTheme === 'dark' ? 'Auto (Dark)' : 'Auto (Light)';
            } else {
                icon = effectiveTheme === 'dark' ? 'moon' : 'sun';
                text = effectiveTheme === 'dark' ? 'Dark Mode' : 'Light Mode';
            }
            
            indicator.innerHTML = \`<i data-lucide="\${icon}" style="width: 14px; height: 14px;"></i> \${text}\`;
            
            // Re-initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        function toggleTheme() {
            // Cycle through: auto -> light -> dark -> auto
            if (currentTheme === 'auto') {
                currentTheme = 'light';
            } else if (currentTheme === 'light') {
                currentTheme = 'dark';
            } else {
                currentTheme = 'auto';
            }
            
            // Save preference
            localStorage.setItem('theme-preference', currentTheme);
            applyTheme();
        }
        
        function setupThemeDetection() {
            // Load saved preference
            const savedTheme = localStorage.getItem('theme-preference');
            if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
                currentTheme = savedTheme;
            }
            
            // Apply initial theme
            applyTheme();
            
            // Listen for system theme changes (only when in auto mode)
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (currentTheme === 'auto') {
                    applyTheme();
                }
            });
            
            // Add click handler for theme toggle
            const indicator = document.getElementById('theme-indicator');
            if (indicator) {
                indicator.addEventListener('click', toggleTheme);
                indicator.addEventListener('mouseenter', () => {
                    indicator.style.opacity = '1';
                });
                indicator.addEventListener('mouseleave', () => {
                    indicator.style.opacity = '0.7';
                });
            }
        }
        
        document.addEventListener('DOMContentLoaded', async function() {
            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Setup enhanced theme detection
            setupThemeDetection();
            
            // Initialize overlay engine for this script
            const engine = initializeOverlayEngine('overlay-container');
            
            // Load the configuration from config.json
            const success = await engine.loadConfig('config.json');
            
            if (success && engine.config) {
                // Update metadata from config
                engine.updateScriptMetadata(engine.config);
                
                // Load and render description from description.md
                const descriptionHtml = await engine.loadDescription('.');
                if (descriptionHtml) {
                    const contentContainer = document.querySelector('.script-content');
                    if (contentContainer) {
                        contentContainer.innerHTML = descriptionHtml;
                        
                        // Add tags section if we have tags
                        if (engine.config.tags && engine.config.tags.length > 0) {
                            const tagsHtml = \`
                                <div class="script-tags-section">
                                    <svg class="tag-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                                    <div class="script-tags">
                                        \${[...engine.config.tags].sort().map(tag => 
                                            \`<a href="../../index.html?tag=\${encodeURIComponent(tag)}" class="tag">\${tag}</a>\`
                                        ).join(' ')}
                                    </div>
                                </div>
                            \`;
                            contentContainer.innerHTML += tagsHtml;
                        }
                    }
                }
            } else {
                console.error('Failed to load config.json for ${scriptData.name}');
            }
        });
    </script>
</body>
</html>
`;
    
    fs.writeFileSync(indexPath, html);
    console.log(`Created index.html for ${scriptId}`);
}

function scanScriptDirectories() {
    const scriptsDir = 'scripts';
    const scriptDirectories = [];
    
    if (!fs.existsSync(scriptsDir)) {
        console.warn('Scripts directory does not exist');
        return [];
    }
    
    const items = fs.readdirSync(scriptsDir);
    for (const item of items) {
        const itemPath = path.join(scriptsDir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
            const configPath = path.join(itemPath, 'config.json');
            if (fs.existsSync(configPath)) {
                scriptDirectories.push(item);
            } else {
                console.warn(`Found script directory '${item}' without config.json`);
            }
        }
    }
    
    return scriptDirectories;
}

function generateScriptsList() {
    const scriptsListPath = 'data/scripts-list.json';
    const scripts = [];
    
    // Collect all unique categories and tags from script configs
    const categoriesSet = new Set();
    const allTags = new Set();
    
    // Scan scripts directory for all script folders
    const scriptDirectories = scanScriptDirectories();
    console.log(`Found ${scriptDirectories.length} script directories:`, scriptDirectories.join(', '));
    
    // Read all config files
    for (const scriptId of scriptDirectories) {
        const configPath = path.join('scripts', scriptId, 'config.json');
        
        let config = null;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.warn(`Failed to read config for ${scriptId}:`, error.message);
            continue;
        }
        
        // Determine screenshot filename - try to get from hardcoded data or use fallback
        let screenshotFilename = `${scriptId}.png`; // fallback
        if (SCRIPT_DATA[scriptId] && SCRIPT_DATA[scriptId].image) {
            screenshotFilename = SCRIPT_DATA[scriptId].image;
        } else if (config.baseImage && config.baseImage.src) {
            // Extract filename from baseImage src path
            screenshotFilename = path.basename(config.baseImage.src);
        }
        
        // Add to scripts array
        scripts.push({
            id: scriptId,
            name: config.scriptName,
            version: config.version,
            category: config.category,
            description: config.description,
            thumbnail: `images/script-screenshots/${screenshotFilename}`,
            screenshot: `images/script-screenshots/${screenshotFilename}`,
            pinned: config.pinned || false,
            tags: config.tags || []
        });
        
        // Collect categories and tags
        if (config.category) {
            categoriesSet.add(config.category);
        }
        if (config.tags && Array.isArray(config.tags)) {
            config.tags.forEach(tag => allTags.add(tag));
        }
    }
    
    // Build categories array
    const categories = [];
    for (const categoryId of categoriesSet) {
        if (CATEGORIES[categoryId]) {
            categories.push({
                id: categoryId,
                name: CATEGORIES[categoryId].name,
                color: CATEGORIES[categoryId].color,
                description: CATEGORIES[categoryId].description
            });
        } else {
            console.warn(`Unknown category: ${categoryId}`);
        }
    }
    
    // Create the scripts list object
    const scriptsList = {
        scripts: scripts,
        categories: categories
    };
    
    // Create data directory if it doesn't exist
    createDirectoryIfNotExists('data');
    
    // Write the scripts list
    fs.writeFileSync(scriptsListPath, JSON.stringify(scriptsList, null, 2));
    console.log(`Generated ${scriptsListPath} with ${scripts.length} scripts and ${categories.length} categories`);
    console.log(`Discovered tags: ${Array.from(allTags).sort().join(', ')}`);
}

function main() {
    console.log('🚀 Generating After Effects Scripts Portfolio System...\n');
    
    console.log('Step 1: Creating script directories and config files...');
    for (const [scriptId, scriptData] of Object.entries(SCRIPT_DATA)) {
        createConfigFile(scriptId, scriptData);
    }
    
    console.log('\nStep 2: Creating script description.md files...');
    for (const [scriptId, scriptData] of Object.entries(SCRIPT_DATA)) {
        createDescriptionFile(scriptId, scriptData);
    }
    
    console.log('\nStep 3: Creating script index.html files...');
    for (const [scriptId, scriptData] of Object.entries(SCRIPT_DATA)) {
        createIndexHtmlFile(scriptId, scriptData);
    }
    
    console.log('\nStep 4: Generating dynamic scripts-list.json...');
    generateScriptsList();
    
    console.log('\n✅ System generation complete!');
    console.log('\nNext steps:');
    console.log('1. Run a local server: python -m http.server 8000');
    console.log('2. Open http://localhost:8000');
    console.log('3. Use the config builder at http://localhost:8000/tools/config-builder.html');
    console.log('4. Configure overlays for each script as needed');
}

if (require.main === module) {
    main();
}