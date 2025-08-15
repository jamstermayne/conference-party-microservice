export declare class KmsService {
    private client;
    private keyPath;
    constructor();
    /**
     * Encrypt ICS URL using KMS envelope encryption
     */
    encryptUrl(plaintext: string): Promise<string>;
    /**
     * Decrypt ICS URL using KMS envelope decryption
     */
    decryptUrl(encryptedData: string): Promise<string>;
    /**
     * Generate SHA256 hash of URL for safe logging/comparison
     */
    hashUrl(url: string): string;
}
export declare const kmsService: KmsService;
//# sourceMappingURL=kms.d.ts.map