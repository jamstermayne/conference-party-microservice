import * as admin from "firebase-admin";
declare const db: admin.firestore.Firestore;
export declare const col: {
    users: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    invites: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    tokens: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    edges: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    contacts: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    calendar: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    eventsCache: () => admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
};
export default db;
//# sourceMappingURL=db.d.ts.map