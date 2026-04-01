# ProofPay Design System

**Aesthetic:** Terminal Luxe — Bloomberg precision + Swiss vault trust
**Read this file before writing or editing ANY component.**

## Spacing: 8px grid
4px (xs) · 8px (sm) · 12px (md) · 16px (lg) · 24px (xl) · 32px (2xl) · 48px (3xl) · 64px (4xl)

## Typography
- Headings: Outfit 500/600/700 — geometric, modern, not overused
- Body: Inter 400/500/600 — institutional standard, legible at small sizes
- Mono: JetBrains Mono 400/500 — all hashes, addresses, UIDs, amounts
- Scale: 11 · 12 · 13 · 14 · 16 · 20 · 24 · 32 · 40px

### Hierarchy
| Level | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| H1 page | Outfit | 32px | 700 | Page headers |
| H2 section | Outfit | 20px | 600 | Card titles |
| H3 sub | Inter | 16px | 600 | Table headers, labels |
| Body | Inter | 14px | 400 | Content |
| Small | Inter | 12px | 400 | Timestamps, meta |
| Caption | Inter | 11px | 500 | Uppercase tracking labels |
| Amount hero | JetBrains Mono | 36px | 700 | Price display |
| Amount table | JetBrains Mono | 14px | 600 | Table amounts |
| Hash | JetBrains Mono | 13px | 400 | Addresses, UIDs |
| Code | JetBrains Mono | 12px | 400 | Raw data, JSON |

## Color Tokens
| Token | Hex | Use |
|-------|-----|-----|
| pp-bg | #0B0F14 | Page background (slightly darker than GitHub dark) |
| pp-surface | #141920 | Cards, panels |
| pp-raised | #1A2029 | Hover states, elevated surfaces |
| pp-border | #2A3040 | Primary borders |
| pp-border-sub | #1E2530 | Subtle inner dividers |
| pp-text | #E2E8F0 | Primary text |
| pp-secondary | #8892A2 | Labels, metadata |
| pp-tertiary | #5A6478 | Timestamps, disabled |
| pp-blue | #2B6CB0 | Primary actions |
| pp-blue-hover | #3B82C8 | Hover state |
| pp-blue-sub | #162A4A | Primary bg tint |
| pp-teal | #319795 | SACRED — attestations/proofs ONLY |
| pp-teal-glow | #2DD4BF | Glow/pulse on proof moments |
| pp-teal-sub | #0F2B2A | Attestation bg tint |
| pp-green | #34D399 | Confirmed, paid, success |
| pp-green-sub | #0A2E1F | Success bg tint |
| pp-orange | #F59E0B | Pending, warnings |
| pp-orange-sub | #2A1A05 | Warning bg tint |
| pp-red | #EF4444 | Error, revoked |
| pp-red-sub | #2A0A0A | Error bg tint |
| pp-amount | #5EEAD4 | Monetary amounts (teal-tinted green) |

**Blue-tinted neutrals rule:** Every gray is shifted toward blue. No pure grays anywhere.
- Bad: #1a1a1a, #666, #999, #ccc
- Good: #141920, #5A6478, #8892A2, #E2E8F0

## Depth Strategy
| Level | Class | Use |
|-------|-------|-----|
| 0 | bg-pp-bg | Page |
| 1 | bg-pp-surface | Cards, sidebar |
| 2 | bg-pp-raised | Hover, dropdowns |
| 3 | bg-pp-raised + ring-1 ring-pp-border | Floating, popovers |

## Motion
- Easing: cubic-bezier(0.16, 1, 0.3, 1) — smooth decelerate
- Duration: 150ms (micro), 300ms (standard), 600ms (emphasis)
- Stagger: 60ms between cascade items
- Spring: { stiffness: 260, damping: 28 } for scale/position
- Price countup: 800ms with easeOut
- Attestation materialize: 1.2s with glow fade

### Motion Rules
1. Oracle feeds SLIDE IN from left (data arriving)
2. Matched conditions FLASH teal briefly then settle
3. Price number COUNTS from base to final (tabular-nums)
4. Attestation card MATERIALIZES with teal border glow
5. Page transitions: fade + 6px Y shift (subtle, trustworthy)
6. NEVER bounce. NEVER spin. NEVER wiggle. This is institutional.

## Taste Dials
- VISUAL_DENSITY: 8/10 (high — payment dashboard = data-dense, Etherscan-level)
- MOTION_INTENSITY: 3/10 (low-medium — smooth, controlled, trust-building)
- DESIGN_VARIANCE: 4/10 (low-medium — professional, not experimental)

## Component Patterns

### Card
```
bg-pp-surface border border-pp-border rounded-xl
```
Never: rounded-full on cards, drop shadows, gradient borders

### Status Badge
```
Confirmed: bg-pp-green-sub text-pp-green border border-pp-green/20
Pending:   bg-pp-orange-sub text-pp-orange border border-pp-orange/20
Attested:  bg-pp-teal-sub text-pp-teal border border-pp-teal/20
Error:     bg-pp-red-sub text-pp-red border border-pp-red/20
All: text-xs font-medium px-2.5 py-1 rounded-md
```

### Button (Primary)
```
bg-pp-blue hover:bg-pp-blue-hover text-white font-semibold text-sm
px-5 py-2.5 rounded-lg transition-all duration-150
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-blue/50
disabled:opacity-40 disabled:cursor-not-allowed
```

### Button (Ghost)
```
bg-transparent hover:bg-pp-raised text-pp-secondary hover:text-pp-text
border border-pp-border text-sm font-medium px-4 py-2 rounded-lg transition-all
```

### Hash Display
```
font-mono text-[13px] text-pp-secondary tracking-tight
```
Truncation: `0x1a2b…ef89` (6+4). Full on detail pages. Copy icon on hover.

### Table
```
Header: bg-pp-raised/50 text-pp-tertiary text-[11px] font-medium uppercase tracking-wider px-4 py-3
Row: hover:bg-pp-raised/40 transition-colors border-b border-pp-border-sub
Cell: px-4 py-3 text-sm
```

### Attestation Proof Block (The Signature Moment)
```
bg-pp-teal-sub/20 border border-pp-teal/30 rounded-xl p-5
```
On creation: 1.2s materialize animation with teal glow → settle

### Oracle Ribbon
```
h-8 relative overflow-hidden rounded-md bg-gradient-to-r from-transparent to-pp-surface
```
Right edge: 6px teal dot with soft pulse glow. Signals "live data."

### Ambient Background
```css
body {
  background-color: #0B0F14;
  background-image: radial-gradient(ellipse at 50% -10%, rgba(43, 108, 176, 0.04) 0%, transparent 50%);
}
```

## Anti-Patterns (NEVER)
- Pure gray (#666, #999, #1a1a1a) — always blue-tinted
- Purple gradients — crypto consumer cliche
- Bouncing/spinning animations on data
- rounded-full on cards or buttons (only badges)
- Inter for headings — use Outfit
- Teal on anything that isn't a proof/attestation
- White background surfaces
- Drop shadows on dark mode (use border + bg layering)
- Generic skeleton loaders (use the actual layout shape)
