import { describe, it, expect, expectTypeOf } from "vitest";

import {
  StringSchema,
  ArraySchema,
  BooleanSchema,
  Schema,
  IntersectionSchema,
  LazySchema,
  LiteralSchema,
  NullSchema,
  NumberSchema,
  ObjectSchema,
  PromiseSchema,
  RecordSchema,
  RefinementSchema,
  TransformSchema,
  ArrayTupleSchema,
  UndefinedSchema,
  UnionSchema,
  MapSchema,
  SetSchema,
  TypeofSchema,
  InstanceofSchema,
  OptionalSchema,
  NullableSchema,
  StringTestSchema,
  SchemaError,
} from ".";
import { Result } from "@structural-types/result";

describe("StringSchema", () => {
  const subject = new StringSchema();

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be string but got 1"'
    );
  });
});

describe("StringTestSchema", () => {
  const subject = new StringTestSchema(/^foo$/);

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be string but got 1"'
    );
    expect(() => subject.parse("bar")).toThrowErrorMatchingInlineSnapshot(
      '"must match the pattern /^foo$/ but got bar"'
    );
  });
});

describe("NumberSchema", () => {
  const subject = new NumberSchema();

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<number>>();
  });

  it("should parse", () => {
    expect(subject.parse(1)).toBe(1);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be number but got foo"'
    );
  });
});

describe("BooleanSchema", () => {
  const subject = new BooleanSchema();

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<boolean>>();
  });

  it("should parse", () => {
    expect(subject.parse(true)).toBe(true);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be boolean but got foo"'
    );
  });
});

describe("ArraySchema", () => {
  const subject = new ArraySchema(new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string[]>>();
  });

  it("should parse", () => {
    const actual = ["foo"];

    expect(subject.parse(actual)).toBe(actual);
    expect(() => subject.parse([1])).toThrowErrorMatchingInlineSnapshot(
      '"0 must be string but got 1"'
    );
  });
});

describe("ObjectSchema", () => {
  const subject = new ObjectSchema({ foo: new StringSchema() });

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<{ foo: string }>>();
  });

  it("should parse", () => {
    const actual = { foo: "foo" };

    expect(subject.parse(actual)).toBe(actual);
    expect(() => subject.parse({ foo: 1 })).toThrowErrorMatchingInlineSnapshot(
      '"foo must be string but got 1"'
    );
  });
});

describe("RecordSchema", () => {
  const subject = new RecordSchema(new StringSchema(), new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<Record<string, string>>>();
  });

  it("should parse", () => {
    const actual = { foo: "foo" };

    expect(subject.parse(actual)).toBe(actual);
    expect(() => subject.parse({ foo: 1 })).toThrowErrorMatchingInlineSnapshot(
      '"foo must be string but got 1"'
    );
  });
});

describe("MapSchema", () => {
  const subject = new MapSchema(new StringSchema(), new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<Map<string, string>>>();
  });

  it("should parse", () => {
    const actual = new Map([["foo", "foo"]]);

    expect(subject.parse(actual)).toBe(actual);
    expect(() =>
      subject.parse(new Map([["foo", 1]]))
    ).toThrowErrorMatchingInlineSnapshot('"foo must be string but got 1"');
  });
});

describe("SetSchema", () => {
  const subject = new SetSchema(new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<Set<string>>>();
  });

  it("should parse", () => {
    const actual = new Set(["foo"]);

    expect(subject.parse(actual)).toBe(actual);
    expect(() =>
      subject.parse(new Set([1]))
    ).toThrowErrorMatchingInlineSnapshot('"1 must be string but got 1"');
  });
});

describe("ArrayTupleSchema", () => {
  const subject = new ArrayTupleSchema([
    new StringSchema(),
    new NumberSchema(),
  ]);

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<readonly [string, number]>>();
  });

  it("should parse", () => {
    const actual = ["foo", 1] as const;

    expect(subject.parse(actual)).toBe(actual);
    expect(() => subject.parse(["foo"])).toThrowErrorMatchingInlineSnapshot(
      '"must be at least 2 characters long, but got 1"'
    );
    expect(() =>
      subject.parse(["foo", "bar"])
    ).toThrowErrorMatchingInlineSnapshot('"1 must be number but got bar"');
  });
});

describe("LiteralSchema", () => {
  const subject = new LiteralSchema("foo");

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<"foo">>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(() => subject.parse("bar")).toThrowErrorMatchingInlineSnapshot(
      '"must be foo but got bar"'
    );
  });
});

describe("NullSchema", () => {
  const subject = new NullSchema();

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<null>>();
  });

  it("should parse", () => {
    expect(subject.parse(null)).toBe(null);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be null but got foo"'
    );
  });
});

describe("UndefinedSchema", () => {
  const subject = new UndefinedSchema();

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<undefined>>();
  });

  it("should parse", () => {
    expect(subject.parse(undefined)).toBe(undefined);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be undefined but got foo"'
    );
  });
});

describe("OptionalSchema", () => {
  const subject = new OptionalSchema(new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string | undefined>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(() => subject.parse(null)).toThrowErrorMatchingInlineSnapshot(
      '"must be one of string, undefined but got null"'
    );
    expect(subject.parse(undefined)).toBe(undefined);
    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be one of string, undefined but got 1"'
    );
  });
});

describe("NullableSchema", () => {
  const subject = new NullableSchema(new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string | null>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");

    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be one of string,  but got 1"'
    );

    expect(subject.parse(null)).toBe(null);
    expect(() => subject.parse(undefined)).toThrowErrorMatchingInlineSnapshot(
      '"must be one of string,  but got undefined"'
    );
  });
});

