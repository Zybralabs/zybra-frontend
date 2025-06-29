#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts...');

const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.cache',
  'dist',
  'build'
];

const filesToClean = [
  '.next/trace',
  '.next/cache',
  'tsconfig.tsbuildinfo'
];

// Clean directories
dirsToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✅ Removed ${dir}`);
    } catch (error) {
      console.log(`  ⚠️  Could not remove ${dir}: ${error.message}`);
    }
  } else {
    console.log(`  ℹ️  ${dir} doesn't exist`);
  }
});

// Clean files
filesToClean.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`  ✅ Removed ${file}`);
    } catch (error) {
      console.log(`  ⚠️  Could not remove ${file}: ${error.message}`);
    }
  }
});

// Force garbage collection if available
if (global.gc) {
  console.log('🧹 Running garbage collection...');
  global.gc();
}

console.log('✨ Clean complete!');