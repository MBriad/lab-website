import { describe, expect, it } from "vitest";
import { splitParagraphs } from "./text";

describe("splitParagraphs", () => {
  it("splits on blank lines and trims each block", () => {
    expect(splitParagraphs("a\n\nb\n\n\nc")).toEqual(["a", "b", "c"]);
  });
  it("drops empty blocks and handles single paragraph", () => {
    expect(splitParagraphs("only one")).toEqual(["only one"]);
    expect(splitParagraphs("")).toEqual([]);
    expect(splitParagraphs("x\n\n\n\n   \n\ny")).toEqual(["x", "y"]);
  });
});
