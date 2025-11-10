/**
 * Inject slot_1 background rectangles into nautical SVG files
 * Run: node injectSlot1.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NAUTICAL_DIR = path.join(__dirname, 'src/lib/shapes/nautical');
const PUBLIC_NAUTICAL_DIR = path.join(__dirname, 'public/shapes/nautical');

// Inject slot_1 rect into SVG content
function injectSlot1(svgContent) {
  // Check if slot_1 already exists
  if (svgContent.includes('id="slot_1"')) {
    console.log('  ⏭️  slot_1 already exists, skipping');
    return svgContent;
  }
  
  // Find the first <g> tag after the opening <svg> tag
  // We want to inject INSIDE the clip-path group so it gets clipped properly
  const firstGroupMatch = svgContent.match(/(<g[^>]*>)/);
  
  if (firstGroupMatch) {
    const insertPosition = svgContent.indexOf(firstGroupMatch[0]) + firstGroupMatch[0].length;
    
    // Create the slot_1 rect - this will be the background
    const slot1Rect = '\n<rect id="slot_1" width="64" height="64" fill="#FFFFFF"/>';
    
    // Insert it right after the opening <g> tag
    const newContent = 
      svgContent.slice(0, insertPosition) +
      slot1Rect +
      svgContent.slice(insertPosition);
    
    console.log('  ✅ Injected slot_1 background');
    return newContent;
  }
  
  // Fallback: inject right after <svg> tag if no group found
  const svgTagMatch = svgContent.match(/(<svg[^>]*>)/);
  if (svgTagMatch) {
    const insertPosition = svgContent.indexOf(svgTagMatch[0]) + svgTagMatch[0].length;
    const slot1Rect = '\n<rect id="slot_1" width="64" height="64" fill="#FFFFFF"/>\n';
    
    const newContent = 
      svgContent.slice(0, insertPosition) +
      slot1Rect +
      svgContent.slice(insertPosition);
    
    console.log('  ✅ Injected slot_1 background (fallback)');
    return newContent;
  }
  
  console.log('  ❌ Could not find insertion point');
  return svgContent;
}

// Process all SVG files in a directory
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Directory not found: ${dirPath}`);
    return 0;
  }
  
  const files = fs.readdirSync(dirPath);
  const svgFiles = files.filter(f => f.endsWith('.svg'));
  
  let processedCount = 0;
  
  svgFiles.forEach(file => {
    console.log(`\n📄 Processing: ${file}`);
    const filePath = path.join(dirPath, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const newContent = injectSlot1(content);
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        processedCount++;
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  });
  
  return processedCount;
}

// Main execution
console.log('🎨 Injecting slot_1 backgrounds into nautical flags...\n');

console.log('📁 Processing source directory: src/lib/shapes/nautical/');
const sourceProcessed = processDirectory(NAUTICAL_DIR);

console.log('\n📁 Processing public directory: public/shapes/nautical/');
const publicProcessed = processDirectory(PUBLIC_NAUTICAL_DIR);

console.log('\n' + '='.repeat(50));
console.log(`✨ Complete! Modified ${sourceProcessed} source files and ${publicProcessed} public files.`);
console.log('\nNext steps:');
console.log('1. Run: node extractShapes.js');
console.log('2. Refresh your browser');
console.log('3. Nautical flags should now have proper backgrounds! 🎉');