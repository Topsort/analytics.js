import { describe, expect, test } from "vitest";
import { LocalStorageStore, MemoryStore } from "./store";

describe("LocalStorageStore", () => {
  test("get/set", () => {
    const s = new LocalStorageStore<number>("foo");
    s.set([3, 1, 4]);
    expect(s.get()).toEqual([3, 1, 4]);
  });

  test("stores are independent", () => {
    const s1 = new LocalStorageStore<number>("foo");
    const s2 = new LocalStorageStore<number>("bar");
    s1.set([3, 1, 4]);
    expect(s2.get()).toEqual([]);
  });

  test("data is persistent", () => {
    const s1 = new LocalStorageStore<number>("foo");
    s1.set([3, 1, 4]);
    const s2 = new LocalStorageStore<number>("foo");
    expect(s2.get()).toEqual([3, 1, 4]);
  });
});

describe("MemoryStore", () => {
  test("get/set", () => {
    const s = new MemoryStore<number>();
    s.set([3, 1, 4]);
    expect(s.get()).toEqual([3, 1, 4]);
  });

  test("stores are independent", () => {
    const s1 = new MemoryStore<number>();
    const s2 = new MemoryStore<number>();
    s1.set([3, 1, 4]);
    expect(s2.get()).toEqual([]);
  });
});
