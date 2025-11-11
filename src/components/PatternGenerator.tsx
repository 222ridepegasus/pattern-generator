import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_CONFIG, COLOR_PALETTES } from '../lib/types';
import type { PatternConfig, ShapeType } from '../lib/types';
import { generatePattern, patternToSVG } from '../lib/patternEngine';
import { shapeSets, shapes } from '../lib/shapeSets.js';
import ShapeSelector from './ShapeSelector';
import ColorPickers from './ColorPickers';
import PaletteSelector from './PaletteSelector';

/**
 * Generate a random config for page load
 */
function generateRandomConfig(): PatternConfig {
  // 2. Pick nautical shapes (primitives and blocks are disabled)
  const nauticalShapes: ShapeType[] = Object.keys(shapeSets.nautical.shapes) as ShapeType[];
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
  const [selectedShape, setSelectedShape] = useState<{shapeType: ShapeType, x: number, y: number, cellIndex?: number} | null>(null);
  const [syncBackgroundColor, setSyncBackgroundColor] = useState(true); // Default to synced
  
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

  // Add CSS for selected shape highlighting - highlight cell containers, not shapes
  useEffect(() => {
    const styleId = 'shape-selection-style';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    if (selectedShape) {
      // Show solid blue border only on the actually selected cell
      // Add pulsing animation using opacity
      const selectedCellIndex = selectedShape.cellIndex !== undefined ? selectedShape.cellIndex.toString() : '';
      if (selectedCellIndex) {
        styleElement.textContent = `
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
    } else {
      styleElement.textContent = '';
    }
    
    return () => {
      // Cleanup on unmount
      if (styleElement && !selectedShape) {
        styleElement.textContent = '';
      }
    };
  }, [selectedShape]);

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
          ...Object.keys(shapeSets.nautical.shapes)
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

  // Handle shuffle colors for a specific shape type - cycles through permutations
  const handleShuffleShapeColors = (shapeType: ShapeType) => {
    // Generate shape at dummy position to get its slots
    const dummyShape = shapes[shapeType](0, 0, 100);
    
    if (!Array.isArray(dummyShape)) {
      // Single-color shape - just use first color
      setConfig(prev => ({
        ...prev,
        shapeColorOverrides: {
          ...prev.shapeColorOverrides,
          [shapeType]: { 1: prev.colors[0] }
        }
      }));
      return;
    }

    // Get unique slots used by this shape
    const usedSlots = [...new Set(dummyShape.map(el => el.slot || 1))].sort((a, b) => a - b);
    const numSlots = usedSlots.length;
    
    // Generate all permutations of theme colors for the number of slots needed
    const allPermutations = generateColorPermutations(config.colors, numSlots);
    
    if (allPermutations.length === 0) {
      // Fallback if no permutations
      return;
    }
    
    // Get current shuffle index for this shape type (default to -1, so first shuffle is index 0)
    const currentShuffleIndex = (config.shapeColorOverrides?.[shapeType]?._shuffleIndex as number | undefined) ?? -1;
    
    // Cycle to next permutation
    const nextIndex = (currentShuffleIndex + 1) % allPermutations.length;
    const selectedPermutation = allPermutations[nextIndex];
    
    // Create override mapping: slot number → color from permutation
    const slotColorMap: Record<number, string> = {
      _shuffleIndex: nextIndex // Store the index for next shuffle
    };
    usedSlots.forEach((slot, index) => {
      slotColorMap[slot] = selectedPermutation[index % selectedPermutation.length];
    });

    // Update config with new color overrides
    setConfig(prev => ({
      ...prev,
      shapeColorOverrides: {
        ...prev.shapeColorOverrides,
        [shapeType]: slotColorMap
      }
    }));
  };

  // Handle cancel/revert colors for a specific shape type
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
    <div className="flex h-screen">
      {/* LEFT SIDEBAR */}
      <div className="w-[300px] bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* PATTERN CONTROLS - Sliders */}
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
          </div>

          {/* SHAPES */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shapes</h3>
            <ShapeSelector
              selectedShapes={config.shapes}
              onSelectionChange={handleShapesChange}
            />
          </div>

        </div>
      </div>

      {/* MAIN CANVAS AREA */}
      <div className="flex-1 flex flex-col">
        {/* TOP ACTION BAR */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-center gap-3 px-4">
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
Undo
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
Redo
          </button>

          {/* Separator */}
          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          {/* Refresh Layout (only changes seed/layout, preserves color overrides) */}
          <button
            type="button"
            onClick={() => {
              setConfig(prev => ({
                ...prev,
                seed: Date.now(),
                // Preserve shapeColorOverrides so colors don't change
                shapeColorOverrides: prev.shapeColorOverrides
              }));
            }}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
Refresh Layout
          </button>

          {/* Randomize All (randomizes everything like initial page load) */}
          <button
            type="button"
            onClick={() => {
              // Generate completely new random config (same as page load)
              const newConfig = generateRandomConfig();
              setConfig(newConfig);
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
Randomize All
          </button>
        </div>

        {/* CANVAS */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 relative">
          {/* Keep existing canvas/pattern display here */}
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
                    ref={(el) => {
                      if (el) {
                        // Remove old listener if exists
                        el.onclick = null;
                        // Add click event delegation
                        el.onclick = (e: MouseEvent) => {
                          const target = e.target as HTMLElement;
                          // Don't select if clicking on toolbar
                          if (target.closest('.shape-toolbar')) {
                            return;
                          }
                          const shapeType = target.getAttribute('data-shape-type') as ShapeType | null;
                          const cellIndex = target.getAttribute('data-cell-index');
                          if (shapeType) {
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
                          } else {
                            // Click outside shape - close toolbar
                            setSelectedShape(null);
                          }
                        };
                      }
                    }}
                    className="w-full h-full"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer'
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
          {/* Toolbar absolutely positioned below pattern container */}
          {selectedShape && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div
                className="shape-toolbar bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => handleCancelShapeColors(selectedShape.shapeType)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShape(null)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
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
      <div className="w-[300px] bg-gray-50 border-l border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* COLORS SECTION */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Colors</h3>
            
            {/* Background Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="flex-1 px-3 py-2 text-sm font-mono text-gray-600 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">Use theme BG color</span>
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
              className="w-full mt-3 px-4 py-3 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 min-h-[44px] touch-manipulation"
            >
Randomize Colors
            </button>
          </div>

          {/* TILE BORDER SECTION */}
          <div className="space-y-3 pb-6 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Tile Border</h3>
            
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
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">Enable Border</span>
            </label>
            
            {/* Border width input */}
            {config.stroke?.enabled && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-600">
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Border color input */}
                <label className="block text-sm text-gray-600">
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
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex-shrink-0"
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
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}
          </div>

          {/* EXPORT SECTION */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Export</h3>
            <div className="space-y-2">
              {exportMessage && (
                <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-opacity">
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
          </div>
        </div>
      </div>
    </div>
  );
}
