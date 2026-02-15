#!/usr/bin/env node

/**
 * Add New Script Utility
 * 
 * Creates a new script with the required file structure:
 * - scripts/{id}/config.json
 * - scripts/{id}/description.md  
 * - scripts/{id}/index.html
 */

const fs = require('fs');
const path = require('path');

function createScript(scriptId, scriptName, version, description, category, tags = [], screenshotFilename = null) {
    const scriptDir = path.join('scripts', scriptId);
    
    // Create directory
    if (fs.existsSync(scriptDir)) {
        console.error(`❌ Script directory '${scriptId}' already exists`);
        return false;
    }
    
    fs.mkdirSync(scriptDir, { recursive: true });
    console.log(`📁 Created directory: ${scriptDir}`);
    
    // Determine screenshot filename
    const imageFilename = screenshotFilename || `${scriptName.replace(/\s+/g, '')}_${version}.png`;
    
    // Validate category
    const validCategories = ['utility', 'workflow', 'automation'];
    if (!validCategories.includes(category)) {
        console.error(`❌ Invalid category '${category}'. Must be one of: ${validCategories.join(', ')}`);
        return false;
    }

    // Create config.json
    const config = {
        scriptName: scriptName,
        version: version,
        description: description,
        category: category,
        tags: tags,
        pinned: false,
        baseImage: {
            src: `../../images/script-screenshots/${imageFilename}`,
            width: 328,
            height: 612
        },
        overlays: []
    };
    
    fs.writeFileSync(
        path.join(scriptDir, 'config.json'),
        JSON.stringify(config, null, 2)
    );
    console.log(`⚙️  Created config.json`);
    
    // Create description.md
    const descriptionMd = `# About This Script

${description}

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
    
    fs.writeFileSync(
        path.join(scriptDir, 'description.md'),
        descriptionMd
    );
    console.log(`📄 Created description.md`);
    
    // Create index.html
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scriptName} - After Effects Scripts Portfolio</title>
    <link rel="stylesheet" href="../../css/main.css">
    <link rel="stylesheet" href="../../css/overlay-system.css">
    <script src="https://unpkg.com/lucide@0.564.0/dist/umd/lucide.js"></script>
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
            <h1 class="site-title">${scriptName}</h1>
            <p class="site-subtitle">${description}</p>
            <div style="margin-top: 1rem;">
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem;">v${version}</span>
                <span style="background: var(--bg-tertiary); color: var(--text-muted); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; margin-left: 0.5rem;">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
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
                    <!-- Dynamic content loaded from description.md -->
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 After Effects Scripts Portfolio</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.3.1/dist/purify.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked@17.0.2/lib/marked.umd.js"></script>
    <script src="../../js/theme.js"></script>
    <script src="../../js/utils.js"></script>
    <script src="../../js/overlay-defaults.js"></script>
    <script src="../../js/overlay-engine.js"></script>
    <script>
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
                                            \`<a href="../../index.html?tag=\${encodeURIComponent(tag)}" class="tag">\${sanitizeHTML(tag)}</a>\`
                                        ).join(' ')}
                                    </div>
                                </div>
                            \`;
                            contentContainer.innerHTML += tagsHtml;
                        }
                    }
                }
            } else {
                console.error('Failed to load config.json for ${scriptName}');
            }
        });
    </script>
</body>
</html>
`;
    
    fs.writeFileSync(
        path.join(scriptDir, 'index.html'),
        html
    );
    console.log(`🌐 Created index.html`);
    
    console.log(`\n✅ Script '${scriptId}' created successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`1. Add screenshot: images/script-screenshots/${imageFilename}`);
    console.log(`2. Run: node build-system.js (to update scripts-list.json)`);
    console.log(`3. Configure overlays: http://localhost:8000/tools/config-builder.html`);
    
    return true;
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 5) {
        console.log(`Usage: node add-script.js <id> <name> <version> <description> <category> [tags] [screenshot]`);
        console.log(`\nExample:`);
        console.log(`node add-script.js my-new-script "My New Script" "1.0.0" "Does amazing things" "utility" "tag1,tag2" "MyScript.png"`);
        console.log(`\nCategories: utility, workflow, automation`);
        process.exit(1);
    }
    
    const [id, name, version, description, category, tagsStr, screenshot] = args;
    const tags = tagsStr ? tagsStr.split(',').map(tag => tag.trim()) : [];
    
    createScript(id, name, version, description, category, tags, screenshot);
}

module.exports = { createScript };