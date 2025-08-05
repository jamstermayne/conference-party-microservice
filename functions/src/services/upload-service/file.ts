import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

export async function file(req: Request, res: Response) {
if (req.path === "/upload/file" && req.method === "POST") {
  try {
    const fileData = await handleFileUpload(req, storage);
    const fileRef = db.collection('uploads').doc(fileData.id);
    await fileRef.set({
      ...fileData,
      status: 'uploaded',
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      file: fileData,
      message: 'File uploaded successfully',
      nextSteps: {
        process: `/api/upload/process/${fileData.id}`,
        status: `/api/upload/status/${fileData.id}`
      }
    });
  } catch (error) {
    logger.error("File upload error:", error);
    const errorMessage = error instanceof Error ? error.message : 'File upload processing failed';
    res.status(400).json({
      success: false,
      error: 'Upload failed',
      message: errorMessage,
      accepted: ['PDF', 'CSV', 'XLS', 'XLSX'],
      limits: {
        maxSize: '10MB',
        maxFiles: 1
      }
    });
  }
  return;
}

}
