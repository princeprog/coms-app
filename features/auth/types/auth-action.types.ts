export type AuthActionResult<T> =
  | { ok: true; data: T; sessionRefreshed?: boolean }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };
