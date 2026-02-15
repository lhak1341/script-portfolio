#!/usr/bin/env node

/**
 * Complete System Builder for After Effects Scripts Portfolio
 * 
 * This script runs the complete build process:
 * 1. Generates all missing config.json files and script pages
 * 2. Updates scripts-list.json from all config files
 * 3. Syncs config-builder.js with current script data
 */

const { execSync } = require('child_process');

console.log('🚀 Building After Effects Scripts Portfolio System...\n');

try {
    console.log('Step 1: Generating system files...');
    execSync('node generate-system.js', { stdio: 'inherit' });
    
    console.log('\nStep 2: Syncing config builder...');
    execSync('node update-config-builder.js', { stdio: 'inherit' });
    
    console.log('\n✅ Build complete! System is now fully dynamic.');
    console.log('\n📋 What was generated:');
    console.log('• All missing script directories created');
    console.log('• Config files generated for all scripts');
    console.log('• Placeholder index.html pages created');
    console.log('• scripts-list.json updated from config files');
    console.log('• Config builder synced with current scripts');
    
    console.log('\n🎯 Next steps:');
    console.log('• Run: python3 -m http.server 8000');
    console.log('• Visit: http://localhost:8000');
    console.log('• Configure: http://localhost:8000/tools/config-builder.html');
    console.log('• Edit individual config files as needed');
    console.log('• Re-run this script to rebuild after changes');
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}