import React from 'react';
import { COLOR_PALETTES } from '../lib/types';

interface PaletteSelectorProps {
  currentColors: string[];
  onPaletteSelect: (colors: string[]) => void;
}

// Helper function to check if two color arrays match (order-independent)
function colorsMatch(colors1: string[], colors2: string[]): boolean {
  if (colors1.length !== colors2.length) return false;
  const sorted1 = [...colors1].sort();
  const sorted2 = [...colors2].sort();
  return sorted1.every((color, index) => color.toUpperCase() === sorted2[index].toUpperCase());
}

// Find which palette matches the current colors (if any)
function findMatchingPalette(colors: string[]): string | null {
  for (const [name, palette] of Object.entries(COLOR_PALETTES)) {
    // Check if current colors match the full palette
    if (colorsMatch(colors, palette)) {
      return name;
    }
    // Check if current colors match a subset of the palette (in order)
    if (colors.length <= palette.length) {
      const matches = colors.every((color, index) => 
        color.toUpperCase() === palette[index].toUpperCase()
      );
      if (matches) {
        return name;
      }
    }
  }
  return null;
}

export default function PaletteSelector({ currentColors, onPaletteSelect }: PaletteSelectorProps) {
  const activePalette = findMatchingPalette(currentColors);
  const isCustom = activePalette === null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Color Palettes</h3>
        {isCustom && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Custom
          </span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(COLOR_PALETTES).map(([name, palette]) => {
          const isActive = activePalette === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onPaletteSelect([...palette])}
              className={`
                relative p-2 rounded-lg border-2 transition-all group
                ${isActive
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
              title={name.charAt(0).toUpperCase() + name.slice(1)}
            >
              <div className="flex gap-0.5 mb-1">
                {palette.slice(0, 5).map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 h-6 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-xs font-medium text-gray-600 truncate">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </div>
              {isActive && (
                <div className="absolute top-1 right-1">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-blue-600"
                  >
                    <circle cx="8" cy="8" r="8" fill="currentColor" />
                    <path
                      d="M5 8L7 10L11 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

