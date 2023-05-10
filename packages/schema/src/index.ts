import type { Result } from "@structural-types/result";
import { Ok, Err } from "@structural-types/result";

type SchemaPath = unknown[];

export type SchemaType<T> = T extends Schema<infer U> ? U : never;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never;

type ExtractUnionFromReadonlySchemaArray<T> = T extends readonly Schema<
  infer U
>[]
  ? U
  : never;

type ExtractIntersectionFromReadonlySchemaArray<T> = UnionToIntersection<
  ExtractUnionFromReadonlySchemaArray<T>
>;

type ExtractTupleFromSchemaArray<T> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

type SchemaErrorContext =
  | {
      type: "rangeOverflow";
      expected: number;
      actual: number;
      path: SchemaPath;
    }
  | {
      type: "rangeUnderflow";
      expected: bigint;
      actual: bigint;
      path: SchemaPath;
    }
  | {
      type: "rangeUnderflow";
      expected: number;
      actual: number;
      path: SchemaPath;
    }
  | {
      type: "rangeOverflow";
      expected: bigint;
      actual: bigint;
      path: SchemaPath;
    }
  | {
      type: "stepMismatch";
      expected: number;
      actual: number;
      path: SchemaPath;
    }
  | {
      type: "stepMismatch";
      expected: bigint;
      actual: bigint;
      path: SchemaPath;
    }
  | {
      type: "valueMissing";
      expected: unknown;
      actual: unknown;
      path: SchemaPath;
    }
  | {
      type: "tooShort";
      expected: number;
      actual: number;
      path: SchemaPath;
    }
  | {
      type: "tooLong";
      expected: number;
      actual: number;
      path: SchemaPath;
    }
  | {
      type: "typeMismatch";
      expected: unknown[];
      actual: unknown;
      path: SchemaPath;
    }
  | {
      type: "badInput";
      expected: unknown;
      actual: unknown;
      path: SchemaPath;
    }
  | {
      type: "patternMismatch";
      expected: string;
      actual: string;
      path: SchemaPath;
    }
  | {
      type: "custom";
      message: string;
      path: SchemaPath;
    };

function getSchemaErrorMessage(context: SchemaErrorContext): string {
  switch (context.type) {
    case "rangeOverflow":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be less than or equal to ${context.expected}, but got ${
        context.actual
      }`;
    case "rangeUnderflow":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be greater than or equal to ${context.expected}, but got ${
        context.actual
      }`;
    case "stepMismatch":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be a multiple of ${context.expected}, but got ${context.actual}`;
    case "valueMissing":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be present, but got ${context.actual}`;
    case "tooShort":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be at least ${context.expected} characters long, but got ${
        context.actual
      }`;
    case "tooLong":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be at most ${context.expected} characters long, but got ${
        context.actual
      }`;
    case "typeMismatch":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be${
        context.expected.length > 1 ? " one of " : " "
      }${context.expected.join(", ")} but got ${context.actual}`;
    case "badInput":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must be ${context.expected} but got ${context.actual}`;
    case "patternMismatch":
      return `${
        context.path.length ? `${context.path.join(".")} ` : ""
      }must match the pattern ${context.expected} but got ${context.actual}`;
    case "custom":
      return context.message;
  }
}

export class SchemaError extends Error {
  constructor(public context: SchemaErrorContext) {
    super(getSchemaErrorMessage(context));

    Object.setPrototypeOf(this, SchemaError.prototype);
  }
}

export abstract class Schema<T> {
  abstract parseResult(
    data: unknown,
    path?: SchemaPath
  ): Result<T, SchemaError>;
  parse(data: unknown): T {
    const result = this.parseResult(data);

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return result.unwrap();
  }
}

export class LiteralSchema<const T> extends Schema<T> {
  constructor(private literal: T) {
    super();
  }

  parseResult(data: unknown, path: SchemaPath = []): Result<T, SchemaError> {
    return data === this.literal
      ? Ok.of(data as T)
      : Err.of(
          new SchemaError({
            type: "badInput",
            expected: this.literal,
            actual: data,
            path,
          })
        );
  }
}

export class CustomErrorSchema<T> extends Schema<T> {
  constructor(
    private schema: Schema<T>,
    private message: string | ((error: SchemaError) => string)
  ) {
    super();
  }

