import { EconomicDataRecord } from '../types';

interface SerializedRecord {
  id: string;
  ingestionId: string;
  countryCode: string;
  indicatorType: string;
  quarter: string;
  observationDate: string; // ISO 8601
  value: number;
  metadata: Record<string, unknown>;
}

export function serialize(record: EconomicDataRecord): string {
  const serialized: SerializedRecord = {
    id: record.id,
    ingestionId: record.ingestionId,
    countryCode: record.countryCode,
    indicatorType: record.indicatorType,
    quarter: record.quarter,
    observationDate: record.observationDate instanceof Date
      ? record.observationDate.toISOString()
      : record.observationDate,
    value: record.value,
    metadata: record.metadata,
  };
  return JSON.stringify(serialized);
}

export function deserialize(json: string): EconomicDataRecord {
  const parsed: SerializedRecord = JSON.parse(json);
  return {
    id: parsed.id,
    ingestionId: parsed.ingestionId,
    countryCode: parsed.countryCode,
    indicatorType: parsed.indicatorType,
    quarter: parsed.quarter,
    observationDate: new Date(parsed.observationDate),
    value: parsed.value,
    metadata: parsed.metadata,
  };
}
