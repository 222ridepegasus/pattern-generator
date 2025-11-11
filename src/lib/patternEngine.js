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
    if (!array || !Array.isArray(array) || array.length === 0) {
      throw new Error('Cannot choose from empty or invalid array');
    }
    return array[Math.floor(this.next() * array.length)];
  }
}

/**
 * Compress shape slots to fit within theme slot count
 * Uses seed-driven offset for deterministic variation when compression is needed
 * 
 * @param {number[]} shapeSlots - Array of slot numbers used by shape (e.g., [1, 3, 5])
 * @param {number} themeSlotCount - Number of slots in current theme
 * @param {number} seed - Seed value for deterministic offset
 * @returns {Object} - Mapping of original slots to new slots (e.g., {1: 1, 3: 2, 5: 3})
 */
function compressSlots(shapeSlots, themeSlotCount, seed) {
  // Validation: themeSlotCount must be > 0
  if (themeSlotCount === 0) {
    throw new Error('themeSlotCount must be greater than 0');
  }
  
  const uniqueSlots = [...new Set(shapeSlots)].sort((a, b) => a - b);
  const mapping = {};
  const maxSlot = Math.max(...uniqueSlots);
  
  // If all slots fit within theme (no slot number exceeds theme count), use direct mapping
  // Example: shape uses [1, 2, 3], theme has 5 colors → keep as [1, 2, 3]
  if (maxSlot <= themeSlotCount) {
    uniqueSlots.forEach((originalSlot) => {
      mapping[originalSlot] = originalSlot; // Direct 1:1 mapping
    });
    return mapping;
  }
  
  // If shape uses slots beyond theme count, compress and add offset for variety
  // Example: shape uses [1, 3, 5], theme has 2 colors → compress to [1, 2] with offset
  const offset = seed % themeSlotCount;
  
  uniqueSlots.forEach((originalSlot, index) => {
    const compressedSlot = index + 1;
    const finalSlot = ((offset + compressedSlot - 1) % themeSlotCount) + 1;
    mapping[originalSlot] = finalSlot;
  });
  
  return mapping;
}



