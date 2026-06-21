import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[App Error]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 32, fontFamily: 'Helvetica, Arial, sans-serif',
          background: '#0d0d16', color: '#e2e2f0', minHeight: '100vh',
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: 16 }}>⚠️ Errore di avvio</h2>
          <pre style={{
            background: '#1f1f2e', border: '1px solid #2a2a3d', borderRadius: 8,
            padding: 16, fontSize: 12, overflowX: 'auto', color: '#fbbf24',
            marginBottom: 24, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <p style={{ color: '#8080a0', marginBottom: 16, fontSize: 14 }}>
            Se l'errore riguarda il database, prova a:
          </p>
          <ol style={{ color: '#8080a0', fontSize: 14, lineHeight: 2, paddingLeft: 20 }}>
            <li>Chiudere tutti gli altri tab con questa app aperti</li>
            <li>Ricaricare la pagina (F5 o Cmd+R)</li>
          </ol>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 24, padding: '12px 24px', background: '#8b5cf6',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            Ricarica l'app
          </button>
        </div>
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
  </React.StrictMode>
);
