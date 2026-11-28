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
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: '共有',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: '{service} で共有',
    /** The email link's name. */
    email: 'メールで共有',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: 'リンクをコピー',
    copied: 'コピーしました',
    /** A button that opens the phone's own share sheet. */
    native: '共有…',
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
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ other: '{n}件のリストに掲載' }),
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
    /** Between the pager's two buttons: where the reader is. */
    pageOf: '{page} / {pages} ページ',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}：{value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: '{year}年に更新',
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
    /** An item's GitHub owner, a link to their page. */
    owner: 'オーナー',
    /** A list's plain Markdown copy, a link to /lists/{owner}/{repo}.md. The format's name. */
    markdown: 'Markdown',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ other: '{n}件のawesomeリストとその中身すべて' }),
    mostNamed: '最も多くのリストに掲載',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: '言語で探す',
    allProjects: 'すべてのプロジェクト',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'まずはここから',
    allLists: p({ other: '全{n}件のリスト' }),
    /** A heading over every list, category by category. */
    byCategory: 'カテゴリ別のすべてのリスト',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: '2件以上のリストに掲載されたすべてのプロジェクト',
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
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: '関連',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: '関連するリスト',
    inCommon: p({ other: '共通のプロジェクト{n}件' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: 'このリストについて',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: '別名: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'これ自体がライブラリ内のリストです: <1>開く</1>。',
    gone: 'このリポジトリはGitHubに存在しなくなりました。',
    factsAsOf: '{date}時点のGitHubの情報です。',
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: '「{name}」として掲載',
    attribution: '上のリストに掲載されています。キュレーターによる説明は各リストでお読みください。変更を提案するには、該当するリストでIssueを作成してください。',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'GitHubで開く ↗',
    visit: '{host} を開く ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: '{owner} の他のプロジェクト',
    /** Under them: a link to the owner's page. */
    allFrom: p({ other: '{owner} のプロジェクト全{n}件' }),
    /** The label over an item's topic chips. */
    topics: 'トピック',
    /** Under "What is listed alongside {name}?". */
    alongsideNote: 'いずれかのリストで同じセクションに掲載されているプロジェクトです。リストは、これらが代替品だとは言っていません。',
    q: {
      /** Headings of an item page, as the questions a visitor asks; {name} is the item. */
      lists: '{name}はどのawesomeリストに掲載されていますか？',
      maintained: '{name}は今もメンテナンスされていますか？',
      alongside: '{name}と一緒に掲載されているものは？',
    },
    a: {
      /** The answer under "Is {name} still maintained?", by the repository's state. {date} is its last push, {asOf} the data's date. The site says what GitHub says, and when. */
      active: '{asOf}時点で、最終プッシュは{date}で、アーカイブされていません。',
      /** "Two years" is the site's rule for quiet (730 days). */
      quiet: '{date}以降プッシュがなく、{asOf}の2年以上前です。アーカイブはされていません。',
      archived: 'いいえ。オーナーがアーカイブしました。最終プッシュは{date}です。',
    },
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
    /** On /items with one language, before up to six lists most of whose repositories are in it: {label} is the language. */
    mostlyIn: '主に{label}のリスト',
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
    /** The About page's headings are the questions a visitor asks; {site} is the site's name. */
    shownTitle: '{site}は何を表示していますか？',
    shown: '当サイトが表示するのは名前、セクション、リンク、事実情報と、当サイト独自の文章です。キュレーターやリポジトリオーナーによる説明文は表示しません。リストの要約は当サイトが書いたもので、リストがエントリについて書いた内容はリンク先のリストでお読みください。',
    attributionTitle: '情報はどこから来て、誰のものですか？',
    attribution: '各リストの選定と順序は、そのリストを管理する人々のものです。各リストのページには、リストの場所と読み込んだコミットを記載しています。リポジトリの情報（スター、最終プッシュ、言語、ライセンス、トピック）はGitHubから取得しています。',
    leaveOutTitle: 'リストを除外するには？',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'リストを管理していて掲載を外したい場合は、リスト名を書いて<1>このプロジェクトのリポジトリでIssueを作成</1>してください。次回のビルドで除外され、エントリは読み込まれず、ページも削除されます。',
    coverageTitle: 'どのくらいを網羅していますか？',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'すべて読み込み済みのリストが{ok}件、一部のみが{partial}件、未読み込みが{unparsed}件です。',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'すべて読み込み済みのリストが{ok}件、一部のみが{partial}件、未読み込みが{unparsed}件、GitHubから削除されたものが{gone}件です。',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: リポジトリ{repo}件、サイト{site}件、動画{video}件、記事{article}件、パッケージ{package}件、論文{paper}件。',
    coverageTwoOrMore: '{n}件の項目が2つ以上のリストに掲載されています。',
    coverageRepos: 'リポジトリ: 活発{active}件、停滞{quiet}件（2年間プッシュなし）、アーカイブ済み{archived}件、削除済み{gone}件。',
    freshTitle: 'データはどのくらい新しいですか？',
    /** {date} is the day this copy of the data was finished. */
    fresh: 'リストとGitHubの情報は毎晩読み直しています。このデータは{date}に完成したものです。',
    aiTitle: 'AIアシスタントやクローラーは利用できますか？',
    /** <1> links to /llms.txt; robots.txt, /llms.txt and .md are names of files and stay as they are. */
    ai: 'はい。robots.txtで許可しており、<1>/llms.txt</1>でサイトを説明しています。各リストは、アドレスに.mdを付けるとMarkdownのコピーを取得できます。リストの選定と順序はキュレーターのものです。それらについてはGitHub上のリストを、件数やどのリストがプロジェクトを掲載しているかについては{site}を引用してください。',
  },
  /**
   * Sentences that open a page, made of its own data. Names in them are links; never a curator's or an owner's words.
   */
  sum: {
    /** The home page. {lists} and {items} are count plurals ("671 lists"), {date} a date. */
    home: '{site}は、GitHubにある{lists}と、そこに掲載された{items}の索引です。名前、セクション、リンク、GitHubの情報を表示し、リスト自身の説明文は表示しません。データは{date}時点のもので、毎晩読み直しています。',
    /** A category of /lists: {category} is its name, {names} three list names. */
    category: p({ other: 'カテゴリ「{category}」には{n}件のawesomeリストがあります。スターが最も多いのは{names}です。' }),
    /** After a summary: {date} is a date. */
    asOf: 'データは{date}時点のものです。',
    list: {
      /** A list page, after our summary. {name} is the list, {repo} owner/repo, {owner} a login, {items} and {sections} count plurals. */
      what: '{name}は、{owner}がGitHubで管理しているawesomeリスト{repo}です。{sections}に{items}が掲載されています。',
      /** The same, for a list whose entries could not be read. */
      whatUnread: '{name}は、{owner}がGitHubで管理しているawesomeリスト{repo}です。',
      /** {stars} is a count plural ("196,233 stars"), {date} a date. */
      github: 'GitHubで{stars}を獲得しており、最終プッシュは{date}です。',
      /** {sections} are three section titles, each with its count: "Command Line (105), …". */
      sections: '大きなセクションは{sections}です。',
      /** {names} are five project names. */
      top: 'スターが最も多いプロジェクトは{names}です。',
      /** {language} is a programming language, e.g. "Go". */
      lang: 'リポジトリの多くは{language}で書かれています。',
    },
    items: {
      /** /items with one language: {label} is the language. */
      lang: p({ other: 'awesomeリストに掲載されたプロジェクトのうち{n}件が{label}で書かれています。' }),
      /** /items with one topic: {label} is a GitHub topic. */
      topic: p({ other: 'awesomeリストに掲載されたプロジェクトのうち{n}件にGitHubトピック{label}が付いています。' }),
      /** /items with one licence: {label} is the licence, e.g. "MIT". */
      license: p({ other: 'awesomeリストに掲載されたプロジェクトのうち{n}件が{label}ライセンスです。' }),
      /** /items with one kind: {label} is the kind's word, e.g. "video". */
      kind: p({ other: 'awesomeリストに掲載されたもののうち{n}件が種類「{label}」です。' }),
      /** After one of the four: {names} are five names. */
      top: '最も多くのリストに掲載されているのは{names}です。',
    },
    item: {
      /** An item page's first sentence. {name} is the repository, {language} e.g. "Go", {owner} a login, {stars} a count plural. */
      repoLang: '{name}は、{owner}がGitHubで公開している{language}のリポジトリで、{stars}です。',
      /** The same, with no language known. */
      repo: '{name}は、{owner}がGitHubで公開しているリポジトリで、{stars}です。',
      /** The same, with no stars known. */
      repoPlain: '{name}は、{owner}がGitHubで公開しているリポジトリです。',
      /** Anything else, one sentence a kind: {name} is its name, {host} where it is (example.com). */
      kind: {
        repo: '{name}は{host}にあるリポジトリです。',
        site: '{name}は{host}にあるウェブサイトです。',
        video: '{name}は{host}にある動画です。',
        article: '{name}は{host}にある記事です。',
        package: '{name}は{host}にあるパッケージです。',
        paper: '{name}は{host}にある論文です。',
      },
      /** The second sentence: {lists} are up to three lists, each "Go (under Web Frameworks)", and perhaps "2 more". */
      lists: p({ other: '{n}件のawesomeリストに掲載されています：{lists}。' }),
      /** One of those lists: {list} is its name, {section} the title of the section that holds the item. */
      listUnder: '{list}（「{section}」）',
      /** After three lists: how many more name it. */
      more: p({ other: '他{n}件' }),
      /** The third sentence, for a repository: {date} is a date. */
      pushed: '最終プッシュは{date}です。',
    },
    owner: {
      /** An owner page: {display} is a login, {lists} and {projects} count plurals. */
      both: '{display}はここに索引のある{lists}を管理しています。また、awesomeリストには{projects}が掲載されています。',
      /** The same, with no projects named. */
      lists: '{display}はここに索引のある{lists}を管理しています。',
      /** The same, with no lists kept. */
      projects: 'awesomeリストには{display}の{projects}が掲載されています。',
    },
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
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ other: '{name} ({repo}): {n}項目のawesomeリスト' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{repo}で管理されているawesomeリスト{name}。',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ other: '{repo}: {n}件のawesomeリストに掲載' }),
      /** Anything else: {name} is its name. */
      title: p({ other: '{name}: {n}件のawesomeリストに掲載' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: awesomeリスト「{list}」に掲載',
      titleOne: '{name}: awesomeリスト「{list}」に掲載',
      alongside: '一緒に掲載: {names}。',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: リストとプロジェクト',
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
