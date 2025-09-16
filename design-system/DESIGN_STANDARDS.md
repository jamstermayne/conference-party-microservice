# Modern Card Design System Standards

## Design Philosophy
Our design system follows a **"Glassmorphism meets Neo-brutalism"** approach, combining subtle transparency effects with bold, confident typography and purposeful shadows.

### Core Principles
1. **Clarity First** - Every element must have a clear purpose
2. **Consistent Spacing** - Use 8px grid system
3. **Accessible Contrast** - WCAG AAA compliance
4. **Smooth Interactions** - 60fps animations
5. **Mobile-First** - Touch-friendly targets (min 44x44px)

## Card System

### Card Anatomy
```
┌─────────────────────────────────┐
│ [Badge]              [Actions]  │ <- Header Zone
├─────────────────────────────────┤
│                                 │
│  Primary Content Area           │ <- Content Zone
│                                 │
├─────────────────────────────────┤
│ [Metadata] [Metadata] [CTA]     │ <- Footer Zone
└─────────────────────────────────┘
```

### Card Variants

#### 1. Base Card
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Backdrop-filter: `blur(10px)`
- Border-radius: `16px`
- Padding: `24px`
- Shadow: `0 4px 24px rgba(0, 0, 0, 0.1)`

#### 2. Elevated Card
- All Base Card properties plus:
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.15)`
- Transform on hover: `translateY(-2px)`
- Transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`

#### 3. Interactive Card
- All Elevated Card properties plus:
- Cursor: `pointer`
- Hover background: `rgba(255, 255, 255, 0.05)`
- Active transform: `scale(0.98)`

#### 4. Featured Card
- Gradient border: `linear-gradient(135deg, #667eea, #764ba2)`
- Glow effect: `0 0 40px rgba(102, 126, 234, 0.1)`
- Badge: "Featured" indicator

## Button System

### Button Hierarchy

#### Primary Button
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
```

#### Secondary Button
```css
background: rgba(255, 255, 255, 0.08);
color: rgba(255, 255, 255, 0.9);
border: 1px solid rgba(255, 255, 255, 0.2);
padding: 12px 24px;
border-radius: 12px;
```

#### Ghost Button
```css
background: transparent;
color: rgba(255, 255, 255, 0.7);
padding: 12px 24px;
border-radius: 12px;
```

#### Icon Button
```css
width: 40px;
height: 40px;
border-radius: 12px;
display: flex;
align-items: center;
justify-content: center;
```

### Button States
- **Default**: Base styles
- **Hover**: Brightness +10%, transform: translateY(-1px)
- **Active**: Transform: scale(0.95)
- **Disabled**: Opacity: 0.5, cursor: not-allowed
- **Loading**: Show spinner, disable interactions

## Color System

### Primary Palette
```css
--primary-50: #f5f3ff;
--primary-100: #ede9fe;
--primary-200: #ddd6fe;
--primary-300: #c4b5fd;
--primary-400: #a78bfa;
--primary-500: #8b5cf6; /* Main */
--primary-600: #7c3aed;
--primary-700: #6d28d9;
--primary-800: #5b21b6;
--primary-900: #4c1d95;
```

### Neutral Palette (Dark Mode First)
```css
--neutral-50: #fafafa;
--neutral-100: #f4f4f5;
--neutral-200: #e4e4e7;
--neutral-300: #d4d4d8;
--neutral-400: #a1a1aa;
--neutral-500: #71717a;
--neutral-600: #52525b;
--neutral-700: #3f3f46;
--neutral-800: #27272a;
--neutral-900: #18181b;
--neutral-950: #09090b; /* Background */
```

### Semantic Colors
```css
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

## Typography Scale

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Monaco, monospace;
```

### Type Scale
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System (8px Grid)

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

## Animation Standards

### Timing Functions
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Durations
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Common Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Shadow System

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.15);
--shadow-2xl: 0 24px 64px rgba(0, 0, 0, 0.2);
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
```

## Border Radius Scale

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Pill shape */
```

## Z-Index Scale

```css
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 1070;
--z-notification: 1080;
```

## Responsive Breakpoints

```css
--screen-sm: 640px;   /* Mobile landscape */
--screen-md: 768px;   /* Tablet */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

## Component Patterns

### Card Grid Layout
```css
.card-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
```

### Flex Utilities
```css
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Glassmorphism Mixin
```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

## Accessibility Requirements

1. **Color Contrast**
   - Normal text: 7:1 ratio (WCAG AAA)
   - Large text: 4.5:1 ratio
   - Interactive elements: 3:1 ratio

2. **Focus Indicators**
   - Visible outline: 2px solid primary
   - Offset: 2px
   - Never remove without replacement

3. **Motion Preferences**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

4. **Touch Targets**
   - Minimum size: 44x44px
   - Spacing between targets: 8px minimum

## Usage Guidelines

### DO's
- ✅ Use semantic HTML elements
- ✅ Follow the 8px grid system
- ✅ Test on real devices
- ✅ Use CSS variables for all values
- ✅ Implement loading states
- ✅ Add hover/focus states to all interactive elements

### DON'Ts
- ❌ Override design tokens with hard-coded values
- ❌ Use px values directly (use rem/em)
- ❌ Skip accessibility testing
- ❌ Create one-off components
- ❌ Ignore performance budgets
- ❌ Mix design patterns inconsistently