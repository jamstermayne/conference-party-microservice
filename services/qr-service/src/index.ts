import { onRequest } from "firebase-functions/v2/https";
import express, { Request, Response } from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import QRCode from "qrcode";

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://conference-party-app.web.app',
    'https://conference-party-app--preview-*.web.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173'
  ],
  credentials: true,
  maxAge: 86400
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(morgan('tiny', { skip: (req) => req.path === '/health' }));
app.use(express.json());

// Health check (1 function, 1 thing: health monitoring)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "qr-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      health: "operational",
      generate: "operational",
      batch: "operational",
      vcard: "operational",
      event: "operational"
    }
  });
});

// Generate QR code (1 function, 1 thing: QR generation)
app.get("/generate", async (req: Request, res: Response): Promise<any> => {
  try {
    const { text, format = 'png', size = 200 } = req.query;

    if (!text) {
      return res.status(400).json({
        error: "Text parameter is required"
      });
    }

    const options = {
      width: parseInt(size as string),
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(text as string, {
        ...options,
        type: 'svg'
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    } else if (format === 'dataurl') {
      const dataUrl = await QRCode.toDataURL(text as string, options);
      return res.json({ success: true, dataUrl });
    } else {
      const buffer = await QRCode.toBuffer(text as string, options);
      res.setHeader('Content-Type', 'image/png');
      return res.send(buffer);
    }

  } catch (error) {
    console.error('[QR] Generate error:', error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// Generate batch QR codes (1 function, 1 thing: batch generation)
app.post("/batch", async (req: Request, res: Response): Promise<any> => {
  try {
    const { items, format = 'dataurl', size = 200 } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Items array is required"
      });
    }

    const options = {
      width: size,
      margin: 1
    };

    const results = await Promise.all(
      items.map(async (item: any) => {
        try {
          const dataUrl = await QRCode.toDataURL(item.text || item, options);
          return {
            id: item.id || item.text || item,
            success: true,
            dataUrl
          };
        } catch (error: any) {
          return {
            id: item.id || item.text || item,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.status(200).json({
      success: true,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('[QR] Batch error:', error);
    res.status(500).json({ error: "Failed to generate batch QR codes" });
  }
});

// Generate vCard QR code (1 function, 1 thing: vCard generation)
app.post("/vcard", async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, phone, company, title, website } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Name is required for vCard"
      });
    }

    // Build vCard string
    let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
    vcard += `FN:${name}\n`;
    if (email) vcard += `EMAIL:${email}\n`;
    if (phone) vcard += `TEL:${phone}\n`;
    if (company) vcard += `ORG:${company}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (website) vcard += `URL:${website}\n`;
    vcard += "END:VCARD";

    const dataUrl = await QRCode.toDataURL(vcard, {
      width: 300,
      margin: 1
    });

    res.status(200).json({
      success: true,
      type: "vcard",
      dataUrl,
      raw: vcard
    });

  } catch (error) {
    console.error('[QR] vCard error:', error);
    res.status(500).json({ error: "Failed to generate vCard QR code" });
  }
});

// Generate event QR code (1 function, 1 thing: event QR generation)
app.post("/event", async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, location, start, end, description } = req.body;

    if (!title || !start) {
      return res.status(400).json({
        error: "Title and start time are required for event"
      });
    }

    // Build calendar event string (simplified iCal format)
    let event = "BEGIN:VEVENT\n";
    event += `SUMMARY:${title}\n`;
    if (location) event += `LOCATION:${location}\n`;
    event += `DTSTART:${start}\n`;
    if (end) event += `DTEND:${end}\n`;
    if (description) event += `DESCRIPTION:${description}\n`;
    event += "END:VEVENT";

    const dataUrl = await QRCode.toDataURL(event, {
      width: 300,
      margin: 1
    });

    res.status(200).json({
      success: true,
      type: "event",
      dataUrl,
      raw: event
    });

  } catch (error) {
    console.error('[QR] Event error:', error);
    res.status(500).json({ error: "Failed to generate event QR code" });
  }
});

// Export the function
export const qrService = onRequest({
  region: 'us-central1',
  cors: true,
  invoker: "public",
  maxInstances: 5,
}, app);