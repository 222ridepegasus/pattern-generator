import React from 'react';
import type { ShapeType } from '../lib/types';
import { shapeSets } from '../lib/shapeSets.js';

interface ShapeSelectorProps {
  selectedShapes: ShapeType[];
  onSelectionChange: (shapes: ShapeType[]) => void;
}

// Render shape preview as mini SVG
const renderShapePreview = (shapeName: ShapeType, shapeFunction: Function) => {
  // Generate shape at center of 64x64 canvas, size 32px
  const shapeData = shapeFunction(32, 32, 32);
  
  // Convert to SVG element
  const attrs = Object.entries(shapeData.attrs)
    .map(([key, val]) => `${key}="${val}"`)
    .join(' ');
  
  const svgContent = `<${shapeData.type} ${attrs} fill="currentColor" />`;
  
  return (
    <svg 
      viewBox="0 0 64 64" 
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

// Simple preview component that renders a shape preview
// NOTE: Primitives and blocks are disabled, only nautical shapes are used
const ShapePreview: React.FC<{ shapeName: ShapeType }> = ({ shapeName }) => {
  // Only nautical shapes are enabled now
  const shapeFn = shapeName in shapeSets.nautical.shapes
    ? shapeSets.nautical.shapes[shapeName as keyof typeof shapeSets.nautical.shapes]
    : null;
  
  if (!shapeFn) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
        {shapeName}
      </div>
    );
  }

  return renderShapePreview(shapeName, shapeFn);
};

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
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
        {shapeKey.replace('nautical_', '').replace('_01', '').toUpperCase()}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
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


export default function ShapeSelector({ selectedShapes, onSelectionChange }: ShapeSelectorProps) {
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

  // Get shape names from shapeSets (only enabled sets)
  const nauticalShapes: ShapeType[] = Object.keys(shapeSets.nautical.shapes) as ShapeType[];

  return (
    <div className="space-y-4">
      {/* Selection Counter */}
      <div className="text-xs text-gray-500 mb-2">
        {selectedShapes.length} / {MAX_SELECTED_SHAPES} shapes selected
      </div>
      
      {/* Nautical Flags Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {shapeSets.nautical.meta.name}
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {nauticalShapes.map(shape => {
            const isSelected = selectedShapes.includes(shape);
            const isAtLimit = !isSelected && selectedShapes.length >= MAX_SELECTED_SHAPES;
            const isDisabled = (selectedShapes.length === 1 && isSelected) || isAtLimit;
            return (
              <button
                key={shape}
                type="button"
                onClick={() => handleShapeToggle(shape)}
                className={`
                  relative flex flex-col items-center justify-center w-9 h-9 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : isAtLimit
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
                disabled={isDisabled}
                title={isAtLimit ? `Maximum ${MAX_SELECTED_SHAPES} shapes selected` : shape.replace('_', ' ')}
              >
                <div className="w-4 h-4 flex items-center justify-center">
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
