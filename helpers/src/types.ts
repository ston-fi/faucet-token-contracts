export type Nullable<T> = T | null;
export type NullableObj<A> = { [K in keyof A]: Nullable<A[K]> };

export type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = Awaited<ReturnType<T>>;
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };