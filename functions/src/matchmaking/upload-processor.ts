/**
 * Upload Processor - Handles CSV/Excel file upload, validation, and processing
 * Supports header mapping, data validation, and batch company creation
 */

import * as admin from 'firebase-admin';
import {
  Company,
  IngestLog,
  UploadRequest,
  UploadResponse,
  ValidationError,
  ColumnDetection,
  COMMON_FIELD_MAPPINGS,
  SUPPORTED_FILE_TYPES,
  MAX_COMPANIES_PER_UPLOAD
} from './types';

export class UploadProcessor {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Process uploaded CSV/Excel data
   */
  async processUpload(request: UploadRequest, uploadedBy?: string): Promise<UploadResponse> {
    const startTime = Date.now();
    const batchId = this.generateBatchId();

    // Create initial ingest log
    const ingestLog: IngestLog = {
      id: batchId,
      filename: request.filename,
      uploadedAt: new Date().toISOString(),
      uploadedBy,
      fileSize: JSON.stringify(request.data).length,
      fileType: this.detectFileType(request.filename),
      rowCount: request.data.length,
      status: 'processing',
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      validationErrors: [],
      fieldMappings: request.fieldMappings || {},
      profileCompletenessAvg: 0,
      duplicatesFound: 0,
      duplicateHandling: request.duplicateHandling || 'skip',
      startedAt: new Date().toISOString(),
      batchId,
      detectedColumns: [],
      sampleRows: request.data.slice(0, 5)
    };

    try {
      // Validate file type and size
      this.validateFile(request);

      // Detect columns and suggest mappings
      ingestLog.detectedColumns = this.detectColumns(request.data);

      // Auto-generate field mappings if not provided
      if (!request.fieldMappings || Object.keys(request.fieldMappings).length === 0) {
        ingestLog.fieldMappings = this.generateFieldMappings(ingestLog.detectedColumns);
      }

      // Validate data and create preview
      const { validatedCompanies, validationErrors } = await this.validateAndTransformData(
        request.data,
        ingestLog.fieldMappings
      );

      ingestLog.validationErrors = validationErrors;
      ingestLog.errorCount = validationErrors.filter(e => e.severity === 'error').length;

      // If validation-only mode, return preview
      if (request.validateOnly) {
        ingestLog.status = 'completed';
        ingestLog.completedAt = new Date().toISOString();
        ingestLog.processingTimeMs = Date.now() - startTime;

        await this.saveIngestLog(ingestLog);

        return {
          ingestLog,
          preview: {
            sampleCompanies: validatedCompanies.slice(0, 5),
            fieldMappings: ingestLog.fieldMappings,
            validationSummary: {
              totalRows: request.data.length,
              validRows: validatedCompanies.length,
              errorRows: ingestLog.errorCount,
              warningRows: validationErrors.filter(e => e.severity === 'warning').length
            }
          }
        };
      }

      // Process companies (check for duplicates, save to database)
      const processResult = await this.processCompanies(
        validatedCompanies,
        ingestLog.duplicateHandling,
        batchId
      );

      // Update final statistics
      ingestLog.successCount = processResult.successCount;
      ingestLog.errorCount += processResult.errorCount;
      ingestLog.skippedCount = processResult.skippedCount;
      ingestLog.duplicatesFound = processResult.duplicatesFound;
      ingestLog.processedRows = validatedCompanies.length;
      ingestLog.profileCompletenessAvg = this.calculateAverageCompleteness(validatedCompanies);
      ingestLog.status = ingestLog.errorCount === 0 ? 'completed' : 'completed';
      ingestLog.completedAt = new Date().toISOString();
      ingestLog.processingTimeMs = Date.now() - startTime;

      // Save final log
      await this.saveIngestLog(ingestLog);

      return { ingestLog };

    } catch (error) {
      console.error('[upload-processor] Processing failed:', error);

      ingestLog.status = 'failed';
      ingestLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ingestLog.completedAt = new Date().toISOString();
      ingestLog.processingTimeMs = Date.now() - startTime;

      await this.saveIngestLog(ingestLog);

      return { ingestLog };
    }
  }

