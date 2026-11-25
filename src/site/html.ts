// HTML built with one tagged template that escapes everything it is given,
// unless it was made with `html` or `raw`. Outbound links take http(s) addresses only.

export class Html {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export type Part = Html | string | number | null | undefined | false | readonly Part[];

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

function render(part: Part): string {
  if (part === null || part === undefined || part === false) return '';
  if (part instanceof Html) return part.value;
  if (typeof part === 'number') return String(part);
  if (typeof part === 'string') return escape(part);
  return part.map(render).join('');
}

export function html(strings: TemplateStringsArray, ...parts: Part[]): Html {
  let out = strings[0] ?? '';
  for (let i = 0; i < parts.length; i++) out += render(parts[i]) + (strings[i + 1] ?? '');
  return new Html(out);
}

/** Text that is already HTML. Only for what this code wrote itself. */
export function raw(text: string): Html {
  return new Html(text);
}

export function join(parts: readonly Part[], sep: Part = ''): Html {
  const out: string[] = [];
  for (const p of parts) out.push(render(p));
  return new Html(out.join(render(sep)));
}

/** The address when it is http(s), else null. */
export function safeHref(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
}

/** A link to another site; for anything but http(s) the text alone. */
export function outbound(url: string, text: Part, attrs: { rel?: string; cls?: string } = {}): Html {
  const href = safeHref(url);
  if (href === null) return html`${text}`;
  const rel = attrs.rel ?? 'noopener';
  return html`<a href="${href}" rel="${rel}"${attrs.cls ? html` class="${attrs.cls}"` : ''}>${text}</a>`;
}

/** A link inside the site; the path must start with a single slash. */
export function inbound(path: string, text: Part, cls?: string): Html {
  if (!path.startsWith('/') || path.startsWith('//')) return html`${text}`;
  return html`<a href="${path}"${cls ? html` class="${cls}"` : ''}>${text}</a>`;
}

/**
 * A JSON-LD block. A data block, not script, so the CSP allows it. `<`, `>`, `&` and the two line separators are
 * written as \u escapes, so no name can close the tag or start a comment.
 */
export function jsonLd(value: unknown): Html {
  const text = JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  return new Html(`<script type="application/ld+json">${text}</script>`);
}
