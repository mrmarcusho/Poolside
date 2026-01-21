# Create Event Flow - Style Guide

This document defines the design system for the Create Event flow, based on the "When is your event happening?" slide.

---

## Overview

The Create Event flow uses a **dark, immersive aesthetic** with subtle glows, frosted glass effects, and a signature pink-white-blue gradient accent. Each slide should feel premium, minimal, and easy to use.

---

## Screen Layout

### Background
- Use `feed-background.png` as the full-screen background
- The background has subtle colored glows (amber top-left, teal top-right, purple bottom-left)
- This creates depth and visual interest without being distracting

### Header Structure
Each slide follows this header pattern:

```
Step X of 5                    <- Subtle step indicator
[Main Question]                <- Large, bold text
[Accent Word]?                 <- Gradient-colored word
```

**Styles:**
- Step text: `fontSize: 14`, `color: rgba(255, 255, 255, 0.4)`
- Main text: `fontFamily: 'Syne_700Bold'`, `fontSize: 32`, `color: #fff`, `lineHeight: 40`
- Accent word: `color: #a78bfa` (purple) - can vary per slide

### Progress Dots
- Centered at top of screen, inline with back button
- 5 dots representing each slide
- Active dot: purple gradient with glow
- Completed dot: solid purple
- Inactive dot: `rgba(255, 255, 255, 0.15)`

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background Dark | `#0a0a0f` | Base background |
| White | `#fff` | Primary text, borders |
| Purple Accent | `#a78bfa` | Accent text, active states |
| Light Purple | `#c4b5fd` | Secondary accent |

### Gradient Colors (Pink-White-Blue)
Used for primary CTA buttons:
```javascript
colors={['#c084fc', '#e9d5ff', '#f5f3ff', '#ddd6fe', '#93c5fd', '#60a5fa']}
start={{ x: 0, y: 0.5 }}
end={{ x: 1, y: 0.5 }}
```

### Transparency Values
| Opacity | Usage |
|---------|-------|
| `0.4` | Subtle text, disabled states |
| `0.25` | Button backgrounds |
| `0.15` | Borders, subtle elements |
| `0.1` | Very subtle backgrounds |

---

## Typography

### Font Families
- **Headers/Titles:** `Syne_700Bold`
- **Body Text:** System default or `Outfit`
- **Monospace (time/numbers):** `SpaceMono_700Bold`

### Text Styles

**Slide Question (Main)**
```javascript
{
  fontFamily: 'Syne_700Bold',
  fontSize: 32,
  fontWeight: '600',
  color: '#fff',
  lineHeight: 40,
}
```

**Step Indicator**
```javascript
{
  fontSize: 14,
  fontWeight: '400',
  color: 'rgba(255, 255, 255, 0.4)',
}
```

**Large Display Text (e.g., Date)**
```javascript
{
  fontSize: 80,
  fontWeight: '200',
  color: '#fff',
  letterSpacing: -3,
}
```

**Secondary Display (e.g., Time)**
```javascript
{
  fontFamily: 'SpaceMono_700Bold',
  fontSize: 20,
  letterSpacing: 4,
  color: '#a78bfa',
}
```

---

## Interactive Elements

### Toggle/Pill Button (e.g., "Starting right now")

**Inactive State:**
```javascript
{
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.06)', // via LinearGradient
}
```

**Active State:**
```javascript
{
  borderColor: 'rgba(167, 139, 250, 0.5)',
  shadowColor: '#8b5cf6',
  shadowOpacity: 0.4,
  shadowRadius: 20,
  // Purple gradient background via LinearGradient
  colors: ['rgba(99, 102, 241, 0.55)', 'rgba(139, 92, 246, 0.5)', 'rgba(168, 85, 247, 0.45)', 'rgba(192, 132, 252, 0.5)']
}
```

**Pulsing Indicator (when active):**
- White circle (`#fff`) with glow
- Animated scale: 1 → 1.15 → 1 (2 second loop)

### Secondary Buttons (e.g., "Change Date", "Change Time")

```javascript
{
  flex: 1,
  paddingVertical: 16,
  paddingHorizontal: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: 30,
  alignItems: 'center',
}
```

**Text:**
```javascript
{
  fontSize: 15,
  fontWeight: '500',
  color: '#fff',
}
```

