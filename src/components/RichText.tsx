import { Fragment } from "react";
import { SplitText, type } from "@/design-system/primitives";

export type RichPart = string | { accent: string };

/** Renders content runs, wrapping `{ accent }` runs in the accent colour. `split` renders them letter by letter. */
export function RichText({ parts, split }: { parts: RichPart[]; split?: boolean }) {
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Fragment key={i}>{split ? <SplitText>{p}</SplitText> : p}</Fragment>
        ) : (
          <span key={i} className={type.accent}>
            {split ? <SplitText>{p.accent}</SplitText> : p.accent}
          </span>
        ),
      )}
    </>
  );
}
