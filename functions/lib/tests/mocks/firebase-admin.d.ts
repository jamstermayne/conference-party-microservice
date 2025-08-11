/**
 * 🔥 Firebase Admin Mock for Testing
 */
export declare const admin: {
    initializeApp: jest.Mock<{
        firestore: jest.Mock<{
            collection: jest.Mock<{
                doc: jest.Mock<{
                    get: jest.Mock<Promise<{
                        exists: boolean;
                        data: () => {
                            name: string;
                            venue: string;
                            datetime: string;
                        };
                    }>, [], any>;
                    set: jest.Mock<Promise<void>, [], any>;
                    update: jest.Mock<Promise<void>, [], any>;
                    delete: jest.Mock<Promise<void>, [], any>;
                }, [], any>;
                where: jest.Mock<any, any, any>;
                orderBy: jest.Mock<any, any, any>;
                limit: jest.Mock<any, any, any>;
                get: jest.Mock<Promise<{
                    docs: {
                        id: string;
                        data: () => {
                            name: string;
                            venue: string;
                        };
                    }[];
                }>, [], any>;
                add: jest.Mock<Promise<{
                    id: string;
                }>, [], any>;
            }, [], any>;
            batch: jest.Mock<{
                set: jest.Mock<any, any, any>;
                update: jest.Mock<any, any, any>;
                delete: jest.Mock<any, any, any>;
                commit: jest.Mock<Promise<void>, [], any>;
            }, [], any>;
        }, [], any>;
        auth: jest.Mock<{
            verifyIdToken: jest.Mock<Promise<{
                uid: string;
                email: string;
            }>, [], any>;
            createUser: jest.Mock<Promise<{
                uid: string;
            }>, [], any>;
            getUserByEmail: jest.Mock<Promise<{
                uid: string;
                email: string;
            }>, [], any>;
        }, [], any>;
    }, [], any>;
    credential: {
        applicationDefault: jest.Mock<any, any, any>;
        cert: jest.Mock<any, any, any>;
    };
    firestore: jest.Mock<{
        collection: jest.Mock<{
            doc: jest.Mock<{
                get: jest.Mock<Promise<{
                    exists: boolean;
                    data: () => {
                        name: string;
                        venue: string;
                        datetime: string;
                    };
                }>, [], any>;
                set: jest.Mock<Promise<void>, [], any>;
                update: jest.Mock<Promise<void>, [], any>;
                delete: jest.Mock<Promise<void>, [], any>;
            }, [], any>;
            where: jest.Mock<any, any, any>;
            orderBy: jest.Mock<any, any, any>;
            limit: jest.Mock<any, any, any>;
            get: jest.Mock<Promise<{
                docs: {
                    id: string;
                    data: () => {
                        name: string;
                        venue: string;
                    };
                }[];
            }>, [], any>;
            add: jest.Mock<Promise<{
                id: string;
            }>, [], any>;
        }, [], any>;
        batch: jest.Mock<{
            set: jest.Mock<any, any, any>;
            update: jest.Mock<any, any, any>;
            delete: jest.Mock<any, any, any>;
            commit: jest.Mock<Promise<void>, [], any>;
        }, [], any>;
    }, [], any>;
    auth: jest.Mock<{
        verifyIdToken: jest.Mock<Promise<{
            uid: string;
            email: string;
        }>, [], any>;
        createUser: jest.Mock<Promise<{
            uid: string;
        }>, [], any>;
        getUserByEmail: jest.Mock<Promise<{
            uid: string;
            email: string;
        }>, [], any>;
    }, [], any>;
    app: jest.Mock<{
        firestore: jest.Mock<{
            collection: jest.Mock<{
                doc: jest.Mock<{
                    get: jest.Mock<Promise<{
                        exists: boolean;
                        data: () => {
                            name: string;
                            venue: string;
                            datetime: string;
                        };
                    }>, [], any>;
                    set: jest.Mock<Promise<void>, [], any>;
                    update: jest.Mock<Promise<void>, [], any>;
                    delete: jest.Mock<Promise<void>, [], any>;
                }, [], any>;
                where: jest.Mock<any, any, any>;
                orderBy: jest.Mock<any, any, any>;
                limit: jest.Mock<any, any, any>;
                get: jest.Mock<Promise<{
                    docs: {
                        id: string;
                        data: () => {
                            name: string;
                            venue: string;
                        };
                    }[];
                }>, [], any>;
                add: jest.Mock<Promise<{
                    id: string;
                }>, [], any>;
            }, [], any>;
            batch: jest.Mock<{
                set: jest.Mock<any, any, any>;
                update: jest.Mock<any, any, any>;
                delete: jest.Mock<any, any, any>;
                commit: jest.Mock<Promise<void>, [], any>;
            }, [], any>;
        }, [], any>;
        auth: jest.Mock<{
            verifyIdToken: jest.Mock<Promise<{
                uid: string;
                email: string;
            }>, [], any>;
            createUser: jest.Mock<Promise<{
                uid: string;
            }>, [], any>;
            getUserByEmail: jest.Mock<Promise<{
                uid: string;
                email: string;
            }>, [], any>;
        }, [], any>;
    }, [], any>;
};
export default admin;
//# sourceMappingURL=firebase-admin.d.ts.map