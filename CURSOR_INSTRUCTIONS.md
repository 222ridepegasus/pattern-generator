# Cursor Build Instructions - Pattern Generator

This document contains step-by-step prompts to give to Cursor for building out the Pattern Generator MVP.

## 🎯 Goal
Build a fully functional pattern generator with real-time preview and export capabilities.

## 📋 Build Order

Follow these steps in order. Give each prompt to Cursor separately, test the result, then move to the next.

---

## Phase 1: Core Functionality

### Step 1: Connect Pattern Engine to UI
**Prompt for Cursor:**
```
I need you to connect the pattern engine to the PatternGenerator component. 

Requirements:
1. Import generatePattern and patternToSVG from '../lib/patternEngine'
2. Add a useEffect that regenerates the pattern whenever config changes
3. Store the generated SVG string in svgContent state
4. Make sure the pattern displays in the preview area
5. Add error handling in case pattern generation fails

The pattern engine is already built (src/lib/patternEngine.js) and works with the config structure defined in types.ts.
```

### Step 2: Canvas Size Control
**Prompt for Cursor:**
```
Build out the canvas size selector in the controls panel.

Requirements:
1. Use the CANVAS_PRESETS from '../lib/types'
2. Make it a select dropdown showing all preset sizes
3. When changed, update config.canvasSize
4. The preview area should dynamically resize to match the canvas size
5. Keep the current selected option highlighted

Current canvas size is in config.canvasSize as [width, height].
```

### Step 3: Scale and Spacing Sliders
**Prompt for Cursor:**
```
Make the Scale and Spacing sliders fully functional.

Requirements:
1. Scale slider: range 0.5 to 5, step 0.1, shows current value like "Scale: 1.5x"
2. Spacing slider: range 0 to 100, step 1, shows current value like "Spacing: 20px"
3. Both should update config immediately (no "apply" button needed)
4. Add visual feedback - the slider track should be styled nicely
5. Pattern should update in real-time as you drag

Use Tailwind classes for styling the sliders.
```

### Step 4: Background Color Picker
**Prompt for Cursor:**
```
Add a background color picker to the canvas controls section.

Requirements:
1. Use HTML5 color input (<input type="color">)
2. Show current color value as hex code next to the picker
3. Update config.backgroundColor when changed
4. Add a label "Background Color"
5. Style it nicely to match the other controls

The background color should immediately update the pattern preview.
```

---

## Phase 2: Shape Selection

### Step 5: Shape Selection UI
**Prompt for Cursor:**
```
Create a shape selector that lets users pick multiple shapes from the library.

Requirements:
1. Show all 6 available shapes (circle, square, triangle, hexagon, diamond, roundedSquare)
2. Display each shape as a visual icon/preview, not just text
3. Allow multi-select (clicking toggles selection)
4. Selected shapes should have a visual indicator (border, background color, checkmark)
5. Update config.shapes array when selection changes
6. Ensure at least 1 shape is always selected (can't deselect all)

Create this as a new component (ShapeSelector.tsx) and use it in PatternGenerator.
Use simple SVG icons for each shape preview.
```

### Step 6: Shape Variety Control
**Prompt for Cursor:**
```
Add a "Shape Variety" control that limits how many different shapes appear in the pattern.

Requirements:
1. Add a number input or slider (range 1 to 4)
2. Label it "Shape Variety" with current value displayed
3. Update config.shapeVariety when changed
4. Add helper text: "Number of different shapes in pattern"
5. This should be separate from shape selection (selection is which shapes are available, variety is how many are used)

Note: The pattern engine already uses shapeVariety, but we need to modify it slightly to respect this setting. The engine currently picks randomly from all selected shapes - we need to randomly pick {shapeVariety} shapes from the selected shapes and only use those.
```

---

## Phase 3: Color System

### Step 7: Color Pickers
**Prompt for Cursor:**
```
Create a color picker section that allows 2-6 colors.

Requirements:
1. Show color pickers for each color in config.colors array
2. Allow adding colors (up to 6 max) with an "+ Add Color" button
3. Allow removing colors (min 2 colors) with a remove button next to each
4. Each color picker shows the hex value
5. Update config.colors array when any color changes
6. Style it cleanly with good spacing

Create this as a ColorPickers component.
```

### Step 8: Preset Palettes
**Prompt for Cursor:**
```
Add a preset palette selector using the COLOR_PALETTES from types.ts.

Requirements:
1. Show all available palettes as clickable swatches
2. Each swatch shows a preview of the palette colors
3. Clicking a palette applies those colors to config.colors
4. Show palette names on hover
5. Visual indication of which palette is currently active (if any)
6. Add a "Custom" indicator if user has modified colors

Display this above or below the color pickers. Make it visually appealing.
```

### Step 9: Randomize Colors
**Prompt for Cursor:**
```
Add a "Randomize Colors" button that generates a new random palette.

Requirements:
1. Button labeled "🎨 Randomize Colors"
2. Generates 3-5 random colors (random count between 3-5)
3. Colors should be vibrant and look good together
4. Update config.colors with the new palette
5. Can use a simple HSL-based algorithm for color harmony

Add this button near the color pickers section.
```

---

## Phase 4: Pattern Type & Randomization

### Step 10: Pattern Type Selector
**Prompt for Cursor:**
```
Make the pattern type dropdown fully functional.

Requirements:
1. Options: Grid, Scatter, Brick (from config.patternType)
2. Update config.patternType when changed
3. Pattern should regenerate with new type immediately
4. Add icons or descriptions for each pattern type
5. Consider using radio buttons or tabs instead of dropdown for better UX

The pattern engine already supports all three types.
```

