import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function getcalendarview(req: Request, res: Response) {
if (req.path === "/calendar/getcalendarview") {
  try {
    const result = await getCalendarView(req.query, db);
    res.json(result);
  } catch (error) {
    res.json(getCalendarFallback());
  }
  return;
}

}
