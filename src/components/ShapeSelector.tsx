import React from 'react';
import type { ShapeType } from '../lib/types';
import { shapeSets } from '../lib/shapeSets.js';

interface ShapeSelectorProps {
  selectedShapes: ShapeType[];
  onSelectionChange: (shapes: ShapeType[]) => void;
}

// Render shape preview as mini SVG
const renderShapePreview = (shapeName: ShapeType, shapeFunction: Function) => {
  // Generate shape at center of 64x64 canvas
  const shapeData = shapeFunction(32, 32, 48);
  
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
const ShapePreview: React.FC<{ shapeName: ShapeType }> = ({ shapeName }) => {
  // Check which set contains this shape to avoid TypeScript errors
  const shapeFn = (shapeName in shapeSets.primitives.shapes 
    ? shapeSets.primitives.shapes[shapeName as keyof typeof shapeSets.primitives.shapes]
    : null) || 
    (shapeName in shapeSets.blocks33.shapes
      ? shapeSets.blocks33.shapes[shapeName as keyof typeof shapeSets.blocks33.shapes]
      : null);
  
  if (!shapeFn) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
        {shapeName}
      </div>
    );
  }

  return renderShapePreview(shapeName, shapeFn);
};

export default function ShapeSelector({ selectedShapes, onSelectionChange }: ShapeSelectorProps) {
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
      // Add shape to selection
      onSelectionChange([...selectedShapes, shape]);
    }
  };

  // Get shape names from shapeSets
  const primitiveShapes: ShapeType[] = Object.keys(shapeSets.primitives.shapes) as ShapeType[];
  const blockShapes: ShapeType[] = Object.keys(shapeSets.blocks33.shapes) as ShapeType[];

  return (
    <div className="space-y-4">
      {/* Primitives Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {shapeSets.primitives.meta.name}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {primitiveShapes.map(shape => {
            const isSelected = selectedShapes.includes(shape);
            return (
              <button
                key={shape}
                type="button"
                onClick={() => handleShapeToggle(shape)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${selectedShapes.length === 1 && isSelected ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
                disabled={selectedShapes.length === 1 && isSelected}
                title={shape.replace('_', ' ')}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <ShapePreview shapeName={shape} />
                </div>
                {isSelected && (
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

      {/* 3×3 Blocks Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {shapeSets.blocks33.meta.name}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {blockShapes.map(shape => {
            const isSelected = selectedShapes.includes(shape);
            return (
              <button
                key={shape}
                type="button"
                onClick={() => handleShapeToggle(shape)}
                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${selectedShapes.length === 1 && isSelected ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
                disabled={selectedShapes.length === 1 && isSelected}
                title={shape.replace('_', ' ')}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <ShapePreview shapeName={shape} />
                </div>
                {isSelected && (
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
    </div>
  );
}
