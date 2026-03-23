import {
  UserRole,
  DashboardFilters,
  DashboardData,
  FilterOptions,
  KPIData,
  ChartDataSet,
  TableData,
} from '../types';
import { EconomicDataRepository } from '../repositories/economicDataRepository';
import { getDataScope } from '../middleware/roleMiddleware';

export const DashboardDataService = {
  async getDashboardData(
    userId: string,
    role: UserRole,
    filters: DashboardFilters
  ): Promise<DashboardData> {
    const scope = getDataScope(role);

    // Apply role-based scoping to filters
    const scopedFilters = { ...filters };
    if (scope.countries === 'limited' && (!scopedFilters.countries || scopedFilters.countries.length === 0)) {
      scopedFilters.countries = EconomicDataRepository.LIMITED_COUNTRIES;
    }

    const records = await EconomicDataRepository.queryByRoleAndFilters(role, scopedFilters);

    // Build KPIs
    const kpis = buildKPIs(records, scope.components);

    // Build charts based on component access level
    const charts = buildCharts(records, scope.components);

    // Build data tables
    const tables = buildTables(records, scope.components);

    return { kpis, charts, tables };
  },

  async getFilterOptions(role: UserRole): Promise<FilterOptions> {
    const scope = getDataScope(role);

    let countries = await EconomicDataRepository.getDistinctCountries();
    if (scope.countries === 'limited') {
      countries = countries.filter(c => EconomicDataRepository.LIMITED_COUNTRIES.includes(c));
    }

    const quarters = await EconomicDataRepository.getDistinctQuarters();

    // For retail, only show current quarter
    const filteredQuarters = scope.timeRange === 'current_quarter' && quarters.length > 0
      ? [quarters[0]]
      : quarters;

    return {
      quarters: filteredQuarters,
      countries,
      dateRanges: [
        { label: 'Last 30 days', value: '30d' },
        { label: 'Last 90 days', value: '90d' },
        { label: 'Last 12 months', value: '12m' },
        { label: 'All time', value: 'all' },
      ],
    };
  },
};

interface RecordLike {
  countryCode: string;
  indicatorType: string;
  quarter: string;
  observationDate: Date;
  value: number;
  metadata: Record<string, unknown>;
}

function buildKPIs(records: RecordLike[], components: string): KPIData[] {
  if (records.length === 0) return [];

  // Group by indicator type
  const byIndicator = new Map<string, number[]>();
  for (const r of records) {
    const existing = byIndicator.get(r.indicatorType) || [];
    existing.push(r.value);
    byIndicator.set(r.indicatorType, existing);
  }

  const kpis: KPIData[] = [];
  for (const [indicator, values] of byIndicator) {
    const latest = values[0];
    const previous = values.length > 1 ? values[1] : latest;
    const delta = latest - previous;

    kpis.push({
      label: formatIndicatorLabel(indicator),
      value: latest,
      unit: indicator.includes('gdp') ? '%' : 'index',
      trend: {
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
        delta: Math.round(delta * 100) / 100,
      },
    });
  }

  // Summary view: limit to top 4 KPIs
  if (components === 'summary') {
    return kpis.slice(0, 4);
  }

  return kpis;
}

function buildCharts(records: RecordLike[], components: string): ChartDataSet[] {
  if (records.length === 0) return [];

  const charts: ChartDataSet[] = [];

  // GDP trend line chart (all roles)
  const gdpRecords = records.filter(r => r.indicatorType.includes('gdp'));
  if (gdpRecords.length > 0) {
    charts.push({
      label: 'GDP Nowcast Trend',
      type: 'line',
      labels: gdpRecords.map(r => r.quarter),
      data: gdpRecords.map(r => r.value),
    });
  }

  // Full breakdown charts (institutional+)
  if (components !== 'summary') {
    // Trade flow bar chart
    const tradeRecords = records.filter(r => r.indicatorType.includes('trade'));
    if (tradeRecords.length > 0) {
      charts.push({
        label: 'Trade Flow by Country',
        type: 'bar',
        labels: tradeRecords.map(r => r.countryCode),
        data: tradeRecords.map(r => r.value),
      });
    }

    // Component waterfall (institutional+)
    const componentRecords = records.filter(r =>
      !r.indicatorType.includes('gdp') && !r.indicatorType.includes('trade')
    );
    if (componentRecords.length > 0) {
      charts.push({
        label: 'GDP Component Breakdown',
        type: 'waterfall',
        labels: componentRecords.map(r => formatIndicatorLabel(r.indicatorType)),
        data: componentRecords.map(r => r.value),
      });
    }
  }

  return charts;
}

function safeDateStr(d: unknown): string {
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const s = String(d);
  if (s.includes('T')) return s.split('T')[0];
  return s;
}

function buildTables(records: RecordLike[], components: string): TableData[] {
  if (records.length === 0) return [];

  if (components === 'summary') {
    // Summary table: country, latest GDP, trend
    const byCountry = new Map<string, RecordLike>();
    for (const r of records) {
      if (r.indicatorType.includes('gdp') && !byCountry.has(r.countryCode)) {
        byCountry.set(r.countryCode, r);
      }
    }

    return [{
      headers: ['Country', 'GDP Nowcast', 'Quarter'],
      rows: Array.from(byCountry.values()).map(r => [r.countryCode, r.value, r.quarter]),
    }];
  }

  // Full table for institutional/enterprise
  return [{
    headers: ['Country', 'Indicator', 'Quarter', 'Date', 'Value'],
    rows: records.map(r => [
      r.countryCode,
      formatIndicatorLabel(r.indicatorType),
      r.quarter,
      safeDateStr(r.observationDate),
      r.value,
    ]),
  }];
}

function formatIndicatorLabel(indicator: string): string {
  return indicator
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
