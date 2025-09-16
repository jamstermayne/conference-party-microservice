/**
 * Next-Level Matchmaking Engine - Type Definitions
 * Company-to-company matching with explainability
 */

import { Timestamp } from 'firebase-admin/firestore';

// Company entity
export interface Company {
  id: string;
  slug: string;
  name: string;
  stage: 'Startup' | 'Scale' | 'Enterprise';
  categories: string[];
  platforms: string[];
  markets: string[];
  capabilities: string[];
  needs: string[];
  tags: string[];
  website?: string;
  logoUrl?: string;
  text: {
    title?: string;
    description?: string;
    abstract?: string;
    sentence1?: string;
    sentence2?: string;
  };
  numeric: {
    rating?: number;
    price?: number;
    cost?: number;
    team?: number;
    float1?: number;
    float2?: number;
    int1?: number;
  };
  dates: {
    created?: Timestamp;
    updated?: Timestamp;
    released?: Timestamp;
  };
  lists: {
    stringList1?: string[];
    intList1?: number[];
    platforms?: string[];
    tags?: string[];
  };
  sources: {
    mysCompanyId?: string;
    sourceUrl?: string;
  };
  updatedAt: Timestamp;
  embedding?: number[];
}

// Weight profile for matching
export interface WeightProfile {
  profileId: string;
  weights: Record<string, number>;
  normalize: {
    method: 'zexp' | 'zscore' | 'minmax';
    temperature?: number;
  };
  topN: number;
  threshold: number;
}

// Match result between two companies
export interface Match {
  edgeId: string;
  a: string;
  b: string;
  score: number;
  metrics: Record<string, number>;
  weights: Record<string, number>;
  contributions: Contribution[];
  reasons: string[];
  confidence: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Contribution breakdown
export interface Contribution {
  key: string;
  value: number;
  weight: number;
  contribution: number;
  displayName?: string;
}

// Ingest log for uploads
export interface IngestLog {
  uploadId: string;
  rowIdx: number;
  status: 'created' | 'updated' | 'skipped' | 'error' | 'dry-run';
  companyId?: string;
  slug?: string;
  errors?: string[];
  diff?: Record<string, any>;
  timestamp: Timestamp;
}

// Signal types for metrics
export type SignalType = 'date' | 'list' | 'num' | 'str' | 'text' | 'bipartite' | 'context';

// Metric definition
export interface Metric {
  type: SignalType;
  field: string;
  method: string;
  weight?: number;
  params?: Record<string, any>;
}

// Upload configuration
export interface UploadConfig {
  dryRun: boolean;
  mapping: Record<string, string>;
  skipDuplicates: boolean;
  mergeStrategy: 'replace' | 'merge' | 'skip';
  validate: boolean;
}

// Taxonomy analysis result
export interface TaxonomyAnalysis {
  heatmap: {
    capabilities: string[];
    needs: string[];
    matrix: number[][];
  };
  clusters: {
    nodes: Array<{ id: string; name: string; group: number }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  distributions: {
    platforms: Record<string, number>;
    markets: Record<string, number>;
    stages: Record<string, number>;
    categories: Record<string, number>;
  };
}

// Match request parameters
export interface MatchRequest {
  companyId?: string;
  companies?: string[];
  profileId?: string;
  limit?: number;
  threshold?: number;
  includeMetrics?: boolean;
  includeReasons?: boolean;
  filters?: {
    platforms?: string[];
    markets?: string[];
    stages?: string[];
    categories?: string[];
  };
}

// Batch operation result
export interface BatchResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
  duration: number;
}

// Admin user with role
export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'viewer' | 'editor';
  permissions: string[];
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

// System configuration
export interface SystemConfig {
  enableEmbeddings: boolean;
  maxCompaniesPerMatch: number;
  maxMatchesPerCompany: number;
  cacheTimeout: number;
  batchSize: number;
  defaultProfileId: string;
  superAdmins: string[];
}