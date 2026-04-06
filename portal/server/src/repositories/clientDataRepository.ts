import db from '../db/pool';
import crypto from 'crypto';

export interface AcademicGdpRow {
  id: string;
  gdpType: string;
  date: string;
  year: number;
  quarter: number;
  date2: string;
  beaActual: string;
  atlasPredicted: string;
}

export interface QuarterlyTimeSeriesRow {
  id: string;
  date: string;
  year: number;
  quarter: number;
  date2: string;
  usGdp: string;
  atlasPredicted: string;
}

export interface WeeklyTimeSeriesRow {
  id: string;
  predictionQuarter: string;
  date: string;
  year: number;
  dayOfWeek: string;
  month: string;
  coreGdp: number | null;
  coreGdpUpdated: number | null;
  netExports: number | null;
  privateInventories: number | null;
  gdp: number | null;
}

export interface WeeklyFinancialTargetRow {
  id: string;
  section: string;
  etf: string;
  targetPrice: number | null;
  tradingPrice: number | null;
  deviation: string;
}

export interface NxResultRow {
  id: string;
  date: string;
  year: number;
  quarter: number;
  date2: string;
  tradeBalance: number | null;
  tradeBalancePctCh: string;
  nxResults: string;
}

export interface PiResultRow {
  id: string;
  date: string;
  year: number;
  quarter: number;
  date2: string;
  privateInventories: string;
}

