import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import app from "./api";
try { admin.initializeApp(); } catch {}
export const api = functions.https.onRequest(app);