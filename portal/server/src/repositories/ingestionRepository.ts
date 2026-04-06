import db from '../db/pool';
import crypto from 'crypto';
import { IngestionRecord, RowValidationError } from '../types';

export const IngestionRepository = {
  async create(data: {
    filename: string;
    uploaderId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: RowValidationError[];
    filePath?: string;
  }): Promise<string> {
    const id = crypto.randomBytes(16).toString('hex');
    db.prepare(
      `INSERT INTO csv_ingestions (id, filename, uploader_id, total_rows, valid_rows, invalid_rows, error_details, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.filename, data.uploaderId, data.totalRows, data.validRows, data.invalidRows, JSON.stringify(data.errors), data.filePath || null);
    return id;
  },

  async findById(id: string): Promise<IngestionRecord | null> {
    const row = db.prepare(
      'SELECT id, filename, uploader_id, uploaded_at, total_rows, valid_rows, invalid_rows FROM csv_ingestions WHERE id = ?'
    ).get(id) as any;
    if (!row) return null;
    return {
      id: row.id, filename: row.filename, uploaderId: row.uploader_id,
      uploadedAt: new Date(row.uploaded_at), totalRows: row.total_rows,
      validRows: row.valid_rows, invalidRows: row.invalid_rows,
    };
  },

  async list(page: number, pageSize: number): Promise<(IngestionRecord & { errorDetails?: string })[]> {
    const offset = (page - 1) * pageSize;
    const rows = db.prepare(
      'SELECT id, filename, uploader_id, uploaded_at, total_rows, valid_rows, invalid_rows, error_details FROM csv_ingestions ORDER BY uploaded_at DESC LIMIT ? OFFSET ?'
    ).all(pageSize, offset) as any[];
    return rows.map((r) => ({
      id: r.id, filename: r.filename, uploaderId: r.uploader_id,
      uploadedAt: new Date(r.uploaded_at), totalRows: r.total_rows,
      validRows: r.valid_rows, invalidRows: r.invalid_rows,
      errorDetails: r.error_details || '[]',
    }));
  },

  async getHistory(page: number, pageSize: number): Promise<IngestionRecord[]> {
    return this.list(page, pageSize);
  },
};
