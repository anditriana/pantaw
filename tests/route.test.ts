import { describe, expect, it } from 'vitest';
import { igProfileFromPath, platformFromHost, profileFromPath } from '../src/lib/route';

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

describe('igProfileFromPath', () => {
  it.each([
    ['/raditya_dika/', { username: 'raditya_dika', reelsTab: false }],
    ['/natgeo', { username: 'natgeo', reelsTab: false }],
    ['/raditya_dika/reels/', { username: 'raditya_dika', reelsTab: true }],
    ['/raditya_dika/tagged/', { username: 'raditya_dika', reelsTab: false }],
    ['/user.name_1/', { username: 'user.name_1', reelsTab: false }],
    ['/p/DehH8gQpyyv/', null],
    ['/reel/DehH8gQpyyv/', null],
    ['/raditya_dika/p/DehH8gQpyyv/', null],
    ['/explore/', null],
    ['/stories/natgeo/123/', null],
    ['/accounts/edit/', null],
    ['/direct/inbox/', null],
    ['/reels/', null],
    ['/', null],
  ])('%s', (path, expected) => {
    expect(igProfileFromPath(path)).toEqual(expected);
  });
});

describe('platformFromHost', () => {
  it('hanya www.tiktok.com dan www.instagram.com', () => {
    expect(platformFromHost('www.tiktok.com')).toBe('tiktok');
    expect(platformFromHost('www.instagram.com')).toBe('instagram');
    expect(platformFromHost('instagram.com.evil.test')).toBeNull();
  });
});
