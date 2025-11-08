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
      enabled: true
    },
    shapes: {
  circle_01: (x, y, size, flipH = 1, flipV = 1) => ({
    type: 'circle',
    attrs: { cx: x, cy: y, r: size / 2 }
    // Circle doesn't need flip handling - it's symmetrical
  }),

  square_01: (x, y, size, flipH = 1, flipV = 1) => ({
    type: 'rect',
    attrs: {
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size
    }
    // Square doesn't need flip handling - it's symmetrical
  }),

  hexagon_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    // Flip around center: translate to position, scale (with flip), offset by shape center
    return {
      type: 'path',
      attrs: {
        d: "M32 0L59.7128 16V48L32 64L4.28719 48V16L32 0Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  triangle_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    // Flip around center: translate to position, scale (with flip), offset by shape center
    return {
      type: 'path',
      attrs: {
        d: "M32 0L0 64H64L32 0Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  triangledouble_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    // Flip around center: translate to position, scale (with flip), offset by shape center
    return {
      type: 'path',
      attrs: {
        d: "M64 64H0L32 32L64 64ZM64 32H0L32 0L64 32Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  }
    }
  },

  blocks33: {
    meta: {
      name: '3×3 Blocks',
      description: 'Complex block patterns',
      icon: '▦▧▨',
      enabled: true
    },
    shapes: {
  block33_01: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    const scaleX = scale * flipH;
    const scaleY = scale * flipV;
    // Flip around center: translate to position, scale (with flip), offset by shape center
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V42.667H21.333V64ZM64 64H42.667V42.667H64V64ZM42.667 42.667H21.333V21.333H42.667V42.667ZM21.333 21.333H0V0H21.333V21.333ZM64 21.333H42.667V0H64V21.333Z",
        transform: `translate(${x}, ${y}) scale(${scaleX}, ${scaleY}) translate(-32, -32)`
      }
    };
  },

  block33_02: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V42.667H42.667V64ZM21.333 42.667H0V21.333H21.333V42.667ZM64 42.667H42.667V21.333H64V42.667ZM42.667 21.333H21.333V0H42.667V21.333Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_03: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V0H21.333V64ZM64 64H42.667V0H64V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_04: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V0H42.667V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_05: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 21.333H21.333V42.667H42.667V21.333ZM64 64H0V0H64V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_06: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V42.667H0V21.333H21.333V0H42.667V21.333H64V42.667H42.667V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_07: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V42.667H21.333V64ZM64 64H42.667V42.667H64V64ZM21.333 21.333H0V0H21.333V21.333ZM64 21.333H42.667V0H64V21.333Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_08: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V42.667H21.333V64ZM64 64H42.667V21.333H0V0H64V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_09: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M42.667 64H21.333V42.667H0V21.333H42.667V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_10: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V42.667H21.333V64ZM64 64H42.667V42.667H64V64Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_12: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M21.333 64H0V21.333H21.333V64ZM64 42.667H42.667V0H64V42.667Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
  },

  block33_13: (x, y, size, flipH = 1, flipV = 1) => {
    const scale = size / 64;
    return {
      type: 'path',
      attrs: {
        d: "M64 64H42.667V42.667H64V64ZM21.333 21.333H0V0H21.333V21.333Z",
        transform: `translate(${x}, ${y}) scale(${scale * flipH}, ${scale * flipV}) translate(-32, -32)`
      }
    };
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
