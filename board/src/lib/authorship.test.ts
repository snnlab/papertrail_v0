import { describe, it, expect } from "vitest";
import { computeAuthorshipPattern, describeAuthorshipPattern } from "./authorship";

describe("computeAuthorshipPattern", () => {
  it("returns null with no decision log entries", () => {
    expect(computeAuthorshipPattern([], [])).toBeNull();
  });

  it("counts distinct days and spans first/last entry", () => {
    const entries = [
      { timestamp: "2026-07-01 09:00" },
      { timestamp: "2026-07-01 14:00" },
      { timestamp: "2026-07-04 10:00" },
    ];
    const p = computeAuthorshipPattern(entries, []);
    expect(p).not.toBeNull();
    expect(p!.entryCount).toBe(3);
    expect(p!.distinctDays).toBe(2);
    expect(p!.firstEntryAt).toBe("2026-07-01 09:00");
    expect(p!.lastEntryAt).toBe("2026-07-04 10:00");
    expect(p!.signOffDate).toBeNull();
    expect(p!.daysFirstEntryToSignOff).toBeNull();
  });

  it("extracts the most recent sign-off date and the gap from the first entry", () => {
    const entries = [{ timestamp: "2026-07-01 09:00" }, { timestamp: "2026-07-04 10:00" }];
    const p = computeAuthorshipPattern(entries, ["BK, 2026-07-05", "BK, 2026-07-18"]);
    expect(p!.signOffDate).toBe("2026-07-18");
    expect(p!.daysFirstEntryToSignOff).toBe(17);
  });

  it("ignores lines with no parsable date", () => {
    const entries = [{ timestamp: "2026-07-01 09:00" }];
    const p = computeAuthorshipPattern(entries, [null, "<researcher name>, <YYYY-MM-DD>", undefined]);
    expect(p!.signOffDate).toBeNull();
  });

  it("flags a same-day crunch as zero days", () => {
    const entries = [{ timestamp: "2026-07-18 20:00" }, { timestamp: "2026-07-18 20:40" }];
    const p = computeAuthorshipPattern(entries, ["BK, 2026-07-18"]);
    expect(p!.distinctDays).toBe(1);
    expect(p!.daysFirstEntryToSignOff).toBe(0);
  });
});

describe("describeAuthorshipPattern", () => {
  it("describes a spread-out log with a later sign-off", () => {
    const text = describeAuthorshipPattern({
      entryCount: 14,
      distinctDays: 6,
      firstEntryAt: "2026-07-01 09:00",
      lastEntryAt: "2026-07-12 10:00",
      signOffDate: "2026-07-13",
      daysFirstEntryToSignOff: 12,
    });
    expect(text).toBe("14 entries across 6 days · signed 12 days after the first entry");
  });

  it("describes a same-day crunch", () => {
    const text = describeAuthorshipPattern({
      entryCount: 14,
      distinctDays: 1,
      firstEntryAt: "2026-07-18 20:00",
      lastEntryAt: "2026-07-18 20:40",
      signOffDate: "2026-07-18",
      daysFirstEntryToSignOff: 0,
    });
    expect(text).toBe("14 entries across 1 day · signed the same day as the first entry");
  });

  it("omits the sign-off clause when no signed plan exists", () => {
    const text = describeAuthorshipPattern({
      entryCount: 3,
      distinctDays: 2,
      firstEntryAt: "2026-07-01 09:00",
      lastEntryAt: "2026-07-04 10:00",
      signOffDate: null,
      daysFirstEntryToSignOff: null,
    });
    expect(text).toBe("3 entries across 2 days");
  });
});
