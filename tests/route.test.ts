import { describe, expect, it } from 'vitest';
import { profileFromPath } from '../src/lib/route';

describe('profileFromPath', () => {
  it.each([
    ['/@tiktok', 'tiktok'],
    ['/@khaby.lame/', 'khaby.lame'],
    ['/@user_name', 'user_name'],
    ['/@user/video/123', null],
    ['/foryou', null],
    ['/', null],
  ])('%s → %s', (path, expected) => {
    expect(profileFromPath(path)).toBe(expected);
  });
});
