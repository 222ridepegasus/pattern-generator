import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_CONFIG, COLOR_PALETTES } from '../lib/types';
import type { PatternConfig, ShapeType } from '../lib/types';
import { generatePattern, patternToSVG } from '../lib/patternEngine';
import { shapeSets } from '../lib/shapeSets.js';
import ShapeSelector from './ShapeSelector';
import ColorPickers from './ColorPickers';
import PaletteSelector from './PaletteSelector';

/**
 * Generate a random config for page load
 */
function generateRandomConfig(): PatternConfig {
  // 1. Random background color (#fff or #000)
  const backgroundColor = Math.random() > 0.5 ? '#ffffff' : '#000000';
  
  // 2. Pick shape set (Primitives or 3×3 Blocks)
  const usePrimitives = Math.random() > 0.5;
  let shapes: ShapeType[];
  
  if (usePrimitives) {
    // Primitives: pick 2-4 shapes (exclude hexagon_01 as it doesn't tile well)
    const primitiveShapes: ShapeType[] = Object.keys(shapeSets.primitives.shapes)
      .filter(shape => shape !== 'hexagon_01') as ShapeType[];
    const numShapes = Math.floor(Math.random() * 3) + 2; // 2-4
    const shuffled = [...primitiveShapes].sort(() => Math.random() - 0.5);
    shapes = shuffled.slice(0, numShapes);
  } else {
    // 3×3 Blocks: pick 2-8 shapes
    const blockShapes: ShapeType[] = Object.keys(shapeSets.blocks33.shapes) as ShapeType[];
    const numShapes = Math.floor(Math.random() * 7) + 2; // 2-8
    const shuffled = [...blockShapes].sort(() => Math.random() - 0.5);
    shapes = shuffled.slice(0, numShapes);
  }
  
  // 3. Pick from one of the preset color palettes
  const paletteNames = Object.keys(COLOR_PALETTES);
  const randomPaletteName = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  const colors = [...COLOR_PALETTES[randomPaletteName as keyof typeof COLOR_PALETTES]];
  
  // 4. Randomize mirroring: none, vertical, horizontal, or both
  const mirrorOptions = [
    { horizontal: false, vertical: false },
    { horizontal: false, vertical: true },
    { horizontal: true, vertical: false },
    { horizontal: true, vertical: true },
  ];
  const mirror = mirrorOptions[Math.floor(Math.random() * mirrorOptions.length)];
  
  // 5. Randomize grid size between 3×3 and 8×8
  const gridSize = Math.floor(Math.random() * 6) + 3; // 3-8
  
  // 6. Randomize border padding: 0, 16, 32, or 48
  const borderPaddingOptions = [0, 16, 32, 48];
  const borderPadding = borderPaddingOptions[Math.floor(Math.random() * borderPaddingOptions.length)];
  
  // 7. Randomize line spacing: 0, 16, 32, 48, or 64
  const lineSpacingOptions = [0, 16, 32, 48, 64];
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
  
  // Undo/Redo system
  const [history, setHistory] = useState<PatternConfig[]>([initialConfig]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const MAX_HISTORY = 10;
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

  // Regenerate pattern whenever config changes
  useEffect(() => {
    try {
      setError(null);
      
      // Validate config has required properties before generating
      if (!config.containerSize || !Array.isArray(config.containerSize) || config.containerSize.length < 2) {
        console.warn('Invalid containerSize, using default [800, 800]');
        // Use default instead of setting config to avoid infinite loop
        const defaultContainerSize: [number, number] = [800, 800];
        const elements = generatePattern({ ...config, containerSize: defaultContainerSize });
        const svg = patternToSVG(elements, defaultContainerSize, config.backgroundColor || '#ffffff');
        setSvgContent(svg);
        return;
      }
      
      if (!config.shapes || !Array.isArray(config.shapes) || config.shapes.length === 0) {
        console.warn('Invalid shapes, skipping generation');
        return;
      }
      
      if (!config.colors || !Array.isArray(config.colors) || config.colors.length === 0) {
        console.warn('Invalid colors, skipping generation');
        return;
      }
      
      // Use containerSize directly
      const elements = generatePattern(config);
      const svg = patternToSVG(elements, config.containerSize, config.backgroundColor);
      setSvgContent(svg);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate pattern';
      setError(errorMessage);
      setSvgContent('');
      console.error('Pattern generation error:', err);
    }
  }, [config]);

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

  // Handle background color change
  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setConfig(prev => ({
      ...prev,
      backgroundColor: newColor,
    }));
  };

  // Handle shape selection change
  const handleShapesChange = (shapes: ShapeType[]) => {
    setConfig(prev => ({
      ...prev,
      shapes: shapes,
    }));
  };

  // Handle colors change
  const handleColorsChange = (colors: string[]) => {
    setConfig(prev => ({
      ...prev,
      colors: colors,
    }));
  };

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
          ...Object.keys(shapeSets.primitives.shapes),
          ...Object.keys(shapeSets.blocks33.shapes)
        ] as ShapeType[];
        
        // Randomly select 1-9 shapes
        const numShapes = Math.floor(Math.random() * 9) + 1; // 1-9 shapes
        const shuffledShapes = [...allShapes].sort(() => Math.random() - 0.5);
        const randomShapes = shuffledShapes.slice(0, numShapes);
        
        // 2. Pick a random color theme from palettes
        const paletteNames = Object.keys(COLOR_PALETTES);
        const randomPaletteName = paletteNames[Math.floor(Math.random() * paletteNames.length)];
        const randomColors = [...COLOR_PALETTES[randomPaletteName as keyof typeof COLOR_PALETTES]];
        
        // 3. Randomize background color: either #fff or #000
        const randomBackgroundColor = Math.random() > 0.5 ? '#ffffff' : '#000000';
        
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


  // Handle SVG download
  const handleDownloadSVG = () => {
    if (!svgContent) {
      setExportMessage('No pattern to export');
      setTimeout(() => setExportMessage(null), 2000);
      return;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
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
      await navigator.clipboard.writeText(svgContent);
      setExportMessage('SVG copied to clipboard!');
      setTimeout(() => setExportMessage(null), 2000);
    } catch (err) {
      setExportMessage('Failed to copy to clipboard');
      setTimeout(() => setExportMessage(null), 2000);
      console.error('Failed to copy SVG:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Undo/Redo Buttons - Debug */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className={`
            px-3 py-1.5 text-sm font-medium rounded
            ${historyIndex <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
            }
          `}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className={`
            px-3 py-1.5 text-sm font-medium rounded
            ${historyIndex >= history.length - 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
            }
          `}
        >
          Redo
        </button>
      </div>
      
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors shadow-lg bg-white"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Controls Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
            w-80 bg-white border-r border-gray-200 overflow-y-auto
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile Close Button */}
          <div className="lg:hidden absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Pattern Type - Hidden for now, will add back when we have multiple types */}
            {/* <div>
              <h2 className="text-lg font-semibold mb-4">Pattern Type</h2>
              <div className="p-3 rounded-lg border-2 border-blue-600 bg-blue-50">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-blue-500 rounded-sm"
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Grid</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Centered grid pattern with auto-sizing shapes
              </p>
            </div> */}

            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((config.gridSize - 2) / 6) * 100}%, #e5e7eb ${((config.gridSize - 2) / 6) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2×2</span>
                    <span>8×8</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.borderPadding / 64) * 100}%, #e5e7eb ${(config.borderPadding / 64) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Line Spacing: {config.lineSpacing}px
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.lineSpacing / 64) * 100}%, #e5e7eb ${(config.lineSpacing / 64) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${config.emptySpace}%, #e5e7eb ${config.emptySpace}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                {/* Spacing slider removed - using Line Spacing instead */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={handleBackgroundColorChange}
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      {config.backgroundColor.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Shapes</h2>
              <ShapeSelector
                selectedShapes={config.shapes}
                onSelectionChange={handleShapesChange}
              />
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.mirror?.horizontal || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      mirror: {
                        ...(prev.mirror || { horizontal: false, vertical: false }),
                        horizontal: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mirror Horizontally</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.mirror?.vertical || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      mirror: {
                        ...(prev.mirror || { horizontal: false, vertical: false }),
                        vertical: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mirror Vertically</span>
                </label>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.preserveLayout !== false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      preserveLayout: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Preserve Layout</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {config.preserveLayout !== false 
                        ? 'Layout stays fixed, only shapes flip' 
                        : 'Layout can reorganize'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleRandomizePattern}
                className="w-full mb-4 px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 min-h-[44px] touch-manipulation"
              >
                🎲 Randomize Pattern
              </button>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Colors</h2>
              <PaletteSelector
                currentColors={config.colors}
                onPaletteSelect={handleColorsChange}
              />
              <ColorPickers
                colors={config.colors}
                onColorsChange={handleColorsChange}
              />
              <button
                type="button"
                onClick={handleRandomizeColors}
                className="w-full mt-3 px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 min-h-[44px] touch-manipulation"
              >
                🎨 Randomize Colors
              </button>
            </div>

            <div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enable Rotation
                    </label>
                    <p className="text-xs text-gray-500">
                      Randomly rotate shapes in the pattern for more variety
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRotationToggle}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${config.rotation.enabled ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                    role="switch"
                    aria-checked={config.rotation.enabled}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${config.rotation.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleRandomizeAll}
                disabled={isRandomizing}
                className={`
                  w-full px-4 py-3 rounded-lg font-medium transition-all
                  ${isRandomizing
                    ? 'bg-purple-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }
                `}
              >
                {isRandomizing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Randomizing...
                  </span>
                ) : (
                  '🎲 Randomize All'
                )}
              </button>
              
              {/* Export Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {exportMessage && (
                  <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-opacity">
                    {exportMessage}
                  </div>
                )}
                <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation">
                  Export PNG
                </button>
                <button
                  type="button"
                  onClick={handleCopySVG}
                  className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
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
                      <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        <button
                          type="button"
                          onClick={handleDownloadSVG}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download SVG
                        </button>
                        <button
                          type="button"
                          onClick={handleCopySVG}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
              
              {/* Pattern Seed - Hidden for now, will add back later */}
              {/* Seed Display and Input */}
              {/* <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Pattern Seed
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySeed}
                      className="flex-1 px-2 py-1.5 text-xs font-mono text-gray-600 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors text-left"
                      title="Click to copy seed"
                    >
                      {seedCopied ? (
                        <span className="text-green-600">✓ Copied!</span>
                      ) : (
                        <span>{config.seed}</span>
                      )}
                    </button>
                  </div>
                </div>
                <form onSubmit={handleSeedSubmit} className="flex gap-2">
                  <input
                    type="number"
                    value={seedInput}
                    onChange={handleSeedInputChange}
                    placeholder="Enter seed..."
                    min="1"
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Apply
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-1">
                  Use seed to reproduce patterns
                </p>
              </div> */}
            </div>
          </div>
        </aside>

        {/* Pattern Preview */}
        <main className="flex-1 overflow-hidden flex items-center justify-center p-4 md:p-8">
          <div className="bg-gray-100 p-6 md:p-8 rounded-2xl w-full max-w-7xl flex items-center justify-center">
              <div
              className="bg-white rounded-xl overflow-hidden flex items-center justify-center mx-auto"
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
                    className="w-full h-full"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: svgContent
                        .replace(/<svg([^>]*)\s+width="[^"]*"([^>]*)>/i, '<svg$1$2>')
                        .replace(/<svg([^>]*)\s+height="[^"]*"([^>]*)>/i, '<svg$1$2>')
                        .replace(/<svg([^>]*)>/, '<svg$1 style="width: 100%; height: 100%; display: block;">')
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                    Pattern will appear here
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
