/**
 * 🧪 FIREBASE & EXTERNAL SERVICE MOCKS
 * Comprehensive mocking for Firebase, Google APIs, and external dependencies
 */
export declare const mockParty: {
    id: string;
    'Event Name': string;
    Date: string;
    'Start Time': string;
    'End Time': string;
    Address: string;
    Hosts: string;
    Category: string;
    Price: string;
    Focus: string;
    active: boolean;
    source: string;
    uploadedAt: string;
};
export declare const mockParties: {
    id: string;
    'Event Name': string;
    Date: string;
    'Start Time': string;
    'End Time': string;
    Address: string;
    Hosts: string;
    Category: string;
    Price: string;
    Focus: string;
    active: boolean;
    source: string;
    uploadedAt: string;
}[];
export declare const createMockRequest: (options?: {
    method?: string;
    path?: string;
    body?: any;
    query?: any;
    headers?: any;
}) => {
    method: string;
    path: string;
    body: any;
    query: any;
    headers: any;
};
export declare const createMockResponse: () => any;
//# sourceMappingURL=mocks.d.ts.map