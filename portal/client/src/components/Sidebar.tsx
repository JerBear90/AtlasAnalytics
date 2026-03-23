import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, FilterOptions, DashboardFilters } from '../types';
import { useState } from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filterOptions?: FilterOptions | null;
  filters?: DashboardFilters;
  onFiltersChange?: (filters: DashboardFilters) => void;
  showDashboardNav?: boolean;
}

const DATA_SERIES_TABS = [
  { id: 'quarterly', label: 'Quarterly Time Series' },
  { id: 'weekly', label: 'Weekly Time Series' },
  { id: 'financial', label: 'Financial Targets' },
];

const COMPONENT_TABS = [
  { id: 'exports', label: 'Net Exports' },
  { id: 'inventories', label: 'Private Inventories' },
];

export default function Sidebar({
  open, onClose, activeTab = 'quarterly', onTabChange,
  filterOptions, filters, onFiltersChange, showDashboardNav = false,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isDashboard = location.pathname === '/dashboard';

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [quarterDropdownOpen, setQuarterDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  const handleTabClick = (tab: string) => {
    onTabChange?.(tab);
    onClose();
  };

  const handleDateRangeSelect = (value: string) => {
    setSelectedDateRange(value);
    setDateDropdownOpen(false);

    if (value === 'all') {
      const updated = { ...filters };
      delete updated.dateRange;
      onFiltersChange?.(updated);
      return;
    }

    const end = new Date();
    const start = new Date();
    if (value === '30d') start.setDate(end.getDate() - 30);
    else if (value === '90d') start.setDate(end.getDate() - 90);
    else if (value === '12m') start.setFullYear(end.getFullYear() - 1);

    onFiltersChange?.({
      ...filters,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    });
  };

  const getDateRangeLabel = () => {
    if (selectedDateRange === 'all') return 'All';
    const match = filterOptions?.dateRanges.find((d: { label: string; value: string }) => d.value === selectedDateRange);
    return match?.label || 'All';
  };

  const navItem = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link to={to} onClick={onClose}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-1 cursor-pointer transition
          ${active ? 'bg-[rgba(108,93,211,0.1)] text-[#6c5dd3] font-medium' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3]'}`}>
        <span>{label}</span>
      </Link>
    );
  };

  const tabItem = (tab: { id: string; label: string }) => {
    const active = activeTab === tab.id;
    return (
      <div key={tab.id} onClick={() => handleTabClick(tab.id)}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-1 cursor-pointer transition
          ${active ? 'bg-[rgba(108,93,211,0.1)] text-[#6c5dd3] font-medium' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3]'}`}>
        <span>{tab.label}</span>
      </div>
    );
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-[99] lg:hidden" onClick={onClose} />}

      <aside className={`
        w-[260px] min-w-[260px] bg-[#181824] border-r border-[#2d2d44] flex flex-col p-5 overflow-y-auto z-[100]
        fixed top-0 left-0 bottom-0 transition-transform duration-300
        lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 pb-5 border-b border-[#2d2d44]">
          <img src="https://atlasanalytics.com/wp-content/uploads/2025/01/Group-30.png" alt="Atlas Analytics" className="h-10 w-auto" />
          <span className="text-base font-bold text-white leading-tight">Atlas Analytics Inc.</span>
        </div>

        {/* Dashboard tabs — only show on dashboard page */}
        {(isDashboard || showDashboardNav) && (
          <>
            <div className="mb-6">
              <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Data Series</div>
              {DATA_SERIES_TABS.map(tabItem)}
            </div>

            <div className="mb-6">
              <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Components</div>
              {COMPONENT_TABS.map(tabItem)}
            </div>

            {/* Filters */}
            {filterOptions && (
              <div className="mb-6">
                <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Filters</div>

                {/* Date Range filter */}
                <div className="relative mb-1">
                  <div onClick={() => { setDateDropdownOpen(!dateDropdownOpen); setQuarterDropdownOpen(false); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#a0a0b0] cursor-pointer hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3] transition">
                    <span>Date Range</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-[#6c5dd3] font-medium">{getDateRangeLabel()}</span>
                      <span className={`text-[10px] transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </span>
                  </div>
                  {dateDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full bg-[#1e1e2f] border border-[#2d2d44] rounded-lg p-1.5 z-[200] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                      <div onClick={() => handleDateRangeSelect('all')}
                        className={`px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${selectedDateRange === 'all' ? 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.15)] hover:text-[#6c5dd3]'}`}>
                        All Time
                      </div>
                      {filterOptions.dateRanges.map((d: { label: string; value: string }) => (
                        <div key={d.value} onClick={() => handleDateRangeSelect(d.value)}
                          className={`px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${selectedDateRange === d.value ? 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.15)] hover:text-[#6c5dd3]'}`}>
                          {d.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quarter filter */}
                <div className="relative mb-1">
                  <div onClick={() => { setQuarterDropdownOpen(!quarterDropdownOpen); setDateDropdownOpen(false); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#a0a0b0] cursor-pointer hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3] transition">
                    <span>Quarter</span>
                    <span className="text-xs text-[#6c5dd3] font-medium">{filters?.quarter || 'All'}</span>
                  </div>
                  {quarterDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full bg-[#1e1e2f] border border-[#2d2d44] rounded-lg p-1.5 z-[200] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                      <div onClick={() => { onFiltersChange?.({ ...filters, quarter: undefined }); setQuarterDropdownOpen(false); }}
                        className={`px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${!filters?.quarter ? 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.15)] hover:text-[#6c5dd3]'}`}>
                        All Quarters
                      </div>
                      {filterOptions.quarters.map((q: string) => (
                        <div key={q} onClick={() => { onFiltersChange?.({ ...filters, quarter: q }); setQuarterDropdownOpen(false); }}
                          className={`px-3 py-2 rounded-md text-[13px] cursor-pointer transition ${filters?.quarter === q ? 'bg-[rgba(108,93,211,0.15)] text-[#6c5dd3]' : 'text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.15)] hover:text-[#6c5dd3]'}`}>
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Navigation — always visible */}
        {!isDashboard && (
          <div className="mb-6">
            <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Dashboard</div>
            {navItem('/dashboard', 'Economic Overview')}
          </div>
        )}

        {isAdmin && (
          <div className="mb-6">
            <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Admin</div>
            {navItem('/admin/csv', 'CSV Upload')}
            {navItem('/admin/users', 'User Management')}
          </div>
        )}

        <div className="mb-6">
          <div className="text-[11px] uppercase text-[#a0a0b0] mb-2.5 tracking-[1px] font-semibold">Account</div>
          {navItem('/settings', 'Settings')}
          <button onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3] transition text-left">
            Logout
          </button>
        </div>

        {/* User info at bottom */}
        <div className="mt-auto pt-5 border-t border-[#2d2d44]">
          <div className="text-sm text-white font-medium">{user?.name}</div>
          <div className="text-xs text-[#a0a0b0] mt-0.5">{user?.email}</div>
          <span className="inline-block mt-2 text-[11px] px-2.5 py-1 rounded-full bg-[rgba(108,93,211,0.15)] text-[#6c5dd3] font-medium capitalize">
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
}
