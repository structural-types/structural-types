export interface Result<T, E> {
  [Symbol.iterator](): IterableIterator<T>;
  values(): IterableIterator<T>;
  isOk(): this is Result<T, never>;
  isErr(): this is Result<never, E>;
  unwrap(): T;
  unwrapErr(): E;
  unwrapOrElse(fn: (error: E) => T): T;
  unwrapOr(defaultValue: T): T;
  map<U>(f: (value: T) => U): Result<U, E>;
  mapErr<F>(o: (error: E) => F): Result<T, F>;
  expect(message: string): T;
  expectErr(message: string): E;
  includes<U extends T>(u: U): boolean;
  includesErr<F extends E>(f: F): boolean;
  find<U extends T>(predicate: (t: T) => t is U): U | undefined;
  findErr<F extends E>(predicate: (e: E) => e is F): F | undefined;
  flat(): T extends Result<infer U, E> ? Result<U, E> : Result<T, E>;
  flatErr(): E extends Result<T, infer F> ? Result<T, F> : Result<T, E>;
  flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E>;
  flatMapErr<F>(f: (error: E) => Result<T, F>): Result<T, F>;
}

export class Ok<T, E> implements Result<T, E> {
  *[Symbol.iterator]() {
    yield this.value;
  }
  private constructor(private value: T) {}

  static of<T, E>(value: T): Result<T, E> {
    return new Ok<T, E>(value);
  }

  values(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  isOk(): this is Result<T, never> {
    return true;
  }

  isErr(): this is Result<never, E> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapErr(): E {
    throw new Error("Cannot unwrapErr Ok");
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return this.value;
  }

  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  map<U>(f: (value: T) => U): Result<U, E> {
    return Ok.of(f(this.value));
  }

  mapErr<F>(f: (error: E) => F): Result<T, F> {
    return this as any;
  }

  expect(message: string): T {
    return this.value;
  }

  expectErr(message: string): E {
    throw new Error(message);
  }

  includes<U extends T>(u: U): boolean {
    return this.value === u;
  }

  includesErr<F extends E>(f: F): boolean {
    return false;
  }

  find<U extends T>(predicate: (t: T) => t is U): U | undefined {
    return predicate(this.value) ? this.value : undefined;
  }

  findErr<F extends E>(predicate: (e: E) => e is F): F | undefined {
    return undefined;
  }

  flat(): T extends Result<infer U, E> ? Result<U, E> : Result<T, E> {
    return this.value instanceof Ok || this.value instanceof Err
      ? this.value
      : (this as any);
  }

  flatErr(): E extends Result<T, infer F> ? Result<T, F> : Result<T, E> {
    return this as any;
  }

  flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    return f(this.value);
  }

  flatMapErr<F>(f: (error: E) => Result<T, F>): Result<T, F> {
    return this as any;
  }
}

export class Err<T, E> implements Result<T, E> {
  private constructor(private error: E) {}

  static of<T, E>(error: E): Result<T, E> {
    return new Err<T, E>(error);
  }

  *[Symbol.iterator]() {
    return;
  }

  values(): IterableIterator<T> {
    return this[Symbol.iterator]();
  }

  isOk(): this is Result<T, never> {
    return false;
  }

  isErr(): this is Result<never, E> {
    return true;
  }

  unwrap(): T {
    throw new Error("Cannot unwrap Err");
  }

  unwrapErr(): E {
    return this.error;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this.error);
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  map<U>(f: (value: T) => U): Result<U, E> {
    return this as any;
  }

  mapErr<F>(o: (error: E) => F): Result<T, F> {
    return Err.of(o(this.error));
  }

  expect(message: string): T {
    throw new Error(message);
  }

  expectErr(message: string): E {
    return this.error;
  }

  includes<U extends T>(u: U): boolean {
    return false;
  }

  includesErr<F extends E>(f: F): boolean {
    return this.error === f;
  }

  find<U extends T>(predicate: (t: T) => t is U): U | undefined {
    return undefined;
  }

  findErr<F extends E>(predicate: (e: E) => e is F): F | undefined {
    return predicate(this.error) ? this.error : undefined;
  }

  flat(): T extends Result<infer U, E> ? Result<U, E> : Result<T, E> {
    return this as any;
  }

  flatErr(): E extends Result<T, infer F> ? Result<T, F> : Result<T, E> {
    return this.error instanceof Err || this.error instanceof Ok
      ? this.error
      : (this as any);
  }

  flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    return this as any;
  }

  flatMapErr<F>(f: (error: E) => Result<T, F>): Result<T, F> {
    return f(this.error);
  }
}
