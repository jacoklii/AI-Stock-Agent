import createClient from "openapi-fetch";
import type { paths } from "./schema";

// The SPA always talks to `/api/*`; the prefix is stripped by whichever proxy is in front
// (Vite dev server, nginx in the web container, Caddy in prod). Never Postgres, never a key.
export const api = createClient<paths>({ baseUrl: "/api" });

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FetchResult<T> = { data?: T; error?: unknown; response: Response };

/** Throw a typed error on non-2xx so TanStack Query sees failures; return data otherwise. */
export function unwrap<T>(res: FetchResult<T>): T {
  if (res.error !== undefined || res.data === undefined) {
    const detail = (res.error as { detail?: unknown } | undefined)?.detail;
    throw new ApiError(
      typeof detail === "string" ? detail : `HTTP ${res.response.status}`,
      res.response.status,
    );
  }
  return res.data;
}

/** For endpoints where 404 means "nothing yet" (digest, brief, preferences), not an error. */
export function nullOn404<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}
