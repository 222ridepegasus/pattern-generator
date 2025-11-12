import React from 'react';

interface ColorPickersProps {
  colors: string[];
  onColorsChange: (colors: string[]) => void;
}

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

export default function ColorPickers({ colors, onColorsChange }: ColorPickersProps) {
  const handleColorChange = (index: number, newColor: string) => {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    onColorsChange(updatedColors);
  };

  // Handle hex input change - normalize while typing
  const handleHexInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    const normalized = normalizeHexColor(value);
    // Allow typing - normalized will be # followed by 0-6 hex digits
    handleColorChange(index, normalized);
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
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData('text');
    const normalized = normalizeHexColor(pastedText);
    // Accept any valid hex format (complete or partial)
    // normalizeHexColor ensures it's properly formatted with #
    if (normalized.length > 1) { // More than just '#'
      handleColorChange(index, normalized);
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

  const handleRemoveColor = (index: number) => {
    if (colors.length > 1) {
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
            className="w-12 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => handleHexInputChange(e, index)}
              onFocus={handleHexInputFocus}
              onClick={handleHexInputClick}
              onPaste={(e) => handleHexInputPaste(e, index)}
              className="w-full px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="#FFFFFF"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveColor(index)}
            disabled={colors.length <= 1}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0
              ${colors.length <= 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
              }
            `}
            title={colors.length <= 1 ? 'Minimum 1 color required' : 'Remove color'}
          >
            Remove
          </button>
        </div>
      ))}
      
      {colors.length < 6 && (
        <button
          type="button"
          onClick={handleAddColor}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
        >
          + Add Color
        </button>
      )}
      
      {colors.length >= 6 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Maximum 6 colors reached
        </p>
      )}
    </div>
  );
}

