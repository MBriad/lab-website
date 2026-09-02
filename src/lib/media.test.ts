import { describe, expect, it } from "vitest";
import { mediaUrlForNextImage } from "@/lib/media";

describe("mediaUrlForNextImage", () => {
  it("uses the frontend proxy for CMS media URLs", () => {
    const cmsMediaPath = ["", "api", "v1", "media", "ab", "cd.jpg"].join(
      "/",
    );
    expect(
      mediaUrlForNextImage(
        new URL(`${cmsMediaPath}?download=1`, "https://cms.example.test").toString(),
      ),
    ).toBe(`${cmsMediaPath}?download=1`);
  });

  it("preserves external and relative media URLs", () => {
    expect(mediaUrlForNextImage("https://cdn.example.test/robot.jpg")).toBe(
      "https://cdn.example.test/robot.jpg",
    );
    expect(mediaUrlForNextImage("/images/robot.jpg")).toBe("/images/robot.jpg");
  });
});
