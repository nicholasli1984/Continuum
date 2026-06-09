import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Sentry + PostHog were imported synchronously at the top of this file,
// putting ~150KB of analytics/error-tracking SDK code on the critical path
// of every cold start. They never run before first paint anyway (Sentry
// just installs error hooks; PostHog captures clicks/pageviews after the
// first render), so deferring them with requestIdleCallback unblocks React
// without changing any observable behavior. Hold a module-scope reference
// to Sentry once it loads so the ErrorBoundary below can forward to it.
let _sentry = null;

const deferInit = (cb) => {
  if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout: 2000 });
  else setTimeout(cb, 0);
};

deferInit(() => {
  const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
  if (POSTHOG_KEY) {
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          blockClass: 'ph-no-capture',
        },
      });
      window.posthog = posthog;
    });
  }
});

deferInit(() => {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  if (!SENTRY_DSN) return;
  import('@sentry/react').then(Sentry => {
    _sentry = Sentry;
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE || 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'Could not load "util"',
        /Could not load "util"/,
        'The object can not be found here',
        /The object can not be found here/,
      ],
    });
  });
});

// Redirect any *.vercel.app access (including auth callbacks) to the custom domain
if (window.location.hostname.endsWith('.vercel.app')) {
  window.location.replace('https://gocontinuum.app' + window.location.pathname + window.location.search + window.location.hash);
}

// Log SW controller changes (no auto-reload to prevent loops)

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e, info) {
    console.error("React crash:", e, info);
    // Forward to Sentry with React component stack as context — Sentry is
    // deferred-loaded so it may not be ready yet on a very early crash;
    // when it's not, we still get the console.error above.
    if (_sentry) {
      _sentry.withScope(scope => {
        scope.setExtras({ componentStack: info?.componentStack });
        _sentry.captureException(e);
      });
    }
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', { style: { padding: 40, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('div', { style: { maxWidth: 480, textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: 48, marginBottom: 16, opacity: 0.3 } }, '—'),
          React.createElement('h1', { style: { fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 8 } }, 'Something went wrong'),
          React.createElement('p', { style: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.5 } }, 'Continuum encountered an error. Try refreshing the page.'),
          React.createElement('button', {
            onClick: () => { if ('caches' in window) caches.keys().then(k => k.forEach(n => caches.delete(n))); window.location.reload(); },
            style: { padding: '12px 28px', border: 'none', borderRadius: 8, background: '#D4742D', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
          }, 'Refresh App'),
          React.createElement('details', { style: { marginTop: 24, textAlign: 'left' } },
            React.createElement('summary', { style: { fontSize: 12, color: '#999', cursor: 'pointer' } }, 'Error details'),
            React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 11, color: '#C8553D', marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 6, overflow: 'auto', maxHeight: 200 } },
              String(this.state.error?.message || this.state.error)
            )
          )
        )
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
