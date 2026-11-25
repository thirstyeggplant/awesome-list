// Japanese, translated from messages/en.ts.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const ja: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'コンテンツへスキップ',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site}は名前、セクション、リンクを索引化しています。説明文は各リストのものであり、ここには転載していません。リストを管理していて掲載を外したい場合は<1>Issueを作成</1>してください。',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'パンくずリスト',
  },
  nav: {
    lists: 'リスト',
    items: '項目',
    about: '概要',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: '検索',
    searchHint: '検索  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'クイック検索',
    placeholder: 'リスト、項目、タグを検索',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: '検索結果',
    help: '↑ ↓ で移動、Enterで開く、Escで閉じる',
    /** Group headings inside the dialog's results. */
    lists: 'リスト',
    items: '項目',
    tags: 'タグ',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: '言語',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'このページを日本語で読む',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: '閉じる',
  },
  count: {
    lists: p({ other: '{n}件のリスト' }),
    items: p({ other: '{n}件の項目' }),
    listings: p({ other: '{n}件の掲載' }),
    sections: p({ other: '{n}個のセクション' }),
    links: p({ other: '{n}件のリンク' }),
    stars: p({ other: '{n}スター' }),
    projects: p({ other: '{n}件のプロジェクト' }),
    otherLists: p({ other: '他{n}件のリスト' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{sections}に{items}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{links}中{items}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{m}件中{n}件',
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'リポジトリ',
    package: 'パッケージ',
    video: '動画',
    paper: '論文',
    article: '記事',
    site: 'サイト',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: '活発',
    quiet: '停滞',
    archived: 'アーカイブ済み',
    gone: '削除済み',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'すべて読み込み済み',
    partial: '一部読み込み済み',
    unparsed: '未読み込み',
    gone: '削除済み',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: '関連度',
    lists: 'リスト数',
    stars: 'スター数',
    items: '項目数',
    updated: '更新日',
    name: '名前',
  },
  yes: 'はい',
  no: 'いいえ',
  common: {
    search: '検索',
    filter: '絞り込み',
    searchListsAndItems: 'リストと項目を検索',
    nothingHere: '何もありません。',
    previous: '← 前へ',
    next: '次へ →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'すべてクリア',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · 並べ替え: {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: '表示できるのは{n}ページまでです。さらに見るには条件を絞り込んでください。',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '「{q}」',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: '、',
  },
  facts: {
    stars: 'スター',
    lastPush: '最終プッシュ',
    language: '言語',
    licence: 'ライセンス',
    entries: 'エントリ',
    namedBy: '掲載リスト',
    state: '状態',
    fork: 'フォーク',
    kind: '種類',
    host: 'ホスト',
    renamedFrom: '旧名',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ other: '{n}件のawesomeリストとその中身すべて' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · {date}時点のデータ',
    mostNamed: '最も多くのリストに掲載',
  },
  lists: {
    h1: 'リスト',
    filterLists: 'リストを絞り込む',
    category: 'カテゴリ',
    licence: 'ライセンス',
    status: '状態',
  },
  list: {
    contents: '目次',
    filterThisList: 'このリストを絞り込む',
    collapseAll: 'すべて折りたたむ',
    expandAll: 'すべて展開',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'このセクションへのリンク',
    readOriginal: 'GitHubで原文を読む',
    suggestChange: '変更を提案',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'このリストのエントリはまだ読み込めていません（{reason}）。',
    noReason: '理由は不明',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'このページは、{owner}とコントリビューターが<2>{repo}</2>で管理しているリスト<1>{name}</1>の索引です。選定と順序は管理者によるもので、上の要約は当サイトが書いたものです。',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: '{date}にコミット{oid}の時点で読み込みました。',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'ライセンス: {license}。',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: '{category}の他のリスト',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: '別名: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'これ自体がライブラリ内のリストです: <1>開く</1>。',
    archived: 'オーナーによってアーカイブされています。',
    gone: 'このリポジトリはGitHubに存在しなくなりました。',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: '{month}以降プッシュがありません。',
    quiet: '2年間プッシュがありません。',
    factsAsOf: '{date}時点のGitHubの情報です。',
    inLists: p({ other: '{n}件のリストに掲載' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: '「{name}」として掲載',
    alongside: '一緒に掲載されているもの',
    attribution: '上のリストに掲載されています。キュレーターによる説明は各リストでお読みください。変更を提案するには、該当するリストでIssueを作成してください。',
  },
  items: {
    h1: '項目',
    searchItems: '項目を検索',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: '（上位の一致のみ）',
    kind: '種類',
    status: '状態',
    language: '言語',
    licence: 'ライセンス',
    topic: 'トピック',
    category: 'カテゴリ',
    list: 'リスト',
    stars: 'スター',
    namedBy: '掲載リスト数',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}スター以上',
    inAtLeast: '{n}件以上のリストに掲載',
  },
  owner: {
    listsTheyKeep: '管理しているリスト',
    theirProjects: 'リストに掲載されたプロジェクト',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ other: '項目ページで全{n}件を見る' }),
  },
  search: {
    h1: '検索',
    lists: 'リスト',
    sections: 'セクション',
    items: '項目',
    /** Beside a section found by search: the list it is in. */
    inList: '{list}内',
    noItems: '一致する項目はありません。',
    allItems: p({ other: '全{n}件の項目' }),
  },
  notFound: {
    h1: 'このアドレスには何もありません',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'もしかして',
  },
  about: {
    h1: '{site}について',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site}は、<1>awesomeリストの索引</1>にあるすべてのawesomeリストとその中身をまとめた無料のライブラリです。{lists}、そこに掲載された{items}、そして各リストがどこに何を掲載しているかを収録しています。',
    shownTitle: '表示するもの、しないもの',
    shown: '当サイトが表示するのは名前、セクション、リンク、事実情報と、当サイト独自の文章です。キュレーターやリポジトリオーナーによる説明文は表示しません。リストの要約は当サイトが書いたもので、リストがエントリについて書いた内容はリンク先のリストでお読みください。',
    attributionTitle: 'クレジット',
    attribution: '各リストの選定と順序は、そのリストを管理する人々のものです。各リストのページには、リストの場所と読み込んだコミットを記載しています。リポジトリの情報（スター、最終プッシュ、言語、ライセンス、トピック）はGitHubから取得しています。',
    leaveOutTitle: 'リストの掲載を外すには',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'リストを管理していて掲載を外したい場合は、リスト名を書いて<1>このプロジェクトのリポジトリでIssueを作成</1>してください。次回のビルドで除外され、エントリは読み込まれず、ページも削除されます。',
    coverageTitle: '収録状況',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'すべて読み込み済みのリストが{ok}件、一部のみが{partial}件、未読み込みが{unparsed}件です。',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'すべて読み込み済みのリストが{ok}件、一部のみが{partial}件、未読み込みが{unparsed}件、GitHubから削除されたものが{gone}件です。',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: リポジトリ{repo}件、サイト{site}件、動画{video}件、記事{article}件、パッケージ{package}件、論文{paper}件。',
    coverageTwoOrMore: '{n}件の項目が2つ以上のリストに掲載されています。',
    coverageRepos: 'リポジトリ: 活発{active}件、停滞{quiet}件（2年間プッシュなし）、アーカイブ済み{archived}件、削除済み{gone}件。',
    dataOf: 'データは{date}時点のものです。',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ other: '{site}: {n}件のawesomeリストとその中身' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        other: '{n}件のawesomeリストと、そこに掲載された{items}件のプロジェクトをカテゴリ、言語、ライセンス、トピック別に索引化。',
      }),
    },
    lists: {
      title: p({ other: '全{n}件のawesomeリスト' }),
      description: p({ other: '{n}件のawesomeリストを、規模、スター数、当サイト独自の一行要約とともに掲載。' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ other: '{category}: {n}件のawesomeリスト' }),
      description: p({ other: '{category}に関する{n}件のawesomeリストを、規模、スター数、要約とともに掲載。' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}（{page}ページ目）',
    list: {
      /** {name} is the list's name. */
      title: p({ other: '{name}: {n}項目のawesomeリスト' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{repo}で管理されているawesomeリスト{name}。',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ other: '{repo}: {n}件のawesomeリストに掲載' }),
      /** Anything else: {name} is its name. */
      title: p({ other: '{name}: {n}件のawesomeリストに掲載' }),
      /** {lists} are up to three list names. */
      repoDescription: p({ other: '{name}は{n}件のawesomeリストに掲載されています: {lists}。' }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({ other: '{name}（{host}）は{n}件のawesomeリストに掲載されています: {lists}。' }),
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: リストとプロジェクト',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: 'GitHubの{display}が管理する{lists}と、リストに掲載された{projects}。',
    },
    items: {
      title: p({ other: 'awesomeリストに掲載された{n}件のプロジェクト' }),
      description: p({ other: '{n}件のプロジェクトを、言語、ライセンス、トピック、スター数、掲載リスト数で探せます。' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ other: '{label}: awesomeリストの{n}件のプロジェクト' }),
      filteredDescription: p({ other: '{label}: awesomeリストに掲載された{n}件のプロジェクトを、スター数と掲載リストとともに表示。' }),
      /** A search in the items: {q} is what was searched for. */
      matching: '「{q}」に一致する項目',
    },
    about: {
      title: '{site}について',
      description: '{site}が表示する内容、その出典、リストの掲載を外す方法。',
    },
  },
};
