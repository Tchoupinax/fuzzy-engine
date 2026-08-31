import { describe, expect, it } from "vitest";

import { isSemverTag } from "./is-semver-tag";

describe("isSemverTag", () => {
  it("accepts valid semver tags", () => {
    expect(isSemverTag("1.0.0")).toBe(true);
    expect(isSemverTag("v2.3.4")).toBe(true);
    expect(isSemverTag("10.20.30-alpha.1")).toBe(true);
    expect(isSemverTag("1.0.0+build.1")).toBe(true);
  });

  it("rejects non-semver tags", () => {
    expect(isSemverTag("latest")).toBe(false);
    expect(isSemverTag("main")).toBe(false);
    expect(isSemverTag("6d32dbbc07d8")).toBe(false);
    expect(isSemverTag("1.0")).toBe(false);
  });
});