describe("TypeOfSchema", () => {
  const subject = new TypeofSchema("bigint");

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<bigint>>();
  });

  it("should parse", () => {
    expect(subject.parse(1n)).toBe(1n);
    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be bigint but got 1"'
    );
  });
});

describe("InstanceofSchema", () => {
  const subject = new InstanceofSchema(Date);

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<Date>>();
  });

  it("should parse", () => {
    const actual = new Date();
    expect(subject.parse(actual)).toBe(actual);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be Date but got foo"'
    );
  });
});

describe("UnionSchema", () => {
  const subject = new UnionSchema([new StringSchema(), new NumberSchema()]);

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string | number>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(subject.parse(1)).toBe(1);
    expect(() => subject.parse(true)).toThrowErrorMatchingInlineSnapshot(
      '"must be one of string, number but got true"'
    );
  });
});

describe("IntersectionSchema", () => {
  const subject = new IntersectionSchema([
    new ObjectSchema({ foo: new StringSchema() }),
    new ObjectSchema({ bar: new NumberSchema() }),
  ]);

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<
      Schema<{ foo: string } & { bar: number }>
    >();
  });

  it("should parse", () => {
    const actual = { foo: "foo", bar: 1 };

    expect(subject.parse(actual)).toBe(actual);
    expect(() =>
      subject.parse({ foo: "foo" })
    ).toThrowErrorMatchingInlineSnapshot(
      '"bar must be number but got undefined"'
    );
    expect(() => subject.parse("bar")).toThrowErrorMatchingInlineSnapshot(
      '"must be object but got bar"'
    );
  });
});

describe("LazySchema", () => {
  const subject = new LazySchema(() => new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<string>>();
  });

  it("should parse", () => {
    expect(subject.parse("foo")).toBe("foo");
    expect(() => subject.parse(1)).toThrowErrorMatchingInlineSnapshot(
      '"must be string but got 1"'
    );
  });
});

describe("PromiseSchema", () => {
  const subject = new PromiseSchema(new StringSchema());

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<Promise<string>>>();
  });

  it("should parse", () => {
    expect(subject.parse(Promise.resolve("foo"))).resolves.toBe("foo");
    expect(() =>
      subject.parse(Promise.resolve(1))
    ).rejects.toThrowErrorMatchingInlineSnapshot('"must be string but got 1"');
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be Promise but got foo"'
    );
  });
});

describe("RefinementSchema", () => {
  const MinNumberSymbol = Symbol("MinNumber");
  type MinNumber = number & {
    readonly [MinNumberSymbol]: never;
  };
  const subject = new RefinementSchema(
    new NumberSchema(),
    (n): n is MinNumber => n > 0,
    "MinNumber"
  );

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<MinNumber>>();
  });

  it("should parse", () => {
    expect(subject.parse(1)).toBe(1);
    expect(() => subject.parse(-1)).toThrowErrorMatchingInlineSnapshot(
      '"must be MinNumber but got -1"'
    );
  });
});

describe("IntersectionSchema", () => {
  const MinNumberSymbol = Symbol("MinNumber");
  const MaxNumberSymbol = Symbol("MaxNumber");
  type MinNumber = number & {
    readonly [MinNumberSymbol]: never;
  };
  type MaxNumber = number & {
    readonly [MaxNumberSymbol]: never;
  };
  const minMaxNumberSchema = new IntersectionSchema([
    new RefinementSchema(
      new NumberSchema(),
      (n): n is MinNumber => n > 0,
      "MinNumber"
    ),
    new RefinementSchema(
      new NumberSchema(),
      (n): n is MaxNumber => n < 100,
      "MaxNumber"
    ),
  ]);

  const intersectionFooBarObjSchema = new IntersectionSchema([
    new ObjectSchema({ foo: new StringSchema() }),
    new ObjectSchema({ bar: new NumberSchema() }),
  ]);

  it("should have the correct types", () => {
    expectTypeOf(minMaxNumberSchema).toEqualTypeOf<
      Schema<MinNumber & MaxNumber>
    >();
    expectTypeOf(intersectionFooBarObjSchema).toEqualTypeOf<
      Schema<{ foo: string } & { bar: number }>
    >();
  });

  it("should parse", () => {
    const actual = { foo: "foo", bar: 1 };

    expect(minMaxNumberSchema.parse(1)).toBe(1);
    expect(() =>
      minMaxNumberSchema.parse(-1)
    ).toThrowErrorMatchingInlineSnapshot('"must be MinNumber but got -1"');
    expect(() =>
      minMaxNumberSchema.parse(101)
    ).toThrowErrorMatchingInlineSnapshot('"must be MaxNumber but got 101"');
    expect(intersectionFooBarObjSchema.parse(actual)).toBe(actual);
    expect(() =>
      intersectionFooBarObjSchema.parse({ foo: "foo" })
    ).toThrowErrorMatchingInlineSnapshot(
      '"bar must be number but got undefined"'
    );
    expect(() =>
      intersectionFooBarObjSchema.parse("bar")
    ).toThrowErrorMatchingInlineSnapshot('"must be object but got bar"');
  });
});

describe("TransformSchema", () => {
  const numberSchema = new NumberSchema({ required: true });
  const subject = new TransformSchema(
    new StringSchema(),
    (s, path): Result<number, SchemaError> =>
      numberSchema.parseResult(Number(s), path)
  );

  it("should have the correct types", () => {
    expectTypeOf(subject).toEqualTypeOf<Schema<number>>();
  });

  it("should parse", () => {
    expect(subject.parse("1")).toBe(1);
    expect(() => subject.parse("foo")).toThrowErrorMatchingInlineSnapshot(
      '"must be present, but got NaN"'
    );
  });
});
