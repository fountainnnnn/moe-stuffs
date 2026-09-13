import type { User } from "@/lib/types";

export type SessionUser = Pick<User, "id" | "name" | "classCode" | "role">;

/**
 * The "pai_user" cookie is written by /api/join. It is tolerated in a few shapes
 * (JSON object, URI-encoded JSON, or a bare name string) so the shell never
 * crashes if the backend tweaks its payload.
 */
export function parseUserCookie(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  let text = raw.trim();
  if (!text) return null;
  if (text.startsWith("%")) {
    try {
      text = decodeURIComponent(text);
    } catch {
      /* keep raw */
    }
  }
  if (text.startsWith("{")) {
    try {
      const o = JSON.parse(text) as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      if (!name) return null;
      const classCode =
        typeof o.classCode === "string"
          ? o.classCode
          : typeof o.class_code === "string"
            ? o.class_code
            : "3E4";
      const role = o.role === "teacher" ? "teacher" : "student";
      const id = typeof o.id === "number" ? o.id : Number(o.id) || 0;
      return { id, name, classCode, role };
    } catch {
      return null;
    }
  }
  // Bare name fallback.
  return { id: 0, name: text, classCode: "3E4", role: "student" };
}

/** Client-side read of the same cookie. */
export function readUserCookieClient(): SessionUser | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("pai_user="));
  return parseUserCookie(hit?.slice("pai_user=".length));
}
