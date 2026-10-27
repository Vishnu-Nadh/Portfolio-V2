import { Fragment } from "react";
import { type } from "@/design-system/primitives";

export type RichPart = string | { accent: string };

/** Renders content runs, wrapping `{ accent }` runs in the accent colour. */
export function RichText({ parts }: { parts: RichPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Fragment key={i}>{p}</Fragment>
        ) : (
          <span key={i} className={type.accent}>
            {p.accent}
          </span>
        ),
      )}
    </>
  );
}
