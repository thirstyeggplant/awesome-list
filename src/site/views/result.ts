export type ViewResult =
  | { kind: 'page'; html: string }
  | { kind: 'redirect'; status: 301 | 302; location: string }
  | null;

export const page = (html: string): ViewResult => ({ kind: 'page', html });
export const redirect = (location: string, status: 301 | 302 = 301): ViewResult => ({ kind: 'redirect', status, location });
