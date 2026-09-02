import { describe, expect, it } from "vitest";
import { AWARD_CATEGORIES, AWARD_LEVELS } from "@/lib/types/api";
import { AWARD_CATEGORY_LABELS, AWARD_LEVEL_LABELS } from "./badges";

/** Every contract enum value must have a human (Chinese) display label. */
describe("award label maps are complete", () => {
  it("every AwardLevel has a non-empty label", () => {
    for (const level of AWARD_LEVELS) {
      expect(AWARD_LEVEL_LABELS[level], `label for level "${level}"`).toBeTruthy();
    }
    expect(Object.keys(AWARD_LEVEL_LABELS).sort()).toEqual(
      [...AWARD_LEVELS].sort(),
    );
  });

  it("every AwardCategory has a non-empty label", () => {
    for (const category of AWARD_CATEGORIES) {
      expect(
        AWARD_CATEGORY_LABELS[category],
        `label for category "${category}"`,
      ).toBeTruthy();
    }
    expect(Object.keys(AWARD_CATEGORY_LABELS).sort()).toEqual(
      [...AWARD_CATEGORIES].sort(),
    );
  });
});
