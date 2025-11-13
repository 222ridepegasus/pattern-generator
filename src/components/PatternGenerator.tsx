import React, { useState, useEffect, useRef } from 'react';
import type { PatternConfig, ShapeType } from '../lib/types';
import { generatePattern, patternToSVG } from '../lib/patternEngine';
import { availableShapes } from '../lib/shapeLoader.js';
import { COLOR_PALETTES } from '../lib/types';

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

export default function PatternGenerator() {
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
    backgroundColor: '#1a1a1a',
    shapes: availableShapes.nautical.slice(0, 10),
    colors: ['#FFFFFF', '#000000'],
    rotation: { enabled: false },
    mirror: { horizontal: false, vertical: false },
    preserveLayout: true,
    stroke: { enabled: false, width: 1, color: '#000000' }
  });

  const [patternCells, setPatternCells] = useState<Record<string, CellData | null>>({});
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [svgContent, setSvgContent] = useState<string>('');
  const [syncBackgroundColor, setSyncBackgroundColor] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string>('Nautical Modern');

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

  // Auto-randomize on first load
  useEffect(() => {
    handleRandomizeAll();
  }, []);

  // Randomization functions
  const handleRandomizeAll = () => {
    const newCells: Record<string, CellData | null> = {};
    const gridSize = config.gridSize;
    const randomShape = () => config.shapes[Math.floor(Math.random() * config.shapes.length)];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
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
    const newCells: Record<string, CellData | null> = {};
    const randomShape = () => config.shapes[Math.floor(Math.random() * config.shapes.length)];
    
    Object.keys(patternCells).forEach(cellKey => {
      const cell = patternCells[cellKey];
      if (cell) {
        newCells[cellKey] = { ...cell, shapeId: randomShape() };
      } else {
        newCells[cellKey] = null;
      }
    });
    
    setPatternCells(newCells);
  };

  const handleSingleShape = () => {
    const randomShape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
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

  // Theme change handler
  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    const themeColors = COLOR_PALETTES[themeName as keyof typeof COLOR_PALETTES];
    setConfig(prev => ({
      ...prev,
      colors: themeColors,
      backgroundColor: syncBackgroundColor ? themeColors[0] : prev.backgroundColor,
    }));
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
    <div className="min-h-screen bg-gray-900 flex">
      {/* LEFT SIDEBAR - Grid Settings & Shape Browser */}
      <div className="hidden md:block w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-6 space-y-6">
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
            <div className="grid grid-cols-4 gap-2">
              {availableShapes.nautical.slice(0, 24).map((shapeId) => (
                <div
                  key={shapeId}
                  className="aspect-square bg-gray-700 rounded-lg border-2 border-gray-600 hover:border-blue-500 cursor-pointer flex items-center justify-center"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER - Canvas with Floating Buttons */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        {/* Floating Randomization Buttons */}
        <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-gray-800/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
          <button
            onClick={handleRandomizeAll}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
          >
            Randomize All
          </button>
          <button
            onClick={handleShuffle}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium"
          >
            Shuffle
          </button>
          <button
            onClick={handleRandomShapes}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 font-medium"
          >
            Random Shapes
          </button>
          <button
            onClick={handleSingleShape}
            className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 font-medium"
          >
            Single Shape
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium"
          >
            Clear
          </button>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg shadow-2xl p-4 max-w-full">
          {svgContent ? (
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          ) : (
            <div className="w-[800px] h-[800px] flex items-center justify-center text-gray-400">
              Empty Grid
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Colors, Border, Export */}
      <div className="hidden md:block w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Colors Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Colors</h3>
            
            {/* Background Color */}
            <div className="mb-4">
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={config.backgroundColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm font-mono"
                />
              </div>
              
              {/* Use Theme BG Checkbox */}
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
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
            </div>

            {/* Color Palettes */}
            <div>
              <label className="text-gray-300 text-sm font-medium mb-2 block">
                Color Palettes
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => handleThemeChange(name)}
                    className={`p-2 rounded border-2 ${
                      selectedTheme === name ? 'border-blue-500' : 'border-gray-600'
                    } hover:border-blue-400 transition-colors`}
                  >
                    <div className="flex gap-1 mb-1">
                      {colors.slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="h-6 flex-1 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-gray-300 truncate">{name}</div>
                  </button>
                ))}
              </div>
            </div>
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
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.stroke?.color || '#000000'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: e.target.value }
                      }))}
                      className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.stroke?.color || '#000000'}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        stroke: { ...(prev.stroke || { enabled: true, width: 1, color: '#000000' }), color: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm font-mono"
                    />
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
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Copy SVG
              </button>
              <button
                onClick={handleExportSVG}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
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
