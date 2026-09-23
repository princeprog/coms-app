export type AuthActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };
