import { describe, expect, it } from 'vitest';
import itemList from './fixtures/item_list.tiktok.json';
import universal from './fixtures/universal_data.tiktok.json';
import { computeMetrics, selectRecentVideos, type Metrics } from '../src/lib/metrics';
import { parseItemList, parseUniversalData } from '../src/lib/parse';
import { SHEET_COLUMNS, sheetHeader, sheetRow } from '../src/lib/sheet';

const profile = { uniqueId: 'budi', nickname: 'Budi', followers: 1234567 };
const metrics = (o: Partial<Metrics> = {}): Metrics => ({
  sampleSize: 12, followers: 1234567, avgViews: 1000.4, avgLikes: 59.5, avgComments: 3.49, avgShares: 0.5,
  erFollowers: 4.2149, erViews: 1, erViewsAvg: 0.005, ...o,
});
const date = new Date(2026, 9, 5, 23, 59);
const cells = (s: string) => s.split('\t');

describe('sheetHeader / sheetRow', () => {
  it('jumlah kolom header == baris', () => {
    expect(cells(sheetHeader())).toEqual(SHEET_COLUMNS);
    expect(cells(sheetRow(profile, metrics(), date))).toHaveLength(SHEET_COLUMNS.length);
    expect(sheetRow(profile, metrics(), date)).not.toMatch(/\n$/);
  });

  it('persentase 2 desimal dengan koma, tanpa tanda %', () => {
    const c = cells(sheetRow(profile, metrics(), date));
    expect(c.slice(7, 10)).toEqual(['4,21', '1,00', '0,01']);
  });

  it('rata-rata dibulatkan jadi bilangan bulat tanpa pemisah ribuan', () => {
    const c = cells(sheetRow(profile, metrics(), date));
    expect(c.slice(2, 7)).toEqual(['1234567', '1000', '60', '3', '1']);
  });

  it('ER null → sel kosong', () => {
    const c = cells(sheetRow(profile, metrics({ erFollowers: null, erViews: null, erViewsAvg: null }), date));
    expect(c.slice(7, 10)).toEqual(['', '', '']);
    expect(c).toHaveLength(SHEET_COLUMNS.length);
  });

  it('nickname dengan tab/newline dibersihkan', () => {
    const c = cells(sheetRow({ ...profile, nickname: ' Bu\tdi\r\nX ' }, metrics(), date));
    expect(c).toHaveLength(SHEET_COLUMNS.length);
    expect(c[1]).toBe('Bu di  X');
  });

  it('username ber-@, tanggal lokal YYYY-MM-DD, link profil', () => {
    const c = cells(sheetRow(profile, metrics(), date));
    expect(c[0]).toBe('@budi');
    expect(c[10]).toBe('12');
    expect(c[11]).toBe('2026-10-05');
    expect(c[12]).toBe('https://www.tiktok.com/@budi');
  });

  it('fixture asli @tiktok', () => {
    const p = parseUniversalData(universal)!;
    const m = computeMetrics(p.followers, selectRecentVideos(parseItemList(itemList).videos))!;
    const c = cells(sheetRow(p, m, date));
    expect(c).toHaveLength(SHEET_COLUMNS.length);
    expect(c[0]).toBe('@tiktok');
    expect(c[2]).toBe('96199454');
    expect(c[8]).toBe('3,01'); // (113411+23472+7916)/4810900 × 100 = 3,0100…
    expect(c[9]).toBe('3,21');
    expect(c[10]).toBe('12');
  });
});
