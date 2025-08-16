import { Logo } from "./logo";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
      <Logo className="h-6 w-6" />
      <span className="text-sm">{title}</span>
    </header>
  );
}
