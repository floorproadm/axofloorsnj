// Full DuraSeal stain catalog for the AI visualizer.
// Swatches are the real product photos used in the Stain Gallery.

const swatch = (slug: string) => new URL(`../../assets/stains/${slug}.jpg`, import.meta.url).href;

export type FloorCategory = "Light" | "Medium" | "Dark" | "Gray" | "Red";

export interface FloorStyle {
  id: string;
  name: string;
  category: FloorCategory;
  swatch: string;
  prompt: string;
}

const basePrompt = (tone: string) =>
  `White oak hardwood floor stained DuraSeal ${tone}. Wide-plank 5 inch boards, satin finish, realistic visible wood grain and plank seams, photographic quality, true-to-color, no glare.`;

const make = (
  id: string,
  name: string,
  category: FloorCategory,
  tone: string,
): FloorStyle => ({
  id,
  name,
  category,
  swatch: swatch(id),
  prompt: basePrompt(`${name} — ${tone}`),
});

export const FLOOR_STYLES: FloorStyle[] = [
  // Light
  make("country-white", "Country White", "Light", "soft whitewashed pickled tone, very pale cream"),
  make("neutral", "Neutral", "Light", "clear matte natural oak look, no added pigment"),
  make("rustic-beige", "Rustic Beige", "Light", "warm pale beige with subtle taupe undertone"),
  make("weathered-oak", "Weathered Oak", "Light", "driftwood gray-beige, soft weathered look"),
  make("golden-oak", "Golden Oak", "Light", "light golden honey blonde, warm classic oak"),
  make("fruitwood", "Fruitwood", "Light", "light warm tan with soft amber undertone"),
  make("golden-pecan", "Golden Pecan", "Light", "warm light caramel honey tone"),
  make("colonial-maple", "Colonial Maple", "Light", "warm light maple tan, soft golden brown"),
  make("early-american", "Early American", "Light", "warm light-medium brown with slight orange undertone"),

  // Medium
  make("nutmeg", "Nutmeg", "Medium", "warm medium brown with subtle red undertone"),
  make("provincial", "Provincial", "Medium", "neutral medium brown, classic traditional tone"),
  make("special-walnut", "Special Walnut", "Medium", "warm medium walnut brown"),
  make("golden-brown", "Golden Brown", "Medium", "rich warm medium brown with golden undertone"),
  make("medium-brown", "Medium Brown", "Medium", "balanced neutral medium brown"),
  make("spice-brown", "Spice Brown", "Medium", "warm cinnamon medium brown with red hint"),
  make("english-chestnut", "English Chestnut", "Medium", "warm chestnut brown with reddish undertone"),
  make("chestnut", "Chestnut", "Medium", "rich medium chestnut brown"),
  make("gunstock", "Gunstock", "Medium", "warm brown with reddish amber undertone, classic gunstock"),
  make("antique-brown", "Antique Brown", "Medium", "deep warm antique medium-dark brown"),
  make("heritage-brown", "Heritage Brown", "Medium", "rich warm medium-dark brown"),
  make("aged-barrel", "Aged Barrel", "Medium", "rich whiskey-barrel brown with warm depth"),

  // Dark
  make("coffee-brown", "Coffee Brown", "Dark", "deep coffee brown, rich and warm"),
  make("dark-walnut", "Dark Walnut", "Dark", "deep dark walnut brown, classic dark floor"),
  make("espresso", "Espresso", "Dark", "very dark espresso brown, near black"),
  make("jacobean", "Jacobean", "Dark", "very dark cool brown with slight gray undertone"),
  make("ebony", "Ebony", "Dark", "near-black very dark brown, grain still visible"),
  make("true-black", "True Black", "Dark", "true black opaque finish, modern bold look"),

  // Red / Mahogany
  make("cherry", "Cherry", "Red", "warm cherry red-brown tone"),
  make("sedona-red", "Sedona Red", "Red", "deep warm red-brown, southwestern tone"),
  make("red-mahogany", "Red Mahogany", "Red", "deep red mahogany with strong red pigment"),
  make("royal-mahogany", "Royal Mahogany", "Red", "deep rich mahogany with luxurious red depth"),
  make("rosewood", "Rosewood", "Red", "dark rosewood with reddish-purple undertone"),

  // Gray
  make("classic-gray", "Classic Gray", "Gray", "cool neutral gray, balanced modern tone"),
  make("warm-gray", "Warm Gray", "Gray", "warm greige with taupe undertone"),
  make("silvered-gray", "Silvered Gray", "Gray", "light silvery driftwood gray"),
  make("dark-gray", "Dark Gray", "Gray", "deep charcoal gray, modern industrial tone"),
];
