/**
 * GPT-5 FOUNDATION TEST UTILITIES
 * Comprehensive test helpers and mocks
 */
import { Request, Response } from "express";
export declare class MockRequestBuilder {
    private request;
    method(method: string): MockRequestBuilder;
    path(path: string): MockRequestBuilder;
    origin(origin: string): MockRequestBuilder;
    header(key: string, value: string): MockRequestBuilder;
    query(query: Record<string, any>): MockRequestBuilder;
    body(body: Record<string, any>): MockRequestBuilder;
    build(): Partial<Request>;
}
export declare class MockResponseBuilder {
    private jsonMock;
    private statusMock;
    private setHeaderMock;
    private sendMock;
    constructor();
    build(): {
        res: Partial<Response>;
        mocks: ResponseMocks;
    };
}
export interface ResponseMocks {
    json: jest.Mock;
    status: jest.Mock;
    setHeader: jest.Mock;
    send: jest.Mock;
}
export declare const TestData: {
    validInviteCodes: string[];
    invalidInviteCodes: string[];
    allowedOrigins: string[];
    blockedOrigins: string[];
    healthResponse: {
        status: string;
        version: string;
        environment: any;
        responseTime: any;
        timestamp: any;
        cors: any;
    };
    inviteValidResponse: {
        valid: boolean;
        inviterId: any;
        inviterName: any;
    };
    inviteInvalidResponse: {
        valid: boolean;
        reason: string;
    };
    notFoundResponse: {
        success: boolean;
        error: string;
        availableEndpoints: string[];
        timestamp: any;
    };
};
export declare class PerformanceTestHelper {
    static measureResponseTime<T>(operation: () => Promise<T>): Promise<{
        result: T;
        time: number;
    }>;
    static expectFastResponse(time: number, threshold?: number): void;
    static benchmarkOperation<T>(operation: () => Promise<T>, iterations?: number): Promise<{
        avg: number;
        min: number;
        max: number;
        times: number[];
    }>;
}
export declare class CorsTestHelper {
    static expectCorsHeaders(setHeaderMock: jest.Mock): void;
    static expectOriginAllowed(setHeaderMock: jest.Mock, origin: string): void;
    static expectPreflightResponse(statusMock: jest.Mock, sendMock: jest.Mock): void;
}
export declare class ErrorTestHelper {
    static expectNotFound(statusMock: jest.Mock, jsonMock: jest.Mock): void;
    static expectInternalError(statusMock: jest.Mock, jsonMock: jest.Mock): void;
}
export declare class SnapshotTestHelper {
    static sanitizeResponse(response: any): any;
    static expectResponseSnapshot(jsonMock: jest.Mock, testName: string): void;
}
export declare class IntegrationTestHelper {
    static testEndpoint(api: (...args: any[]) => any, request: Partial<Request>, expectedStatus?: number): Promise<{
        mocks: ResponseMocks;
        response: any;
    }>;
    static testHealthEndpoint(api: (...args: any[]) => any): Promise<any>;
    static testInviteValidation(api: (...args: any[]) => any, code: string, expectedValid: boolean): Promise<any>;
}
export declare class TestSuiteBuilder {
    private suite;
    private tests;
    constructor(suite: string);
    addHealthTests(): TestSuiteBuilder;
    addCorsTests(): TestSuiteBuilder;
    addPerformanceTests(): TestSuiteBuilder;
    build(): void;
}
export declare const mockRequest: () => MockRequestBuilder;
export declare const mockResponse: () => MockResponseBuilder;
export declare const performance: typeof PerformanceTestHelper;
export declare const cors: typeof CorsTestHelper;
export declare const errors: typeof ErrorTestHelper;
export declare const snapshots: typeof SnapshotTestHelper;
export declare const integration: typeof IntegrationTestHelper;
//# sourceMappingURL=test-utilities.d.ts.map