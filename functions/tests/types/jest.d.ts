/**
 * Custom Jest matcher type definitions
 */

declare namespace jest {
  interface Matchers<R> {
    toBeOneOf(expected: any[]): R;
    toMatchAPIContract(expectedContract: any): R;
    toHaveSecurityHeaders(): R;
    toBeWithinPerformanceBudget(budget: number): R;
    toHaveValidPagination(): R;
    toBeValidEventData(): R;
    toHaveNoSecurityVulnerabilities(): R;
    toRespondWithinSLA(slaConfig: Record<string, number>): R;
    toHaveReasonableCacheHeaders(): R;
  }
}

// Extend global expect for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
      toMatchAPIContract(expectedContract: any): R;
      toHaveSecurityHeaders(): R;
      toBeWithinPerformanceBudget(budget: number): R;
      toHaveValidPagination(): R;
      toBeValidEventData(): R;
      toHaveNoSecurityVulnerabilities(): R;
      toRespondWithinSLA(slaConfig: Record<string, number>): R;
      toHaveReasonableCacheHeaders(): R;
    }
  }
}

export {};
