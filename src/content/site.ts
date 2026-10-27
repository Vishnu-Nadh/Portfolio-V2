/**
 * Single source of truth for every piece of copy and data rendered on the site.
 * Sections import from here; nothing user-facing is hard-coded in components.
 */

export const profile = {
  firstName: "vishnu",
  lastName: "nadh",
  fullName: "Vishnu Nadh",
  monogram: "VN",
  role: "SOFTWARE ENGINEER",
  focus: "FRONTEND · AI",
  city: "Bengaluru",
  country: "India",
  countryCode: "IN",
  cityCode: "BLR",
  timeZone: "Asia/Kolkata",
  timeZoneLabel: "IST",
  since: "2022",
  email: "hello@vishnunadh.dev",
  availability: "AVAILABLE",
} as const;

export const socials = {
  email: { label: "Email", href: `mailto:${profile.email}`, cursor: "COPY EMAIL" },
  instagram: { label: "Instagram", href: "https://instagram.com/vishnunadh", cursor: "OPEN INSTAGRAM" },
  linkedin: { label: "LinkedIn", href: "https://linkedin.com/in/vishnunadh", cursor: "CONNECT ON LINKEDIN" },
} as const;

export const site = {
  title: "Vishnu Nadh — Software Engineer",
  description:
    "Software engineer in Bengaluru building scalable web products, high-performance experiences and AI-powered applications.",
  preloader: { title: "VISHNU NADH", subtitle: "PORTFOLIO '26" },
  watermark: "vishnu nadh",
  totalSections: "06",
} as const;

/** Section ids, the label shown in the nav ticker, and the screen label used for cursor zones. */
export const sections = {
  hero: { id: "top", sec: "01 / INDEX", screen: "01 Hero" },
  intro: { id: "intro", sec: "01 / INTRO", screen: "01a Intro", title: "INTRO", index: "01" },
  overview: { id: "overview", sec: "02 / WHAT I DO", screen: "02 What I do", title: "WHAT I DO", index: "02" },
  impact: { id: "impact", sec: "03 / IMPACT", screen: "03 Impact", title: "IMPACT", index: "03" },
  work: { id: "work", sec: "04 / EXPERIENCE", screen: "04 Experience", title: "EXPERIENCE", index: "04" },
  about: { id: "about", sec: "05 / ABOUT", screen: "05 About", title: "ABOUT", index: "05" },
  contact: { id: "contact", sec: "06 / CONTACT", screen: "06 Contact", title: "CONTACT", index: "06" },
} as const;

/** Rotating cursor-badge copy per screen zone. */
export const cursor = {
  fallback: "AVAILABLE FOR WORK",
  link: "CLICK",
  menu: "MENU",
  emailCopied: "EMAIL COPIED",
  staticSeal: "AVAILABLE FOR WORK · BENGALURU",
  zones: {
    "01 Hero": "SCROLL TO EXPLORE",
    "01a Intro": "KEEP SCROLLING",
    "02 What I do": "WHAT I DO",
    "03 Impact": "BUILT AT SCALE",
    "04 Experience": "SYSTEMS IN PRODUCTION",
    "05 About": "AVAILABLE FOR WORK",
    "06 Contact": "LET'S BUILD SOMETHING",
  } as Record<string, string>,
};

export const nav = {
  links: [
    { label: "WORK", href: "#work", cursor: "GO TO WORK" },
    { label: "WHAT I DO", href: "#overview", cursor: "GO TO WHAT I DO" },
    { label: "ABOUT", href: "#about", cursor: "GO TO ABOUT" },
  ],
  menu: [
    { name: "what i do", href: "#overview" },
    { name: "impact", href: "#impact" },
    { name: "experience", href: "#work" },
    { name: "about", href: "#about" },
    { name: "contact", href: "#contact" },
  ],
  menuTag: { title: "MENU", index: "INDEX" },
  openLabel: "OPEN MENU",
  closeLabel: "CLOSE MENU",
} as const;

export const hero = {
  greeting: "HEY,",
  greetingAccent: "I AM",
} as const;

export const intro = {
  lines: [
    { text: ["I engineer ", { accent: "beyond" }, " the interface,"], muted: false },
    { text: ["into systems that scale"], muted: true },
    { text: ["and evolve."], muted: true },
  ] as { text: (string | { accent: string })[]; muted: boolean }[],
  scroll: { label: "SCROLL", cursor: "KEEP SCROLLING", href: "#overview" },
  summary: site.description,
};

export type Capability = { name: string; title: string; description: string; tools: string[] };

export const capabilities: Capability[] = [
  {
    name: "Architecture",
    title: "Scalable product architecture",
    description:
      "Building scalable React applications, multi-tenant platforms, and reusable component systems that evolve across products. Shared, theme-aware components distributed across multiple repositories keep many products on one foundation.",
    tools: ["React", "TypeScript", "Next.js", "Component Architecture", "Design Systems"],
  },
  {
    name: "Performance",
    title: "Speed and discoverability",
    description:
      "Optimizing rendering, asset delivery, caching, and technical SEO to make websites faster and more discoverable. Semantic HTML, structured data, and crawler-friendly rendering are built into the architecture from the start.",
    tools: ["Web Performance", "Technical SEO", "SSR / SSG / ISR", "Prerender.io", "Caching"],
  },
  {
    name: "Experience",
    title: "Interfaces with intent",
    description:
      "Translating design concepts into responsive interfaces with coherent visual systems, accessible markup, and thoughtful motion. Currently exploring creative development with GSAP, Lenis, and browser-based 3D with Three.js.",
    tools: ["UI/UX", "Figma", "GSAP", "Framer Motion", "Lenis", "Three.js"],
  },
  {
    name: "Intelligence",
    title: "AI in the workflow",
    description:
      "Integrating AI into applications and development workflows through MCP, coding agents, and automated testing. AI works as an engineering multiplier while quality and maintainability stay central.",
    tools: ["OpenAI Apps SDK", "MCP", "Python", "Codex", "Claude Code", "Vitest"],
  },
];

