// Chinese (simplified, zh-Hans, as read in mainland China).
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const zh: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: '跳到正文',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} 只收录名称、章节和链接。描述归各清单所有，本站不复制。你维护的清单希望不被收录？请<1>提交 issue</1>。',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: '面包屑导航',
  },
  nav: {
    lists: '清单',
    items: '条目',
    about: '关于',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: '搜索',
    searchHint: '搜索  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: '快速搜索',
    placeholder: '搜索清单、条目和标签',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: '结果',
    help: '↑ ↓ 移动，Enter 打开，Esc 关闭',
    /** Group headings inside the dialog's results. */
    lists: '清单',
    items: '条目',
    tags: '标签',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: '语言',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: '阅读本页的简体中文版',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: '关闭',
  },
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: '分享',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: '分享到 {service}',
    /** The email link's name. */
    email: '通过电子邮件分享',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: '复制链接',
    copied: '已复制',
    /** A button that opens the phone's own share sheet. */
    native: '分享…',
  },
  count: {
    lists: p({ other: '{n} 个清单' }),
    items: p({ other: '{n} 个条目' }),
    listings: p({ other: '{n} 次收录' }),
    sections: p({ other: '{n} 个章节' }),
    links: p({ other: '{n} 个链接' }),
    stars: p({ other: '{n} 星标' }),
    projects: p({ other: '{n} 个项目' }),
    otherLists: p({ other: '另外 {n} 个清单' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{sections}中的 {items}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '从 {links}中读取到 {items}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} / {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ other: '收录于 {n} 个清单' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: '仓库',
    package: '包',
    video: '视频',
    paper: '论文',
    article: '文章',
    site: '网站',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: '活跃',
    quiet: '沉寂',
    archived: '已归档',
    gone: '已消失',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: '已完整读取',
    partial: '部分读取',
    unparsed: '尚未读取',
    gone: '已消失',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: '相关度',
    lists: '清单数',
    stars: '星标',
    items: '条目数',
    updated: '更新时间',
    name: '名称',
  },
  yes: '是',
  no: '否',
  common: {
    search: '搜索',
    filter: '筛选',
    searchListsAndItems: '搜索清单和条目',
    nothingHere: '这里什么都没有。',
    previous: '← 上一页',
    next: '下一页 →',
    /** After the removable filter chips: takes them all away. */
    clearAll: '全部清除',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · 排序：{sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: '最多显示到第 {n} 页。缩小筛选范围以查看更多。',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '“{q}”',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: '、',
    /** Between the pager's two buttons: where the reader is. */
    pageOf: '第 {page} 页，共 {pages} 页',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: '{year} 年更新',
  },
  facts: {
    stars: '星标',
    lastPush: '最近推送',
    language: '语言',
    licence: '许可证',
    entries: '条目',
    namedBy: '收录清单数',
    state: '状态',
    fork: 'Fork',
    kind: '类型',
    host: '主机',
    renamedFrom: '原名',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ other: '{n} 个 awesome 清单及其全部内容' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · 数据日期 {date}',
    mostNamed: '被最多清单收录',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: '按语言浏览',
    allProjects: '全部项目',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: '从这里开始',
    allLists: p({ other: '全部 {n} 个清单' }),
    /** A heading over every list, category by category. */
    byCategory: '按分类浏览全部清单',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: '所有被 2 个及以上清单收录的项目',
  },
  lists: {
    h1: '清单',
    filterLists: '筛选清单',
    category: '类别',
    licence: '许可证',
    status: '状态',
  },
  list: {
    contents: '目录',
    filterThisList: '筛选本清单',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: '本章节的链接',
    readOriginal: '在 GitHub 上阅读原文',
    suggestChange: '建议修改',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: '暂时无法读取本清单的条目（{reason}）。',
    noReason: '原因不明',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: '本页是 <1>{name}</1> 的索引，该清单由 {owner} 及其贡献者维护于 <2>{repo}</2>。条目的选择和顺序归他们所有，上方的简介由本站撰写。',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: '于 {date} 读取自提交 {oid}。',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: '许可证：{license}。',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: '更多{category}清单',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: '另见',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: '相关清单',
    inCommon: p({ other: '{n} 个共同项目' }),
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: '其他收录名称：{names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: '它本身也是本站收录的清单：<1>打开</1>。',
    archived: '已被所有者归档。',
    gone: 'GitHub 上已不存在该仓库。',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: '自 {month} 起无推送。',
    quiet: '两年内无推送。',
    factsAsOf: '数据来自 GitHub，截至 {date}。',
    inLists: p({ other: '收录于 {n} 个清单' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: '收录名称为“{name}”',
    alongside: '一同收录的条目',
    attribution: '由上方清单收录。点开清单可阅读维护者对它的介绍。如需建议修改，请在相应清单的仓库提交 issue。',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: '在 GitHub 上打开 ↗',
    visit: '访问 {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: '{owner} 的更多项目',
    /** Under them: a link to the owner's page. */
    allFrom: p({ other: '{owner} 的全部 {n} 个项目' }),
    /** The label over an item's topic chips. */
    topics: '主题',
  },
  items: {
    h1: '条目',
    searchItems: '搜索条目',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: '（仅显示最佳匹配）',
    kind: '类型',
    status: '状态',
    language: '语言',
    licence: '许可证',
    topic: '主题',
    category: '类别',
    list: '清单',
    stars: '星标',
    namedBy: '收录清单数',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ 星标',
    inAtLeast: '收录于 {n}+ 个清单',
  },
  owner: {
    listsTheyKeep: '维护的清单',
    theirProjects: '被清单收录的项目',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ other: '在条目页查看全部 {n} 个' }),
    /** Under an owner's GitHub link; {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
    line: '维护的清单：{lists} · 被清单收录的项目：{projects}',
  },
  search: {
    h1: '搜索',
    lists: '清单',
    sections: '章节',
    items: '条目',
    /** Beside a section found by search: the list it is in. */
    inList: '位于 {list}',
    noItems: '没有匹配的条目。',
    allItems: p({ other: '全部 {n} 个条目' }),
  },
  notFound: {
    h1: '此地址没有内容',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: '你可能在找',
  },
  about: {
    h1: '关于 {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} 是一个免费的资料库，收录 <1>awesome 清单索引</1>中的每一个 awesome 清单及其全部内容：{lists}、它们收录的 {items}，以及每个条目出现在哪些清单的哪个位置。',
    shownTitle: '显示什么，不显示什么',
    shown: '本站显示名称、章节、链接和客观数据，以及本站自己撰写的文字，从不显示清单维护者或仓库所有者的描述。清单简介由本站撰写；清单对条目的介绍留在清单原处，点一下链接即可查看。',
    attributionTitle: '署名',
    attribution: '每个清单条目的选择和顺序归其维护者所有。每个清单页面都注明了清单所在位置及读取时的提交。仓库的客观数据（星标、最近推送、语言、许可证、主题）来自 GitHub。',
    leaveOutTitle: '如何不被收录',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: '你维护的清单希望不被收录？请<1>在本项目的仓库提交 issue</1>并写明清单名称。下次构建时即会排除：不再读取其条目，并删除其页面。',
    coverageTitle: '覆盖情况',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} 个清单已完整读取，{partial} 个部分读取，{unparsed} 个尚未读取。',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} 个清单已完整读取，{partial} 个部分读取，{unparsed} 个尚未读取，{gone} 个已从 GitHub 消失。',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}：{repo} 个仓库、{site} 个网站、{video} 个视频、{article} 篇文章、{package} 个包、{paper} 篇论文。',
    coverageTwoOrMore: '{n} 个条目被两个或更多清单收录。',
    coverageRepos: '仓库：{active} 个活跃，{quiet} 个沉寂（两年内无推送），{archived} 个已归档，{gone} 个已消失。',
    dataOf: '数据日期为 {date}。',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ other: '{site}：{n} 个 awesome 清单全收录' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        other: '{n} 个 awesome 清单及其收录的 {items} 个项目的索引，可按类别、语言、许可证和主题浏览。',
      }),
    },
    lists: {
      title: p({ other: '全部 {n} 个 awesome 清单' }),
      description: p({ other: '{n} 个 awesome 清单，附规模、星标和本站撰写的一句话简介。' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ other: '{category}：{n} 个 awesome 清单' }),
      description: p({ other: '{category}类的 {n} 个 awesome 清单，附规模、星标和简介。' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}，第 {page} 页',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ other: '{name} ({repo})：收录 {n} 个条目的 awesome 清单' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}，维护于 {repo} 的 awesome 清单。',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ other: '{repo}：收录于 {n} 个 awesome 清单' }),
      /** Anything else: {name} is its name. */
      title: p({ other: '{name}：收录于 {n} 个 awesome 清单' }),
      /** {lists} are up to three list names. */
      repoDescription: p({ other: '{name} 被 {n} 个 awesome 清单收录：{lists}。' }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({ other: '{name}（{host}）被 {n} 个 awesome 清单收录：{lists}。' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}：收录于 {list} awesome 清单',
      titleOne: '{name}：收录于 {list} awesome 清单',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} 收录于 {list} awesome 清单的「{section}」部分。',
      under: '在 {list} 中列于「{section}」。',
      alongside: '一同收录的有 {names}。',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}：清单和项目',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: 'GitHub 用户 {display}：维护 {lists}，{projects}被清单收录。',
    },
    items: {
      title: p({ other: 'awesome 清单收录的 {n} 个项目' }),
      description: p({ other: '按语言、许可证、主题、星标和收录清单数浏览 {n} 个项目。' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ other: '{label}：awesome 清单中的 {n} 个项目' }),
      filteredDescription: p({ other: '{label}：awesome 清单收录的 {n} 个项目，附星标和收录它们的清单。' }),
      /** A search in the items: {q} is what was searched for. */
      matching: '匹配“{q}”的条目',
    },
    about: {
      title: '关于 {site}',
      description: '{site} 显示什么、数据从哪里来，以及清单如何申请不被收录。',
    },
  },
};
