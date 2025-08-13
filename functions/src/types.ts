export type User = {
  uid: string;
  email: string;
  name?: string;
  photo?: string;
  company?: string;
  role?: string;
  admin?: boolean;
  invitesRemaining?: number;  // decremented on send (except admin)
  invitesGranted?: number;    // cumulative granted to this user
  invitesRedeemed?: number;   // how many people redeemed their tokens from this user
  createdAt: number;
  updatedAt: number;
};

export type Invite = {
  id: string;                // doc id
  senderUid: string;
  senderEmail: string;
  recipientEmail?: string;   // optional until redeemed
  token: string;             // single-use token code
  status: "sent"|"redeemed";
  sentAt: number;
  redeemedAt?: number;
  redeemedByUid?: string;
  redeemedByEmail?: string;
};

export type InviteToken = {
  token: string;             // single-use code (dup of invite.token for fast lookup)
  inviteId: string;          // backref to Invite
  senderUid: string;
  used: boolean;
  usedAt?: number;
  usedByUid?: string;
  usedByEmail?: string;
};

export type InviteEdge = {
  id: string;                // doc id
  fromUid: string;           // sender
  toUid: string;             // recipient
  inviteId: string;
  createdAt: number;
};

export type ContactsSync = {
  uid: string;
  count: number;
  lastSyncedAt: number;
};

export type CalendarSave = {
  uid: string;
  eventId: string;
  title: string;
  venue: string;
  startTs: number; // ms
  endTs: number;   // ms
  createdAt: number;
};

export type ApiResponse<T=unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};