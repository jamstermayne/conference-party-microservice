/**
 * Structured logging utility for better observability
 */
declare class Logger {
    private context;
    setContext(context: Record<string, any>): void;
    private log;
    debug(message: string, metadata?: Record<string, any>): void;
    info(message: string, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    error(message: string, error?: any, metadata?: Record<string, any>): void;
    performance(path: string, method: string, duration: number, statusCode: number): void;
    security(event: string, metadata?: Record<string, any>): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map