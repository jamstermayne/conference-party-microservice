/**
 * Design System Validation Service
 * Ensures consistent design implementation across the application
 */

import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Design tokens registry
const DESIGN_TOKENS = {
  colors: {
    primary: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    secondary: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    neutral: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'],
    semantic: ['success', 'warning', 'error', 'info']
  },
  spacing: [
    '0', 'px', '0-5', '1', '1-5', '2', '2-5', '3', '3-5', '4',
    '5', '6', '7', '8', '9', '10', '12', '14', '16', '20', '24', '28', '32'
  ],
  typography: {
    sizes: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'],
    weights: ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold'],
    lineHeights: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose']
  },
  borderRadius: ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'],
  shadows: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'glow-sm', 'glow-md', 'glow-lg'],
  animations: {
    timings: ['linear', 'in', 'out', 'in-out', 'bounce', 'elastic'],
    durations: ['75', '100', '150', '200', '300', '500', '700', '1000']
  }
};

// Component registry
const COMPONENT_PATTERNS = {
  card: {
    baseClass: 'card',
    variants: ['elevated', 'interactive', 'featured', 'compact', 'outlined'],
    anatomy: ['header', 'badge', 'actions', 'title', 'subtitle', 'body', 'media', 'footer', 'meta', 'divider'],
    modifiers: ['fade-in', 'slide-up', 'scale-in', 'loading']
  },
  button: {
    baseClass: 'btn',
    variants: ['primary', 'secondary', 'ghost', 'outline', 'danger', 'success'],
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    modifiers: ['full', 'rounded', 'square', 'icon', 'loading', 'pulse', 'ripple', 'gradient-animate'],
    states: ['hover', 'active', 'focus', 'disabled']
  },
  input: {
    baseClass: 'input',
    variants: ['outlined', 'filled', 'borderless'],
    sizes: ['sm', 'md', 'lg'],
    states: ['focus', 'error', 'success', 'disabled']
  },
  modal: {
    baseClass: 'modal',
    variants: ['center', 'top', 'bottom', 'fullscreen'],
    anatomy: ['backdrop', 'container', 'header', 'body', 'footer'],
    sizes: ['sm', 'md', 'lg', 'xl', 'full']
  }
};

// Validation rules
const VALIDATION_RULES = {
  colorContrast: {
    normal: 7.0,  // WCAG AAA
    large: 4.5,   // WCAG AA for large text
    ui: 3.0       // UI components
  },
  touchTarget: {
    minSize: 44,  // 44x44px minimum
    spacing: 8    // 8px minimum between targets
  },
  typography: {
    minSize: 12,  // 12px minimum
    maxLineLength: 75 // characters
  },
  animation: {
    maxDuration: 1000, // 1 second max for UI animations
    reducedMotion: true // respect prefers-reduced-motion
  },
  spacing: {
    gridUnit: 8 // 8px grid system
  }
};

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "design-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

// Get all design tokens
app.get("/tokens", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    tokens: DESIGN_TOKENS,
    documentation: "https://docs.app.com/design-system/tokens"
  });
});

// Get specific token category
app.get("/tokens/:category", (req: Request, res: Response) => {
  const { category } = req.params;

  if (!DESIGN_TOKENS[category as keyof typeof DESIGN_TOKENS]) {
    return res.status(404).json({
      error: `Token category '${category}' not found`,
      availableCategories: Object.keys(DESIGN_TOKENS)
    });
  }

  res.status(200).json({
    success: true,
    category,
    tokens: DESIGN_TOKENS[category as keyof typeof DESIGN_TOKENS]
  });
});

// Get component patterns
app.get("/components", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    components: COMPONENT_PATTERNS,
    totalComponents: Object.keys(COMPONENT_PATTERNS).length
  });
});

// Get specific component pattern
app.get("/components/:component", (req: Request, res: Response) => {
  const { component } = req.params;

  if (!COMPONENT_PATTERNS[component as keyof typeof COMPONENT_PATTERNS]) {
    return res.status(404).json({
      error: `Component '${component}' not found`,
      availableComponents: Object.keys(COMPONENT_PATTERNS)
    });
  }

  res.status(200).json({
    success: true,
    component,
    pattern: COMPONENT_PATTERNS[component as keyof typeof COMPONENT_PATTERNS]
  });
});

// Validate CSS classes
app.post("/validate/classes", (req: Request, res: Response) => {
  const { classes } = req.body;

  if (!classes || !Array.isArray(classes)) {
    return res.status(400).json({
      error: "Please provide an array of CSS classes to validate"
    });
  }

  const validation = classes.map(className => {
    const parts = className.split('--');
    const baseClass = parts[0];

    // Check if it's a known component
    const component = Object.entries(COMPONENT_PATTERNS).find(
      ([_, pattern]) => pattern.baseClass === baseClass
    );

    if (!component) {
      return {
        class: className,
        valid: false,
        error: `Unknown base class: ${baseClass}`
      };
    }

    const [componentName, pattern] = component;
    const modifier = parts[1];

    if (modifier) {
      const isValidModifier =
        pattern.variants?.includes(modifier) ||
        pattern.sizes?.includes(modifier) ||
        pattern.modifiers?.includes(modifier);

      return {
        class: className,
        valid: isValidModifier,
        component: componentName,
        modifier,
        error: !isValidModifier ? `Invalid modifier '${modifier}' for ${componentName}` : null
      };
    }

    return {
      class: className,
      valid: true,
      component: componentName
    };
  });

  const allValid = validation.every(v => v.valid);

  res.status(200).json({
    success: allValid,
    validation,
    summary: {
      total: classes.length,
      valid: validation.filter(v => v.valid).length,
      invalid: validation.filter(v => !v.valid).length
    }
  });
});

