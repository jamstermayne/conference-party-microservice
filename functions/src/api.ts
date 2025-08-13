import express from "express";
import cors from "cors";
import * as admin from "firebase-admin";
import { customAlphabet } from "nanoid";
import db, {col} from "./db";
import {ApiResponse, User, Invite, CalendarSave, InviteToken, InviteEdge} from "./types";
import {isAdminEmail, getUserFromAuth} from "./auth";
import {ENV} from "./env";
import { getMyInvites, generateInvites, redeemInvite, getMe } from './invites';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// id helpers
const nanoToken = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 10); // no 0/O/1/I

// responses
function ok<T>(res: express.Response, data: T) {
  const body: ApiResponse<T> = { success: true, data };
  return res.status(200).json(body);
}
function bad(res: express.Response, code: number, msg: string) {
  const body: ApiResponse = { success: false, error: msg };
  return res.status(code).json(body);
}

// bootstrap admin + user doc
async function ensureUser(uid: string, email: string|null) {
  const ref = col.users().doc(uid);
  const snap = await ref.get();
  const adminFlag = isAdminEmail(email);
  const now = Date.now();
  if (!snap.exists) {
    const u: User = {
      uid, email: email||"", admin: adminFlag, createdAt: now, updatedAt: now,
      invitesRemaining: adminFlag ? 999999 : 11,  // new users get 11 by default if not admin
      invitesGranted: adminFlag ? 999999 : 11,
      invitesRedeemed: 0
    };
    await ref.set(u, { merge: true });
    return u;
  } else {
    const u = snap.data() as User;
    const merged: User = {
      ...u,
      admin: adminFlag || u.admin || false,
      invitesRemaining: (u.invitesRemaining ?? (adminFlag ? 999999 : 11)),
      invitesGranted: (u.invitesGranted ?? (adminFlag ? 999999 : 11)),
      invitesRedeemed: (u.invitesRedeemed ?? 0),
      updatedAt: now
    };
    await ref.set(merged, { merge: true });
    return merged;
  }
}

// -- common replies
app.get("/health", (_req: express.Request, res: express.Response)=> ok(res, {
  status: "healthy",
  version: "3.1.0",
  endpoints: ["user","invites","contacts","calendar","admin","events"]
}));

// -- user
app.get("/user/me", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");
  const u = await ensureUser(auth.uid, auth.email);
  return ok(res, u);
});

// ===== INVITES =====
// Single-use tokens, admin unlimited, grant 11 to redeemer.

async function decrementQuotaIfNeeded(sender: User) {
  if (sender.admin) return sender; // unlimited
  const ref = col.users().doc(sender.uid);
  // Decrement atomically to avoid race conditions
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const u = snap.data() as User;
    if ((u.invitesRemaining ?? 0) <= 0) throw new Error("NO_QUOTA");
    tx.set(ref, {
      invitesRemaining: (u.invitesRemaining ?? 0) - 1,
      updatedAt: Date.now()
    }, { merge: true });
  });
  const updated = (await ref.get()).data() as User;
  return updated;
}


// Send (generate token + invite record). Optional recipientEmail
app.post("/invites/send", async (req: express.Request, res: express.Response)=>{
  if (!ENV.FEATURES.INVITES) return bad(res, 403, "Invites disabled");
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");

  const sender = await ensureUser(auth.uid, auth.email);
  try { await decrementQuotaIfNeeded(sender); }
  catch(e:any){ return bad(res, 403, e.message === "NO_QUOTA" ? "No invites remaining" : "Invite error"); }

  const token = nanoToken();
  const invite: Invite = {
    id: "",
    senderUid: sender.uid,
    senderEmail: sender.email || "",
    recipientEmail: req.body?.recipientEmail || undefined,
    token,
    status: "sent",
    sentAt: Date.now()
  };

  const invRef = await col.invites().add(invite);
  invite.id = invRef.id;
  await invRef.set(invite, { merge: true });

  const tok: InviteToken = {
    token, inviteId: invite.id, senderUid: sender.uid, used: false
  };
  await col.tokens().doc(token).set(tok);

  // Return shareable deep link (frontend catches /redeem?token=)
  return ok(res, { invite, link: `/redeem?token=${token}` });
});

