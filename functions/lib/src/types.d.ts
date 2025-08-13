export type User = {
    uid: string;
    email: string;
    name?: string;
    photo?: string;
    company?: string;
    role?: string;
    admin?: boolean;
    invitesRemaining?: number;
    invitesGranted?: number;
    invitesRedeemed?: number;
    createdAt: number;
    updatedAt: number;
};
export type Invite = {
    id: string;
    senderUid: string;
    senderEmail: string;
    recipientEmail?: string;
    token: string;
    status: "sent" | "redeemed";
    sentAt: number;
    redeemedAt?: number;
    redeemedByUid?: string;
    redeemedByEmail?: string;
};
export type InviteToken = {
    token: string;
    inviteId: string;
    senderUid: string;
    used: boolean;
    usedAt?: number;
    usedByUid?: string;
    usedByEmail?: string;
};
export type InviteEdge = {
    id: string;
    fromUid: string;
    toUid: string;
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
    startTs: number;
    endTs: number;
    createdAt: number;
};
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
};
//# sourceMappingURL=types.d.ts.map