export const overview = {
  skillSetLabel: "SKILL SET",
  /** Knot pose (x, y, z radians) per capability block, in order. */
  orients: [
    [0, 0, 0],
    [1.1, 0.7, 0],
    [-0.6, 1.9, 0.5],
    [1.6, -0.9, 1.1],
  ] as [number, number, number][],
  facts: [
    { label: "Based", value: `${profile.city}, ${profile.country}` },
    { label: "Since", value: profile.since },
  ],
};

export const impact = {
  heading: "at scale",
  lede: "The real work is not just building interfaces. It's building systems that support products, customers, and continuous change.",
  stats: [
    { value: 4, label: "Years of experience", detail: "Building production software since 2022, across AI, product engineering, and SaaS platforms." },
    { value: 300, label: "Customer websites", detail: "A shared, configurable web platform supporting distinct customer experiences." },
    { value: 150, label: "Dashboard APIs", detail: "API integrations supporting customer-facing product workflows." },
  ],
};

export type Job = {
  role: string;
  company: string;
  period: string;
  length: string;
  short: string;
  points: string[];
  stack: string[];
};

export const experience = {
  heading: "in production",
  lede: "Three roles since 2022.",
  expandCursor: "EXPAND ROLE",
  collapseCursor: "COLLAPSE",
  jobs: [
    {
      role: "Senior Development Specialist",
      company: "DevOn",
      period: "Aug 2023 — Present",
      length: "3+ years",
      short: "SaaS products, a multi-tenant website platform, and AI-integrated applications.",
      points: ["300+ customer websites on one shared platform", "Technical SEO and performance infrastructure", "MCP integrations for an OpenAI app in ChatGPT"],
      stack: ["React 19", "TypeScript", "Next.js", "AWS", "Auth0", "MCP"],
    },
    {
      role: "React Developer",
      company: "Wisedrive",
      period: "Jan 2023 — Aug 2023",
      length: "8 months",
      short: "Customer-facing web apps, dashboards, and a car-selling portal.",
      points: ["Lead-conversion module across 30+ APIs", "20% performance improvement on existing modules", "Cashfree payments and warranty integrations"],
      stack: ["React", "JavaScript", "REST APIs", "Data Visualization", "Cashfree"],
    },
    {
      role: "AI Developer",
      company: "Datahub Technologies R&D",
      period: "Jan 2022 — Jan 2023",
      length: "1 year",
      short: "Computer vision and machine-learning applications.",
      points: ["Number plate detection pipeline", "Browser-based face liveness detection", "Steel-defect data analysis"],
      stack: ["Python", "Flask", "Django", "JavaScript", "Computer Vision"],
    },
  ] as Job[],
};

export const about = {
  /** Plain runs and accent runs; rendered word-by-word for the scroll-lit effect. */
  body: [
    "I'm a software engineer who enjoys the space where ",
    { accent: "logic meets visual expression." },
    " I build web products and reusable systems, and explore how thoughtful design, motion, and emerging AI technologies can change the way we build and experience software.",
  ] as (string | { accent: string })[],
  exploringTag: { title: "CURRENTLY", index: "EXPLORING" },
  exploring: [
    "Creative development with GSAP and Lenis",
    "Browser-based 3D with Three.js",
    "Next.js rendering and full-stack capabilities",
    "AI agents and MCP integrations",
  ],
};

export const contact = {
  heading: { first: "say", second: "hello" },
  lede: "Have an interesting problem to solve? I'm open to select projects.",
  directLabel: "OR WRITE DIRECTLY",
  noteTag: { title: "WRITE", index: "A NOTE" },
  form: {
    name: { label: "NAME", placeholder: "Your name" },
    email: { label: "EMAIL", placeholder: "you@company.com" },
    topic: { label: "WHAT IS IT ABOUT", optional: "· OPTIONAL", options: ["Product build", "Website", "AI integration", "Something else"] },
    message: { label: "MESSAGE", placeholder: "A few lines about the project, timeline or idea" },
    send: "SEND NOTE",
    sending: "SENDING",
    privacy: "Your details are only used to reply to you.",
    select: "SELECT",
    deselect: "DESELECT",
  },
  errors: {
    nameMissing: "Please add your name.",
    emailMissing: "Please add your email.",
    emailInvalid: "That email looks incomplete.",
    messageMissing: "Please add a short message.",
    messageShort: "A little more detail helps (10+ characters).",
    sendFailed: "COULD NOT SEND · TRY EMAIL",
  },
  sent: {
    heading: "thank you,",
    body: (email: string) => `Your note is on its way. I'll get back to you at ${email}.`,
    again: "SEND ANOTHER NOTE",
    againCursor: "WRITE AGAIN",
  },
  signal: { complete: "COMPLETE", sending: "SENDING NOTE", sent: "NOTE SENT" },
};

export const footer = {
  links: [
    { label: "LINKEDIN", ...pick(socials.linkedin) },
    { label: "EMAIL", ...pick(socials.email) },
  ],
  backToTop: { before: "BACK TO ", accent: "TOP", after: " ↑", cursor: "BACK TO TOP" },
};

function pick(s: { href: string; cursor: string }) {
  return { href: s.href, cursor: s.cursor };
}