  parseResult(data: unknown, path: SchemaPath = []): Result<T, SchemaError> {
    const result = this.schema.parseResult(data, path);

    if (result.isErr()) {
      const err = result.unwrapErr();
      return Err.of(
        new SchemaError({
          type: "custom",
          message:
            typeof this.message === "function"
              ? this.message(err)
              : this.message,
          path,
        })
      );
    }

    return result;
  }
}

export class UnionSchema<const T extends readonly Schema<any>[]> extends Schema<
  ExtractUnionFromReadonlySchemaArray<T>
> {
  constructor(private schemas: T) {
    super();
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<ExtractUnionFromReadonlySchemaArray<T>, SchemaError> {
    const expected: Set<unknown> = new Set();
    for (const schema of this.schemas) {
      const result = schema.parseResult(data, path);
      if (result.isOk()) {
        return result;
      }

      const err = result.unwrapErr();
      if (err.context.type !== "custom") {
        expected.add(err.context.expected);
      }
    }

    return Err.of(
      new SchemaError({
        type: "typeMismatch",
        expected: Array.from(expected.values()),
        actual: data,
        path,
      })
    );
  }
}

export class IntersectionSchema<
  const T extends readonly Schema<any>[]
> extends Schema<ExtractIntersectionFromReadonlySchemaArray<T>> {
  constructor(private schemas: T) {
    super();
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<ExtractIntersectionFromReadonlySchemaArray<T>, SchemaError> {
    for (const schema of this.schemas) {
      const result = schema.parseResult(data, path);
      if (result.isErr()) {
        return result;
      }
    }

    return Ok.of(data as ExtractIntersectionFromReadonlySchemaArray<T>);
  }
}

export class ArrayTupleSchema<
  const T extends ReadonlyArray<Schema<any>>
> extends Schema<ExtractTupleFromSchemaArray<T>> {
  constructor(private schemas: T) {
    super();
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<ExtractTupleFromSchemaArray<T>, SchemaError> {
    if (!Array.isArray(data)) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: ["array"],
          actual: data,
          path,
        })
      );
    }

    if (data.length < this.schemas.length) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.schemas.length,
          actual: data.length,
          path: path,
        })
      );
    } else if (data.length > this.schemas.length) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.schemas.length,
          actual: data.length,
          path: path,
        })
      );
    }

    for (const [index, value] of data.entries()) {
      const result = this.schemas[index].parseResult(value, [...path, index]);
      if (result.isErr()) {
        return result;
      }
    }

    return Ok.of(data as ExtractTupleFromSchemaArray<T>);
  }
}

export class RecordSchema<K extends keyof any, V> extends Schema<Record<K, V>> {
  constructor(private keySchema: Schema<K>, private valueSchema: Schema<V>) {
    super();
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<Record<K, V>, SchemaError> {
    if (typeof data !== "object" || data === null) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: ["object"],
          actual: data,
          path,
        })
      );
    }

    for (const key of Object.keys(data)) {
      const keyResult = this.keySchema.parseResult(key, [...path, key]);
      const valueResult = this.valueSchema.parseResult(
        (data as Record<keyof any, unknown>)[key],
        [...path, key]
      );

      if (keyResult.isErr()) {
        return keyResult;
      }
      if (valueResult.isErr()) {
        return valueResult;
      }
    }

    return Ok.of(data as Record<K, V>);
  }
}

export class LazySchema<T> extends Schema<T> {
  constructor(private schema: () => Schema<T>) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<T, SchemaError> {
    return this.schema().parseResult(data, path);
  }
}

export class RefinementSchema<T, U extends T> extends Schema<U> {
  constructor(
    private schema: Schema<T>,
    private predicate: (data: T) => data is U,
    private type: string
  ) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<U, SchemaError> {
    const result = this.schema.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();
    if (!this.predicate(ok)) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: [this.type],
          actual: ok,
          path,
        })
      );
    }

    return result as Result<U, SchemaError>;
  }
}

export class TransformSchema<T, U> extends Schema<U> {
  constructor(
    private schema: Schema<T>,
    private transform: (data: T, path: SchemaPath) => Result<U, SchemaError>
  ) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<U, SchemaError> {
    const result = this.schema.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    return this.transform(result.unwrap(), path);
  }
}

type AnyTypeofMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  symbol: symbol;
  undefined: undefined;
  object: object;
  function: Function;
};

