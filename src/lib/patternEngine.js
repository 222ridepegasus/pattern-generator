/**
 * Pattern Engine V2 - Clean & Minimal
 * Loads 2-color SVG shapes and applies theme colors
 */

/**
 * Load an SVG file and replace colors
 * @param {string} shapeId - Shape identifier (e.g., 'nautical_a_01')
 * @param {string} bgColor - Background color (hex)
 * @param {string} fgColor - Foreground color (hex)
 * @returns {Promise<string>} - SVG content with colors replaced
 */
export async function loadShapeWithColors(shapeId, bgColor, fgColor) {
    // Determine shape category from ID
    let category = 'nautical';
    if (shapeId.startsWith('circle_') || shapeId.startsWith('square_') || shapeId.startsWith('triangle_')) {
      category = 'primitives';
    } else if (shapeId.startsWith('block33_')) {
      category = 'blocks33';
    }
    
    // Load SVG file
    const svgPath = `/shapes/${category}/${shapeId}.svg`;
    console.log(`[loadShapeWithColors] Loading SVG from: ${svgPath}`);
    const response = await fetch(svgPath);
    
    if (!response.ok) {
      console.error(`[loadShapeWithColors] Failed to load shape: ${shapeId}`, {
        status: response.status,
        statusText: response.statusText,
        path: svgPath
      });
      throw new Error(`Failed to load shape: ${shapeId} (${response.status} ${response.statusText})`);
    }
    
    let svgContent = await response.text();
    
    // Replace template colors with theme colors
    // Replace white/light colors with background color
    svgContent = svgContent.replace(/fill="#[fF]{6}"/g, `fill="${bgColor}"`);
    svgContent = svgContent.replace(/fill="#[fF]{3}"/g, `fill="${bgColor}"`);
    svgContent = svgContent.replace(/fill="white"/gi, `fill="${bgColor}"`);
    // Also replace style attributes
    svgContent = svgContent.replace(/style="fill:white([^"]*)"/gi, `style="fill:${bgColor}$1"`);
    svgContent = svgContent.replace(/style='fill:white([^']*)'/gi, `style='fill:${bgColor}$1'`);
    
    // Replace black/dark colors with foreground color
    svgContent = svgContent.replace(/fill="#000000"/g, `fill="${fgColor}"`);
    svgContent = svgContent.replace(/fill="#000"/g, `fill="${fgColor}"`);
    svgContent = svgContent.replace(/fill="black"/gi, `fill="${fgColor}"`);
    // Also replace style attributes
    svgContent = svgContent.replace(/style="fill:black([^"]*)"/gi, `style="fill:${fgColor}$1"`);
    svgContent = svgContent.replace(/style='fill:black([^']*)'/gi, `style='fill:${fgColor}$1'`);
    
    return svgContent;
  }
  
  /**
   * Calculate grid layout
   */
  export function calculatePatternLayout(config) {
    const {
      containerSize,
      borderPadding = 0,
      lineSpacing = 0,
      gridSize = 4,
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
  
  /**
   * Generate pattern from cell data
   * @param {Object} config - Pattern configuration
   * @param {Array} cells - Array of cell data: {row, col, shapeId, bgColorIndex, fgColorIndex}
   * @returns {Promise<Array>} - Array of positioned SVG elements
   */
  export async function generatePattern(config, cells) {
    const {
      containerSize,
      borderPadding = 0,
      lineSpacing = 0,
      gridSize = 4,
      colors = ['#FFFFFF', '#000000'],
    } = config;
  
    const layout = calculatePatternLayout({
      containerSize,
      borderPadding,
      lineSpacing,
      gridSize,
    });
  
    const { tileSize, offsetX, offsetY } = layout;
    const elements = [];
  
    // Process each cell
    for (const cell of cells) {
      if (!cell || !cell.shapeId) continue;
  
      const { row, col, shapeId, bgColorIndex = 0, fgColorIndex = 1 } = cell;
  
      // Get colors from theme
      const bgColor = colors[bgColorIndex] || colors[0];
      const fgColor = colors[fgColorIndex] || colors[1];
  
      // Load shape with colors
      const svgContent = await loadShapeWithColors(shapeId, bgColor, fgColor);
  
      // Calculate position
      const x = offsetX + (col * (tileSize + lineSpacing));
      const y = offsetY + (row * (tileSize + lineSpacing));

      // Parse SVG and extract inner elements
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      if (svgElement) {
        // Get original SVG size from viewBox or width/height (default to 64x64)
        const viewBox = svgElement.getAttribute('viewBox');
        let svgWidth = 64;
        let svgHeight = 64;
        
        if (viewBox) {
          const [, , w, h] = viewBox.split(/\s+|,/).map(parseFloat);
          svgWidth = w || 64;
          svgHeight = h || 64;
        } else {
          svgWidth = parseFloat(svgElement.getAttribute('width')) || 64;
          svgHeight = parseFloat(svgElement.getAttribute('height')) || 64;
        }
        
        // Calculate scale to fit tileSize (maintain aspect ratio)
        const scale = tileSize / Math.max(svgWidth, svgHeight);
        
        // Calculate tile center position
        const tileCenterX = x + (tileSize / 2);
        const tileCenterY = y + (tileSize / 2);
        
        // SVG shapes are typically centered at (0,0) or have their origin at top-left
        // We need to translate to tile center, then scale, then offset by half the SVG size
        // Transform order: translate to center, scale, translate back by half SVG size
        const svgCenterX = svgWidth / 2;
        const svgCenterY = svgHeight / 2;
        
        // Create group element for positioning and scaling
        // Transform: translate to tile center, scale, then offset by negative SVG center
        const group = {
          type: 'g',
          attrs: {
            transform: `translate(${tileCenterX}, ${tileCenterY}) scale(${scale}) translate(${-svgCenterX}, ${-svgCenterY})`,
            'data-cell-key': `${row}_${col}`,
            'data-cell-index': (row * gridSize + col).toString(),
          },
          innerHTML: svgElement.innerHTML,
        };

        elements.push(group);
      }
    }
  
    return elements;
  }
  
  /**
   * Convert elements to SVG string
   */
  export function patternToSVG(elements, containerSize, backgroundColor = '#FFFFFF') {
    const [width, height] = containerSize;
  
    const svgElements = elements.map(el => {
      if (el.type === 'g') {
        const attrs = Object.entries(el.attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        return `<g ${attrs}>${el.innerHTML}</g>`;
      }
      return '';
    }).join('\n  ');
  
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${backgroundColor}" />
    ${svgElements}
  </svg>`;
  }
  
  /**
   * Export pattern as PNG
   */
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
  