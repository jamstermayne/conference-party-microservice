/**
 * Upload Processor Tests
 * Tests for CSV/Excel upload, validation, and processing
 */

import { UploadProcessor } from '../../src/matchmaking/upload-processor';
import { UploadRequest, UploadResponse, Company, ValidationError } from '../../src/matchmaking/types';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      })),
      add: jest.fn(),
      batch: jest.fn(() => ({
        set: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        commit: jest.fn()
      }))
    }))
  }))
}));

describe('UploadProcessor', () => {
  let uploadProcessor: UploadProcessor;
  let mockFirestore: any;

  beforeEach(() => {
    mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn().mockResolvedValue({ exists: false })
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ empty: true, docs: [] })
          }))
        })),
        add: jest.fn(),
        batch: jest.fn(() => ({
          set: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          commit: jest.fn()
        }))
      })),
      batch: jest.fn(() => ({
        set: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        commit: jest.fn()
      }))
    };

    (admin.firestore as jest.Mock).mockReturnValue(mockFirestore);

    uploadProcessor = new UploadProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processUpload', () => {
    const validCSVData = [
      {
        'Company Name': 'GameStudio Alpha',
        'Description': 'Independent game development studio',
        'Country': 'United States',
        'City': 'San Francisco',
        'Type': 'game_developer',
        'Industry': 'gaming, mobile',
        'Platforms': 'mobile, ios',
        'Employees': '15',
        'Founded': '2020',
        'Email': 'contact@gamestudio-alpha.com',
        'Website': 'https://gamestudio-alpha.com'
      },
      {
        'Company Name': 'Publisher Corp',
        'Description': 'Game publisher and distributor',
        'Country': 'United Kingdom',
        'City': 'London',
        'Type': 'publisher',
        'Industry': 'gaming, publishing',
        'Platforms': 'pc, console',
        'Employees': '100',
        'Founded': '2015',
        'Email': 'info@publisher-corp.com',
        'Website': 'https://publisher-corp.com'
      }
    ];

    it('should process valid CSV data successfully', async () => {
      const request: UploadRequest = {
        filename: 'companies.csv',
        data: validCSVData,
        validateOnly: false
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request, 'test-user');

      expect(response).toBeDefined();
      expect(response.ingestLog).toBeDefined();
      expect(response.ingestLog.filename).toBe('companies.csv');
      expect(response.ingestLog.rowCount).toBe(2);
      expect(response.ingestLog.status).toBe('completed');
      expect(response.ingestLog.uploadedBy).toBe('test-user');
    });

    it('should validate data and return preview when validateOnly is true', async () => {
      const request: UploadRequest = {
        filename: 'companies.csv',
        data: validCSVData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response).toBeDefined();
      expect(response.ingestLog.status).toBe('completed');
      expect(response.preview).toBeDefined();
      expect(response.preview!.sampleCompanies).toBeDefined();
      expect(response.preview!.fieldMappings).toBeDefined();
      expect(response.preview!.validationSummary).toBeDefined();
    });

    it('should detect and map common field names automatically', async () => {
      const request: UploadRequest = {
        filename: 'companies.csv',
        data: validCSVData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.fieldMappings['Company Name']).toBe('name');
      expect(response.ingestLog.fieldMappings['Country']).toBe('country');
      expect(response.ingestLog.fieldMappings['Email']).toBe('contactEmail');
      expect(response.ingestLog.fieldMappings['Website']).toBe('website');
    });

    it('should handle custom field mappings', async () => {
      const customMappings = {
        'Company Name': 'name',
        'Description': 'description',
        'Country': 'country',
        'Custom Field': 'customField'
      };

      const request: UploadRequest = {
        filename: 'companies.csv',
        data: validCSVData,
        fieldMappings: customMappings,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.fieldMappings).toEqual(customMappings);
    });

    it('should validate required fields', async () => {
      const invalidData = [
        {
          'Description': 'Company without name',
          'Country': 'United States'
        },
        {
          'Company Name': 'Valid Company',
          // Missing country
          'Description': 'This company has no country'
        }
      ];

      const request: UploadRequest = {
        filename: 'invalid.csv',
        data: invalidData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.validationErrors.length).toBeGreaterThan(0);
      expect(response.ingestLog.errorCount).toBeGreaterThan(0);

      const errorMessages = response.ingestLog.validationErrors.map(e => e.error);
      expect(errorMessages.some(msg => msg.includes('name'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('Country'))).toBe(true);
    });

    it('should validate email formats', async () => {
      const dataWithInvalidEmail = [
        {
          'Company Name': 'Test Company',
          'Country': 'United States',
          'Email': 'invalid-email-format'
        }
      ];

      const request: UploadRequest = {
        filename: 'test.csv',
        data: dataWithInvalidEmail,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      const emailErrors = response.ingestLog.validationErrors.filter(
        e => e.field === 'contactEmail' && e.severity === 'warning'
      );
      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should validate URL formats', async () => {
      const dataWithInvalidURL = [
        {
          'Company Name': 'Test Company',
          'Country': 'United States',
          'Website': 'not-a-valid-url'
        }
      ];

      const request: UploadRequest = {
        filename: 'test.csv',
        data: dataWithInvalidURL,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      const urlErrors = response.ingestLog.validationErrors.filter(
        e => e.field === 'website' && e.severity === 'warning'
      );
      expect(urlErrors.length).toBeGreaterThan(0);
    });

    it('should handle array fields correctly', async () => {
      const dataWithArrays = [
        {
          'Company Name': 'Array Test Company',
          'Country': 'United States',
          'Industry': 'gaming, mobile, entertainment',
          'Platforms': 'ios; android; web',
          'Technologies': 'unity|c#|javascript'
        }
      ];

      const request: UploadRequest = {
        filename: 'arrays.csv',
        data: dataWithArrays,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      if (response.preview && response.preview.sampleCompanies.length > 0) {
        const company = response.preview.sampleCompanies[0];
        expect(Array.isArray(company.industry)).toBe(true);
        expect(company.industry).toContain('gaming');
        expect(company.industry).toContain('mobile');
        expect(company.industry).toContain('entertainment');
      }
    });

    it('should handle numeric fields correctly', async () => {
      const dataWithNumbers = [
        {
          'Company Name': 'Numeric Test Company',
          'Country': 'United States',
          'Employees': '150',
          'Founded': '2018',
          'Revenue': '5000000',
          'Funding': '$2,500,000'
        }
      ];

      const request: UploadRequest = {
        filename: 'numbers.csv',
        data: dataWithNumbers,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      if (response.preview && response.preview.sampleCompanies.length > 0) {
        const company = response.preview.sampleCompanies[0];
        expect(typeof company.employees).toBe('number');
        expect(company.employees).toBe(150);
        expect(typeof company.foundedYear).toBe('number');
        expect(company.foundedYear).toBe(2018);
      }
    });

    it('should calculate profile completeness', async () => {
      const request: UploadRequest = {
        filename: 'complete.csv',
        data: validCSVData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      if (response.preview && response.preview.sampleCompanies.length > 0) {
        const company = response.preview.sampleCompanies[0];
        expect(typeof company.profileCompleteness).toBe('number');
        expect(company.profileCompleteness).toBeGreaterThan(0);
        expect(company.profileCompleteness).toBeLessThanOrEqual(100);
      }
    });

    it('should handle duplicate companies based on strategy', async () => {
      // Mock existing company
      mockFirestore.collection.mockReturnValue({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [{
                id: 'existing-id',
                data: () => ({ name: 'GameStudio Alpha' })
              }]
            })
          }))
        })),
        batch: jest.fn(() => ({
          update: jest.fn(),
          commit: jest.fn()
        }))
      });

      const request: UploadRequest = {
        filename: 'duplicates.csv',
        data: validCSVData,
        duplicateHandling: 'skip',
        validateOnly: false
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.duplicatesFound).toBeGreaterThan(0);
      expect(response.ingestLog.skippedCount).toBeGreaterThan(0);
    });

    it('should reject files that are too large', async () => {
      const largeData = Array(11000).fill(validCSVData[0]); // Exceed MAX_COMPANIES_PER_UPLOAD

      const request: UploadRequest = {
        filename: 'large.csv',
        data: largeData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.status).toBe('failed');
      expect(response.ingestLog.errorMessage).toContain('Too many rows');
    });

    it('should reject empty files', async () => {
      const request: UploadRequest = {
        filename: 'empty.csv',
        data: [],
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.status).toBe('failed');
      expect(response.ingestLog.errorMessage).toContain('empty');
    });

    it('should detect column types correctly', async () => {
      const request: UploadRequest = {
        filename: 'detection.csv',
        data: validCSVData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.detectedColumns).toBeDefined();
      expect(response.ingestLog.detectedColumns.length).toBeGreaterThan(0);

      const detectedColumns = response.ingestLog.detectedColumns;
      const employeesColumn = detectedColumns.find(c => c.csvHeader === 'Employees');
      const industryColumn = detectedColumns.find(c => c.csvHeader === 'Industry');

      expect(employeesColumn?.dataType).toBe('number');
      expect(industryColumn?.dataType).toBe('array');
    });

    it('should generate batch IDs correctly', async () => {
      const request: UploadRequest = {
        filename: 'batch-test.csv',
        data: validCSVData,
        validateOnly: false
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.batchId).toBeDefined();
      expect(response.ingestLog.batchId).toMatch(/^batch_\d+_[a-z0-9]+$/);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock Firestore error
      mockFirestore.collection.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request: UploadRequest = {
        filename: 'error-test.csv',
        data: validCSVData,
        validateOnly: false
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.status).toBe('failed');
      expect(response.ingestLog.errorMessage).toBeDefined();
    });

    it('should measure processing time', async () => {
      const request: UploadRequest = {
        filename: 'timing-test.csv',
        data: validCSVData,
        validateOnly: false
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.processingTimeMs).toBeDefined();
      expect(response.ingestLog.processingTimeMs).toBeGreaterThan(0);
    });
  });

  describe('calculateProfileCompleteness', () => {
    it('should calculate completeness for minimal company', () => {
      const minimalCompany: Company = {
        id: 'test',
        name: 'Test Company',
        country: 'United States',
        type: 'game_developer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const completeness = uploadProcessor.calculateProfileCompleteness(minimalCompany);

      expect(completeness).toBeGreaterThan(0);
      expect(completeness).toBeLessThan(50); // Should be low for minimal data
    });

    it('should calculate completeness for complete company', () => {
      const completeCompany: Company = {
        id: 'test',
        name: 'Complete Company',
        description: 'Full description',
        website: 'https://example.com',
        country: 'United States',
        city: 'San Francisco',
        type: 'game_developer',
        size: 'small',
        stage: 'growth',
        industry: ['gaming', 'mobile'],
        platforms: ['ios', 'android'],
        technologies: ['unity', 'c#'],
        markets: ['b2c'],
        capabilities: ['development'],
        needs: ['publishing'],
        fundingStage: 'seed',
        employees: 15,
        foundedYear: 2020,
        contactEmail: 'test@example.com',
        pitch: 'Great company',
        lookingFor: 'Partners',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const completeness = uploadProcessor.calculateProfileCompleteness(completeCompany);

      expect(completeness).toBeGreaterThan(80); // Should be high for complete data
      expect(completeness).toBeLessThanOrEqual(100);
    });

    it('should handle companies with array fields', () => {
      const companyWithArrays: Company = {
        id: 'test',
        name: 'Array Company',
        country: 'United States',
        type: 'game_developer',
        industry: ['gaming', 'mobile', 'entertainment'],
        platforms: ['ios', 'android', 'web'],
        technologies: ['unity', 'c#', 'javascript'],
        capabilities: ['development', 'design'],
        needs: ['publishing', 'marketing'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'manual'
      };

      const completeness = uploadProcessor.calculateProfileCompleteness(companyWithArrays);

      expect(completeness).toBeGreaterThan(0);
      expect(completeness).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed CSV data', async () => {
      const malformedData = [
        {
          'Company Name': 'Test Company',
          'Country': 'United States',
          'Invalid JSON': '{"broken": json}'
        }
      ];

      const request: UploadRequest = {
        filename: 'malformed.csv',
        data: malformedData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      // Should not crash, even with malformed data
      expect(response).toBeDefined();
    });

    it('should handle special characters in company names', async () => {
      const specialCharData = [
        {
          'Company Name': 'Spëcïål Çhâr & Co. (Ltd.)',
          'Country': 'United States'
        }
      ];

      const request: UploadRequest = {
        filename: 'special.csv',
        data: specialCharData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response.ingestLog.status).toBe('completed');
    });

    it('should handle very long field values', async () => {
      const longDescription = 'A'.repeat(10000);

      const longFieldData = [
        {
          'Company Name': 'Long Field Company',
          'Country': 'United States',
          'Description': longDescription
        }
      ];

      const request: UploadRequest = {
        filename: 'long.csv',
        data: longFieldData,
        validateOnly: true
      };

      const response: UploadResponse = await uploadProcessor.processUpload(request);

      expect(response).toBeDefined();
    });
  });
});