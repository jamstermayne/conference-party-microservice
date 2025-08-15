/**
 * Export the secret definition so it can be referenced by functions
 * This ensures the secret is available to any function that imports this module
 */
export declare const MEETTOMATCH_CRYPTO_KEY: import("firebase-functions/lib/params/types").SecretParam;
/**
 * Function runtime options with secret access
 */
export declare const mtmFunctionOptions: {
    secrets: import("firebase-functions/lib/params/types").SecretParam[];
    timeoutSeconds: number;
    memory: "256MiB";
};
//# sourceMappingURL=function-config.d.ts.map