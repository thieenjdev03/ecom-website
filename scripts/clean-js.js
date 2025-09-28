#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively find and delete all .js files in a directory
 * @param {string} dir - Directory to clean
 */
function cleanJsFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively clean subdirectories
        cleanJsFiles(fullPath);
      } else if (path.extname(item) === '.js') {
        // Delete .js file
        fs.unlinkSync(fullPath);
        console.log(`Deleted: ${fullPath}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning directory ${dir}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory does not exist:', srcDir);
    process.exit(1);
  }
  
  console.log('Cleaning .js files from src directory...');
  console.log('Source directory:', srcDir);
  console.log('---');
  
  cleanJsFiles(srcDir);
  
  console.log('---');
  console.log('Cleanup completed!');
}

// Run the script
main();
