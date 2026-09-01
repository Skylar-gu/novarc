import type { CSSProperties, ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

/** A single call-to-action target. */
export interface HeroCta {
  /** Visible button text. */
  label: string;
  /** Destination — an internal path (`/research`, `#waitlist`) or absolute URL. */
  href: string;
}

export interface HeroProps {
  /** Small label above the headline (a section name, a product name). */
  eyebrow?: string;
  /**
   * The page `<h1>`. Pass a plain string for the word-by-word rise, or a node
   * that contains an `<em>`/`<i>`/`<cite>` accent word
   * (e.g. `<>Measure your <em>thinking</em>.</>`). The accent word keeps its
   * serif italic and still animates as its own word.
   */
  headline: string | ReactNode;
  /** Supporting sentence rendered under the headline. */
  sub: string;
  /** Primary call to action, rendered as the solid button. */
  primaryCta: HeroCta;
  /** Optional secondary call to action, rendered as the quieter button. */
  secondaryCta?: HeroCta;
  className?: string;
}

interface WordToken {
  text: string;
  /** Word originated inside an `<em>`/`<i>`/`<cite>`; set in serif italic. */
  emphasis: boolean;
  /**
   * Punctuation that immediately followed the word with no space — e.g. the
   * "," left behind after an `<em>` accent word, or a trailing ".". Rendered
   * upright and outside the `<em>`, but inside the same rising mask so it moves
   * with the word.
   */
  trailing?: string;
}

/**
 * Flatten a headline (string or node tree) into individual words, remembering
 * which words came from inside an emphasis element so the accent styling and
 * the per-word animation can both be applied.
 */
function tokenize(node: ReactNode, emphasis = false): WordToken[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/\s+/)
      .filter((chunk) => chunk.length > 0)
      .map((text) => ({ text, emphasis }));
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => tokenize(child, emphasis));
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    const isAccent =
      element.type === "em" ||
      element.type === "i" ||
      element.type === "cite";
    return tokenize(element.props.children, emphasis || isAccent);
  }
  return [];
}

/**
 * When a headline node tree puts punctuation right after an accent element
 * (`…the <em>person</em>, not just…` or `…your <em>thinking</em>.`), that
 * punctuation arrives as its own whitespace-separated token and would render
 * as a stray glyph pushed off the word by the inter-word `column-gap`.
 *
 * Fold any punctuation-only token (no letters or digits) into the preceding
 * word as `trailing` text, so it shares that word's mask and rise. It is
 * rendered outside the `<em>`, so the accent styling stays on the word itself.
 */
function coalescePunctuation(tokens: WordToken[]): WordToken[] {
  const merged: WordToken[] = [];
  for (const token of tokens) {
    const isPunctuationOnly = !/[\p{L}\p{N}]/u.test(token.text);
    const previous = merged[merged.length - 1];
    if (isPunctuationOnly && previous) {
      merged[merged.length - 1] = {
        ...previous,
        trailing: (previous.trailing ?? "") + token.text,
      };
      continue;
    }
    merged.push(token);
  }
  return merged;
}

/**
 * Word-rise animation, driven entirely by CSS. Each word sits in an
 * `overflow: hidden` mask; the inner span starts translated fully down and
 * animates up, delayed by its `--w` index so the words rise in sequence.
 * Under `prefers-reduced-motion` the animation is removed and the words rest
 * in their final position.
 */
const RISE_STYLES = `
.nv-hero-rise{display:flex;flex-wrap:wrap;column-gap:0.28em;row-gap:0.06em;}
.nv-hero-word{display:inline-block;overflow:hidden;padding-bottom:0.14em;margin-bottom:-0.14em;}
.nv-hero-word > span{
  display:inline-block;
  will-change:transform;
  transform:translateY(115%);
  animation:nv-hero-rise-kf 0.6s cubic-bezier(0.2,0.65,0.3,1) both;
  animation-delay:calc(var(--w, 0) * 50ms);
}
@keyframes nv-hero-rise-kf{to{transform:translateY(0);}}
@media (prefers-reduced-motion: reduce){
  .nv-hero-word > span{animation:none !important;transform:none !important;}
}
`;

/**
 * Landing hero: eyebrow, animated `<h1>`, supporting sentence, and one or two
 * call-to-action buttons. The site's only `<h1>` for a given page lives here.
 */
export function Hero({
  eyebrow,
  headline,
  sub,
  primaryCta,
  secondaryCta,
  className,
}: HeroProps) {
  const words = coalescePunctuation(tokenize(headline));

  return (
    <section className={cn("py-24 sm:py-32", className)}>
      <Container>
        <style dangerouslySetInnerHTML={{ __html: RISE_STYLES }} />
        {eyebrow ? (
          <p className="mb-6 font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-text sm:text-5xl md:text-6xl">
          <span className="nv-hero-rise">
            {words.map((word, index) => (
              <span
                key={`${word.text}-${index}`}
                className="nv-hero-word"
                style={{ "--w": index } as CSSProperties}
              >
                <span>
                  {word.emphasis ? <em>{word.text}</em> : word.text}
                  {word.trailing}
                </span>
              </span>
            ))}
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
          {sub}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <LinkButton href={primaryCta.href}>{primaryCta.label}</LinkButton>
          {secondaryCta ? (
            <LinkButton href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </LinkButton>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
