import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_CONFIG, COLOR_PALETTES } from '../lib/types';
import type { PatternConfig, ShapeType } from '../lib/types';
// @ts-ignore
import { generatePattern, patternToSVG, calculatePatternLayout } from '../lib/patternEngine';
import { availableShapes } from '../lib/shapeLoader.js';
import ShapeSelector from './ShapeSelector';
import ColorPickers from './ColorPickers';
import PaletteSelector from './PaletteSelector';

/**
 * Generate a random config for page load
 */
function generateRandomConfig(): PatternConfig {
  // 2. Pick nautical shapes (primitives and blocks are disabled)
  const nauticalShapes: ShapeType[] = availableShapes.nautical as ShapeType[];
  const numShapes = Math.floor(Math.random() * 10) + 5; // 5-14 shapes
  const shuffled = [...nauticalShapes].sort(() => Math.random() - 0.5);
  const shapes = shuffled.slice(0, numShapes);
  
  // 3. Pick from one of the preset color palettes
  const paletteNames = Object.keys(COLOR_PALETTES);
  const randomPaletteName = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  const colors = [...COLOR_PALETTES[randomPaletteName as keyof typeof COLOR_PALETTES]];
  
  // 1. Use slot_1 (first color) from selected theme as background color
  const backgroundColor = colors[0] || '#ffffff';
  
  // 4. Randomize mirroring: none, vertical, horizontal, or both
  const mirrorOptions = [
    { horizontal: false, vertical: false },
    { horizontal: false, vertical: true },
    { horizontal: true, vertical: false },
    { horizontal: true, vertical: true },
  ];
  const mirror = mirrorOptions[Math.floor(Math.random() * mirrorOptions.length)];
  
  // 5. Randomize grid size between 4×4 and 6×6
  const gridSize = Math.floor(Math.random() * 3) + 4; // 4-6
  
  // 6. Randomize border padding: 16, 24, or 32
  const borderPaddingOptions = [16, 24, 32];
  const borderPadding = borderPaddingOptions[Math.floor(Math.random() * borderPaddingOptions.length)];
  
  // 7. Randomize line spacing: 16, 24, or 32
  const lineSpacingOptions = [16, 24, 32];
  const lineSpacing = lineSpacingOptions[Math.floor(Math.random() * lineSpacingOptions.length)];
  
  return {
    seed: Date.now(),
    patternType: 'gridCentered',
    containerSize: [800, 800],
    gridSize,
    borderPadding,
    lineSpacing,
    emptySpace: 0, // Always start with no empty space
    spacing: 0,
    backgroundColor,
    shapes,
    colors,
    rotation: {
      enabled: false,
    },
    mirror,
    preserveLayout: true,
    stroke: {
      enabled: false,
      width: 1,
      color: '#000000'
    },
  };
}

/**
 * Main Pattern Generator Component
 * This is a stub - Cursor will build this out with full functionality
 */
