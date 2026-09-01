# Universal Admin Panel — UI Guidelines & Design System

## 1. Design Philosophy

The interface is engineered to feel like a high-performance, professional commerce operating system.

### Principles:
1. **Clarity Over Clutter**: Clean white and neutral surfaces (`#f8f9fc` background, soft `border-slate-200`).
2. **Progressive Disclosure**: Break complex configurations into natural sequential steps rather than overwhelming users with massive technical forms.
3. **Mental Model Reinforcement**: Visually separate **Attribute Type** (e.g. `Choice`, `Color Swatch`, `Measurement`) from **Used For / Capabilities** (`[ Product Info ]`, `[ Variant Option ]`, `[ Filter ]`, `[ Search ]`).
4. **Answer "What do I do next?"**: Clear primary action buttons, live previews, and friendly language.

---

## 2. Progressive Attribute Creation Flow

When creating or editing an attribute:
- **Section 1: Basic Information**: Name, Storefront Label, Description, Staff Help, auto-generated Internal Key.
- **Section 2: Value Type Selection**: Visual card selector with icons for Text, Number, Select, Multi-Select, Color, Measurement, Boolean, Date.
- **Section 3: Type Configuration & Presets**: Dynamic form reflecting the selected type (swatch picker for Color, unit selector for Measurement, drag-and-drop ordering for Select).
- **Section 4: Capabilities**: 4 independent switches with human-friendly descriptions.
- **Section 5: Advanced Settings**: Collapsed by default (Machine slug override, validation rules).
- **Live Interactive Preview**: Real-time interactive simulation showing how the attribute will render in product data entry.

---

## 3. Visual Separation on Attribute Cards

Every card in the Global Attribute Library clearly separates:

```text
+-------------------------------------------------------------+
| 🎨 Color (color)                                    Active  |
| Storefront Label: Color                                     |
| Visual color shade and swatch picker...                     |
+-------------------------------------------------------------+
| ATTRIBUTE TYPE                                              |
| [ Color Swatch ]                                            |
|                                                             |
| USED FOR (CAPABILITIES)                                     |
| [ Product Info ] [ Variant Option ] [ Filterable ] [ Search ]|
+-------------------------------------------------------------+
| PRESET VALUES (6)                                           |
| ● Navy Blue  ● Dusty Rose  ○ Cloud White  ● Sage Green      |
+-------------------------------------------------------------+
| Used in 0 categories • Used by 0 products    Edit • Archive |
+-------------------------------------------------------------+
```

---

## 4. Accessibility & Responsiveness

- **Keyboard Navigation**: Focus visible rings (`focus:ring-2 focus:ring-indigo-500`), ESC key handler on modals/drawers.
- **Contrast**: High contrast text hierarchy (WCAG AAA compliant text on background).
- **Responsive Layout**:
  - **Desktop (1024px+)**: Fixed left navigation sidebar, multi-column grid.
  - **Tablet (768px - 1023px)**: Adaptive 2-column layout.
  - **Mobile (<768px)**: Collapsible slide-over drawer, full-width touch controls.
