import * as admin from "firebase-admin";
const db = admin.firestore();

export const col = {
  users:        () => db.collection("users"),
  invites:      () => db.collection("invites"),
  tokens:       () => db.collection("inviteTokens"),
  edges:        () => db.collection("inviteEdges"),
  contacts:     () => db.collection("contacts"),
  calendar:     () => db.collection("calendar"),
  eventsCache:  () => db.collection("eventsCache"),
};

export default db;