export default function PatternGenerator() {
  const initialConfig = generateRandomConfig();
  const [config, setConfig] = useState<PatternConfig>(initialConfig);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showSvgMenu, setShowSvgMenu] = useState(false);
  const [seedInput, setSeedInput] = useState<string>('');
  const [seedCopied, setSeedCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return saved === 'true';
      }
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [selectedShape, setSelectedShape] = useState<{shapeType: ShapeType, x: number, y: number, cellIndex?: number} | null>(null);
  const [syncBackgroundColor, setSyncBackgroundColor] = useState(true); // Default to synced
  const [draggedShape, setDraggedShape] = useState<ShapeType | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // Track selected cells as "row_col" keys
  const [swapAnimation, setSwapAnimation] = useState<Array<{from: string, to: string}> | null>(null); // Track swap animations
  const [isDraggingFromGrid, setIsDraggingFromGrid] = useState(false);
  const [draggedCellKey, setDraggedCellKey] = useState<string | null>(null);
  const [marqueeSelection, setMarqueeSelection] = useState<{
    start: {x: number, y: number} | null;
    end: {x: number, y: number} | null;
    active: boolean;
  }>({ start: null, end: null, active: false });
  const marqueeSelectionRef = useRef<{
    start: {x: number, y: number} | null;
    end: {x: number, y: number} | null;
    active: boolean;
  }>({ start: null, end: null, active: false });
  const dragStartedRef = useRef(false); // Track if dragstart fired to prevent click selection
  const occupiedCellsRef = useRef<Set<string>>(new Set()); // Track which cells have shapes
  const [shapesInPattern, setShapesInPattern] = useState<Set<ShapeType>>(new Set()); // Track which shapes are in the current pattern
  const randomPatternRef = useRef<Map<string, string>>(new Map()); // Cache random pattern: cellKey -> shapeId
  const randomPatternSeedRef = useRef<number | null>(null); // Track seed used for cached pattern
  const randomPatternConfigRef = useRef<string>(''); // Track config hash for cached pattern
  const configRef = useRef<PatternConfig>(config); // Store latest config for event handlers
  const [cellTransforms, setCellTransforms] = useState<Record<string, { rotation: number, flipH: boolean, flipV: boolean }>>({}); // Per-cell transforms: rotation (degrees), flipH, flipV
  const [clipboard, setClipboard] = useState<{
    shapes: Array<{ cellKey: string, shapeType: ShapeType | '__DELETED__' | null, transform?: { rotation: number, flipH: boolean, flipV: boolean } }>;
    isCut: boolean;
  } | null>(null); // Clipboard for copy/cut/paste
  
  // Keep configRef in sync
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Keep marqueeSelectionRef in sync
  useEffect(() => {
    marqueeSelectionRef.current = marqueeSelection;
  }, [marqueeSelection]);
  
  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);
  
  // Initialize dark mode on mount (sync with script in Layout.astro)
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const shouldBeDark = saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (shouldBeDark !== darkMode) {
      setDarkMode(shouldBeDark);
    }
  }, []);
  
  // Handle clicks outside canvas to deselect
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't clear if clicking on toolbar
      if (target.closest('.shape-toolbar')) {
        return;
      }
      
      // Check if click is outside the canvas container
      const canvasContainer = document.querySelector('[data-canvas-container="true"]');
      if (canvasContainer && !canvasContainer.contains(target)) {
        // Click is outside canvas - clear selections
        // But don't clear if clicking in sidebar areas (they're outside canvas but shouldn't deselect)
        const isInSidebar = target.closest('.bg-gray-50.border-r') || target.closest('.bg-gray-50.border-l') ||
                           target.closest('.dark\\:bg-gray-800.border-r') || target.closest('.dark\\:bg-gray-800.border-l');
        if (!isInSidebar) {
          setSelectedShape(null);
          setSelectedCells(new Set());
        }
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  
  // Undo/Redo system
  const [history, setHistory] = useState<PatternConfig[]>([initialConfig]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const MAX_HISTORY = 20;
  const isUndoRedoRef = useRef(false); // Track if we're doing undo/redo to avoid adding to history
  const prevConfigRef = useRef<PatternConfig>(initialConfig); // Track previous config to detect changes
  const historyIndexRef = useRef<number>(0); // Track history index in ref to avoid dependency issues

  // Track config changes and add to history (unless it's an undo/redo operation)
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      prevConfigRef.current = config;
      historyIndexRef.current = historyIndex;
      return; // Don't add undo/redo operations to history
    }

    // Only add to history if config actually changed (not just a re-render)
    const configChanged = JSON.stringify(prevConfigRef.current) !== JSON.stringify(config);
    if (!configChanged) {
      return;
    }

    prevConfigRef.current = config;

    // Add current config to history
    setHistory(prev => {
      const currentIndex = historyIndexRef.current;
      const newHistory = prev.slice(0, currentIndex + 1); // Remove any "future" history if we're not at the end
      newHistory.push(JSON.parse(JSON.stringify(config))); // Deep copy
      
      // Limit to MAX_HISTORY
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift(); // Remove oldest
        const newIndex = MAX_HISTORY - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        return newHistory;
      }
      
      const newIndex = newHistory.length - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      return newHistory;
    });
  }, [config]);

  // Add CSS for selected shape highlighting and drag feedback
  useEffect(() => {
    const styleId = 'shape-selection-style';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    let styleContent = '';
    
        // Selected shape highlighting
        if (selectedShape) {
      const selectedCellIndex = selectedShape.cellIndex !== undefined ? selectedShape.cellIndex.toString() : '';
      if (selectedCellIndex) {
        styleContent += `
          @keyframes pulseBorder {
            0%, 100% {
              stroke-opacity: 1;
              opacity: 1;
            }
            50% {
              stroke-opacity: 0.85;
              opacity: 0.85;
            }
          }
          svg [data-selected-shape="${selectedShape.shapeType}"][data-cell-index="${selectedCellIndex}"] {
            display: block !important;
            stroke: #3b82f6 !important;
            stroke-width: 7px !important;
            fill: none !important;
            animation: pulseBorder 2s ease-in-out infinite !important;
          }
        `;
      }
    }
    
    styleElement.textContent = styleContent;
    
    return () => {
      if (styleElement && !selectedShape) {
        styleElement.textContent = '';
      }
    };
  }, [selectedShape]);

  // Inject drag-overlay rectangles into SVG when dragging
  useEffect(() => {
    if (!svgContent || !dragOverCell) {
      // Remove all overlay rects when not dragging
      const svg = document.querySelector('[data-svg-container] svg');
      if (svg) {
        const overlays = svg.querySelectorAll('[data-drag-overlay], [data-drag-overlay-cell]');
        overlays.forEach(el => el.remove());
      }
      return;
    }

    const container = document.querySelector('[data-svg-container]') as HTMLElement;
    if (!container) return;
    
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Calculate layout
    const layout = calculatePatternLayout({
      containerSize: config.containerSize,
      borderPadding: config.borderPadding,
      lineSpacing: config.lineSpacing,
      gridSize: config.gridSize,
    });

    const { tileSize, offsetX, offsetY } = layout;
    const cellWidth = tileSize + config.lineSpacing;
    const cellHeight = tileSize + config.lineSpacing;
    const cellKey = `${dragOverCell.row}_${dragOverCell.col}`;
    const isOccupied = occupiedCellsRef.current.has(cellKey);

    // Remove existing overlays
    const existingOverlays = svg.querySelectorAll('[data-drag-overlay], [data-drag-overlay-cell]');
    existingOverlays.forEach(el => el.remove());

    // Create overlay group
    let overlayGroup = svg.querySelector('[data-drag-overlay-group]') as SVGGElement;
    if (!overlayGroup) {
      overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      overlayGroup.setAttribute('data-drag-overlay-group', 'true');
      overlayGroup.setAttribute('style', 'pointer-events: none;');
      svg.appendChild(overlayGroup);
    }

    // Add faint white borders on all cells
    for (let row = 0; row < config.gridSize; row++) {
      for (let col = 0; col < config.gridSize; col++) {
        const x = offsetX + (col * cellWidth);
        const y = offsetY + (row * cellHeight);
        const currentCellKey = `${row}_${col}`;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('data-drag-overlay', currentCellKey);
        rect.setAttribute('x', x.toString());
        rect.setAttribute('y', y.toString());
        rect.setAttribute('width', tileSize.toString());
        rect.setAttribute('height', tileSize.toString());
        rect.setAttribute('stroke', '#ffffff');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('stroke-opacity', '0.3');
        rect.setAttribute('fill', 'none');
        overlayGroup.appendChild(rect);
      }
    }

    // Highlight the drag-over cell (red if occupied, white if empty)
    const x = offsetX + (dragOverCell.col * cellWidth);
    const y = offsetY + (dragOverCell.row * cellHeight);
    
    const highlightRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlightRect.setAttribute('data-drag-overlay-cell', cellKey);
    highlightRect.setAttribute('x', x.toString());
    highlightRect.setAttribute('y', y.toString());
    highlightRect.setAttribute('width', tileSize.toString());
    highlightRect.setAttribute('height', tileSize.toString());
    highlightRect.setAttribute('stroke', isOccupied ? '#ef4444' : '#ffffff');
    highlightRect.setAttribute('stroke-width', isOccupied ? '3' : '2');
    highlightRect.setAttribute('stroke-opacity', isOccupied ? '0.9' : '0.6');
    highlightRect.setAttribute('fill', 'none');
    overlayGroup.appendChild(highlightRect);

    return () => {
      // Cleanup: remove overlays when component unmounts or dragOverCell changes
      const overlays = svg.querySelectorAll('[data-drag-overlay], [data-drag-overlay-cell]');
      overlays.forEach(el => el.remove());
    };
  }, [dragOverCell, svgContent, config.containerSize, config.borderPadding, config.lineSpacing, config.gridSize]);

  // Inject selection border overlay when cells are selected
  useEffect(() => {
    if (!svgContent || selectedCells.size === 0) {
      // Remove selection overlays when nothing is selected
      const svg = document.querySelector('[data-svg-container] svg');
      if (svg) {
        const selectionOverlays = svg.querySelectorAll('[data-selection-overlay]');
        selectionOverlays.forEach(el => el.remove());
      }
      return;
    }

    const container = document.querySelector('[data-svg-container]') as HTMLElement;
    if (!container) return;
    
    const svg = container.querySelector('svg');
    if (!svg) return;

    // Calculate layout
    const layout = calculatePatternLayout({
      containerSize: config.containerSize,
      borderPadding: config.borderPadding,
      lineSpacing: config.lineSpacing,
      gridSize: config.gridSize,
    });

    const { tileSize, offsetX, offsetY } = layout;
    const cellWidth = tileSize + config.lineSpacing;
    const cellHeight = tileSize + config.lineSpacing;

    // Remove existing selection overlays
    const existingOverlays = svg.querySelectorAll('[data-selection-overlay]');
    existingOverlays.forEach(el => el.remove());

    // Create overlay group if it doesn't exist
    let overlayGroup = svg.querySelector('[data-selection-overlay-group]') as SVGGElement;
    if (!overlayGroup) {
      overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      overlayGroup.setAttribute('data-selection-overlay-group', 'true');
      overlayGroup.setAttribute('style', 'pointer-events: none;');
      svg.appendChild(overlayGroup);
    }

    // Add blue border for each selected cell
    selectedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('_').map(Number);
      const x = offsetX + (col * cellWidth);
      const y = offsetY + (row * cellHeight);
      
      const selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selectionRect.setAttribute('data-selection-overlay', cellKey);
      selectionRect.setAttribute('x', x.toString());
      selectionRect.setAttribute('y', y.toString());
      selectionRect.setAttribute('width', tileSize.toString());
      selectionRect.setAttribute('height', tileSize.toString());
      selectionRect.setAttribute('stroke', '#3b82f6'); // blue-600
      selectionRect.setAttribute('stroke-width', '4');
      selectionRect.setAttribute('stroke-opacity', '1');
      selectionRect.setAttribute('fill', 'none');
      overlayGroup.appendChild(selectionRect);
    });

    return () => {
      // Cleanup on unmount
      const svg = document.querySelector('[data-svg-container] svg');
      if (svg) {
        const selectionOverlays = svg.querySelectorAll('[data-selection-overlay]');
        selectionOverlays.forEach(el => el.remove());
      }
    };
  }, [selectedCells, svgContent, config.containerSize, config.borderPadding, config.lineSpacing, config.gridSize]);

  // Draw marquee selection overlay on canvas (outside SVG so it's visible everywhere)
  useEffect(() => {
    if (!marqueeSelection.active || !marqueeSelection.start || !marqueeSelection.end) {
      // Cleanup marquee overlay
      const overlay = document.querySelector('[data-marquee-canvas-overlay]');
      if (overlay) overlay.remove();
      return;
    }

    // Find the canvas container
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
    if (!canvasContainer) return;
    
    // Get SVG element to convert coordinates
    const svgElement = canvasContainer.querySelector('[data-svg-container] svg') as SVGSVGElement | null;
    if (!svgElement) return;

    const svgRect = svgElement.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();
    const svgViewBox = svgElement.viewBox.baseVal;
    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;
    
    // Convert SVG viewBox coordinates to screen coordinates
    const startX = marqueeSelection.start.x;
    const startY = marqueeSelection.start.y;
    const endX = marqueeSelection.end.x;
    const endY = marqueeSelection.end.y;
    
    // Convert from SVG viewBox space to screen pixel space
    const startScreenX = svgRect.left + (startX / svgViewBox.width) * svgWidth;
    const startScreenY = svgRect.top + (startY / svgViewBox.height) * svgHeight;
    const endScreenX = svgRect.left + (endX / svgViewBox.width) * svgWidth;
    const endScreenY = svgRect.top + (endY / svgViewBox.height) * svgHeight;
    
    // Normalize rectangle
    const x = Math.min(startScreenX, endScreenX);
    const y = Math.min(startScreenY, endScreenY);
    const width = Math.abs(endScreenX - startScreenX);
    const height = Math.abs(endScreenY - startScreenY);
    
    // Convert to coordinates relative to canvas container
    const relativeX = x - canvasRect.left;
    const relativeY = y - canvasRect.top;

    // Remove existing marquee overlay
    const existingOverlay = canvasContainer.querySelector('[data-marquee-canvas-overlay]');
    if (existingOverlay) existingOverlay.remove();

    // Create marquee overlay div positioned absolutely over canvas
    const marqueeOverlay = document.createElement('div');
    marqueeOverlay.setAttribute('data-marquee-canvas-overlay', 'true');
    marqueeOverlay.style.position = 'absolute';
    marqueeOverlay.style.left = `${relativeX}px`;
    marqueeOverlay.style.top = `${relativeY}px`;
    marqueeOverlay.style.width = `${width}px`;
    marqueeOverlay.style.height = `${height}px`;
    marqueeOverlay.style.border = '2px dashed #3b82f6'; // blue-600
    marqueeOverlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // blue-600 with opacity
    marqueeOverlay.style.pointerEvents = 'none';
    marqueeOverlay.style.zIndex = '10';
    
    canvasContainer.appendChild(marqueeOverlay);

    return () => {
      const overlay = document.querySelector('[data-marquee-canvas-overlay]');
      if (overlay) overlay.remove();
    };
  }, [marqueeSelection]);

  // Add swap animation CSS and apply transforms
  useEffect(() => {
    if (!swapAnimation || swapAnimation.length === 0 || !svgContent) return;

    const svg = document.querySelector('[data-svg-container] svg');
    if (!svg) return;

    const layout = calculatePatternLayout({
      containerSize: config.containerSize,
      borderPadding: config.borderPadding,
      lineSpacing: config.lineSpacing,
      gridSize: config.gridSize,
    });

    const { tileSize, offsetX, offsetY } = layout;
    const cellWidth = tileSize + config.lineSpacing;
    const cellHeight = tileSize + config.lineSpacing;

    const allGroups: Array<{group: SVGGElement, dx: number, dy: number}> = [];

    // Calculate transforms for all swaps
    for (const swap of swapAnimation) {
      const [fromRow, fromCol] = swap.from.split('_').map(Number);
      const [toRow, toCol] = swap.to.split('_').map(Number);

      const fromX = offsetX + (fromCol * cellWidth) + (tileSize / 2);
      const fromY = offsetY + (fromRow * cellHeight) + (tileSize / 2);
      const toX = offsetX + (toCol * cellWidth) + (tileSize / 2);
      const toY = offsetY + (toRow * cellHeight) + (tileSize / 2);

      const dx = toX - fromX;
      const dy = toY - fromY;

      // Find SVG groups for the cells being swapped
      const fromGroups = svg.querySelectorAll(`[data-cell-key="${swap.from}"]`);
      const toGroups = svg.querySelectorAll(`[data-cell-key="${swap.to}"]`);

      fromGroups.forEach((group: Element) => {
        allGroups.push({ group: group as SVGGElement, dx, dy });
      });

      toGroups.forEach((group: Element) => {
        allGroups.push({ group: group as SVGGElement, dx: -dx, dy: -dy });
      });
    }

    // Apply animation transforms to all groups
    allGroups.forEach(({ group, dx, dy }) => {
      group.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      group.style.transform = `translate(${dx}, ${dy})`;
    });

    // Reset transforms after animation
    const timeout = setTimeout(() => {
      allGroups.forEach(({ group }) => {
        group.style.transition = '';
        group.style.transform = '';
      });
    }, 300);

    return () => {
      clearTimeout(timeout);
      // Cleanup on unmount
      allGroups.forEach(({ group }) => {
        group.style.transition = '';
        group.style.transform = '';
      });
    };
  }, [swapAnimation, svgContent, config.containerSize, config.borderPadding, config.lineSpacing, config.gridSize]);

  // Apply rotation and flip transforms to selected cells
  useEffect(() => {
    if (!svgContent) return;

    const svg = document.querySelector('[data-svg-container] svg');
    if (!svg) return;

    console.log('[Transform] Applying transforms to', Object.keys(cellTransforms).length, 'cells');

    // Apply transforms to each cell
    Object.entries(cellTransforms).forEach(([cellKey, transform]) => {
      const groups = svg.querySelectorAll(`[data-cell-key="${cellKey}"]`);
      console.log(`[Transform] Cell ${cellKey}: found ${groups.length} groups, transform:`, transform);
      
      groups.forEach((group: Element) => {
        const g = group as SVGGElement;
        
        // Check if this group is already wrapped
        let wrapper: SVGGElement | null = g.parentElement as SVGGElement | null;
        const isWrapped = wrapper && wrapper.hasAttribute('data-transform-wrapper');
        
        if (!isWrapped) {
          // Wrap the group in a new group for transforms
          wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
          wrapper.setAttribute('data-transform-wrapper', cellKey);
          
          // Get the original transform to extract tile center
          const originalTransform = g.getAttribute('transform') || '';
          g.setAttribute('data-original-transform', originalTransform);
          
          // Parse tile center from transform: translate(tileCenterX, tileCenterY) ...
          const translateMatch = originalTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
          if (!translateMatch) {
            console.warn('[Transform] Could not parse transform:', originalTransform);
            return;
          }
          
          const tileCenterX = parseFloat(translateMatch[1]);
          const tileCenterY = parseFloat(translateMatch[2]);
          
          // Insert wrapper before the group
          const parent = g.parentNode;
          if (parent) {
            parent.insertBefore(wrapper, g);
            // Move group into wrapper
            wrapper.appendChild(g);
          }
          
          console.log(`[Transform] Wrapped group for ${cellKey}, tile center:`, tileCenterX, tileCenterY);
        }
        
        if (!wrapper) return;
        
        // Now apply rotation/flip to the wrapper
        const wrapperG = wrapper as SVGGElement;
        const originalTransform = g.getAttribute('data-original-transform') || '';
        const translateMatch = originalTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (!translateMatch) return;
        
        const tileCenterX = parseFloat(translateMatch[1]);
        const tileCenterY = parseFloat(translateMatch[2]);
        
        // Build transform for wrapper: rotate/flip around tile center
        let wrapperTransform = '';
        
        if (transform.rotation !== 0) {
          wrapperTransform += `rotate(${transform.rotation} ${tileCenterX} ${tileCenterY}) `;
        }
        
        if (transform.flipH) {
          wrapperTransform += `translate(${tileCenterX}, ${tileCenterY}) scale(-1, 1) translate(${-tileCenterX}, ${-tileCenterY}) `;
        }
        
        if (transform.flipV) {
          wrapperTransform += `translate(${tileCenterX}, ${tileCenterY}) scale(1, -1) translate(${-tileCenterX}, ${-tileCenterY}) `;
        }
        
        wrapperG.setAttribute('transform', wrapperTransform.trim() || 'none');
        console.log(`[Transform] Applied wrapper transform for ${cellKey}:`, wrapperTransform);
      });
    });

    // Clean up wrappers for cells that no longer have transforms
    const allWrappers = svg.querySelectorAll('[data-transform-wrapper]');
    allWrappers.forEach((wrapper: Element) => {
      const w = wrapper as SVGGElement;
      const cellKey = w.getAttribute('data-transform-wrapper');
      if (cellKey && !cellTransforms[cellKey]) {
        // Unwrap: move the inner group back to parent, remove wrapper
        const innerGroup = w.querySelector('[data-cell-key]') as SVGGElement;
        if (innerGroup) {
          w.parentNode?.insertBefore(innerGroup, w);
          w.remove();
          console.log(`[Transform] Removed wrapper for ${cellKey}`);
        }
      }
    });
  }, [cellTransforms, svgContent]);

  // Regenerate pattern whenever config changes
  useEffect(() => {
    let cancelled = false;
    
    async function generatePatternAsync() {
      try {
        console.log('[PatternGenerator] Regenerating pattern with config:', {
          containerSize: config.containerSize,
          gridSize: config.gridSize,
          shapesCount: config.shapes?.length,
          colorsCount: config.colors?.length,
        });
        
        setError(null);
        
        // Validate config has required properties before generating
        if (!config.containerSize || !Array.isArray(config.containerSize) || config.containerSize.length < 2) {
          console.warn('[PatternGenerator] Invalid containerSize, using default [800, 800]');
          return;
        }
        
        if (!config.shapes || !Array.isArray(config.shapes) || config.shapes.length === 0) {
          console.warn('[PatternGenerator] Invalid shapes, skipping generation');
          setError('No shapes selected. Please select at least one shape.');
          return;
        }
        
        if (!config.colors || !Array.isArray(config.colors) || config.colors.length === 0) {
          console.warn('[PatternGenerator] Invalid colors, skipping generation');
          setError('No colors selected. Please select a color theme.');
          return;
        }
        
        // Build cells array from config
        const cells: Array<{row: number, col: number, shapeId: string, bgColorIndex: number, fgColorIndex: number}> = [];
        const gridSize = config.gridSize || 4;
        
        // Use seeded random for deterministic patterns
        class SeededRandom {
          private seed: number;
          constructor(seed: number) {
            this.seed = seed;
          }
          next() {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
          }
          choice<T>(array: T[]): T {
            return array[Math.floor(this.next() * array.length)];
          }
        }
        
        const rng = new SeededRandom(config.seed || Date.now());
        
        // Check if we need to regenerate random pattern
        // Only regenerate if seed, gridSize, emptySpace, or shapes changed
        const configHash = `${config.seed}_${gridSize}_${config.emptySpace}_${config.shapes.join(',')}`;
        const shouldRegenerateRandom = 
          randomPatternSeedRef.current !== config.seed ||
          randomPatternConfigRef.current !== configHash;
        
        if (shouldRegenerateRandom) {
          // Generate and cache random pattern
          randomPatternRef.current.clear();
          const tempRng = new SeededRandom(config.seed || Date.now());
          
          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              const cellKey = `${row}_${col}`;
              
              // Skip if emptySpace says to leave empty
              if (config.emptySpace > 0 && tempRng.next() * 100 < config.emptySpace) {
                continue; // Don't cache empty cells
              }
              
              // Pick random shape from selected shapes
              const shapeId = tempRng.choice(config.shapes);
              randomPatternRef.current.set(cellKey, shapeId);
            }
          }
          
          randomPatternSeedRef.current = config.seed || Date.now();
          randomPatternConfigRef.current = configHash;
        }
        
        // First, generate random pattern for all cells
        // Use a Map to track which cells have shapes (for easy override)
        const cellMap = new Map<string, {row: number, col: number, shapeId: string, bgColorIndex: number, fgColorIndex: number}>();
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const cellKey = `${row}_${col}`;
            
            // Check if this cell is manually placed or deleted
            const manualShape = config.manualShapes?.[cellKey];
            
            if (manualShape === '__DELETED__') {
              // Skip deleted cells
              continue;
            }
            
            if (manualShape) {
              // Use manual shape (overrides random) - TypeScript knows it's ShapeType here
              cellMap.set(cellKey, {
                row,
                col,
                shapeId: manualShape,
                bgColorIndex: 0,
                fgColorIndex: 1,
              });
            } else {
              // Use cached random pattern
              const randomShapeId = randomPatternRef.current.get(cellKey);
              if (randomShapeId) {
                cellMap.set(cellKey, {
                  row,
                  col,
                  shapeId: randomShapeId,
                  bgColorIndex: 0,
                  fgColorIndex: 1,
                });
              }
              // If not in cache (empty cell), skip it
            }
          }
        }
        
        // Convert map to array
        cells.push(...Array.from(cellMap.values()));
        
        // Store occupied cells for drag-over detection
        occupiedCellsRef.current = new Set(cellMap.keys());
        
        // Track which shapes are in the pattern
        const shapesInUse = new Set<ShapeType>();
        cellMap.forEach(cell => {
          shapesInUse.add(cell.shapeId as ShapeType);
        });
        setShapesInPattern(shapesInUse);
        
        console.log('[PatternGenerator] Built cells array:', cells.length, 'cells');
        console.log('[PatternGenerator] Calling async generatePattern...');
        
        // Call new async generatePattern
        const elements = await generatePattern(config, cells);
        
        if (cancelled) return;
        
        console.log('[PatternGenerator] Generated elements:', elements.length);
        
        console.log('[PatternGenerator] Calling patternToSVG...');
        const svg = patternToSVG(elements, config.containerSize, config.backgroundColor || '#ffffff');
        console.log('[PatternGenerator] Generated SVG, length:', svg.length);
        
        if (cancelled) return;
        
        setSvgContent(svg);
      } catch (err) {
        if (cancelled) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate pattern';
        console.error('[PatternGenerator] Pattern generation error:', err);
        console.error('[PatternGenerator] Error stack:', err instanceof Error ? err.stack : 'No stack');
        setError(errorMessage);
        setSvgContent('');
      }
    }
    
    generatePatternAsync();
    
    return () => {
      cancelled = true;
    };
  }, [config]);
  
  // Reattach drag listeners after SVG content updates
  useEffect(() => {
    if (!svgContent) return;
    
    const container = document.querySelector('[data-svg-container]') as HTMLElement;
    if (!container) return;
    
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    // Create fresh handlers with current config/state values
    const dragStartHandler = (e: DragEvent) => {
      // Mark that drag started
      dragStartedRef.current = true;
      
      console.log('[Drag] dragstart event fired (reattached)', {
        target: e.target,
        targetTag: (e.target as HTMLElement)?.tagName,
        hasDataShapeType: (e.target as HTMLElement)?.hasAttribute('data-shape-type'),
        hasDataCellIndex: (e.target as HTMLElement)?.hasAttribute('data-cell-index'),
        hasDataCellKey: (e.target as HTMLElement)?.hasAttribute('data-cell-key'),
        isDraggable: (e.target as HTMLElement)?.getAttribute('draggable'),
        manualShapes: config.manualShapes
      });
      
      const target = e.target as HTMLElement;
      
      // Don't drag if clicking on selection border
      if (target.hasAttribute('data-selected-shape') && !target.hasAttribute('data-shape-type')) {
        console.log('[Drag] Ignoring drag on selection border');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // For multi-slot shapes, we might click on a path element
      let shapeType = target.getAttribute('data-shape-type') as ShapeType | null;
      let cellIndex = target.getAttribute('data-cell-index');
      let cellKey = target.getAttribute('data-cell-key');
      
      // If we don't have the data on the clicked element, try to find it from parent or siblings
      if (!shapeType || !cellIndex) {
        const parent = target.parentElement;
        if (parent) {
          const allElements = parent.querySelectorAll('[data-shape-type]');
          for (const el of Array.from(allElements)) {
            const elShapeType = el.getAttribute('data-shape-type');
            const elCellIndex = el.getAttribute('data-cell-index');
            const elCellKey = el.getAttribute('data-cell-key');
            
            if (elCellKey === cellKey || (elCellIndex === cellIndex && elCellIndex)) {
              shapeType = elShapeType as ShapeType | null;
              cellIndex = elCellIndex;
              cellKey = elCellKey;
              break;
            }
          }
        }
      }
      
      console.log('[Drag] Extracted data', { shapeType, cellIndex, cellKey });
      
      if (shapeType && cellIndex !== null) {
        const finalCellKey = cellKey || (() => {
          const idx = parseInt(cellIndex, 10);
          const row = Math.floor(idx / config.gridSize);
          const col = idx % config.gridSize;
          return `${row}_${col}`;
        })();
        
        console.log('[Drag] Final cell key', { finalCellKey, isManualShape: config.manualShapes?.[finalCellKey] });
        
        // Always allow dragging shapes on the grid
        if (finalCellKey) {
          if (!e.dataTransfer) return;
          console.log('[Drag] Allowing drag, setting data transfer');
          e.dataTransfer.setData('text/plain', shapeType);
          e.dataTransfer.setData('application/x-cell-key', finalCellKey);
          e.dataTransfer.effectAllowed = 'move';
          setDraggedShape(shapeType);
          setIsDraggingFromGrid(true);
          setDraggedCellKey(finalCellKey);
          
          const svgEl = target.closest('svg');
          if (svgEl) {
            const cellElements = svgEl.querySelectorAll(`[data-cell-key="${finalCellKey}"]`);
            cellElements.forEach((el: Element) => {
              if (el instanceof SVGElement && el.hasAttribute('data-shape-type')) {
                el.style.opacity = '0.5';
                el.style.cursor = 'grabbing';
              }
            });
          }
        } else {
          console.log('[Drag] Drag not allowed - conditions not met');
          e.preventDefault();
          e.stopPropagation();
        }
      } else {
        console.log('[Drag] Missing required data', { shapeType, cellIndex });
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const dragEndHandler = (e: DragEvent) => {
      console.log('[Drag] dragend event fired (reattached)');
      const target = e.target as HTMLElement;
      
      const svgEl = target.closest('svg');
      if (svgEl && draggedCellKey) {
        const cellElements = svgEl.querySelectorAll(`[data-cell-key="${draggedCellKey}"]`);
        cellElements.forEach((el: Element) => {
          if (el instanceof SVGElement && el.hasAttribute('data-shape-type')) {
            el.style.opacity = '';
            el.style.cursor = '';
          }
        });
      } else if (target instanceof SVGElement) {
        target.style.opacity = '';
        target.style.cursor = '';
      }
      
      setDraggedShape(null);
      setDragOverCell(null);
      setIsDraggingFromGrid(false);
      setDraggedCellKey(null);
    };
    
    // Small delay to ensure SVG is fully rendered
    const timeoutId = setTimeout(() => {
      const draggableElements = svg.querySelectorAll('[draggable="true"]');
      console.log('[PatternGenerator] Reattaching listeners to', draggableElements.length, 'elements after SVG update');
      
      // Clean up old listeners first
      draggableElements.forEach((svgEl: Element) => {
        const oldStart = (svgEl as any).__dragStartHandler;
        const oldEnd = (svgEl as any).__dragEndHandler;
        if (oldStart) {
          svgEl.removeEventListener('dragstart', oldStart, true);
        }
        if (oldEnd) {
          svgEl.removeEventListener('dragend', oldEnd, true);
        }
      });
      
      // Attach new listeners with fresh closures
      draggableElements.forEach((svgEl: Element) => {
        svgEl.addEventListener('dragstart', dragStartHandler as EventListener, true);
        svgEl.addEventListener('dragend', dragEndHandler as EventListener, true);
        (svgEl as any).__dragListenerAttached = true;
        (svgEl as any).__dragStartHandler = dragStartHandler;
        (svgEl as any).__dragEndHandler = dragEndHandler;
      });
      
      // Also update container handlers
      (container as any).__dragStartHandler = dragStartHandler;
      (container as any).__dragEndHandler = dragEndHandler;
    }, 150);
    
    return () => clearTimeout(timeoutId);
  }, [svgContent, config.gridSize, config.manualShapes, draggedCellKey]);

  // Track window size for responsive preview
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Delete/Backspace: Delete selected cells (works without modifiers)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCells.size > 0) {
        e.preventDefault();
        setConfig(prev => {
          const newManualShapes = { ...prev.manualShapes || {} };
          // Mark all selected cells as deleted
          selectedCells.forEach(cellKey => {
            newManualShapes[cellKey] = '__DELETED__' as any;
          });
          return {
            ...prev,
            manualShapes: newManualShapes
          };
        });
        // Remove transforms for deleted cells
        setCellTransforms(prev => {
          const newTransforms = { ...prev };
          selectedCells.forEach(cellKey => {
            delete newTransforms[cellKey];
          });
          return newTransforms;
        });
        setSelectedCells(new Set());
        return;
      }

      // ESC: Close popups and clear selections
      if (e.key === 'Escape') {
        e.preventDefault();
        // Close selectedShape toolbar
        if (selectedShape) {
          setSelectedShape(null);
        }
        // Clear selectedCells
        if (selectedCells.size > 0) {
          setSelectedCells(new Set());
        }
        // Close sidebar if open (mobile)
        if (sidebarOpen) {
          setSidebarOpen(false);
        }
        return;
      }

      // W/A/S/D or Arrow keys: Move selected cell(s)
      if (selectedCells.size > 0 && (
        e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D'
      )) {
        e.preventDefault();
        const currentConfig = configRef.current;
        
        // Calculate direction
        let deltaRow = 0;
        let deltaCol = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          deltaRow = -1;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          deltaRow = 1;
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          deltaCol = -1;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          deltaCol = 1;
        }
        
        // Calculate new positions for all selected cells
        const cellMoves = new Map<string, string>(); // oldKey -> newKey
        let canMove = true;
        
        for (const selectedCellKey of selectedCells) {
          const [row, col] = selectedCellKey.split('_').map(Number);
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          
          // Check bounds
          if (newRow < 0 || newRow >= currentConfig.gridSize || newCol < 0 || newCol >= currentConfig.gridSize) {
            canMove = false;
            break;
          }
          
          const newCellKey = `${newRow}_${newCol}`;
          cellMoves.set(selectedCellKey, newCellKey);
        }
        
        // If any cell would go out of bounds, don't move any
        if (!canMove) {
          return;
        }
        
        // Perform swaps for all cells
        setConfig(prev => {
          const newManualShapes = { ...prev.manualShapes || {} };
          
          // Create a map of all swaps needed (handling chains)
          // We need to do this carefully to handle circular swaps
          const swapPairs: Array<{from: string, to: string}> = [];
          for (const [oldKey, newKey] of cellMoves.entries()) {
            swapPairs.push({ from: oldKey, to: newKey });
          }
          
          // Get all values before swapping
          const values = new Map<string, ShapeType | '__DELETED__' | null>();
          for (const { from, to } of swapPairs) {
            // Get current value
            let fromValue: ShapeType | '__DELETED__' | null = newManualShapes[from] || null;
            if (fromValue === null) {
              const randomShape = randomPatternRef.current.get(from);
              if (randomShape) {
                fromValue = randomShape as ShapeType;
              }
            }
            values.set(from, fromValue);
            
            // Get target value
            let toValue: ShapeType | '__DELETED__' | null = newManualShapes[to] || null;
            if (toValue === null) {
              const randomShape = randomPatternRef.current.get(to);
              if (randomShape) {
                toValue = randomShape as ShapeType;
              }
            }
            values.set(to, toValue);
          }
          
          // Perform swaps
          for (const { from, to } of swapPairs) {
            const fromValue = values.get(from) ?? null;
            const toValue = values.get(to) ?? null;
            
            // Set new values
            if (fromValue !== null && fromValue !== '__DELETED__') {
              newManualShapes[to] = fromValue;
            } else if (fromValue === '__DELETED__') {
              newManualShapes[to] = '__DELETED__';
            } else {
              delete newManualShapes[to];
            }
            
            if (toValue !== null && toValue !== '__DELETED__') {
              newManualShapes[from] = toValue;
            } else if (toValue === '__DELETED__') {
              newManualShapes[from] = '__DELETED__';
            } else {
              delete newManualShapes[from];
            }
          }
          
          // Trigger animation for all swaps
          if (swapPairs.length > 0) {
            setSwapAnimation(swapPairs);
            setTimeout(() => setSwapAnimation(null), 300);
          }
          
          return {
            ...prev,
            manualShapes: newManualShapes
          };
        });
        
        // Update selection to new positions
        const newSelectedCells = new Set(Array.from(selectedCells).map(oldKey => cellMoves.get(oldKey) || oldKey));
        setSelectedCells(newSelectedCells);
        
        // Swap transforms for moved cells
        setCellTransforms(prev => {
          const newTransforms = { ...prev };
          
          // Get all transform values before swapping
          const transformValues = new Map<string, { rotation: number, flipH: boolean, flipV: boolean } | undefined>();
          for (const [oldKey, newKey] of cellMoves.entries()) {
            transformValues.set(oldKey, newTransforms[oldKey]);
            transformValues.set(newKey, newTransforms[newKey]);
          }
          
          // Perform swaps
          for (const [oldKey, newKey] of cellMoves.entries()) {
            const oldTransform = transformValues.get(oldKey);
            const newTransform = transformValues.get(newKey);
            
            if (oldTransform) {
              newTransforms[newKey] = oldTransform;
            } else {
              delete newTransforms[newKey];
            }
            
            if (newTransform) {
              newTransforms[oldKey] = newTransform;
            } else {
              delete newTransforms[oldKey];
            }
          }
          
          return newTransforms;
        });
        
        return;
      }

      // Q/E: Rotate selected cell(s) 90 degrees left/right
      if (selectedCells.size > 0 && (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setCellTransforms(prev => {
          const newTransforms = { ...prev };
          const rotationDelta = (e.key === 'q' || e.key === 'Q') ? -90 : 90;
          
          selectedCells.forEach(cellKey => {
            const current = newTransforms[cellKey] || { rotation: 0, flipH: false, flipV: false };
            const newRotation = (current.rotation + rotationDelta) % 360;
            newTransforms[cellKey] = {
              ...current,
              rotation: newRotation < 0 ? newRotation + 360 : newRotation
            };
          });
          
          return newTransforms;
        });
        return;
      }

      // O/P: Flip selected cell(s) horizontally/vertically
      if (selectedCells.size > 0 && (e.key === 'o' || e.key === 'O' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setCellTransforms(prev => {
          const newTransforms = { ...prev };
          const flipH = e.key === 'o' || e.key === 'O';
          const flipV = e.key === 'p' || e.key === 'P';
          
          selectedCells.forEach(cellKey => {
            const current = newTransforms[cellKey] || { rotation: 0, flipH: false, flipV: false };
            newTransforms[cellKey] = {
              ...current,
              flipH: flipH ? !current.flipH : current.flipH,
              flipV: flipV ? !current.flipV : current.flipV
            };
          });
          
          return newTransforms;
        });
        return;
      }

      // Check for CMD (Mac) or CTRL (PC) modifier
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      if (!isModifierPressed) return;

      // Undo: CMD+Z (Mac) or CTRL+Z (PC)
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          isUndoRedoRef.current = true;
          const newIndex = historyIndex - 1;
          const prevConfig = history[newIndex];
          setConfig(JSON.parse(JSON.stringify(prevConfig))); // Deep copy
          setHistoryIndex(newIndex);
          historyIndexRef.current = newIndex;
        }
        return;
      }

      // Redo: CMD+Shift+Z (Mac) or CTRL+Shift+Z (PC)
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          isUndoRedoRef.current = true;
          const newIndex = historyIndex + 1;
          const nextConfig = history[newIndex];
          setConfig(JSON.parse(JSON.stringify(nextConfig))); // Deep copy
          setHistoryIndex(newIndex);
          historyIndexRef.current = newIndex;
        }
        return;
      }

      // Copy: CMD+C (Mac) or CTRL+C (PC)
      if (e.key === 'c' && selectedCells.size > 0) {
        e.preventDefault();
        const currentConfig = configRef.current;
        const shapes: Array<{ cellKey: string, shapeType: ShapeType | '__DELETED__' | null, transform?: { rotation: number, flipH: boolean, flipV: boolean } }> = [];
        
        selectedCells.forEach(cellKey => {
          // Get shape type from manualShapes or randomPattern
          let shapeType: ShapeType | '__DELETED__' | null = currentConfig.manualShapes?.[cellKey] || null;
          if (shapeType === null) {
            const randomShape = randomPatternRef.current.get(cellKey);
            if (randomShape) {
              shapeType = randomShape as ShapeType;
            }
          }
          
          // Get transform if it exists
          const transform = cellTransforms[cellKey];
          
          shapes.push({
            cellKey,
            shapeType,
            transform: transform ? { ...transform } : undefined
          });
        });
        
        setClipboard({ shapes, isCut: false });
        console.log('[Clipboard] Copied', shapes.length, 'shapes');
        return;
      }

      // Cut: CMD+X (Mac) or CTRL+X (PC)
      if (e.key === 'x' && selectedCells.size > 0) {
        e.preventDefault();
        const currentConfig = configRef.current;
        const shapes: Array<{ cellKey: string, shapeType: ShapeType | '__DELETED__' | null, transform?: { rotation: number, flipH: boolean, flipV: boolean } }> = [];
        
        selectedCells.forEach(cellKey => {
          // Get shape type from manualShapes or randomPattern
          let shapeType: ShapeType | '__DELETED__' | null = currentConfig.manualShapes?.[cellKey] || null;
          if (shapeType === null) {
            const randomShape = randomPatternRef.current.get(cellKey);
            if (randomShape) {
              shapeType = randomShape as ShapeType;
            }
          }
          
          // Get transform if it exists
          const transform = cellTransforms[cellKey];
          
          shapes.push({
            cellKey,
            shapeType,
            transform: transform ? { ...transform } : undefined
          });
        });
        
        setClipboard({ shapes, isCut: true });
        console.log('[Clipboard] Cut', shapes.length, 'shapes');
        
        // Delete the cut shapes
        setConfig(prev => {
          const newManualShapes = { ...prev.manualShapes || {} };
          selectedCells.forEach(cellKey => {
            newManualShapes[cellKey] = '__DELETED__' as any;
          });
          return {
            ...prev,
            manualShapes: newManualShapes
          };
        });
        
        // Remove transforms for cut cells
        setCellTransforms(prev => {
          const newTransforms = { ...prev };
          selectedCells.forEach(cellKey => {
            delete newTransforms[cellKey];
          });
          return newTransforms;
        });
        
        setSelectedCells(new Set());
        return;
      }

      // Paste: CMD+V (Mac) or CTRL+V (PC)
      if (e.key === 'v' && clipboard && clipboard.shapes.length > 0 && selectedCells.size > 0) {
        e.preventDefault();
        const currentConfig = configRef.current;
        const selectedCellsArray = Array.from(selectedCells);
        let shapesToPaste = clipboard.shapes;
        
        // For single selection, paste all shapes relative to the first copied shape
        // For multiple selection, paste each shape to corresponding selected cell (if same count)
        if (selectedCells.size === 1 && clipboard.shapes.length > 1) {
          // Single cell selected, multiple shapes in clipboard: paste relative to first shape
          const targetCellKey = selectedCellsArray[0];
          const [targetRow, targetCol] = targetCellKey.split('_').map(Number);
          
          // Find the top-left cell in clipboard (minimum row and col)
          let minRow = Infinity;
          let minCol = Infinity;
          clipboard.shapes.forEach(({ cellKey }) => {
            const [row, col] = cellKey.split('_').map(Number);
            minRow = Math.min(minRow, row);
            minCol = Math.min(minCol, col);
          });
          
          // Calculate offset
          const offsetRow = targetRow - minRow;
          const offsetCol = targetCol - minCol;
          
          setConfig(prev => {
            const newManualShapes = { ...prev.manualShapes || {} };
            
            clipboard.shapes.forEach(({ cellKey, shapeType }) => {
              if (shapeType && shapeType !== '__DELETED__') {
                const [row, col] = cellKey.split('_').map(Number);
                const newRow = row + offsetRow;
                const newCol = col + offsetCol;
                
                // Check bounds
                if (newRow >= 0 && newRow < currentConfig.gridSize && newCol >= 0 && newCol < currentConfig.gridSize) {
                  const newCellKey = `${newRow}_${newCol}`;
                  newManualShapes[newCellKey] = shapeType;
                }
              }
            });
            
            return {
              ...prev,
              manualShapes: newManualShapes
            };
          });
          
          // Copy transforms with offset
          setCellTransforms(prev => {
            const newTransforms = { ...prev };
            
            clipboard.shapes.forEach(({ cellKey, transform }) => {
              if (transform) {
                const [row, col] = cellKey.split('_').map(Number);
                const newRow = row + offsetRow;
                const newCol = col + offsetCol;
                
                if (newRow >= 0 && newRow < currentConfig.gridSize && newCol >= 0 && newCol < currentConfig.gridSize) {
                  const newCellKey = `${newRow}_${newCol}`;
                  newTransforms[newCellKey] = transform;
                }
              }
            });
            
            return newTransforms;
          });
        } else {
          // Paste each shape to corresponding selected cell (1:1 mapping)
          shapesToPaste = clipboard.shapes.slice(0, selectedCells.size);
          
          setConfig(prev => {
            const newManualShapes = { ...prev.manualShapes || {} };
            
            shapesToPaste.forEach(({ shapeType }, index) => {
              const targetCellKey = selectedCellsArray[index];
              if (shapeType && shapeType !== '__DELETED__') {
                newManualShapes[targetCellKey] = shapeType;
              } else if (shapeType === '__DELETED__') {
                newManualShapes[targetCellKey] = '__DELETED__' as any;
              } else {
                delete newManualShapes[targetCellKey];
              }
            });
            
            return {
              ...prev,
              manualShapes: newManualShapes
            };
          });
          
          // Copy transforms
          setCellTransforms(prev => {
            const newTransforms = { ...prev };
            
            shapesToPaste.forEach(({ transform }, index) => {
              if (transform) {
                const targetCellKey = selectedCellsArray[index];
                newTransforms[targetCellKey] = transform;
              }
            });
            
            return newTransforms;
          });
        }
        
        // Clear clipboard if it was a cut operation
        if (clipboard.isCut) {
          setClipboard(null);
        }
        
        console.log('[Clipboard] Pasted', shapesToPaste.length, 'shapes');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedCells, cellTransforms, clipboard, selectedShape, sidebarOpen]); // Dependencies for undo/redo state, selectedCells, cellTransforms, clipboard, selectedShape, and sidebarOpen

  // Calculate preview dimensions that fit within viewport
  // Container is fixed at 800×800px (1:1)
  const [containerWidth, containerHeight] = config.containerSize;
  
  // Available viewport space (accounting for header ~80px, padding ~32px, frame padding ~64px = ~176px)
  const availableWidth = windowSize.width > 0 ? windowSize.width : (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const availableHeight = windowSize.height > 0 ? windowSize.height : (typeof window !== 'undefined' ? window.innerHeight : 800);
  
  // Account for sidebar (if open on mobile) and padding
  const sidebarWidth = availableWidth < 1024 && sidebarOpen ? 320 : 0;
  const maxDisplayWidth = Math.min(800, (availableWidth - sidebarWidth) * 0.85);
  const maxDisplayHeight = Math.min(800, (availableHeight - 200) * 0.85);
  
  // Calculate scale to fit within container (never scale up, only down)
  const scaleX = maxDisplayWidth / containerWidth;
  const scaleY = maxDisplayHeight / containerHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  
  // Calculate display dimensions
  const displayWidth = containerWidth * scale;
  const displayHeight = containerHeight * scale;
  
  const previewCanvasSize = [displayWidth, displayHeight];


  // Handle spacing change (keep for now, might remove later)
  const handleSpacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpacing = parseInt(e.target.value, 10);
    setConfig(prev => ({
      ...prev,
      spacing: newSpacing,
    }));
  };

  // Helper function to normalize hex color input
  const normalizeHexColor = (value: string): string => {
    // Remove any whitespace
    value = value.trim();
    // Remove # if present
    value = value.replace(/^#/, '');
    // Only allow hex characters (0-9, A-F, a-f)
    value = value.replace(/[^0-9A-Fa-f]/g, '');
    
    // Expand short hex codes
    if (value.length === 1) {
      // Single character: repeat 6 times (e.g., 'f' -> 'ffffff')
      value = value.repeat(6);
    } else if (value.length === 2) {
      // Two characters: repeat 3 times (e.g., 'f1' -> 'f1f1f1')
      value = value.repeat(3);
    } else if (value.length === 3) {
      // Three characters: expand each (e.g., 'fff' -> 'ffffff', 'f1a' -> 'ff11aa')
      value = value.split('').map(c => c + c).join('');
    }
    
    // Limit to 6 characters
    value = value.slice(0, 6);
    // Add # prefix
    return value ? `#${value.toUpperCase()}` : '#';
  };

  // Handle background color change - disable sync when user manually changes
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSyncBackgroundColor(false); // Disable sync when user manually changes
    setConfig(prev => ({
      ...prev,
      backgroundColor: newColor,
    }));
  };

  // Handle hex input change - normalize while typing
  const handleHexInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setColor: (color: string) => void
  ) => {
    const value = e.target.value;
    const normalized = normalizeHexColor(value);
    // Allow typing - normalized will be # followed by 0-6 hex digits
    // Always update to allow partial input while typing
    setColor(normalized);
  };

  // Handle hex input focus - select all text
  const handleHexInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Use setTimeout to ensure selection happens after focus
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  // Handle hex input paste - works with selected text
  const handleHexInputPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    setColor: (color: string) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData('text');
    const normalized = normalizeHexColor(pastedText);
    // Accept any valid hex format (complete or partial)
    // normalizeHexColor ensures it's properly formatted with #
    if (normalized.length > 1) { // More than just '#'
      setColor(normalized);
      // Select all after paste for easy replacement
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        e.currentTarget.select();
      });
    }
  };

  // Handle hex input click - select all on click (works with focus)
  const handleHexInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  // Handle shape selection change
  const handleShapesChange = (shapes: ShapeType[]) => {
    setConfig(prev => ({
      ...prev,
      shapes: shapes,
    }));
  };

  // Handle clear grid - clears all manual shapes and selects a single random shape
  const handleClearGrid = () => {
    const nauticalShapes = availableShapes.nautical as ShapeType[];
    const randomIndex = Math.floor(Math.random() * nauticalShapes.length);
    const randomShape = nauticalShapes[randomIndex];
    
    setConfig(prev => ({
      ...prev,
      manualShapes: {}, // Clear all manual shapes
      shapes: [randomShape], // Select single random shape
    }));
  };

  // Handle colors change - update background to slot_1 when theme changes (only if sync is enabled)
  const handleColorsChange = (colors: string[]) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        colors: colors,
        shapeColorOverrides: undefined, // Clear color overrides when theme changes
      };
      
      // Only update background color if sync is enabled
      if (syncBackgroundColor) {
        newConfig.backgroundColor = colors[0] || prev.backgroundColor;
      }
      
      return newConfig;
    });
  };

  // Sync background color when colors change and sync is enabled
  useEffect(() => {
    if (syncBackgroundColor && config.colors.length > 0) {
      const themeBgColor = config.colors[0];
      // Only update if different to avoid infinite loops
      if (config.backgroundColor !== themeBgColor) {
        setConfig(prev => ({
          ...prev,
          backgroundColor: themeBgColor
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncBackgroundColor, config.colors]); // Trigger when colors array reference changes

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Generate random harmonious colors using HSL
  const generateRandomColors = (): string[] => {
    const count = Math.floor(Math.random() * 3) + 3; // 3-5 colors
    const baseHue = Math.random() * 360;
    const colors: string[] = [];

    // Use a color harmony scheme (analogous with some variation)
    for (let i = 0; i < count; i++) {
      // Vary hue within ±30 degrees for analogous colors, or use complementary
      const hueVariation = (i % 2 === 0) 
        ? (baseHue + (i * 20) % 60) % 360  // Analogous
        : (baseHue + 180 + (i * 15)) % 360; // Complementary variations
      
      // Vary saturation (60-90%) for vibrant colors
      const saturation = 60 + Math.random() * 30;
      
      // Vary lightness (40-70%) for good contrast
      const lightness = 40 + Math.random() * 30;
      
      // Convert HSL to hex
      const hex = hslToHex(hueVariation, saturation, lightness);
      colors.push(hex);
    }

    return colors;
  };

  // Handle randomize colors
  const handleRandomizeColors = () => {
    const newColors = generateRandomColors();
    handleColorsChange(newColors);
  };

  // Handle randomize pattern (new seed, keeps colors)
  const handleRandomizePattern = () => {
    setConfig(prev => ({
      ...prev,
      seed: Date.now(), // New random seed
    }));
  };

  // Handle pattern type change
  const handlePatternTypeChange = (patternType: PatternConfig['patternType']) => {
    setConfig(prev => ({
      ...prev,
      patternType: patternType,
    }));
  };

  // Handle rotation toggle
  const handleRotationToggle = () => {
    setConfig(prev => ({
      ...prev,
      rotation: {
        ...prev.rotation,
        enabled: !prev.rotation.enabled,
      },
    }));
  };

  // Handle randomize all - explicit randomization of all properties
  const handleRandomizeAll = () => {
    setIsRandomizing(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      try {
        // 1. Get all available shapes from any set (1-9 shapes)
        const allShapes: ShapeType[] = [
          // Primitives and blocks are disabled - only nautical shapes
          ...availableShapes.nautical
        ] as ShapeType[];
        
        // Randomly select 1-9 shapes
        const numShapes = Math.floor(Math.random() * 9) + 1; // 1-9 shapes
        const shuffledShapes = [...allShapes].sort(() => Math.random() - 0.5);
        const randomShapes = shuffledShapes.slice(0, numShapes);
        
        // 2. Pick a random color theme from palettes
        const paletteNames = Object.keys(COLOR_PALETTES);
        const randomPaletteName = paletteNames[Math.floor(Math.random() * paletteNames.length)];
        const randomColors = [...COLOR_PALETTES[randomPaletteName as keyof typeof COLOR_PALETTES]];
        
        // 3. Use slot_1 from selected theme as background color
        const randomBackgroundColor = randomColors[0] || '#ffffff';
        
        // 4. Randomize rotation: on or off
        const randomRotation = Math.random() > 0.5;
        
        // 5. Randomize mirror variables
        const mirrorOptions = [
          { horizontal: false, vertical: false },
          { horizontal: false, vertical: true },
          { horizontal: true, vertical: false },
          { horizontal: true, vertical: true },
        ];
        const randomMirror = mirrorOptions[Math.floor(Math.random() * mirrorOptions.length)];
        
        // 6. Randomize line spacing: 0, 16, 32, 48, or 64
        const lineSpacingOptions = [0, 16, 32, 48, 64];
        const randomLineSpacing = lineSpacingOptions[Math.floor(Math.random() * lineSpacingOptions.length)];
        
        // 7. Randomize border padding: 0, 16, 32, or 48
        const borderPaddingOptions = [0, 16, 32, 48];
        const randomBorderPadding = borderPaddingOptions[Math.floor(Math.random() * borderPaddingOptions.length)];
        
        // 8. Randomize grid size: 3-8
        const randomGridSize = Math.floor(Math.random() * 6) + 3; // 3-8
        
        // 9. Randomize empty space: 0-100%
        const randomEmptySpace = Math.floor(Math.random() * 101); // 0-100
        
        // 10. New seed
        const newSeed = Date.now();
        
        // Build complete config object with all required properties
        const newConfig: PatternConfig = {
          seed: newSeed,
          patternType: 'gridCentered', // Always use gridCentered for now
          containerSize: [800, 800], // Always 800x800
          gridSize: randomGridSize,
          borderPadding: randomBorderPadding,
          lineSpacing: randomLineSpacing,
          emptySpace: randomEmptySpace,
          spacing: 0, // Keep at 0
          backgroundColor: randomBackgroundColor,
          shapes: randomShapes,
          colors: randomColors,
          rotation: {
            enabled: randomRotation,
          },
          mirror: randomMirror,
          preserveLayout: true, // Default to preserving layout
        };
        
        // Validate before setting
        if (!newConfig.containerSize || !Array.isArray(newConfig.containerSize) || newConfig.containerSize.length < 2) {
          throw new Error('Invalid containerSize');
        }
        if (!newConfig.shapes || !Array.isArray(newConfig.shapes) || newConfig.shapes.length === 0) {
          throw new Error('Invalid shapes array');
        }
        if (!newConfig.colors || !Array.isArray(newConfig.colors) || newConfig.colors.length === 0) {
          throw new Error('Invalid colors array');
        }
        
        // Set the complete config
        setConfig(newConfig);
        setSeedInput('');
        setIsRandomizing(false);
      } catch (err) {
        console.error('Error in handleRandomizeAll:', err);
        setIsRandomizing(false);
        setError(err instanceof Error ? err.message : 'Failed to randomize');
      }
    }, 150); // Brief delay for visual feedback
  };

  // Handle seed copy
  const handleCopySeed = async () => {
    try {
      await navigator.clipboard.writeText(config.seed.toString());
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      const prevConfig = history[newIndex];
      setConfig(JSON.parse(JSON.stringify(prevConfig))); // Deep copy
      setHistoryIndex(newIndex);
      historyIndexRef.current = newIndex;
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      const nextConfig = history[newIndex];
      setConfig(JSON.parse(JSON.stringify(nextConfig))); // Deep copy
      setHistoryIndex(newIndex);
      historyIndexRef.current = newIndex;
    }
  };

  // Handle seed input change
  const handleSeedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeedInput(e.target.value);
  };

  // Handle seed input submit
  const handleSeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const seedValue = parseInt(seedInput, 10);
    if (!isNaN(seedValue) && seedValue > 0) {
      setConfig(prev => ({
        ...prev,
        seed: seedValue,
      }));
      setSeedInput('');
    }
  };

  // Generate all permutations of colors for a given length
  const generateColorPermutations = (colors: string[], length: number): string[][] => {
    if (length === 0) return [[]];
    if (length === 1) return colors.map(c => [c]);
    
    const permutations: string[][] = [];
    
    const generate = (current: string[], remaining: string[]) => {
      if (current.length === length) {
        permutations.push([...current]);
        return;
      }
      
      for (let i = 0; i < remaining.length; i++) {
        current.push(remaining[i]);
        generate(current, remaining);
        current.pop();
      }
    };
    
    generate([], colors);
    return permutations;
  };

  // TEMPORARILY DISABLED: Handle shuffle colors for a specific shape type
  // TODO: Rebuild this for the new 2-color SVG system
  // The new system uses bgColorIndex and fgColorIndex instead of slot-based colors
  /*
  const handleShuffleShapeColors = (shapeType: ShapeType) => {
    // OLD SYSTEM: Used shapes[shapeType](x, y, size) to get slot information
    // NEW SYSTEM: Shapes are 2-color SVGs loaded from files
    // This function needs to be rewritten to work with bgColorIndex/fgColorIndex
  };
  */

  // TEMPORARILY DISABLED: Handle cancel/revert colors for a specific shape type
  // TODO: Rebuild this for the new 2-color SVG system
  /*
  const handleCancelShapeColors = (shapeType: ShapeType) => {
    setConfig(prev => {
      const newOverrides = { ...prev.shapeColorOverrides };
      delete newOverrides[shapeType];
      return {
        ...prev,
        shapeColorOverrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined
      };
    });
    setSelectedShape(null);
  };
  */

  // Calculate which grid cell a point (x, y) is in
  // Use configRef to always get latest config
  const getCellFromPoint = useCallback((x: number, y: number): {row: number, col: number} | null => {
    try {
      const currentConfig = configRef.current;
      const layout = calculatePatternLayout({
        containerSize: currentConfig.containerSize,
        borderPadding: currentConfig.borderPadding,
        lineSpacing: currentConfig.lineSpacing,
        gridSize: currentConfig.gridSize,
      });
      
      const { tileSize, offsetX, offsetY } = layout;
      const cellWidth = tileSize + currentConfig.lineSpacing;
      const cellHeight = tileSize + currentConfig.lineSpacing;
      
      // Calculate relative position
      const relX = x - offsetX;
      const relY = y - offsetY;
      
      // Find which cell
      const col = Math.floor(relX / cellWidth);
      const row = Math.floor(relY / cellHeight);
      
      // Check if within bounds
      if (row >= 0 && row < currentConfig.gridSize && col >= 0 && col < currentConfig.gridSize) {
        // Check if point is within the actual cell (not in spacing area)
        const cellX = col * cellWidth;
        const cellY = row * cellHeight;
        if (relX >= cellX && relX < cellX + tileSize && relY >= cellY && relY < cellY + tileSize) {
          return { row, col };
        }
      }
      
      return null;
    } catch (err) {
      console.error('[PatternGenerator] Error in getCellFromPoint:', err);
      return null;
    }
  }, []); // Empty deps - uses configRef.current

  // Get all cells that intersect with a marquee rectangle (in SVG coordinates)
  const getCellsInMarquee = useCallback((startX: number, startY: number, endX: number, endY: number): Set<string> => {
    const cells = new Set<string>();
    try {
      const currentConfig = configRef.current;
      const layout = calculatePatternLayout({
        containerSize: currentConfig.containerSize,
        borderPadding: currentConfig.borderPadding,
        lineSpacing: currentConfig.lineSpacing,
        gridSize: currentConfig.gridSize,
      });
      
      const { tileSize, offsetX, offsetY } = layout;
      const cellWidth = tileSize + currentConfig.lineSpacing;
      const cellHeight = tileSize + currentConfig.lineSpacing;
      
      // Normalize rectangle coordinates
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      // Find all cells that intersect with the marquee
      for (let row = 0; row < currentConfig.gridSize; row++) {
        for (let col = 0; col < currentConfig.gridSize; col++) {
          const cellX = offsetX + (col * cellWidth);
          const cellY = offsetY + (row * cellHeight);
          const cellRight = cellX + tileSize;
          const cellBottom = cellY + tileSize;
          
          // Check if marquee intersects with this cell
          if (maxX >= cellX && minX <= cellRight && maxY >= cellY && minY <= cellBottom) {
            cells.add(`${row}_${col}`);
          }
        }
      }
    } catch (err) {
      console.error('[PatternGenerator] Error in getCellsInMarquee:', err);
    }
    return cells;
  }, []); // Empty deps - uses configRef.current
  
  const getCellsInMarqueeRef = useRef(getCellsInMarquee);
  useEffect(() => {
    getCellsInMarqueeRef.current = getCellsInMarquee;
  }, [getCellsInMarquee]);

  // Handle drag over grid
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[Drag] handleDragOver called', {
      target: e.target,
      currentTarget: e.currentTarget,
      hasDataTransfer: !!e.dataTransfer
    });
    
    const svgElement = (e.currentTarget as HTMLElement).querySelector('svg');
    if (!svgElement) {
      console.log('[Drag] No SVG element found');
      return;
    }
    
    const svgRect = svgElement.getBoundingClientRect();
    const svgViewBox = svgElement.viewBox.baseVal;
    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;
    
    // Convert mouse coordinates to SVG coordinates
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Scale to SVG viewBox coordinates
    const x = (mouseX / svgWidth) * svgViewBox.width;
    const y = (mouseY / svgHeight) * svgViewBox.height;
    
    const cell = getCellFromPoint(x, y);
    setDragOverCell(cell);
    
    if (cell && e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
      console.log('[Drag] Dragging over cell', cell, { x, y, mouseX, mouseY });
    } else {
      console.log('[Drag] No cell found or no dataTransfer', { cell, hasDataTransfer: !!e.dataTransfer });
    }
  };

  // Handle drop on grid
  const handleDrop = (e: React.DragEvent) => {
    console.log('[Drag] drop event fired');
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.dataTransfer) return;
    
    const shapeType = e.dataTransfer.getData('text/plain') as ShapeType;
    const sourceCellKey = e.dataTransfer.getData('application/x-cell-key');
    
    console.log('[Drag] Drop data', { shapeType, sourceCellKey });
    
    if (!shapeType) {
      console.log('[Drag] No shape type in drop data');
      return;
    }
    
    const svgElement = (e.currentTarget as HTMLElement).querySelector('svg');
    if (!svgElement) {
      console.log('[Drag] No SVG element found in drop');
      return;
    }
    
    const svgRect = svgElement.getBoundingClientRect();
    const svgViewBox = svgElement.viewBox.baseVal;
    const svgWidth = svgRect.width;
    const svgHeight = svgRect.height;
    
    // Convert mouse coordinates to SVG coordinates
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    
    // Scale to SVG viewBox coordinates
    const x = (mouseX / svgWidth) * svgViewBox.width;
    const y = (mouseY / svgHeight) * svgViewBox.height;
    
    const cell = getCellFromPoint(x, y);
    console.log('[Drag] Drop cell', { cell, x, y });
    
    if (cell) {
      const cellKey = `${cell.row}_${cell.col}`;
      
      // If dragging from grid, remove from source first
      if (sourceCellKey && sourceCellKey !== cellKey) {
        setConfig(prev => {
          const newManualShapes = { ...prev.manualShapes || {} };
          delete newManualShapes[sourceCellKey];
          newManualShapes[cellKey] = shapeType;
          return {
            ...prev,
            manualShapes: newManualShapes
          };
        });
      } else {
        // Dropping from sidebar
        setConfig(prev => ({
          ...prev,
          manualShapes: {
            ...prev.manualShapes || {},
            [cellKey]: shapeType
          }
        }));
      }
    } else if (sourceCellKey) {
      // Dragging outside grid - delete the shape
      setConfig(prev => {
        const newManualShapes = { ...prev.manualShapes || {} };
        delete newManualShapes[sourceCellKey];
        return {
          ...prev,
          manualShapes: newManualShapes
        };
      });
    }
    
    setDraggedShape(null);
    setDragOverCell(null);
    setIsDraggingFromGrid(false);
    setDraggedCellKey(null);
  };

  // Handle drag start from sidebar
  const handleDragStartFromSidebar = (shapeType: ShapeType) => {
    setDraggedShape(shapeType);
    setIsDraggingFromGrid(false);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if actually leaving the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCell(null);
    }
  };


  // Handle SVG download
  const handleDownloadSVG = () => {
    if (!svgContent) {
      setExportMessage('No pattern to export');
      setTimeout(() => setExportMessage(null), 2000);
      return;
    }

    // Get the actual SVG from the DOM (includes transforms applied via wrapper groups)
    const svgElement = document.querySelector('[data-svg-container] svg') as SVGSVGElement | null;
    
    let svgString = svgContent; // Fallback to original
    
    if (svgElement) {
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Serialize to string
      const serializer = new XMLSerializer();
      svgString = serializer.serializeToString(clonedSvg);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pattern-${config.seed}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportMessage('SVG downloaded!');
    setShowSvgMenu(false);
    setTimeout(() => setExportMessage(null), 2000);
  };

  // Handle SVG copy to clipboard
  const handleCopySVG = async () => {
    if (!svgContent) {
      setExportMessage('No pattern to copy');
      setTimeout(() => setExportMessage(null), 2000);
      return;
    }

    try {
      // Get the actual SVG from the DOM (includes transforms applied via wrapper groups)
      const svgElement = document.querySelector('[data-svg-container] svg') as SVGSVGElement | null;
      
      if (svgElement) {
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        
        // Serialize to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        await navigator.clipboard.writeText(svgString);
        setExportMessage('SVG copied to clipboard!');
        setTimeout(() => setExportMessage(null), 2000);
      } else {
        // Fallback to svgContent if DOM element not found
        await navigator.clipboard.writeText(svgContent);
        setExportMessage('SVG copied to clipboard!');
        setTimeout(() => setExportMessage(null), 2000);
      }
    } catch (err) {
      setExportMessage('Failed to copy to clipboard');
      setTimeout(() => setExportMessage(null), 2000);
      console.error('Failed to copy SVG:', err);
    }
  };

  return (
    <div className="flex h-screen dark:bg-gray-900">
      {/* LEFT SIDEBAR */}
      <div className="w-[300px] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* PATTERN CONTROLS - Sliders */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grid Size: {config.gridSize}×{config.gridSize}
              </label>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={config.gridSize}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  gridSize: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                style={{
                  background: darkMode 
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${((config.gridSize - 2) / 6) * 100}%, #374151 ${((config.gridSize - 2) / 6) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #2563eb 0%, #2563eb ${((config.gridSize - 2) / 6) * 100}%, #e5e7eb ${((config.gridSize - 2) / 6) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>2×2</span>
                <span>8×8</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Padding: {config.borderPadding}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                step="8"
                value={config.borderPadding}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  borderPadding: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                style={{
                  background: darkMode
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.borderPadding / 64) * 100}%, #374151 ${(config.borderPadding / 64) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.borderPadding / 64) * 100}%, #e5e7eb ${(config.borderPadding / 64) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spacing: {config.lineSpacing}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                step="8"
                value={config.lineSpacing}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  lineSpacing: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                style={{
                  background: darkMode
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.lineSpacing / 64) * 100}%, #374151 ${(config.lineSpacing / 64) * 100}%, #374151 100%)`
                    : `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.lineSpacing / 64) * 100}%, #e5e7eb ${(config.lineSpacing / 64) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empty Space: {config.emptySpace}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={config.emptySpace}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  emptySpace: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                style={{
                  background: darkMode
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${config.emptySpace}%, #374151 ${config.emptySpace}%, #374151 100%)`
                    : `linear-gradient(to right, #2563eb 0%, #2563eb ${config.emptySpace}%, #e5e7eb ${config.emptySpace}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>

          {/* SHAPES */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Shapes</h3>
            <ShapeSelector
              selectedShapes={config.shapes}
              onSelectionChange={handleShapesChange}
              shapesInPattern={shapesInPattern}
              onClearGrid={handleClearGrid}
            />
          </div>

        </div>
      </div>

      {/* MAIN CANVAS AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP ACTION BAR */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center gap-3 px-4">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
Undo
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
Redo
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2"></div>

          {/* Refresh Layout (only changes seed/layout, preserves color overrides) */}
          <button
            type="button"
            onClick={() => {
              setConfig(prev => {
                // If there are manual shapes, shuffle their positions
                if (prev.manualShapes && Object.keys(prev.manualShapes).length > 0) {
                  // Separate shapes and deleted cells
                  const shapeTypes = Object.values(prev.manualShapes).filter((s): s is ShapeType => s !== '__DELETED__');
                  const deletedCellKeys = Object.keys(prev.manualShapes).filter(
                    key => prev.manualShapes![key] === '__DELETED__'
                  );
                  
                  const gridSize = prev.gridSize;
                  const totalCells = gridSize * gridSize;
                  
                  // Create array of all cell keys
                  const allCellKeys: string[] = [];
                  for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                      allCellKeys.push(`${row}_${col}`);
                    }
                  }
                  
                  // Shuffle the cell keys
                  const shuffledCells = [...allCellKeys].sort(() => Math.random() - 0.5);
                  
                  // Create new manualShapes mapping with shuffled positions
                  const newManualShapes: Record<string, ShapeType | '__DELETED__'> = {};
                  
                  // First, preserve deleted cells in their original positions
                  deletedCellKeys.forEach(cellKey => {
                    newManualShapes[cellKey] = '__DELETED__';
                  });
                  
                  // Then, place shuffled shapes in remaining cells (excluding deleted ones)
                  const availableCells = shuffledCells.filter(key => !deletedCellKeys.includes(key));
                  shapeTypes.forEach((shapeType, index) => {
                    if (index < availableCells.length) {
                      newManualShapes[availableCells[index]] = shapeType;
                    }
                  });
                  
                  return {
                    ...prev,
                    seed: Date.now(), // Update seed for any random elements
                    manualShapes: newManualShapes,
                    // Preserve shapeColorOverrides so colors don't change
                    shapeColorOverrides: prev.shapeColorOverrides
                  };
                } else {
                  // Normal refresh - just change seed
                  return {
                    ...prev,
                    seed: Date.now(),
                    // Preserve shapeColorOverrides so colors don't change
                    shapeColorOverrides: prev.shapeColorOverrides
                  };
                }
              });
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
Refresh Layout
          </button>

          {/* Clear Pattern */}
          <button
            type="button"
            onClick={() => {
              setConfig(prev => ({
                ...prev,
                manualShapes: {}, // Clear all manually placed shapes
                emptySpace: 100 // Set to 100% to make all cells empty
              }));
            }}
            className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
          >
Clear Pattern
          </button>

          {/* Randomize All (randomizes everything like initial page load) */}
          <button
            type="button"
            onClick={() => {
              // Generate completely new random config (same as page load)
              const newConfig = generateRandomConfig();
              setConfig(newConfig);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
          >
Randomize All
          </button>
          
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Light</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* CANVAS */}
        <div 
          className="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-8 relative"
          data-canvas-container="true"
          ref={(canvasEl) => {
            if (canvasEl) {
              // Only set up once - check if already initialized
              if ((canvasEl as any).__marqueeListenersInitialized) {
                return;
              }
              
              (canvasEl as any).__marqueeListenersInitialized = true;
              
              // Track mouse down position to distinguish clicks from drags
              let mouseDownPos: {x: number, y: number} | null = null;
              let isDragging = false;
              let mouseDownTime = 0;
              let isMarqueeActive = false;
              
              const handleMouseDown = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (target.closest('.shape-toolbar')) {
                  return;
                }
                // Reset drag flag
                dragStartedRef.current = false;
                // Don't interfere with draggable elements - let dragstart handle it
                if (target.hasAttribute('draggable') || target.closest('[draggable="true"]')) {
                  // Store mouse down position but don't prevent drag
                  mouseDownPos = { x: e.clientX, y: e.clientY };
                  mouseDownTime = Date.now();
                  isDragging = false;
                  // Don't prevent default - allow drag to start
                  return;
                }
                
                // Store mouse down position (will start marquee only if mouse moves)
                mouseDownPos = { x: e.clientX, y: e.clientY };
                mouseDownTime = Date.now();
                isDragging = false;
                isMarqueeActive = false; // Reset marquee state
              };
              
              const handleMouseMove = (e: MouseEvent) => {
                // If mouse moved more than 5px, start marquee (if not already active)
                if (mouseDownPos && !isMarqueeActive) {
                  const dx = Math.abs(e.clientX - mouseDownPos.x);
                  const dy = Math.abs(e.clientY - mouseDownPos.y);
                  if (dx > 5 || dy > 5) {
                    // Start marquee selection
                    isDragging = true;
                    isMarqueeActive = true;
                    
                    const svgElement = canvasEl.querySelector('[data-svg-container] svg') as SVGSVGElement | null;
                    if (svgElement && mouseDownPos) {
                      const svgRect = svgElement.getBoundingClientRect();
                      const svgViewBox = svgElement.viewBox.baseVal;
                      const svgWidth = svgRect.width;
                      const svgHeight = svgRect.height;
                      
                      // Convert initial mouse down position to SVG coordinates
                      const initialMouseX = mouseDownPos.x - svgRect.left;
                      const initialMouseY = mouseDownPos.y - svgRect.top;
                      const startX = (initialMouseX / svgWidth) * svgViewBox.width;
                      const startY = (initialMouseY / svgHeight) * svgViewBox.height;
                      
                      // Convert current mouse position to SVG coordinates
                      const mouseX = e.clientX - svgRect.left;
                      const mouseY = e.clientY - svgRect.top;
                      const endX = (mouseX / svgWidth) * svgViewBox.width;
                      const endY = (mouseY / svgHeight) * svgViewBox.height;
                      
                      setMarqueeSelection({
                        start: { x: startX, y: startY },
                        end: { x: endX, y: endY },
                        active: true
                      });
                    }
                    e.preventDefault();
                    return;
                  }
                }
                
                // Update marquee if active
                if (isMarqueeActive) {
                  const svgElement = canvasEl.querySelector('[data-svg-container] svg') as SVGSVGElement | null;
                  if (svgElement) {
                    const svgRect = svgElement.getBoundingClientRect();
                    const svgViewBox = svgElement.viewBox.baseVal;
                    const svgWidth = svgRect.width;
                    const svgHeight = svgRect.height;
                    
                    // Convert mouse coordinates to SVG coordinates
                    // Can be outside SVG bounds (negative or > viewBox)
                    const mouseX = e.clientX - svgRect.left;
                    const mouseY = e.clientY - svgRect.top;
                    
                    // Scale to SVG viewBox coordinates (can be outside viewBox)
                    const x = (mouseX / svgWidth) * svgViewBox.width;
                    const y = (mouseY / svgHeight) * svgViewBox.height;
                    
                    setMarqueeSelection(prev => {
                      if (!prev.start) return prev;
                      return {
                        ...prev,
                        end: { x, y }
                      };
                    });
                  }
                  e.preventDefault(); // Prevent default drag behavior
                  return; // Don't process as regular drag
                }
              };
              
              const handleMouseUp = (e: MouseEvent) => {
                if (isMarqueeActive) {
                  // Finish marquee selection - use ref to get latest state
                  const currentMarquee = marqueeSelectionRef.current;
                  if (currentMarquee.start && currentMarquee.end) {
                    const svgElement = canvasEl.querySelector('[data-svg-container] svg');
                    if (svgElement) {
                      const cellsInMarquee = getCellsInMarqueeRef.current(
                        currentMarquee.start.x,
                        currentMarquee.start.y,
                        currentMarquee.end.x,
                        currentMarquee.end.y
                      );
                      
                      // Select all cells in marquee
                      if (e.shiftKey) {
                        // SHIFT: Add to existing selection
                        setSelectedCells(prevCells => {
                          const newSelection = new Set(prevCells);
                          cellsInMarquee.forEach(cellKey => newSelection.add(cellKey));
                          return newSelection;
                        });
                      } else {
                        // Regular: Replace selection
                        setSelectedCells(cellsInMarquee);
                      }
                    }
                  }
                  
                  // Clear marquee
                  isMarqueeActive = false;
                  setMarqueeSelection({ start: null, end: null, active: false });
                  mouseDownPos = null;
                  isDragging = false;
                  return;
                }
                
                // If it was a simple click (not a drag/marquee), check if we should deselect
                if (mouseDownPos && !isDragging) {
                  const dx = Math.abs(e.clientX - mouseDownPos.x);
                  const dy = Math.abs(e.clientY - mouseDownPos.y);
                  const timeSinceMouseDown = Date.now() - mouseDownTime;
                  
                  // Only treat as click if mouse didn't move much and it was quick
                  if (dx < 5 && dy < 5 && timeSinceMouseDown < 200) {
                    const target = e.target as HTMLElement;
                    
                    // Don't deselect if clicking on toolbar (check for both toolbars)
                    const isOnToolbar = target.closest('.shape-toolbar') || 
                                       (target.closest('.bg-white.rounded-lg.shadow-lg') && 
                                        (target.closest('.absolute.bottom-4') || target.closest('.absolute.bottom-8')));
                    if (isOnToolbar) {
                      mouseDownPos = null;
                      isDragging = false;
                      return;
                    }
                    
                    // Check if click is on the gray canvas area (not on SVG container)
                    // The SVG container has its own click handler for shapes/cells
                    const isOnSvgContainer = target.closest('[data-svg-container]');
                    
                    // If clicking on canvas container but NOT on SVG container (gray area around the grid)
                    // Also check that we're actually clicking on the canvas container or its direct children
                    if (!isOnSvgContainer && canvasEl.contains(target)) {
                      // Clear selections when clicking on gray canvas area
                      setSelectedShape(null);
                      setSelectedCells(new Set());
                    }
                  }
                }
                
                mouseDownPos = null;
                isDragging = false;
              };
              
              const handleMouseLeave = (e: MouseEvent) => {
                // Cancel marquee if mouse leaves canvas
                if (isMarqueeActive) {
                  isMarqueeActive = false;
                  setMarqueeSelection({ start: null, end: null, active: false });
                  mouseDownPos = null;
                  isDragging = false;
                }
              };
              
              canvasEl.addEventListener('mousedown', handleMouseDown);
              canvasEl.addEventListener('mousemove', handleMouseMove);
              canvasEl.addEventListener('mouseup', handleMouseUp);
              canvasEl.addEventListener('mouseleave', handleMouseLeave);
              
              // Store handlers for cleanup
              (canvasEl as any).__marqueeHandlers = {
                mousedown: handleMouseDown,
                mousemove: handleMouseMove,
                mouseup: handleMouseUp,
                mouseleave: handleMouseLeave
              };
            }
          }}
        >
          {/* Keep existing canvas/pattern display here */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl w-full max-w-7xl flex items-center justify-center">
            <div
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center mx-auto"
              style={{
                width: `${previewCanvasSize[0]}px`,
                height: `${previewCanvasSize[1]}px`,
                maxWidth: '100%',
                maxHeight: `${maxDisplayHeight}px`,
              }}
            >
              {error ? (
                <div className="flex items-center justify-center w-full h-full text-red-600 bg-red-50 p-4">
                  <div className="text-center">
                    <p className="font-semibold mb-2">Error generating pattern</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : svgContent ? (
                <div
                  className="w-full h-full"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    minHeight: 0,
                  }}
                >
                  <div
                    ref={(el) => {
                      if (el) {
                        // Only set up once - check if already initialized
                        if ((el as any).__listenersInitialized) {
                          return;
                        }
                        
                        console.log('[PatternGenerator] Setting up event listeners on SVG container', {
                          hasSvg: !!el.querySelector('svg')
                        });
                        
                        (el as any).__listenersInitialized = true;
                        
                        // Remove old listeners if exist
                        el.onclick = null;
                        
                        // Clean up old dragstart and dragend listeners
                        const oldDragStart = (el as any).__dragStartHandler;
                        const oldDragEnd = (el as any).__dragEndHandler;
                        if (oldDragStart) {
                          el.removeEventListener('dragstart', oldDragStart);
                        }
                        if (oldDragEnd) {
                          el.removeEventListener('dragend', oldDragEnd);
                        }
                        
                        // Track mouse down position to distinguish clicks from drags
                        let mouseDownPos: {x: number, y: number} | null = null;
                        let isDragging = false;
                        let mouseDownTime = 0;
                        
                        el.onmousedown = (e: MouseEvent) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('.shape-toolbar')) {
                            return;
                          }
                          // Reset drag flag
                          dragStartedRef.current = false;
                          // Don't interfere with draggable elements - let dragstart handle it
                          if (target.hasAttribute('draggable') || target.closest('[draggable="true"]')) {
                            // Store mouse down position but don't prevent drag
                            mouseDownPos = { x: e.clientX, y: e.clientY };
                            mouseDownTime = Date.now();
                            isDragging = false;
                            // Don't prevent default - allow drag to start
                            return;
                          }
                          
                          // Store mouse down position (for click detection, not marquee)
                          mouseDownPos = { x: e.clientX, y: e.clientY };
                          mouseDownTime = Date.now();
                          isDragging = false;
                        };
                        
                        el.onmousemove = (e: MouseEvent) => {
                          // If mouse moved more than 5px, it's a drag, not a click
                          if (mouseDownPos) {
                            const dx = Math.abs(e.clientX - mouseDownPos.x);
                            const dy = Math.abs(e.clientY - mouseDownPos.y);
                            if (dx > 5 || dy > 5) {
                              isDragging = true;
                            }
                          }
                        };
                        
                        // Add click event delegation - only select if it wasn't a drag
                        el.onclick = (e: MouseEvent) => {
                          // If dragstart fired, don't select
                          if (dragStartedRef.current) {
                            dragStartedRef.current = false;
                            mouseDownPos = null;
                            isDragging = false;
                            return;
                          }
                          
                          // If this was a drag (mouse moved >5px), don't select
                          if (isDragging) {
                            mouseDownPos = null;
                            isDragging = false;
                            return;
                          }
                          
                          // Also check if enough time has passed (quick clicks might be drags)
                          const timeSinceMouseDown = Date.now() - mouseDownTime;
                          if (timeSinceMouseDown > 200) {
                            // Too long, probably a drag
                            mouseDownPos = null;
                            isDragging = false;
                            return;
                          }
                          
                          const target = e.target as HTMLElement;
                          // Don't select if clicking on toolbar
                          if (target.closest('.shape-toolbar')) {
                            return;
                          }
                          
                          // Track if we clicked on a cell or shape
                          let clickedOnCell = false;
                          let clickedOnShape = false;
                          
                          // Get SVG element to calculate cell position
                          const svgElement = el.querySelector('svg');
                          if (svgElement) {
                            const svgRect = svgElement.getBoundingClientRect();
                            const svgViewBox = svgElement.viewBox.baseVal;
                            const svgWidth = svgRect.width;
                            const svgHeight = svgRect.height;
                            
                            // Convert mouse coordinates to SVG coordinates
                            const mouseX = e.clientX - svgRect.left;
                            const mouseY = e.clientY - svgRect.top;
                            
                            // Scale to SVG viewBox coordinates
                            const x = (mouseX / svgWidth) * svgViewBox.width;
                            const y = (mouseY / svgHeight) * svgViewBox.height;
                            
                            // Get cell from point
                            const cell = getCellFromPoint(x, y);
                            if (cell) {
                              clickedOnCell = true;
                              const cellKey = `${cell.row}_${cell.col}`;
                              
                              if (e.shiftKey) {
                                // SHIFT+Click: Toggle cell in selection
                                setSelectedCells(prev => {
                                  const newSelection = new Set(prev);
                                  if (newSelection.has(cellKey)) {
                                    // Remove if already selected
                                    newSelection.delete(cellKey);
                                  } else {
                                    // Add to selection
                                    newSelection.add(cellKey);
                                  }
                                  return newSelection;
                                });
                              } else {
                                // Regular click: Clear selection and select only this cell
                                setSelectedCells(new Set([cellKey]));
                              }
                            }
                          }
                          
                          const shapeType = target.getAttribute('data-shape-type') as ShapeType | null;
                          const cellIndex = target.getAttribute('data-cell-index');
                          if (shapeType) {
                            clickedOnShape = true;
                            // Get position relative to the container
                            const rect = target.getBoundingClientRect();
                            const containerRect = el.getBoundingClientRect();
                            // Use center of the clicked element for toolbar positioning
                            // Position toolbar near the shape (slightly above and to the right)
                            const x = rect.left - containerRect.left + rect.width / 2;
                            const y = rect.top - containerRect.top + rect.height / 2;
                            setSelectedShape({
                              shapeType,
                              x,
                              y,
                              cellIndex: cellIndex ? parseInt(cellIndex, 10) : undefined
                            });
                          } else if (!clickedOnCell) {
                            // Click outside both shape and cell - clear both selections
                            setSelectedShape(null);
                            setSelectedCells(new Set());
                          }
                          mouseDownPos = null;
                          isDragging = false;
                        };
                        
                        // Add drag start delegation for shapes - use capture phase to catch events early
                        const dragStartHandler = (e: DragEvent) => {
                          // Mark that drag started
                          dragStartedRef.current = true;
                          
                          console.log('[Drag] dragstart event fired', {
                            target: e.target,
                            targetTag: (e.target as HTMLElement)?.tagName,
                            hasDataShapeType: (e.target as HTMLElement)?.hasAttribute('data-shape-type'),
                            hasDataCellIndex: (e.target as HTMLElement)?.hasAttribute('data-cell-index'),
                            hasDataCellKey: (e.target as HTMLElement)?.hasAttribute('data-cell-key'),
                            isDraggable: (e.target as HTMLElement)?.getAttribute('draggable'),
                            manualShapes: config.manualShapes,
                            currentTarget: e.currentTarget
                          });
                          
                          const target = e.target as HTMLElement;
                          
                          // Don't drag if clicking on selection border
                          if (target.hasAttribute('data-selected-shape') && !target.hasAttribute('data-shape-type')) {
                            console.log('[Drag] Ignoring drag on selection border');
                            e.preventDefault();
                            e.stopPropagation();
                            dragStartedRef.current = false;
                            return;
                          }
                          
                          // For multi-slot shapes, we might click on a path element
                          // Try to find the shape type and cell info from the clicked element or its siblings
                          let shapeType = target.getAttribute('data-shape-type') as ShapeType | null;
                          let cellIndex = target.getAttribute('data-cell-index');
                          let cellKey = target.getAttribute('data-cell-key');
                          
                          // If we don't have the data on the clicked element, try to find it from parent or siblings
                          if (!shapeType || !cellIndex) {
                            // Try to find a sibling or parent with the data
                            const parent = target.parentElement;
                            if (parent) {
                              // Look for other elements in the same cell
                              const allElements = parent.querySelectorAll('[data-shape-type]');
                              for (const el of Array.from(allElements)) {
                                const elShapeType = el.getAttribute('data-shape-type');
                                const elCellIndex = el.getAttribute('data-cell-index');
                                const elCellKey = el.getAttribute('data-cell-key');
                                
                                // If this element is at the same position, use its data
                                if (elCellKey === cellKey || (elCellIndex === cellIndex && elCellIndex)) {
                                  shapeType = elShapeType as ShapeType | null;
                                  cellIndex = elCellIndex;
                                  cellKey = elCellKey;
                                  break;
                                }
                              }
                            }
                          }
                          
                          console.log('[Drag] Extracted data', { shapeType, cellIndex, cellKey });
                          
                          if (shapeType && cellIndex !== null) {
                            // Find the cell key from row/col if not directly on element
                            const finalCellKey = cellKey || (() => {
                              const idx = parseInt(cellIndex, 10);
                              const row = Math.floor(idx / config.gridSize);
                              const col = idx % config.gridSize;
                              return `${row}_${col}`;
                            })();
                            
                            console.log('[Drag] Final cell key', { finalCellKey, isManualShape: config.manualShapes?.[finalCellKey] });
                            
                            // Always allow dragging shapes on the grid
                            if (finalCellKey) {
                              if (!e.dataTransfer) return;
                              console.log('[Drag] Allowing drag, setting data transfer');
                              e.dataTransfer.setData('text/plain', shapeType);
                              e.dataTransfer.setData('application/x-cell-key', finalCellKey);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedShape(shapeType);
                              setIsDraggingFromGrid(true);
                              setDraggedCellKey(finalCellKey);
                              
                              // Add visual feedback - make all elements in this cell semi-transparent
                              const svg = target.closest('svg');
                              if (svg) {
                                const cellElements = svg.querySelectorAll(`[data-cell-key="${finalCellKey}"]`);
                                cellElements.forEach((el: Element) => {
                                  if (el instanceof SVGElement && el.hasAttribute('data-shape-type')) {
                                    el.style.opacity = '0.5';
                                    el.style.cursor = 'grabbing';
                                  }
                                });
                              }
                            } else {
                              console.log('[Drag] Drag not allowed - no cell key');
                              e.preventDefault();
                              e.stopPropagation();
                              dragStartedRef.current = false;
                            }
                          } else {
                            console.log('[Drag] Missing required data', { shapeType, cellIndex });
                            e.preventDefault();
                            e.stopPropagation();
                            dragStartedRef.current = false;
                          }
                        };
                        
                        // Add dragend to restore opacity
                        const dragEndHandler = (e: DragEvent) => {
                          console.log('[Drag] dragend event fired');
                          const target = e.target as HTMLElement;
                          
                          // Restore opacity for all elements in the dragged cell
                          const svg = target.closest('svg');
                          if (svg && draggedCellKey) {
                            const cellElements = svg.querySelectorAll(`[data-cell-key="${draggedCellKey}"]`);
                            cellElements.forEach((el: Element) => {
                              if (el instanceof SVGElement && el.hasAttribute('data-shape-type')) {
                                el.style.opacity = '';
                                el.style.cursor = '';
                              }
                            });
                          } else if (target instanceof SVGElement) {
                            target.style.opacity = '';
                            target.style.cursor = '';
                          }
                          
                          setDraggedShape(null);
                          setDragOverCell(null);
                          setIsDraggingFromGrid(false);
                          setDraggedCellKey(null);
                        };
                        
                        // Store handlers on element for reuse
                        (el as any).__dragStartHandler = dragStartHandler;
                        (el as any).__dragEndHandler = dragEndHandler;
                        
                        // Use capture phase to ensure we catch the event
                        el.addEventListener('dragstart', dragStartHandler, true);
                        el.addEventListener('dragend', dragEndHandler, true);
                        
                        // Also add data attribute to find this container later
                        el.setAttribute('data-svg-container', 'true');
                        
                        // Also try attaching directly to SVG elements after a short delay
                        setTimeout(() => {
                          const svg = el.querySelector('svg');
                          if (svg) {
                            console.log('[PatternGenerator] Found SVG, checking draggable elements');
                            const draggableElements = svg.querySelectorAll('[draggable="true"]');
                            console.log('[PatternGenerator] Found', draggableElements.length, 'draggable elements');
                            
                            // Attach listeners directly to SVG elements as backup
                            draggableElements.forEach((svgEl: Element) => {
                              if (!(svgEl as any).__dragListenerAttached) {
                                console.log('[PatternGenerator] Attaching drag listener to element', {
                                  tagName: svgEl.tagName,
                                  hasDataShapeType: svgEl.hasAttribute('data-shape-type'),
                                  hasDataCellKey: svgEl.hasAttribute('data-cell-key')
                                });
                                svgEl.addEventListener('dragstart', dragStartHandler as EventListener, true);
                                svgEl.addEventListener('dragend', dragEndHandler as EventListener, true);
                                (svgEl as any).__dragListenerAttached = true;
                                (svgEl as any).__dragStartHandler = dragStartHandler;
                                (svgEl as any).__dragEndHandler = dragEndHandler;
                              }
                            });
                          }
                        }, 100);
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    className="w-full h-full"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      cursor: draggedShape ? 'copy' : 'pointer',
                      pointerEvents: 'auto'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: svgContent
                        .replace(/<svg([^>]*)\s+width="[^"]*"([^>]*)>/i, '<svg$1$2>')
                        .replace(/<svg([^>]*)\s+height="[^"]*"([^>]*)>/i, '<svg$1$2>')
                        .replace(/<svg([^>]*)>/, '<svg$1 style="width: 100%; height: 100%; display: block; pointer-events: none; overflow: visible;">')
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500">
                  Pattern will appear here
                </div>
              )}
            </div>
          </div>
          {/* Cell selection toolbar - appears at bottom when cells are selected */}
          {selectedCells.size > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 pointer-events-auto select-none"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const newManualShapes = { ...prev.manualShapes || {} };
                        // Mark all selected cells as deleted
                        selectedCells.forEach(cellKey => {
                          newManualShapes[cellKey] = '__DELETED__' as any;
                        });
                        return {
                          ...prev,
                          manualShapes: newManualShapes
                        };
                      });
                      // Remove transforms for deleted cells
                      setCellTransforms(prev => {
                        const newTransforms = { ...prev };
                        selectedCells.forEach(cellKey => {
                          delete newTransforms[cellKey];
                        });
                        return newTransforms;
                      });
                      setSelectedCells(new Set());
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700 transition-colors"
                  >
                    Delete {selectedCells.size > 1 ? `(${selectedCells.size})` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCells(new Set())}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Toolbar absolutely positioned below pattern container */}
          {selectedShape && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
              <div
                className="shape-toolbar bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 pointer-events-auto select-none"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ userSelect: 'none' }}
              >
                <div className="flex items-center gap-2">
                  {/* TEMPORARILY DISABLED: Shuffle Colors button
                  <button
                    type="button"
                    onClick={() => {
                      handleShuffleShapeColors(selectedShape.shapeType);
                      // Keep toolbar open after shuffling
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    Shuffle Colors
                  </button>
                  */}
                  {/* TEMPORARILY DISABLED: Cancel button
                  <button
                    type="button"
                    onClick={() => handleCancelShapeColors(selectedShape.shapeType)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                  */}
                  {selectedShape.cellIndex !== undefined && (() => {
                    const cellIndex = selectedShape.cellIndex;
                    const row = Math.floor(cellIndex / config.gridSize);
                    const col = cellIndex % config.gridSize;
                    const cellKey = `${row}_${col}`;
                    // Show delete button for all shapes
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setConfig(prev => {
                            const newManualShapes = { ...prev.manualShapes || {} };
                            // Mark this cell as deleted by setting it to a sentinel value
                            // This prevents regeneration while keeping the cell explicitly empty
                            newManualShapes[cellKey] = '__DELETED__' as any;
                            return {
                              ...prev,
                              manualShapes: newManualShapes
                            };
                          });
                          setSelectedShape(null);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setSelectedShape(null)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-[300px] bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* COLORS SECTION */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Colors</h3>
            
            {/* Background Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={handleBackgroundColorChange}
                  className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={config.backgroundColor.toUpperCase()}
                  onChange={(e) => {
                    handleHexInputChange(e, (color) => {
                      setSyncBackgroundColor(false); // Disable sync when user types
                      setConfig(prev => ({
                        ...prev,
                        backgroundColor: color
                      }));
                    });
                  }}
                  onFocus={handleHexInputFocus}
                  onClick={handleHexInputClick}
                  onPaste={(e) => {
                    handleHexInputPaste(e, (color) => {
                      setSyncBackgroundColor(false); // Disable sync when user pastes
                      setConfig(prev => ({
                        ...prev,
                        backgroundColor: color
                      }));
                    });
                  }}
                  className="flex-1 px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="#FFFFFF"
                />
              </div>
              {/* Sync checkbox */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncBackgroundColor}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSyncBackgroundColor(checked);
                    if (checked) {
                      // Re-enable sync: reset to theme's slot_1 color
                      setConfig(prev => ({
                        ...prev,
                        backgroundColor: prev.colors[0] || prev.backgroundColor
                      }));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Use theme BG color</span>
              </label>
            </div>

            {/* Color Palettes */}
            <PaletteSelector
              currentColors={config.colors}
              onPaletteSelect={handleColorsChange}
            />

            {/* Active Colors List */}
            <ColorPickers
              colors={config.colors}
              onColorsChange={handleColorsChange}
            />

            {/* Randomize Colors Button */}
            <button
              type="button"
              onClick={handleRandomizeColors}
              className="w-full mt-3 px-4 py-3 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors border border-purple-200 dark:border-purple-700 min-h-[44px] touch-manipulation"
            >
Randomize Colors
            </button>
          </div>

          {/* TILE BORDER SECTION */}
          <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tile Border</h3>
            
            {/* Enable border checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.stroke?.enabled || false}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  stroke: { 
                    ...(prev.stroke || { enabled: false, width: 1, color: '#000000' }), 
                    enabled: e.target.checked 
                  }
                }))}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Border</span>
            </label>
            
            {/* Border width input */}
            {config.stroke?.enabled && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  Border Width (1-10px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.stroke?.width || 1}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                    setConfig(prev => ({
                      ...prev,
                      stroke: { 
                        ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), 
                        width: value 
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                
                {/* Border color input */}
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  Border Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.stroke?.color || '#000000'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      stroke: { 
                        ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), 
                        color: e.target.value 
                      }
                    }))}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={(config.stroke?.color || '#000000').toUpperCase()}
                    onChange={(e) => handleHexInputChange(e, (color) => {
                      setConfig(prev => ({
                        ...prev,
                        stroke: { 
                          ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), 
                          color: color 
                        }
                      }));
                    })}
                    onFocus={handleHexInputFocus}
                    onClick={handleHexInputClick}
                    onPaste={(e) => handleHexInputPaste(e, (color) => {
                      setConfig(prev => ({
                        ...prev,
                        stroke: { 
                          ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), 
                          color: color 
                        }
                      }));
                    })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* EXPORT SECTION */}
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Export</h3>
            <div className="space-y-2">
              {exportMessage && (
                <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium transition-opacity">
                  {exportMessage}
                </div>
              )}
              <button 
                type="button"
                className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation"
              >
Export PNG
              </button>
              <button
                type="button"
                onClick={handleCopySVG}
                className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
Copy SVG
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSvgMenu(!showSvgMenu)}
                  className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                >
Export SVG
                  <svg
                    className={`w-4 h-4 transition-transform ${showSvgMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSvgMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSvgMenu(false)}
                    />
                    <div className="absolute left-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                      <button
                        type="button"
                        onClick={handleDownloadSVG}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download SVG
                      </button>
                      <button
                        type="button"
                        onClick={handleCopySVG}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy SVG
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

