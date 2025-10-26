import { PropsWithChildren } from "react";
import clsx from "clsx";

const KIND_STYLES: Record<string, string> = {
  info: "border-sky-500/60 bg-sky-500/10 text-sky-100",
  warning: "border-amber-500/60 bg-amber-500/10 text-amber-100",
  danger: "border-rose-500/60 bg-rose-500/10 text-rose-100"
};

export function Callout({
  kind = "info",
  title,
  children
}: PropsWithChildren<{ kind?: "info" | "warning" | "danger"; title?: string }>) {
  return (
    <div
      className={clsx(
        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
        KIND_STYLES[kind] ?? KIND_STYLES.info
      )}
      role="note"
    >
      {title ? <strong className="block text-base font-semibold">{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}

export default Callout;
