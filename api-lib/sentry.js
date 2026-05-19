// Sentry wrapper for Vercel serverless handlers.
// Init runs once per cold start (guarded by globalThis flag).
// Wrap any handler with `withSentry(handler)` to capture uncaught errors
// and flush them before the function exits (otherwise the event is dropped
// when the lambda is frozen).

import * as Sentry from "@sentry/node";

const DSN = process.env.SENTRY_DSN;

if (DSN && !globalThis.__continuum_sentry_inited) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.VERCEL_ENV || "production",
    tracesSampleRate: 0,  // Free tier — no perf monitoring on backend
    // Don't capture our own structured 4xx returns; only true exceptions
    beforeSend(event) {
      if (event?.exception?.values?.[0]?.value?.includes?.("Method not allowed")) return null;
      return event;
    },
  });
  globalThis.__continuum_sentry_inited = true;
}

export function withSentry(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (err) {
      console.error("[handler error]", err);
      if (DSN) {
        Sentry.withScope((scope) => {
          scope.setTag("path", req.url || "");
          scope.setTag("method", req.method || "");
          scope.setExtras({ headers: { ...req.headers } });
          Sentry.captureException(err);
        });
        try { await Sentry.flush(2000); } catch (_) {}
      }
      // Re-throw so Vercel returns a proper 500
      throw err;
    }
  };
}

// Manual capture (for handlers that catch errors internally and want to log)
export function captureBackendError(err, context = {}) {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([k, v]) => scope.setTag(k, String(v)));
    Sentry.captureException(err);
  });
  return Sentry.flush(2000).catch(() => {});
}
