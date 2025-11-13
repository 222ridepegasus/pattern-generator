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
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleColorChange = (index: number, newColor: string) => {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    onColorsChange(updatedColors);
  };

  // Handle drag start for color swatch
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('text/plain', colors[index]);
    e.dataTransfer.setData('application/x-source', 'theme-color');
  };

  // Handle drag over - allow drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    // Always allow move for theme colors (we handle swap/update in drop)
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop - swap colors if from theme, update if from BG/Border
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const source = e.dataTransfer.getData('application/x-source');
    
    // If dragging from BG/Border color, update (not swap)
    if (source === 'background-color' || source === 'border-color') {
      const colorValue = e.dataTransfer.getData('text/plain');
      if (colorValue) {
        const updatedColors = [...colors];
        updatedColors[dropIndex] = colorValue;
        onColorsChange(updatedColors);
      }
    } 
    // If dragging from another theme color (or no source), swap
    else if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const updatedColors = [...colors];
      // Swap the colors
      [updatedColors[draggedIndex], updatedColors[dropIndex]] = 
        [updatedColors[dropIndex], updatedColors[draggedIndex]];
      onColorsChange(updatedColors);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle drag end - cleanup
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
        <div key={index} className="flex items-center gap-2">
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`rounded border border-gray-600 bg-gray-700 cursor-move flex-shrink-0 transition-all ${
              draggedIndex === index ? 'opacity-50 scale-95' : ''
            } ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''
            }`}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              className="w-12 h-10 rounded border-0 bg-transparent cursor-pointer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => handleHexInputChange(e, index)}
              onFocus={handleHexInputFocus}
              onClick={handleHexInputClick}
              onPaste={(e) => handleHexInputPaste(e, index)}
              onDragOver={(e) => {
                e.preventDefault();
                // Check if dragging from BG/Border color (has application/x-source type)
                const hasSourceType = e.dataTransfer.types.includes('application/x-source');
                e.dataTransfer.dropEffect = hasSourceType ? 'copy' : 'move';
                setDragOverIndex(index);
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                const source = e.dataTransfer.getData('application/x-source');
                
                // If dragging from BG/Border color, update (not swap)
                if (source === 'background-color' || source === 'border-color') {
                  const colorValue = e.dataTransfer.getData('text/plain');
                  if (colorValue) {
                    handleColorChange(index, colorValue);
                  }
                }
                // If dragging from another theme color swatch, copy
                else if (draggedIndex !== null && draggedIndex !== index) {
                  handleColorChange(index, colors[draggedIndex]);
                }
                
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`w-full px-3 py-2 text-sm font-mono text-white bg-gray-700 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                dragOverIndex === index ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800' : ''
              }`}
              placeholder="#FFFFFF"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemoveColor(index)}
            disabled={colors.length <= 1}
            className={`
              px-3 py-2 text-sm font-medium rounded transition-colors flex-shrink-0
              ${colors.length <= 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
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
          className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          + Add Color
        </button>
      )}
      
      {colors.length >= 6 && (
        <p className="text-xs text-gray-400 text-center">
          Maximum 6 colors reached
        </p>
      )}
    </div>
  );
}

