import db from '../db/pool';
import crypto from 'crypto';

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
    sql += ' ORDER BY date ASC';
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

  getNxResults(): NxResultRow[] {
    return (db.prepare('SELECT * FROM nx_results ORDER BY date ASC').all() as any[]).map(r => ({
      id: r.id, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      tradeBalance: r.trade_balance, tradeBalancePctCh: r.trade_balance_pct_ch, nxResults: r.nx_results,
    }));
  },

  getPiResults(): PiResultRow[] {
    return (db.prepare('SELECT * FROM pi_results ORDER BY date ASC').all() as any[]).map(r => ({
      id: r.id, date: r.date, year: r.year, quarter: r.quarter, date2: r.date2,
      privateInventories: r.private_inventories,
    }));
  },

  getWeeklyTimeSeriesQuarters(): string[] {
    return (db.prepare('SELECT DISTINCT prediction_quarter FROM weekly_time_series ORDER BY prediction_quarter DESC').all() as any[])
      .map(r => r.prediction_quarter);
  },
};
