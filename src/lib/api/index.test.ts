import { afterEach, describe, expect, it, vi } from "vitest";
import { getApiMode, isPerRequestRendering } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("api mode switch", () => {
  it("defaults to real when NEXT_PUBLIC_API_MODE is unset", () => {
    delete process.env.NEXT_PUBLIC_API_MODE;
    expect(getApiMode()).toBe("real");
    expect(isPerRequestRendering()).toBe(true);
  });

  it("uses mock only when explicitly set to 'mock'", () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "mock");
    expect(getApiMode()).toBe("mock");
    expect(isPerRequestRendering()).toBe(false);
  });

  it("keeps real mode for explicit real and invalid values", () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "real");
    expect(getApiMode()).toBe("real");
    expect(isPerRequestRendering()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_API_MODE", "anything-else");
    expect(getApiMode()).toBe("real");
    expect(isPerRequestRendering()).toBe(true);
  });
});
