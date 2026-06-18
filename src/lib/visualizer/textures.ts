// Lightweight SVG-based wood/plank patterns rendered as data URIs.
// Zero external assets, zero network calls, instant load on mobile.

export type FloorTexture = {
  id: string;
  name: string;
  category: "Oak" | "Walnut" | "Maple" | "Gray" | "Herringbone";
  // base tile size in CSS pixels (controls plank scale before user adjustment)
  baseSize: number;
  // background-image url(...)
  url: string;
  // small swatch (square) shown in the carousel
  swatch: string;
};

function plank(opts: {
  base: string;
  stripe: string;
  grain: string;
  edge: string;
  w?: number;
  h?: number;
}) {
  const w = opts.w ?? 240;
  const h = opts.h ?? 60;
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='${opts.base}'/>
      <stop offset='1' stop-color='${opts.stripe}'/>
    </linearGradient>
    <pattern id='grain' x='0' y='0' width='4' height='${h}' patternUnits='userSpaceOnUse'>
      <rect width='4' height='${h}' fill='url(#g)'/>
      <path d='M0 ${h * 0.2} Q ${w / 2} ${h * 0.35} ${w} ${h * 0.25}' stroke='${opts.grain}' stroke-width='0.4' fill='none' opacity='0.35'/>
      <path d='M0 ${h * 0.55} Q ${w / 2} ${h * 0.7} ${w} ${h * 0.6}' stroke='${opts.grain}' stroke-width='0.5' fill='none' opacity='0.3'/>
      <path d='M0 ${h * 0.85} Q ${w / 2} ${h * 0.78} ${w} ${h * 0.88}' stroke='${opts.grain}' stroke-width='0.3' fill='none' opacity='0.4'/>
    </pattern>
  </defs>
  <rect width='${w}' height='${h}' fill='url(#grain)'/>
  <line x1='0' y1='0' x2='${w}' y2='0' stroke='${opts.edge}' stroke-width='1.5' opacity='0.55'/>
  <line x1='0' y1='${h}' x2='${w}' y2='${h}' stroke='${opts.edge}' stroke-width='1.5' opacity='0.55'/>
  <line x1='${w * 0.45}' y1='0' x2='${w * 0.45}' y2='${h}' stroke='${opts.edge}' stroke-width='1' opacity='0.5'/>
</svg>`.trim();
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function herringbone(base: string, stripe: string, grain: string, edge: string) {
  const s = 80;
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${base}'/>
      <stop offset='1' stop-color='${stripe}'/>
    </linearGradient>
  </defs>
  <rect width='${s}' height='${s}' fill='${base}'/>
  <g stroke='${edge}' stroke-width='0.8'>
    <rect x='0' y='0' width='40' height='20' fill='url(#g)' transform='rotate(45 20 10)'/>
    <rect x='40' y='0' width='40' height='20' fill='url(#g)' transform='rotate(-45 60 10)'/>
    <rect x='0' y='40' width='40' height='20' fill='url(#g)' transform='rotate(-45 20 50)'/>
    <rect x='40' y='40' width='40' height='20' fill='url(#g)' transform='rotate(45 60 50)'/>
  </g>
  <path d='M0 10 H80 M0 50 H80' stroke='${grain}' stroke-width='0.3' opacity='0.4'/>
</svg>`.trim();
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export const TEXTURES: FloorTexture[] = [
  {
    id: "natural-oak",
    name: "Natural Oak",
    category: "Oak",
    baseSize: 180,
    url: plank({ base: "#d4a574", stripe: "#b8895a", grain: "#6b4a2b", edge: "#4a3220" }),
    swatch: plank({ base: "#d4a574", stripe: "#b8895a", grain: "#6b4a2b", edge: "#4a3220", w: 80, h: 80 }),
  },
  {
    id: "honey-oak",
    name: "Honey Oak",
    category: "Oak",
    baseSize: 180,
    url: plank({ base: "#e0b07a", stripe: "#c08a52", grain: "#7a4f28", edge: "#523822" }),
    swatch: plank({ base: "#e0b07a", stripe: "#c08a52", grain: "#7a4f28", edge: "#523822", w: 80, h: 80 }),
  },
  {
    id: "golden-oak",
    name: "Golden Oak",
    category: "Oak",
    baseSize: 180,
    url: plank({ base: "#caa066", stripe: "#a87a3e", grain: "#6b4520", edge: "#3f2a16" }),
    swatch: plank({ base: "#caa066", stripe: "#a87a3e", grain: "#6b4520", edge: "#3f2a16", w: 80, h: 80 }),
  },
  {
    id: "dark-walnut",
    name: "Dark Walnut",
    category: "Walnut",
    baseSize: 180,
    url: plank({ base: "#6b4423", stripe: "#4a2e16", grain: "#2a1a0a", edge: "#1a0f06" }),
    swatch: plank({ base: "#6b4423", stripe: "#4a2e16", grain: "#2a1a0a", edge: "#1a0f06", w: 80, h: 80 }),
  },
  {
    id: "espresso",
    name: "Espresso",
    category: "Walnut",
    baseSize: 180,
    url: plank({ base: "#4a2f1c", stripe: "#2f1c0f", grain: "#1a0e06", edge: "#0d0703" }),
    swatch: plank({ base: "#4a2f1c", stripe: "#2f1c0f", grain: "#1a0e06", edge: "#0d0703", w: 80, h: 80 }),
  },
  {
    id: "warm-maple",
    name: "Warm Maple",
    category: "Maple",
    baseSize: 180,
    url: plank({ base: "#e8c89a", stripe: "#d0a878", grain: "#8a6a44", edge: "#5e4630" }),
    swatch: plank({ base: "#e8c89a", stripe: "#d0a878", grain: "#8a6a44", edge: "#5e4630", w: 80, h: 80 }),
  },
  {
    id: "blonde-maple",
    name: "Blonde Maple",
    category: "Maple",
    baseSize: 180,
    url: plank({ base: "#f0d8b0", stripe: "#dabf8e", grain: "#9a7a52", edge: "#6e5436" }),
    swatch: plank({ base: "#f0d8b0", stripe: "#dabf8e", grain: "#9a7a52", edge: "#6e5436", w: 80, h: 80 }),
  },
  {
    id: "weathered-gray",
    name: "Weathered Gray",
    category: "Gray",
    baseSize: 180,
    url: plank({ base: "#b0aea8", stripe: "#8a8882", grain: "#5a5854", edge: "#3a3835" }),
    swatch: plank({ base: "#b0aea8", stripe: "#8a8882", grain: "#5a5854", edge: "#3a3835", w: 80, h: 80 }),
  },
  {
    id: "smoke-gray",
    name: "Smoke Gray",
    category: "Gray",
    baseSize: 180,
    url: plank({ base: "#6e6c68", stripe: "#4d4b48", grain: "#2c2b29", edge: "#1a1918" }),
    swatch: plank({ base: "#6e6c68", stripe: "#4d4b48", grain: "#2c2b29", edge: "#1a1918", w: 80, h: 80 }),
  },
  {
    id: "herringbone-oak",
    name: "Herringbone Oak",
    category: "Herringbone",
    baseSize: 140,
    url: herringbone("#c89866", "#a07642", "#5a3a1c", "#3a2410"),
    swatch: herringbone("#c89866", "#a07642", "#5a3a1c", "#3a2410"),
  },
];