export class TypeofSchema<T extends keyof AnyTypeofMap> extends Schema<
  AnyTypeofMap[T]
> {
  constructor(private type: T) {
    super();
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<AnyTypeofMap[T], SchemaError> {
    if (typeof data !== this.type) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: [this.type],
          actual: data,
          path,
        })
      );
    }

    return Ok.of(data as AnyTypeofMap[T]);
  }
}

export class InstanceofSchema<T> extends Schema<T> {
  constructor(private type: new (...args: any[]) => T) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<T, SchemaError> {
    if (!(data instanceof this.type)) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: [this.type.name],
          actual: data,
          path,
        })
      );
    }

    return Ok.of(data);
  }
}

export class PromiseSchema<T> extends InstanceofSchema<Promise<T>> {
  constructor(private schema: Schema<T>) {
    super(Promise);
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<Promise<T>, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    return Ok.of(ok.then((x) => this.schema.parse(x)));
  }
}

export class MapSchema<K, V> extends InstanceofSchema<Map<K, V>> {
  constructor(
    private keySchema: Schema<K>,
    private valueSchema: Schema<V>,
    private options: { minLength?: number; maxLength?: number } = {}
  ) {
    super(Map);
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<Map<K, V>, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (this.options.minLength && ok.size < this.options.minLength) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.options.minLength,
          actual: ok.size,
          path,
        })
      );
    } else if (this.options.maxLength && ok.size > this.options.maxLength) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.options.maxLength,
          actual: ok.size,
          path,
        })
      );
    }

    for (const [key, value] of ok.entries()) {
      const keyResult = this.keySchema.parseResult(key, [...path, key]);
      const valueResult = this.valueSchema.parseResult(value, [...path, key]);

      if (keyResult.isErr()) {
        return keyResult;
      }
      if (valueResult.isErr()) {
        return valueResult;
      }
    }

    return Ok.of(data as Map<K, V>);
  }
}

export class SetSchema<T> extends InstanceofSchema<Set<T>> {
  constructor(
    private schema: Schema<T>,
    private options: { minLength?: number; maxLength?: number } = {}
  ) {
    super(Set);
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<Set<T>, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (this.options.minLength && ok.size < this.options.minLength) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.options.minLength,
          actual: ok.size,
          path,
        })
      );
    } else if (this.options.maxLength && ok.size > this.options.maxLength) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.options.maxLength,
          actual: ok.size,
          path,
        })
      );
    }

    for (const [key, value] of ok.entries()) {
      const result = this.schema.parseResult(value, [...path, key]);

      if (result.isErr()) {
        return result;
      }
    }

    return Ok.of(data as Set<T>);
  }
}

export class StringSchema extends TypeofSchema<"string"> {
  constructor(
    private options: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
    } = {}
  ) {
    super("string");
  }

  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<string, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (this.options.required && ok.length === 0) {
      return Err.of(
        new SchemaError({
          type: "valueMissing",
          actual: ok,
          expected: "NonEmptyString",
          path,
        })
      );
    } else if (this.options.minLength && ok.length < this.options.minLength) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.options.minLength,
          actual: ok.length,
          path,
        })
      );
    } else if (this.options.maxLength && ok.length > this.options.maxLength) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.options.maxLength,
          actual: ok.length,
          path,
        })
      );
    }

    return result;
  }
}

export class NumberSchema extends TypeofSchema<"number"> {
  constructor(
    private options: {
      min?: number;
      max?: number;
      step?: number;
      required?: boolean;
      integer?: boolean;
      finite?: boolean;
    } = {}
  ) {
    super("number");
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<number, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (this.options.required && Number.isNaN(ok)) {
      return Err.of(
        new SchemaError({
          type: "valueMissing",
          actual: ok,
          expected: "number",
          path,
        })
      );
    } else if (this.options.integer && !Number.isInteger(ok)) {
      return Err.of(
        new SchemaError({
          type: "badInput",
          actual: ok,
          expected: "integer",
          path,
        })
      );
    } else if (this.options.finite && !Number.isFinite(ok)) {
      return Err.of(
        new SchemaError({
          type: "badInput",
          actual: ok,
          expected: "finite",
          path,
        })
      );
    } else if (this.options.min && ok < this.options.min) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.options.min,
          actual: ok,
          path,
        })
      );
    } else if (this.options.max && ok > this.options.max) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.options.max,
          actual: ok,
          path,
        })
      );
    } else if (this.options.step && ok % this.options.step !== 0) {
      return Err.of(
        new SchemaError({
          type: "stepMismatch",
          expected: this.options.step,
          actual: ok,
          path,
        })
      );
    }

    return result;
  }
}