### Primary CTA Button (Next)

**Container:**
```javascript
{
  borderRadius: 20,
  borderWidth: 2,
  borderColor: '#fff',
  shadowColor: '#fff',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
}
```

**Gradient:**
```javascript
colors={['#c084fc', '#e9d5ff', '#f5f3ff', '#ddd6fe', '#93c5fd', '#60a5fa']}
start={{ x: 0, y: 0.5 }}
end={{ x: 1, y: 0.5 }}
```

**Text:**
```javascript
{
  fontSize: 17,
  fontWeight: '600',
  color: '#1a1a2e', // Dark text on light gradient
}
```

---

## Input Fields

### Text Input
```javascript
{
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  padding: 18,
  color: '#fff',
  fontSize: 17,
}
```

**Focused State:**
```javascript
{
  borderColor: 'rgba(167, 139, 250, 0.5)',
}
```

**Error State:**
```javascript
{
  borderColor: '#ef4444',
}
```

---

## Modals & Overlays

### Frosted Glass Modal
Used for pickers, confirmations, etc.

**Overlay:**
```javascript
{
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
}
```

**Modal Container:**
```javascript
{
  borderRadius: 28,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.15)',
  overflow: 'hidden',
}
```

**Blur Background:**
```javascript
<BlurView intensity={40} tint="dark" style={{
  backgroundColor: 'rgba(20, 20, 30, 0.2)',
  padding: 24,
}} />
```

**Modal Title:**
```javascript
{
  fontSize: 18,
  fontWeight: '600',
  color: '#fff',
  textAlign: 'center',
  marginBottom: 20,
}
```

**Modal Done Button:**
```javascript
{
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: 30,
  paddingVertical: 16,
}
```

---

## Animations

### Morph Animation (Button → Modal)
When a button expands into a modal:

1. Measure button position with `measureInWindow()`
2. Animate position, size, and borderRadius simultaneously
3. Content fades in after 50% of animation
4. Use spring animation: `tension: 50, friction: 12`

### Shake Animation (Validation Error)
```javascript
Animated.sequence([
  Animated.timing(shakeAnim, { toValue: -8, duration: 50 }),
  Animated.timing(shakeAnim, { toValue: 8, duration: 50 }),
  Animated.timing(shakeAnim, { toValue: -4, duration: 50 }),
  Animated.timing(shakeAnim, { toValue: 0, duration: 50 }),
])
```

### Pulse Animation (Active Indicator)
```javascript
Animated.loop(
  Animated.sequence([
    Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000 }),
    Animated.timing(pulseAnim, { toValue: 1, duration: 1000 }),
  ])
)
```

---

## Slide-Specific Accent Colors

Each slide can have its own accent color for the gradient word:

| Slide | Question | Accent Word | Color |
|-------|----------|-------------|-------|
| 1 | What's your event? | - | - |
| 2 | When is your event happening? | happening | `#a78bfa` |
| 3 | Where is it happening? | happening | `#a78bfa` |
| 4 | Cover image | - | - |
| 5 | Final touches | - | - |

---

## Haptic Feedback

- **Soft:** Toggle interactions, secondary buttons
- **Medium:** Primary CTA (Next), closing modals
- **Error:** Validation failures (with shake animation)
- **Light:** Dismissing modals

---

## Spacing Guidelines

| Element | Spacing |
|---------|---------|
| Header margin bottom | `32px` |
| Between interactive elements | `40px` |
| Button internal padding | `16-20px` vertical, `24px` horizontal |
| Modal padding | `24px` |
| Control buttons gap | `12px` |

---

## Implementation Checklist

When creating a new slide, ensure:

- [ ] Uses `feed-background.png` as background (for When slide, others may vary)
- [ ] Header follows "Step X of 5" + main question pattern
- [ ] Accent word has gradient/colored styling
- [ ] Interactive elements have dark semi-transparent backgrounds
- [ ] Borders are subtle white (`rgba(255, 255, 255, 0.15)`)
- [ ] Primary CTA uses pink-white-blue gradient with white border
- [ ] Modals use frosted glass effect (BlurView)
- [ ] Animations feel smooth and premium (spring physics)
- [ ] Haptic feedback on all interactions
- [ ] Large, readable display text for key information