  /**
   * Validate file type and size
   */
  private validateFile(request: UploadRequest): void {
    const fileType = this.detectFileType(request.filename);

    if (!SUPPORTED_FILE_TYPES.includes(fileType as any)) {
      throw new Error(`Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`);
    }

    if (request.data.length > MAX_COMPANIES_PER_UPLOAD) {
      throw new Error(`Too many rows. Maximum allowed: ${MAX_COMPANIES_PER_UPLOAD}`);
    }

    if (request.data.length === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Detect file type from filename
   */
  private detectFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'csv': return 'csv';
      case 'xlsx': return 'xlsx';
      case 'xls': return 'xls';
      default: return 'unknown';
    }
  }

  /**
   * Detect column types and characteristics
   */
  private detectColumns(data: any[]): ColumnDetection[] {
    if (data.length === 0) return [];

    const firstRow = data[0];
    const headers = Object.keys(firstRow);
    const detections: ColumnDetection[] = [];

    for (const header of headers) {
      const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = [...new Set(values)];
      const nullCount = data.length - values.length;

      const detection: ColumnDetection = {
        csvHeader: header,
        suggestedField: this.suggestFieldMapping(header),
        confidence: this.calculateMappingConfidence(header),
        dataType: this.detectDataType(values),
        sampleValues: uniqueValues.slice(0, 5).map(v => String(v)),
        uniqueCount: uniqueValues.length,
        nullCount
      };

      detections.push(detection);
    }

    return detections;
  }

  /**
   * Suggest field mapping based on header name
   */
  private suggestFieldMapping(header: string): string {
    const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

    // Check exact matches first
    if (COMMON_FIELD_MAPPINGS[normalizedHeader]) {
      return COMMON_FIELD_MAPPINGS[normalizedHeader];
    }

    // Check partial matches
    for (const [pattern, field] of Object.entries(COMMON_FIELD_MAPPINGS)) {
      if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
        return field;
      }
    }

