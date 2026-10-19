import { describe, expect, it } from 'vitest';

import {
  detectVtopRoute,
  isSupportedVtopHost,
  VTOP_MATCH_PATTERNS,
} from '../../src/core/routing/vtop-route';

describe('VTOP route detection', () => {
  it('matches exact configured hosts only', () => {
    expect(isSupportedVtopHost('vtopcc.vit.ac.in')).toBe(true);
    expect(isSupportedVtopHost('evil-vtopcc.vit.ac.in')).toBe(false);
    expect(isSupportedVtopHost('vtopcc.vit.ac.in.evil.example')).toBe(false);
  });

  it('classifies stable route keywords without considering query strings', () => {
    expect(detectVtopRoute({ hostname: 'vtop.vit.ac.in', pathname: '/vtop/open/page/' }).page).toBe(
      'prelogin',
    );
    expect(
      detectVtopRoute({ hostname: 'vtop.vit.ac.in', pathname: '/vtop/student/attendance?tab=all' })
        .page,
    ).toBe('attendance');
    expect(
      detectVtopRoute({ hostname: 'vtop.vit.ac.in', pathname: '/vtop/class-timetable' }).page,
    ).toBe('timetable');
  });

  it('rejects unsupported hosts', () => {
    expect(detectVtopRoute({ hostname: 'example.com', pathname: '/vtop/attendance' })).toEqual({
      supportedHost: false,
      page: 'unknown',
    });
  });

  it('only injects on HTTPS portal hosts', () => {
    expect(VTOP_MATCH_PATTERNS.every((pattern) => pattern.startsWith('https://'))).toBe(true);
    expect(VTOP_MATCH_PATTERNS).not.toContain('*://vtop.vit.ac.in/*');
  });
});