// Redeem (single-use)
app.post("/invites/redeem", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");

  const { token } = req.body || {};
  if (!token) return bad(res, 400, "token required");

  const tokRef = col.tokens().doc(token);
  const invQuery = await tokRef.get();
  if (!invQuery.exists) return bad(res, 404, "Invalid token");

  const tok = invQuery.data() as InviteToken;
  if (tok.used) return bad(res, 409, "Token already used");

  const now = Date.now();
  // atomically mark used + update invite + connect edge + grant 11 to redeemer + bump sender redeemed count
  await db.runTransaction(async tx=>{
    const tSnap = await tx.get(tokRef);
    const t = tSnap.data() as InviteToken;
    if (t.used) throw new Error("ALREADY_USED");

    const invRef = col.invites().doc(t.inviteId);
    const invSnap = await tx.get(invRef);
    if (!invSnap.exists) throw new Error("INVITE_MISSING");

    const invite = invSnap.data() as Invite;

    // mark token used
    tx.set(tokRef, { used:true, usedAt: now, usedByUid: auth.uid, usedByEmail: auth.email||"" }, { merge: true });

    // update invite doc
    tx.set(invRef, {
      status: "redeemed",
      redeemedAt: now,
      redeemedByUid: auth.uid,
      redeemedByEmail: auth.email||""
    }, { merge: true });

    // edge
    const edgeRef = col.edges().doc();
    const edge: InviteEdge = {
      id: edgeRef.id, fromUid: invite.senderUid, toUid: auth.uid, inviteId: invRef.id, createdAt: now
    };
    tx.set(edgeRef, edge);

    // grant 11 (configurable) to redeemer
    const grant = ENV.INVITES_GRANT_ON_REDEEM;
    const redeemerRef = col.users().doc(auth.uid);
    tx.set(redeemerRef, {
      invitesRemaining: admin.firestore.FieldValue.increment(grant),
      invitesGranted: admin.firestore.FieldValue.increment(grant),
      updatedAt: now
    }, { merge: true });

    // increment sender's redeemed count
    const senderRef = col.users().doc(invite.senderUid);
    tx.set(senderRef, {
      invitesRedeemed: admin.firestore.FieldValue.increment(1),
      updatedAt: now
    }, { merge: true });
  }).catch((e:any)=>{
    if (e?.message === "ALREADY_USED") return;
    throw e;
  });

  const me = await ensureUser(auth.uid, auth.email);
  return ok(res, { token, redeemedBy: { uid: me.uid, email: me.email }, invitesRemaining: me.invitesRemaining });
});

// Mine (sent invites + quick stats)
app.get("/invites/mine", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");
  const mine = await col.invites().where("senderUid","==",auth.uid).orderBy("sentAt","desc").limit(100).get();
  const items = mine.docs.map(d=>({ id:d.id, ...(d.data()) }));
  const meSnap = await col.users().doc(auth.uid).get();
  const me = meSnap.data() as User;
  return ok(res, { invites: items, quota: { remaining: me.invitesRemaining ?? 0, granted: me.invitesGranted ?? 0, redeemed: me.invitesRedeemed ?? 0 }});
});

// ===== CONTACTS =====
app.post("/contacts/synced", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");
  const { count=0 } = req.body || {};
  await col.contacts().doc(auth.uid).set({ uid: auth.uid, count, lastSyncedAt: Date.now() }, { merge: true });
  return ok(res, { uid: auth.uid, count });
});

// ===== CALENDAR =====
app.post("/calendar/save", async (req: express.Request, res: express.Response)=>{
  if (!ENV.FEATURES.CALENDAR) return bad(res, 403, "Calendar disabled");
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");

  const { eventId, title, venue, startTs, endTs } = req.body || {};
  if (!eventId || !title || !startTs || !endTs) return bad(res, 400, "Missing fields");

  const row: CalendarSave = { uid: auth.uid, eventId, title, venue, startTs, endTs, createdAt: Date.now() };
  await col.calendar().add(row);
  return ok(res, row);
});

// ===== EVENTS (cache fallback) =====
app.get("/events", async (_req: express.Request, res: express.Response)=>{
  const qs = await col.eventsCache().limit(50).get();
  if (!qs.empty) return ok(res, qs.docs.map(d=>d.data()));
  return ok(res, [
    { id:"meettomatch-the-cologne-edition-2025", title:"MeetToMatch The Cologne Edition 2025", venue:"Kölnmesse Confex", date:"Fri Aug 22", time:"09:00 - 18:00", price:"From £127.04" },
    { id:"marriott-rooftop-mixer", title:"Marriott Rooftop Mixer", venue:"Marriott Hotel", date:"Fri Aug 22", time:"20:00 - 23:30", price:"Free" }
  ]);
});

// ===== ADMIN =====
app.get("/admin/status", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");
  const uRef = await col.users().doc(auth.uid).get();
  const u = uRef.exists ? (uRef.data() as User) : await ensureUser(auth.uid, auth.email);
  return ok(res, { admin: !!u.admin, email: u.email, invitesRemaining: u.invitesRemaining });
});

app.post("/admin/grant", async (req: express.Request, res: express.Response)=>{
  const auth = await getUserFromAuth(req);
  if (!auth) return bad(res, 401, "Unauthorized");
  const me = await ensureUser(auth.uid, auth.email);
  if (!me.admin) return bad(res, 403, "Admin only");

  const { email } = req.body || {};
  if (!email) return bad(res, 400, "email required");

  const target = await admin.auth().getUserByEmail(email).catch(()=>null);
  if (!target) return bad(res, 404, "Target user not found in Auth");
  await col.users().doc(target.uid).set({ admin: true, invitesRemaining: 999999, invitesGranted: 999999, updatedAt: Date.now() }, { merge: true });
  return ok(res, { email, admin: true });
});

// --- Invites / Account micro-MVP ---
app.get('/invites/mine', getMyInvites);         // ?email=
app.post('/invites/generate', generateInvites); // { email, count }
app.post('/invites/redeem', redeemInvite);      // { code, email, invitedByEmail? }
app.get('/me', getMe);                           // ?email=

export default app;