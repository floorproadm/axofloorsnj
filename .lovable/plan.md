

# Create AXO Floors /links Page (Linktree-style)

## Overview
Replicate the Kings OS `/links` page for AXO Floors — a mobile-first, Linktree-style page with hero image, animated links, and social icons. Adapted with AXO branding (navy/gold), content, and phone number.

## Implementation

### 1. Create `src/pages/Links.tsx`
Same structure as Kings OS version, adapted for AXO:

- **Hero**: Use `axo-work-photo.jpg` as a static image (no video). Full-width with gradient blend into background.
- **Brand overlay**: "AXO Floors" heading + "Premium Hardwood Flooring in NJ, NY & PA" subtitle.
- **Links** (with gold/navy styling):
  - "Get Your Free Estimate" → `/contact` (primary, Calendar icon)
  - "Call Us — (732) 351-8653" → `tel:+17323518653` (primary, Phone icon)
  - "Our Services" → `/hardwood-flooring` (Wrench icon)
  - "See Our Work" → `/gallery` (Images icon)
  - "Stain Gallery" → `/stain-gallery` (Palette icon)
  - "Floor Diagnostic Quiz" → `/floor-diagnostic` (ClipboardCheck icon)
  - "Google Reviews" → Google reviews link (Star icon, external)
  - "Referral Program" → `/referral-program` (Gift icon)
- **Social icons**: Instagram, Facebook (using AXO's actual social URLs)
- **Footer**: "© 2026 AXO Floors"
- **Animations**: Framer Motion stagger (same as Kings OS)

### 2. Add route in `src/App.tsx`
Add `<Route path="/links" element={<Links />} />` to the public routes.

### Technical Notes
- Uses existing `framer-motion` dependency
- No Header/Footer wrappers (standalone page like Kings OS)
- Responsive: `max-w-lg` hero, `max-w-sm` links
- AXO design tokens: gold gradients, navy text via Tailwind classes

### Files
| Action | File |
|---|---|
| Create | `src/pages/Links.tsx` |
| Edit | `src/App.tsx` (add route) |

