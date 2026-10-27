import type { AnchorHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode, Ref, SVGProps } from "react";
import { cx } from "@/lib/cx";
import p from "./primitives.module.css";
import type from "./typography.module.css";

export { p as primitives, type };

/* ------------------------------------------------------------------ */
/* SectionTag — "TITLE / accent index" stacked micro label             */
/* ------------------------------------------------------------------ */
type SectionTagProps = { title: string; index: string } & HTMLAttributes<HTMLDivElement>;

export function SectionTag({ title, index, className, ...rest }: SectionTagProps) {
  return (
    <div className={cx(type.label, className)} {...rest}>
      {title}
      <br />
      <span className={type.accent}>{index}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mask — overflow clip that lets a child rise in (data-rise).        */
/* Give it the heading's font-size via className; the child inherits.  */
/* ------------------------------------------------------------------ */
type MaskProps = {
  /** "line" for running text, "display" for headings. */
  pad?: "line" | "display";
  as?: "div" | "span";
  className?: string;
  children: ReactNode;
};

export function Mask({ pad = "display", as: Tag = "div", className, children }: MaskProps) {
  return (
    <Tag data-pad={pad} className={cx(p.mask, Tag === "span" && p.maskBlock, className)}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Rule — hairline that draws in on reveal (data-line)                 */
/* ------------------------------------------------------------------ */
type RuleProps = { absolute?: boolean; color?: string; delay?: number; className?: string };

export function Rule({ absolute = true, color, delay, className }: RuleProps) {
  return (
    <div
      data-line=""
      data-d={delay}
      className={cx(p.rule, absolute && p.ruleAbsolute, className)}
      style={color ? { background: color } : undefined}
    />
  );
}

/* ------------------------------------------------------------------ */
/* UnderlineLink — copper underline wipe                               */
/* ------------------------------------------------------------------ */
type UnderlineLinkProps = { cursor?: string } & AnchorHTMLAttributes<HTMLAnchorElement>;

export function UnderlineLink({ cursor, className, children, ...rest }: UnderlineLinkProps) {
  return (
    <a data-cursor={cursor} className={cx(p.underline, className)} {...rest}>
      {children}
    </a>
  );
}

export const underlineClass = p.underline;

/* ------------------------------------------------------------------ */
/* Monogram — the VN square                                            */
/* ------------------------------------------------------------------ */
type MonogramProps = {
  label: string;
  size: number;
  fontSize: number;
  filled?: boolean;
  href?: string;
  cursor?: string;
  className?: string;
  style?: CSSProperties;
} & HTMLAttributes<HTMLElement>;

export function Monogram({ label, size, fontSize, filled, href, cursor, className, style, ...rest }: MonogramProps) {
  const cls = cx(p.monogram, filled && p.monogramFilled, className);
  const s = { width: size, height: size, fontSize, ...style };
  if (href)
    return (
      <a href={href} data-cursor={cursor} className={cls} style={s} {...rest}>
        {label}
      </a>
    );
  return (
    <div data-cursor={cursor} className={cls} style={s} {...rest}>
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seal — circular rotating text badge                                 */
/* ------------------------------------------------------------------ */
type SealProps = {
  id: string;
  label: string;
  fontSize: number;
  duration: number;
  spin?: boolean;
  textRef?: Ref<SVGTextElement>;
  textProps?: SVGProps<SVGTextElement>;
};

export function sealText(label: string) {
  let s = "";
  const unit = label + " · ";
  while (s.length < 30) s += unit;
  return s;
}

export function Seal({ id, label, fontSize, duration, spin = true, textRef, textProps }: SealProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      className={cx(p.seal, spin && p.sealSpin)}
      style={{ "--seal-dur": `${duration}s` } as CSSProperties}
    >
      <defs>
        <path id={id} d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
      </defs>
      <text ref={textRef} {...textProps} fill="var(--c-text-strong)" className={p.sealText} style={{ fontSize }}>
        <textPath href={"#" + id} textLength={470} lengthAdjust="spacing">
          {sealText(label)}
        </textPath>
      </text>
    </svg>
  );
}
