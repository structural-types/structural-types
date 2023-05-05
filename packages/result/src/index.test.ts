import { describe, it, expect, expectTypeOf } from "vitest";
import { Ok, Err, Result } from ".";

describe("result", () => {
  describe("Result", () => {
    it("resolve to a Result type", () => {
      const ok = Ok.of<number, string>(1);
      const err = Err.of<number, string>("example");
      expectTypeOf(ok).toEqualTypeOf<Result<number, string>>();
      expectTypeOf(err).toEqualTypeOf<Result<number, string>>();
      expectTypeOf(ok.map((value) => BigInt(value))).toEqualTypeOf<
        Result<bigint, string>
      >();
      expectTypeOf(ok.flatMap((value) => Ok.of(value + 1))).toEqualTypeOf<
        Result<number, string>
      >();
      expectTypeOf(ok.flatMapErr((e) => Err.of(`${e} 1`))).toEqualTypeOf<
        Result<number, string>
      >();
      expectTypeOf(ok.mapErr((e) => new Error(e))).toEqualTypeOf<
        Result<number, Error>
      >();
    });
  });
  describe("Ok", () => {
    it("behaves like Ok", () => {
      const ok = Ok.of<number, string>(1);
      const nestedOk = Ok.of<Result<number, string>, string>(ok);
      const nestedErr = Err.of<number, Result<number, string>>(ok);
      expect(Array.from(ok.values())).toEqual([1]);
      expect(ok.expect("")).toBe(1);
      expect(() => ok.expectErr("error")).toThrowError("error");
      expect(ok.find((value): value is 1 => value === 1)).toBe(1);
      expect(nestedOk.flat()).toBe(ok);
      expect(nestedErr.flatErr()).toBe(ok);
      expect(ok.flatMap((value) => Ok.of(value + 1))).toEqual(Ok.of(2));
      expect(ok.includes(1)).toBe(true);
      expect(ok.includes(2)).toBe(false);
      expect(ok.isErr()).toBe(false);
      expect(ok.isOk()).toBe(true);
      expect(ok.map((value) => value + 1)).toEqual(Ok.of(2));
      expect(ok.unwrap()).toBe(1);
      expect(ok.unwrapOr(2)).toBe(1);
      expect(ok.unwrapOrElse(() => 2)).toBe(1);
    });
  });

  describe("Err", () => {
    it("behaves like Err", () => {
      const err = Err.of<number, string>("example");
      const nestedErr = Err.of<number, Result<number, string>>(err);
      const nestedOk = Ok.of<Result<number, string>, string>(err);
      expect(Array.from(err.values())).toEqual([]);
      expect(() => err.expect("error")).toThrow("error");
      expect(err.expectErr("")).toBe("example");
      expect(err.find((value): value is 1 => value === 1)).toBe(undefined);
      expect(nestedOk.flat()).toBe(err);
      expect(nestedErr.flatErr()).toBe(err);
      expect(err.flatMap((value) => Ok.of(value + 1))).toBe(err);
      expect(err.flatMapErr((e) => Err.of(`${e} 1`))).toEqual(
        Err.of("example 1")
      );
      expect(err.includes(1)).toBe(false);
      expect(err.includes(2)).toBe(false);
      expect(err.isErr()).toBe(true);
      expect(err.isOk()).toBe(false);
      expect(err.map((value) => value + 1)).toBe(err);
      expect(() => err.unwrap()).toThrow("Cannot unwrap Err");
      expect(err.unwrapOr(2)).toBe(2);
      expect(err.unwrapOrElse(() => 2)).toBe(2);
    });
  });
});
