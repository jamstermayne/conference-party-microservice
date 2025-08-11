/**
 * SECURITY STUB IMPLEMENTATION
 * Minimal security functions for testing coverage
 */
export declare function isValidOrigin(origin: string | undefined | null, allowedOrigins: string[]): boolean;
export declare function sanitizeString(input: any): string;
export declare function validateCsrfToken(token: string | undefined, sessionToken: string | undefined): boolean;
export declare const rateLimiter: {
    requests: Map<string, {
        count: number;
        resetTime: number;
    }>;
    isAllowed(clientId: string, limit?: number, windowMs?: number): boolean;
    reset(clientId: string): void;
    clear(): void;
};
export declare const requestValidator: {
    validate(request: any, requiredFields: string[]): boolean;
    isWithinSizeLimit(request: any, maxSize: number): boolean;
    hasValidContentType(request: any): boolean;
};
export declare function sanitizeInput(input: any): any;
//# sourceMappingURL=security-stub.d.ts.map