export type Segment =
  | { kind: 'text'; content: string }
  | { kind: 'link'; text: string; url: string; linkId: string };

export type EmailBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'section-link'; text: string; url: string; linkId: string }
  | { kind: 'paragraph'; segments: Segment[] };

export interface MockEmail {
  id: string;
  sender: string;
  email: string;
  tagline: string;
  time: string;
  read: boolean;
  avatarColor: string;
  subject: string;
  content: EmailBlock[];
  bookmarkedLinks: string[];
  addedBookmarks: { id: string; title: string; domain: string; url: string; tagIds: string[] }[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export const TAG_COLORS = [
  { name: 'Grey',   bg: 'var(--grey-2)',      text: 'var(--grey-2)'      },
  { name: 'Blue',   bg: 'var(--info-500)',    text: 'var(--info-500)'    },
  { name: 'Purple', bg: 'var(--purple-500)',  text: 'var(--purple-500)'  },
  { name: 'Green',  bg: 'var(--success-500)', text: 'var(--success-500)' },
  { name: 'Orange', bg: '#E09400',            text: '#E09400'            },
  { name: 'Yellow', bg: '#FFED48',            text: '#FFED48'            },
  { name: 'Pink',   bg: 'var(--pink-500)',    text: 'var(--pink-500)'    },
  { name: 'Red',    bg: 'var(--danger-500)',  text: 'var(--danger-500)'  },
];

export interface MockBookmark {
  id: string;
  title: string;
  url: string;
  domain: string;
  source: string;
  tagIds: string[];
  createdAt: Date;
}

export const TAGS: Tag[] = [
  { id: 'tag-1', name: 'life',    color: 'var(--pink-500)',    textColor: 'var(--pink-500)'    },
  { id: 'tag-2', name: 'death',   color: 'var(--purple-500)',  textColor: 'var(--purple-500)'  },
  { id: 'tag-3', name: 'science', color: 'var(--success-500)', textColor: 'var(--success-500)' },
  { id: 'tag-4', name: 'tech',    color: 'var(--info-500)',    textColor: 'var(--info-500)'    },
  { id: 'tag-5', name: 'finance', color: 'var(--warning-500)', textColor: 'var(--warning-500)' },
  { id: 'tag-6', name: 'health',  color: 'var(--danger-500)',  textColor: 'var(--danger-500)'  },
];

export const MOCK_EMAILS: MockEmail[] = [
  {
    id: '1',
    sender: 'Calower',
    email: 'colwer@newsletter.com',
    tagline: 'Your daily dose of inspiration and insight.',
    time: '14:30',
    read: false,
    avatarColor: '#22c55e',
    subject: 'AI Insights Weekly',
    content: [
      { kind: 'heading', text: 'AI Insights Weekly' },
      { kind: 'label', text: 'Top News' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: "Introducing 'Starlight,' a groundbreaking " },
          {
            kind: 'link',
            text: 'AI model surpass',
            url: 'https://marcbouchenoire.com/starlight',
            linkId: 'link-1',
          },
          { kind: 'text', content: ' benchmarks in natural language processing.' },
        ],
      },
      { kind: 'label', text: 'Research Highlights' },
      {
        kind: 'paragraph',
        segments: [
          {
            kind: 'text',
            content:
              'Deep dive into the pioneering study on AI-driven personalized medicine and its transformative impact on patient care.',
          },
        ],
      },
      {
        kind: 'section-link',
        text: 'Industry Trends',
        url: 'https://marcbouchenoire.com/industry-trends',
        linkId: 'link-2',
      },
      {
        kind: 'paragraph',
        segments: [
          {
            kind: 'text',
            content:
              'New analysis: The rapid integration of AI in the automotive industry is reshaping manufacturing and supply chains.',
          },
        ],
      },
    ],
    bookmarkedLinks: ['link-1'],
    addedBookmarks: [
      { id: 'ab-1', title: 'AI Model surpass', domain: 'marcbouchenoire.com', url: 'https://marcbouchenoire.com/starlight', tagIds: [] },
      { id: 'ab-2', title: 'This is another link pretty cool', domain: 'marcbouchenoire.com', url: 'https://marcbouchenoire.com', tagIds: [] },
    ],
  },
  {
    id: '2',
    sender: 'Global News',
    email: 'news@globalnews.com',
    tagline: 'Prioritize your well-being with expert advice.',
    time: '14:30',
    read: false,
    avatarColor: '#3b82f6',
    subject: 'Morning Briefing — Wednesday',
    content: [
      { kind: 'heading', text: 'Morning Briefing' },
      { kind: 'label', text: 'World' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'A major climate accord was signed today by representatives from 45 nations, pledging to reduce emissions by 40% before 2035. ' },
          { kind: 'link', text: 'Read the full agreement', url: 'https://globalnews.com/climate-accord', linkId: 'link-g1' },
          { kind: 'text', content: '.' },
        ],
      },
      { kind: 'label', text: 'Tech' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'The EU parliament voted to mandate open-source AI auditing for all large language models deployed in Europe.' },
        ],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '3',
    sender: 'The Daily Bloom',
    email: 'hello@dailybloom.co',
    tagline: 'Stay informed with the latest global headlines.',
    time: '14:30',
    read: true,
    avatarColor: '#a855f7',
    subject: 'Your Weekly Roundup',
    content: [
      { kind: 'heading', text: 'Your Weekly Roundup' },
      { kind: 'label', text: 'Featured' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'Five stories reshaping how we think about the future of work, wellness, and the environment. ' },
          { kind: 'link', text: 'See all stories', url: 'https://dailybloom.co/roundup', linkId: 'link-d1' },
        ],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '4',
    sender: 'Money Moves',
    email: 'digest@moneymoves.io',
    tagline: 'Smart strategies to grow your wealth.',
    time: '14:30',
    read: true,
    avatarColor: '#f59e0b',
    subject: 'Market Digest: Q1 Recap',
    content: [
      { kind: 'heading', text: 'Market Digest' },
      { kind: 'label', text: 'Markets' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'Q1 ended with the S&P 500 up 6.2%, driven primarily by AI infrastructure spending and energy sector gains. ' },
          { kind: 'link', text: 'Full analysis', url: 'https://moneymoves.io/q1', linkId: 'link-m1' },
        ],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '5',
    sender: 'Tech Today',
    email: 'updates@techtoday.dev',
    tagline: 'Discover the latest innovations shaping our world.',
    time: '14:30',
    read: true,
    avatarColor: '#06b6d4',
    subject: 'This Week in Tech',
    content: [
      { kind: 'heading', text: 'This Week in Tech' },
      { kind: 'label', text: 'Top Story' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'Open-source robotics is having its ChatGPT moment. ' },
          { kind: 'link', text: 'Meet the new contenders', url: 'https://techtoday.dev/robotics', linkId: 'link-t1' },
        ],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '6',
    sender: 'Health Matters',
    email: 'care@healthmatters.org',
    tagline: 'Cultivating positivity, one story at a time.',
    time: '14:30',
    read: true,
    avatarColor: '#ef4444',
    subject: 'Sleep Science Update',
    content: [
      { kind: 'heading', text: 'Sleep Science Update' },
      { kind: 'label', text: 'Research' },
      {
        kind: 'paragraph',
        segments: [
          { kind: 'text', content: 'New research suggests that consistent sleep timing matters more than total hours slept. ' },
          { kind: 'link', text: 'Learn more', url: 'https://healthmatters.org/sleep', linkId: 'link-h1' },
        ],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '7',
    sender: 'Design Weekly',
    email: 'hello@designweekly.co',
    tagline: 'Beautiful design, delivered weekly.',
    time: '13:45',
    read: true,
    avatarColor: '#ec4899',
    subject: 'The Spatial Computing Era',
    content: [
      { kind: 'heading', text: 'The Spatial Computing Era' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'How designers are adapting their craft for three-dimensional interfaces.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '8',
    sender: 'The Financer',
    email: 'brief@thefinancer.com',
    tagline: 'Your edge in the markets.',
    time: '12:00',
    read: true,
    avatarColor: '#10b981',
    subject: 'Interest Rates: What Now?',
    content: [
      { kind: 'heading', text: 'Interest Rates: What Now?' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'The Fed held rates steady for a third consecutive meeting. Here is what bond markets are pricing in.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '9',
    sender: 'Climate Brief',
    email: 'news@climatebrief.earth',
    tagline: 'The planet in your inbox.',
    time: '11:30',
    read: true,
    avatarColor: '#84cc16',
    subject: 'Methane Levels at Record High',
    content: [
      { kind: 'heading', text: 'Methane Levels at Record High' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'Atmospheric methane hit an all-time record in February according to NOAA data, raising concerns about feedback loops.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '10',
    sender: 'Startup Memo',
    email: 'digest@startupmemo.co',
    tagline: 'The stories founders need.',
    time: '10:15',
    read: true,
    avatarColor: '#f97316',
    subject: 'YC W26 Batch Breakdown',
    content: [
      { kind: 'heading', text: 'YC W26 Batch Breakdown' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'A look at the most interesting startups from this season — AI agents, climate infra, and defense tech dominate.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '11',
    sender: 'Words & Worlds',
    email: 'hello@wordsandworlds.net',
    tagline: 'Literature that moves you.',
    time: '09:00',
    read: true,
    avatarColor: '#8b5cf6',
    subject: 'The Essay That Changed My Mind',
    content: [
      { kind: 'heading', text: 'The Essay That Changed My Mind' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'Rereading a 1997 essay on attention and technology that feels more prescient than ever.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
  {
    id: '12',
    sender: 'The Generalist',
    email: 'mario@thegeneralist.co',
    tagline: 'Deeply researched. Beautifully written.',
    time: '08:00',
    read: true,
    avatarColor: '#64748b',
    subject: 'The Age of Company-States',
    content: [
      { kind: 'heading', text: 'The Age of Company-States' },
      {
        kind: 'paragraph',
        segments: [{ kind: 'text', content: 'What happens when corporations start providing services that governments no longer can? A deep dive into the new political economy.' }],
      },
    ],
    bookmarkedLinks: [],
    addedBookmarks: [],
  },
];

export const MOCK_BOOKMARKS: MockBookmark[] = [
  {
    id: 'bm-1',
    title: 'Chronicles of the Unseen',
    url: 'https://astralvoyage.org',
    domain: 'astralvoyage.org',
    source: 'The Generalist',
    tagIds: [],
    createdAt: new Date('2026-03-05T09:00:00'),
  },
  {
    id: 'bm-2',
    title: 'Echoes of Forgotten Tales',
    url: 'https://shadowarchives.com',
    domain: 'shadowarchives.com',
    source: 'Words & Worlds',
    tagIds: ['tag-1', 'tag-2', 'tag-3', 'tag-4'],
    createdAt: new Date('2026-03-04T17:30:00'),
  },
  {
    id: 'bm-3',
    title: 'The Serendipity Journal',
    url: 'https://luminarytales.net',
    domain: 'luminarytales.net',
    source: 'The Daily Bloom',
    tagIds: [],
    createdAt: new Date('2026-03-04T12:00:00'),
  },
  {
    id: 'bm-4',
    title: 'Whispers in the Wind',
    url: 'https://velvetverses.io',
    domain: 'velvetverses.io',
    source: 'Words & Worlds',
    tagIds: [],
    createdAt: new Date('2026-03-03T20:00:00'),
  },
  {
    id: 'bm-5',
    title: "The Alchemist's Dream",
    url: 'https://emberchronicles.co',
    domain: 'emberchronicles.co',
    source: 'Words & Worlds',
    tagIds: [],
    createdAt: new Date('2026-03-03T15:00:00'),
  },
  {
    id: 'bm-6',
    title: 'Voyage of the Star Wanderer',
    url: 'https://mysticmirage.me',
    domain: 'mysticmirage.me',
    source: 'The Generalist',
    tagIds: [],
    createdAt: new Date('2026-03-02T11:00:00'),
  },
  {
    id: 'bm-7',
    title: 'The Enigma of Evergreena',
    url: 'https://celestialcanvas.info',
    domain: 'celestialcanvas.info',
    source: 'Global News',
    tagIds: [],
    createdAt: new Date('2026-03-01T09:00:00'),
  },
  {
    id: 'bm-8',
    title: 'Labyrinth of Lost Memories',
    url: 'https://whisperingwinds.tv',
    domain: 'whisperingwinds.tv',
    source: 'Global News',
    tagIds: [],
    createdAt: new Date('2026-02-28T16:00:00'),
  },
  {
    id: 'bm-9',
    title: "The Oracle's Prophecy",
    url: 'https://seraphicstories.biz',
    domain: 'seraphicstories.biz',
    source: 'The Generalist',
    tagIds: [],
    createdAt: new Date('2026-02-27T10:00:00'),
  },
];
