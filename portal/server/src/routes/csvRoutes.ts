import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { CSVPipelineService, CSVPipelineError } from '../services/csvPipelineService';
import { IngestionRepository } from '../repositories/ingestionRepository';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All CSV routes require auth + admin
router.use(authMiddleware);
router.use(requireAdmin);

// POST /api/csv/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'CSV file is required.' });
      return;
    }
    const result = await CSVPipelineService.ingestCSV(
      req.file.buffer,
      req.file.originalname,
      req.user!.id
    );
    res.status(result.success ? 200 : 207).json(result);
  } catch (err) {
    if (err instanceof CSVPipelineError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

// GET /api/csv/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const history = await IngestionRepository.getHistory(page, pageSize);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