// Calculate pattern layout based on new system
export function calculatePatternLayout(config) {
  const {
    containerSize,
    borderPadding = 0,
    lineSpacing = 0,
    gridSize = 4,
  } = config;

  // Validate containerSize
  if (!containerSize || !Array.isArray(containerSize) || containerSize.length < 2) {
    throw new Error('Invalid containerSize: must be an array [width, height]');
  }

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
    emptySpace = 0,
    shapes: selectedShapes,
    colors,
    rotation = { enabled: false }
  } = config;

  // Validate required arrays
  if (!selectedShapes || !Array.isArray(selectedShapes) || selectedShapes.length === 0) {
    throw new Error('Invalid shapes: must be a non-empty array');
  }
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    throw new Error('Invalid colors: must be a non-empty array');
  }

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
      // Check if this cell should be empty (deterministic based on seed)
      if (emptySpace > 0 && rng.next() * 100 < emptySpace) {
        // Skip this cell - don't render anything
        continue;
      }

      const x = offsetX + (col * (tileSize + lineSpacing)) + (tileSize / 2);
      const y = offsetY + (row * (tileSize + lineSpacing)) + (tileSize / 2);

      const shapeType = rng.choice(selectedShapes);

      // Check if this is a multi-slot shape (nautical flags)
      const isMultiSlotShape = shapeType.startsWith('nautical_');

      // Flip per cell - only for single-color shapes
      let flipH = 1;
      let flipV = 1;
      
      if (!isMultiSlotShape) {
        const preserveLayout = config.preserveLayout !== false; // Default to true

        if (config.mirror?.horizontal) {
          if (preserveLayout) {
            // Deterministic flip decision based on cell position and seed
            // This ensures same cell always has same flip state, preserving layout when mirroring is toggled
            const shouldFlipH = ((config.seed + row * gridSize + col) % 2 === 0);
            flipH = shouldFlipH ? -1 : 1;
          } else {
            // Random flip - can reorganize layout
            flipH = rng.next() > 0.5 ? -1 : 1;
          }
        }

        if (config.mirror?.vertical) {
          if (preserveLayout) {
            // Use different offset (+1) to get different pattern for vertical flips
            const shouldFlipV = ((config.seed + row * gridSize + col + 1) % 2 === 0);
            flipV = shouldFlipV ? -1 : 1;
          } else {
            // Random flip - can reorganize layout
            flipV = rng.next() > 0.5 ? -1 : 1;
          }
        }
      }

      // Generate shape - don't pass flip params for multi-slot shapes
      const shapeResult = isMultiSlotShape 
        ? shapes[shapeType](x, y, tileSize)
        : shapes[shapeType](x, y, tileSize, flipH, flipV);

      // For single-color shapes, use first theme color consistently
      // For multi-slot shapes, colors are assigned per-slot (no color pick needed)
      const isMultiSlot = Array.isArray(shapeResult);
      const color = isMultiSlot ? null : colors[0];

      // Handle multi-slot shapes (arrays of paths)
      if (Array.isArray(shapeResult)) {
        // Multi-slot shape with slot compression
        // Extract all slot numbers used by this shape
        const usedSlots = shapeResult.map(el => el.slot || 1);
        
        // Check if there's a color override for this shape type
        const shapeOverrides = config.shapeColorOverrides?.[shapeType];
        
        shapeResult.forEach((pathElement, elementIndex) => {
          const originalSlot = pathElement.slot || 1;
          let slotColor;
          
          // Skip _shuffleIndex property
          if (shapeOverrides && shapeOverrides[originalSlot] && originalSlot !== '_shuffleIndex') {
            // Use override color directly
            slotColor = shapeOverrides[originalSlot];
          } else {
            // Use normal slot compression logic
            // Use shape type as seed for consistent colors (not affected by layout refresh)
            // This ensures colors stay the same when refreshing layout
            const colorSeed = shapeType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const slotMapping = compressSlots(usedSlots, colors.length, colorSeed);
            const mappedSlot = slotMapping[originalSlot] || originalSlot;
            slotColor = colors[mappedSlot - 1] || colors[0];
          }
          
          // Create element with mapped slot color
          const element = {
            type: pathElement.type,
            attrs: {
              ...pathElement.attrs,
              // Add pointer-events and cursor for clickability
              style: `${pathElement.attrs.style || ''}; cursor: pointer;`.trim()
            },
            fill: slotColor,
            shapeType: shapeType, // Track which shape this element belongs to
            cellIndex: row * gridSize + col // Track which cell this is in
          };
          
          elements.push(element);
        });
      } else {
        // Single-color shape - use first theme color consistently
        shapeResult.fill = color;
        shapeResult.shapeType = shapeType; // Track shape type
        shapeResult.cellIndex = row * gridSize + col; // Track cell index
        
        if (rotation.enabled) {
          const rotationAngle = rng.range(0, 360);
          
          // Check if shape already has a transform in attrs (path-based shapes)
          if (shapeResult.attrs && shapeResult.attrs.transform) {
            // For shapes with transforms, we need to rotate around the center point (x, y)
            // Existing transform: translate(x, y) scale(...) translate(-32, -32)
            // To rotate around center: translate(x, y) rotate(angle) scale(...) translate(-32, -32)
            // SVG applies transforms right-to-left, so execution order is:
            // 1. translate(-32, -32) - centers shape at origin
            // 2. scale(...) - scales around origin
            // 3. rotate(angle) - rotates around origin (which is at x,y in final coords)
            // 4. translate(x, y) - positions at final location
            const existingTransform = shapeResult.attrs.transform;
            // Extract components
            const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
            const finalTranslateMatch = existingTransform.match(/translate\(-32, -32\)/);
            
            if (scaleMatch && finalTranslateMatch) {
              // To rotate around the shape's center (x, y):
              // Transform: translate(x, y) rotate(angle) scale(...) translate(-32, -32)
              // SVG applies right-to-left:
              //   1. translate(-32, -32) - centers shape
              //   2. scale(...) - scales
              //   3. rotate(angle) - rotates around origin (which becomes x,y after translate(x,y))
              //   4. translate(x, y) - positions at final location
              // Using rotate(angle) without center point rotates around (0,0) in current coord system
              // After translate(x,y), that (0,0) is at (x,y) in final coords - perfect!
              shapeResult.transform = `translate(${x}, ${y}) rotate(${rotationAngle}) ${scaleMatch[0]} ${finalTranslateMatch[0]}`;
            } else {
              // Fallback: append rotation with center point - this may cause offset
              // Try to extract x, y from the first translate if possible
              const firstTranslateMatch = existingTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
              if (firstTranslateMatch) {
                const tx = parseFloat(firstTranslateMatch[1]);
                const ty = parseFloat(firstTranslateMatch[2]);
                // Use the extracted x, y for rotation center
                shapeResult.transform = `${existingTransform} rotate(${rotationAngle} ${tx} ${ty})`;
              } else {
                // Last resort: use provided x, y
                shapeResult.transform = `${existingTransform} rotate(${rotationAngle} ${x} ${y})`;
              }
            }
            // Remove transform from attrs to avoid duplication in SVG output
            delete shapeResult.attrs.transform;
          } else {
            // No existing transform (circles, squares) - rotate around center point
            shapeResult.transform = `rotate(${rotationAngle} ${x} ${y})`;
          }
        }
        
        elements.push(shapeResult);
      }

      // Add border frame on top of all shapes for this tile (inset to render inside only)
      if (config.stroke?.enabled) {
        const strokeWidth = config.stroke.width;
        const inset = strokeWidth / 2; // Inset by half stroke width to keep border inside
        elements.push({
          type: 'rect',
          attrs: {
            x: x - tileSize / 2 + inset,
            y: y - tileSize / 2 + inset,
            width: tileSize - strokeWidth,
            height: tileSize - strokeWidth,
            fill: 'none',
            stroke: config.stroke.color,
            'stroke-width': config.stroke.width
          }
        });
      }

      // Add selection border rect for this cell (outside the cell, hidden by default)
      // This will be shown via CSS when the shape type is selected
      const cellIndex = row * gridSize + col;
      elements.push({
        type: 'rect',
        attrs: {
          x: x - tileSize / 2,
          y: y - tileSize / 2,
          width: tileSize,
          height: tileSize,
          fill: 'none',
          stroke: '#3b82f6',
          'stroke-width': 3,
          'data-selected-shape': shapeType,
          'data-cell-index': cellIndex,
          style: 'display: none;' // Hidden by default, shown via CSS when selected
        }
      });
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
        const color = colors[0]; // Use first theme color consistently
        
        // Use actualShapeSize (scaled if needed)
        const element = shapes[shapeType](x, y, actualShapeSize);
        element.fill = color;
        
        // Add rotation if enabled - handle both shapes with and without existing transforms
        if (rotation.enabled) {
          const rotationAngle = rng.range(0, 360);
          
          // Check if shape already has a transform in attrs (path-based shapes)
          if (element.attrs && element.attrs.transform) {
            // For shapes with transforms, we need to insert rotation in the right place
            // Existing transform: translate(x, y) scale(...) translate(-32, -32)
            // We want: translate(x, y) rotate(angle) scale(...) translate(-32, -32)
            // This rotates around the center point (x, y) after positioning
            const existingTransform = element.attrs.transform;
            // Parse and reconstruct: translate(x, y) + rotate + scale(...) + translate(-32, -32)
            // Extract the scale and final translate parts
            const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
            const finalTranslateMatch = existingTransform.match(/translate\(-32, -32\)/);
            
            if (scaleMatch && finalTranslateMatch) {
              // Reconstruct with rotation inserted after translate(x, y) but before scale
              element.transform = `translate(${x}, ${y}) rotate(${rotationAngle}) ${scaleMatch[0]} ${finalTranslateMatch[0]}`;
            } else {
              // Fallback: just append rotation (might cause issues but better than nothing)
              element.transform = `${existingTransform} rotate(${rotationAngle} ${x} ${y})`;
            }
            // Remove transform from attrs to avoid duplication in SVG output
            delete element.attrs.transform;
          } else {
            // No existing transform (circles, squares) - rotate around center point
            element.transform = `rotate(${rotationAngle} ${x} ${y})`;
          }
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
        const color = colors[0]; // Use first theme color consistently
        
        // Use actualShapeSize (scaled if needed)
        const element = shapes[shapeType](x, y, actualShapeSize);
        element.fill = color;
        
        // Add rotation if enabled - handle both shapes with and without existing transforms
        if (rotation.enabled) {
          const rotationAngle = rng.range(0, 360);
          
          // Check if shape already has a transform in attrs (path-based shapes)
          if (element.attrs && element.attrs.transform) {
            // For shapes with transforms, we need to insert rotation in the right place
            // Existing transform: translate(x, y) scale(...) translate(-32, -32)
            // We want: translate(x, y) rotate(angle) scale(...) translate(-32, -32)
            // This rotates around the center point (x, y) after positioning
            const existingTransform = element.attrs.transform;
            // Parse and reconstruct: translate(x, y) + rotate + scale(...) + translate(-32, -32)
            // Extract the scale and final translate parts
            const scaleMatch = existingTransform.match(/scale\([^)]+\)/);
            const finalTranslateMatch = existingTransform.match(/translate\(-32, -32\)/);
            
            if (scaleMatch && finalTranslateMatch) {
              // Reconstruct with rotation inserted after translate(x, y) but before scale
              element.transform = `translate(${x}, ${y}) rotate(${rotationAngle}) ${scaleMatch[0]} ${finalTranslateMatch[0]}`;
            } else {
              // Fallback: just append rotation (might cause issues but better than nothing)
              element.transform = `${existingTransform} rotate(${rotationAngle} ${x} ${y})`;
            }
            // Remove transform from attrs to avoid duplication in SVG output
            delete element.attrs.transform;
          } else {
            // No existing transform (circles, squares) - rotate around center point
            element.transform = `rotate(${rotationAngle} ${x} ${y})`;
          }
        }
        
        elements.push(element);
      }
    }

    return elements;
  }
};


