import express, { Request, Response, Router } from 'express';
import { ScreenshotService } from '../services/screenshot.service';

const router: Router = express.Router();
const screenshotService = new ScreenshotService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const loginData = await screenshotService.captureLoginPage();
    const html = screenshotService.generateLoginHtml(loginData);
    res.send(html);
  } catch (error) {
    console.error('Screenshot route error:', error);
    res.status(500).json({ 
      error: 'Failed to capture login page',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router }; 