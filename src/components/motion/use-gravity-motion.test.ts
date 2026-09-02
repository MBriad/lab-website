import { describe, expect, it } from "vitest";
import {
  clamp,
  decayScrollForce,
  normalizeOrientation,
  stepSpring,
} from "./use-gravity-motion";

describe("gravity motion math", () => {
  it("clamps finite and invalid values to a safe range", () => {
    expect(clamp(4, -1, 1)).toBe(1);
    expect(clamp(-4, -1, 1)).toBe(-1);
    expect(clamp(Number.NaN, -1, 1)).toBe(0);
  });

  it("normalizes orientation around its neutral calibration", () => {
    expect(normalizeOrientation(10, 10)).toBe(0);
    expect(normalizeOrientation(45, 10)).toBe(1);
    expect(normalizeOrientation(-30, 10)).toBe(-1);
    expect(normalizeOrientation(20, 10, 20)).toBeCloseTo(0.5);
  });

  it("decays scroll impulse without changing its direction", () => {
    expect(decayScrollForce(1, 0)).toBe(1);
    expect(decayScrollForce(-1, 0.2)).toBeLessThan(0);
    expect(Math.abs(decayScrollForce(1, 0.2))).toBeLessThan(1);
  });

  it("moves spring state toward a target and remains finite", () => {
    const next = stepSpring({ position: 0, velocity: 0 }, 10, 1 / 60);
    expect(next.position).toBeGreaterThan(0);
    expect(next.position).toBeLessThan(10);
    expect(Number.isFinite(next.velocity)).toBe(true);
  });
});
