# Universal Measurement Engine & Global Unit Library

## 1. Overview

Products across industries possess physical dimensions and volumetric specifications that must be normalized, validated, and converted for shipping, filtering, and storefront display.

The **Universal Measurement Engine** replaces hardcoded string inputs (e.g. `"500ml"`, `"1.5kg"`) with structured entities:
```text
Measurement Attribute = {
  magnitude: 500,
  unit: "ml",
  family: "volume"
}
```

---

## 2. Measurement Families (Types)

Units are strictly partitioned into standard physical and commercial families:

1. **Weight**: `mg`, `g` (Base), `kg`, `oz`, `lb`
2. **Volume**: `ml` (Base), `L`, `fl oz`, `gal`
3. **Length**: `mm` (Base), `cm`, `m`, `in`, `ft`
4. **Area**: `sq m` (Base), `sq ft`, `sq cm`
5. **Quantity**: `pcs` (Base), `pack`, `box`, `set`, `pair`, `doz`
6. **Temperature**: `°C` (Base), `°F`, `K`
7. **Time**: `sec` (Base), `min`, `hr`, `day`, `week`, `mo`, `yr`

---

## 3. Offset-Aware Conversion Architecture

Conversion calculations support both **multiplicative factors** and **additive offsets**:

$$\text{Base Value} = (\text{Input Value} \times \text{conversion\_factor}) + \text{conversion\_offset}$$

$$\text{Target Value} = \frac{\text{Base Value} - \text{target\_offset}}{\text{target\_factor}}$$

### Example: Weight Conversion
- Converting `2.5 kg` to `g`:
  - $\text{Base} = 2.5 \times 1000.0 = 2500\text{ g}$
- Converting `2500 g` to `lb`:
  - $\text{Target} = 2500 / 453.59237 = 5.511556\text{ lb}$

### Example: Temperature Conversion with Offsets
- Converting `68 °F` to `°C`:
  - Fahrenheit conversion to Celsius: $\text{factor} = 0.55555556$, $\text{offset} = -17.777778$
  - $\text{Base} = (68 \times 0.55555556) - 17.777778 = 20.0\text{ °C}$

---

## 4. Incompatible Unit Prevention

The engine enforces family compatibility:
- An attribute configured with family `Weight` can **only** accept units from the Weight family (`mg`, `g`, `kg`, `oz`, `lb`).
- Attempting to assign `ml` to a `Weight` attribute or convert `5 kg` into `Liters` is rejected by the validation engine.

---

## 5. Commercial Quantity Units

Commercial packaging units (e.g. `pack`, `box`, `set`, `case`) are flagged with `is_convertible: false`. 

Universal conversion is invalid because a "box" of pencils (12 units) does not equate to a "box" of tiles (50 units). Product-specific conversion rules will be introduced in future inventory packaging modules.
