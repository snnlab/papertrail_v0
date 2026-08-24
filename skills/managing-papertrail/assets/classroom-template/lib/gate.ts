export const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

// Unlike web-template (one route set, one credential), this server has two:
// the instructor's browser cookie, and the student's bearer token. This
// decision table only governs the COOKIE gate — it says nothing about bearer
// verification, which api/submissions.ts does itself.
export function gateDecision(
  pathname: string,
  _method: string,
  authed: boolean,
): { action: "allow" | "loginPage" | "unauthorizedJson" } {
  if (pathname === "/api/login" || pathname === "/api/logout") return { action: "allow" };
  // Student bearer-token intake: no instructor cookie is required or even
  // relevant here. api/submissions.ts verifies Authorization itself via
  // lib/roster.ts's resolveToken; an invalid/missing token gets its own
  // 401 { error: "invalid_token" } from that handler, not this gate.
  if (pathname === "/api/submissions") return { action: "allow" };
  // GET/POST /api/comments serves BOTH an instructor's browser session and a
  // student's own bearer token (their own comments only, checked in
  // api/comments.ts against the submission-index — never trusted from the
  // request alone). Like /api/submissions, the cookie gate has nothing
  // useful to say here; api/comments.ts enforces the real authorization
  // (instructor session, or a bearer token scoped to its own shareHash) and
  // returns its own 401/403 when neither holds.
  if (pathname === "/api/comments") return { action: "allow" };
  if (authed) return { action: "allow" };
  if (pathname.startsWith("/api/")) return { action: "unauthorizedJson" };
  return { action: "loginPage" };
}
