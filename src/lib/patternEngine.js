/**
 * Pattern Engine - Core logic for generating patterns
 * Pure JavaScript, framework-agnostic
 */
import { shapes } from './shapeSets.js'; 
// Seeded random number generator for reproducible patterns
export class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  choice(array) {
    return array[Math.floor(this.next() * array.length)];
  }
}



// Calculate pattern layout based on new system
export function calculatePatternLayout(config) {
  const {
    containerSize,
    borderPadding,
    lineSpacing,
    gridSize,
  } = config;

  const patternWidth = containerSize[0] - (borderPadding * 2);
  const patternHeight = containerSize[1] - (borderPadding * 2);

  const totalHorizontalSpacing = (gridSize - 1) * lineSpacing;
  const totalVerticalSpacing = (gridSize - 1) * lineSpacing;

  const availableWidth = patternWidth - totalHorizontalSpacing;
  const availableHeight = patternHeight - totalVerticalSpacing;

  const tileWidth = availableWidth / gridSize;
  const tileHeight = availableHeight / gridSize;
  const tileSize = Math.min(tileWidth, tileHeight);

  const actualPatternWidth = (tileSize * gridSize) + totalHorizontalSpacing;
  const actualPatternHeight = (tileSize * gridSize) + totalVerticalSpacing;

  const offsetX = borderPadding + (patternWidth - actualPatternWidth) / 2;
  const offsetY = borderPadding + (patternHeight - actualPatternHeight) / 2;

  return {
    tileSize,
    offsetX,
    offsetY,
    rows: gridSize,
    cols: gridSize,
  };
}

// New centered grid pattern generator
export function generateCenteredGrid(config, rng) {
  const {
    containerSize,
    borderPadding = 0,
    lineSpacing = 0,
    gridSize = 4,
    shapes: selectedShapes,
    colors,
    rotation = { enabled: false }
  } = config;

  const layout = calculatePatternLayout({
    containerSize,
    borderPadding,
    lineSpacing,
    gridSize,
  });

  const elements = [];
  const { tileSize, offsetX, offsetY, rows, cols } = layout;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + (col * (tileSize + lineSpacing)) + (tileSize / 2);
      const y = offsetY + (row * (tileSize + lineSpacing)) + (tileSize / 2);

      const shapeType = rng.choice(selectedShapes);
      const color = rng.choice(colors);

      // Random flip per shape (when flip is enabled)
      let flipH = 1;
      let flipV = 1;

      if (config.mirror?.horizontal) {
        flipH = rng.next() > 0.5 ? -1 : 1; // 50% chance to flip
      }

      if (config.mirror?.vertical) {
        flipV = rng.next() > 0.5 ? -1 : 1; // 50% chance to flip
      }

      // Generate shape with flip parameters
      const element = shapes[shapeType](x, y, tileSize, flipH, flipV);
      element.fill = color;

      // Add rotation if enabled
      if (rotation.enabled) {
        element.transform = `rotate(${rng.range(0, 360)} ${x} ${y})`;
      }

      elements.push(element);
    }
  }

  return elements;
}

