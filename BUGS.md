# Known Bugs

## High Priority

### Safari: Drag & Drop from Theme Colors to BG/Border Colors Not Working
**Status:** Open - Fix Attempted (Failed)  
**Browser:** Safari only  
**Description:** Drag and drop functionality from theme color swatches to Background Color or Border Color inputs does not work in Safari. Theme color to theme color swapping still works correctly.

**Attempted Fix (2025-11-14):**
- Tried changing `effectAllowed` from `'copyMove'` to `'all'`
- Tried adding explicit `draggable="true"` 
- Tried adding `'text'` data format in addition to `'text/plain'`
- **Result:** Still not working in Safari

**Working:**
- ✅ Chrome/Firefox: All drag & drop operations
- ✅ Safari: Theme color to theme color (swap)

**Not Working:**
- ❌ Safari: Theme color → Background color
- ❌ Safari: Theme color → Border color
- ❌ Safari: Background color → Theme color
- ❌ Safari: Border color → Theme color

**Possible Causes:**
- Safari has stricter drag & drop security policies
- Input elements wrapped in draggable divs may behave differently in Safari
- `effectAllowed: 'copyMove'` and `dropEffect: 'copy'` interaction may need Safari-specific handling

**Potential Solutions to Investigate:**
1. Test with `effectAllowed: 'all'` instead of `'copyMove'`
2. Add explicit `draggable="true"` attribute to wrapper divs
3. Check if Safari requires different `dataTransfer` handling
4. Consider adding Safari-specific event handlers or polyfills

**Files Involved:**
- `src/components/PatternGenerator.tsx` (lines 148-271)
- `src/components/ColorPickers.tsx` (lines 33-86)

**Date Reported:** 2025-11-14

---

## Low Priority

_(No issues currently)_

---

## Fixed

_(No issues yet)_

