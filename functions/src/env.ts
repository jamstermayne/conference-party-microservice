export const ENV = {
  ADMIN_EMAILS: process.env["ADMIN_EMAILS"] || "jamynigri@gmail.com",
  INVITES_GRANT_ON_REDEEM: Number(process.env["INVITES_GRANT_ON_REDEEM"] || 11),
  FEATURES: {
    INVITES: true,
    CONTACTS: true,
    CALENDAR: true,
  }
};