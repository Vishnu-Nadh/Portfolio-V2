/**

 * Single source of truth for every piece of copy and data rendered on the site.

 * Sections import from here; nothing user-facing is hard-coded in components.

 */

export const profile = {
  firstName: "vishnu",

  lastName: "nadh",

  fullName: "Vishnu Nadh",

  monogram: "VN",

  role: "FRONTEND ENGINEER",

  focus: "FRONTEND · CREATIVE ENGINEERING",

  city: "Bengaluru",

  country: "India",

  countryCode: "IN",

  cityCode: "BLR",

  timeZone: "Asia/Kolkata",

  timeZoneLabel: "IST",

  since: "2022",

  email: "vishnunadh222@gmail.com",

  availability: "OPEN TO SELECT OPPORTUNITIES",
} as const;

export const socials = {
  email: { label: "Email", href: `mailto:${profile.email}`, cursor: "COPY EMAIL" },

  instagram: { label: "Instagram", href: "https://www.instagram.com/__vishnunadh__/", cursor: "OPEN INSTAGRAM" },

  linkedin: { label: "LinkedIn", href: "https://www.linkedin.com/in/vishnunadh/", cursor: "CONNECT ON LINKEDIN" },
} as const;

export const site = {
  title: "Vishnu Nadh — Frontend Engineer & Creative Developer",

  description:
    "Frontend engineer in Bengaluru building scalable SaaS products, SEO-driven websites, design systems, and AI-powered web applications.",

  preloader: { title: "VISHNU NADH", subtitle: "PORTFOLIO '26" },

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
  cursor: "LOOK CLOSER",
} as const;

export const intro = {
  lines: [
    { text: ["I engineer ", { accent: "beyond" }, " the interface,"], muted: false },

    { text: ["into systems that scale"], muted: true },

    { text: ["and evolve."], muted: true },
  ] as { text: (string | { accent: string })[]; muted: boolean }[],

  summary:
    "I build scalable web products at the intersection of frontend engineering, technical SEO, design systems, and AI-powered experiences.",
};

export type Capability = { name: string; title: string; description: string; tools: string[] };

export const capabilities: Capability[] = [
  {
    name: "Architecture",

    title: "Scalable product engineering",

    description:
      "Engineering React applications, multi-tenant SaaS platforms, and reusable component systems that scale across products. Shared, theme-aware components create a consistent foundation across customer dashboards and hundreds of independently configured websites.",

    tools: ["React 19", "TypeScript", "Multi-tenant SaaS", "Component Architecture", "Design Systems", "Auth0"],
  },

  {
    name: "Performance",

    title: "Performance and discoverability",

    description:
      "Improving rendering, bundle size, lazy loading, image delivery, caching, and technical SEO across customer websites. Structured data, Open Graph, sitemaps, robots.txt, llms.txt, and crawler-friendly rendering support search and AI discoverability.",

    tools: [
      "Web Performance",
      "Technical SEO",
      "JSON-LD",
      "Open Graph",
      "Sitemaps",
      "Prerender.io",
      "Caching",
      "Next.js",
    ],
  },

  {
    name: "UI/UX",

    title: "Interfaces with intent",

    description:
      "Turning Figma designs into responsive, maintainable interfaces with consistent design systems, reusable components, and theme-aware UI. Outside core product work, I explore creative development, smooth scrolling, motion, and browser-based 3D.",

    tools: ["Figma-to-Code", "Design Systems", "GSAP", "Framer Motion", "Lenis", "Three.js"],
  },

  {
    name: "Intelligence",

    title: "AI in the workflow",

    description:
      "Building AI-integrated applications and development workflows using the OpenAI Apps SDK, MCP servers, coding agents, and automated tests. I focus on practical integrations, tenant-aware access, and keeping quality and maintainability central.",

    tools: ["OpenAI Apps SDK", "MCP", "Python", "Codex", "Claude Code", "Claude Design", "Vitest", "QA Automation"],
  },
];

