

# Fix Red Oak Stain Images -- Use Correct DuraSeal Red Oak Photos

## Problem
The Red Oak section currently uses the exact same images as White Oak. DuraSeal has separate Red Oak images (uploaded April 2025, PNG format) that show how each stain looks specifically on Red Oak wood.

## Implementation

### 1. Download 35 Red Oak images from DuraSeal
Download the full-size Red Oak version of each color from DuraSeal's April 2025 uploads and save as PNG in `src/assets/stains/red-oak/`. Source URLs follow the pattern: `https://www.duraseal.com/wp-content/uploads/2025/04/{Color-Name}.png`

Colors (35 total -- all DuraSeal colors, no AXO custom): Aged Barrel, Antique Brown, Cherry, Chestnut, Classic Gray, Coffee Brown, Colonial Maple, Country White, Dark Gray, Dark Walnut, Early American, Ebony, English Chestnut, Espresso, Fruitwood, Golden Brown, Golden Oak, Golden Pecan, Gunstock, Heritage Brown, Jacobean, Medium Brown, Neutral, Nutmeg, Provincial, Red Mahogany, Rosewood, Royal Mahogany, Rustic Beige, Sedona Red, Silvered Gray, Special Walnut, Spice Brown, True Black, Warm Gray, Weathered Oak

### 2. Update `src/pages/StainGallery.tsx`
- Add 35 new imports for Red Oak images (from `@/assets/stains/red-oak/` folder)
- Update `redOakStains` array to use the Red Oak-specific images instead of the White Oak ones
- Remove the 3 AXO custom colors (Honey, Mahogany, Red Oak) from `redOakStains` since DuraSeal doesn't have Red Oak versions for those -- OR keep them with White Oak images as placeholders (will ask)

### 3. Sequence verification
Both arrays already match DuraSeal's alphabetical order. No reordering needed.

### Files
| Action | File |
|---|---|
| Create (35) | `src/assets/stains/red-oak/{color}.png` |
| Edit | `src/pages/StainGallery.tsx` |

