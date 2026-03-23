// ── User & Auth ──

export enum UserRole {
  RETAIL = 'retail',
  INSTITUTIONAL = 'institutional',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ── Data Scope & Permissions ──

export type ExportFormat = 'csv' | 'json' | 'all';

export interface DataScope {
  timeRange: 'current_quarter' | 'full_history';
  countries: 'limited' | 'all_38';
  components: 'summary' | 'full_breakdown' | 'custom';
  exportFormats: ExportFormat[];
}

// ── Dashboard ──

export interface DashboardFilters {
  dateRange?: { start: string; end: string };
  quarter?: string;
  countries?: string[];
}

export interface KPIData {
  label: string;
  value: number;
  unit: string;
  trend: { direction: 'up' | 'down' | 'flat'; delta: number };
}

export interface ChartDataSet {
  label: string;
  type: 'line' | 'bar' | 'waterfall';
  labels: string[];
  data: number[];
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface DashboardData {
  kpis: KPIData[];
  charts: ChartDataSet[];
  tables: TableData[];
}

export interface FilterOptions {
  quarters: string[];
  countries: string[];
  dateRanges: { label: string; value: string }[];
}

// ── CSV Pipeline (for admin UI) ──

export interface IngestionResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: RowValidationError[];
  ingestionId: string;
}

export interface RowValidationError {
  row: number;
  column: string;
  message: string;
  value: string;
}

export interface IngestionRecord {
  id: string;
  filename: string;
  uploaderId: string;
  uploadedAt: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}
