/**
 * Upload Processor - Handles CSV/Excel file upload, validation, and processing
 * Supports header mapping, data validation, and batch company creation
 */
import { Company, UploadRequest, UploadResponse } from './types';
export declare class UploadProcessor {
    private db;
    constructor();
    /**
     * Process uploaded CSV/Excel data
     */
    processUpload(request: UploadRequest, uploadedBy?: string): Promise<UploadResponse>;
    /**
     * Validate file type and size
     */
    private validateFile;
    /**
     * Detect file type from filename
     */
    private detectFileType;
    /**
     * Detect column types and characteristics
     */
    private detectColumns;
    /**
     * Suggest field mapping based on header name
     */
    private suggestFieldMapping;
    /**
     * Calculate confidence score for field mapping
     */
    private calculateMappingConfidence;
    /**
     * Detect data type from sample values
     */
    private detectDataType;
    /**
     * Generate automatic field mappings
     */
    private generateFieldMappings;
    /**
     * Validate and transform raw data into Company objects
     */
    private validateAndTransformData;
    /**
     * Transform a single row into a Company object
     */
    private transformRowToCompany;
    /**
     * Set company field with proper type conversion
     */
    private setCompanyField;
    /**
     * Parse array field (comma/semicolon separated)
     */
    private parseArrayField;
    /**
     * Parse number field with error handling
     */
    private parseNumberField;
    /**
     * Parse date field with multiple format support
     */
    private parseDateField;
    /**
     * Validate Company object
     */
    private validateCompany;
    /**
     * Process validated companies (handle duplicates, save to database)
     */
    private processCompanies;
    /**
     * Find duplicate company by name and basic info
     */
    private findDuplicate;
    /**
     * Calculate profile completeness score (0-100)
     */
    calculateProfileCompleteness(company: Company): number;
    /**
     * Calculate average completeness for multiple companies
     */
    private calculateAverageCompleteness;
    /**
     * Save ingest log to database
     */
    private saveIngestLog;
    /**
     * Generate unique batch ID
     */
    private generateBatchId;
    /**
     * Generate company ID from name
     */
    private generateCompanyId;
    private isValidUrl;
    private isValidEmail;
}
//# sourceMappingURL=upload-processor.d.ts.map