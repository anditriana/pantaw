import { describe, expect, it } from 'vitest';
import { COLUMNS, DEFAULT_CONFIG, moveColumn, normalizeConfig, toggleColumn } from '../src/lib/columns';

const ids = (c: { id: string }[]) => c.map((x) => x.id);

describe('normalizeConfig', () => {
  it('bukan array → default', () => {
    for (const raw of [undefined, null, 'x', 5, {}]) expect(normalizeConfig(raw)).toEqual(DEFAULT_CONFIG);
  });
  it('buang elemen sampah, id asing, dan duplikat', () => {
    const out = normalizeConfig([null, 3, { id: 7 }, { id: 'zzz' }, { id: 'link', enabled: false }, { id: 'link', enabled: true }]);
    expect(ids(out).filter((i) => i === 'link')).toHaveLength(1);
    expect(out[0]).toEqual({ id: 'link', enabled: false });
    expect(ids(out)).not.toContain('zzz');
  });
  it('id yang hilang ditambahkan di akhir (aktif)', () => {
    const out = normalizeConfig([{ id: 'tanggal', enabled: true }]);
    expect(out).toHaveLength(COLUMNS.length);
    expect(out[0].id).toBe('tanggal');
    expect(out.slice(1).every((c) => c.enabled)).toBe(true);
    expect(ids(out).slice(1)).toEqual(ids(DEFAULT_CONFIG).filter((i) => i !== 'tanggal'));
  });
  it('mengembalikan salinan, bukan DEFAULT_CONFIG itu sendiri', () => {
    expect(normalizeConfig(null)).not.toBe(DEFAULT_CONFIG);
  });
});

describe('moveColumn', () => {
  it('menukar dengan tetangga', () => {
    expect(ids(moveColumn(DEFAULT_CONFIG, 'nama', -1)).slice(0, 2)).toEqual(['nama', 'username']);
    expect(ids(moveColumn(DEFAULT_CONFIG, 'username', 1)).slice(0, 2)).toEqual(['nama', 'username']);
  });
  it('di tepi / id asing → tidak berubah', () => {
    expect(moveColumn(DEFAULT_CONFIG, 'username', -1)).toEqual(DEFAULT_CONFIG);
    expect(moveColumn(DEFAULT_CONFIG, 'link', 1)).toEqual(DEFAULT_CONFIG);
    expect(moveColumn(DEFAULT_CONFIG, 'zzz', 1)).toEqual(DEFAULT_CONFIG);
  });
  it('tidak memutasi input', () => {
    const before = JSON.stringify(DEFAULT_CONFIG);
    moveColumn(DEFAULT_CONFIG, 'nama', -1);
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before);
  });
});

describe('toggleColumn', () => {
  it('membalik enabled satu kolom saja', () => {
    const out = toggleColumn(DEFAULT_CONFIG, 'nama');
    expect(out.find((c) => c.id === 'nama')!.enabled).toBe(false);
    expect(out.filter((c) => !c.enabled)).toHaveLength(1);
    expect(DEFAULT_CONFIG.every((c) => c.enabled)).toBe(true);
    expect(toggleColumn(out, 'nama')).toEqual(DEFAULT_CONFIG);
  });
});
