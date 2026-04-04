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

const steps = [
    { label: 'Step 1: Generating system files', cmd: 'node generate-system.js' },
    { label: 'Step 2: Syncing config builder',  cmd: 'node update-config-builder.js' },
];

for (const step of steps) {
    console.log(`${step.label}...`);
    try {
        execSync(step.cmd, { stdio: 'inherit' });
    } catch (error) {
        console.error(`\n❌ Build failed at "${step.label}"`);
        console.error(`   Command: ${step.cmd}`);
        console.error(`   Exit code: ${error.status}`);
        process.exit(error.status || 1);
    }
}

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