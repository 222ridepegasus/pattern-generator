import React from 'react';
import type { ShapeType } from '../lib/types';
import { availableShapes } from '../lib/shapeLoader.js';

interface ShapeSelectorProps {
  selectedShapes: ShapeType[];
  onSelectionChange: (shapes: ShapeType[]) => void;
  shapesInPattern?: Set<ShapeType>; // Shapes currently in the pattern
  onClearGrid?: () => void; // Callback to clear the grid
}

// Nautical icon component that loads SVG and swaps colors when selected
const NauticalIcon: React.FC<{ shapeKey: string; isSelected: boolean }> = ({ shapeKey, isSelected }) => {
  const [svgContent, setSvgContent] = React.useState<string>('');
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    fetch(`/shapes/nautical/${shapeKey}.svg`)
      .then(res => res.text())
      .then(content => {
        let processed = content;
        
        if (isSelected) {
          // Replace gray colors with blue colors
          processed = processed
            .replace(/#000000/gi, '#2A4DD0')
            .replace(/#3A3A3A/gi, '#5A75DB')
            .replace(/#777777/gi, '#8DA0E6')
            .replace(/#AAAAAA/gi, '#B8C4EF')
            .replace(/#999999/gi, '#B8C4EF') // Just in case
            // Also handle fill="black" and style attributes
            .replace(/fill="black"/gi, 'fill="#2A4DD0"')
            .replace(/fill='black'/gi, "fill='#2A4DD0'")
            .replace(/style="fill:black/gi, 'style="fill:#2A4DD0')
            .replace(/style='fill:black/gi, "style='fill:#2A4DD0");
        }
        
        setSvgContent(processed);
      })
      .catch(() => setError(true));
  }, [shapeKey, isSelected]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
        {shapeKey.replace('nautical_', '').replace('_01', '').toUpperCase()}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};


export default function ShapeSelector({ selectedShapes, onSelectionChange, shapesInPattern = new Set(), onClearGrid }: ShapeSelectorProps) {
  const MAX_SELECTED_SHAPES = 26;
  
  const handleShapeToggle = (shape: ShapeType) => {
    const isSelected = selectedShapes.includes(shape);
    
    // If trying to deselect and it's the last one, don't allow it
    if (isSelected && selectedShapes.length === 1) {
      return;
    }

    if (isSelected) {
      // Remove shape from selection
      onSelectionChange(selectedShapes.filter(s => s !== shape));
    } else {
      // Add shape to selection, but only if under the limit
      if (selectedShapes.length < MAX_SELECTED_SHAPES) {
        onSelectionChange([...selectedShapes, shape]);
      }
    }
  };

  // Get shape names from availableShapes
  const nauticalShapes: ShapeType[] = availableShapes.nautical as ShapeType[];
  const handleSelectAll = () => {
    // Select all shapes
    onSelectionChange([...nauticalShapes]);
  };

  const handleSelectSingle = () => {
    // Randomly select a single shape
    const randomIndex = Math.floor(Math.random() * nauticalShapes.length);
    onSelectionChange([nauticalShapes[randomIndex]]);
  };

  const handleSelectRandom = () => {
    // Pick a random number between 2 and 12
    const randomCount = Math.floor(Math.random() * 11) + 2; // 2-12 inclusive
    
    // Shuffle the shapes array and pick the first randomCount
    const shuffled = [...nauticalShapes].sort(() => Math.random() - 0.5);
    const randomShapes = shuffled.slice(0, randomCount);
    
    onSelectionChange(randomShapes);
  };

  return (
    <div className="space-y-4">
      {/* Select All / Deselect Toggle with Counter */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            All
          </button>
          <button
            type="button"
            onClick={handleSelectSingle}
            className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Single
          </button>
          <button
            type="button"
            onClick={handleSelectRandom}
            className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Random
          </button>
          {onClearGrid && (
            <button
              type="button"
              onClick={onClearGrid}
              className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {selectedShapes.length}/{MAX_SELECTED_SHAPES}
        </span>
      </div>
      
      {/* Nautical Flags Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nautical Flags
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {nauticalShapes.map(shape => {
            const isSelected = selectedShapes.includes(shape);
            const isInPattern = shapesInPattern.has(shape);
            const isAtLimit = !isSelected && selectedShapes.length >= MAX_SELECTED_SHAPES;
            const isDisabled = (selectedShapes.length === 1 && isSelected) || isAtLimit;
            
            // Determine border style based on state
            let borderClass = '';
            let bgClass = '';
            
            if (isSelected && isInPattern) {
              // Selected AND in pattern: solid blue border
              borderClass = 'border-blue-600 dark:border-blue-500';
              bgClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            } else if (isSelected && !isInPattern) {
              // Selected but NOT in pattern: dotted blue border
              borderClass = 'border-blue-600 dark:border-blue-500 border-dashed';
              bgClass = 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 opacity-50';
            } else if (isInPattern && !isSelected) {
              // In pattern but not selected: green border
              borderClass = 'border-green-500 dark:border-green-400';
              bgClass = 'bg-green-50 dark:bg-green-900/30';
            } else if (isAtLimit) {
              // At limit: gray disabled
              borderClass = 'border-gray-200 dark:border-gray-700';
              bgClass = 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50';
            } else {
              // Default: normal gray border
              borderClass = 'border-gray-200 dark:border-gray-700';
              bgClass = 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600';
            }
            
            return (
              <button
                key={shape}
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', shape);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => handleShapeToggle(shape)}
                className={`
                  relative flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 transition-all
                  ${borderClass} ${bgClass}
                  ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-grab active:cursor-grabbing'}
                `}
                disabled={isDisabled}
                title={isAtLimit ? `Maximum ${MAX_SELECTED_SHAPES} shapes selected` : shape.replace('_', ' ')}
              >
                {isInPattern && !isSelected && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
                <div className="w-8 h-8 flex items-center justify-center">
                  <NauticalIcon shapeKey={shape} isSelected={isSelected} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
