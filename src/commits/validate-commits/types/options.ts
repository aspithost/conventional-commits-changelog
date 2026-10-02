export interface AllowedCommitScopes<T extends string> {
  allowedCommitScopes: Set<T>;
}

export interface AllowedCommitTypes<T extends string> {
  allowedCommitTypes: Set<T>;
}

export type CommitsValidatorOptions<
  T extends string,
  U extends string,
> = Partial<AllowedCommitScopes<T>> & Partial<AllowedCommitTypes<U>>;
