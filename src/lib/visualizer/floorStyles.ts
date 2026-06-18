// Curated catalog of wood floor styles for the AI visualizer.
// Each style has a swatch (used in the picker) and a prompt fed to the image model.

import naturalWhiteOak from "@/assets/visualizer/natural-white-oak.jpg";
import classicRedOak from "@/assets/visualizer/classic-red-oak.jpg";
import gunstockOak from "@/assets/visualizer/gunstock-oak.jpg";
import darkWalnut from "@/assets/visualizer/dark-walnut.jpg";
import ebony from "@/assets/visualizer/ebony.jpg";
import herringboneOak from "@/assets/visualizer/herringbone-oak.jpg";
import wideEuropean from "@/assets/visualizer/wide-european.jpg";
import grayWashed from "@/assets/visualizer/gray-washed.jpg";

export interface FloorStyle {
  id: string;
  name: string;
  category: "Light" | "Medium" | "Dark" | "Pattern";
  swatch: string;
  prompt: string;
}

export const FLOOR_STYLES: FloorStyle[] = [
  {
    id: "natural-white-oak",
    name: "Natural White Oak",
    category: "Light",
    swatch: naturalWhiteOak,
    prompt:
      "Wide-plank natural white oak hardwood, matte finish, soft golden-blonde tone, visible straight grain, realistic plank seams roughly 6 inches wide, no stain",
  },
  {
    id: "classic-red-oak",
    name: "Classic Red Oak",
    category: "Medium",
    swatch: classicRedOak,
    prompt:
      "Traditional red oak hardwood, warm honey-amber tone, satin finish, prominent open grain, 3.25 inch strip planks, classic American look",
  },
  {
    id: "gunstock-oak",
    name: "Gunstock Oak",
    category: "Medium",
    swatch: gunstockOak,
    prompt:
      "Oak hardwood with gunstock stain — rich warm brown with reddish undertones, satin finish, visible grain, 3 to 4 inch planks",
  },
  {
    id: "dark-walnut",
    name: "Dark Walnut",
    category: "Dark",
    swatch: darkWalnut,
    prompt:
      "American walnut hardwood, deep chocolate brown with subtle purple-gray undertones, satin finish, smooth flowing grain, wide 5 inch planks",
  },
  {
    id: "ebony",
    name: "Ebony",
    category: "Dark",
    swatch: ebony,
    prompt:
      "White oak stained ebony, almost-black very dark brown, low-sheen matte finish, subtle grain showing through, modern 5 inch planks",
  },
  {
    id: "gray-washed",
    name: "Gray Wash Oak",
    category: "Light",
    swatch: grayWashed,
    prompt:
      "European white oak with gray driftwood wash, cool weathered gray-beige tone, matte finish, wide 7 inch planks, contemporary Scandinavian look",
  },
  {
    id: "wide-european",
    name: "Wide European Oak",
    category: "Medium",
    swatch: wideEuropean,
    prompt:
      "Wide-plank European white oak, soft warm taupe tone, light brushing showing texture, matte oil finish, extra-wide 9 inch planks, high-end residential look",
  },
  {
    id: "herringbone-oak",
    name: "Herringbone Oak",
    category: "Pattern",
    swatch: herringboneOak,
    prompt:
      "Natural white oak hardwood installed in a classic herringbone pattern, warm honey tone, satin finish, individual planks roughly 4 by 18 inches, sharp 90 degree pattern",
  },
];
