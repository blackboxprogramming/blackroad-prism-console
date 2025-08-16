import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={["rounded bg-gray-800 text-gray-100", className].join(" ")}
      {...props}
    />
  );
}
