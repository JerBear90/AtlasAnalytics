import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, ExportFormat, DashboardFilters } from '../types';
import api from '../api/client';

const ROLE_FORMATS: Record<string, ExportFormat[]> = {
  [UserRole.RETAIL]: ['csv'],
  [UserRole.INSTITUTIONAL]: ['csv', 'json'],
  [UserRole.ENTERPRISE]: ['csv', 'json'],
  [UserRole.ADMIN]: ['csv', 'json'],
  [UserRole.SUPER_ADMIN]: ['csv', 'json'],
};

export default function ExportButton({ filters, tab }: { filters: DashboardFilters; tab?: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const formats = ROLE_FORMATS[user?.role || UserRole.RETAIL] || ['csv'];

  const handleExport = async (format: ExportFormat) => {
    setLoading(true);
    setOpen(false);
    try {
      const params: Record<string, string> = {};
      if (filters.quarter) params.quarter = filters.quarter;
      if (filters.countries?.length) params.countries = filters.countries.join(',');
      if (filters.dateRange?.start) params.startDate = filters.dateRange.start;
      if (filters.dateRange?.end) params.endDate = filters.dateRange.end;
      if (tab) params.tab = tab;
      const { data, headers } = await api.get(`/export/${format}`, { params, responseType: 'blob' });
      const disposition = headers['content-disposition'] || '';
      const filename = disposition.match(/filename="(.+)"/)?.[1] || `atlas_export.${format}`;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (formats.length === 1) {
    return (
      <button onClick={() => handleExport(formats[0])} disabled={loading}
        className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition whitespace-nowrap cursor-pointer">
        {loading ? 'Exporting...' : 'Export Report'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="px-5 py-2.5 bg-[#6c5dd3] hover:bg-[#6c5dd3]/90 disabled:opacity-50 text-white text-sm font-medium rounded-md transition whitespace-nowrap cursor-pointer">
        {loading ? 'Exporting...' : 'Export Report ▾'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-[#1e1e2f] border border-[#2d2d44] rounded-lg shadow-xl z-10 min-w-[120px]">
          {formats.map(f => (
            <button key={f} onClick={() => handleExport(f)}
              className="block w-full text-left px-4 py-2.5 text-sm text-[#a0a0b0] hover:bg-[rgba(108,93,211,0.1)] hover:text-[#6c5dd3] transition first:rounded-t-lg last:rounded-b-lg cursor-pointer">
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
