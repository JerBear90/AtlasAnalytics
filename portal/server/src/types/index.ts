// ── User & Auth ──

export enum UserRole {
  RETAIL = 'retail',
  INSTITUTIONAL = 'institutional',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserType {
  RETAIL = 'retail',
  ACADEMIC = 'academic',
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType: UserType;
  company: string;
  subscriber: string;
  primaryContact: string;
  servicePeriodStart: string;
  servicePeriodEnd: string;
  workbookDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Data Scope & Permissions ──

export type ExportFormat = 'csv' | 'json' | 'all';

export interface DataScope {
  timeRange: 'current_quarter' | 'full_history';
  countries: 'limited' | 'all_38';
  components: 'summary' | 'full_breakdown' | 'custom';
  exportFormats: ExportFormat[];
}

// ── Economic Data ──

export interface EconomicDataRecord {
  id: string;
  ingestionId: string;
  countryCode: string;
  indicatorType: string;
  quarter: string;
  observationDate: Date;
  value: number;
  metadata: Record<string, unknown>;
}

// ── CSV Pipeline ──

export interface CSVSchemaColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'enum';
  required: boolean;
  enumValues?: string[];
  pattern?: string;
}

export interface CSVSchema {
  columns: CSVSchemaColumn[];
  requiredColumns: string[];
}

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
  uploadedAt: Date;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

// ── Dashboard ──

export interface DashboardFilters {
  dateRange?: { start: Date; end: Date };
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

// ── Export ──

export interface ExportResult {
  filename: string;
  contentType: string;
  data: Buffer;
  metadata: {
    exportedAt: Date;
    rowCount: number;
    format: ExportFormat;
    filters: DashboardFilters;
  };
}
