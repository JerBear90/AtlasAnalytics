import fs from 'fs';
import path from 'path';
import db from './pool';
import { CSVPipelineService } from '../services/csvPipelineService';

async function seedClientData() {
  // Check if data already exists
  const wtsCount = (db.prepare('SELECT COUNT(*) as c FROM weekly_time_series').get() as any).c;
  // Check if quarterly data already exists (weekly was seeded earlier)
  const qtsCount = (db.prepare('SELECT COUNT(*) as c FROM quarterly_time_series').get() as any).c;
  if (qtsCount > 0 && wtsCount > 0) {
    console.log('Client product data already seeded, skipping.');
    return;
  }

  // Get admin user id for uploader
  const admin = db.prepare("SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1").get() as any;
  if (!admin) {
    console.log('No admin user found, skipping client data seed.');
    return;
  }

  const sampleDir = path.join(__dirname, '..', '..', '..', 'data');
  const files = [
    'Client Product Type 1(Quarterly Time Series).csv',
    'Client Product Type 1(Weekly Time Series).csv',
    'Client Product Type 1(Weekly Financial Targets).csv',
    'Client Product Type 1(NX Results).csv',
    'Client Product Type 1(PI Results).csv',
  ];

  for (const file of files) {
    const filePath = path.join(sampleDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${file} (not found)`);
      continue;
    }
    const buffer = fs.readFileSync(filePath);
    try {
      const result = await CSVPipelineService.ingestCSV(buffer, file, admin.id);
      console.log(`  ${file}: ${result.validRows}/${result.totalRows} rows ingested`);
    } catch (err) {
      console.error(`  ${file}: Error - ${(err as Error).message}`);
    }
  }

  console.log('Client product data seeded.');
}

seedClientData().catch(console.error);
