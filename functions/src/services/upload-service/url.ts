import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function url(req: Request, res: Response) {
if (req.path === "/upload/url" && req.method === "POST") {
  try {
    const body = req.body || {};
    const { url } = body;
    
    if (!url) {
      res.status(400).json({
        success: false,
        error: 'URL required',
        format: { url: 'https://example.com/conference-schedule' }
      });
      return;
    }
    
    try {
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        format: { url: 'https://example.com/conference-schedule' }
      });
      return;
    }
    
    const urlInfo = {
      id: Date.now().toString(),
      url: url,
      status: 'processing',
      submittedAt: new Date().toISOString(),
      type: 'url_submission'
    };
    
    const urlRef = db.collection('url_submissions').doc(urlInfo.id);
    await urlRef.set({
      ...urlInfo,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      submission: urlInfo,
      message: 'URL submitted for processing'
    });
  } catch (error) {
    logger.error("URL processing error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process URL submission';
    res.status(500).json({
      success: false,
      error: 'URL processing failed',
      message: errorMessage
    });
  }
  return;
}

}
