import type { HTMLAttributes } from "react";

export function Logo({ className = "" }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={["bg-gradient-to-r from-[#FFB000] via-[#FF2D95] to-[#5B8CFF] bg-clip-text font-bold text-transparent", className].join(" ")}
    >
      BR
    </span>
  );
}
