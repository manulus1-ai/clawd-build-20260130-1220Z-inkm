# InkMatch — Fountain Pen Ink Vibe + Swatch Card

A tiny static, local-first tool for fountain-pen people:
- Build an "ink vibe" profile (sheen/shading/shimmer/water resistance, flow, dry time, maintenance)
- Generates a **shareable permalink** (state encoded in URL)
- Generates a **downloadable PNG swatch card**
- Works offline (service worker)

## Research notes / niche pain points baked into UI

Fountain-pen ink discussions obsess over:
- **Sheen vs smear** (especially on Tomoe River)
- **Shading visibility** (nib size + paper matters)
- **Shimmer maintenance** (clogs if neglected)
- **Water resistance / iron gall** tradeoffs (archival-ish vs corrosion/maintenance)
- **Wet vs dry** ink/pen pairing (taming a wet pen, or making a dry pen feel smooth)

### Sources consulted
- Mountain of Ink: ink properties (flow, dry time, shading, sheen, shimmer, pigment, iron gall) + sheen categorization
  - https://mountainofink.com/blog/ink-properties
  - https://mountainofink.com/blog/sheen-sheen-sheen
- Wikipedia: historical / technical grounding
  - https://en.wikipedia.org/wiki/Iron_gall_ink
  - https://en.wikipedia.org/wiki/Fountain_pen_ink

## Deploy
GitHub Pages workflow deploys repository root.
