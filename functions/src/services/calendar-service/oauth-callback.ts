import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function oauthCallback(req: Request, res: Response) {
if (req.path === "/calendar/oauth/callback") {
  try {
    const { code, userId } = req.query;
    const result = await handleOAuthCallback(code as string, userId as string, db);
    res.json(result);
  } catch (error) {
    logger.error("OAuth callback error:", error);
    res.json({
      success: false,
      error: 'Calendar connection failed',
      fallback: {
        message: 'Please try connecting your calendar again'
      }
    });
  }
  return;
}

}
