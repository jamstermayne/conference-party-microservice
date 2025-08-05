import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function synccalendar(req: Request, res: Response) {
if (req.path === "/calendar/synccalendar") {
  try {
    const result = await syncCalendar(req.query, db);
    res.json(result);
  } catch (error) {
    res.json(getSyncFallback());
  }
  return;
}

}
