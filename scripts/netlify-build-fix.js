#!/usr/bin/env node

/**
 * Netlify build script that fixes the Next.js plugin ENOENT error
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Netlify build with plugin fix...');

// Create the missing package.json file that the plugin expects
const pluginDir = '.netlify/plugins/node_modules/@netlify/plugin-nextjs';
const packageJsonPath = path.join(pluginDir, 'package.json');

try {
  // Create directory structure
  fs.mkdirSync(pluginDir, { recursive: true });
  
  // Create minimal package.json
  const packageJson = {
    name: '@netlify/plugin-nextjs',
    version: '5.11.3',
    description: 'Netlify Next.js plugin',
    main: 'index.js'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Created missing plugin package.json');
  
} catch (error) {
  console.warn('⚠️ Could not create plugin package.json:', error.message);
}

// Run the actual build
try {
  console.log('📦 Installing dependencies...');
  execSync('yarn install --ignore-engines', { stdio: 'inherit' });
  
  console.log('🔨 Building application...');
  execSync('npm run build:netlify', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
