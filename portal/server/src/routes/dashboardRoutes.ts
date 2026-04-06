import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { DashboardDataService } from '../services/dashboardDataService';
import { ClientDataRepository } from '../repositories/clientDataRepository';
import { DashboardFilters } from '../types';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const quarter = req.query.quarter as string | undefined;

    const quarterly = ClientDataRepository.getQuarterlyTimeSeries(startDate, endDate, quarter);
    const nx = ClientDataRepository.getNxResults(startDate, endDate);
    const pi = ClientDataRepository.getPiResults(startDate, endDate);
    const academic = {
      headline: ClientDataRepository.getAcademicGdp('headline', startDate, endDate),
      core: ClientDataRepository.getAcademicGdp('core', startDate, endDate),
      state: ClientDataRepository.getAcademicGdp('state', startDate, endDate),
    };
    const weekly = ClientDataRepository.getWeeklyTimeSeries(quarter);
    const financial = ClientDataRepository.getFinancialTargets();

    // Build chart datasets
    const charts: any[] = [];

    // Quarterly GDP chart (last 20 quarters)
    const recentQ = quarterly.slice(0, 20).reverse();
    if (recentQ.length > 0) {
      charts.push({
        id: 'quarterly_gdp',
        title: 'US GDP vs Atlas Predicted (SAAR)',
        type: 'line',
        labels: recentQ.map(r => r.date2),
        datasets: [
          { label: 'US GDP (SAAR)', data: recentQ.map(r => parseFloat(r.usGdp) || null) },
          { label: 'Atlas Predicted', data: recentQ.map(r => parseFloat(r.atlasPredicted) || null) },
        ],
      });
    }

    // Weekly GDP components (latest quarter)
    const recentW = weekly.slice(0, 20).reverse();
    if (recentW.length > 0) {
      charts.push({
        id: 'weekly_gdp',
        title: 'Weekly GDP Components',
        type: 'line',
        labels: recentW.map(r => r.date),
        datasets: [
          { label: 'Core GDP', data: recentW.map(r => r.coreGdp) },
          { label: 'GDP', data: recentW.map(r => r.gdp) },
          { label: 'Net Exports', data: recentW.map(r => r.netExports) },
        ],
      });
    }

    // NX Results (last 20)
    const recentNx = nx.slice(0, 20).reverse();
    if (recentNx.length > 0) {
      charts.push({
        id: 'trade_balance',
        title: 'Trade Balance (Net Exports)',
        type: 'bar',
        labels: recentNx.map(r => r.date2),
        datasets: [
          { label: 'Trade Balance', data: recentNx.map(r => r.tradeBalance) },
        ],
      });
    }

    // PI Results (last 20)
    const recentPi = pi.slice(0, 20).reverse();
    if (recentPi.length > 0) {
      charts.push({
        id: 'private_inventories',
        title: 'Private Inventories Contribution',
        type: 'bar',
        labels: recentPi.map(r => r.date2),
        datasets: [
          { label: 'Private Inventories', data: recentPi.map(r => parseFloat(r.privateInventories) || null) },
        ],
      });
    }

    // Financial Targets
    if (financial.length > 0) {
      const gdpBased = financial.filter(r => r.section === 'GDP-Based');
      if (gdpBased.length > 0) {
        charts.push({
          id: 'financial_targets',
          title: 'ETF Price Targets vs Current (GDP-Based)',
          type: 'bar',
          labels: gdpBased.map(r => r.etf),
          datasets: [
            { label: 'Target Price', data: gdpBased.map(r => r.targetPrice) },
            { label: 'Current Price', data: gdpBased.map(r => r.tradingPrice) },
          ],
        });
      }
    }

    // Academic: Headline GDP
    if (academic.headline.length > 0) {
      const rev = [...academic.headline].reverse();
      charts.push({
        id: 'headline_gdp',
        title: 'Headline GDP: BEA Actual vs Atlas Predictions',
        type: 'line',
        labels: rev.map(r => r.date2),
        datasets: [
          { label: 'BEA Actual', data: rev.map(r => parseFloat(r.beaActual) || null) },
          { label: 'Atlas Predictions', data: rev.map(r => parseFloat(r.atlasPredicted) || null) },
        ],
      });
    }

    // Academic: Core GDP
    if (academic.core.length > 0) {
      const rev = [...academic.core].reverse();
      charts.push({
        id: 'core_gdp',
        title: 'Core GDP: BEA Actual vs Atlas Predictions',
        type: 'line',
        labels: rev.map(r => r.date2),
        datasets: [
          { label: 'BEA Actual', data: rev.map(r => parseFloat(r.beaActual) || null) },
          { label: 'Atlas Predictions', data: rev.map(r => parseFloat(r.atlasPredicted) || null) },
        ],
      });
    }

    // Academic: State GDP
    if (academic.state.length > 0) {
      const rev = [...academic.state].reverse();
      charts.push({
        id: 'state_gdp',
        title: 'Nevada GDP: BEA Actual vs Atlas Predictions',
        type: 'line',
        labels: rev.map(r => r.date2),
        datasets: [
          { label: 'BEA Actual', data: rev.map(r => parseFloat(r.beaActual) || null) },
          { label: 'Atlas Predictions', data: rev.map(r => parseFloat(r.atlasPredicted) || null) },
        ],
      });
    }

    res.json({ charts });
  } catch (err) {
    console.error('[Dashboard /overview error]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/dashboard/client-data/:tab
router.get('/client-data/:tab', async (req: Request, res: Response) => {
  try {
    const { tab } = req.params;
    const quarter = req.query.quarter as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

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
        const rows = ClientDataRepository.getNxResults(startDate, endDate);
        res.json({ rows });
        return;
      }
      case 'pi': {
        const rows = ClientDataRepository.getPiResults(startDate, endDate);
        res.json({ rows });
        return;
      }
      case 'quarterly': {
        const rows = ClientDataRepository.getQuarterlyTimeSeries(startDate, endDate, quarter);
        res.json({ rows });
        return;
      }
      case 'headline_gdp': {
        const rows = ClientDataRepository.getAcademicGdp('headline', startDate, endDate);
        res.json({ rows });
        return;
      }
      case 'core_gdp': {
        const rows = ClientDataRepository.getAcademicGdp('core', startDate, endDate);
        res.json({ rows });
        return;
      }
      case 'state_gdp': {
        const rows = ClientDataRepository.getAcademicGdp('state', startDate, endDate);
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
