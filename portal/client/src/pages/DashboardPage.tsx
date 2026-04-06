import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useViewAs } from '../context/ViewAsContext';
import DashboardLayout from '../components/DashboardLayout';
import KPICard from '../components/charts/KPICard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import WaterfallChart from '../components/charts/WaterfallChart';
import ExportButton from '../components/ExportButton';
import { DashboardData, FilterOptions, DashboardFilters, UserType, UserRole } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { viewAsType } = useViewAs();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAcademic = isSuperAdmin ? viewAsType === UserType.ACADEMIC : user?.userType === UserType.ACADEMIC;
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 15;

  // Client product data state
  const [clientData, setClientData] = useState<{ headers: string[]; rows: (string | number)[][] } | null>(null);
  const [clientLoading, setClientLoading] = useState(false);

  // Inline tab filters
  const [tabFilters, setTabFilters] = useState<Record<string, string>>({});
  const resetTabFilters = () => setTabFilters({});

  // Overview charts state
  const [overviewCharts, setOverviewCharts] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [chartOrder, setChartOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('atlas_chart_order') || '[]'); } catch { return []; }
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const isClientTab = ['weekly', 'financial', 'exports', 'inventories', 'quarterly', 'headline_gdp', 'core_gdp', 'state_gdp'].includes(activeTab);
  const isPortalTab = ['contents', 'insights', 'support'].includes(activeTab);

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
  useEffect(() => { setTablePage(1); resetTabFilters(); }, [filters, activeTab]);

  // Fetch overview charts
  useEffect(() => {
    if (activeTab !== 'overview') return;
    setOverviewLoading(true);
    const params: Record<string, string> = {};
    if (filters.quarter) params.quarter = filters.quarter;
    if (filters.dateRange?.start) params.startDate = filters.dateRange.start;
    if (filters.dateRange?.end) params.endDate = filters.dateRange.end;
    api.get('/dashboard/overview', { params })
      .then(({ data: d }) => {
        const charts = d.charts || [];
        setOverviewCharts(charts);
        // If no saved order, use default order
        if (chartOrder.length === 0 && charts.length > 0) {
          setChartOrder(charts.map((c: any) => c.id));
        }
      })
      .catch(() => {})
      .finally(() => setOverviewLoading(false));
  }, [activeTab, filters]);

  // Fetch client product data when switching to retail tabs
  useEffect(() => {
    if (!isClientTab) { setClientData(null); return; }
    const tabToEndpoint: Record<string, string> = {
      weekly: 'weekly', financial: 'financial', exports: 'nx', inventories: 'pi', quarterly: 'quarterly',
      headline_gdp: 'headline_gdp', core_gdp: 'core_gdp', state_gdp: 'state_gdp',
    };
    const endpoint = tabToEndpoint[activeTab];
    if (!endpoint) return;

    setClientLoading(true);
    const params: Record<string, string> = {};
    if (filters.quarter) params.quarter = filters.quarter;
    if (filters.dateRange?.start) params.startDate = filters.dateRange.start;
    if (filters.dateRange?.end) params.endDate = filters.dateRange.end;
    api.get(`/dashboard/client-data/${endpoint}`, { params })
      .then(({ data: d }) => {
        if (endpoint === 'weekly') {
          const rows = (d.rows || []).map((r: any) => [
            r.predictionQuarter, r.date, r.year, r.dayOfWeek, r.month,
            r.coreGdp ?? '', r.coreGdpUpdated ?? '', r.netExports ?? '', r.privateInventories ?? '', r.gdp ?? '',
          ]);
          setClientData({
            headers: ['Prediction Quarter', 'Date', 'Year', 'Day', 'Month', 'Core GDP', 'Core GDP Updated', 'Net Exports', 'Private Inventories', 'GDP'],
            rows,
          });
        } else if (endpoint === 'financial') {
          const rows = (d.rows || []).map((r: any) => [
            r.section, r.etf,
            r.targetPrice != null ? `$${r.targetPrice.toFixed(2)}` : '',
            r.tradingPrice != null ? `$${r.tradingPrice.toFixed(2)}` : '',
            r.deviation || '',
          ]);
          setClientData({
            headers: ['Section', 'ETF', 'Target Price', 'Trading Price', 'Deviation'],
            rows,
          });
        } else if (endpoint === 'nx') {
          const rows = (d.rows || []).map((r: any) => [
            r.date, r.year, r.quarter, r.date2,
            r.tradeBalance != null ? r.tradeBalance.toLocaleString() : '',
            r.tradeBalancePctCh || '', r.nxResults || '',
          ]);
          setClientData({
            headers: ['Date', 'Year', 'Quarter', 'Date2', 'Trade Balance', 'Trade Balance (% Ch)', 'NX Results'],
            rows,
          });
        } else if (endpoint === 'pi') {
          const rows = (d.rows || []).map((r: any) => [
            r.date, r.year, r.quarter, r.date2, r.privateInventories || '',
          ]);
          setClientData({
            headers: ['Date', 'Year', 'Quarter', 'Date2', 'Private Inventories'],
            rows,
          });
        } else if (endpoint === 'quarterly') {
          const rows = (d.rows || []).map((r: any) => [
            r.date, r.year, r.quarter, r.date2, r.usGdp || '', r.atlasPredicted || '',
          ]);
          setClientData({
            headers: ['Date', 'Year', 'Quarter', 'Date2', 'US GDP (SAAR)', 'Atlas Predicted (SAAR)'],
            rows,
          });
        } else if (['headline_gdp', 'core_gdp', 'state_gdp'].includes(endpoint)) {
          const rows = (d.rows || []).map((r: any) => [
            r.date, r.year, r.quarter, r.date2, r.beaActual || '', r.atlasPredicted || '',
          ]);
          setClientData({
            headers: ['Date', 'Year', 'Quarter', 'Date 2', 'BEA Actual', 'Atlas Predictions'],
            rows,
          });
        }
      })
      .catch(() => setClientData(null))
      .finally(() => setClientLoading(false));
  }, [activeTab, isClientTab, filters]);

  const tabTitles: Record<string, { breadcrumb: string; title: string }> = {
    overview: { breadcrumb: 'Dashboard > Overview', title: 'Economic Overview' },
    quarterly: { breadcrumb: 'Dashboard > Quarterly Time Series', title: 'Quarterly Time Series' },
    weekly: { breadcrumb: 'Dashboard > Weekly Time Series', title: 'Weekly Economic Indicators' },
    financial: { breadcrumb: 'Dashboard > Financial Targets', title: 'FY2025 Financial Targets' },
    exports: { breadcrumb: 'Dashboard > Components > Net Exports', title: 'Net Exports Analysis' },
    inventories: { breadcrumb: 'Dashboard > Components > Private Inventories', title: 'Private Inventories Breakdown' },
    headline_gdp: { breadcrumb: 'Dashboard > Headline GDP', title: 'Headline GDP: Actual vs Atlas Predictions' },
    core_gdp: { breadcrumb: 'Dashboard > Core GDP', title: 'Core GDP: Actual vs Atlas Predictions' },
    state_gdp: { breadcrumb: 'Dashboard > State GDP', title: 'State GDP: Actual vs Atlas Predictions' },
    contents: { breadcrumb: 'Portal > Contents', title: 'Workbook Contents' },
    insights: { breadcrumb: 'Portal > Insights', title: 'Insights & Analysis' },
    support: { breadcrumb: 'Portal > Support', title: 'Support & Resources' },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && overviewLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6c5dd3]"></div>
        </div>
      )}

      {activeTab === 'overview' && !overviewLoading && (() => {
        // Filter charts based on user type
        const retailChartIds = ['quarterly_gdp', 'weekly_gdp', 'trade_balance', 'private_inventories', 'financial_targets'];
        const academicChartIds = ['headline_gdp', 'core_gdp', 'state_gdp'];
        const allowedIds = isAcademic ? [...academicChartIds, 'quarterly_gdp'] : retailChartIds;
        const available = overviewCharts.filter(c => allowedIds.includes(c.id));

        // Apply saved order
        const orderedCharts = chartOrder.length > 0
          ? chartOrder.map(id => available.find(c => c.id === id)).filter(Boolean).concat(available.filter(c => !chartOrder.includes(c.id)))
          : available;

        const handleDragStart = (idx: number) => setDragIdx(idx);
        const handleDragOver = (e: React.DragEvent, idx: number) => {
          e.preventDefault();
          if (dragIdx === null || dragIdx === idx) return;
          const newOrder = [...orderedCharts.map((c: any) => c.id)];
          const [moved] = newOrder.splice(dragIdx, 1);
          newOrder.splice(idx, 0, moved);
          setChartOrder(newOrder);
          localStorage.setItem('atlas_chart_order', JSON.stringify(newOrder));
          setDragIdx(idx);
        };
        const handleDragEnd = () => setDragIdx(null);

        if (available.length === 0) {
          return (
            <div className="text-center py-20 text-[#a0a0b0]">
              <p className="text-lg">No chart data available yet</p>
              <p className="text-sm mt-2">Upload CSV files to populate the overview charts.</p>
            </div>
          );
        }

        return (
          <>
            <p className="text-xs text-[#a0a0b0] hidden sm:block">Drag charts to rearrange. Layout is saved automatically.</p>
            <p className="text-xs text-[#a0a0b0] sm:hidden">Tap and hold to rearrange charts.</p>
            <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
              {orderedCharts.map((chart: any, idx: number) => (
                <div key={chart.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                  className={`bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-5 cursor-grab active:cursor-grabbing transition ${dragIdx === idx ? 'opacity-50 border-[#6c5dd3]' : ''} ${chart.type === 'line' && orderedCharts.length > 2 && idx === 0 ? 'col-span-2 max-lg:col-span-1' : ''}`}>
                  <h3 className="text-sm font-semibold text-white mb-4">{chart.title}</h3>
                  {chart.type === 'line' ? (
                    <LineChart dataset={{
                      label: chart.title,
                      type: 'line',
                      labels: chart.labels,
                      data: chart.datasets[0].data,
                    }} bare />
                  ) : (
                    <BarChart dataset={{
                      label: chart.title,
                      type: 'bar',
                      labels: chart.labels,
                      data: chart.datasets[0].data,
                    }} bare />
                  )}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* Portal Sections */}
      {activeTab === 'contents' && (
        <div className="space-y-5">
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Workbook Contents</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[#a0a0b0]">Company</span><p className="text-white mt-1">{user?.company || 'Atlas Analytics, Inc.'}</p></div>
              <div><span className="text-[#a0a0b0]">Subscriber</span><p className="text-white mt-1">{user?.subscriber || user?.name || '—'}</p></div>
              <div><span className="text-[#a0a0b0]">Primary Account Contact</span><p className="text-white mt-1">{user?.primaryContact || '—'}</p></div>
              <div><span className="text-[#a0a0b0]">Service Period</span><p className="text-white mt-1">{user?.servicePeriodStart && user?.servicePeriodEnd ? `${user.servicePeriodStart} – ${user.servicePeriodEnd}` : '—'}</p></div>
            </div>
            {user?.workbookDescription && (
              <div>
                <span className="text-[#a0a0b0] text-sm">Workbook Description</span>
                <p className="text-white text-sm mt-1 leading-relaxed">{user.workbookDescription}</p>
              </div>
            )}
          </div>
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6">
            <h3 className="text-base font-semibold text-white mb-3">Available Sheets</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead><tr className="border-b border-[#2d2d44]">
                  <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase">Sheet Name</th>
                  <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase">Description</th>
                  <th className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase">Type</th>
                </tr></thead>
                <tbody>
                  {(isAcademic ? [
                    { name: 'Contents', desc: 'Summary contents table', type: 'Contents' },
                    { name: 'Insights', desc: 'Bespoke weekly insights on quarterly outputs', type: 'Insights' },
                    { name: 'Headline GDP', desc: 'Historical and current GDP', type: 'Data' },
                    { name: 'Core GDP', desc: 'Historical and current Core GDP', type: 'Data' },
                    { name: 'State GDP', desc: 'State-level GDP predictions and interactive charts', type: 'Data' },
                    { name: 'Support, Feedback, Disclaimers', desc: 'Resources, feedback and product feature requests', type: 'Contents' },
                  ] : [
                    { name: 'Contents', desc: 'Summary contents table', type: 'Contents' },
                    { name: 'Quarterly Time Series', desc: 'Quarterly time-series data: Actual and Atlas predicted GDP', type: 'Data' },
                    { name: 'Weekly Time Series', desc: 'Weekly time-series data: Atlas predicted GDP broken down into sub-components', type: 'Data' },
                    { name: 'Weekly Financial Targets', desc: 'Atlas financial market targets', type: 'Data' },
                    { name: 'NX Results', desc: 'Atlas predicted Net Exports (trade balance)', type: 'Data' },
                    { name: 'PI Results', desc: 'Atlas predicted Private Inventories', type: 'Data' },
                  ]).map((sheet, i) => (
                    <tr key={i} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                      <td className="px-4 py-3 text-white font-medium">{sheet.name}</td>
                      <td className="px-4 py-3 text-[#a0a0b0]">{sheet.desc}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sheet.type === 'Data' ? 'bg-[rgba(255,152,0,0.15)] text-[#ff9800]' : sheet.type === 'Insights' ? 'bg-[rgba(76,175,80,0.15)] text-[#4caf50]' : 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]'}`}>
                          {sheet.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {isAcademic && (
            <>
              <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
                <h3 className="text-base font-semibold text-white">Model Training Window</h3>
                <p className="text-white text-sm leading-relaxed">
                  Model trained on: 2005Q2–2021Q4, out-of-sample period provided: 2022Q1–2025Q2
                </p>
                <p className="text-[#a0a0b0] text-xs leading-relaxed">
                  Note: The strictly out-of-sample estimates are generated without access to ex-post data from the evaluation window.
                  Training window commences in 2005Q2 to correspond with the start of BEA state-level quarterly statistics.
                </p>
              </div>
              <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
                <h3 className="text-base font-semibold text-white">Notes & Methodological Alignment</h3>
                <ul className="space-y-2 text-sm text-[#a0a0b0] list-disc list-inside">
                  <li>Growth rates reflect real GDP, seasonally adjusted, matching BEA definitions.</li>
                  <li>No proprietary satellite factors or model inputs are shared; only the derived GDP estimates are provided.</li>
                  <li>All values are hard-coded (no formulas) to ensure reproducibility across platforms (R, Python, Stata, MATLAB).</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Workbook Insights: Q1 2026</h2>
          <div className="bg-[#ffd60a]/10 border border-[#ffd60a]/30 rounded-lg p-5 space-y-3">
            <p className="text-white text-sm leading-relaxed">
              Atlas Analytics' latest release provides a unified view of U.S. growth across three lenses: Headline GDP, Core GDP, and
              {isAcademic ? ' state-specific activity.' : ' component-level breakdowns.'}
            </p>
            <p className="text-white text-sm leading-relaxed">
              Headline GDP captures the full macro picture, while Core GDP strips out the most volatile components to reveal
              the underlying pace of economic expansion. Together, these series point to an economy that is not merely expanding,
              but doing so on increasingly durable footing.
            </p>
            {isAcademic && (
              <p className="text-white text-sm leading-relaxed">
                At the state level, our GDP estimates translate these national dynamics into robust localized growth signals,
                with satellite-derived indicators across tourism, logistics, construction, and services showing broad-based strength.
              </p>
            )}
            {isAcademic && (
              <div className="pt-2 border-t border-[#ffd60a]/20">
                <p className="text-white text-sm leading-relaxed">
                  <span className="font-semibold">Methodological Update & Forecast Revision:</span> We note this Nevada forecast
                  differs modestly from our initial release due to a refinement in the underlying state model. Following additional
                  back-testing and signal validation, we corrected for a previously systematic below-trend bias resulting in a stronger
                  and more representative growth trajectory.
                </p>
              </div>
            )}
          </div>
          <p className="text-[#a0a0b0] text-xs">
            Each dataset is structured for ease of reference and may include accompanying charts or formulas for visualization and analysis.
          </p>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="space-y-5">
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Contact for Support</h2>
            <p className="text-white text-sm">Jake W. Schneider, Founder & CEO</p>
            <a href="mailto:jake@atlasanalytics.com" className="text-[#6c5dd3] text-sm hover:opacity-80">jake@atlasanalytics.com</a>
          </div>
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Provide Anonymous Feedback and/or Request Product Features</h2>
            <a href="#" className="text-[#6c5dd3] text-sm hover:opacity-80">Click Here</a>
          </div>
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Resources</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-[#6c5dd3] hover:opacity-80">Activate free Atlas Substack subscription for weekly economic analysis</a></li>
              <li><a href="#" className="text-[#6c5dd3] hover:opacity-80">View Atlas Analytics, Inc. Legal Disclaimer</a></li>
              <li><a href="#" className="text-[#6c5dd3] hover:opacity-80">View Client Contract</a></li>
            </ul>
          </div>
          <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Disclaimer</h2>
            <p className="text-[#a0a0b0] text-xs leading-relaxed">
              This workbook and all data, analysis, and content contained herein are confidential and intended solely for the use of the authorized recipient.
              No part of this Workbook may be copied, reproduced, distributed, or shared in any form without the prior written consent of Atlas Analytics, Inc.
              Atlas Analytics, Inc. makes no representations or warranties, express or implied, as to the accuracy, completeness, or reliability of the data or analysis.
              All information is provided "as is" and is subject to change without notice. Use of this Workbook is at the user's own risk.
            </p>
          </div>
        </div>
      )}

      {/* Tab Charts */}
      {isClientTab && !clientLoading && clientData && clientData.rows.length > 0 && activeTab !== 'overview' && (() => {
        // Build chart data based on active tab
        const buildTabChart = () => {
          const rows = clientData.rows;
          if (activeTab === 'quarterly') {
            // Line chart: US GDP vs Atlas Predicted over time
            const recent = rows.slice(0, 30).reverse();
            return {
              type: 'line' as const,
              dataset: {
                label: 'US GDP (SAAR) vs Atlas Predicted',
                type: 'line' as const,
                labels: recent.map(r => String(r[3])), // Date2
                data: recent.map(r => parseFloat(String(r[4])) || 0), // US GDP
              },
            };
          }
          if (activeTab === 'weekly') {
            const recent = rows.slice(0, 30).reverse();
            return {
              type: 'line' as const,
              dataset: {
                label: 'Weekly GDP Forecast',
                type: 'line' as const,
                labels: recent.map(r => String(r[1])), // Date
                data: recent.map(r => parseFloat(String(r[9])) || 0), // GDP
              },
            };
          }
          if (activeTab === 'financial') {
            return {
              type: 'bar' as const,
              dataset: {
                label: 'Target vs Current Price',
                type: 'bar' as const,
                labels: rows.map(r => String(r[1])), // ETF
                data: rows.map(r => parseFloat(String(r[2]).replace('$', '')) || 0), // Target Price
              },
            };
          }
          if (activeTab === 'exports') {
            const recent = rows.slice(0, 20).reverse();
            return {
              type: 'bar' as const,
              dataset: {
                label: 'Trade Balance',
                type: 'bar' as const,
                labels: recent.map(r => String(r[3])), // Date2
                data: recent.map(r => parseFloat(String(r[4]).replace(/,/g, '')) || 0), // Trade Balance
              },
            };
          }
          if (activeTab === 'inventories') {
            const recent = rows.slice(0, 20).reverse();
            return {
              type: 'bar' as const,
              dataset: {
                label: 'Private Inventories',
                type: 'bar' as const,
                labels: recent.map(r => String(r[3])), // Date2
                data: recent.map(r => parseFloat(String(r[4])) || 0), // Private Inventories
              },
            };
          }
          if (['headline_gdp', 'core_gdp', 'state_gdp'].includes(activeTab)) {
            const recent = rows.slice(0, 20).reverse();
            return {
              type: 'line' as const,
              dataset: {
                label: 'BEA Actual vs Atlas Predictions',
                type: 'line' as const,
                labels: recent.map(r => String(r[3])), // Date 2
                data: recent.map(r => parseFloat(String(r[4])) || 0), // BEA Actual
              },
            };
          }
          return null;
        };

        const chart = buildTabChart();
        if (!chart) return null;

        return chart.type === 'line'
          ? <LineChart dataset={chart.dataset} />
          : <BarChart dataset={chart.dataset} />;
      })()}

      {/* Client Product Data Tables (retail tabs) */}
      {isClientTab && clientLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6c5dd3]"></div>
        </div>
      )}

      {isClientTab && !clientLoading && clientData && clientData.rows.length > 0 && (() => {
        // Define which columns are filterable per tab (header index -> filter type)
        const tabFilterConfigs: Record<string, { col: number; label: string; key: string }[]> = {
          quarterly: [
            { col: 1, label: 'Year', key: 'year' },
          ],
          weekly: [
            { col: 0, label: 'Quarter', key: 'quarter' },
            { col: 2, label: 'Year', key: 'year' },
            { col: 4, label: 'Month', key: 'month' },
          ],
          financial: [
            { col: 0, label: 'Section', key: 'section' },
          ],
          exports: [
            { col: 1, label: 'Year', key: 'year' },
          ],
          inventories: [
            { col: 1, label: 'Year', key: 'year' },
          ],
          headline_gdp: [
            { col: 1, label: 'Year', key: 'year' },
          ],
          core_gdp: [
            { col: 1, label: 'Year', key: 'year' },
          ],
          state_gdp: [
            { col: 1, label: 'Year', key: 'year' },
          ],
        };

        const filterConfig = tabFilterConfigs[activeTab] || [];

        // Get unique values for each filter
        const filterOptionsMap: Record<string, string[]> = {};
        for (const fc of filterConfig) {
          const vals = new Set<string>();
          for (const row of clientData.rows) {
            const v = String(row[fc.col] ?? '').trim();
            if (v) vals.add(v);
          }
          filterOptionsMap[fc.key] = Array.from(vals).sort();
        }

        // Apply filters
        let filteredRows = clientData.rows;
        for (const fc of filterConfig) {
          const filterVal = tabFilters[fc.key];
          if (filterVal) {
            filteredRows = filteredRows.filter(row => String(row[fc.col]).trim() === filterVal);
          }
        }

        const totalRows = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / TABLE_PAGE_SIZE));
        const effectivePage = Math.min(Math.max(1, tablePage), totalPages);
        const start = (effectivePage - 1) * TABLE_PAGE_SIZE;
        const pageRows = filteredRows.slice(start, start + TABLE_PAGE_SIZE);

        const selectClass = 'bg-[#181824] border border-[#2d2d44] rounded-md px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6c5dd3] cursor-pointer';

        return (
          <>
            {/* Inline Filters */}
            {filterConfig.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap bg-[#1e1e2f] rounded-xl border border-[#2d2d44] p-3">
                {filterConfig.map(fc => (
                  <div key={fc.key} className="flex items-center gap-1.5">
                    <span className="text-xs text-[#a0a0b0]">{fc.label}:</span>
                    <select value={tabFilters[fc.key] || ''} onChange={e => { setTabFilters(f => ({ ...f, [fc.key]: e.target.value })); setTablePage(1); }} className={selectClass}>
                      <option value="">All</option>
                      {(filterOptionsMap[fc.key] || []).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                ))}
                {Object.values(tabFilters).some(v => v) && (
                  <button onClick={() => { resetTabFilters(); setTablePage(1); }} className="text-xs text-[#6c5dd3] hover:text-white transition cursor-pointer">Clear filters</button>
                )}
                <span className="text-xs text-[#a0a0b0] sm:ml-auto">{totalRows} of {clientData.rows.length} records</span>
              </div>
            )}

            <div className="bg-[#1e1e2f] rounded-xl border border-[#2d2d44]">
            <div className="px-4 py-3 border-b border-[#2d2d44] flex items-center justify-between">
              <span className="text-sm text-[#a0a0b0]">{totalRows} records</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={effectivePage === 1}
                    className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer disabled:opacity-30 hover:text-[#6c5dd3] transition">Prev</button>
                  <span className="text-xs text-[#a0a0b0]">{effectivePage} / {totalPages}</span>
                  <button onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} disabled={effectivePage === totalPages}
                    className="bg-transparent border border-[#2d2d44] text-[#a0a0b0] px-2.5 py-1 rounded-md text-xs cursor-pointer disabled:opacity-30 hover:text-[#6c5dd3] transition">Next</button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead><tr className="border-b border-[#2d2d44]">
                  {clientData.headers.map((h, j) => (
                    <th key={j} className="px-4 py-3 text-[#a0a0b0] font-medium text-xs uppercase tracking-[0.5px]">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pageRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#2d2d44] last:border-0 hover:bg-[rgba(108,93,211,0.05)]">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-3 text-white">{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        );
      })()}

      {isClientTab && !clientLoading && (!clientData || clientData.rows.length === 0) && (
        <div className="text-center py-20 text-[#a0a0b0]">
          <p className="text-lg">No data available for this section</p>
          <p className="text-sm mt-2">Upload the corresponding CSV file from Admin &gt; CSV Upload to populate this view.</p>
        </div>
      )}

      {/* Generic dashboard data (quarterly tab and fallback) */}
      {!isPortalTab && !isClientTab && loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6c5dd3]"></div>
        </div>
      )}

      {!isPortalTab && !isClientTab && error && (
        <div className="bg-[rgba(220,53,69,0.1)] border border-[#dc3545] text-[#dc3545] px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {!isPortalTab && !isClientTab && data && !loading && (
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