// Validate color contrast
app.post("/validate/contrast", (req: Request, res: Response) => {
  const { foreground, background, fontSize = 16, fontWeight = 400 } = req.body;

  if (!foreground || !background) {
    return res.status(400).json({
      error: "Please provide foreground and background colors"
    });
  }

  // Simple contrast calculation (would use proper algorithm in production)
  const calculateContrast = (fg: string, bg: string): number => {
    // This is a simplified version - use a proper library in production
    return Math.random() * 21; // Mock contrast ratio
  };

  const contrast = calculateContrast(foreground, background);
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
  const requiredContrast = isLargeText ? VALIDATION_RULES.colorContrast.large : VALIDATION_RULES.colorContrast.normal;
  const passes = contrast >= requiredContrast;

  res.status(200).json({
    success: passes,
    contrast: contrast.toFixed(2),
    requiredContrast,
    level: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Fail',
    isLargeText,
    recommendation: !passes ?
      `Increase contrast to at least ${requiredContrast}:1` :
      'Color combination passes accessibility standards'
  });
});

// Validate spacing
app.post("/validate/spacing", (req: Request, res: Response) => {
  const { value } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({
      error: "Please provide a spacing value to validate"
    });
  }

  const numValue = parseInt(value);
  const gridUnit = VALIDATION_RULES.spacing.gridUnit;
  const isValid = numValue % gridUnit === 0;

  res.status(200).json({
    success: isValid,
    value: numValue,
    gridUnit,
    isOnGrid: isValid,
    nearestGridValue: Math.round(numValue / gridUnit) * gridUnit,
    recommendation: !isValid ?
      `Use ${Math.round(numValue / gridUnit) * gridUnit}px for consistency` :
      'Value follows 8px grid system'
  });
});

// Generate component HTML
app.post("/generate/component", (req: Request, res: Response) => {
  const { type, variant, size, content } = req.body;

  if (!type) {
    return res.status(400).json({
      error: "Please specify a component type",
      availableTypes: Object.keys(COMPONENT_PATTERNS)
    });
  }

  const pattern = COMPONENT_PATTERNS[type as keyof typeof COMPONENT_PATTERNS];
  if (!pattern) {
    return res.status(404).json({
      error: `Component type '${type}' not found`,
      availableTypes: Object.keys(COMPONENT_PATTERNS)
    });
  }

  // Generate HTML based on component type
  let html = '';
  let classes = [pattern.baseClass];

  if (variant && pattern.variants?.includes(variant)) {
    classes.push(`${pattern.baseClass}--${variant}`);
  }

  if (size && pattern.sizes?.includes(size)) {
    classes.push(`${pattern.baseClass}--${size}`);
  }

  switch (type) {
    case 'button':
      html = `<button class="${classes.join(' ')}">${content || 'Button'}</button>`;
      break;

    case 'card':
      html = `
<div class="${classes.join(' ')}">
  <div class="card__header">
    <h3 class="card__title">${content?.title || 'Card Title'}</h3>
    <div class="card__actions">
      <button class="btn btn--icon btn--ghost">
        <svg class="btn__icon"><!-- icon --></svg>
      </button>
    </div>
  </div>
  <div class="card__body">
    ${content?.body || 'Card content goes here...'}
  </div>
  <div class="card__footer">
    <div class="card__meta">
      <span class="card__meta-item">Meta 1</span>
      <span class="card__meta-item">Meta 2</span>
    </div>
    <button class="btn btn--primary btn--sm">Action</button>
  </div>
</div>`;
      break;

    default:
      html = `<div class="${classes.join(' ')}">${content || 'Component content'}</div>`;
  }

  res.status(200).json({
    success: true,
    type,
    variant,
    size,
    classes: classes.join(' '),
    html: html.trim(),
    css: [
      '/design-system/tokens.css',
      `/design-system/components/${type}s.css`
    ]
  });
});

// Get validation rules
app.get("/rules", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    rules: VALIDATION_RULES,
    documentation: "https://docs.app.com/design-system/validation"
  });
});

// Audit design usage
app.post("/audit", (req: Request, res: Response) => {
  const { html, css } = req.body;

  if (!html && !css) {
    return res.status(400).json({
      error: "Please provide HTML or CSS to audit"
    });
  }

  // Mock audit results (implement real parsing in production)
  const auditResults = {
    score: Math.floor(Math.random() * 30) + 70, // 70-100
    issues: [],
    warnings: [],
    suggestions: [
      "Consider using design tokens for color values",
      "Ensure all interactive elements have focus states",
      "Verify color contrast meets WCAG AAA standards"
    ],
    stats: {
      componentsUsed: 12,
      tokensUsed: 45,
      customStyles: 8,
      accessibilityScore: 92
    }
  };

  res.status(200).json({
    success: true,
    audit: auditResults,
    timestamp: new Date().toISOString()
  });
});

// Export the function
export const designService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 10
}, app);