/**
 * TypeScript types for Pattern Generator
 */

export type PatternType = 'grid' | 'scatter' | 'brick';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon' | 'diamond' | 'roundedSquare';

export interface PatternConfig {
  seed: number;
  patternType: PatternType;
  aspectRatio: string;
  fixedSize: [number, number] | null;
  shapeSize: number;
  spacing: number;
  edgePadding: number;
  clipAtEdge: boolean;
  backgroundColor: string;
  shapes: ShapeType[];
  colors: string[];
  rotation: {
    enabled: boolean;
    angle?: number;
  };
}

export const SHAPE_SIZES = [16, 24, 32, 40, 48, 56, 64, 80, 96];

export interface FixedSize {
  label: string;
  width: number;
  height: number;
}

export const FIXED_SIZES: FixedSize[] = [
  { label: '1920×1080', width: 1920, height: 1080 }, // Full HD
  { label: '1080×1080', width: 1080, height: 1080 }, // Instagram Square
  { label: '1200×630', width: 1200, height: 630 },   // Social OG Image
  { label: '1024×768', width: 1024, height: 768 },   // iPad
  { label: '2560×1440', width: 2560, height: 1440 }, // QHD
];

export interface AspectRatio {
  label: string;
  value: string;
  ratio: number;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '2:1', value: '2:1', ratio: 2 },
  { label: '1:2', value: '1:2', ratio: 0.5 },
  { label: '3:4', value: '3:4', ratio: 0.75 },
  { label: '4:3', value: '4:3', ratio: 1.333 },
  { label: '9:16', value: '9:16', ratio: 0.5625 },
  { label: '16:9', value: '16:9', ratio: 1.778 },
  { label: '4:5', value: '4:5', ratio: 0.8 },
  { label: '5:4', value: '5:4', ratio: 1.25 },
];

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
  patternType: 'grid',
  aspectRatio: '1:1',
  fixedSize: null,
  shapeSize: 48,
  spacing: 10,
  edgePadding: 0,
  clipAtEdge: true,
  backgroundColor: '#ffffff',
  shapes: ['circle', 'square'],
  colors: COLOR_PALETTES.vibrant.slice(0, 3),
  rotation: {
    enabled: false,
  },
};
