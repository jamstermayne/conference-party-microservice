export declare const config: {
    environment: "development" | "staging" | "production";
    cors: {
        allowedOrigins: string[];
        credentials: boolean;
        maxAge: number;
    };
    cache: {
        ttl: number;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=simple-config.d.ts.map