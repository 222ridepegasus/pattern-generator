/**
 * Shape Sets - Auto-generated from SVG files
 * Run 'node extractShapes.js' to regenerate
 */

export const shapeSets = {
  primitives: {
    meta: {
      name: 'Primitives',
      description: 'Basic geometric shapes',
      icon: '○□△⬡',
      enabled: true,
      multiColor: false
    },
    shapes: {
  circle_01: (x, y, size) => ({
    type: 'circle',
    attrs: { cx: x, cy: y, r: size / 2 }
  }),

  hexagon_01: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  square_01: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  triangle_01: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  triangledouble_01: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  })
    }
  },

  blocks33: {
    meta: {
      name: '3×3 Blocks',
      description: 'Complex block patterns',
      icon: '▦▧▨',
      enabled: true,
      multiColor: false
    },
    shapes: {
  block33_01: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_02: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_03: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_04: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V0H42.667V64Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  block33_05: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_06: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_07: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_08: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_09: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V42.667H0V21.333H42.667V64Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  block33_10: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V42.667H21.333V64ZM64 64H42.667V42.667H64V64Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  block33_12: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  }),

  block33_13: (x, y, size) => ({
    type: 'rect',
    attrs: { x: x - size / 2, y: y - size / 2, width: size, height: size }
  })
    }
  },

  nautical: {
    meta: {
      name: 'Nautical Flags',
      description: 'International maritime signal flags',
      icon: '⚓🚩',
      enabled: true,
      multiColor: true
    },
    shapes: {
  nautical_a_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M32 0V64H64L46 32L64 0H32Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_b_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M0 0V64H64L46 32L64 0H0Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      }
    ];
  },

  nautical_c_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64H0V51H64V64ZM64 13H0V0H64V13Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (25.5 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${13 * Math.abs(scaleY)}`
        },
        slot: 3
      }
    ];
  },

  nautical_d_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'path',
        attrs: {
          d: "M64 64H0V48H64V64ZM64 16H0V0H64V16Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (16 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${32 * Math.abs(scaleY)}`
        },
        slot: 2
      }
    ];
  },

  nautical_e_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${32 * Math.abs(scaleY)}`
        },
        slot: 2
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (32 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${32 * Math.abs(scaleY)}`
        },
        slot: 3
      }
    ];
  },

  nautical_f_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M32 0L0 32L32 64L64 32L32 0Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      }
    ];
  },

  nautical_g_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'path',
        attrs: {
          d: "M21.3336 64H10.6666V0H21.3336V64ZM42.6666 64H32.0006V0H42.6666V64ZM63.9996 64H53.3336V0H63.9996V64Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      },
      {
        type: 'path',
        attrs: {
          d: "M10.667 64H0V0H10.667V64ZM32 64H21.333V0H32V64ZM53.333 64H42.667V0H53.333V64Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      }
    ];
  },

  nautical_h_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (32 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${32 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 3
      }
    ];
  },

  nautical_i_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 4
      },
      {
        type: 'circle',
        attrs: {
          cx: `${x + (32 - 32) * scaleX}`,
          cy: `${y + (32 - 32) * scaleY}`,
          r: `${19 * Math.abs(scale)}`
        },
        slot: 5
      }
    ];
  },

  nautical_j_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64H0V42.667H64V64ZM64 21.333H0V0H64V21.333Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_k_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (32 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${32 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 2
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${32 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 4
      }
    ];
  },

  nautical_l_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'path',
        attrs: {
          d: "M64 64H32V32H64V64ZM32 32H0V0H32V32Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      },
      {
        type: 'path',
        attrs: {
          d: "M32 64H0V32H32V64ZM64 32H32V0H64V32Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 5
      }
    ];
  },

  nautical_m_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M55.5156 64H8.48438L32 40.4844L55.5156 64ZM23.5156 32L0 55.5156V8.48438L23.5156 32ZM64 55.5156L40.4844 32L64 8.48438V55.5156ZM32 23.5156L8.48438 0H55.5156L32 23.5156Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_n_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M32 64H16V48H32V64ZM64 64H48V48H64V64ZM16 48H0V32H16V48ZM48 48H32V32H48V48ZM32 32H16V16H32V32ZM64 32H48V16H64V32ZM16 16H0V0H16V16ZM48 16H32V0H48V16Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_o_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'path',
        attrs: {
          d: "M64 64L0 0H64V64Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64L0 0V64H64Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      }
    ];
  },

  nautical_p_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (4 - 32) * scaleX}`,
          y: `${y + (4 - 32) * scaleY}`,
          width: `${56 * Math.abs(scaleX)}`,
          height: `${56 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64H0V0H64V64ZM12 12V52H52V12H12Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_q_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 4
      }
    ];
  },

  nautical_r_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 3
      },
      {
        type: 'path',
        attrs: {
          d: "M38.4004 25.5996H64V38.4004H38.4004V64H25.5996V38.4004H0V25.5996H25.5996V0H38.4004V25.5996Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      }
    ];
  },

  nautical_s_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (12 - 32) * scaleX}`,
          y: `${y + (12 - 32) * scaleY}`,
          width: `${40 * Math.abs(scaleX)}`,
          height: `${40 * Math.abs(scaleY)}`
        },
        slot: 2
      }
    ];
  },

  nautical_t_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (42.7 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${21.3 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 2
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${21 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 3
      }
    ];
  },

  nautical_u_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64H32V32H64V64ZM32 32H0V0H32V32Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      }
    ];
  },

  nautical_v_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M31.4912 24.0234L55.5156 0H64V8.48438L40.1104 32.373L64 55.5156V64H55.5156L32 40.4844L8.48438 64H0V55.5156L23.5156 32L0 8.48438V0H6.69141L31.4912 24.0234Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      }
    ];
  },

  nautical_w_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64H0V0H64V64ZM12 12V52H52V12H12Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      },
      {
        type: 'rect',
        attrs: {
          x: `${x + (23 - 32) * scaleX}`,
          y: `${y + (23 - 32) * scaleY}`,
          width: `${18 * Math.abs(scaleX)}`,
          height: `${18 * Math.abs(scaleY)}`
        },
        slot: 3
      }
    ];
  },

  nautical_x_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 1
      },
      {
        type: 'path',
        attrs: {
          d: "M38.4004 25.5996H64V38.4004H38.4004V64H25.5996V38.4004H0V25.5996H25.5996V0H38.4004V25.5996Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      }
    ];
  },

  nautical_y_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'rect',
        attrs: {
          x: `${x + (0 - 32) * scaleX}`,
          y: `${y + (0 - 32) * scaleY}`,
          width: `${64 * Math.abs(scaleX)}`,
          height: `${64 * Math.abs(scaleY)}`
        },
        slot: 3
      },
      {
        type: 'path',
        attrs: {
          d: "M64 25.6045L44.8018 44.8018L25.6045 64H12.9336L38.4658 38.4658L64 12.9336V25.6045ZM64 51.249L57.625 57.625L51.249 64H38.5781L51.2881 51.2881L64 38.5781V51.249ZM31.9795 31.9795L0 63.9609V51.2881L25.6445 25.6445L51.2881 0H63.9609L31.9795 31.9795ZM19.1582 19.1582L0 38.3154V25.6445L25.6445 0H38.3154L19.1582 19.1582ZM6.33594 6.33594L0 12.6709V0H12.6709L6.33594 6.33594Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      }
    ];
  },

  nautical_z_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    return [
      {
        type: 'path',
        attrs: {
          d: "M64 0V64L32 32L64 0Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 2
      },
      {
        type: 'path',
        attrs: {
          d: "M64 64L0 64L32 32L64 64Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 3
      },
      {
        type: 'path',
        attrs: {
          d: "M64 0L0 -2.79753e-06L32 32L64 0Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 4
      },
      {
        type: 'path',
        attrs: {
          d: "M0 0V64L32 32L0 0Z",
          transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
        },
        slot: 5
      }
    ];
  }
    }
  }
};

// Flatten all shapes for pattern engine
export const getAllShapes = () => {
  const allShapes = {};
  Object.entries(shapeSets).forEach(([setKey, set]) => {
    Object.entries(set.shapes).forEach(([shapeKey, shapeFn]) => {
      allShapes[shapeKey] = shapeFn;
    });
  });
  return allShapes;
};

// Get shapes from enabled sets only
export const getEnabledShapes = () => {
  const enabledShapes = {};
  Object.entries(shapeSets).forEach(([setKey, set]) => {
    if (set.meta.enabled) {
      Object.entries(set.shapes).forEach(([shapeKey, shapeFn]) => {
        enabledShapes[shapeKey] = shapeFn;
      });
    }
  });
  return enabledShapes;
};

// Backward compatibility - export flattened shapes
export const shapes = getAllShapes();
