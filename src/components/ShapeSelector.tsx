import React from 'react';
import type { ShapeType } from '../lib/types';

interface ShapeSelectorProps {
  selectedShapes: ShapeType[];
  onSelectionChange: (shapes: ShapeType[]) => void;
}

const ALL_SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon', 'diamond', 'roundedSquare'];

// SVG previews for each shape
const ShapeIcon: React.FC<{ shape: ShapeType; size?: number }> = ({ shape, size = 32 }) => {
  const center = size / 2;
  const radius = size * 0.35;
  const halfSize = size * 0.35;

  switch (shape) {
    case 'circle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <circle cx={center} cy={center} r={radius} />
        </svg>
      );
    case 'square':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <rect x={center - halfSize} y={center - halfSize} width={halfSize * 2} height={halfSize * 2} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <polygon
            points={`${center},${center - halfSize} ${center - halfSize},${center + halfSize} ${center + halfSize},${center + halfSize}`}
          />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <polygon
            points={`${center},${center - halfSize} ${center + halfSize * 0.866},${center - halfSize * 0.5} ${center + halfSize * 0.866},${center + halfSize * 0.5} ${center},${center + halfSize} ${center - halfSize * 0.866},${center + halfSize * 0.5} ${center - halfSize * 0.866},${center - halfSize * 0.5}`}
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <polygon
            points={`${center},${center - halfSize} ${center + halfSize},${center} ${center},${center + halfSize} ${center - halfSize},${center}`}
          />
        </svg>
      );
    case 'roundedSquare':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fill-current">
          <rect
            x={center - halfSize}
            y={center - halfSize}
            width={halfSize * 2}
            height={halfSize * 2}
            rx={halfSize * 0.2}
          />
        </svg>
      );
    default:
      return null;
  }
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

  return (
    <div className="grid grid-cols-3 gap-2">
      {ALL_SHAPES.map(shape => {
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
            title={shape.charAt(0).toUpperCase() + shape.slice(1)}
          >
            <ShapeIcon shape={shape} size={32} />
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
  );
}

