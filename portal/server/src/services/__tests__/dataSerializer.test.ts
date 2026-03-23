import fc from 'fast-check';
import { serialize, deserialize } from '../dataSerializer';
import { EconomicDataRecord } from '../../types';

/**
 * Property 2: Serialization round-trip
 * Validates: Requirements 4.8
 *
 * For any valid EconomicDataRecord, deserialize(serialize(record))
 * should produce an equivalent record.
 */

// Generator for valid EconomicDataRecord
const economicDataRecordArb = fc.record({
  id: fc.uuid(),
  ingestionId: fc.uuid(),
  countryCode: fc.stringOf(fc.constantFrom('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'), { minLength: 2, maxLength: 3 }),
  indicatorType: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')), { minLength: 3, maxLength: 30 }),
  quarter: fc.tuple(
    fc.constantFrom('Q1', 'Q2', 'Q3', 'Q4'),
    fc.integer({ min: 2000, max: 2030 })
  ).map(([q, y]) => `${q} ${y}`),
  observationDate: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
  value: fc.double({ min: -1e12, max: 1e12, noNaN: true, noDefaultInfinity: true }),
  metadata: fc.dictionary(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
    fc.oneof(fc.string(), fc.double({ noNaN: true, noDefaultInfinity: true }), fc.boolean(), fc.constant(null))
  ),
});

describe('Data Serializer - Round-trip property', () => {
  test('deserialize(serialize(record)) produces equivalent record', () => {
    fc.assert(
      fc.property(economicDataRecordArb, (record: EconomicDataRecord) => {
        const roundTripped = deserialize(serialize(record));

        expect(roundTripped.id).toBe(record.id);
        expect(roundTripped.ingestionId).toBe(record.ingestionId);
        expect(roundTripped.countryCode).toBe(record.countryCode);
        expect(roundTripped.indicatorType).toBe(record.indicatorType);
        expect(roundTripped.quarter).toBe(record.quarter);
        expect(roundTripped.value).toBeCloseTo(record.value, 6);
        // Metadata: JSON round-trip normalizes -0 to 0, compare via JSON to match serialization semantics
        expect(roundTripped.metadata).toEqual(JSON.parse(JSON.stringify(record.metadata)));

        // Date comparison — compare ISO strings since Date precision can vary
        expect(roundTripped.observationDate.toISOString()).toBe(record.observationDate.toISOString());
      }),
      { numRuns: 200 }
    );
  });

  test('serialize produces valid JSON', () => {
    fc.assert(
      fc.property(economicDataRecordArb, (record: EconomicDataRecord) => {
        const json = serialize(record);
        expect(() => JSON.parse(json)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
