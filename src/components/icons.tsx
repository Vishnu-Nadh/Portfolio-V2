const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "square" as const,
};

export function MailIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg {...base}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon() {
  return (
    <svg {...base}>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M8 10.5v6M8 7.5v.01M12 16.5v-6M12 13c0-1.5 1-2.5 2.3-2.5S16.5 11.5 16.5 13v3.5" />
    </svg>
  );
}
