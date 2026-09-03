/**
 * Site-wide configuration: identity strings, navigation, waitlist microcopy,
 * and external links. Single source of truth for the chrome and, later, the
 * page builders. All prose here is original.
 */

export const site = {
  name: "NOVARC",
  /** Footer descriptor line. */
  descriptor: "Engineering intelligence",
  /** Header lockup sub-line and footer location line. */
  location: "Zürich · Founded 2026",
  /**
   * Base URL for metadata (`metadataBase`, canonical + OpenGraph URLs).
   * TODO(WP-7): points at the live novarc.tech origin. Confirm the actual
   * deploy domain before launch and update here if it differs — no domain is
   * being invented in the meantime.
   */
  url: "https://novarc.tech",
  /** One-sentence identity line used in the footer. Reworded, original. */
  identity:
    "An AI company with a single conviction: augmentation over replacement. Tools that leave the people using them more capable, not less.",
  /** Default document title and template. */
  title: "NOVARC — AI that builds human capability",
  titleTemplate: "%s · NOVARC",
  description:
    "NOVARC builds models, agents, and tools designed to leave your reasoning stronger for having used them. The first instrument enters validation in 2026.",
} as const;

/**
 * Structured OpenGraph / Twitter card image. Used by the root layout and every
 * route's metadata so the dimensions and alt text stay attached to the URL.
 * The path resolves against `site.url` via `metadataBase`.
 */
export const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${site.descriptor}`,
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation, in header order. */
export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Product", href: "/product" },
  // The product made real: a working prototype of the reading.
  { label: "Instrument", href: "/instrument" },
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
];

/** Footer "Explore" column. Waitlist is an anchor on the home closing section. */
export const exploreItems: NavItem[] = [
  { label: "Product", href: "/product" },
  { label: "Instrument", href: "/instrument" },
  { label: "About", href: "/about" },
  { label: "Research", href: "/research" },
  { label: "Waitlist", href: "/#waitlist" },
];

/** Waitlist / updates copy. Original wording, austere register. */
export const waitlist = {
  /** Top ribbon message. */
  ribbon: "NOVARC's first instrument is due in 2026.",
  ribbonAction: "Join the waitlist",
  /** Short header CTA. */
  cta: "Get updates",
  /** Long-form CTA used in section footers. */
  ctaLong: "Join the waitlist",
  /** Form field. */
  inputLabel: "Email address",
  inputPlaceholder: "you@example.com",
  /** Result states (consumed by the WP-2 form). */
  pending: "Sending…",
  success: "You are on the list. We will write when there is something to show.",
  error: "That did not go through. Try again in a moment.",
  invalidEmail: "Enter an email address that looks complete.",
} as const;

/** External references. Primary sources for the research page live here too. */
export const externalLinks = {
  linkedin: "https://www.linkedin.com/company/novarc",
  mitStudy:
    "https://www.media.mit.edu/projects/your-brain-on-chatgpt/overview/",
  microsoftStudy:
    "https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/",
} as const;

/** localStorage keys, namespaced so the whole set is easy to find. */
export const storageKeys = {
  theme: "novarc:theme",
  ribbonDismissed: "novarc:ribbon-dismissed",
} as const;
