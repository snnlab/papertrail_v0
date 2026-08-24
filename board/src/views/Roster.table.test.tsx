// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Roster from "./Roster";
import type { RosterData } from "../lib/rosterTypes";

afterEach(cleanup);

function data(): RosterData {
  return {
    schemaVersion: 1,
    course: { id: "soc-501", name: "Quant Methods" },
    generatedAt: "2026-08-20T09:00",
    students: [
      {
        studentId: "s-amara",
        displayName: "Amara",
        submissionCount: 2,
        lastSubmission: {
          submittedAt: "2026-08-19T14:30",
          idempotencyKey: "k1",
          integrityStatus: "passed",
          score: {
            schemaVersion: 1,
            channels: [
              { id: "fidelity", name: "Fidelity", score: 3, basis: "all followed" },
              { id: "attainment", name: "Attainment", score: 3, basis: "met" },
              { id: "integrity", name: "Integrity", score: 3, basis: "all pass" },
            ],
            profile: "F3·A3·I3",
            total: 9,
            max: 9,
          },
          reverify: [
            { check: "checksum", status: "match", detail: "all bytes matched" },
          ],
        },
        similarityFlags: [],
      },
      {
        studentId: "s-brody",
        displayName: "Brody",
        submissionCount: 1,
        lastSubmission: {
          submittedAt: "2026-08-18T09:00",
          idempotencyKey: "k2",
          integrityStatus: "failed",
          score: null,
          reverify: [
            { check: "checksum", status: "mismatch", detail: "artifact bytes differ" },
            { check: "sign-off timing", status: "flag", detail: "signed before earliest commit" },
          ],
        },
        similarityFlags: [
          { withStudentId: "s-amara", jaccard: 0.82, artifact: "decision-log" },
        ],
      },
      {
        studentId: "s-cora",
        displayName: "Cora",
        submissionCount: 0,
        lastSubmission: null,
        similarityFlags: [],
      },
    ],
  };
}

describe("Roster table", () => {
  it("lists every registered student", () => {
    render(<Roster data={data()} />);
    expect(screen.getByText("Amara")).toBeTruthy();
    expect(screen.getByText("Brody")).toBeTruthy();
    expect(screen.getByText("Cora")).toBeTruthy();
  });

  it("shows never-submitted rows distinctly and does not make them clickable", () => {
    render(<Roster data={data()} />);
    expect(screen.getByText("never submitted")).toBeTruthy();
    const row = screen.getByText("Cora").closest("tr")!;
    expect(row.getAttribute("title")).toBe("No submissions yet");
  });

  it("renders each row's integrity status with the shared vocabulary", () => {
    render(<Roster data={data()} />);
    expect(screen.getByText("passed")).toBeTruthy();
    expect(screen.getByText("failed")).toBeTruthy();
  });

  it("renders the F·A·I score via the shared OutputScorePanel chip", () => {
    render(<Roster data={data()} />);
    expect(screen.getByText("F3")).toBeTruthy();
    expect(screen.getByText("A3")).toBeTruthy();
    expect(screen.getByText("I3")).toBeTruthy();
    expect(screen.getByText("9/9")).toBeTruthy();
  });

  it("shows a similarity flag count and expands to the paired student on click", () => {
    render(<Roster data={data()} />);
    const flagSummary = screen.getByText("1 flag");
    fireEvent.click(flagSummary);
    expect(screen.getByText(/s-amara/)).toBeTruthy();
    expect(screen.getByText(/jaccard 0.82/)).toBeTruthy();
  });

  it("sorts by student name and reverses on a second click", () => {
    render(<Roster data={data()} />);
    const header = screen.getByRole("button", { name: /Student/ });
    const namesInOrder = () =>
      Array.from(document.querySelectorAll("tbody tr td:first-child"))
        .map((td) => td.textContent?.split("(")[0].trim());
    expect(namesInOrder()).toEqual(["Amara", "Brody", "Cora"]);
    fireEvent.click(header);
    expect(namesInOrder()).toEqual(["Cora", "Brody", "Amara"]);
  });

  it("shows an empty-roster message when no students are registered", () => {
    render(<Roster data={{ ...data(), students: [] }} />);
    expect(screen.getByText(/No students registered yet/)).toBeTruthy();
  });

  it("shows the trust tier legend above the table", () => {
    render(<Roster data={data()} />);
    expect(screen.getByText("How to read these signals")).toBeTruthy();
  });
});