export const ClientDataRepository = {
  clearTable(table: string): void {
    const allowed = ['quarterly_time_series', 'weekly_time_series', 'weekly_financial_targets', 'nx_results', 'pi_results', 'academic_gdp'];
    if (!allowed.includes(table)) return;
    db.prepare(`DELETE FROM ${table}`).run();
  },

  clearAcademicGdpByType(gdpType: string): void {
    db.prepare('DELETE FROM academic_gdp WHERE gdp_type = ?').run(gdpType);
  },

  bulkInsertAcademicGdp(ingestionId: string, rows: Omit<AcademicGdpRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO academic_gdp (id, ingestion_id, gdp_type, date, year, quarter, date2, bea_actual, atlas_predicted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.gdpType, r.date, r.year, r.quarter, r.date2, r.beaActual, r.atlasPredicted);
      }
    });
    tx();
    return rows.length;
  },

  getAcademicGdp(gdpType: string, dateStart?: string, dateEnd?: string): AcademicGdpRow[] {
    let sql = 'SELECT * FROM academic_gdp WHERE gdp_type = ?';
    const params: string[] = [gdpType];
    if (dateStart) { sql += ' AND date >= ?'; params.push(dateStart); }
    if (dateEnd) { sql += ' AND date <= ?'; params.push(dateEnd); }
    sql += ' ORDER BY date DESC';
    return (db.prepare(sql).all(...params) as any[]).map(r => ({
      id: r.id, gdpType: r.gdp_type, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      beaActual: r.bea_actual || '', atlasPredicted: r.atlas_predicted || '',
    }));
  },

  bulkInsertQuarterlyTimeSeries(ingestionId: string, rows: Omit<QuarterlyTimeSeriesRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO quarterly_time_series (id, ingestion_id, date, year, quarter, date2, us_gdp, atlas_predicted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.date, r.year, r.quarter, r.date2, r.usGdp, r.atlasPredicted);
      }
    });
    tx();
    return rows.length;
  },

  getQuarterlyTimeSeries(dateStart?: string, dateEnd?: string, quarter?: string): QuarterlyTimeSeriesRow[] {
    let sql = 'SELECT * FROM quarterly_time_series';
    const params: string[] = [];
    const conditions: string[] = [];
    if (dateStart) { conditions.push('date >= ?'); params.push(dateStart); }
    if (dateEnd) { conditions.push('date <= ?'); params.push(dateEnd); }
    if (quarter) { conditions.push('date2 = ?'); params.push(quarter); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY date DESC';
    return (db.prepare(sql).all(...params) as any[]).map(r => ({
      id: r.id, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      usGdp: r.us_gdp || '', atlasPredicted: r.atlas_predicted || '',
    }));
  },

  bulkInsertWeeklyTimeSeries(ingestionId: string, rows: Omit<WeeklyTimeSeriesRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO weekly_time_series (id, ingestion_id, prediction_quarter, date, year, day_of_week, month, core_gdp, core_gdp_updated, net_exports, private_inventories, gdp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.predictionQuarter, r.date, r.year, r.dayOfWeek, r.month,
          r.coreGdp, r.coreGdpUpdated, r.netExports, r.privateInventories, r.gdp);
      }
    });
    tx();
    return rows.length;
  },

  bulkInsertFinancialTargets(ingestionId: string, rows: Omit<WeeklyFinancialTargetRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO weekly_financial_targets (id, ingestion_id, section, etf, target_price, trading_price, deviation)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.section, r.etf, r.targetPrice, r.tradingPrice, r.deviation);
      }
    });
    tx();
    return rows.length;
  },

  bulkInsertNxResults(ingestionId: string, rows: Omit<NxResultRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO nx_results (id, ingestion_id, date, year, quarter, date2, trade_balance, trade_balance_pct_ch, nx_results)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.date, r.year, r.quarter, r.date2, r.tradeBalance, r.tradeBalancePctCh, r.nxResults);
      }
    });
    tx();
    return rows.length;
  },

  bulkInsertPiResults(ingestionId: string, rows: Omit<PiResultRow, 'id'>[]): number {
    const insert = db.prepare(
      `INSERT INTO pi_results (id, ingestion_id, date, year, quarter, date2, private_inventories)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      for (const r of rows) {
        insert.run(crypto.randomBytes(16).toString('hex'), ingestionId,
          r.date, r.year, r.quarter, r.date2, r.privateInventories);
      }
    });
    tx();
    return rows.length;
  },

  getWeeklyTimeSeries(quarter?: string): WeeklyTimeSeriesRow[] {
    let sql = 'SELECT * FROM weekly_time_series';
    const params: string[] = [];
    if (quarter) { sql += ' WHERE prediction_quarter = ?'; params.push(quarter); }
    sql += ' ORDER BY date DESC';
    return (db.prepare(sql).all(...params) as any[]).map(r => ({
      id: r.id, predictionQuarter: r.prediction_quarter, date: r.date,
      year: r.year, dayOfWeek: r.day_of_week, month: r.month,
      coreGdp: r.core_gdp, coreGdpUpdated: r.core_gdp_updated,
      netExports: r.net_exports, privateInventories: r.private_inventories, gdp: r.gdp,
    }));
  },

  getFinancialTargets(): WeeklyFinancialTargetRow[] {
    return (db.prepare('SELECT * FROM weekly_financial_targets ORDER BY section, etf').all() as any[]).map(r => ({
      id: r.id, section: r.section, etf: r.etf,
      targetPrice: r.target_price, tradingPrice: r.trading_price, deviation: r.deviation,
    }));
  },

  getNxResults(dateStart?: string, dateEnd?: string): NxResultRow[] {
    let sql = 'SELECT * FROM nx_results';
    const params: string[] = [];
    const conditions: string[] = [];
    if (dateStart) { conditions.push('date >= ?'); params.push(dateStart); }
    if (dateEnd) { conditions.push('date <= ?'); params.push(dateEnd); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY date DESC';
    return (db.prepare(sql).all(...params) as any[]).map(r => ({
      id: r.id, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      tradeBalance: r.trade_balance, tradeBalancePctCh: r.trade_balance_pct_ch, nxResults: r.nx_results,
    }));
  },

  getPiResults(dateStart?: string, dateEnd?: string): PiResultRow[] {
    let sql = 'SELECT * FROM pi_results';
    const params: string[] = [];
    const conditions: string[] = [];
    if (dateStart) { conditions.push('date >= ?'); params.push(dateStart); }
    if (dateEnd) { conditions.push('date <= ?'); params.push(dateEnd); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY date DESC';
    return (db.prepare(sql).all(...params) as any[]).map(r => ({
      id: r.id, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      privateInventories: r.private_inventories,
    }));
  },

  getWeeklyTimeSeriesQuarters(): string[] {
    return (db.prepare('SELECT DISTINCT prediction_quarter FROM weekly_time_series ORDER BY prediction_quarter DESC').all() as any[])
      .map(r => r.prediction_quarter);
  },

  getAllQuarters(): string[] {
    const quarters = new Set<string>();
    (db.prepare("SELECT DISTINCT date2 FROM quarterly_time_series WHERE date2 != '' ORDER BY date2").all() as any[])
      .forEach(r => quarters.add(r.date2));
    (db.prepare("SELECT DISTINCT prediction_quarter FROM weekly_time_series ORDER BY prediction_quarter").all() as any[])
      .forEach(r => quarters.add(r.prediction_quarter));
    (db.prepare("SELECT DISTINCT date2 FROM nx_results WHERE date2 != '' ORDER BY date2").all() as any[])
      .forEach(r => quarters.add(r.date2));
    (db.prepare("SELECT DISTINCT date2 FROM pi_results WHERE date2 != '' ORDER BY date2").all() as any[])
      .forEach(r => quarters.add(r.date2));
    (db.prepare("SELECT DISTINCT date2 FROM academic_gdp WHERE date2 != '' ORDER BY date2").all() as any[])
      .forEach(r => quarters.add(r.date2));
    return Array.from(quarters).sort().reverse();
  },
};
