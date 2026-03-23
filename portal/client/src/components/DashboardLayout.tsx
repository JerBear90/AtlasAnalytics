import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import { FilterOptions, DashboardFilters } from '../types';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filterOptions?: FilterOptions | null;
  filters?: DashboardFilters;
  onFiltersChange?: (filters: DashboardFilters) => void;
  showDashboardNav?: boolean;
}

export default function DashboardLayout({
  children, activeTab, onTabChange, filterOptions, filters, onFiltersChange, showDashboardNav,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#13131a] overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        filterOptions={filterOptions}
        filters={filters}
        onFiltersChange={onFiltersChange}
        showDashboardNav={showDashboardNav}
      />

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#181824] border-b border-[#2d2d44] flex items-center justify-between px-4 z-[101] lg:hidden">
        <span className="text-[15px] font-bold text-white">Atlas Analytics Inc.</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-1 rounded-md hover:bg-[rgba(108,93,211,0.1)]" aria-label="Toggle navigation menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-[30px] flex flex-col gap-[25px] lg:pt-[30px] max-lg:pt-[72px] max-md:px-4 max-sm:px-[10px] max-sm:gap-4">
        {children}
      </main>
    </div>
  );
}
