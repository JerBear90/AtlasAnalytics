import { parse } from 'csv-parse/sync';
import {
  CSVSchema,
  CSVSchemaColumn,
  IngestionResult,
  RowValidationError,
  EconomicDataRecord,
} from '../types';
import { IngestionRepository } from '../repositories/ingestionRepository';
import { EconomicDataRepository } from '../repositories/economicDataRepository';

// Default schema for Atlas economic data CSVs
const DEFAULT_SCHEMA: CSVSchema = {
  columns: [
    { name: 'country_code', type: 'string', required: true, pattern: '^[A-Z]{2,3}$' },
    { name: 'indicator_type', type: 'string', required: true },
    { name: 'quarter', type: 'string', required: true, pattern: '^Q[1-4]\\s\\d{4}$' },
    { name: 'observation_date', type: 'date', required: true },
    { name: 'value', type: 'number', required: true },
  ],
  requiredColumns: ['country_code', 'indicator_type', 'quarter', 'observation_date', 'value'],
};

export class CSVPipelineError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'CSVPipelineError';
  }
}

function validateRow(
  row: Record<string, string>,
  rowIndex: number,
  schema: CSVSchema
): RowValidationError[] {
  const errors: RowValidationError[] = [];

  for (const col of schema.columns) {
    const value = row[col.name];

    // Required check
    if (col.required && (value === undefined || value === null || value.trim() === '')) {
      errors.push({ row: rowIndex, column: col.name, message: `Required field is missing or empty`, value: value ?? '' });
      continue;
    }

    if (value === undefined || value === null || value.trim() === '') continue;

    const trimmed = value.trim();

    // Type validation
    switch (col.type) {
      case 'number': {
        const num = Number(trimmed);
        if (isNaN(num)) {
          errors.push({ row: rowIndex, column: col.name, message: `Expected a number`, value: trimmed });
        }
        break;
      }
      case 'date': {
        const d = new Date(trimmed);
        if (isNaN(d.getTime())) {
          errors.push({ row: rowIndex, column: col.name, message: `Expected a valid date`, value: trimmed });
        }
        break;
      }
      case 'enum': {
        if (col.enumValues && !col.enumValues.includes(trimmed)) {
          errors.push({ row: rowIndex, column: col.name, message: `Value must be one of: ${col.enumValues.join(', ')}`, value: trimmed });
        }
        break;
      }
      case 'string': {
        if (col.pattern) {
          const regex = new RegExp(col.pattern);
          if (!regex.test(trimmed)) {
            errors.push({ row: rowIndex, column: col.name, message: `Value does not match expected pattern`, value: trimmed });
          }
        }
        break;
      }
    }
  }

  return errors;
}

function rowToRecord(row: Record<string, string>): Omit<EconomicDataRecord, 'id' | 'ingestionId'> {
  // Collect any extra columns as metadata
  const knownCols = new Set(['country_code', 'indicator_type', 'quarter', 'observation_date', 'value']);
  const metadata: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    if (!knownCols.has(key) && val !== undefined && val.trim() !== '') {
      metadata[key] = val.trim();
    }
  }

  return {
    countryCode: row.country_code.trim(),
    indicatorType: row.indicator_type.trim(),
    quarter: row.quarter.trim(),
    observationDate: new Date(row.observation_date.trim()),
    value: parseFloat(row.value.trim()),
    metadata,
  };
}

export const CSVPipelineService = {
  async ingestCSV(
    file: Buffer,
    filename: string,
    uploaderId: string,
    schema: CSVSchema = DEFAULT_SCHEMA
  ): Promise<IngestionResult> {
    const content = file.toString('utf-8').trim();

    // Empty file check
    if (!content) {
      throw new CSVPipelineError('CSV file is empty.');
    }

    // Parse CSV
    let rows: Record<string, string>[];
    try {
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err) {
      throw new CSVPipelineError(`Failed to parse CSV: ${(err as Error).message}`);
    }

    // Header-only check
    if (rows.length === 0) {
      throw new CSVPipelineError('CSV file contains only headers with no data rows.');
    }

    // Check required columns exist
    const headerKeys = Object.keys(rows[0]);
    for (const reqCol of schema.requiredColumns) {
      if (!headerKeys.includes(reqCol)) {
        throw new CSVPipelineError(`Missing required column: ${reqCol}`);
      }
    }

    // Validate each row
    const allErrors: RowValidationError[] = [];
    const validRecords: Omit<EconomicDataRecord, 'id' | 'ingestionId'>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowErrors = validateRow(rows[i], i + 1, schema); // 1-indexed row numbers
      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors);
      } else {
        validRecords.push(rowToRecord(rows[i]));
      }
    }

    // Store ingestion record
    const ingestionId = await IngestionRepository.create({
      filename,
      uploaderId,
      totalRows: rows.length,
      validRows: validRecords.length,
      invalidRows: rows.length - validRecords.length,
      errors: allErrors,
    });

    // Bulk insert valid records
    if (validRecords.length > 0) {
      await EconomicDataRepository.bulkInsert(ingestionId, validRecords);
    }

    return {
      success: allErrors.length === 0,
      totalRows: rows.length,
      validRows: validRecords.length,
      invalidRows: rows.length - validRecords.length,
      errors: allErrors,
      ingestionId,
    };
  },

  // Exposed for testing
  validateRow,
  rowToRecord,
  DEFAULT_SCHEMA,
};
