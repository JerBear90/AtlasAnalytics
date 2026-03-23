import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../services/authService';
import { CSVPipelineError } from '../services/csvPipelineService';
import { ExportError } from '../services/exportService';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof CSVPipelineError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ExportError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Multer file size error
  if (err.message?.includes('File too large')) {
    res.status(413).json({ error: 'File size exceeds the 10MB limit.' });
    return;
  }

  // Validation errors (e.g. JSON parse)
  if (err.name === 'SyntaxError') {
    res.status(400).json({ error: 'Invalid request body.' });
    return;
  }

  res.status(500).json({ error: 'Internal server error.' });
}
