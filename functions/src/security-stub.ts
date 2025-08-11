/**
 * SECURITY STUB IMPLEMENTATION
 * Minimal security functions for testing coverage
 */

export function isValidOrigin(origin: string | undefined | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  return allowedOrigins.some((allowed) => {
    if (allowed.includes("*")) {
      const pattern = allowed.replace(/\./g, "\\.").replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return allowed === origin;
  });
}

export function sanitizeString(input: any): string {
  if (typeof input !== "string") return "";
  if (!input) return "";

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags but keep content
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'");
}

export function validateCsrfToken(token: string | undefined, sessionToken: string | undefined): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

export const rateLimiter = {
  requests: new Map<string, { count: number; resetTime: number }>(),

  isAllowed(clientId: string, limit = 100, windowMs = 3600000): boolean {
    const now = Date.now();
    const clientData = this.requests.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      this.requests.set(clientId, {count: 1, resetTime: now + windowMs});
      return true;
    }

    if (clientData.count >= limit) {
      return false;
    }

    clientData.count++;
    return true;
  },

  reset(clientId: string): void {
    this.requests.delete(clientId);
  },

  clear(): void {
    this.requests.clear();
  },
};

export const requestValidator = {
  validate(request: any, requiredFields: string[]): boolean {
    if (!request.body) return false;

    return requiredFields.every((field) =>
      request.body.hasOwnProperty(field) &&
      request.body[field] !== undefined &&
      request.body[field] !== null
    );
  },

  isWithinSizeLimit(request: any, maxSize: number): boolean {
    const size = JSON.stringify(request.body || {}).length;
    return size <= maxSize;
  },

  hasValidContentType(request: any): boolean {
    const contentType = request.headers?.["content-type"];
    return contentType === "application/json";
  },
};

export function sanitizeInput(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input);
  }

  if (typeof input === "object") {
    if (Array.isArray(input)) {
      return input.map((item) => sanitizeInput(item));
    }

    // Handle circular references with WeakSet tracking
    const seen = new WeakSet();
    const sanitizeObject = (obj: any): any => {
      if (obj === null || typeof obj !== "object") {
        return sanitizeInput(obj);
      }

      if (seen.has(obj)) {
        return "[Circular]";
      }

      seen.add(obj);

      const result: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        result[key] = sanitizeObject(value);
      }

      return result;
    };

    return sanitizeObject(input);
  }

  return input;
}
