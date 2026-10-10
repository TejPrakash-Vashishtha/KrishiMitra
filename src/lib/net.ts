// =====================================================
// Network guards for the AI paths.
//
// A stalled request (blocked network, saturated free-tier
// endpoint, captive portal) must never hang the chat UI, so
// every outbound AI call is bounded by a hard timeout and the
// caller degrades to its fallback instead of spinning forever.
// =====================================================

/** fetch() with a hard timeout — aborts and rejects if no response arrives in time. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Reject if `promise` has not settled within `timeoutMs`. */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
