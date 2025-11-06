/**
 * Pattern Engine - Core logic for generating patterns
 * Pure JavaScript, framework-agnostic
 */

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

// Shape generators - returns SVG path data or elements
export const shapes = {
  circle: (x, y, size) => ({
    type: 'circle',
    attrs: { cx: x, cy: y, r: size / 2 }
  }),

  square: (x, y, size) => ({
    type: 'rect',
    attrs: { 
      x: Math.round(x - size / 2), 
      y: Math.round(y - size / 2), 
      width: Math.round(size), 
      height: Math.round(size) 
    }
  }),

  triangle: (x, y, size) => {
    // Make triangle fill the square cell by using full size for both dimensions
    const halfSize = size / 2;
    const points = [
      [Math.round(x), Math.round(y - halfSize)],           // Top point
      [Math.round(x - halfSize), Math.round(y + halfSize)], // Bottom left
      [Math.round(x + halfSize), Math.round(y + halfSize)]  // Bottom right
    ];
    return {
      type: 'polygon',
      attrs: { points: points.map(p => p.join(',')).join(' ') }
    };
  },

  hexagon: (x, y, size) => {
    const angle = Math.PI / 3;
    const points = [];
    for (let i = 0; i < 6; i++) {
      const px = x + (size / 2) * Math.cos(angle * i);
      const py = y + (size / 2) * Math.sin(angle * i);
      points.push([px, py]);
    }
    return {
      type: 'polygon',
      attrs: { points: points.map(p => p.join(',')).join(' ') }
    };
  },

  diamond: (x, y, size) => {
    const points = [
      [x, y - size / 2],
      [x + size / 2, y],
      [x, y + size / 2],
      [x - size / 2, y]
    ];
    return {
      type: 'polygon',
      attrs: { points: points.map(p => p.join(',')).join(' ') }
    };
  },

  roundedSquare: (x, y, size) => ({
    type: 'rect',
    attrs: {
      x: Math.round(x - size / 2),
      y: Math.round(y - size / 2),
      width: Math.round(size),
      height: Math.round(size),
      rx: Math.round(size * 0.2)
    }
  })
};

// Pattern generators
export const patternGenerators = {
  grid: (config, rng) => {
    const elements = [];
    const { canvasSize, scale, spacing, shapes: selectedShapes, colors, rotation } = config;
    
    const baseSize = 50 * scale;
    const cellSize = baseSize + spacing;
    // Add tiny overlap when spacing is 0 to prevent rendering gaps
    const overlap = spacing === 0 ? 0.5 : 0;
    const shapeSize = baseSize + overlap;
    // Use Math.ceil to ensure canvas is fully covered (shapes may extend beyond, will be cropped by viewBox)
    const cols = Math.ceil(canvasSize[0] / cellSize);
    const rows = Math.ceil(canvasSize[1] / cellSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Round positions to avoid sub-pixel rendering issues
        const x = Math.round(col * cellSize + cellSize / 2);
        const y = Math.round(row * cellSize + cellSize / 2);
        
        const shapeType = rng.choice(selectedShapes);
        const color = rng.choice(colors);
        
        const element = shapes[shapeType](x, y, shapeSize);
        element.fill = color;
        
        if (rotation.enabled) {
          element.transform = `rotate(${rng.range(0, 360)} ${x} ${y})`;
        }
        
        elements.push(element);
      }
    }

    return elements;
  },

  // Scatter pattern - DISABLED for performance (can be re-enabled later)
  // scatter: (config, rng) => {
  //   const elements = [];
  //   const { canvasSize, scale, spacing, shapes: selectedShapes, colors } = config;
  //   
  //   const density = 1 / (scale * 2);
  //   const count = Math.floor(canvasSize[0] * canvasSize[1] * density);

  //   for (let i = 0; i < count; i++) {
  //     const x = rng.range(0, canvasSize[0]);
  //     const y = rng.range(0, canvasSize[1]);
  //     
  //     const shapeType = rng.choice(selectedShapes);
  //     const color = rng.choice(colors);
  //     const shapeSize = rng.range(20, 60) * scale;
  //     
  //     const element = shapes[shapeType](x, y, shapeSize);
  //     element.fill = color;
  //     element.transform = `rotate(${rng.range(0, 360)} ${x} ${y})`;
  //     
  //     elements.push(element);
  //   }

  //   return elements;
  // },

  brick: (config, rng) => {
    const elements = [];
    const { canvasSize, scale, spacing, shapes: selectedShapes, colors, rotation } = config;
    
    const baseSize = 50 * scale;
    const cellSize = baseSize + spacing;
    // Add tiny overlap when spacing is 0 to prevent rendering gaps
    const overlap = spacing === 0 ? 0.5 : 0;
    const shapeSize = baseSize + overlap;
    // Use Math.ceil to ensure canvas is fully covered (shapes may extend beyond, will be cropped by viewBox)
    const rows = Math.ceil(canvasSize[1] / cellSize);

    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 1 ? cellSize / 2 : 0;
      const cols = Math.ceil((canvasSize[0] + offset) / cellSize);
      
      for (let col = 0; col < cols; col++) {
        // Round positions to avoid sub-pixel rendering issues
        const x = Math.round(col * cellSize + cellSize / 2 + offset);
        const y = Math.round(row * cellSize + cellSize / 2);
        
        if (x > canvasSize[0] || y > canvasSize[1]) continue;
        
        const shapeType = rng.choice(selectedShapes);
        const color = rng.choice(colors);
        
        const element = shapes[shapeType](x, y, shapeSize);
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

// Calculate canvas size from aspect ratio
export function calculateCanvasSize(aspectRatio, maxSize = 2400) {
  // Parse aspect ratio string (e.g., "16:9" → width: 16, height: 9)
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  const ratio = widthRatio / heightRatio;
  
  let width, height;
  
  if (ratio >= 1) {
    // Landscape or square: width is the longest side
    width = maxSize;
    height = Math.round(maxSize / ratio);
  } else {
    // Portrait: height is the longest side
    height = maxSize;
    width = Math.round(maxSize * ratio);
  }
  
  return [width, height];
}

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
