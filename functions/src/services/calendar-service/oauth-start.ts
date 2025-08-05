import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function oauthStart(req: Request, res: Response) {
if (req.path === "/calendar/oauth/start") {
  try {
    const authUrl = await startGoogleOAuth();
    res.json({
      success: true,
      data: { authUrl },
      meta: {
        timestamp: new Date().toISOString(),
        function: 'startGoogleOAuth',
        service: 'firebase-calendar-service'
      }
    });
  } catch (error) {
    logger.error("OAuth start error:", error);
    res.json({
      success: false,
      error: 'Calendar connection temporarily unavailable',
      fallback: {
        message: 'Try connecting your calendar again in a moment'
      }
    });
  }
  return;
}

}
