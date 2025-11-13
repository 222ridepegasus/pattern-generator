import React, { useState, useEffect, useRef } from 'react';
import type { PatternConfig, ShapeType } from '../lib/types';
import { generatePattern, patternToSVG } from '../lib/patternEngine';
import { availableShapes } from '../lib/shapeLoader.js';
import { COLOR_PALETTES } from '../lib/types';
import ColorPickers from './ColorPickers';
import PaletteSelector from './PaletteSelector';

// Helper function to normalize hex color input
const normalizeHexColor = (value: string): string => {
  // Remove any whitespace
  value = value.trim();
  // Remove # if present
  value = value.replace(/^#/, '');
  // Only allow hex characters (0-9, A-F, a-f)
  value = value.replace(/[^0-9A-Fa-f]/g, '');
  // Limit to 6 characters
  value = value.slice(0, 6);
  // Add # prefix
  return value ? `#${value.toUpperCase()}` : '#';
};

/**
 * Cell data structure - our single source of truth
 * Each cell either has a shape or is null (empty)
 */
interface CellData {
  shapeId: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  bgColorIndex: number;
  fgColorIndex: number;
}

// Helper to pick random theme on load
function getRandomTheme() {
    const themeNames = Object.keys(COLOR_PALETTES);
    return themeNames[Math.floor(Math.random() * themeNames.length)];
  }

export default function PatternGenerator() {
  // Helper function to pick 4-8 random shapes
  const pickRandomShapes = (): ShapeType[] => {
    const count = Math.floor(Math.random() * 5) + 4; // Random between 4-8
    const shuffled = [...availableShapes.nautical].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count) as ShapeType[];
  };

  // Get random theme on load
  const initialTheme = getRandomTheme();
  const initialColors = COLOR_PALETTES[initialTheme as keyof typeof COLOR_PALETTES];

  // Basic config (grid settings, colors, shapes)
  const [config, setConfig] = useState<PatternConfig>({
    seed: Date.now(),
    patternType: 'gridCentered',
    containerSize: [800, 800],
    gridSize: 4,
    borderPadding: 16,
    lineSpacing: 8,
    emptySpace: 0,
    spacing: 0,
    backgroundColor: initialColors[0],
    shapes: pickRandomShapes(),
    colors: initialColors,
    rotation: { enabled: false },
    mirror: { horizontal: false, vertical: false },
    preserveLayout: true,
    stroke: { enabled: false, width: 1, color: '#000000' }
  });

  const [patternCells, setPatternCells] = useState<Record<string, CellData | null>>({});
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [svgContent, setSvgContent] = useState<string>('');
  const [syncBackgroundColor, setSyncBackgroundColor] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [dragOverBackgroundColor, setDragOverBackgroundColor] = useState(false);
  const [dragOverBorderColor, setDragOverBorderColor] = useState(false);
  const [shapePreviews, setShapePreviews] = useState<Record<string, string>>({});
  const [shapesLoading, setShapesLoading] = useState(true);
  
  // Undo/Redo state
  type HistoryState = {
    patternCells: Record<string, CellData | null>;
    config: PatternConfig;
  };
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingOrRedoing = useRef(false);

  // Handle background color hex input change - normalize while typing
  const handleBackgroundColorHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalized = normalizeHexColor(value);
    setSyncBackgroundColor(false);
    setConfig(prev => ({ ...prev, backgroundColor: normalized }));
  };

  // Handle background color hex input focus - select all text
  const handleBackgroundColorHexFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  // Handle background color hex input click - select all on click
  const handleBackgroundColorHexClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  // Handle background color hex input paste - works with selected text
  const handleBackgroundColorHexPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData('text');
    const normalized = normalizeHexColor(pastedText);
    if (normalized.length > 1) { // More than just '#'
      setSyncBackgroundColor(false);
      setConfig(prev => ({ ...prev, backgroundColor: normalized }));
      requestAnimationFrame(() => {
        e.currentTarget.select();
      });
    }
  };

  // Handle border color hex input change - normalize while typing
  const handleBorderColorHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalized = normalizeHexColor(value);
    setConfig(prev => ({
      ...prev,
      stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: normalized }
    }));
  };

  // Handle border color hex input focus - select all text
  const handleBorderColorHexFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  // Handle border color hex input click - select all on click
  const handleBorderColorHexClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  // Handle border color hex input paste - works with selected text
  const handleBorderColorHexPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
    const pastedText = e.clipboardData.getData('text');
    const normalized = normalizeHexColor(pastedText);
    if (normalized.length > 1) { // More than just '#'
      setConfig(prev => ({
        ...prev,
        stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: normalized }
      }));
      requestAnimationFrame(() => {
        e.currentTarget.select();
      });
    }
  };

  // Undo/Redo functions
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setPatternCells(state.patternCells);
      setConfig(state.config);
      setTimeout(() => { isUndoingOrRedoing.current = false; }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setPatternCells(state.patternCells);
      setConfig(state.config);
      setTimeout(() => { isUndoingOrRedoing.current = false; }, 0);
    }
  };

  // Handle drag start for background color - make it draggable to theme colors
  const handleBackgroundColorDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', config.backgroundColor);
    e.dataTransfer.setData('application/x-source', 'background-color');
  };

  // Handle drag over background color - allow drop from theme colors
  const handleBackgroundColorDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverBackgroundColor(true);
  };

  // Handle drag leave background color
  const handleBackgroundColorDragLeave = () => {
    setDragOverBackgroundColor(false);
  };

  // Handle drop on background color - update from theme color, border color, or any color
  const handleBackgroundColorDrop = (e: React.DragEvent) => {
        e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData('application/x-source');
    // Accept drops from theme colors, border color, or if no source (fallback)
    // Don't accept drops from background-color itself (would be redundant)
    if (source !== 'background-color') {
      const colorValue = e.dataTransfer.getData('text/plain');
      if (colorValue) {
        const normalized = normalizeHexColor(colorValue);
        if (normalized.length > 1) {
          setSyncBackgroundColor(false); // Uncheck "Use theme BG color"
          setConfig(prev => ({ ...prev, backgroundColor: normalized }));
        }
      }
    }
    setDragOverBackgroundColor(false);
  };

  // Handle drag start for border color - make it draggable to theme colors
  const handleBorderColorDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', config.stroke?.color || '#000000');
    e.dataTransfer.setData('application/x-source', 'border-color');
  };

  // Handle drag over border color - allow drop from theme colors
  const handleBorderColorDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverBorderColor(true);
  };

  // Handle drag leave border color
  const handleBorderColorDragLeave = () => {
    setDragOverBorderColor(false);
  };

  // Handle drop on border color - update from theme color, background color, or any color
  const handleBorderColorDrop = (e: React.DragEvent) => {
        e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData('application/x-source');
    // Accept drops from theme colors, background color, or if no source (fallback)
    // Don't accept drops from border-color itself (would be redundant)
    if (source !== 'border-color') {
      const colorValue = e.dataTransfer.getData('text/plain');
      if (colorValue) {
        const normalized = normalizeHexColor(colorValue);
        if (normalized.length > 1) {
          setConfig(prev => ({
            ...prev,
            stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: normalized }
          }));
        }
      }
    }
    setDragOverBorderColor(false);
  };

  // Track window size for responsive canvas display
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load shape previews on mount
  useEffect(() => {
    const loadShapePreviews = async () => {
      setShapesLoading(true);
      const previews: Record<string, string> = {};
      const shapesToLoad = availableShapes.nautical.slice(0, 26); // Load all 26 nautical flags
      
      await Promise.all(
        shapesToLoad.map(async (shapeId) => {
          try {
            const response = await fetch(`/shapes/nautical/${shapeId}.svg`);
            if (response.ok) {
              let svgText = await response.text();
              
              // Modify colors for dark UI sidebar preview only (doesn't affect pattern engine)
              // Simple rules: white → transparent, black → gray-500
              svgText = svgText
                .replace(/fill="([^"]*)"/g, (match, color) => {
                  const lowerColor = color.toLowerCase();
                  if (lowerColor === 'none') return match;
                  // Make all white transparent
                  if (lowerColor === 'white' || lowerColor === '#ffffff' || lowerColor === '#fff') {
                    return 'fill="none"';
                  }
                  // Make all black gray-500
                  if (lowerColor === 'black' || lowerColor === '#000000' || lowerColor === '#000') {
                    return 'fill="#6b7280"';
                  }
                  return match;
                })
                .replace(/style="([^"]*)"/g, (match, styleContent) => {
                  // Handle inline styles
                  let newStyle = styleContent
                    .replace(/fill:\s*white/gi, 'fill:none')
                    .replace(/fill:\s*#fff(fff)?/gi, 'fill:none')
                    .replace(/fill:\s*black/gi, 'fill:#6b7280')
                    .replace(/fill:\s*#000(000)?/gi, 'fill:#6b7280');
                  return `style="${newStyle}"`;
                });
              
              // Create object URL from modified SVG
              const blob = new Blob([svgText], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              previews[shapeId] = url;
            } else {
              console.warn(`Failed to load shape: ${shapeId}`);
            }
          } catch (error) {
            console.error(`Error loading shape ${shapeId}:`, error);
          }
        })
      );
      
      setShapePreviews(previews);
      setShapesLoading(false);
    };

    loadShapePreviews();

    // Cleanup: revoke all object URLs when component unmounts
    return () => {
      Object.values(shapePreviews).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate display dimensions (SVG stays 800×800, we just scale the display)
  const [containerWidth, containerHeight] = config.containerSize;
  const availableWidth = windowSize.width > 0 ? windowSize.width : (typeof window !== 'undefined' ? window.innerWidth : 1200);
  const availableHeight = windowSize.height > 0 ? windowSize.height : (typeof window !== 'undefined' ? window.innerHeight : 800);
  
  // Calculate max display size (85% of available space, never bigger than 800px)
  const maxDisplayWidth = Math.min(800, availableWidth * 0.85);
  const maxDisplayHeight = Math.min(800, (availableHeight - 200) * 0.85);
  
  // Calculate scale to fit (ONLY scale down, never up)
  const scaleX = maxDisplayWidth / containerWidth;
  const scaleY = maxDisplayHeight / containerHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  
  // Calculate final display dimensions
  const displayWidth = containerWidth * scale;
  const displayHeight = containerHeight * scale;
  
  // Generate SVG whenever patternCells or config changes
  useEffect(() => {
    async function generateSVG() {
      try {
        const cells: Array<{
          row: number;
          col: number;
          shapeId: string;
          bgColorIndex: number;
          fgColorIndex: number;
        }> = [];

        const gridSize = config.gridSize;

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const cellKey = `${row}_${col}`;
            const cell = patternCells[cellKey];

            if (cell) {
              cells.push({
                row,
                col,
                shapeId: cell.shapeId,
                bgColorIndex: cell.bgColorIndex,
                fgColorIndex: cell.fgColorIndex,
              });
            }
          }
        }

        const elements = await generatePattern(config, cells);
        const svg = patternToSVG(elements, config.containerSize, config.backgroundColor);
        setSvgContent(svg);
      } catch (err) {
        console.error('[PatternGenerator] Error generating SVG:', err);
      }
    }

    generateSVG();
  }, [patternCells, config]);

  // Track patternCells and config changes for undo/redo
  useEffect(() => {
    if (!isUndoingOrRedoing.current && Object.keys(patternCells).length > 0) {
      setHistory(prev => {
        // Remove any future history if we're not at the end
        const newHistory = prev.slice(0, historyIndex + 1);
        // Add new state (deep copy both patternCells and config)
        newHistory.push({
          patternCells: JSON.parse(JSON.stringify(patternCells)),
          config: JSON.parse(JSON.stringify(config))
        });
        // Keep only last 20
        if (newHistory.length > 20) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 19));
    }
  }, [patternCells, config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-randomize on first load
  useEffect(() => {
    handleRandomizeAll();
  }, []);

  // Randomization functions
  const handleRandomizeAll = () => {
    // Randomize everything!
    const randomGridSize = Math.floor(Math.random() * 7) + 2; // 2-8
    const randomBorderPadding = Math.floor(Math.random() * 9) * 8; // 0, 8, 16, 24, 32, 40, 48, 56, 64
    const randomSpacing = Math.floor(Math.random() * 9) * 8; // 0, 8, 16, 24, 32, 40, 48, 56, 64
    
    // Random theme
    const randomTheme = getRandomTheme();
    const randomColors = COLOR_PALETTES[randomTheme as keyof typeof COLOR_PALETTES];
    
    // Random shape subset (4-8 shapes)
    const newShapes = pickRandomShapes();
    
    // Update config with all randomized values
    setConfig(prev => ({
      ...prev,
          gridSize: randomGridSize,
          borderPadding: randomBorderPadding,
      lineSpacing: randomSpacing,
      shapes: newShapes,
          colors: randomColors,
      backgroundColor: randomColors[0],
    }));
    
    // Fill ALL cells with random shapes from new subset
    const newCells: Record<string, CellData | null> = {};
    const randomShape = () => newShapes[Math.floor(Math.random() * newShapes.length)];
    
    for (let row = 0; row < randomGridSize; row++) {
      for (let col = 0; col < randomGridSize; col++) {
        const cellKey = `${row}_${col}`;
        newCells[cellKey] = {
          shapeId: randomShape(),
          rotation: 0,
          flipH: false,
          flipV: false,
          bgColorIndex: 0,
          fgColorIndex: 1,
        };
      }
    }
    
    setPatternCells(newCells);
    setSyncBackgroundColor(true); // Reset to use theme BG color
  };

  const handleShuffle = () => {
    const currentShapes = Object.values(patternCells).filter(cell => cell !== null);
    if (currentShapes.length === 0) return;
    
    const shuffled = [...currentShapes].sort(() => Math.random() - 0.5);
    const newCells: Record<string, CellData | null> = {};
    const gridSize = config.gridSize;
    let shapeIndex = 0;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellKey = `${row}_${col}`;
        if (shapeIndex < shuffled.length) {
          newCells[cellKey] = shuffled[shapeIndex];
          shapeIndex++;
        } else {
          newCells[cellKey] = null;
        }
      }
    }
    
    setPatternCells(newCells);
  };

  const handleRandomShapes = () => {
    // Keep current shape subset (don't change config.shapes)
    // Only replace shapes in cells with random from CURRENT subset
    if (config.shapes.length === 0) return; // Safety check
    
    const newCells: Record<string, CellData | null> = {};
    const randomShape = () => config.shapes[Math.floor(Math.random() * config.shapes.length)];
    
    // Iterate through all cells in the grid (not just existing patternCells)
    const gridSize = config.gridSize;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellKey = `${row}_${col}`;
        const cell = patternCells[cellKey];
    if (cell) {
          // Replace shape with random from current subset
          newCells[cellKey] = { ...cell, shapeId: randomShape() };
      } else {
          // Keep empty cells empty
          newCells[cellKey] = null;
        }
      }
    }
    
    setPatternCells(newCells);
  };

  const handleSingleShape = () => {
    // Pick a random shape from all available shapes
    const allShapes = availableShapes.nautical;
    const randomShape = allShapes[Math.floor(Math.random() * allShapes.length)] as ShapeType;
    
    // Update config.shapes to only contain this single shape
    setConfig(prev => ({ ...prev, shapes: [randomShape] }));
    
    // Fill all cells with this single shape
    const newCells: Record<string, CellData | null> = {};
    const gridSize = config.gridSize;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellKey = `${row}_${col}`;
        newCells[cellKey] = {
          shapeId: randomShape,
          rotation: 0,
          flipH: false,
          flipV: false,
          bgColorIndex: 0,
          fgColorIndex: 1,
        };
      }
    }
    
    setPatternCells(newCells);
  };

  const handleClear = () => {
    setPatternCells({});
  };

  // Copy SVG to clipboard
  const handleCopySVG = async () => {
    try {
        await navigator.clipboard.writeText(svgContent);
      alert('SVG copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy SVG:', err);
    }
  };

  // Export SVG as file
  const handleExportSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* LEFT SIDEBAR - Grid Settings & Shape Browser */}
      <div className="hidden md:block w-[280px] bg-gray-800 border-r border-gray-700 overflow-y-auto custom-scrollbar">
        <div className="pl-4 pr-3 py-6 space-y-6">
          {/* Grid Settings Section */}
            <div>
            <h3 className="text-white text-lg font-semibold mb-4">Grid Settings</h3>
            
            {/* Grid Size Slider */}
            <div className="mb-6">
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Grid Size: {config.gridSize}×{config.gridSize}
              </label>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={config.gridSize}
                onChange={(e) => setConfig(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2×2</span>
                <span>8×8</span>
              </div>
            </div>

            {/* Border Padding Slider */}
            <div className="mb-6">
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Border Padding: {config.borderPadding}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                step="8"
                value={config.borderPadding}
                onChange={(e) => setConfig(prev => ({ ...prev, borderPadding: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0px</span>
                <span>64px</span>
            </div>
            </div>

            {/* Line Spacing Slider */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Spacing: {config.lineSpacing}px
              </label>
              <input
                type="range"
                min="0"
                max="64"
                step="8"
                value={config.lineSpacing}
                onChange={(e) => setConfig(prev => ({ ...prev, lineSpacing: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0px</span>
                <span>64px</span>
            </div>
            </div>
          </div>

          {/* Shape Browser Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Shapes</h3>
            {shapesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400 text-sm">Loading shapes...</div>
          </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableShapes.nautical.slice(0, 26).map((shapeId) => {
                  const isActive = config.shapes.includes(shapeId as ShapeType);
                  
                  return (
                    <div
                      key={shapeId}
                      className={`aspect-square bg-gray-700 rounded-lg border-2 cursor-pointer flex items-center justify-center overflow-hidden p-2 transition-all ${
                        isActive 
                          ? 'border-[#3E8AE2]' 
                          : 'border-transparent hover:border-blue-500 opacity-40'
                      }`}
                      title={shapeId}
                    >
                      {shapePreviews[shapeId] ? (
                        <img
                          src={shapePreviews[shapeId]}
                          alt={shapeId}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">?</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER - Canvas with Floating Buttons */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto custom-scrollbar">
        {/* Floating Randomization Buttons */}
        <div className="absolute top-4 md:top-6≤≥ left-1/2 transform -translate-x-1/2 z-10 flex gap-3 bg-gray-800/90 backdrop-blur px-2 py-2 rounded-lg shadow-lg">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Cmd/Ctrl + Z)"
          >
Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Cmd/Ctrl + Shift + Z)"
          >
Redo
          </button>
          <div className="w-px bg-gray-600 self-stretch" />
          <button
            onClick={handleRandomizeAll}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap"
          >
            Randomize All
          </button>
          <button
            onClick={handleShuffle}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap"
          >
            Shuffle
          </button>
          <button
            onClick={handleRandomShapes}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap"
          >
            Random Shapes
          </button>
          <button
            onClick={handleSingleShape}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap"
          >
            Single Shape
          </button>
          <button
            onClick={handleClear}
            className="px-5 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 font-medium whitespace-nowrap"
          >
            Clear
          </button>
        </div>

        

        {/* Canvas */}
        <div 
          className="rounded-lg shadow-2xl overflow-hidden flex items-center justify-center mx-auto"
              style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
                maxWidth: '100%',
                maxHeight: `${maxDisplayHeight}px`,
            backgroundColor: config.backgroundColor,
          }}
        >
          {svgContent ? (
            <div 
              className="w-full h-full flex items-center justify-center"
                  style={{
                    minWidth: 0,
                    minHeight: 0,
                  }}
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          ) : (
            <div className="flex items-center justify-center text-gray-400 w-full h-full">
              Empty Grid
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Colors, Border, Export */}
      <div className="hidden md:block w-[280px] bg-gray-800 border-l border-gray-700 overflow-y-auto custom-scrollbar">
        <div className="pl-4 pr-3 py-6 space-y-6">
          {/* Colors Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Colors</h3>
            
            {/* Background Color */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Background Color
              </label>
              
              {/* Use Theme BG Checkbox */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncBackgroundColor}
                  onChange={(e) => {
                    setSyncBackgroundColor(e.target.checked);
                    if (e.target.checked) {
                      setConfig(prev => ({ ...prev, backgroundColor: prev.colors[0] }));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-600 rounded"
                />
                <span className="text-gray-300 text-sm">Use theme BG color</span>
              </label>
              
              <div className="flex items-center gap-2">
                <div
                  draggable
                  onDragStart={handleBackgroundColorDragStart}
                  onDragOver={handleBackgroundColorDragOver}
                  onDragLeave={handleBackgroundColorDragLeave}
                  onDrop={handleBackgroundColorDrop}
                  className={`rounded border border-gray-600 bg-gray-700 cursor-move flex-shrink-0 transition-all ${
                    dragOverBackgroundColor ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''
                  }`}
                >
                <input
                  type="color"
                  value={config.backgroundColor}
                    onChange={(e) => {
                      setSyncBackgroundColor(false);
                      setConfig(prev => ({ ...prev, backgroundColor: e.target.value }));
                    }}
                    className="w-12 h-10 rounded border-0 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={config.backgroundColor.toUpperCase()}
                    onChange={handleBackgroundColorHexChange}
                    onFocus={handleBackgroundColorHexFocus}
                    onClick={handleBackgroundColorHexClick}
                    onPaste={handleBackgroundColorHexPaste}
                    onDragOver={handleBackgroundColorDragOver}
                    onDragLeave={handleBackgroundColorDragLeave}
                    onDrop={handleBackgroundColorDrop}
                    className={`w-full px-3 py-2 text-sm font-mono text-white bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      dragOverBackgroundColor ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''
                    }`}
                  placeholder="#FFFFFF"
                />
              </div>
              </div>
            </div>
            
            <PaletteSelector 
              currentColors={config.colors}
              onPaletteSelect={(colors) => {
                      setConfig(prev => ({
                        ...prev,
                  colors,
                  backgroundColor: syncBackgroundColor ? colors[0] : prev.backgroundColor,
                }));
              }}
            />
            
            <ColorPickers
              colors={config.colors}
              onColorsChange={(colors) => {
                setConfig(prev => ({
                  ...prev,
                  colors,
                  backgroundColor: syncBackgroundColor ? colors[0] : prev.backgroundColor,
                }));
              }}
            />
          </div>

          {/* Border Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Tile Border</h3>
            
            {/* Enable Border Checkbox */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={config.stroke?.enabled || false}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  stroke: { ...(prev.stroke || { enabled: false, width: 1, color: '#000000' }), enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 border-gray-600 rounded"
              />
              <span className="text-gray-300 text-sm font-medium">Enable Border</span>
            </label>
            
            {config.stroke?.enabled && (
              <>
                {/* Border Width */}
                <div className="mb-4">
                  <label className="text-gray-300 text-sm font-medium mb-2 block">
                    Border Width (1-12px)
                </label>
                <input
                  type="number"
                  min="1"
                    max="12"
                  value={config.stroke?.width || 1}
                  onChange={(e) => {
                      const value = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                    setConfig(prev => ({
                      ...prev,
                        stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), width: value }
                    }));
                  }}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                />
                </div>
                
                {/* Border Color */}
                <div>
                  <label className="text-gray-300 text-sm font-medium mb-2 block">
                  Border Color
                </label>
                  <div className="flex items-center gap-2">
                    <div
                      draggable
                      onDragStart={handleBorderColorDragStart}
                      onDragOver={handleBorderColorDragOver}
                      onDragLeave={handleBorderColorDragLeave}
                      onDrop={handleBorderColorDrop}
                      className={`rounded border border-gray-600 bg-gray-700 cursor-move flex-shrink-0 transition-all ${
                        dragOverBorderColor ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''
                      }`}
                    >
                  <input
                    type="color"
                    value={config.stroke?.color || '#000000'}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                          stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: e.target.value }
                    }))}
                        className="w-12 h-10 rounded border-0 bg-transparent cursor-pointer"
                  />
                    </div>
                    <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={(config.stroke?.color || '#000000').toUpperCase()}
                        onChange={handleBorderColorHexChange}
                        onFocus={handleBorderColorHexFocus}
                        onClick={handleBorderColorHexClick}
                        onPaste={handleBorderColorHexPaste}
                        onDragOver={handleBorderColorDragOver}
                        onDragLeave={handleBorderColorDragLeave}
                        onDrop={handleBorderColorDrop}
                        className={`w-full px-3 py-2 text-sm font-mono text-white bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          dragOverBorderColor ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''
                        }`}
                        placeholder="#FFFFFF"
                  />
                </div>
              </div>
                </div>
              </>
            )}
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Export</h3>
            <div className="space-y-2">
              <button 
                onClick={handleCopySVG}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
Copy SVG
              </button>
                <button
                onClick={handleExportSVG}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                >
Export SVG
                      </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
