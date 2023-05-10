import { describe, it, expect, expectTypeOf } from "vitest";
import { Some, None, Option } from ".";

describe("option", () => {
  describe("Option", () => {
    it("resolve to an option type", () => {
      const some = Some.of(1);
      const none = None.of<number>();
      expectTypeOf(some).toEqualTypeOf<Option<number>>();
      expectTypeOf(none).toEqualTypeOf<Option<number>>();
    });
  });
  describe("Some", () => {
    it("behaves like some", () => {
      const some = Some.of(1);
      const nestedSome = Some.of(some);
      expect(Array.from(some.values())).toEqual([1]);
      expect(some.expect("")).toBe(1);
      expect(some.filter((value): value is 1 => value === 1)).toBe(some);
      expect(some.find((value): value is 1 => value === 1)).toBe(1);
      expect(nestedSome.flat()).toBe(some);
      expect(some.flatMap((value) => Some.of(value + 1))).toEqual(Some.of(2));
      expect(some.includes(1)).toBe(true);
      expect(some.includes(2)).toBe(false);
      expect(some.isNone()).toBe(false);
      expect(some.isSome()).toBe(true);
      expect(some.map((value) => value + 1)).toEqual(Some.of(2));
      expect(some.unwrap()).toBe(1);
      expect(some.unwrapOr(2)).toBe(1);
      expect(some.unwrapOrElse(() => 2)).toBe(1);
    });
  });

  describe("None", () => {
    it("behaves like none", () => {
      const none = None.of<number>();
      const nestedNone = Some.of(none);
      expect(Array.from(none.values())).toEqual([]);
      expect(() => none.expect("")).toThrow("");
      expect(none.filter((value): value is 1 => value === 1)).toBe(none);
      expect(none.find((value): value is 1 => value === 1)).toBe(undefined);
      expect(nestedNone.flat()).toEqual(none);
      expect(none.flatMap((value) => Some.of(value + 1))).toBe(none);
      expect(none.includes(1)).toBe(false);
      expect(none.includes(2)).toBe(false);
      expect(none.isNone()).toBe(true);
      expect(none.isSome()).toBe(false);
      expect(none.map((value) => value + 1)).toBe(none);
      expect(() => none.unwrap()).toThrow("Cannot unwrap None");
      expect(none.unwrapOr(2)).toBe(2);
      expect(none.unwrapOrElse(() => 2)).toBe(2);
    });
  });
});
