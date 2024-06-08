
/**
 * Removes optional (?) from all of O's properties
 * @param O Object to remove optional attribute from properties
 */
export type WithoutOpt<O> = {
  [k in keyof O]-?: O[k];
};

/**
 * @param O Object
 * @param type type to filter
 */
export type FilterKeysOfType<O, type> = {
  [k in keyof WithoutOpt<O>]: WithoutOpt<O>[k] extends type ? k : never;
}[keyof O];

// Partial<T> & Pick<T, "english" | "kanji">;
// export type Optional<T, K extends keyof T> = Omit<T, K> & { [P in keyof T]: T[P] | undefined; }
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Get all values from a Record */
export type ValuesOf<R> = R[keyof R];
