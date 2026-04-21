import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Redirect any *.vercel.app access (including auth callbacks) to the custom domain
if (window.location.hostname.endsWith('.vercel.app')) {
  window.location.replace('https://gocontinuum.app' + window.location.pathname + window.location.search + window.location.hash);
}

// Log SW controller changes (no auto-reload to prevent loops)

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(e, info) { console.error("React crash:", e, info); }
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
            React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 11, color: '#dc2626', marginTop: 8, padding: 12, background: '#f9f9f9', borderRadius: 6, overflow: 'auto', maxHeight: 200 } },
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
