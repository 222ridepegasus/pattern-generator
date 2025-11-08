/**
 * Extract SVG shape data and generate shapeSets.js
 * Run this in your project root: node extractShapes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const SHAPES_DIR = path.join(__dirname, 'src/lib/shapes');
const OUTPUT_FILE = path.join(__dirname, 'src/lib/shapeSets.js');

// Extract circle data from SVG
function extractCircle(svgContent) {
  const circleMatch = svgContent.match(/<circle\s+cx="(\d+)"\s+cy="(\d+)"\s+r="(\d+)"/);
  if (circleMatch) {
    const [, cx, cy, r] = circleMatch;
    return {
      type: 'circle',
      cx: parseInt(cx),
      cy: parseInt(cy),
      r: parseInt(r)
    };
  }
  return null;
}

// Extract path data from SVG
function extractPath(svgContent) {
  const pathMatch = svgContent.match(/<path\s+d="([^"]+)"/);
  if (pathMatch) {
    return {
      type: 'path',
      d: pathMatch[1]
    };
  }
  return null;
}

// Extract rect data from SVG
function extractRect(svgContent) {
  const rectMatch = svgContent.match(/<rect\s+x="(\d+)"\s+y="(\d+)"\s+width="(\d+)"\s+height="(\d+)"/);
  if (rectMatch) {
    const [, x, y, width, height] = rectMatch;
    return {
      type: 'rect',
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height)
    };
  }
  return null;
}

// Process an SVG file
function processSVG(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try to extract shape data
  return extractCircle(content) || extractPath(content) || extractRect(content);
}

// Read all SVGs from a directory
function readShapesFromDir(dirPath) {
  const shapes = {};
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    if (file.endsWith('.svg')) {
      const shapeName = file.replace('.svg', '');
      const filePath = path.join(dirPath, file);
      const shapeData = processSVG(filePath);
      
      if (shapeData) {
        shapes[shapeName] = shapeData;
      }
    }
  });
  
  return shapes;
}

// Generate shape function code
function generateShapeFunction(shapeName, shapeData) {
  if (shapeData.type === 'circle') {
    // Circle is simple - no transform needed
    return `  ${shapeName}: (x, y, size, flipH = 1, flipV = 1) => ({
    type: 'circle',
    attrs: { cx: x, cy: y, r: size / 2 }
    // Circle doesn't need flip handling - it's symmetrical
  })`;
  }
  
  if (shapeData.type === 'rect') {
    // Rectangle
    return `  ${shapeName}: (x, y, size, flipH = 1, flipV = 1) => ({
    type: 'rect',
    attrs: { 
      x: x - size / 2, 
      y: y - size / 2, 
      width: size, 
      height: size 
    }
    // Square doesn't need flip handling - it's symmetrical
  })`;
  }
  
  if (shapeData.type === 'path') {
    // Path needs transform for scaling/positioning and flipping
    const pathData = shapeData.d.replace(/"/g, '\\"');
    return `  ${shapeName}: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    // Flip around center: translate to position, scale (with flip), offset by shape center
    return {
      type: 'path',
      attrs: {
        d: "${pathData}",
        transform: \`translate(\${x}, \${y}) scale(\${scaleX}, \${scaleY}) translate(-32, -32)\`
      }
    };
  }`;
  }
}

// Generate the shapeSets.js file
function generateShapeSetsFile() {
  console.log('🔍 Reading SVG files...\n');
  
  // Read shapes from both directories
  const primitivesPath = path.join(SHAPES_DIR, 'primitives');
  const blocksPath = path.join(SHAPES_DIR, 'blocks33');
  
  const primitives = readShapesFromDir(primitivesPath);
  const blocks = readShapesFromDir(blocksPath);
  
  console.log(`✅ Found ${Object.keys(primitives).length} primitives`);
  console.log(`✅ Found ${Object.keys(blocks).length} blocks\n`);
  
  // Generate code
  const primitivesCode = Object.entries(primitives)
    .map(([name, data]) => generateShapeFunction(name, data))
    .join(',\n\n');
  
  const blocksCode = Object.entries(blocks)
    .map(([name, data]) => generateShapeFunction(name, data))
    .join(',\n\n');
  
  const fileContent = `/**
 * Shape Sets - Auto-generated from SVG files
 * Run 'node extractShapes.js' to regenerate
 */

export const shapeSets = {
  primitives: {
    meta: {
      name: 'Primitives',
      description: 'Basic geometric shapes',
      icon: '○□△⬡',
      enabled: true
    },
    shapes: {
${primitivesCode}
    }
  },

  blocks33: {
    meta: {
      name: '3×3 Blocks',
      description: 'Complex block patterns',
      icon: '▦▧▨',
      enabled: true
    },
    shapes: {
${blocksCode}
    }
  }
};

// Flatten all shapes for pattern engine
export const getAllShapes = () => {
  const allShapes = {};
  Object.entries(shapeSets).forEach(([setKey, set]) => {
    Object.entries(set.shapes).forEach(([shapeKey, shapeFn]) => {
      allShapes[shapeKey] = shapeFn;
    });
  });
  return allShapes;
};

// Get shapes from enabled sets only
export const getEnabledShapes = () => {
  const enabledShapes = {};
  Object.entries(shapeSets).forEach(([setKey, set]) => {
    if (set.meta.enabled) {
      Object.entries(set.shapes).forEach(([shapeKey, shapeFn]) => {
        enabledShapes[shapeKey] = shapeFn;
      });
    }
  });
  return enabledShapes;
};

// Backward compatibility - export flattened shapes
export const shapes = getAllShapes();
`;
  
  // Write the file
  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`✨ Generated ${OUTPUT_FILE}\n`);
  console.log('Shape sets created:');
  console.log(`  - primitives: ${Object.keys(primitives).join(', ')}`);
  console.log(`  - blocks33: ${Object.keys(blocks).join(', ')}`);
}

// Run it
try {
  generateShapeSetsFile();
  console.log('\n✅ Done! Now update patternEngine.js to import from shapeSets.js');
} catch (error) {
  console.error('❌ Error:', error.message);
}