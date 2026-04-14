# Design System: Pantry Guardian (The Fresh Curator)
**Project ID:** 12959393908862480215

## 1. Visual Theme & Atmosphere
**Creative North Star: "The Kitchen Aesthetic"**
Pantry Guardian is a high-end editorial kitchen assistant. The atmosphere is **Vibrant**, **Organic**, and **Authoritative**. It feels like a premium lifestyle magazine for home cooks.

## 2. Color Palette & Roles
- **Primary Freshness (Lush Green - #2E7D32)**: Main brand color, used for success states and primary CTAs.
- **Organic Base (Earthy Ivory - #FAFAF5)**: Background and surface colors to keep the UI warm and breathable.
- **Alert/Expiry (Warm Amber - #FFA000)**: Used for items nearing expiration or critical warnings.
- **Text (Deep Charcoal - #2C2C2C)**: High-contrast typography for maximum legibility.

## 3. Typography Rules
- **Headline (Noto Serif)**: Used for all major titles and section headers to convey editorial prestige.
- **Body (Manrope)**: A clean, geometric sans-serif for secondary text, metadata, and interactive elements.

## 4. Component Stylings
- **Buttons**: Rounded (12px) corners. Primary buttons use the Lush Green gradient. Tertiary buttons use a text-underline style.
- **Cards (Containers)**: Soft shadows (50px blur, 5% opacity) with a 12px corner radius. No borders; use background shifts instead.

## 5. Layout Principles
- **Editorial Grids**: Intentional white space (Spacing scale 12/16/24) to let the food visuals lead the eye.
- **Responsive Symmetry**: Centered hero on mobile, editorial offset on desktop.

## 6. Design System Notes for Stitch Generation
When generating screens, ALWAYS use:
- `Noto Serif` for headings.
- `Manrope` for body text.
- `rounded-2xl` (12px) for cards and buttons.
- `Primary Green (#2E7D32)` and `Warm Amber (#FFA000)` as the only accent colors.
- `bg-[#FAFAF5]` for the main page background.
