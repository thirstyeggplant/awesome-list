// Indonesian. Translated from messages/en.ts. After changing a message, run `pnpm check-translations --stamp id`.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const id: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Langsung ke konten',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} mengindeks nama, bagian, dan tautan. Deskripsi tetap milik daftar masing-masing dan tidak disalin ke sini. Kamu mengelola sebuah daftar dan ingin daftar itu tidak dimuat? <1>Buka issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Breadcrumb',
  },
  nav: {
    lists: 'Daftar',
    items: 'Item',
    about: 'Tentang',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Cari',
    searchHint: 'Cari  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Pencarian cepat',
    placeholder: 'Cari daftar, item, dan tag',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Hasil',
    help: '↑ ↓ untuk berpindah, Enter untuk membuka, Esc untuk menutup',
    /** Group headings inside the dialog's results. */
    lists: 'Daftar',
    items: 'Item',
    tags: 'Tag',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Bahasa',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Baca halaman ini dalam bahasa Indonesia',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Tutup',
  },
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: 'Bagikan',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: 'Bagikan ke {service}',
    /** The email link's name. */
    email: 'Bagikan lewat email',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: 'Salin tautan',
    copied: 'Disalin',
    /** A button that opens the phone's own share sheet. */
    native: 'Bagikan…',
  },
  count: {
    lists: p({ other: '{n} daftar' }),
    items: p({ other: '{n} item' }),
    listings: p({ other: '{n} pencantuman' }),
    sections: p({ other: '{n} bagian' }),
    links: p({ other: '{n} tautan' }),
    stars: p({ other: '{n} bintang' }),
    projects: p({ other: '{n} proyek' }),
    otherLists: p({ other: '{n} daftar lain' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} dalam {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} dari {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} dari {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ other: 'di {n} daftar' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'repositori',
    package: 'paket',
    video: 'video',
    paper: 'paper',
    article: 'artikel',
    site: 'situs',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'aktif',
    quiet: 'sepi',
    archived: 'diarsipkan',
    gone: 'hilang',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'terbaca penuh',
    partial: 'terbaca sebagian',
    unparsed: 'belum terbaca',
    gone: 'hilang',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'relevansi',
    lists: 'daftar',
    stars: 'bintang',
    items: 'item',
    updated: 'pembaruan',
    name: 'nama',
  },
  yes: 'ya',
  no: 'tidak',
  common: {
    search: 'Cari',
    filter: 'Filter',
    searchListsAndItems: 'Cari daftar dan item',
    nothingHere: 'Tidak ada apa-apa di sini.',
    previous: '← Sebelumnya',
    next: 'Berikutnya →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Hapus semua',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · urutkan menurut {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'Halaman berhenti di halaman {n}. Persempit filter untuk melihat lebih banyak.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '“{q}”',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** Between the pager's two buttons: where the reader is. */
    pageOf: 'Halaman {page} dari {pages}',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}: {value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: 'diperbarui {year}',
  },
  facts: {
    stars: 'Bintang',
    lastPush: 'Push terakhir',
    language: 'Bahasa',
    licence: 'Lisensi',
    entries: 'Entri',
    namedBy: 'Disebut oleh',
    state: 'Status',
    fork: 'Fork',
    kind: 'Jenis',
    host: 'Host',
    renamedFrom: 'Sebelumnya bernama',
    /** An item's GitHub owner, a link to their page. */
    owner: 'Pemilik',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ other: '{n} awesome list beserta seluruh isinya' }),
    mostNamed: 'Paling banyak disebut daftar',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'Jelajahi menurut bahasa',
    allProjects: 'Semua proyek',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'Mulai di sini',
    allLists: p({ other: 'Semua {n} daftar' }),
    /** A heading over every list, category by category. */
    byCategory: 'Semua daftar menurut kategori',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'Semua proyek yang disebut 2 daftar atau lebih',
  },
  lists: {
    h1: 'Daftar',
    filterLists: 'Filter daftar',
    category: 'Kategori',
    licence: 'Lisensi',
    status: 'Status',
  },
  list: {
    contents: 'Isi',
    filterThisList: 'Filter daftar ini',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Tautan ke bagian ini',
    readOriginal: 'Baca versi aslinya di GitHub',
    suggestChange: 'Usulkan perubahan',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Entri daftar ini belum bisa kami baca ({reason}).',
    noReason: 'tanpa alasan',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Halaman ini adalah indeks dari <1>{name}</1>, daftar yang dikelola {owner} dan para kontributornya di <2>{repo}</2>. Pilihan dan urutannya milik mereka; ringkasan di atas buatan kami.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Dibaca pada commit {oid} tanggal {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Lisensi: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Lainnya di {category}',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: 'Lihat juga',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: 'Daftar terkait',
    inCommon: p({ other: '{n} proyek yang sama' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: 'Tentang daftar ini',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Juga tercantum sebagai: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Item ini sendiri adalah sebuah daftar di koleksi ini: <1>buka</1>.',
    gone: 'Repositori ini sudah tidak ada di GitHub.',
    factsAsOf: 'Data dari GitHub per {date}.',
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'tercantum sebagai ‘{name}’',
    attribution: 'Disebut oleh daftar-daftar di atas. Buka sebuah daftar untuk membaca apa kata kuratornya. Untuk mengusulkan perubahan, buka issue di salah satu daftar tersebut.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Buka di GitHub ↗',
    visit: 'Kunjungi {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Lainnya dari {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ other: 'Semua {n} proyek dari {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Topik',
    /** Under "What is listed alongside {name}?". */
    alongsideNote: 'Proyek yang berbagi bagian dengannya di suatu daftar. Daftar itu tidak menyebutnya sebagai alternatif.',
    q: {
      /** Headings of an item page, as the questions a visitor asks; {name} is the item. */
      lists: 'Awesome list mana yang menyebut {name}?',
      maintained: 'Apakah {name} masih dikelola?',
      alongside: 'Apa yang dicantumkan bersama {name}?',
    },
    a: {
      /** The answer under "Is {name} still maintained?", by the repository's state. {date} is its last push, {asOf} the data's date. The site says what GitHub says, and when. */
      active: 'Per {asOf}, push terakhirnya pada {date} dan tidak diarsipkan.',
      /** "Two years" is the site's rule for quiet (730 days). */
      quiet: 'Tidak ada push sejak {date}, lebih dari dua tahun sebelum {asOf}. Repositori ini tidak diarsipkan.',
      archived: 'Tidak. Pemiliknya mengarsipkannya; push terakhirnya pada {date}.',
    },
  },
  items: {
    h1: 'Item',
    searchItems: 'Cari item',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (hanya yang paling cocok)',
    kind: 'Jenis',
    status: 'Status',
    language: 'Bahasa',
    licence: 'Lisensi',
    topic: 'Topik',
    category: 'Kategori',
    list: 'Daftar',
    stars: 'Bintang',
    namedBy: 'Disebut oleh',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ bintang',
    inAtLeast: 'di {n}+ daftar',
  },
  owner: {
    listsTheyKeep: 'Daftar yang dikelola',
    theirProjects: 'Proyek miliknya yang disebut daftar',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ other: 'Semua {n} di Item' }),
  },
  search: {
    h1: 'Cari',
    lists: 'Daftar',
    sections: 'Bagian',
    items: 'Item',
    /** Beside a section found by search: the list it is in. */
    inList: 'di {list}',
    noItems: 'Tidak ada item yang cocok.',
    allItems: p({ other: 'Semua {n} item' }),
  },
  notFound: {
    h1: 'Tidak ada apa-apa di alamat ini',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Mungkin yang kamu cari',
  },
  about: {
    h1: 'Tentang {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} adalah koleksi gratis berisi setiap awesome list di <1>indeks awesome list</1> beserta seluruh isinya: {lists}, {items} yang mereka sebut, dan di mana setiap daftar menyebut masing-masing item.',
    shownTitle: 'Apa yang ditampilkan, dan apa yang tidak',
    shown: 'Situs ini menampilkan nama, bagian, tautan, dan data, serta tulisan kami sendiri. Deskripsi dari kurator atau pemilik repositori tidak pernah ditampilkan. Ringkasan sebuah daftar adalah buatan kami; apa kata daftar tentang sebuah entri tetap ada di daftar itu, cukup satu klik.',
    attributionTitle: 'Atribusi',
    attribution: 'Pilihan dan urutan setiap daftar adalah milik orang yang mengelolanya. Setiap halaman daftar menyebutkan lokasi daftar itu dan commit saat dibaca. Data tentang repositori (bintang, push terakhir, bahasa, lisensi, topik) berasal dari GitHub.',
    leaveOutTitle: 'Cara agar sebuah daftar tidak dimuat',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Kamu mengelola sebuah daftar dan ingin daftar itu tidak dimuat? <1>Buka issue di repositori proyek ini</1> dengan menyebut nama daftarnya. Daftar itu dikeluarkan pada build berikutnya: entrinya tidak dibaca dan halamannya dihapus.',
    coverageTitle: 'Cakupan',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} daftar terbaca penuh, {partial} sebagian, {unparsed} belum terbaca.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} daftar terbaca penuh, {partial} sebagian, {unparsed} belum terbaca, {gone} sudah hilang dari GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: {repo} repositori, {site} situs, {video} video, {article} artikel, {package} paket, {paper} paper.',
    coverageTwoOrMore: '{n} item disebut oleh dua daftar atau lebih.',
    coverageRepos: 'Repositori: {active} aktif, {quiet} sepi (tanpa push dalam dua tahun), {archived} diarsipkan, {gone} hilang.',
    dataOf: 'Data per {date}.',
  },
  /**
   * Sentences that open a page, made of its own data. Names in them are links; never a curator's or an owner's words.
   */
  sum: {
    /** The home page. {lists} and {items} are count plurals ("671 lists"), {date} a date. */
    home: '{site} adalah indeks {lists} dari GitHub dan {items} yang mereka sebut. Situs ini menampilkan nama, bagian, tautan, dan fakta dari GitHub, tidak pernah deskripsi milik daftar itu sendiri. Data per {date}; dibaca ulang setiap malam.',
    /** A category of /lists: {category} is its name, {names} three list names. */
    category: p({ other: 'Ada {n} awesome list dalam kategori {category}. Yang bintangnya terbanyak adalah {names}.' }),
    /** After a summary: {date} is a date. */
    asOf: 'Data per {date}.',
    list: {
      /** A list page, after our summary. {name} is the list, {repo} owner/repo, {owner} a login, {items} and {sections} count plurals. */
      what: '{name} adalah awesome list {repo}, dikelola oleh {owner} di GitHub. Daftar ini menyebut {items} dalam {sections}.',
      /** The same, for a list whose entries could not be read. */
      whatUnread: '{name} adalah awesome list {repo}, dikelola oleh {owner} di GitHub.',
      /** {stars} is a count plural ("196,233 stars"), {date} a date. */
      github: 'Daftar ini punya {stars} di GitHub dan push terakhirnya pada {date}.',
      /** {sections} are three section titles, each with its count: "Command Line (105), …". */
      sections: 'Bagian terbesarnya adalah {sections}.',
      /** {names} are five project names. */
      top: 'Proyek dengan bintang terbanyak di dalamnya adalah {names}.',
      /** {language} is a programming language, e.g. "Go". */
      lang: 'Sebagian besar repositorinya ditulis dalam {language}.',
    },
    items: {
      /** /items with one language: {label} is the language. */
      lang: p({ other: '{n} proyek yang disebut awesome list ditulis dalam {label}.' }),
      /** /items with one topic: {label} is a GitHub topic. */
      topic: p({ other: '{n} proyek yang disebut awesome list memiliki topik GitHub {label}.' }),
      /** /items with one licence: {label} is the licence, e.g. "MIT". */
      license: p({ other: '{n} proyek yang disebut awesome list memakai lisensi {label}.' }),
      /** /items with one kind: {label} is the kind's word, e.g. "video". */
      kind: p({ other: '{n} hal yang disebut awesome list berjenis {label}.' }),
      /** After one of the four: {names} are five names. */
      top: 'Yang disebut paling banyak daftar adalah {names}.',
    },
    item: {
      /** An item page's first sentence. {name} is the repository, {language} e.g. "Go", {owner} a login, {stars} a count plural. */
      repoLang: '{name} adalah repositori {language} milik {owner} di GitHub dengan {stars}.',
      /** The same, with no language known. */
      repo: '{name} adalah repositori milik {owner} di GitHub dengan {stars}.',
      /** The same, with no stars known. */
      repoPlain: '{name} adalah repositori milik {owner} di GitHub.',
      /** Anything else, one sentence a kind: {name} is its name, {host} where it is (example.com). */
      kind: {
        repo: '{name} adalah repositori di {host}.',
        site: '{name} adalah situs web di {host}.',
        video: '{name} adalah video di {host}.',
        article: '{name} adalah artikel di {host}.',
        package: '{name} adalah paket di {host}.',
        paper: '{name} adalah makalah di {host}.',
      },
      /** The second sentence: {lists} are up to three lists, each "Go (under Web Frameworks)", and perhaps "2 more". */
      lists: p({ other: '{n} awesome list menyebutnya: {lists}.' }),
      /** One of those lists: {list} is its name, {section} the title of the section that holds the item. */
      listUnder: '{list} (di bagian {section})',
      /** After three lists: how many more name it. */
      more: p({ other: '{n} lainnya' }),
      /** The third sentence, for a repository: {date} is a date. */
      pushed: 'Push terakhirnya pada {date}.',
    },
    owner: {
      /** An owner page: {display} is a login, {lists} and {projects} count plurals. */
      both: '{display} mengelola {lists} yang diindeks di sini, dan awesome list menyebut {projects} miliknya.',
      /** The same, with no projects named. */
      lists: '{display} mengelola {lists} yang diindeks di sini.',
      /** The same, with no lists kept. */
      projects: 'Awesome list menyebut {projects} milik {display}.',
    },
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ other: '{site}: {n} awesome list beserta seluruh isinya' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        other: 'Indeks {n} awesome list dan {items} proyek yang disebutnya, menurut kategori, bahasa, lisensi, dan topik.',
      }),
    },
    lists: {
      title: p({ other: 'Semua {n} awesome list' }),
      description: p({ other: '{n} awesome list beserta ukuran, bintang, dan ringkasan satu baris buatan kami.' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ other: '{category}: {n} awesome list' }),
      description: p({ other: '{n} awesome list tentang {category}, beserta ukuran, bintang, dan ringkasannya.' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, halaman {page}',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ other: '{name} ({repo}): awesome list berisi {n} item' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, awesome list yang dikelola di {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ other: '{repo}: ada di {n} awesome list' }),
      /** Anything else: {name} is its name. */
      title: p({ other: '{name}: ada di {n} awesome list' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: ada di awesome list {list}',
      titleOne: '{name}: ada di awesome list {list}',
      alongside: 'Bersama {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: daftar dan proyek',
    },
    items: {
      title: p({ other: '{n} proyek yang disebut awesome list' }),
      description: p({ other: 'Jelajahi {n} proyek menurut bahasa, lisensi, topik, bintang, dan jumlah daftar yang menyebutnya.' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ other: '{label}: {n} proyek di awesome list' }),
      filteredDescription: p({ other: '{label}: {n} proyek yang disebut awesome list, beserta bintang dan daftar yang menyebutnya.' }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Item yang cocok dengan “{q}”',
    },
    about: {
      title: 'Tentang {site}',
      description: 'Apa yang ditampilkan {site}, dari mana asalnya, dan cara agar sebuah daftar tidak dimuat.',
    },
  },
};
