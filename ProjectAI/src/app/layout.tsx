import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Space_Grotesk, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import NavLinks from "@/components/shell/NavLinks";
import { parseUserCookie } from "@/components/shell/user-cookie";
import UiIcon from "@/components/UiIcon";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const sans = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "ProjectAI — Farm Aura, Learn AI",
  description:
    "AI literacy quests for Singapore classrooms. Write real prompts, get judged, farm aura.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = parseUserCookie((await cookies()).get("pai_user")?.value);

  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} antialiased`}>
        <header className="sticky top-0 z-40 border-b-[2.5px] border-ink bg-[var(--paper)]/92 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <Link href="/" className="shrink-0">
              <span className="stamp font-display text-lg tracking-tight tilt-l inline-block">
                ProjectAI <UiIcon name="brand-bolt" size={22} className="-mt-1" />
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <NavLinks teacher={user?.role === "teacher"} />
              {user ? (
                <span
                  className="hidden items-center gap-2 rounded-full border-[2.5px] border-ink bg-card px-3 py-1 text-sm font-bold sm:inline-flex"
                  style={{ boxShadow: "2px 2px 0 0 var(--ink)" }}
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full border-2 border-ink text-[10px] font-extrabold"
                    style={{ background: "var(--accent)" }}
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  {user.name}
                  <span className="text-xs font-medium opacity-60">
                    {user.classCode}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs font-medium opacity-55">
          Edu2030 Vibe Hackathon · ProjectAI · built for SG classrooms
        </footer>
      </body>
    </html>
  );
}
