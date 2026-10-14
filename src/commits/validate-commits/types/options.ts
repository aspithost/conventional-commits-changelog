export interface AllowedCommitScopes<T extends string> {
  /**
   * A set of allowed commit scopes.
   * @typeParam T - The type of allowed commit scopes.
   */
  allowedCommitScopes: Set<T>;
}

export interface AllowedCommitTypes<T extends string> {
  /**
   * A set of allowed commit types.
   * @typeParam T - The type of allowed commit types.
   */
  allowedCommitTypes: Set<T>;
}

export type CommitsValidatorOptions<
  T extends string,
  U extends string,
> = Partial<AllowedCommitScopes<T>> & Partial<AllowedCommitTypes<U>>;
