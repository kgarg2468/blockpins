import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, TITLE_MAX_LENGTH, validatePinDraft } from "@/lib/pins/validation";

describe("validatePinDraft", () => {
  it("requires a non-empty title", () => {
    const result = validatePinDraft({ title: "   ", note: "ok" });

    expect(result.valid).toBe(false);
    expect(result.errors.title).toMatch(/required/i);
  });

  it("rejects titles longer than TITLE_MAX_LENGTH", () => {
    const result = validatePinDraft({
      title: "x".repeat(TITLE_MAX_LENGTH + 1),
      note: "ok",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.title).toMatch(new RegExp(`${TITLE_MAX_LENGTH}`));
  });

  it("rejects notes longer than NOTE_MAX_LENGTH", () => {
    const result = validatePinDraft({
      title: "Chapman",
      note: "x".repeat(NOTE_MAX_LENGTH + 1),
    });

    expect(result.valid).toBe(false);
    expect(result.errors.note).toMatch(new RegExp(`${NOTE_MAX_LENGTH}`));
  });

  it("accepts required title with optional note", () => {
    const result = validatePinDraft({ title: "Argyros", note: "" });

    expect(result.valid).toBe(true);
    expect(result.errors.title).toBeUndefined();
    expect(result.errors.note).toBeUndefined();
  });
});
