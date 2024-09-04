import { describe, expect, test } from "vitest";
import { truncateSet } from "./set";

describe("truncateSet", () => {
  test("original set below maxSize", () => {
    const s = new Set([1, 2, 3]);
    expect(truncateSet(s, 4)).toBe(s);
  });

  test("resulting set keeps last inserted items", () => {
    const s = new Set([1, 2, 3]);
    s.add(4);
    expect(truncateSet(s, 3)).toEqual(new Set([2, 3, 4]));
    expect(truncateSet(s, 2)).toEqual(new Set([3, 4]));
    expect(truncateSet(s, 1)).toEqual(new Set([4]));
  });
});
