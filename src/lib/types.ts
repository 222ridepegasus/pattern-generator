/**
 * TypeScript types for Pattern Generator
 */

export type PatternType = 'gridCentered' | 'brick';

export type ShapeType = 
  | 'circle_01' | 'square_01' | 'hexagon_01' | 'triangle_01' | 'triangledouble_01'
  | 'block33_01' | 'block33_02' | 'block33_03' | 'block33_04' | 'block33_05' 
  | 'block33_06' | 'block33_07' | 'block33_08' | 'block33_09' | 'block33_10' 
  | 'block33_12' | 'block33_13'
  | 'nautical_a_01' | 'nautical_b_01' | 'nautical_c_01' | 'nautical_d_01' | 'nautical_e_01'
  | 'nautical_f_01' | 'nautical_g_01' | 'nautical_h_01' | 'nautical_i_01' | 'nautical_j_01'
  | 'nautical_k_01' | 'nautical_l_01' | 'nautical_m_01' | 'nautical_n_01' | 'nautical_o_01'
  | 'nautical_p_01' | 'nautical_q_01' | 'nautical_r_01' | 'nautical_s_01' | 'nautical_t_01'
  | 'nautical_u_01' | 'nautical_v_01' | 'nautical_w_01' | 'nautical_x_01' | 'nautical_y_01'
  | 'nautical_z_01';

export interface PatternConfig {
  seed: number;
  patternType: PatternType;
  containerSize: [number, number];
  gridSize: number;
  borderPadding: number;
  lineSpacing: number;
  emptySpace: number; // Percentage of empty cells (0-100)
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
  preserveLayout?: boolean; // When true: deterministic flip (preserves layout). When false: random flip (can reorganize)
  stroke?: {
    enabled: boolean;
    width: number;      // 1-10
    color: string;      // hex color
  };
}


// OLD THEMES - Hidden for now, need to add slot_1 backgrounds
// export const COLOR_PALETTES = {
//   vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
//   pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD4BA'],
//   monochrome: ['#1a1a1a', '#4a4a4a', '#7a7a7a', '#aaaaaa', '#dadada'],
//   sunset: ['#FF6B9D', '#C06C84', '#6C5B7B', '#355C7D', '#2A9D8F'],
//   forest: ['#2D4A3E', '#4A7C59', '#8FC93A', '#C9E265', '#E8F5C8'],
//   ocean: ['#05668D', '#028090', '#00A896', '#02C39A', '#F0F3BD'],
//   autumn: ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC'],
//   berry: ['#5D001E', '#9A1750', '#C1666B', '#D4A5A5', '#E4C1C1'],
//   neon: ['#FF10F0', '#00F0FF', '#F0FF00', '#FF00F0', '#00FF10'],
//   earth: ['#3D2A1D', '#6B4423', '#8B6635', '#B8915E', '#D4B896'],
// };

// NEW SLOT-BASED THEMES (for multi-color shapes like nautical flags)
export const SLOT_BASED_THEMES = [
  {
    name: 'Nautical Modern',
    colors: [
      '#FDFBF7',  // slot_1 - Background
      '#385FE2',  // slot_2 - Blue
      '#D85D52',  // slot_3 - Red
      '#FFD93D',  // slot_4 - Yellow
      '#000000'   // slot_5 - Black
    ]
  },
  {
    name: 'Nautical',
    colors: [
      '#F5F3E8',  // slot_1 - Background
      '#182E63',  // slot_2 - Navy
      '#A7373B',  // slot_3 - Crimson
      '#EBBE63',  // slot_4 - Gold
      '#221F21'   // slot_5 - Charcoal
    ]
  },
  {
    name: 'Neon Cinder',
    colors: [
      '#000000',  // slot_1 - Background
      '#FEFE79',  // slot_2 - Neon Yellow
      '#D65C64'   // slot_3 - Pink
      // Note: Only 3 colors, fallback logic will handle slots 4 & 5
    ]
  },
  {
    name: 'CGA Mist',
    colors: [
      '#CC5AA3',  // slot_1 - Background
      '#81C2D4'   // slot_2 - Sky Blue
    ]
  },
  {
    name: 'Iron Solstice',
    colors: [
      '#000000',  // slot_1 - Background
      '#C87340'   // slot_2 - Copper
    ]
  },
  {
    name: 'Schattenacker',
    colors: [
      '#504E27',  // slot_1 - Background
      '#BA9A53'   // slot_2 - Gold
    ]
  },
  {
    name: 'Flamingo Fatigue',
    colors: [
      '#B7ACB4',  // slot_1 - Background
      '#532933',  // slot_2 - Dark Red
      '#CD647E',  // slot_3 - Pink
      '#BBA34A'   // slot_4 - Mustard
    ]
  }
];

// Temporary COLOR_PALETTES for backward compatibility (using SLOT_BASED_THEMES)
// This will be updated to use the new slot-based system
export const COLOR_PALETTES = {
  'Nautical Modern': SLOT_BASED_THEMES[0].colors,
  'Nautical': SLOT_BASED_THEMES[1].colors,
  'Neon Cinder': SLOT_BASED_THEMES[2].colors,
  'CGA Mist': SLOT_BASED_THEMES[3].colors,
  'Iron Solstice': SLOT_BASED_THEMES[4].colors,
  'Schattenacker': SLOT_BASED_THEMES[5].colors,
  'Flamingo Fatigue': SLOT_BASED_THEMES[6].colors,
};

export const DEFAULT_CONFIG: PatternConfig = {
  seed: Date.now(),
  patternType: 'gridCentered',
  containerSize: [800, 800],
  gridSize: 4,
  borderPadding: 0,
  lineSpacing: 8,
  emptySpace: 0,
  spacing: 0, // Spacing slider removed - using Line Spacing instead
  backgroundColor: '#ffffff',
  shapes: ['nautical_a_01', 'nautical_b_01', 'nautical_c_01'], // Using nautical shapes (primitives/blocks disabled)
  colors: SLOT_BASED_THEMES[0].colors.slice(0, 3), // Using Nautical Modern theme
  rotation: {
    enabled: false,
  },
  mirror: {
    horizontal: false,
    vertical: false,
  },
  preserveLayout: true,
  stroke: {
    enabled: false,
    width: 1,
    color: '#000000'
  },
};
