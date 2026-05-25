import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import App from './App.jsx'
import './index.css'

// ── PostHog product analytics ──
// Auto-captures pageviews + clicks. Identify users on auth so funnels work
// per-user. Init only if VITE_POSTHOG_KEY is set so local dev stays silent.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',  // Don't create profiles for anonymous traffic — saves on event quota
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,                   // Click + form-submit auto-tracking
    disable_session_recording: false,    // Free tier includes 5k recordings/month
    session_recording: {
      maskAllInputs: true,               // Don't capture form inputs (emails, etc.)
      blockClass: 'ph-no-capture',       // Add class="ph-no-capture" to any element to skip
    },
  });
  // Expose globally so other parts of the app can call posthog.identify(...) on auth
  window.posthog = posthog;
}

// Redirect any *.vercel.app access (including auth callbacks) to the custom domain
if (window.location.hostname.endsWith('.vercel.app')) {
  window.location.replace('https://gocontinuum.app' + window.location.pathname + window.location.search + window.location.hash);
}

// ── Sentry error tracking ──
// Init only if a DSN is configured (so local dev without VITE_SENTRY_DSN is silent).
// Free tier limits: 5k errors/mo, 50 replays/mo. Conservative sampling to fit.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Performance: 10% sample (free tier has limited transactions)
    tracesSampleRate: 0.1,
    // Replay: never on normal sessions, 100% when an error occurs
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Don't report some noisy / harmless errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Not from our code — a browser extension / injected script on the page
      // tries to load a "util" module and fails; Sentry's global handler catches
      // it. No such string exists anywhere in our bundle.
      'Could not load "util"',
      /Could not load "util"/,
    ],
  });
}

// Log SW controller changes (no auto-reload to prevent loops)

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e, info) {
    console.error("React crash:", e, info);
    // Forward to Sentry with React component stack as context
    if (SENTRY_DSN) {
      Sentry.withScope(scope => {
        scope.setExtras({ componentStack: info?.componentStack });
        Sentry.captureException(e);
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
