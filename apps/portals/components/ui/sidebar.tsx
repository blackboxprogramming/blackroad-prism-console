import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/cocode", label: "Workspace" },
];

export function Sidebar() {
  return (
    <nav className="hidden w-48 bg-gray-800 p-4 sm:block">
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded px-2 py-1 text-sm text-gray-200 hover:bg-gray-700"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
