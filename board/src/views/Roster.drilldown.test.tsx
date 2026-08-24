// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Roster from "./Roster";
import type { RosterData, StudentSubmissions } from "../lib/rosterTypes";
import type { BoardData } from "../lib/types";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

function roster(): RosterData {
  return {
    schemaVersion: 1,
    course: { id: "soc-501" },
    generatedAt: "2026-08-20T09:00",
    students: [
      {
        studentId: "s-amara",
        displayName: "Amara",
        submissionCount: 1,
        lastSubmission: {
          submittedAt: "2026-08-19T14:30",
          idempotencyKey: "k1",
          integrityStatus: "passed",
          score: null,
          reverify: [],
        },
        similarityFlags: [],
      },
    ],
  };
}

function studentBoardData(): BoardData {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-19T14:30",
    mode: "static",
    focus: null,
    project: { name: "Amara's Paper" },
    git: { available: false },
    files: {
      masterPlan: { path: "plans/master-plan.md", content: "# MP" },
      decisionLog: { path: "plans/decision-log.md", content: "# DL" },
      executionPlans: [],
      reviews: [],
    },
  } as BoardData;
}

function submissions(): StudentSubmissions {
  return {
    studentId: "s-amara",
    displayName: "Amara",
    submissions: [
      {
        submittedAt: "2026-08-19T14:30",
        idempotencyKey: "k1",
        reverify: [{ check: "checksum", status: "match", detail: "ok" }],
        score: null,
        integrityStatus: "passed",
        payload: studentBoardData(),
      },
    ],
  };
}

describe("Roster drill-in", () => {
  it("fetches the student's submissions and renders the existing App with the payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        expect(String(input)).toBe("/api/submissions/s-amara");
        return { ok: true, status: 200, json: async () => submissions() };
      }),
    );
    render(<Roster data={roster()} />);
    fireEvent.click(screen.getByText("Amara"));
    await waitFor(() => {
      expect(screen.getByText("Amara's Paper")).toBeTruthy();
    });
    // App's own chrome rendered unmodified (its tab nav is present).
    expect(screen.getByRole("button", { name: "Tracker" })).toBeTruthy();
  });

  it("renders the drilled-in board in hosted mode so the instructor can comment, even though the wire payload says mode: submission", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input) === "/api/submissions/s-amara") {
        return { ok: true, status: 200, json: async () => submissions() };
      }
      // App's own hosted-mode comment fetch, fired only when canAnnotate is
      // true for mode "hosted" — proves the override actually took effect,
      // not just that the roster's own submissions fetch happened.
      return { ok: true, status: 200, json: async () => ({ comments: [] }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Roster data={roster()} />);
    fireEvent.click(screen.getByText("Amara"));
    await waitFor(() => {
      expect(screen.getByText("Amara's Paper")).toBeTruthy();
    });
    await waitFor(() => {
      expect(fetchMock.mock.calls.some((c) => String(c[0]).startsWith("/api/comments"))).toBe(true);
    });
    // canAnnotate-gated "Feedback (N)" button only renders for live/remote/hosted.
    expect(screen.getByRole("button", { name: /Feedback/ })).toBeTruthy();
  });

  it("returns to the roster table via the back affordance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => submissions() })),
    );
    render(<Roster data={roster()} />);
    fireEvent.click(screen.getByText("Amara"));
    await waitFor(() => screen.getByText("Amara's Paper"));
    fireEvent.click(screen.getByRole("button", { name: /Back to roster/ }));
    expect(screen.getByText("How to read these signals")).toBeTruthy();
  });

  it("shows a re-login prompt on a 401 without building its own login form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
    );
    render(<Roster data={roster()} />);
    fireEvent.click(screen.getByText("Amara"));
    await waitFor(() => {
      expect(screen.getByText(/instructor session has expired/i)).toBeTruthy();
    });
    const link = screen.getByText("Log in again") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/login");
  });
});
