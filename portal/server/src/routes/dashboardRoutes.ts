import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { DashboardDataService } from '../services/dashboardDataService';
import { ClientDataRepository } from '../repositories/clientDataRepository';
import { DashboardFilters } from '../types';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/client-data/:tab
router.get('/client-data/:tab', async (req: Request, res: Response) => {
  try {
    const { tab } = req.params;
    const quarter = req.query.quarter as string | undefined;

    switch (tab) {
      case 'weekly': {
        const rows = ClientDataRepository.getWeeklyTimeSeries(quarter);
        const quarters = ClientDataRepository.getWeeklyTimeSeriesQuarters();
        res.json({ rows, quarters });
        return;
      }
      case 'financial': {
        const rows = ClientDataRepository.getFinancialTargets();
        res.json({ rows });
        return;
      }
      case 'nx': {
        const rows = ClientDataRepository.getNxResults();
        res.json({ rows });
        return;
      }
      case 'pi': {
        const rows = ClientDataRepository.getPiResults();
        res.json({ rows });
        return;
      }
      default:
        res.status(400).json({ error: 'Unknown tab: ' + tab });
    }
  } catch (err) {
    console.error('[Dashboard /client-data error]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/data
router.get('/data', async (req: Request, res: Response) => {
  try {
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

    const data = await DashboardDataService.getDashboardData(
      req.user!.id,
      req.user!.role,
      filters
    );
    res.json(data);
  } catch (err) {
    console.error('[Dashboard /data error]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/filters
router.get('/filters', async (req: Request, res: Response) => {
  try {
    const options = await DashboardDataService.getFilterOptions(req.user!.role);
    res.json(options);
  } catch (err) {
    console.error('[Dashboard /filters error]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
