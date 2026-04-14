

# Add Missing DuraSeal Stain Colors

## Overview
Add all 16 missing DuraSeal stain colors to the Stain Gallery. This requires downloading images from DuraSeal's website and adding them to the codebase.

## Missing Colors (16)
Dark Gray, Early American, Fruitwood, Golden Brown, Golden Pecan, Gunstock, Heritage Brown, Medium Brown, Neutral, Red Mahogany, Rosewood, Rustic Beige, Silvered Gray, Spice Brown, True Black, Warm Gray

## Implementation

### 1. Download 16 stain images
Download the White Oak version of each missing color from DuraSeal's website and save as JPG in `src/assets/stains/`. File names: `dark-gray.jpg`, `early-american.jpg`, `fruitwood.jpg`, `golden-brown.jpg`, `golden-pecan.jpg`, `gunstock.jpg`, `heritage-brown.jpg`, `medium-brown.jpg`, `neutral.jpg`, `red-mahogany.jpg`, `rosewood.jpg`, `rustic-beige.jpg`, `silvered-gray.jpg`, `spice-brown.jpg`, `true-black.jpg`, `warm-gray.jpg`

### 2. Update `src/pages/StainGallery.tsx`
- Add 16 new image imports
- Add 16 new entries to `whiteOakStains` array (alphabetically sorted)
- Add 16 new entries to `redOakStains` array (alphabetically sorted)
- Add 16 new entries to the `stainColors` array (for the form dropdowns)
- Keep existing 4 custom colors (Honey, Mahogany, Natural, Red Oak)

### Result
Gallery goes from 24 to 40 stain colors, matching the full DuraSeal catalog plus AXO's custom additions.

### Files
| Action | File |
|---|---|
| Create (16) | `src/assets/stains/{new-color}.jpg` |
| Edit | `src/pages/StainGallery.tsx` |