// Pattern generators
export const patternGenerators = {
  gridCentered: generateCenteredGrid,
  
  grid: (config, rng) => {
    const elements = [];
    const { canvasSize, shapeSize, spacing, edgePadding, clipAtEdge, shapes: selectedShapes, colors, rotation } = config;
    
    // Calculate inner area (canvas minus edge padding)
    const innerWidth = canvasSize[0] - (edgePadding * 2);
    const innerHeight = canvasSize[1] - (edgePadding * 2);
    
    let actualShapeSize = shapeSize;
    let actualSpacing = spacing;
    let cellSize = shapeSize + spacing;
    
    // If clipAtEdge is false, scale down to fit perfectly within inner area
    if (!clipAtEdge && edgePadding > 0) {
      // Calculate how many complete cells fit
      const cols = Math.floor(innerWidth / cellSize);
      const rows = Math.floor(innerHeight / cellSize);
      
      if (cols > 0 && rows > 0) {
        // Calculate actual cell size that fits perfectly
        const actualCellSizeX = innerWidth / cols;
        const actualCellSizeY = innerHeight / rows;
        const actualCellSize = Math.min(actualCellSizeX, actualCellSizeY);
        
        // Calculate scale factor
        const scaleFactor = actualCellSize / cellSize;
        
        // Scale shapeSize and spacing proportionally
        actualShapeSize = shapeSize * scaleFactor;
        actualSpacing = spacing * scaleFactor;
        cellSize = actualShapeSize + actualSpacing;
      }
    }
    
    // Use Math.ceil when clipping, Math.floor when not clipping
    const cols = clipAtEdge ? Math.ceil(innerWidth / cellSize) : Math.floor(innerWidth / cellSize);
    const rows = clipAtEdge ? Math.ceil(innerHeight / cellSize) : Math.floor(innerHeight / cellSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Position at exact pixel coordinates: center of cell, offset by edgePadding
        const x = Math.round(edgePadding + col * cellSize + actualShapeSize / 2);
        const y = Math.round(edgePadding + row * cellSize + actualShapeSize / 2);
        
        const shapeType = rng.choice(selectedShapes);
        const color = rng.choice(colors);
        
        // Use actualShapeSize (scaled if needed)
        const element = shapes[shapeType](x, y, actualShapeSize);
        element.fill = color;
        
        if (rotation.enabled) {
          element.transform = `rotate(${rng.range(0, 360)} ${x} ${y})`;
        }
        
        elements.push(element);
      }
    }

    return elements;
  },


  brick: (config, rng) => {
    const elements = [];
    const { canvasSize, shapeSize, spacing, edgePadding, clipAtEdge, shapes: selectedShapes, colors, rotation } = config;
    
    // Calculate inner area (canvas minus edge padding)
    const innerWidth = canvasSize[0] - (edgePadding * 2);
    const innerHeight = canvasSize[1] - (edgePadding * 2);
    
    let actualShapeSize = shapeSize;
    let actualSpacing = spacing;
    let cellSize = shapeSize + spacing;
    
    // If clipAtEdge is false, scale down to fit perfectly within inner area
    if (!clipAtEdge && edgePadding > 0) {
      // For brick pattern, calculate based on rows (more complex due to offset)
      const rows = Math.floor(innerHeight / cellSize);
      
      if (rows > 0) {
        // Calculate actual cell size that fits perfectly in height
        const actualCellSizeY = innerHeight / rows;
        
        // For width, account for offset rows
        const avgOffset = cellSize / 4; // Average offset per row
        const effectiveWidth = innerWidth - avgOffset;
        const cols = Math.floor(effectiveWidth / cellSize);
        
        if (cols > 0) {
          const actualCellSizeX = effectiveWidth / cols;
          const actualCellSize = Math.min(actualCellSizeY, actualCellSizeX);
          
          // Calculate scale factor
          const scaleFactor = actualCellSize / cellSize;
          
          // Scale shapeSize and spacing proportionally
          actualShapeSize = shapeSize * scaleFactor;
          actualSpacing = spacing * scaleFactor;
          cellSize = actualShapeSize + actualSpacing;
        }
      }
    }
    
    // Use Math.ceil when clipping, Math.floor when not clipping
    const rows = clipAtEdge ? Math.ceil(innerHeight / cellSize) : Math.floor(innerHeight / cellSize);

    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 1 ? cellSize / 2 : 0;
      const cols = clipAtEdge ? Math.ceil((innerWidth + offset) / cellSize) : Math.floor((innerWidth + offset) / cellSize);
      
      for (let col = 0; col < cols; col++) {
        // Position at exact pixel coordinates: center of cell, offset by edgePadding
        const x = Math.round(edgePadding + col * cellSize + actualShapeSize / 2 + offset);
        const y = Math.round(edgePadding + row * cellSize + actualShapeSize / 2);
        
        // Check bounds within inner area
        if (x > edgePadding + innerWidth || y > edgePadding + innerHeight) continue;
        
        const shapeType = rng.choice(selectedShapes);
        const color = rng.choice(colors);
        
        // Use actualShapeSize (scaled if needed)
        const element = shapes[shapeType](x, y, actualShapeSize);
        element.fill = color;
        
        if (rotation.enabled) {
          element.transform = `rotate(${rng.range(0, 360)} ${x} ${y})`;
        }
        
        elements.push(element);
      }
    }

    return elements;
  }
};


// Main pattern generation function
export function generatePattern(config) {
  const rng = new SeededRandom(config.seed);
  const generator = patternGenerators[config.patternType];
  
  if (!generator) {
    throw new Error(`Unknown pattern type: ${config.patternType}`);
  }
  
  // Use all selected shapes directly
  return generator(config, rng);
}

// Convert pattern elements to SVG string
export function patternToSVG(elements, canvasSize, backgroundColor) {
  const [width, height] = canvasSize;
  
  const svgElements = elements.map(el => {
    const attrs = Object.entries(el.attrs)
      .map(([key, value]) => `${key}="${String(value)}"`)
      .join(' ');
    
    const fill = el.fill ? `fill="${el.fill}"` : '';
    const transform = el.transform ? `transform="${el.transform}"` : '';
    
    return `<${el.type} ${attrs} ${fill} ${transform} />`;
  }).join('\n  ');

  // Ensure backgroundColor is a valid color string
  const bgColor = backgroundColor || '#ffffff';
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}" />
  ${svgElements}
</svg>`;
}

// Export pattern as PNG (using canvas)
export async function patternToPNG(svgString, scale = 1) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/png');
    };
    
    img.onerror = reject;
    img.src = url;
  });
}
