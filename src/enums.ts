// The kinds and states the data names, without zod, so the site's Worker can use them without bundling it.

export const ITEM_KINDS = ['repo', 'package', 'video', 'paper', 'article', 'site'] as const;
export const LIST_STATUSES = ['ok', 'partial', 'unparsed', 'gone'] as const;
export const REPO_STATUSES = ['active', 'quiet', 'archived', 'gone'] as const;
