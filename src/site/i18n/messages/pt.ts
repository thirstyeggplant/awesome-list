// Portuguese (Brazil). Translated from messages/en.ts. After changing a message, run `pnpm check-translations --stamp pt`.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const pt: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Pular para o conteúdo',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: 'O {site} indexa nomes, seções e links. As descrições pertencem às listas e não são copiadas aqui. Você mantém uma lista e quer que ela fique de fora? <1>Abra uma issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Trilha de navegação',
  },
  nav: {
    lists: 'Listas',
    items: 'Itens',
    about: 'Sobre',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Buscar',
    searchHint: 'Buscar  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Busca rápida',
    placeholder: 'Buscar listas, itens e tags',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Resultados',
    help: '↑ ↓ para navegar, Enter para abrir, Esc para fechar',
    /** Group headings inside the dialog's results. */
    lists: 'Listas',
    items: 'Itens',
    tags: 'Tags',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Idioma',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Leia esta página em português',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Fechar',
  },
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: 'Compartilhar',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: 'Compartilhar no {service}',
    /** The email link's name. */
    email: 'Compartilhar por e-mail',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: 'Copiar link',
    copied: 'Copiado',
    /** A button that opens the phone's own share sheet. */
    native: 'Compartilhar…',
  },
  count: {
    lists: p({ one: '{n} lista', many: '{n} de listas', other: '{n} listas' }),
    items: p({ one: '{n} item', many: '{n} de itens', other: '{n} itens' }),
    listings: p({ one: '{n} menção', many: '{n} de menções', other: '{n} menções' }),
    sections: p({ one: '{n} seção', many: '{n} de seções', other: '{n} seções' }),
    links: p({ one: '{n} link', many: '{n} de links', other: '{n} links' }),
    stars: p({ one: '{n} estrela', many: '{n} de estrelas', other: '{n} estrelas' }),
    projects: p({ one: '{n} projeto', many: '{n} de projetos', other: '{n} projetos' }),
    otherLists: p({ one: '{n} outra lista', many: '{n} de outras listas', other: '{n} outras listas' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} em {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} de {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} de {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'em {n} lista', many: 'em {n} de listas', other: 'em {n} listas' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'repositório',
    package: 'pacote',
    video: 'vídeo',
    paper: 'paper',
    article: 'artigo',
    site: 'site',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'ativo',
    quiet: 'parado',
    archived: 'arquivado',
    gone: 'removido',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'lida por completo',
    partial: 'lida em parte',
    unparsed: 'ainda não lida',
    gone: 'removida',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'relevância',
    lists: 'listas',
    stars: 'estrelas',
    items: 'itens',
    updated: 'atualização',
    name: 'nome',
  },
  yes: 'sim',
  no: 'não',
  common: {
    search: 'Buscar',
    filter: 'Filtrar',
    searchListsAndItems: 'Buscar listas e itens',
    nothingHere: 'Nada por aqui.',
    previous: '← Anterior',
    next: 'Próxima →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Limpar tudo',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · ordenar por {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'A paginação para na página {n}. Refine os filtros para ver mais.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '“{q}”',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** Between the pager's two buttons: where the reader is. */
    pageOf: 'Página {page} de {pages}',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}: {value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: 'atualizado em {year}',
  },
  facts: {
    stars: 'Estrelas',
    lastPush: 'Último push',
    language: 'Linguagem',
    licence: 'Licença',
    entries: 'Entradas',
    namedBy: 'Citado por',
    state: 'Estado',
    fork: 'Fork',
    kind: 'Tipo',
    host: 'Host',
    renamedFrom: 'Antigo nome',
    /** An item's GitHub owner, a link to their page. */
    owner: 'Dono',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ one: '{n} awesome list e tudo o que há nela', many: '{n} de awesome lists e tudo o que há nelas', other: '{n} awesome lists e tudo o que há nelas' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · dados de {date}',
    mostNamed: 'Citados por mais listas',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'Explorar por linguagem',
    allProjects: 'Todos os projetos',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'Comece por aqui',
    allLists: p({ one: '{n} lista', many: 'Todas as {n} de listas', other: 'Todas as {n} listas' }),
    /** A heading over every list, category by category. */
    byCategory: 'Todas as listas por categoria',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'Todos os projetos citados por 2 listas ou mais',
  },
  lists: {
    h1: 'Listas',
    filterLists: 'Filtrar listas',
    category: 'Categoria',
    licence: 'Licença',
    status: 'Status',
  },
  list: {
    contents: 'Conteúdo',
    filterThisList: 'Filtrar esta lista',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Link para esta seção',
    readOriginal: 'Ver o original no GitHub',
    suggestChange: 'Sugerir uma alteração',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Ainda não conseguimos ler as entradas desta lista ({reason}).',
    noReason: 'motivo não informado',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Esta página é um índice de <1>{name}</1>, uma lista mantida por {owner} e seus contribuidores em <2>{repo}</2>. A seleção e a ordem são deles; o resumo acima é nosso.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Lida no commit {oid} em {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Licença: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Mais em {category}',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: 'Veja também',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: 'Listas relacionadas',
    inCommon: p({ one: '{n} projeto em comum', many: '{n} de projetos em comum', other: '{n} projetos em comum' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: 'Sobre esta lista',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Também listado como: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Este item também é uma lista da biblioteca: <1>abrir</1>.',
    archived: 'Arquivado pelo dono.',
    gone: 'Este repositório não existe mais no GitHub.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'Sem pushes desde {month}.',
    quiet: 'Sem pushes há dois anos.',
    factsAsOf: 'Dados do GitHub de {date}.',
    inLists: p({ one: 'Em {n} lista', many: 'Em {n} de listas', other: 'Em {n} listas' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'listado como “{name}”',
    alongside: 'Listado junto com',
    attribution: 'Citado pelas listas acima. Abra uma lista para ler o que os curadores dizem sobre ele. Para sugerir uma alteração, abra uma issue em uma dessas listas.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Abrir no GitHub ↗',
    visit: 'Visitar {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Mais de {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: '{n} projeto de {owner}', many: 'Os {n} de projetos de {owner}', other: 'Os {n} projetos de {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Tópicos',
  },
  items: {
    h1: 'Itens',
    searchItems: 'Buscar itens',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (só os melhores resultados)',
    kind: 'Tipo',
    status: 'Status',
    language: 'Linguagem',
    licence: 'Licença',
    topic: 'Tópico',
    category: 'Categoria',
    list: 'Lista',
    stars: 'Estrelas',
    namedBy: 'Citado por',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ estrelas',
    inAtLeast: 'em {n}+ listas',
  },
  owner: {
    listsTheyKeep: 'Listas que mantém',
    theirProjects: 'Projetos citados por listas',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'Ver {n} em Itens', many: 'Todos os {n} em Itens', other: 'Todos os {n} em Itens' }),
    /** Under an owner's GitHub link; {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
    line: 'Mantém: {lists} · Citados por listas: {projects}',
  },
  search: {
    h1: 'Busca',
    lists: 'Listas',
    sections: 'Seções',
    items: 'Itens',
    /** Beside a section found by search: the list it is in. */
    inList: 'em {list}',
    noItems: 'Nenhum item encontrado.',
    allItems: p({ one: 'Ver {n} item', many: 'Todos os {n} de itens', other: 'Todos os {n} itens' }),
  },
  notFound: {
    h1: 'Nada neste endereço',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Talvez',
  },
  about: {
    h1: 'Sobre o {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: 'O {site} é uma biblioteca gratuita de todas as awesome lists do <1>índice de awesome lists</1> e de tudo o que há nelas: {lists}, os {items} que elas citam e onde cada lista cita cada um.',
    shownTitle: 'O que é mostrado e o que não é',
    shown: 'O site mostra nomes, seções, links e dados, além das nossas próprias palavras. Ele nunca mostra a descrição de um curador ou do dono de um repositório. O resumo de uma lista é nosso; o que a lista diz sobre uma entrada fica na lista, a um link de distância.',
    attributionTitle: 'Atribuição',
    attribution: 'A seleção e a ordem de cada lista pertencem a quem a mantém. Cada página de lista diz onde a lista está e em qual commit foi lida. Os dados sobre repositórios (estrelas, último push, linguagem, licença, tópicos) vêm do GitHub.',
    leaveOutTitle: 'Como retirar uma lista',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Você mantém uma lista e quer que ela fique de fora? <1>Abra uma issue no repositório deste projeto</1> informando a lista. Ela sai no próximo build: suas entradas não são lidas e sua página é removida.',
    coverageTitle: 'Cobertura',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} listas lidas por completo, {partial} em parte, {unparsed} ainda não lidas.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} listas lidas por completo, {partial} em parte, {unparsed} ainda não lidas, {gone} removidas do GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: {repo} repositórios, {site} sites, {video} vídeos, {article} artigos, {package} pacotes, {paper} papers.',
    coverageTwoOrMore: '{n} itens são citados por duas listas ou mais.',
    coverageRepos: 'Repositórios: {active} ativos, {quiet} parados (sem push há dois anos), {archived} arquivados, {gone} removidos.',
    dataOf: 'Dados de {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ one: '{site}: {n} awesome list e tudo o que há nela', many: '{site}: {n} de awesome lists e tudo o que há nelas', other: '{site}: {n} awesome lists e tudo o que há nelas' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Índice de {n} awesome list e dos {items} projetos que ela cita, por categoria, linguagem, licença e tópico.',
        many: 'Índice de {n} de awesome lists e dos {items} projetos que elas citam, por categoria, linguagem, licença e tópico.',
        other: 'Índice de {n} awesome lists e dos {items} projetos que elas citam, por categoria, linguagem, licença e tópico.',
      }),
    },
    lists: {
      title: p({ one: '{n} awesome list', many: 'Todas as {n} de awesome lists', other: 'Todas as {n} awesome lists' }),
      description: p({ one: '{n} awesome list com tamanho, estrelas e um resumo nosso de uma linha.', many: '{n} de awesome lists com tamanho, estrelas e um resumo nosso de uma linha.', other: '{n} awesome lists com tamanho, estrelas e um resumo nosso de uma linha.' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} awesome list', many: '{category}: {n} de awesome lists', other: '{category}: {n} awesome lists' }),
      description: p({ one: '{n} awesome list de {category}, com tamanho, estrelas e resumo.', many: '{n} de awesome lists de {category}, com tamanho, estrelas e resumo.', other: '{n} awesome lists de {category}, com tamanho, estrelas e resumo.' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, página {page}',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ one: '{name} ({repo}): awesome list com {n} item', many: '{name} ({repo}): awesome list com {n} de itens', other: '{name} ({repo}): awesome list com {n} itens' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, uma awesome list mantida em {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: em {n} awesome list', many: '{repo}: em {n} de awesome lists', other: '{repo}: em {n} awesome lists' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: em {n} awesome list', many: '{name}: em {n} de awesome lists', other: '{name}: em {n} awesome lists' }),
      /** {lists} are up to three list names. */
      repoDescription: p({ one: '{name} é citado por {n} awesome list: {lists}.', many: '{name} é citado por {n} de awesome lists: {lists}.', other: '{name} é citado por {n} awesome lists: {lists}.' }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({ one: '{name} ({host}) é citado por {n} awesome list: {lists}.', many: '{name} ({host}) é citado por {n} de awesome lists: {lists}.', other: '{name} ({host}) é citado por {n} awesome lists: {lists}.' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: na awesome list {list}',
      titleOne: '{name}: na awesome list {list}',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} está na awesome list {list}, em {section}.',
      under: 'Em {list}, está em {section}.',
      alongside: 'Junto com {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: listas e projetos',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} no GitHub: mantém {lists}, tem {projects} citados por listas.',
    },
    items: {
      title: p({ one: '{n} projeto citado por awesome lists', many: '{n} de projetos citados por awesome lists', other: '{n} projetos citados por awesome lists' }),
      description: p({ one: 'Explore {n} projeto por linguagem, licença, tópico, estrelas e número de listas que o citam.', many: 'Explore {n} de projetos por linguagem, licença, tópico, estrelas e número de listas que os citam.', other: 'Explore {n} projetos por linguagem, licença, tópico, estrelas e número de listas que os citam.' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ one: '{label}: {n} projeto em awesome lists', many: '{label}: {n} de projetos em awesome lists', other: '{label}: {n} projetos em awesome lists' }),
      filteredDescription: p({ one: '{label}: {n} projeto citado por awesome lists, com estrelas e as listas que o citam.', many: '{label}: {n} de projetos citados por awesome lists, com estrelas e as listas que os citam.', other: '{label}: {n} projetos citados por awesome lists, com estrelas e as listas que os citam.' }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Itens para “{q}”',
    },
    about: {
      title: 'Sobre o {site}',
      description: 'O que o {site} mostra, de onde vêm os dados e como retirar uma lista.',
    },
  },
};
