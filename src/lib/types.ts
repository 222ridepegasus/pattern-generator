/**
 * TypeScript types for Pattern Generator
 */

export type PatternType = 'gridCentered' | 'brick';

export type ShapeType = 
  | 'circle_01' | 'square_01' | 'hexagon_01' | 'triangle_01' | 'triangledouble_01'
  | 'block33_01' | 'block33_02' | 'block33_03' | 'block33_04' | 'block33_05' 
  | 'block33_06' | 'block33_07' | 'block33_08' | 'block33_09' | 'block33_10' 
  | 'block33_12' | 'block33_13';

export interface PatternConfig {
  seed: number;
  patternType: PatternType;
  containerSize: [number, number];
  gridSize: number;
  borderPadding: number;
  lineSpacing: number;
  spacing: number; // Keep for now, might remove later
  backgroundColor: string;
  shapes: ShapeType[];
  colors: string[];
  rotation: {
    enabled: boolean;
    angle?: number;
  };
  mirror?: {
    horizontal: boolean;
    vertical: boolean;
  };
}


export const COLOR_PALETTES = {
  vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD4BA'],
  monochrome: ['#1a1a1a', '#4a4a4a', '#7a7a7a', '#aaaaaa', '#dadada'],
  sunset: ['#FF6B9D', '#C06C84', '#6C5B7B', '#355C7D', '#2A9D8F'],
  forest: ['#2D4A3E', '#4A7C59', '#8FC93A', '#C9E265', '#E8F5C8'],
  ocean: ['#05668D', '#028090', '#00A896', '#02C39A', '#F0F3BD'],
  autumn: ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC'],
  berry: ['#5D001E', '#9A1750', '#C1666B', '#D4A5A5', '#E4C1C1'],
  neon: ['#FF10F0', '#00F0FF', '#F0FF00', '#FF00F0', '#00FF10'],
  earth: ['#3D2A1D', '#6B4423', '#8B6635', '#B8915E', '#D4B896'],
};

export const DEFAULT_CONFIG: PatternConfig = {
  seed: Date.now(),
  patternType: 'gridCentered',
  containerSize: [800, 800],
  gridSize: 4,
  borderPadding: 0,
  lineSpacing: 8,
  spacing: 0, // Spacing slider removed - using Line Spacing instead
  backgroundColor: '#ffffff',
  shapes: ['circle_01', 'hexagon_01'],
  colors: COLOR_PALETTES.vibrant.slice(0, 3),
  rotation: {
    enabled: false,
  },
  mirror: {
    horizontal: false,
    vertical: false,
  },
};
