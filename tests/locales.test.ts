import { describe, expect, it } from 'vitest';
import manifest from '../manifest.json';
import en from '../_locales/en/messages.json';
import id from '../_locales/id/messages.json';

type Messages = Record<string, { message: string; description?: string }>;

const messages: Record<string, Messages> = { id, en };
// Batas Chrome Web Store / manifest.
const LIMITS = { name: 75, short_name: 12, description: 132 } as const;

describe('_locales', () => {
  it('default_locale = id dan ada di _locales', () => {
    expect(manifest.default_locale).toBe('id');
    expect(messages).toHaveProperty(manifest.default_locale);
  });
  it('semua locale punya key yang sama', () => {
    const keys = (m: Messages) => Object.keys(m).sort();
    for (const m of Object.values(messages)) expect(keys(m)).toEqual(keys(id));
  });
  it('field __MSG_ di manifest ada di tiap locale dan tidak melewati batas karakter', () => {
    for (const [field, max] of Object.entries(LIMITS) as [keyof typeof LIMITS, number][]) {
      const key = /^__MSG_(\w+)__$/.exec(manifest[field])?.[1];
      expect(key, field).toBeTruthy();
      for (const [l, m] of Object.entries(messages)) {
        const text = m[key!]?.message;
        expect(text, `${l}.${key}`).toBeTruthy();
        expect([...text].length, `${l}.${key}`).toBeLessThanOrEqual(max);
      }
    }
  });
});
