import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import DashboardLayout from '../components/DashboardLayout';
import KPICard from '../components/charts/KPICard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import WaterfallChart from '../components/charts/WaterfallChart';
import ExportButton from '../components/ExportButton';
import { DashboardData, FilterOptions, DashboardFilters } from '../types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('quarterly');
  const [data, setData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 15;

  const fetchFilters = useCallback(async () => {
    try {
      const { data: opts } = await api.get('/dashboard/filters');
      setFilterOptions(opts);
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filters.quarter) params.quarter = filters.quarter;
      if (filters.countries?.length) params.countries = filters.countries.join(',');
      if (filters.dateRange?.start && filters.dateRange?.end) {
        params.startDate = filters.dateRange.start;
        params.endDate = filters.dateRange.end;
      }
      const { data: d } = await api.get('/dashboard/data', { params });
      setData(d);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFilters(); }, [fetchFilters]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setTablePage(1); }, [filters, activeTab]);

  const tabTitles: Record<string, { breadcrumb: string; title: string }> = {
    quarterly: { breadcrumb: 'Dashboard > Economic Overview', title: `${filters.quarter || 'Q4 2025'} Predictions` },
    weekly: { breadcrumb: 'Dashboard > Weekly Time Series', title: 'Weekly Economic Indicators' },
    financial: { breadcrumb: 'Dashboard > Financial Targets', title: 'FY2025 Financial Targets' },
    exports: { breadcrumb: 'Dashboard > Components > Net Exports', title: 'Net Exports Analysis' },
    inventories: { breadcrumb: 'Dashboard > Components > Private Inventories', title: 'Private Inventories Breakdown' },
  };

  const currentTab = tabTitles[activeTab] || tabTitles.quarterly;

  const getFilteredCharts = () => {
    if (!data) return [];
    if (activeTab === 'quarterly') return data.charts;
    if (activeTab === 'weekly') return data.charts.filter(c => c.type === 'line');
    if (activeTab === 'financial') return data.charts.filter(c => c.type === 'bar');
    if (activeTab === 'exports') return data.charts.filter(c => c.label.toLowerCase().includes('trade') || c.type === 'bar');
    if (activeTab === 'inventories') return data.charts.filter(c => c.type === 'waterfall' || c.type === 'bar');
    return data.charts;
  };

  const renderChart = (chart: DashboardData['charts'][0], i: number, fullWidth: boolean) => {
    const cls = fullWidth ? 'col-span-2 max-lg:col-span-1' : '';
    const el = chart.type === 'line' ? <LineChart dataset={chart} />
             : chart.type === 'bar' ? <BarChart dataset={chart} />
             : chart.type === 'waterfall' ? <WaterfallChart dataset={chart} />
             : null;
    return el ? <div key={i} className={cls}>{el}</div> : null;
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      filterOptions={filterOptions}
      filters={filters}
      onFiltersChange={setFilters}
    >
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-2">
        <div>
          <div className="text-[#a0a0b0] text-sm">{currentTab.breadcrumb}</div>
          <h1 className="text-2xl font-semibold text-white">
            {currentTab.title}
            {filters.quarter && (
              <span className="ml-2 inline-block bg-[#6c5dd3] text-white text-[10px] px-2 py-0.5 rounded-[10px] align-middle">Filtered</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <ExportButton filters={filters} />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6c5dd3]"></div>
        </div>
      )}

      {error && (
        <div className="bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545] px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {data && !loading && (
        <>
          {/* KPI Grid */}
          {data.kpis.length > 0 && (
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
              {data.kpis.map((kpi, i) => <KPICard key={i} kpi={kpi} index={i} />)}
            </div>
          )}

          {/* Charts — each in its own grid row to prevent overlap */}
          {getFilteredCharts().map((chart, i) => {
            // First chart full-width, rest in 2-col grid
            if (i === 0) {
              return (
                <div key={i} className="grid grid-cols-1 gap-5">
                  {renderChart(chart, i, false)}
                </div>
              );
            }
            return null;
          })}

          {/* Remaining charts in 2-col grid */}
          {getFilteredCharts().length > 1 && (
            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              {getFilteredCharts().slice(1).map((chart, i) => renderChart(chart, i + 1, false))}
            </div>
          )}

          {/* Data Table */}
          {data.tables.length > 0 && data.tables.map((table, i) => {
            const totalRows = table.rows.length;
            const totalPages = Math.ceil(totalRows / TABLE_PAGE_SIZE);
            const start = (tablePage - 1) * TABLE_PAGE_SIZE;
            const pageRows = table.rows.slice(start, start + TABLE_PAGE_SIZE);

            return (
              <div key={i} className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44]">
                <div className="px-4 py-3 border-b border-[#2d2d44] flex items-center justify-between">
                  <span className="text-sm text-[#a0a0b0]">{totalRows} records</span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={tablePage === 1}
                        className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer disabled:opacity-30 hover:text-[#6c5dd3] transition">
                        Prev
                      </button>
                      <span className="text-xs text-[#a0a0b0]">{tablePage} / {totalPages}</span>
                      <button onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} disabled={tablePage === totalPages}
                        className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer disabled:opacity-30 hover:text-[#6c5dd3] transition">
                        Next
                      </button>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#2d2d44]">
                        {table.headers.map((h, j) => (
                          <th key={j} className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-3 text-white">
                              {typeof cell === 'number' ? cell.toLocaleString() : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {data.kpis.length === 0 && data.charts.length === 0 && data.tables.length === 0 && (
            <div className="text-center py-20 text-[#a0a0b0]">
              <p className="text-lg">No data available yet</p>
              <p className="text-sm mt-2">Data will appear here once CSV files are uploaded by an administrator.</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
