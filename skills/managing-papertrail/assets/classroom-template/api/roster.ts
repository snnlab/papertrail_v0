// GET /api/roster  — full roster summary, instructor-only.
// POST /api/roster — register a new student / mint (or rotate) a token,
//                     instructor-only. See lib/roster.ts's upsertStudent for
//                     why registration and rotation share this one route.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthed, type HeaderBag } from "../lib/auth.js";
import { SECURITY_HEADERS } from "../lib/gate.js";
import { listRoster, upsertStudent, STUDENT_ID_RE, type RosterEntry } from "../lib/roster.js";
import { getLatestPointer, getSubmission, listSubmissionsForStudent } from "../lib/submissions.js";
import { readSimilarityCache, type SimilarityResult } from "../lib/similarity.js";
import { findFreshestManifest, isRecord } from "../lib/reverify.js";

export interface RunResult { status: number; json: unknown }

async function buildRosterRow(
  blobToken: string,
  entry: RosterEntry,
  similarity: SimilarityResult | null,
): Promise<Record<string, unknown>> {
  const pointer = await getLatestPointer(blobToken, entry.studentId);
  let lastSubmission: Record<string, unknown> | null = null;

  if (pointer) {
    const sub = await getSubmission(blobToken, entry.studentId, pointer.idempotencyKey);
    if (sub) {
      // The freshest results-bundle manifest across this submission's whole
      // payload — a submission can carry several components, each with
      // several results versions; the roster row surfaces the single most
      // recently captured one as its headline score/integrity signal.
      // Documented judgment call: this is a summary field for the roster
      // table, not a claim about which component matters most. The full
      // per-component picture is one click away via
      // GET /api/submissions/:studentId's `payload`, rendered by the
      // existing single-project board unmodified.
      const manifest = findFreshestManifest(sub.payload);
      const score = manifest && isRecord(manifest.score) ? manifest.score : null;
      const integrityStatus = manifest && isRecord(manifest.integrity) && typeof manifest.integrity.status === "string"
        ? (manifest.integrity.status as "passed" | "failed")
        : "unknown";
      lastSubmission = {
        submittedAt: sub.submittedAt,
        idempotencyKey: sub.idempotencyKey,
        score,
        integrityStatus,
        reverify: sub.reverify,
      };
    }
  }

  // A full list()+get() sweep per student on every roster GET. Accepted as
  // an O(students * submissions) cost at classroom scale (tens of students,
  // single-digit submissions each) in exchange for an honest count, rather
  // than approximating it from the "has a latest pointer" signal alone.
  const submissionCount = (await listSubmissionsForStudent(blobToken, entry.studentId)).length;

  const similarityFlags = (similarity?.flags ?? [])
    .filter((f) => f.studentA === entry.studentId || f.studentB === entry.studentId)
    .map((f) => ({
      withStudentId: f.studentA === entry.studentId ? f.studentB : f.studentA,
      jaccard: f.jaccard,
      artifact: f.artifact,
    }));

  return {
    studentId: entry.studentId,
    displayName: entry.displayName,
    lastSubmission,
    submissionCount,
    similarityFlags,
  };
}

export async function run(
  method: string,
  headers: HeaderBag,
  body: unknown,
  env: Record<string, string | undefined>,
  now: number,
): Promise<RunResult> {
  if (!isAuthed({ BOARD_SESSION_SECRET: env.BOARD_SESSION_SECRET }, headers, now)) {
    return { status: 401, json: { error: "unauthorized" } };
  }
  const blobToken = env.BLOB_READ_WRITE_TOKEN as string;

  if (method === "GET") {
    const roster = await listRoster(blobToken);
    const cache = await readSimilarityCache(blobToken);
    const students = await Promise.all(roster.map((entry) => buildRosterRow(blobToken, entry, cache)));
    students.sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));
    return {
      status: 200,
      json: {
        schemaVersion: 1,
        course: { id: env.COURSE_ID ?? "course" },
        generatedAt: new Date().toISOString(),
        students,
      },
    };
  }

  if (method === "POST") {
    const b = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    const studentId = b.studentId;
    const displayName = b.displayName;
    if (typeof studentId !== "string" || !STUDENT_ID_RE.test(studentId)) {
      return { status: 400, json: { error: "invalid studentId" } };
    }
    if (typeof displayName !== "string" || displayName.trim().length === 0 || displayName.length > 200) {
      return { status: 400, json: { error: "invalid displayName" } };
    }
    const pepper = env.ROSTER_TOKEN_PEPPER ?? "";
    const { token } = await upsertStudent(blobToken, pepper, studentId, displayName);
    return { status: 200, json: { studentId, displayName, token } };
  }

  return { status: 405, json: { error: "method not allowed" } };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const r = await run(
    req.method ?? "GET",
    req.headers as HeaderBag,
    req.body,
    process.env,
    Math.floor(Date.now() / 1000),
  );
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  res.status(r.status).json(r.json);
}