export const overview = {
  skillSetLabel: "SKILL SET",

  /** Stage cube pose (x, y, z radians) per capability block, in order. */

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

  stats: [
    {
      value: 4,
      label: "Years of experience",
      detail: "Building production software since 2022 across AI applications, SaaS products, and frontend platforms.",
    },

    {
      value: 300,
      label: "Customer websites",
      detail:
        "A shared React platform with domain-based configuration, customer-specific themes, layouts, and SEO content.",
    },

    {
      value: 150,
      label: "Dashboard APIs",
      detail: "Integrations supporting SaaS dashboards, account management, analytics, and customer workflows.",
    },
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
jobs: [
    {
      role: "Senior Development Specialist",

      company: "DevOn",

      period: "Aug 2023 — Present",

      length: "3+ years",

      short: "Building SaaS dashboards, a 300+ site platform, shared design systems, and AI-integrated applications.",

      points: [
        "Develop and maintain a React 19 SaaS dashboard with Auth0 multi-account access, invitations, charts, maps, and admin workflows",
        "Power 300+ configurable customer websites from one shared codebase, with theme-aware components and technical SEO",
        "Build shared UI packages, manage AWS and CloudFront deployments, and support migration to Next.js",
        "Develop a multi-tenant OpenAI app with ChatGPT UI integration and Python MCP authentication and tenant resolution",
      ],

      stack: ["React 19", "TypeScript", "Next.js", "Highcharts", "Auth0", "AWS", "CloudFront", "GitHub Actions", "MCP"],
    },

    {
      role: "React Developer",

      company: "Wisedrive",

      period: "Jan 2023 — Aug 2023",

      length: "8 months",

      short: "Customer relationship tools, lead-conversion dashboards, and a responsive car-selling portal.",

      points: [
        "Built a lead-conversion module with tables, charts, dashboards, and 30+ API integrations",
        "Improved customer and service management module performance by 20% through code optimization",
        "Developed a responsive car-selling portal and integrated car-warranty APIs and Cashfree payments",
      ],

      stack: ["React", "JavaScript", "REST APIs", "Data Visualization", "Cashfree"],
    },

    {
      role: "AI Developer",

      company: "Datahub Technologies R&D",

      period: "Jan 2022 — Jan 2023",

      length: "1 year",

      short: "Computer-vision interfaces, machine-learning pipelines, and industrial data analysis.",

      points: [
        "Built an end-to-end number-plate detection pipeline and web application, improving model performance by 10%",
        "Developed browser-based face-liveness detection with latency under 30 milliseconds",
        "Analyzed industrial steel-defect data and presented findings through data visualization",
      ],

      stack: ["Python", "Flask", "Django", "JavaScript", "Computer Vision"],
    },
  ] as Job[],
};

export const about = {
  /** Plain runs and accent runs; rendered word-by-word for the scroll-lit effect. */

  body: [
    "I'm a frontend engineer who enjoys the space where ",

    { accent: "logic meets visual expression." },

    " I build scalable web products and reusable systems, bringing together thoughtful UI engineering, performance, search visibility, and practical AI integrations.",
  ] as (string | { accent: string })[],

  exploringTag: { title: "CURRENTLY", index: "EXPLORING" },

  exploring: [
    "Creative motion with GSAP, Lenis, and Framer Motion",

    "Browser-based 3D and interactive experiences with Three.js",

    "Next.js rendering strategies and full-stack API routing",

    "AI agents, MCP integrations, and QA automation",
  ],
};

export const contact = {
  heading: { first: "say", second: "hello" },

  lede: "Have an interesting product, frontend challenge, or AI integration in mind? Let’s talk.",

  directLabel: "OR WRITE DIRECTLY",

  noteTag: { title: "WRITE", index: "A NOTE" },

  form: {
    name: { label: "NAME", placeholder: "Your name" },

    email: { label: "EMAIL", placeholder: "you@company.com" },

    topic: {
      label: "WHAT IS IT ABOUT",
      optional: "· OPTIONAL",
      options: ["Product build", "Website", "AI integration", "Something else"],
    },

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
