/**
 * 🔥 Firebase Functions Mock for Testing
 */
export declare const https: {
    onRequest: jest.Mock<any, [handler: any], any>;
    onCall: jest.Mock<any, [handler: any], any>;
};
export declare const firestore: {
    document: jest.Mock<{
        onCreate: jest.Mock<any, any, any>;
        onUpdate: jest.Mock<any, any, any>;
        onDelete: jest.Mock<any, any, any>;
    }, [], any>;
};
export declare const auth: {
    user: jest.Mock<{
        onCreate: jest.Mock<any, any, any>;
        onDelete: jest.Mock<any, any, any>;
    }, [], any>;
};
export declare const config: jest.Mock<{
    firebase: {
        projectId: string;
        databaseURL: string;
    };
    api: {
        key: string;
    };
}, [], any>;
export declare const logger: {
    info: jest.Mock<any, any, any>;
    warn: jest.Mock<any, any, any>;
    error: jest.Mock<any, any, any>;
    debug: jest.Mock<any, any, any>;
};
declare const functions: {
    https: {
        onRequest: jest.Mock<any, [handler: any], any>;
        onCall: jest.Mock<any, [handler: any], any>;
    };
    firestore: {
        document: jest.Mock<{
            onCreate: jest.Mock<any, any, any>;
            onUpdate: jest.Mock<any, any, any>;
            onDelete: jest.Mock<any, any, any>;
        }, [], any>;
    };
    auth: {
        user: jest.Mock<{
            onCreate: jest.Mock<any, any, any>;
            onDelete: jest.Mock<any, any, any>;
        }, [], any>;
    };
    config: jest.Mock<{
        firebase: {
            projectId: string;
            databaseURL: string;
        };
        api: {
            key: string;
        };
    }, [], any>;
    logger: {
        info: jest.Mock<any, any, any>;
        warn: jest.Mock<any, any, any>;
        error: jest.Mock<any, any, any>;
        debug: jest.Mock<any, any, any>;
    };
    region: jest.Mock<any, any, any>;
    runWith: jest.Mock<any, any, any>;
};
export default functions;
//# sourceMappingURL=firebase-functions.d.ts.map