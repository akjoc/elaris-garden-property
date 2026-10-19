import { describe, it, expect } from 'vitest';
import {
  residences, commercial, filterHomes, filterCommercial, areaBounds, unitPosition, PAYMENT,
} from './data';

describe('inventory totals & uniqueness', () => {
  it('has 216 homes and 48 commercial spaces', () => {
    expect(residences).toHaveLength(216);
    expect(commercial).toHaveLength(48);
    expect(commercial.filter((c) => c.kind === 'office')).toHaveLength(30);
    expect(commercial.filter((c) => c.kind === 'retail')).toHaveLength(18);
  });
  it('category totals match the brief', () => {
    const count = (c: string) => residences.filter((r) => r.category === c).length;
    expect(count('studio')).toBe(50);
    expect(count('1bed') + count('1study')).toBe(38);
    expect(count('2bed')).toBe(78);
    expect(count('3bed')).toBe(30);
    expect(count('4bed')).toBe(20);
  });
  it('slugs, ids and meshIds are unique', () => {
    const all = [...residences, ...commercial];
    expect(new Set(all.map((p) => p.slug)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.meshId)).size).toBe(all.length);
  });
  it('18 units per wing per floor', () => {
    for (const wing of ['east', 'west']) for (let f = 1; f <= 6; f++)
      expect(residences.filter((r) => r.wing === wing && r.floor === f)).toHaveLength(18);
  });
});
describe('room areas sum to totals', () => {
  it('every property rooms sum to its area (±0.15)', () => {
    for (const p of [...residences, ...commercial]) {
      const s = p.rooms.reduce((a, r) => a + r.area, 0);
      expect(Math.abs(s - p.area)).toBeLessThan(0.15);
    }
  });
  it('E 1.01 is the 41.80 m² studio exemplar', () => {
    const e = residences.find((r) => r.slug === 'e-1-01')!;
    expect(e.area).toBe(41.8);
    expect(e.rooms.reduce((a, r) => a + r.area, 0)).toBeCloseTo(41.8, 5);
  });
  it('payment stages total 100%', () => { expect(PAYMENT.reduce((a, b) => a + b, 0)).toBe(100); });
});
describe('filter semantics', () => {
  const base = { cats: [] as never[], area: areaBounds(residences) as [number, number], floor: [1, 6] as [number, number], balcony: false, garden: false, wings: [] as never[] };
  it('no filters returns all homes', () => { expect(filterHomes(base as any)).toHaveLength(216); });
  it('category OR within group', () => {
    const r = filterHomes({ ...base, cats: ['studio', '4bed'] } as any);
    expect(r).toHaveLength(70);
    expect(r.every((x) => x.category === 'studio' || x.category === '4bed')).toBe(true);
  });
  it('groups combine with AND', () => {
    const r = filterHomes({ ...base, cats: ['studio'], wings: ['east'] } as any);
    expect(r.every((x) => x.category === 'studio' && x.wing === 'east')).toBe(true);
    expect(r.length).toBeLessThan(50);
  });
  it('feature balcony/garden use OR', () => {
    const both = filterHomes({ ...base, balcony: true, garden: true } as any);
    const balcOnly = filterHomes({ ...base, balcony: true } as any);
    expect(both.length).toBeGreaterThanOrEqual(balcOnly.length);
    expect(both.every((x) => x.balcony || x.garden)).toBe(true);
  });
  it('commercial office-wing filter keeps retail', () => {
    const r = filterCommercial({ type: 'all', area: areaBounds(commercial), floor: [0, 3], wings: ['east'] });
    expect(r.filter((x) => x.kind === 'retail')).toHaveLength(18);
    expect(r.filter((x) => x.kind === 'office').every((x) => x.wing === 'east')).toBe(true);
  });
  it('commercial type + floor apply to both kinds', () => {
    const r = filterCommercial({ type: 'all', area: areaBounds(commercial), floor: [1, 3], wings: [] });
    expect(r.every((x) => x.floor >= 1)).toBe(true);
    expect(r.filter((x) => x.kind === 'retail')).toHaveLength(0);
  });
});
describe('explorer mapping', () => {
  it('every property yields a finite unit position', () => {
    for (const p of [...residences, ...commercial]) {
      const { pos } = unitPosition(p);
      expect(pos.every(Number.isFinite)).toBe(true);
    }
  });
});
