import { describe, expect, it } from "vitest";
import { formatMetricValue } from "./metrics-strip";

describe("official metric formatting", () => {
  it("uses locale grouping while retaining zero as a meaningful value", () => {
    expect(formatMetricValue(0)).toBe("0");
    expect(formatMetricValue(1260)).toBe("1,260");
  });
});
