// Centralized DuraSeal stain color catalog
// Reused by JobProof uploader and (future) StainGallery dynamic queries

export const STAIN_COLORS = [
  'Aged Barrel', 'Antique Brown', 'Cherry', 'Chestnut', 'Classic Gray',
  'Coffee Brown', 'Colonial Maple', 'Country White', 'Dark Gray', 'Dark Walnut',
  'Early American', 'Ebony', 'English Chestnut', 'Espresso', 'Fruitwood',
  'Golden Brown', 'Golden Oak', 'Golden Pecan', 'Gunstock', 'Heritage Brown',
  'Honey', 'Jacobean', 'Mahogany', 'Medium Brown', 'Neutral',
  'Nutmeg', 'Provincial', 'Red Mahogany', 'Red Oak', 'Rosewood',
  'Royal Mahogany', 'Rustic Beige', 'Sedona Red', 'Silvered Gray',
  'Special Walnut', 'Spice Brown', 'True Black', 'Warm Gray', 'Weathered Oak'
] as const;

export type StainColor = typeof STAIN_COLORS[number];

export const WOOD_SPECIES = [
  'White Oak',
  'Red Oak',
  'Maple',
  'Pine',
  'Hickory',
  'Walnut',
  'Other'
] as const;

export type WoodSpecies = typeof WOOD_SPECIES[number];
