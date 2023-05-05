export interface Option<T> {
  [Symbol.iterator](): IterableIterator<T>;
  isSome(): this is Option<T>;
  isNone(): this is Option<never>;
  unwrap(): T;
  unwrapOr(t: T): T;
  unwrapOrElse<F extends () => T>(f: F): T;
  map<U>(f: (t: T) => U): Option<U>;
  filter<U extends T>(p: (u: T) => u is U): Option<T>;
  expect(msg: string): T;
  includes<U extends T>(u: U): boolean;
  values(): IterableIterator<T>;
  find<U extends T>(p: (u: T) => u is U): U | undefined;
  flat(): T extends Option<infer U> ? Option<U> : Option<T>;
  flatMap<U>(f: (t: T) => Option<U>): Option<U>;
}

export class Some<T> implements Option<T> {
  static of<T>(value: T): Option<T> {
    return new Some(value);
  }
  private constructor(private readonly value: T) {}
  *[Symbol.iterator]() {
    yield this.value;
  }
  values() {
    return this[Symbol.iterator]();
  }
  isSome(): this is Option<T> {
    return true;
  }
  isNone(): this is Option<never> {
    return false;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(defaultValue: T) {
    return this.value;
  }
  unwrapOrElse(defaultValue: () => T) {
    return this.value;
  }
  map<U>(f: (t: T) => U) {
    return Some.of(f(this.value));
  }
  filter<U extends T>(f: (t: T) => t is U) {
    return f(this.value) ? this : None.of<U>();
  }
  expect(message: string): T {
    return this.value;
  }
  includes(value: unknown): boolean {
    return this.value === value;
  }
  find<U extends T>(p: (t: T) => t is U): U | undefined {
    return p(this.value) ? this.value : undefined;
  }
  flat(): T extends Option<infer U> ? Option<U> : Option<T> {
    return this.value instanceof Some || this.value instanceof None
      ? this.value
      : (this as any);
  }
  flatMap<U>(f: (t: T) => Option<U>) {
    return f(this.value);
  }
}

export class None<T> implements Option<T> {
  static of<T>(): Option<T> {
    return new None<T>();
  }
  *[Symbol.iterator](): IterableIterator<T> {
    return undefined;
  }
  values() {
    return this[Symbol.iterator]();
  }
  isSome(): this is Option<T> {
    return false;
  }
  isNone(): this is Option<never> {
    return true;
  }
  unwrap(): T {
    throw new Error("Cannot unwrap None");
  }
  unwrapOr(defaultValue: T) {
    return defaultValue;
  }
  unwrapOrElse(defaultValue: () => T) {
    return defaultValue();
  }
  map<U>(f: (t: T) => U): Option<U> {
    return this as any;
  }
  filter<U extends T>(predicate: (t: T) => t is U): Option<U> {
    return this as any;
  }
  expect(message: string): T {
    throw new Error(message);
  }
  includes<U extends T>(u: U) {
    return false;
  }
  find<U extends T>(predicate: (t: T) => t is U) {
    return undefined;
  }
  flat(): T extends Option<infer U> ? Option<U> : Option<T> {
    return this as any;
  }
  flatMap<U>(f: (t: T) => Option<U>): Option<U> {
    return this as any;
  }
}
