import { describe, expect, it } from "bun:test";
import { safeMaxTokens } from "./index";

describe("safeMaxTokens", () => {
  it("uses recommended_max_tokens when available", () => {
    // Kimi K2.7: recommended 32768, cap 262144
    expect(safeMaxTokens(32768, 262144)).toBe(32768);
  });

  it("uses recommended_max_tokens for GLM models", () => {
    // GLM 5.2: recommended 131071, cap 131072
    expect(safeMaxTokens(131071, 131072)).toBe(131071);
  });

  it("caps at max_completion_tokens - 1 when recommended exceeds cap", () => {
    expect(safeMaxTokens(200000, 131072)).toBe(131071);
  });

  it("falls back to 32768 when neither recommended nor cap provided", () => {
    expect(safeMaxTokens()).toBe(32768);
  });

  it("falls back to 32768 when recommended is missing but cap exists", () => {
    expect(safeMaxTokens(undefined, 262144)).toBe(32768);
  });

  it("falls back to 32768 when recommended is invalid", () => {
    expect(safeMaxTokens(0, 262144)).toBe(32768);
    expect(safeMaxTokens(-1, 262144)).toBe(32768);
  });

  it("returns at least 1", () => {
    expect(safeMaxTokens(0, 1)).toBeGreaterThanOrEqual(1);
  });

  it("handles missing cap gracefully", () => {
    expect(safeMaxTokens(32768)).toBe(32768);
  });
});
