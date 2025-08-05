import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function testConnection(req: Request, res: Response) {
if (req.path === "/calendar/test-connection") {
  try {
    const { userId } = req.query;
    const result = await simulateCalendarConnection(userId as string || 'test-user', db);
    res.json(result);
  } catch (error) {
    logger.error("Test connection error:", error);
    res.json({
      success: false,
      error: 'Test connection failed'
    });
  }
  return;
}

}
