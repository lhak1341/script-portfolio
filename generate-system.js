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
        
        // Validate required fields
        if (!config.scriptName || !config.version || !config.category || !config.description) {
            console.warn(`Skipping ${scriptId}: missing required fields (scriptName, version, category, or description)`);
            continue;
        }
        } catch (error) {
            console.warn(`Failed to read config for ${scriptId}:`, error.message);
            continue;
        }
        
        // Determine screenshot filename from config.json
        let screenshotFilename = `${scriptId}.png`; // fallback
        if (config.baseImage && config.baseImage.src) {
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
    console.log('Starting After Effects Scripts Portfolio System generation...\n');
    
    console.log('Generating dynamic scripts-list.json...');
    generateScriptsList();
    
    console.log('\n✅ System generation complete!');
    console.log('\nNext steps:');
    console.log('1. Add new scripts with: node add-script.js <id> <name> <version> <description> <category>');
    console.log('2. Run a local server: python3 -m http.server 8000');
    console.log('3. Use the config builder at http://localhost:8000/tools/config-builder.html');
}

if (require.main === module) {
    main();
}