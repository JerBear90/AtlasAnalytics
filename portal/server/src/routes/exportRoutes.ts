import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { ExportService, ExportError } from '../services/exportService';
import { ExportFormat, DashboardFilters } from '../types';

const router = Router();

router.use(authMiddleware);

// GET /api/export/:format
router.get('/:format', async (req: Request, res: Response) => {
  try {
    const format = req.params.format as ExportFormat;
    const validFormats: ExportFormat[] = ['csv', 'json', 'all'];
    if (!validFormats.includes(format)) {
      res.status(400).json({ error: `Invalid format. Must be one of: ${validFormats.join(', ')}` });
      return;
    }

    const filters: DashboardFilters = {};
    if (req.query.quarter) {
      filters.quarter = req.query.quarter as string;
    }
    if (req.query.countries) {
      filters.countries = (req.query.countries as string).split(',').map(c => c.trim());
    }
    if (req.query.startDate && req.query.endDate) {
      filters.dateRange = {
        start: new Date(req.query.startDate as string),
        end: new Date(req.query.endDate as string),
      };
    }

    const tab = req.query.tab as string | undefined;

    const result = await ExportService.exportData(
      req.user!.id,
      req.user!.role,
      format,
      filters,
      tab
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (err) {
    if (err instanceof ExportError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

export default router;