// Main pattern generation function
export function generatePattern(config) {
  // Validate config
  if (!config) {
    throw new Error('Config is required');
  }
  
  if (typeof config.seed !== 'number') {
    throw new Error('Invalid seed: must be a number');
  }
  
  if (!config.patternType) {
    throw new Error('Pattern type is required');
  }
  
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
  // Validate canvasSize
  if (!canvasSize || !Array.isArray(canvasSize) || canvasSize.length < 2) {
    throw new Error('Invalid canvasSize: must be an array [width, height]');
  }
  
  const [width, height] = canvasSize;
  
  const svgElements = elements.map(el => {
    // Separate style from other attrs
    const styleValue = el.attrs?.style;
    const attrsWithoutStyle = { ...el.attrs };
    if (styleValue) {
      delete attrsWithoutStyle.style;
    }
    
    const attrs = Object.entries(attrsWithoutStyle)
      .map(([key, value]) => `${key}="${String(value)}"`)
      .join(' ');
    
    const fill = el.fill ? `fill="${el.fill}"` : '';
    const transform = el.transform ? `transform="${el.transform}"` : '';
    const style = styleValue ? `style="${styleValue}"` : '';
    
    // Add data attributes for click detection
    const dataAttrs = [];
    if (el.shapeType) {
      dataAttrs.push(`data-shape-type="${el.shapeType}"`);
    }
    if (el.cellIndex !== undefined) {
      dataAttrs.push(`data-cell-index="${el.cellIndex}"`);
    }
    // Handle selection border rects
    if (el.attrs && el.attrs['data-selected-shape']) {
      dataAttrs.push(`data-selected-shape="${el.attrs['data-selected-shape']}"`);
    }
    if (el.attrs && el.attrs['data-cell-index'] !== undefined && !el.cellIndex) {
      dataAttrs.push(`data-cell-index="${el.attrs['data-cell-index']}"`);
    }
    const dataAttrString = dataAttrs.length > 0 ? ' ' + dataAttrs.join(' ') : '';
    
    // Add class for styling
    const classAttr = el.shapeType ? ` class="shape-element"` : '';
    
    return `<${el.type} ${attrs} ${fill} ${transform}${classAttr} ${style}${dataAttrString} />`;
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