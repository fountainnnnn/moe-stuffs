"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/quests", label: "Quests" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function NavLinks({ teacher }: { teacher?: boolean }) {
  const pathname = usePathname();
  const links = teacher ? [...LINKS, { href: "/teacher", label: "Class" }] : LINKS;
  return (
    <nav className="flex items-center gap-1.5">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border-2 border-ink px-3 py-1 text-sm font-bold transition-transform duration-75 hover:-translate-y-[2px] active:translate-y-[1px]"
            style={{
              background: active ? "var(--ink)" : "var(--card)",
              color: active ? "var(--paper)" : "var(--ink)",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
