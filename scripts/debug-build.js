#!/usr/bin/env node

/**
 * Debug script to help identify build issues for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging build environment...\n');

// Check Node.js version
console.log('📦 Node.js version:', process.version);
console.log('📦 Platform:', process.platform);
console.log('📦 Architecture:', process.arch);

// Check environment variables
console.log('\n🔧 Environment variables:');
const envVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_ALCHEMY_API_KEY',
  'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
  'NEXT_PUBLIC_NETWORK',
  'NEXT_PUBLIC_RELAY_WSS_URL',
  'NEXT_PUBLIC_COLLATOR_WSS_URL',
  'NEXT_PUBLIC_SUBQUERY_URL',
  'NEXT_PUBLIC_IPFS_GATEWAY',
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const maskedValue = varName.includes('KEY') || varName.includes('SECRET') 
      ? `${value.substring(0, 8)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

// Check package.json
console.log('\n📋 Package.json check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`  ✅ Name: ${packageJson.name}`);
  console.log(`  ✅ Version: ${packageJson.version}`);
  console.log(`  ✅ Next.js: ${packageJson.dependencies?.next || 'NOT FOUND'}`);
  console.log(`  ✅ React: ${packageJson.dependencies?.react || 'NOT FOUND'}`);
} catch (error) {
  console.log(`  ❌ Error reading package.json: ${error.message}`);
}

// Check critical files
console.log('\n📁 Critical files check:');
const criticalFiles = [
  'next.config.js',
  'netlify.toml',
  '.nvmrc',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/providers.tsx',
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file}: NOT FOUND`);
  }
});

// Check for common problematic dependencies
console.log('\n🔍 Dependency analysis:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const problematicDeps = [
    'sharp',
    '@centrifuge/centrifuge-js',
    '@moonpay/moonpay-react',
    'ethers',
    'wagmi',
  ];
  
  problematicDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`  ⚠️  ${dep}: ${allDeps[dep]} (may cause build issues)`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error analyzing dependencies: ${error.message}`);
}

// Check TypeScript configuration
console.log('\n📝 TypeScript configuration:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`  ✅ Target: ${tsConfig.compilerOptions?.target || 'NOT SET'}`);
  console.log(`  ✅ Module: ${tsConfig.compilerOptions?.module || 'NOT SET'}`);
  console.log(`  ✅ Strict: ${tsConfig.compilerOptions?.strict || 'NOT SET'}`);
  console.log(`  ✅ Module Resolution: ${tsConfig.compilerOptions?.moduleResolution || 'NOT SET'}`);
} catch (error) {
  console.log(`  ❌ Error reading tsconfig.json: ${error.message}`);
}

// Memory usage
console.log('\n💾 Memory usage:');
const memUsage = process.memoryUsage();
console.log(`  📊 RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
console.log(`  📊 Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
console.log(`  📊 Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);

console.log('\n✨ Debug complete! Check the output above for any issues.\n');

// Exit with success
process.exit(0);
