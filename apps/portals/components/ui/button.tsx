import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={[
        "rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-gray-700",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
