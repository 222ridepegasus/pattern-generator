# Pattern Generator

A powerful web-based tool for generating customizable SVG patterns for designers.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:4321`

## 📁 Project Structure

```
pattern-generator/
├── src/
│   ├── components/         # React components
│   │   └── PatternGenerator.tsx  # Main UI component (stub)
│   ├── layouts/           # Astro layouts
│   │   └── Layout.astro   # Base HTML layout
│   ├── pages/             # Astro pages
│   │   └── index.astro    # Home page
│   ├── lib/               # Core logic
│   │   ├── patternEngine.js    # Pattern generation engine ✅ COMPLETE
│   │   └── types.ts            # TypeScript types ✅ COMPLETE
│   └── styles/            # Global styles
│       └── global.css     # Tailwind + base styles
├── public/                # Static assets
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies

```

## 🎯 Current Status

### ✅ Complete
- Project scaffolding
- Pattern engine core logic (patternEngine.js)
- TypeScript types and default configurations
- Grid, Scatter, and Brick pattern generators
- Seeded random number generation (reproducible patterns)
- SVG shape generators (6 shapes)
- Basic project structure

### 🚧 Next Steps (For Cursor)
1. Build out the PatternGenerator component with full UI controls
2. Connect the UI to the pattern engine
3. Implement real-time pattern preview
4. Add export functionality (PNG/SVG)
5. Create individual control components
6. Add color palette selector
7. Implement shape multi-select
8. Add randomization controls

## 🛠️ Tech Stack

- **Astro** - Static site framework
- **React** - UI components (islands architecture)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Vanilla JS** - Pattern engine (framework-agnostic)

## 📋 Feature Checklist (MVP)

### Pattern Types
- [x] Grid pattern
- [x] Scatter pattern
- [x] Brick pattern

### Canvas Controls
- [ ] Canvas size selector (400x400, 800x800, 1200x1200, custom)
- [ ] Scale slider (0.5x - 5x)
- [ ] Spacing slider (0 - 100px)
- [ ] Background color picker

### Shapes
- [x] Circle shape
- [x] Square shape
- [x] Triangle shape
- [x] Hexagon shape
- [x] Diamond shape
- [x] Rounded square shape
- [ ] Shape multi-select UI
- [ ] Shape variety control (1-4)

### Colors
- [ ] Color pickers (2-6 colors)
- [ ] Preset palette selector (10 palettes included)
- [ ] Randomize colors button

### Randomization
- [ ] Randomize all button
- [ ] Rotation toggle
- [ ] Seed display (optional)

### Export
- [ ] Export PNG button
- [ ] Export SVG button
- [ ] Copy SVG to clipboard
- [ ] High-res export (2x, 3x)

### UI/UX
- [ ] Real-time pattern preview
- [ ] Smooth slider interactions
- [ ] Responsive layout (desktop-first)
- [ ] Loading states

## 🎨 Design Philosophy

- **Immediate feedback** - Pattern updates as you adjust controls
- **Progressive disclosure** - Basic controls visible, advanced hidden
- **Designer-friendly** - Terminology and controls match design workflows
- **Performance first** - Must feel instant (<100ms updates)

## 🔧 Key Architecture Decisions

1. **Pattern Engine is Pure JS** - Framework-agnostic core logic
2. **Seeded Random** - Reproducible patterns via seed number
3. **SVG/Canvas Hybrid** - Use SVG for <500 shapes, Canvas for more
4. **State in React** - Pattern config in React state, engine is stateless
5. **Tailwind Defaults** - Use Tailwind's design system for prototype

## 📝 Notes for Building

### Connecting UI to Engine

```typescript
import { generatePattern, patternToSVG } from '../lib/patternEngine';

// In component:
const elements = generatePattern(config);
const svg = patternToSVG(elements, config.canvasSize, config.backgroundColor);
setSvgContent(svg);
```

### State Management
All pattern configuration lives in a single `PatternConfig` object. Update it immutably:

```typescript
setConfig(prev => ({ ...prev, scale: newScale }));
```

### Real-time Updates
Use `useEffect` to regenerate pattern whenever config changes:

```typescript
useEffect(() => {
  const elements = generatePattern(config);
  const svg = patternToSVG(elements, config.canvasSize, config.backgroundColor);
  setSvgContent(svg);
}, [config]);
```

### Export Functions
The `patternToPNG` function is already implemented in patternEngine.js. Use it like:

```typescript
const blob = await patternToPNG(svgContent, 2); // 2x scale
// Trigger download
```

## 🎯 MVP Success Criteria

- [ ] Generate all 3 pattern types
- [ ] All 6 shapes available and selectable
- [ ] 2-6 colors configurable
- [ ] Export PNG and SVG works
- [ ] Pattern updates feel instant (<100ms)
- [ ] Works in Chrome, Firefox, Safari
- [ ] Hosted and shareable via URL

## 📚 Resources

- [Astro Docs](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react)

## 🤝 Development Workflow

1. **Prototype in Cursor** - Build functional UI with Tailwind defaults
2. **Test & Iterate** - Use the tool, find pain points
3. **Design in Figma** - Once it works, create polished UI
4. **Polish Pass** - Replace prototype UI with designed components

---

**Status:** Ready for development in Cursor  
**Next Action:** Open project in Cursor and start building the full UI
