// Russian. The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const ru: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Перейти к содержимому',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} индексирует названия, разделы и ссылки. Описания принадлежат спискам и сюда не копируются. Ведёте список и хотите убрать его отсюда? <1>Создайте issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Навигационная цепочка',
  },
  nav: {
    lists: 'Списки',
    items: 'Элементы',
    about: 'О сайте',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Поиск',
    searchHint: 'Поиск  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Быстрый поиск',
    placeholder: 'Поиск по спискам, элементам и тегам',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Результаты',
    help: '↑ ↓ — перемещение, Enter — открыть, Esc — закрыть',
    /** Group headings inside the dialog's results. */
    lists: 'Списки',
    items: 'Элементы',
    tags: 'Теги',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Язык',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Читать эту страницу на русском',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Закрыть',
  },
  count: {
    lists: p({ one: '{n} список', few: '{n} списка', many: '{n} списков', other: '{n} списка' }),
    items: p({ one: '{n} элемент', few: '{n} элемента', many: '{n} элементов', other: '{n} элемента' }),
    listings: p({ one: '{n} упоминание', few: '{n} упоминания', many: '{n} упоминаний', other: '{n} упоминания' }),
    sections: p({ one: '{n} раздел', few: '{n} раздела', many: '{n} разделов', other: '{n} раздела' }),
    links: p({ one: '{n} ссылка', few: '{n} ссылки', many: '{n} ссылок', other: '{n} ссылки' }),
    stars: p({ one: '{n} звезда', few: '{n} звезды', many: '{n} звёзд', other: '{n} звезды' }),
    projects: p({ one: '{n} проект', few: '{n} проекта', many: '{n} проектов', other: '{n} проекта' }),
    otherLists: p({ one: 'ещё {n} список', few: 'ещё {n} списка', many: 'ещё {n} списков', other: 'ещё {n} списка' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items}, {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} из: {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} из {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'в {n} списке', few: 'в {n} списках', many: 'в {n} списках', other: 'в {n} списка' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'репозиторий',
    package: 'пакет',
    video: 'видео',
    paper: 'научная статья',
    article: 'статья',
    site: 'сайт',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'активный',
    quiet: 'затих',
    archived: 'в архиве',
    gone: 'удалён',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'прочитан полностью',
    partial: 'прочитан частично',
    unparsed: 'ещё не прочитан',
    gone: 'удалён',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'релевантности',
    lists: 'спискам',
    stars: 'звёздам',
    items: 'элементам',
    updated: 'обновлению',
    name: 'названию',
  },
  yes: 'да',
  no: 'нет',
  common: {
    search: 'Поиск',
    filter: 'Фильтр',
    searchListsAndItems: 'Поиск по спискам и элементам',
    nothingHere: 'Здесь ничего нет.',
    previous: '← Назад',
    next: 'Далее →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Сбросить всё',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · сортировка по {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'Страницы заканчиваются на {n}-й. Сузьте фильтры, чтобы увидеть больше.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '«{q}»',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** The labels over the columns of a listing's rows. */
    columns: { name: 'Название', language: 'Язык', stars: 'Звёзды', lists: 'Списки', updated: 'Обновлено', items: 'Элементы' },
  },
  facts: {
    stars: 'Звёзды',
    lastPush: 'Последний пуш',
    language: 'Язык',
    licence: 'Лицензия',
    entries: 'Записи',
    namedBy: 'Упоминается в',
    state: 'Состояние',
    fork: 'Форк',
    kind: 'Тип',
    host: 'Хост',
    renamedFrom: 'Прежнее название',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({
      one: '{n} awesome-список и всё, что в нём',
      few: '{n} awesome-списка и всё, что в них',
      many: '{n} awesome-списков и всё, что в них',
      other: '{n} awesome-списка и всё, что в них',
    }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · данные на {date}',
    mostNamed: 'Чаще всего в списках',
  },
  lists: {
    h1: 'Списки',
    filterLists: 'Фильтр списков',
    category: 'Категория',
    licence: 'Лицензия',
    status: 'Статус',
  },
  list: {
    contents: 'Содержание',
    filterThisList: 'Фильтр по этому списку',
    collapseAll: 'Свернуть всё',
    expandAll: 'Развернуть всё',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Ссылка на этот раздел',
    readOriginal: 'Оригинал на GitHub',
    suggestChange: 'Предложить изменение',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Нам пока не удалось прочитать записи этого списка ({reason}).',
    noReason: 'причина не указана',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Эта страница — индекс списка <1>{name}</1>, который ведут {owner} и контрибьюторы в <2>{repo}</2>. Подбор и порядок — их, краткое описание выше — наше.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Прочитан на коммите {oid} {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Лицензия: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Ещё в категории «{category}»',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Также встречается как: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Это тоже список из нашей библиотеки: <1>открыть его</1>.',
    archived: 'Владелец перенёс репозиторий в архив.',
    gone: 'Этого репозитория больше нет на GitHub.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'Нет пушей с {month}.',
    quiet: 'Нет пушей два года.',
    factsAsOf: 'Данные GitHub на {date}.',
    inLists: p({ one: 'В {n} списке', few: 'В {n} списках', many: 'В {n} списках', other: 'В {n} списка' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'указан как «{name}»',
    alongside: 'Встречается рядом',
    attribution: 'Упоминается в списках выше. Перейдите в список, чтобы прочитать, что о нём пишут кураторы. Чтобы предложить изменение, создайте issue в одном из этих списков.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Открыть на GitHub ↗',
    visit: 'Перейти на {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Ещё от {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: '{n} проект от {owner}', few: 'Все {n} проекта от {owner}', many: 'Все {n} проектов от {owner}', other: 'Все {n} проекта от {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Темы',
  },
  items: {
    h1: 'Элементы',
    searchItems: 'Поиск по элементам',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (только лучшие совпадения)',
    kind: 'Тип',
    status: 'Статус',
    language: 'Язык',
    licence: 'Лицензия',
    topic: 'Тема',
    category: 'Категория',
    list: 'Список',
    stars: 'Звёзды',
    namedBy: 'Упоминается в',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ звёзд',
    inAtLeast: 'в {n}+ списках',
  },
  owner: {
    listsTheyKeep: 'Списки, которые ведёт',
    theirProjects: 'Проекты, упомянутые в списках',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'Все {n} в элементах', few: 'Все {n} в элементах', many: 'Все {n} в элементах', other: 'Все {n} в элементах' }),
  },
  search: {
    h1: 'Поиск',
    lists: 'Списки',
    sections: 'Разделы',
    items: 'Элементы',
    /** Beside a section found by search: the list it is in. */
    inList: 'в {list}',
    noItems: 'Нет подходящих элементов.',
    allItems: p({ one: 'Все элементы: {n}', few: 'Все {n} элемента', many: 'Все {n} элементов', other: 'Все {n} элемента' }),
  },
  notFound: {
    h1: 'По этому адресу ничего нет',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Возможно, вы искали',
  },
  about: {
    h1: 'О сайте {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} — бесплатная библиотека всех awesome-списков из <1>индекса awesome-списков</1> и всего, что в них есть: {lists}, {items}, которые они упоминают, и где какой список упоминает каждый из них.',
    shownTitle: 'Что показывается, а что нет',
    shown: 'Сайт показывает названия, разделы, ссылки, факты и наши собственные тексты. Он никогда не показывает описания кураторов или владельцев репозиториев. Краткое описание списка — наше; то, что список пишет о записи, остаётся в списке, в одном клике отсюда.',
    attributionTitle: 'Авторство',
    attribution: 'Подбор и порядок в каждом списке принадлежат тем, кто его ведёт. На странице каждого списка указано, где он находится и на каком коммите прочитан. Данные о репозиториях (звёзды, последний пуш, язык, лицензия, темы) берутся с GitHub.',
    leaveOutTitle: 'Как убрать список',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Ведёте список и хотите убрать его отсюда? <1>Создайте issue в репозитории этого проекта</1> с названием списка. Он будет исключён при следующей сборке: его записи не читаются, а страница удаляется.',
    coverageTitle: 'Охват',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'Списков прочитано полностью: {ok}, частично: {partial}, ещё не прочитано: {unparsed}.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'Списков прочитано полностью: {ok}, частично: {partial}, ещё не прочитано: {unparsed}, удалено с GitHub: {gone}.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: репозиториев — {repo}, сайтов — {site}, видео — {video}, статей — {article}, пакетов — {package}, научных статей — {paper}.',
    coverageTwoOrMore: 'Элементов, упомянутых в двух списках и более: {n}.',
    coverageRepos: 'Репозитории: активных — {active}, затихших (без пушей два года) — {quiet}, в архиве — {archived}, удалённых — {gone}.',
    dataOf: 'Данные на {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({
        one: '{site}: {n} awesome-список и всё, что в нём',
        few: '{site}: {n} awesome-списка и всё, что в них',
        many: '{site}: {n} awesome-списков и всё, что в них',
        other: '{site}: {n} awesome-списка и всё, что в них',
      }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Индекс {n} awesome-списка и упомянутых в нём проектов ({items}) по категориям, языкам, лицензиям и темам.',
        few: 'Индекс {n} awesome-списков и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
        many: 'Индекс {n} awesome-списков и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
        other: 'Индекс {n} awesome-списка и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
      }),
    },
    lists: {
      title: p({ one: 'Все awesome-списки: {n}', few: 'Все {n} awesome-списка', many: 'Все {n} awesome-списков', other: 'Все {n} awesome-списка' }),
      description: p({
        one: '{n} awesome-список с размером, звёздами и нашим кратким описанием в одну строку.',
        few: '{n} awesome-списка с размерами, звёздами и нашими краткими описаниями в одну строку.',
        many: '{n} awesome-списков с размерами, звёздами и нашими краткими описаниями в одну строку.',
        other: '{n} awesome-списка с размерами, звёздами и нашими краткими описаниями в одну строку.',
      }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} awesome-список', few: '{category}: {n} awesome-списка', many: '{category}: {n} awesome-списков', other: '{category}: {n} awesome-списка' }),
      description: p({
        one: '{category}: {n} awesome-список с размером, звёздами и кратким описанием.',
        few: '{category}: {n} awesome-списка с размерами, звёздами и краткими описаниями.',
        many: '{category}: {n} awesome-списков с размерами, звёздами и краткими описаниями.',
        other: '{category}: {n} awesome-списка с размерами, звёздами и краткими описаниями.',
      }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, страница {page}',
    list: {
      /** {name} is the list's name. */
      title: p({
        one: '{name}: awesome-список, {n} элемент',
        few: '{name}: awesome-список, {n} элемента',
        many: '{name}: awesome-список, {n} элементов',
        other: '{name}: awesome-список, {n} элемента',
      }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name} — awesome-список, который ведётся в {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: в {n} awesome-списке', few: '{repo}: в {n} awesome-списках', many: '{repo}: в {n} awesome-списках', other: '{repo}: в {n} awesome-списка' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: в {n} awesome-списке', few: '{name}: в {n} awesome-списках', many: '{name}: в {n} awesome-списках', other: '{name}: в {n} awesome-списка' }),
      /** {lists} are up to three list names. */
      repoDescription: p({
        one: '{name} упоминается в {n} awesome-списке: {lists}.',
        few: '{name} упоминается в {n} awesome-списках: {lists}.',
        many: '{name} упоминается в {n} awesome-списках: {lists}.',
        other: '{name} упоминается в {n} awesome-списка: {lists}.',
      }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({
        one: '{name} ({host}) упоминается в {n} awesome-списке: {lists}.',
        few: '{name} ({host}) упоминается в {n} awesome-списках: {lists}.',
        many: '{name} ({host}) упоминается в {n} awesome-списках: {lists}.',
        other: '{name} ({host}) упоминается в {n} awesome-списка: {lists}.',
      }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: в awesome-списке {list}',
      titleOne: '{name}: в awesome-списке {list}',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} есть в awesome-списке {list}, в разделе «{section}».',
      under: 'В {list} — в разделе «{section}».',
      alongside: 'Рядом с {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: списки и проекты',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} на GitHub: ведёт {lists}, в списках упомянуто {projects}.',
    },
    items: {
      title: p({
        one: '{n} проект из awesome-списков',
        few: '{n} проекта из awesome-списков',
        many: '{n} проектов из awesome-списков',
        other: '{n} проекта из awesome-списков',
      }),
      description: p({
        one: '{n} проект по языку, лицензии, теме, звёздам и числу списков, где он упоминается.',
        few: '{n} проекта по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
        many: '{n} проектов по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
        other: '{n} проекта по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
      }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({
        one: '{label}: {n} проект из awesome-списков',
        few: '{label}: {n} проекта из awesome-списков',
        many: '{label}: {n} проектов из awesome-списков',
        other: '{label}: {n} проекта из awesome-списков',
      }),
      filteredDescription: p({
        one: '{label}: {n} проект из awesome-списков, со звёздами и списками, где он упоминается.',
        few: '{label}: {n} проекта из awesome-списков, со звёздами и списками, где они упоминаются.',
        many: '{label}: {n} проектов из awesome-списков, со звёздами и списками, где они упоминаются.',
        other: '{label}: {n} проекта из awesome-списков, со звёздами и списками, где они упоминаются.',
      }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Элементы по запросу «{q}»',
    },
    about: {
      title: 'О сайте {site}',
      description: 'Что показывает {site}, откуда берутся данные и как убрать список из индекса.',
    },
  },
};
