import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiMode, isPerRequestRendering } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("api mode switch", () => {
  it("defaults to mock when NEXT_PUBLIC_API_MODE is unset", () => {
    delete process.env.NEXT_PUBLIC_API_MODE;
    expect(getApiMode()).toBe("mock");
    expect(isPerRequestRendering()).toBe(false);
  });

  it("is real only when explicitly set to 'real'", () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "real");
    expect(getApiMode()).toBe("real");
    expect(isPerRequestRendering()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_API_MODE", "anything-else");
    expect(getApiMode()).toBe("mock");
    expect(isPerRequestRendering()).toBe(false);
  });
});
