import React from 'react';

interface ColorPickersProps {
  colors: string[];
  onColorsChange: (colors: string[]) => void;
}

export default function ColorPickers({ colors, onColorsChange }: ColorPickersProps) {
  const handleColorChange = (index: number, newColor: string) => {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    onColorsChange(updatedColors);
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 2) {
      const updatedColors = colors.filter((_, i) => i !== index);
      onColorsChange(updatedColors);
    }
  };

  const handleAddColor = () => {
    if (colors.length < 6) {
      // Add a random color from a default palette
      const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D'];
      const newColor = defaultColors[colors.length % defaultColors.length];
      onColorsChange([...colors, newColor]);
    }
  };

  return (
    <div className="space-y-3">
      {colors.map((color, index) => (
        <div key={index} className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(index, e.target.value)}
            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => {
                // Allow hex input
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  handleColorChange(index, value);
                }
              }}
              className="w-full px-3 py-2 text-sm font-mono text-gray-600 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#FFFFFF"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveColor(index)}
            disabled={colors.length <= 2}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0
              ${colors.length <= 2
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
              }
            `}
            title={colors.length <= 2 ? 'Minimum 2 colors required' : 'Remove color'}
          >
            Remove
          </button>
        </div>
      ))}
      
      {colors.length < 6 && (
        <button
          type="button"
          onClick={handleAddColor}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
        >
          + Add Color
        </button>
      )}
      
      {colors.length >= 6 && (
        <p className="text-xs text-gray-500 text-center">
          Maximum 6 colors reached
        </p>
      )}
    </div>
  );
}

