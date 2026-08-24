export interface AllowedCommitScopes<T extends string> {
  allowedCommitScopes: readonly T[];
}

export interface AllowedCommitTypes<T extends string> {
  allowedCommitTypes: readonly T[];
}

export type CommitsValidatorOptions<
  T extends string,
  U extends string
> = Partial<AllowedCommitScopes<T>> & Partial<AllowedCommitTypes<U>>;
