export const VTOP_HOSTS = [
  'vtopcc.vit.ac.in',
  'vtop.vit.ac.in',
  'vtop2.vit.ac.in',
  'vtopbhopal.vit.ac.in',
  'vtop.vitap.ac.in',
] as const;

export const VTOP_MATCH_PATTERNS = [
  '*://vtopcc.vit.ac.in/*',
  '*://vtop.vit.ac.in/*',
  '*://vtop2.vit.ac.in/*',
  '*://vtopbhopal.vit.ac.in/*',
  '*://vtop.vitap.ac.in/*',
] as const;

export type VtopPage = 'prelogin' | 'login' | 'attendance' | 'timetable' | 'marks' | 'unknown';

export interface LocationLike {
  hostname: string;
  pathname: string;
}

export interface VtopRoute {
  supportedHost: boolean;
  page: VtopPage;
}

export function isSupportedVtopHost(hostname: string): boolean {
  return (VTOP_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

export function detectVtopRoute(location: LocationLike): VtopRoute {
  if (!isSupportedVtopHost(location.hostname)) {
    return { supportedHost: false, page: 'unknown' };
  }

  const path = location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path.endsWith('/open/page')) return { supportedHost: true, page: 'prelogin' };
  if (/login|studentlogin|authenticate/.test(path)) return { supportedHost: true, page: 'login' };
  if (/attendance|attendence/.test(path)) return { supportedHost: true, page: 'attendance' };
  if (/timetable|time-table|class_schedule|schedule/.test(path)) {
    return { supportedHost: true, page: 'timetable' };
  }
  if (/marks|grade|result|exam/.test(path)) return { supportedHost: true, page: 'marks' };
  return { supportedHost: true, page: 'unknown' };
}
