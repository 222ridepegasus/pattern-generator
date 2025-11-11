/**
 * Shape Loader - Scans available shapes from public directory
 */

/**
 * Get list of available shapes
 * For now, hardcoded list. Later can be dynamic.
 */
export const availableShapes = {
    nautical: [
      'nautical_a_01',
      'nautical_b_01',
      'nautical_c_01',
      'nautical_d_01',
      'nautical_e_01',
      'nautical_f_01',
      'nautical_g_01',
      'nautical_h_01',
      'nautical_i_01',
      'nautical_j_01',
      'nautical_k_01',
      'nautical_l_01',
      'nautical_m_01',
      'nautical_n_01',
      'nautical_o_01',
      'nautical_p_01',
      'nautical_q_01',
      'nautical_r_01',
      'nautical_s_01',
      'nautical_t_01',
      'nautical_u_01',
      'nautical_v_01',
      'nautical_w_01',
      'nautical_x_01',
      'nautical_y_01',
      'nautical_z_01',
    ],
    primitives: [
      'circle_01',
      'square_01',
      'triangle_01',
      'hexagon_01',
    ],
  };
  
  /**
   * Get all shapes as flat array
   */
  export function getAllShapes() {
    return [
      ...availableShapes.nautical,
      ...availableShapes.primitives,
    ];
  }
  
  /**
   * Get shape category
   */
  export function getShapeCategory(shapeId) {
    if (shapeId.startsWith('nautical_')) return 'nautical';
    if (shapeId.startsWith('circle_') || 
        shapeId.startsWith('square_') || 
        shapeId.startsWith('triangle_') ||
        shapeId.startsWith('hexagon_')) return 'primitives';
    return 'nautical'; // default
  }
  
  /**
   * Generate preview for shape (for shape selector)
   * Returns a data URL for preview thumbnail
   */
  export async function generateShapePreview(shapeId, size = 64) {
    // Load shape with default B&W colors
    const svgPath = `/shapes/${getShapeCategory(shapeId)}/${shapeId}.svg`;
    const response = await fetch(svgPath);
    
    if (!response.ok) {
      console.error(`Failed to load shape preview: ${shapeId}`);
      return null;
    }
    
    const svgContent = await response.text();
    
    // Create data URL
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  }