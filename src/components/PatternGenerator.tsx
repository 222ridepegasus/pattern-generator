import React, { useState, useEffect } from 'react';
import { DEFAULT_CONFIG } from '../lib/types';
import type { PatternConfig, ShapeType } from '../lib/types';
import { generatePattern, patternToSVG } from '../lib/patternEngine';
import ShapeSelector from './ShapeSelector';
import ColorPickers from './ColorPickers';
import PaletteSelector from './PaletteSelector';

/**
 * Main Pattern Generator Component
 * This is a stub - Cursor will build this out with full functionality
 */
export default function PatternGenerator() {
  const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showSvgMenu, setShowSvgMenu] = useState(false);
  const [seedInput, setSeedInput] = useState<string>('');
  const [seedCopied, setSeedCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Regenerate pattern whenever config changes
  useEffect(() => {
    try {
      setError(null);
      
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

  // Handle randomize all
  const handleRandomizeAll = () => {
    setIsRandomizing(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const patternTypes: PatternConfig['patternType'][] = ['gridCentered', 'brick'];
      const allShapes: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'roundedSquare'];
      
      // Generate random values
      const newSeed = Date.now();
      const randomPatternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
      const randomColors = generateRandomColors();
      const randomRotation = Math.random() > 0.5;
      
      // Randomly select 2-4 shapes
      const numShapes = Math.floor(Math.random() * 3) + 2; // 2-4 shapes
      const shuffledShapes = [...allShapes].sort(() => Math.random() - 0.5);
      const randomShapes = shuffledShapes.slice(0, numShapes);
      
      // Update config with all random values
      setConfig(prev => ({
        ...prev,
        seed: newSeed,
        patternType: randomPatternType,
        colors: randomColors,
        rotation: {
          enabled: randomRotation,
        },
        shapes: randomShapes,
      }));
      
      setSeedInput('');
      setIsRandomizing(false);
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pattern Generator</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {exportMessage && (
              <div className="hidden sm:block px-3 md:px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs md:text-sm font-medium transition-opacity">
                {exportMessage}
              </div>
            )}
            <button className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] touch-manipulation">
              <span className="hidden sm:inline">Export PNG</span>
              <span className="sm:hidden">PNG</span>
            </button>
            <button
              type="button"
              onClick={handleCopySVG}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 min-h-[44px] touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Copy SVG</span>
              <span className="sm:hidden">Copy</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSvgMenu(!showSvgMenu)}
                className="px-3 md:px-4 py-2 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 min-h-[44px] touch-manipulation"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
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
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
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
            pt-16 lg:pt-0
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
            <div>
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
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Canvas</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spacing: {config.spacing}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={config.spacing}
                    onChange={handleSpacingChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(config.spacing / 100) * 100}%, #e5e7eb ${(config.spacing / 100) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
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
              <h2 className="text-lg font-semibold mb-4">Rotation</h2>
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
              
              {/* Seed Display and Input */}
              <div className="mt-4 pt-4 border-t border-gray-200">
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
              </div>
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
