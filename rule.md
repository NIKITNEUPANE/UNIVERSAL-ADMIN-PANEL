# Universal Commerce OS — Design System & Architecture Rules

## System Name: Liquid Glassmorphism & Bento Modular System
*(Also referred to as **Refractive Glass** or **Apple VisionOS / macOS Studio Glass**)*

Every interface, portal, modal, and component created in this project **MUST** strictly follow the design specifications and structural rules defined below.

---

## 🎨 1. Core Aesthetic: Liquid Glassmorphism

Unlike flat 2D designs or older legacy glassmorphism, **Liquid Glassmorphism** mimics physical sheets of precision-cut frosted glass floating over a luminous light field:

### Key Visual Tokens:
1. **Translucent Layering:**
   - **Scrolling Cards:** Use high-alpha specular gradients (`rgba(255, 255, 255, 0.82 – 0.92)`) without expensive scrolling `backdrop-filter` to guarantee 120fps zero-flicker scrolling.
   - **Fixed Overlays (Header, Sidebar, Modals):** Use `backdrop-filter: blur(12px – 16px)` on fixed, non-scrolling UI layers.
   - Standard utilities: `.liquid-glass-card`, `.liquid-glass-subcard`, `.liquid-glass-header`.
2. **Specular Hairline Highlights:**
   - A crisp 1px bright top edge (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.95 – 1.0)`) simulates real light bouncing off the beveled corner of glass.
3. **Ambient Refraction:**
   - Multi-colored soft light orbs (`.liquid-ambient-canvas`) beneath the surface provide depth and warmth rather than a dead/flat gray appearance.
4. **Border Framing:**
   - Thin 1px luminous border (`border: 1px solid rgba(255, 255, 255, 0.95)` and `border-top: 1px solid #ffffff`).

---

## 🍱 2. Layout Structure: Bento Modular System

Inspired by Japanese Bento boxes and modern developer tools (e.g. Apple Keynotes, Linear.app, Stripe, Raycast):

### Structural Rules:
1. **Segmented Compartments:**
   - Group information into self-contained frosted modules (e.g., *Identity & Taxonomy*, *Pricing & Inventory*, *Specifications & Specs*, *Media Gallery*).
2. **Never Use Nested Box Syndrome:**
   - Avoid "card-inside-a-card-inside-a-card". Use clean dividers (`divide-white/60`), subtle zebra hover rows, or tree indentation lines (`↳`) rather than putting heavy gray boxes inside frosted cards.
3. **High Information Hierarchy:**
   - Use uppercase micro-headers (`text-[10px] font-bold uppercase tracking-wider text-slate-500` e.g., `🏷️ IDENTITY & TAXONOMY`).
   - Hairline separators (`border-t border-white/60` or `border-slate-100`).
   - Balanced responsive grid (e.g., 2-column or 3-column bento tiles) to keep screens readable and uncluttered.

---

## ⚡ 3. Interaction Style: Linear-Style Studio Density

### Interaction Standards:
1. **Zero Bloat / Distraction-Free:**
   - Standard input and button heights: **36px – 40px** (`h-9` or `h-10`).
   - Clean, compact label typography (`text-xs font-semibold text-slate-700`).
2. **Form Controls:**
   - Use `.liquid-glass-input` for all text inputs, textareas, and select menus.
   - Smooth focus ring with soft indigo glow (`focus:ring-2 focus:ring-indigo-500/20`).
3. **Buttons & Actions:**
   - **Primary Actions:** `.liquid-button-primary` (Gradient indigo/violet with top specular highlight and soft colored shadow).
   - **Secondary / Ghost Actions:** `.liquid-button-glass` or subtle ghost buttons (`hover:bg-white/80 hover:text-indigo-600 rounded-xl`).
4. **Micro-Pills & Interactive Badges:**
   - Status indicators use pulsing colored dots (`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`).
   - Attribute & Spec tags use compact pill badges with clear `REQ` or `Optional` markers.
5. **Stat Chips:**
   - Content-sized compact liquid glass capsules (`.liquid-glass-subcard px-3.5 py-1.5 rounded-2xl`). Never create giant empty square statistic blocks.

---

## 🛠️ 4. Mandatory Checklist When Creating a New Portal

Before delivering any new page, module, or portal (e.g. Inventory, Orders, Customers, Media, Settings), verify:

- [ ] **Ambient Canvas:** The root layout includes `<div className="liquid-ambient-canvas" />`.
- [ ] **No Flat White Cards:** Replaced `bg-white border-slate-200` with `.liquid-glass-card` or `.liquid-glass-interactive`.
- [ ] **Streamlined Filter Bar:** Fast search + relevant dropdown + minimal controls (no redundant filter duplicates).
- [ ] **Compact Stat Chips:** Glass chips in the sub-header summarizing key counts with colored status dots.
- [ ] **Buttons & Inputs:** Use `.liquid-button-primary`, `.liquid-button-glass`, and `.liquid-glass-input`.
- [ ] **Responsive Max-Width:** Layouts are wrapped in `max-w-7xl mx-auto` to prevent excessive horizontal stretching on ultra-wide screens.
- [ ] **Non-Technical Merchant Language:** Follow `docs/ui-principles.md` (e.g. *Product Options & Details* instead of *EAV Schema*).
