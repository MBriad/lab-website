import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDate,
  formatDateCN,
  isoYear,
  parsePageParam,
} from "./format";

describe("formatDate", () => {
  it("renders ISO date/datetime as YYYY.MM.DD (UTC)", () => {
    expect(formatDate("2026-05-18")).toBe("2026.05.18");
    expect(formatDate("2026-05-18T02:00:00Z")).toBe("2026.05.18");
  });
  it("passes through unparseable input", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateCN", () => {
  it("renders Chinese date", () => {
    expect(formatDateCN("2026-05-18T02:00:00Z")).toBe("2026 年 5 月 18 日");
  });
});

describe("isoYear", () => {
  it("extracts UTC year", () => {
    expect(isoYear("2024-09-01T08:00:00Z")).toBe(2024);
    expect(isoYear("2026-05-18")).toBe(2026);
  });
  it("returns null for bad input", () => {
    expect(isoYear("garbage")).toBeNull();
  });
});

describe("parsePageParam", () => {
  it("returns 1 for absent/invalid values", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("2.5")).toBe(1);
  });
  it("parses valid integers and arrays", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(["5", "9"])).toBe(5);
  });
});

describe("formatBytes", () => {
  it("formats B/KB/MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("rejects invalid sizes", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});