    // Default fallback
    return normalizedHeader;
  }

  /**
   * Calculate confidence score for field mapping
   */
  private calculateMappingConfidence(header: string): number {
    const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');

    // Exact match
    if (COMMON_FIELD_MAPPINGS[normalizedHeader]) {
      return 100;
    }

    // Partial match
    for (const pattern of Object.keys(COMMON_FIELD_MAPPINGS)) {
      if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
        return 80;
      }
    }

    // Similar word patterns
    const commonPatterns = ['company', 'name', 'description', 'industry', 'location', 'email', 'website'];
    for (const pattern of commonPatterns) {
      if (normalizedHeader.includes(pattern)) {
        return 60;
      }
    }

    return 20; // Low confidence for unknown headers
  }

  /**
   * Detect data type from sample values
   */
  private detectDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'array' {
    if (values.length === 0) return 'string';

    // Check for arrays (values containing separators)
    const arrayLikeCount = values.filter(v =>
      String(v).includes(',') || String(v).includes(';') || String(v).includes('|')
    ).length;
    if (arrayLikeCount > values.length * 0.3) return 'array';

    // Check for numbers
    const numberCount = values.filter(v => !isNaN(Number(v)) && v !== '').length;
    if (numberCount > values.length * 0.8) return 'number';

    // Check for dates
    const dateCount = values.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount > values.length * 0.6) return 'date';

    // Check for booleans
    const booleanValues = ['true', 'false', 'yes', 'no', '1', '0'];
    const booleanCount = values.filter(v =>
      booleanValues.includes(String(v).toLowerCase())
    ).length;
    if (booleanCount > values.length * 0.8) return 'boolean';

    return 'string';
  }

  /**
   * Generate automatic field mappings
   */
  private generateFieldMappings(detections: ColumnDetection[]): Record<string, string> {
    const mappings: Record<string, string> = {};

    for (const detection of detections) {
      if (detection.confidence >= 60) {
        mappings[detection.csvHeader] = detection.suggestedField;
      }
    }

    return mappings;
  }

  /**
   * Validate and transform raw data into Company objects
   */
  private async validateAndTransformData(
    rawData: any[],
    fieldMappings: Record<string, string>
  ): Promise<{ validatedCompanies: Company[], validationErrors: ValidationError[] }> {
    const validatedCompanies: Company[] = [];
    const validationErrors: ValidationError[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowIndex = i + 1; // 1-based row numbering

      try {
        const company = await this.transformRowToCompany(row, fieldMappings, rowIndex);
        const errors = this.validateCompany(company, rowIndex);

        validationErrors.push(...errors);

        // Only include companies with no critical errors
        const criticalErrors = errors.filter(e => e.severity === 'error');
        if (criticalErrors.length === 0) {
          validatedCompanies.push(company);
        }
      } catch (error) {
        validationErrors.push({
          row: rowIndex,
          field: 'general',
          value: row,
          error: error instanceof Error ? error.message : 'Row transformation failed',
          severity: 'error'
        });
      }
    }

    return { validatedCompanies, validationErrors };
  }

  /**
   * Transform a single row into a Company object
   */
  private async transformRowToCompany(
    row: any,
    fieldMappings: Record<string, string>,
    rowIndex: number
  ): Promise<Company> {
    const now = new Date().toISOString();
    const company: Partial<Company> = {
      createdAt: now,
      updatedAt: now,
      source: 'upload'
    };

    // Apply field mappings
    for (const [csvHeader, companyField] of Object.entries(fieldMappings)) {
      const value = row[csvHeader];

      if (value !== null && value !== undefined && value !== '') {
        this.setCompanyField(company, companyField, value);
      }
    }

    // Ensure required fields
    if (!company.name) {
      throw new Error('Company name is required');
    }
    if (!company.country) {
      throw new Error('Country is required');
    }

    // Generate ID
    company.id = this.generateCompanyId(company.name!);

    // Calculate profile completeness
    company.profileCompleteness = this.calculateProfileCompleteness(company as Company);

    return company as Company;
  }

  /**
   * Set company field with proper type conversion
   */
  private setCompanyField(company: Partial<Company>, field: string, value: any): void {
    const stringValue = String(value).trim();

    switch (field) {
      // String fields
      case 'name':
      case 'description':
      case 'website':
      case 'country':
      case 'city':
      case 'timezone':
      case 'type':
      case 'size':
      case 'stage':
      case 'fundingStage':
      case 'contactEmail':
      case 'linkedinUrl':
      case 'twitterHandle':
      case 'pitch':
      case 'lookingFor':
        company[field as keyof Company] = stringValue as any;
        break;

      // Array fields (comma-separated)
      case 'industry':
      case 'platforms':
      case 'technologies':
      case 'markets':
      case 'capabilities':
      case 'needs':
      case 'tags':
        company[field as keyof Company] = this.parseArrayField(stringValue) as any;
        break;

      // Number fields
      case 'employees':
      case 'lastFundingAmount':
      case 'valuation':
      case 'revenue':
      case 'foundedYear':
        const numValue = this.parseNumberField(stringValue);
        if (numValue !== null) {
          company[field as keyof Company] = numValue as any;
        }
        break;

      // Date fields
      case 'lastFundingDate':
        const dateValue = this.parseDateField(stringValue);
        if (dateValue) {
          company[field as keyof Company] = dateValue as any;
        }
        break;

      default:
        // Unknown field - store as string
        (company as any)[field] = stringValue;
        break;
    }
  }

  /**
   * Parse array field (comma/semicolon separated)
   */
  private parseArrayField(value: string): string[] {
    if (!value) return [];

    return value
      .split(/[,;|]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Parse number field with error handling
   */
  private parseNumberField(value: string): number | null {
    if (!value) return null;

    // Remove common formatting
    const cleaned = value.replace(/[,$%]/g, '');
    const num = parseFloat(cleaned);

    return isNaN(num) ? null : num;
  }

  /**
   * Parse date field with multiple format support
   */
  private parseDateField(value: string): string | null {
    if (!value) return null;

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  /**
   * Validate Company object
   */
  private validateCompany(company: Company, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!company.name || company.name.length < 2) {
      errors.push({
        row: rowIndex,
        field: 'name',
        value: company.name,
        error: 'Company name must be at least 2 characters',
        severity: 'error'
      });
    }

    if (!company.country) {
      errors.push({
        row: rowIndex,
        field: 'country',
        value: company.country,
        error: 'Country is required',
        severity: 'error'
      });
    }

    // Format validation
    if (company.website && !this.isValidUrl(company.website)) {
      errors.push({
        row: rowIndex,
        field: 'website',
        value: company.website,
        error: 'Invalid website URL format',
        severity: 'warning'
      });
    }

    if (company.contactEmail && !this.isValidEmail(company.contactEmail)) {
      errors.push({
        row: rowIndex,
        field: 'contactEmail',
        value: company.contactEmail,
        error: 'Invalid email format',
        severity: 'warning'
      });
    }

    // Range validation
    if (company.foundedYear && (company.foundedYear < 1800 || company.foundedYear > new Date().getFullYear())) {
      errors.push({
        row: rowIndex,
        field: 'foundedYear',
        value: company.foundedYear,
        error: `Founded year must be between 1800 and ${new Date().getFullYear()}`,
        severity: 'warning'
      });
    }

    if (company.employees && company.employees < 0) {
      errors.push({
        row: rowIndex,
        field: 'employees',
        value: company.employees,
        error: 'Employee count cannot be negative',
        severity: 'warning'
      });
    }

    return errors;
  }

  /**
   * Process validated companies (handle duplicates, save to database)
   */
  private async processCompanies(
    companies: Company[],
    duplicateHandling: 'skip' | 'update' | 'create_new',
    batchId: string
  ): Promise<{
    successCount: number;
    errorCount: number;
    skippedCount: number;
    duplicatesFound: number;
  }> {
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let duplicatesFound = 0;

    const batch = this.db.batch();
    let batchOperations = 0;

    for (const company of companies) {
      try {
        // Check for duplicates
        const existingCompany = await this.findDuplicate(company);

        if (existingCompany) {
          duplicatesFound++;

          switch (duplicateHandling) {
            case 'skip':
              skippedCount++;
              continue;

            case 'update':
              const updatedCompany = { ...company, updatedAt: new Date().toISOString() };
              batch.update(this.db.collection('companies').doc(existingCompany.id), updatedCompany);
              successCount++;
              break;

            case 'create_new':
              company.id = this.generateCompanyId(company.name!, true);
              company.uploadBatch = batchId;
              batch.create(this.db.collection('companies').doc(company.id), company);
              successCount++;
              break;
          }
        } else {
          // New company
          company.uploadBatch = batchId;
          batch.create(this.db.collection('companies').doc(company.id), company);
          successCount++;
        }

        batchOperations++;

        // Commit batch every 500 operations (Firestore limit)
        if (batchOperations >= 500) {
          await batch.commit();
          batchOperations = 0;
        }

      } catch (error) {
        console.error(`Error processing company ${company.name}:`, error);
        errorCount++;
      }
    }

    // Commit remaining operations
    if (batchOperations > 0) {
      await batch.commit();
    }

    return { successCount, errorCount, skippedCount, duplicatesFound };
  }

  /**
   * Find duplicate company by name and basic info
   */
  private async findDuplicate(company: Company): Promise<Company | null> {
    const snapshot = await this.db.collection('companies')
      .where('name', '==', company.name)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Company;
  }

  /**
   * Calculate profile completeness score (0-100)
   */
  calculateProfileCompleteness(company: Company): number {
    const fields = [
      'name', 'description', 'website', 'country', 'city', 'type', 'size', 'stage',
      'industry', 'platforms', 'technologies', 'markets', 'capabilities', 'needs',
      'fundingStage', 'employees', 'foundedYear', 'contactEmail', 'pitch', 'lookingFor'
    ];

    let filledFields = 0;
    for (const field of fields) {
      const value = company[field as keyof Company];
      if (value !== null && value !== undefined && value !== '' &&
          (!Array.isArray(value) || value.length > 0)) {
        filledFields++;
      }
    }

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Calculate average completeness for multiple companies
   */
  private calculateAverageCompleteness(companies: Company[]): number {
    if (companies.length === 0) return 0;

    const total = companies.reduce((sum, company) =>
      sum + (company.profileCompleteness || 0), 0);

    return Math.round(total / companies.length);
  }

  /**
   * Save ingest log to database
   */
  private async saveIngestLog(log: IngestLog): Promise<void> {
    await this.db.collection('ingestLogs').doc(log.id).set(log);
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate company ID from name
   */
  private generateCompanyId(name: string, unique = false): string {
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return unique ? `${baseId}_${Date.now()}` : baseId;
  }

  // ============= VALIDATION HELPERS =============

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}