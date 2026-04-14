

# Replace Links Hero with Woody Mascot (Kings OS Style)

## Overview
Replace the current broken hero image on `/links` with the Woody mascot (`woody-mascot.png`), using the same hero layout as Kings OS — tall aspect ratio (3:4), gradient fade into navy background, logo + tagline overlay at the bottom.

## Changes

### `src/pages/Links.tsx`
- Import `woodyMascot` from `@/assets/woody-mascot.png`
- Replace the current hero section (`aspect-[4/3]` with broken image) with Kings OS-style hero:
  - `aspect-[3/4]` container (taller, portrait orientation)
  - Woody mascot as a centered image with `object-cover object-top`
  - 60% bottom gradient fade blending into navy (`hsl(var(--navy-primary))`)
  - Framer Motion fade-in animation on the image
  - Logo + tagline overlay at the bottom with staggered entrance animations
- Remove the old `/lovable-uploads/` image reference

### Files
| Action | File |
|---|---|
| Edit | `src/pages/Links.tsx` |

