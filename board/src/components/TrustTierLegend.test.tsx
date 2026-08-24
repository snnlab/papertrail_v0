// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TrustTierLegend from "./TrustTierLegend";

afterEach(cleanup);

describe("TrustTierLegend", () => {
  it("shows all three tiers, open by default", () => {
    render(<TrustTierLegend />);
    expect(screen.getByText("Mechanically re-verified")).toBeTruthy();
    expect(screen.getByText("Descriptive, not proof")).toBeTruthy();
    expect(screen.getByText("Self-attested, unverifiable")).toBeTruthy();
  });

  it("collapses and re-expands on toggle", () => {
    render(<TrustTierLegend />);
    const toggle = screen.getByRole("button", { name: /How to read these signals/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("Mechanically re-verified")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText("Mechanically re-verified")).toBeTruthy();
  });

  it("keeps neutral, non-accusatory language — no cheating/fraud wording", () => {
    render(<TrustTierLegend />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/\bcheat/i);
    expect(text).not.toMatch(/\bfraud/i);
  });
});
