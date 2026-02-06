#!/usr/bin/env node

/**
 * Update Config Builder Script Data
 * 
 * This script reads the generated scripts-list.json and updates the hardcoded
 * script data in tools/config-builder.js to keep them in sync.
 */

const fs = require('fs');
const path = require('path');

function updateConfigBuilderData() {
    // Read the generated scripts list
    const scriptsListPath = 'data/scripts-list.json';
    if (!fs.existsSync(scriptsListPath)) {
        console.error('scripts-list.json not found. Run generate-system.js first.');
        process.exit(1);
    }
    
    let scriptsList;
    try {
        scriptsList = JSON.parse(fs.readFileSync(scriptsListPath, 'utf8'));
    } catch (e) {
        console.error('Failed to parse scripts-list.json:', e.message);
        process.exit(1);
    }
    
    // Generate the script data object for config-builder.js
    const esc = s => String(s).replace(/'/g, "\\'");
    const scriptDataEntries = scriptsList.scripts.map(script => {
        return `    '${esc(script.id)}': {
        name: '${esc(script.name)}',
        version: '${esc(script.version)}',
        description: '${esc(script.description)}',
        image: '${esc(path.basename(script.thumbnail))}'
    }`;
    });
    
    const scriptDataCode = `// Script metadata mapping
        this.scriptData = {
${scriptDataEntries.join(',\n')}
        };`;
    
    // Read the config-builder.js file
    const configBuilderPath = 'tools/config-builder.js';
    let configBuilderContent = fs.readFileSync(configBuilderPath, 'utf8');
    
    // Find and replace the scriptData section - match the actual format
    const scriptDataRegex = /\/\/ Script metadata mapping\s*this\.scriptData = \{[\s\S]*?\s*\};/;
    
    if (scriptDataRegex.test(configBuilderContent)) {
        configBuilderContent = configBuilderContent.replace(scriptDataRegex, scriptDataCode);
        fs.writeFileSync(configBuilderPath, configBuilderContent);
        console.log('✅ Updated config-builder.js with current script data');
    } else {
        console.error('❌ Could not find scriptData section in config-builder.js');
    }
}

if (require.main === module) {
    updateConfigBuilderData();
}