export class BigIntSchema extends TypeofSchema<"bigint"> {
  constructor(
    private options: { min?: bigint; max?: bigint; step?: bigint } = {}
  ) {
    super("bigint");
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<bigint, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (this.options.min && ok < this.options.min) {
      return Err.of(
        new SchemaError({
          type: "rangeUnderflow",
          expected: this.options.min,
          actual: ok,
          path,
        })
      );
    } else if (this.options.max && ok > this.options.max) {
      return Err.of(
        new SchemaError({
          type: "rangeOverflow",
          expected: this.options.max,
          actual: ok,
          path,
        })
      );
    } else if (this.options.step && ok % this.options.step !== 0n) {
      return Err.of(
        new SchemaError({
          type: "stepMismatch",
          expected: this.options.step,
          actual: ok,
          path,
        })
      );
    }

    return result;
  }
}

export class BooleanSchema extends TypeofSchema<"boolean"> {
  constructor() {
    super("boolean");
  }
}

export class NullSchema extends LiteralSchema<null> {
  constructor() {
    super(null);
  }
}

export class UndefinedSchema extends TypeofSchema<"undefined"> {
  constructor() {
    super("undefined");
  }
}

export class ArraySchema<T> extends Schema<T[]> {
  constructor(
    private schema: Schema<T>,
    private options: {
      minLength?: number;
      maxLength?: number;
    } = {}
  ) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<T[], SchemaError> {
    if (!Array.isArray(data)) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: ["array"],
          actual: data,
          path,
        })
      );
    }

    if (this.options.minLength && data.length < this.options.minLength) {
      return Err.of(
        new SchemaError({
          type: "tooShort",
          expected: this.options.minLength,
          actual: data.length,
          path,
        })
      );
    } else if (this.options.maxLength && data.length > this.options.maxLength) {
      return Err.of(
        new SchemaError({
          type: "tooLong",
          expected: this.options.maxLength,
          actual: data.length,
          path,
        })
      );
    }

    for (const [index, value] of data.entries()) {
      const result = this.schema.parseResult(value, [...path, index]);
      if (result.isErr()) {
        return result;
      }
    }

    return Ok.of(data);
  }
}

export class ObjectSchema<T extends object> extends Schema<T> {
  constructor(private schemas: { [K in keyof T]: Schema<T[K]> }) {
    super();
  }
  parseResult(data: unknown, path: SchemaPath = []): Result<T, SchemaError> {
    if (typeof data !== "object" || data === null) {
      return Err.of(
        new SchemaError({
          type: "typeMismatch",
          expected: ["object"],
          actual: data,
          path,
        })
      );
    }

    for (const [key, schema] of Object.entries<Schema<unknown>>(this.schemas)) {
      const result = schema.parseResult(
        (data as Record<keyof any, unknown>)[key],
        [...path, key]
      );
      if (result.isErr()) {
        return result;
      }
    }

    return Ok.of(data as T);
  }
}

export class OptionalSchema<T> extends UnionSchema<
  [Schema<T>, Schema<undefined>]
> {
  constructor(schema: Schema<T>) {
    super([schema, new UndefinedSchema()]);
  }
}

export class NullableSchema<T> extends UnionSchema<[Schema<T>, Schema<null>]> {
  constructor(schema: Schema<T>) {
    super([schema, new NullSchema()]);
  }
}

export class StringTestSchema extends StringSchema {
  constructor(
    private regex: RegExp,
    options: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
    } = {}
  ) {
    super(options);
  }
  parseResult(
    data: unknown,
    path: SchemaPath = []
  ): Result<string, SchemaError> {
    const result = super.parseResult(data, path);

    if (result.isErr()) {
      return result;
    }

    const ok = result.unwrap();

    if (!this.regex.test(ok)) {
      return Err.of(
        new SchemaError({
          type: "patternMismatch",
          expected: this.regex.toString(),
          actual: ok,
          path,
        })
      );
    }

    return result;
  }
}
