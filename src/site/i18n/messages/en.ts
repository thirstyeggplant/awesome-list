// Every string the site writes, in English. The other languages copy this shape (messages/{code}.ts, typed as
// `Messages`), so a missing or misspelt key fails `pnpm typecheck`.
//
// For translators:
// - `{name}` is a value filled in by the code. Keep every placeholder; you may move it.
// - `<1>…</1>` marks the words that become a link (or bold). Keep the tag and its number; you may move it.
// - p({ one, other }) is a plural: give the forms your language needs (Russian: one, few, many, other;
//   Chinese, Japanese, Korean, Indonesian: other only). `{n}` is the number, already formatted.
// - Names of lists, items and owners, tag chips (lang:go) and "awesome" in "awesome list" stay as they are.
// - When you change an English string here, the other languages must be translated again
//   (`pnpm check-translations` says which).
import { p } from '../format.js';

export const en = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Skip to the content',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} indexes names, sections and links. Descriptions belong to the lists and are not copied here. Keep a list and want it left out? <1>Open an issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Breadcrumb',
  },
  nav: {
    lists: 'Lists',
    items: 'Items',
    about: 'About',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Search',
    searchHint: 'Search  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Quick search',
    placeholder: 'Search lists, items and tags',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Results',
    help: '↑ ↓ to move, Enter to open, Esc to close',
    /** Group headings inside the dialog's results. */
    lists: 'Lists',
    items: 'Items',
    tags: 'Tags',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Language',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Read this page in English',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Close',
  },
  count: {
    lists: p({ one: '{n} list', other: '{n} lists' }),
    items: p({ one: '{n} item', other: '{n} items' }),
    listings: p({ one: '{n} listing', other: '{n} listings' }),
    sections: p({ one: '{n} section', other: '{n} sections' }),
    links: p({ one: '{n} link', other: '{n} links' }),
    stars: p({ one: '{n} star', other: '{n} stars' }),
    projects: p({ one: '{n} project', other: '{n} projects' }),
    otherLists: p({ one: '{n} other list', other: '{n} other lists' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} in {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} from {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} of {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'in {n} list', other: 'in {n} lists' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'repository',
    package: 'package',
    video: 'video',
    paper: 'paper',
    article: 'article',
    site: 'site',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'active',
    quiet: 'quiet',
    archived: 'archived',
    gone: 'gone',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'read in full',
    partial: 'read in part',
    unparsed: 'not read yet',
    gone: 'gone',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'relevance',
    lists: 'lists',
    stars: 'stars',
    items: 'items',
    updated: 'updated',
    name: 'name',
  },
  yes: 'yes',
  no: 'no',
  common: {
    search: 'Search',
    filter: 'Filter',
    searchListsAndItems: 'Search lists and items',
    nothingHere: 'Nothing here.',
    previous: '← Previous',
    next: 'Next →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Clear all',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · sort by {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'Paging stops at page {n}. Narrow the filters to see more.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '“{q}”',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** The labels over the columns of a listing's rows. */
    columns: { name: 'Name', language: 'Language', stars: 'Stars', lists: 'Lists', updated: 'Updated', items: 'Items' },
    /** Between the pager's two buttons: where the reader is. */
    pageOf: 'Page {page} of {pages}',
  },
  facts: {
    stars: 'Stars',
    lastPush: 'Last push',
    language: 'Language',
    licence: 'Licence',
    entries: 'Entries',
    namedBy: 'Named by',
    state: 'State',
    fork: 'Fork',
    kind: 'Kind',
    host: 'Host',
    renamedFrom: 'Renamed from',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ one: '{n} awesome list and everything in it', other: '{n} awesome lists and everything in them' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · data of {date}',
    mostNamed: 'Named by the most lists',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'Browse by language',
    allProjects: 'All projects',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'Start here',
    allLists: p({ one: '{n} list', other: 'All {n} lists' }),
    /** A heading over every list, category by category. */
    byCategory: 'All lists by category',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'All projects named by 2 or more lists',
  },
  lists: {
    h1: 'Lists',
    filterLists: 'Filter lists',
    category: 'Category',
    licence: 'Licence',
    status: 'Status',
  },
  list: {
    contents: 'Contents',
    filterThisList: 'Filter this list',
    collapseAll: 'Collapse all',
    expandAll: 'Expand all',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Link to this section',
    readOriginal: 'Read the original on GitHub',
    suggestChange: 'Suggest a change',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: "We could not read this list's entries yet ({reason}).",
    noReason: 'no reason given',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'This page is an index of <1>{name}</1>, a list kept by {owner} and its contributors at <2>{repo}</2>. The selection and order are theirs; the summary above is ours.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Read at commit {oid} on {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Licence: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'More in {category}',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: 'See also',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: 'Related lists',
    inCommon: p({ one: '{n} project in common', other: '{n} projects in common' }),
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Also listed as: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'This is itself a list in the library: <1>open it</1>.',
    archived: 'Archived by its owner.',
    gone: 'GitHub no longer has this repository.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'No pushes since {month}.',
    quiet: 'No pushes in two years.',
    factsAsOf: 'Facts from GitHub as of {date}.',
    inLists: p({ one: 'In {n} list', other: 'In {n} lists' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'listed as ‘{name}’',
    alongside: 'Listed alongside',
    attribution: 'Named by the lists above. Follow a list to read what its curators say about it. To suggest a change, open an issue on one of those lists.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Open on GitHub ↗',
    visit: 'Visit {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'More from {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: 'All {n} project by {owner}', other: 'All {n} projects by {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Topics',
  },
  items: {
    h1: 'Items',
    searchItems: 'Search items',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (the best matches only)',
    kind: 'Kind',
    status: 'Status',
    language: 'Language',
    licence: 'Licence',
    topic: 'Topic',
    category: 'Category',
    list: 'List',
    stars: 'Stars',
    namedBy: 'Named by',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ stars',
    inAtLeast: 'in {n}+ lists',
  },
  owner: {
    listsTheyKeep: 'Lists they keep',
    theirProjects: 'Their projects named by lists',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'All {n} in Items', other: 'All {n} in Items' }),
    /** Under an owner's GitHub link; {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
    line: '{lists} kept · {projects} named by lists',
  },
  search: {
    h1: 'Search',
    lists: 'Lists',
    sections: 'Sections',
    items: 'Items',
    /** Beside a section found by search: the list it is in. */
    inList: 'in {list}',
    noItems: 'No items match.',
    allItems: p({ one: 'All {n} item', other: 'All {n} items' }),
  },
  notFound: {
    h1: 'Nothing at this address',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Perhaps',
  },
  about: {
    h1: 'About {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} is a free library of every awesome list in the <1>index of awesome lists</1> and everything in them: {lists}, the {items} they name, and where each list names each one.',
    shownTitle: 'What is shown, and what is not',
    shown: "The site shows names, sections, links and facts, and our own words. It never shows a curator's or a repository owner's description. A list's summary is ours; what a list says about an entry stays on the list, one link away.",
    attributionTitle: 'Attribution',
    attribution: 'The selection and order of every list belong to the people who keep it. Each list page says where the list lives and the commit it was read at. Facts about repositories (stars, last push, language, licence, topics) come from GitHub.',
    leaveOutTitle: 'How a list is left out',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: "Keep a list and want it left out? <1>Open an issue on this project's repository</1> naming the list. It is left out on the next build: its entries are not read and its page is removed.",
    coverageTitle: 'Coverage',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} lists read in full, {partial} in part, {unparsed} not read yet.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} lists read in full, {partial} in part, {unparsed} not read yet, {gone} gone from GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: {repo} repositories, {site} sites, {video} videos, {article} articles, {package} packages, {paper} papers.',
    coverageTwoOrMore: '{n} items are named by two lists or more.',
    coverageRepos: 'Repositories: {active} active, {quiet} quiet (no push in two years), {archived} archived, {gone} gone.',
    dataOf: 'The data is of {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ one: '{site}: {n} awesome list and everything in it', other: '{site}: {n} awesome lists and everything in them' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'An index of {n} awesome list and the {items} projects it names, by category, language, licence and topic.',
        other: 'An index of {n} awesome lists and the {items} projects they name, by category, language, licence and topic.',
      }),
    },
    lists: {
      title: p({ one: 'All {n} awesome list', other: 'All {n} awesome lists' }),
      description: p({ one: '{n} awesome list with its size, stars and our own one-line summary.', other: '{n} awesome lists with their sizes, stars and our own one-line summaries.' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} awesome list', other: '{category}: {n} awesome lists' }),
      description: p({ one: '{n} awesome list on {category}, with its size, stars and summary.', other: '{n} awesome lists on {category}, with sizes, stars and summaries.' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, page {page}',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ one: '{name} ({repo}): awesome list of {n} item', other: '{name} ({repo}): awesome list of {n} items' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, an awesome list kept at {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: in {n} awesome list', other: '{repo}: in {n} awesome lists' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: in {n} awesome list', other: '{name}: in {n} awesome lists' }),
      /** {lists} are up to three list names. */
      repoDescription: p({ one: '{name} is named by {n} awesome list: {lists}.', other: '{name} is named by {n} awesome lists: {lists}.' }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({ one: '{name} ({host}) is named by {n} awesome list: {lists}.', other: '{name} ({host}) is named by {n} awesome lists: {lists}.' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: in the {list} awesome list',
      titleOne: '{name}: in the {list} awesome list',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} is in the {list} awesome list, under {section}.',
      under: 'Listed under {section} in {list}.',
      alongside: 'Alongside {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: lists and projects',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} on GitHub: {lists} kept, {projects} named by lists.',
    },
    items: {
      title: p({ one: '{n} project named by awesome lists', other: '{n} projects named by awesome lists' }),
      description: p({ one: 'Browse {n} project by language, licence, topic, stars and how many lists name it.', other: 'Browse {n} projects by language, licence, topic, stars and how many lists name them.' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ one: '{label}: {n} project in awesome lists', other: '{label}: {n} projects in awesome lists' }),
      filteredDescription: p({ one: '{label}: {n} project named by awesome lists, with its stars and the lists that name it.', other: '{label}: {n} projects named by awesome lists, with their stars and the lists that name them.' }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Items matching “{q}”',
    },
    about: {
      title: 'About {site}',
      description: 'What {site} shows, where it comes from, and how a list is left out.',
    },
  },
};

export type Messages = typeof en;