### Step 11: Rotation Toggle
**Prompt for Cursor:**
```
Add rotation controls to the randomization section.

Requirements:
1. Add a toggle switch for "Enable Rotation"
2. When enabled, shapes in the pattern are randomly rotated
3. Update config.rotation.enabled
4. Add a label and helper text explaining what rotation does
5. Style the toggle nicely (custom toggle switch, not checkbox)

The pattern engine already handles rotation when config.rotation.enabled is true.
```

### Step 12: Randomize All
**Prompt for Cursor:**
```
Make the "Randomize All" button functional.

Requirements:
1. Generates a new random seed (use Date.now())
2. Picks a random pattern type
3. Randomizes colors (3-5 random colors)
4. Randomly enables/disables rotation
5. Updates all these in config
6. Shows a brief loading state or animation
7. Consider adding a keyboard shortcut (Space bar or R key)

This should create a completely new random pattern from scratch.
```

---

## Phase 5: Export Functionality

### Step 13: Export SVG
**Prompt for Cursor:**
```
Implement the "Export SVG" button functionality.

Requirements:
1. Click the button to download the current pattern as SVG
2. Filename should be auto-generated: "pattern-{seed}.svg"
3. Use the svgContent state (already contains the SVG string)
4. Create a blob and trigger download
5. Show a brief success message after download starts
6. Add a "Copy SVG" option that copies to clipboard

The SVG content is already generated by the pattern engine.
```

### Step 14: Export PNG
**Prompt for Cursor:**
```
Implement the "Export PNG" button functionality.

Requirements:
1. Use the patternToPNG function from patternEngine.js
2. Default to 1x scale, but add a dropdown for 1x, 2x, 3x options
3. Filename: "pattern-{seed}.png"
4. Show loading state while generating (PNG generation takes a moment)
5. Show success message after download
6. Handle errors gracefully

The patternToPNG function already exists and handles the conversion.
```

---

## Phase 6: Polish & UX

### Step 15: Loading States
**Prompt for Cursor:**
```
Add proper loading states throughout the UI.

Requirements:
1. Show skeleton/loading state while pattern is generating (if it takes >100ms)
2. Loading indicator on export buttons while processing
3. Disable controls during export to prevent conflicts
4. Add smooth transitions between pattern updates
5. Consider debouncing slider updates if pattern generation is slow

Make sure the app feels responsive and polished.
```

### Step 16: Keyboard Shortcuts
**Prompt for Cursor:**
```
Add keyboard shortcuts for common actions.

Requirements:
1. Space bar or R: Randomize all
2. Cmd/Ctrl + E: Export PNG
3. Cmd/Ctrl + S: Export SVG
4. Show a "?" button that displays all shortcuts
5. Make sure shortcuts don't fire when user is typing in inputs

Add subtle visual feedback when shortcuts are used.
```

### Step 17: Seed Display
**Prompt for Cursor:**
```
Add an optional seed display in the UI.

Requirements:
1. Show current seed value somewhere subtle (maybe in footer or near randomize)
2. Make it copyable (click to copy)
3. Add ability to input a specific seed (for reproducing patterns)
4. When user enters a seed, regenerate pattern with that seed
5. Style it as secondary/low-emphasis

This helps users share and reproduce exact patterns.
```

---

## Phase 7: Responsive & Accessibility

### Step 18: Responsive Adjustments
**Prompt for Cursor:**
```
Make the layout work better on smaller screens (though this is desktop-first).

Requirements:
1. On tablet and smaller, make controls panel collapsible
2. Stack layout vertically if needed on very small screens
3. Ensure buttons and controls are touch-friendly
4. Pattern preview should scale down appropriately
5. Don't break any functionality on mobile

Test at various breakpoints: 1920px, 1440px, 1024px, 768px.
```

### Step 19: Accessibility Pass
**Prompt for Cursor:**
```
Add accessibility improvements throughout the app.

Requirements:
1. All interactive elements have proper ARIA labels
2. Color pickers have labels and are keyboard accessible
3. Focus indicators are visible on all controls
4. Sliders show current value to screen readers
5. Export buttons indicate loading state to screen readers
6. Test keyboard navigation (tab through all controls)

Run through the app with keyboard only to verify everything works.
```

---

## Testing Checklist

After completing all steps, test the following:

- [ ] Pattern generates on page load
- [ ] All three pattern types work
- [ ] All six shapes can be selected and appear correctly
- [ ] Sliders update pattern in real-time
- [ ] Colors change pattern immediately
- [ ] Preset palettes apply correctly
- [ ] Randomize creates completely new patterns
- [ ] Rotation toggle works
- [ ] Export SVG downloads correctly
- [ ] Export PNG (1x, 2x, 3x) downloads correctly
- [ ] Copy SVG to clipboard works
- [ ] Keyboard shortcuts work
- [ ] No console errors
- [ ] Performance is smooth (<100ms updates for simple patterns)

---

## 🎉 MVP Complete!

Once all these steps are done, you'll have a fully functional Pattern Generator MVP ready for user testing.

## Next Steps After MVP:
1. User test with actual designers
2. Gather feedback and iterate
3. Plan Phase 2 features (advanced pattern types, animation, etc.)
4. Design polished UI in Figma
5. Replace Tailwind defaults with custom design system

---

**Notes:**
- Test after each step before moving to the next
- If something doesn't work, debug it before proceeding
- Feel free to improve upon these prompts if you think of better UX
- The pattern engine is solid - focus on making the UI feel great
