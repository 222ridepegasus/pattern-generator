/**
 * Extract SVG shape data and generate shapeSets.js
 * UPDATED: Now supports multi-slot shapes (nautical flags)
 * Run: node extractShapes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHAPES_DIR = path.join(__dirname, 'src/lib/shapes');
const OUTPUT_FILE = path.join(__dirname, 'src/lib/shapeSets.js');

// Extract slot number from element ID
function extractSlotNumber(id) {
  const match = id?.match(/slot_(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// Extract all shape elements with ID-based slot assignments
function extractMultiSlotPaths(svgContent) {
  const shapes = [];
  
  // Find all elements with id="slot_X" in document order
  const slotRegex = /<(path|rect|circle)[^>]*id="slot_(\d+)"[^>]*>/gi;
  let match;
  
  while ((match = slotRegex.exec(svgContent)) !== null) {
    const elementType = match[1].toLowerCase();
    const slot = parseInt(match[2]);
    const fullElement = match[0];
    
    if (elementType === 'path') {
      const dMatch = fullElement.match(/\sd="([^"]*)"/);
      if (dMatch) {
        shapes.push({
          type: 'path',
          d: dMatch[1],
          slot
        });
      }
    } else if (elementType === 'rect') {
      const xMatch = fullElement.match(/\sx="([^"]*)"/);
      const yMatch = fullElement.match(/\sy="([^"]*)"/);
      const widthMatch = fullElement.match(/width="([^"]*)"/);
      const heightMatch = fullElement.match(/height="([^"]*)"/);
      
      shapes.push({
        type: 'rect',
        x: xMatch ? xMatch[1] : '0',
        y: yMatch ? yMatch[1] : '0',
        width: widthMatch ? widthMatch[1] : '64',
        height: heightMatch ? heightMatch[1] : '64',
        slot
      });
    } else if (elementType === 'circle') {
      const cxMatch = fullElement.match(/\scx="([^"]*)"/);
      const cyMatch = fullElement.match(/\scy="([^"]*)"/);
      const rMatch = fullElement.match(/\sr="([^"]*)"/);
      
      shapes.push({
        type: 'circle',
        cx: cxMatch ? cxMatch[1] : '32',
        cy: cyMatch ? cyMatch[1] : '32',
        r: rMatch ? rMatch[1] : '16',
        slot
      });
    }
  }
  
  // Move slot_1 to the beginning (background), preserve document order for others
  const slot1Shapes = shapes.filter(s => s.slot === 1);
  const otherShapes = shapes.filter(s => s.slot !== 1);
  
  const orderedShapes = [...slot1Shapes, ...otherShapes];
  
  return orderedShapes.length > 0 ? orderedShapes : null;
}

// Extract circle data
function extractCircle(svgContent) {
  const circleMatch = svgContent.match(/<circle\s+cx="(\d+)"\s+cy="(\d+)"\s+r="(\d+)"/);
  if (circleMatch) {
    return { type: 'circle', cx: parseInt(circleMatch[1]), cy: parseInt(circleMatch[2]), r: parseInt(circleMatch[3]) };
  }
  return null;
}

// Extract rect data
function extractRect(svgContent) {
  const rectMatch = svgContent.match(/<rect\s+(?:x="(\d+)"\s+)?(?:y="(\d+)"\s+)?width="(\d+)"\s+height="(\d+)"/);
  if (rectMatch) {
    return { type: 'rect', x: parseInt(rectMatch[1] || 0), y: parseInt(rectMatch[2] || 0), width: parseInt(rectMatch[3]), height: parseInt(rectMatch[4]) };
  }
  return null;
}

// Process SVG file
function processSVG(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Try multi-slot shapes first (nautical shapes)
  const multiSlotShapes = extractMultiSlotPaths(content);
  if (multiSlotShapes && multiSlotShapes.length > 0) {
    return { type: 'multi-slot', shapes: multiSlotShapes };
  }
  
  // Fall back to single-shape detection
  return extractCircle(content) || extractRect(content) || { type: 'path', d: content.match(/<path\s+d="([^"]+)"/)?.[1] };
}

// Generate shape function for single-color shapes
function generateSingleColorShape(shapeName, shapeData) {
  if (shapeData.type === 'circle') {
    return `  ${shapeName}: (x, y, size) => ({
    type: 'circle',
    attrs: { cx: x, cy: y, r: size / 2 }
  })`;
  }
  
  if (shapeData.type === 'rect') {
    return `  ${shapeName}: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  })`;
  }
  
  if (shapeData.type === 'path' && shapeData.d) {
    const pathData = shapeData.d.replace(/"/g, '\\"');
    return `  ${shapeName}: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
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

// Generate shape function for multi-slot shapes
function generateMultiSlotShape(shapeName, shapeData) {
  const shapesCode = shapeData.shapes.map(shape => {
    if (shape.type === 'path') {
      const pathData = shape.d.replace(/"/g, '\\"');
      return `      {
        type: 'path',
        attrs: {
          d: "${pathData}",
          transform: \`translate(\${x}, \${y}) scale(\${scaleX}, \${scaleY}) translate(-32, -32)\`
        },
        slot: ${shape.slot}
      }`;
    } else if (shape.type === 'rect') {
      return `      {
        type: 'rect',
        attrs: {
          x: \`\${x + (${shape.x} - 32) * scaleX}\`,
          y: \`\${y + (${shape.y} - 32) * scaleY}\`,
          width: \`\${${shape.width} * Math.abs(scaleX)}\`,
          height: \`\${${shape.height} * Math.abs(scaleY)}\`
        },
        slot: ${shape.slot}
      }`;
    } else if (shape.type === 'circle') {
      return `      {
        type: 'circle',
        attrs: {
          cx: \`\${x + (${shape.cx} - 32) * scaleX}\`,
          cy: \`\${y + (${shape.cy} - 32) * scaleY}\`,
          r: \`\${${shape.r} * Math.abs(scale)}\`
        },
        slot: ${shape.slot}
      }`;
    } else if (shape.type === 'polygon') {
      const points = shape.points.replace(/"/g, '\\"');
      return `      {
        type: 'polygon',
        attrs: {
          points: "${points}",
          transform: \`translate(\${x}, \${y}) scale(\${scaleX}, \${scaleY}) translate(-32, -32)\`
        },
        slot: ${shape.slot}
      }`;
    }
  }).filter(Boolean).join(',\n');
  
  return `  ${shapeName}: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
${shapesCode}
    ];
  }`;
}

// Read shapes from directory
function readShapesFromDir(dirPath) {
  const shapes = {};
  if (!fs.existsSync(dirPath)) return shapes;
  
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

// Generate shapeSets.js file
function generateShapeSetsFile() {
  console.log('🔍 Reading SVG files...\n');
  
  const primitivesPath = path.join(SHAPES_DIR, 'primitives');
  const blocksPath = path.join(SHAPES_DIR, 'blocks33');
  const nauticalPath = path.join(SHAPES_DIR, 'nautical');
  
  const primitives = readShapesFromDir(primitivesPath);
  const blocks = readShapesFromDir(blocksPath);
  const nautical = readShapesFromDir(nauticalPath);
  
  console.log(`✅ Found ${Object.keys(primitives).length} primitives`);
  console.log(`✅ Found ${Object.keys(blocks).length} blocks`);
  console.log(`✅ Found ${Object.keys(nautical).length} nautical flags\n`);
  
  // Generate code for each set
  const primitivesCode = Object.entries(primitives)
    .map(([name, data]) => generateSingleColorShape(name, data))
    .filter(Boolean)
    .join(',\n\n');
  
  const blocksCode = Object.entries(blocks)
    .map(([name, data]) => generateSingleColorShape(name, data))
    .filter(Boolean)
    .join(',\n\n');
  
  const nauticalCode = Object.entries(nautical)
    .map(([name, data]) => {
      if (data.type === 'multi-slot') {
        return generateMultiSlotShape(name, data);
      } else {
        return generateSingleColorShape(name, data);
      }
    })
    .filter(Boolean)
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
      enabled: true,
      multiColor: false
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
      enabled: true,
      multiColor: false
    },
    shapes: {
${blocksCode}
    }
  },

  nautical: {
    meta: {
      name: 'Nautical Flags',
      description: 'International maritime signal flags',
      icon: '⚓🚩',
      enabled: true,
      multiColor: true
    },
    shapes: {
${nauticalCode}
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
  
  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`✨ Generated ${OUTPUT_FILE}\n`);
  console.log('Shape sets created:');
  console.log(`  - primitives (${Object.keys(primitives).length} shapes)`);
  console.log(`  - blocks33 (${Object.keys(blocks).length} shapes)`);
  console.log(`  - nautical (${Object.keys(nautical).length} shapes - MULTI-COLOR)`);
}

// Run
try {
  generateShapeSetsFile();
  console.log('\n✅ Done! Multi-slot nautical shapes ready to use.');
  console.log('Next: Update pattern rendering to handle slot-based colors.');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}