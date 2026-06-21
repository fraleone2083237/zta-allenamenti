import { useState } from 'react';
import { auth } from '../firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const ERROR_MAP = {
  'auth/user-not-found': 'Email non trovata',
  'auth/wrong-password': 'Password errata',
  'auth/invalid-email': 'Email non valida',
  'auth/email-already-in-use': 'Email già registrata',
  'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
  'auth/invalid-credential': 'Email o password non corretti',
  'auth/too-many-requests': 'Troppi tentativi. Attendi qualche minuto e riprova.',
  'auth/network-request-failed': 'Errore di rete. Controlla la connessione.',
};

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged in App.jsx gestirà il redirect automaticamente
    } catch (err) {
      setError(ERROR_MAP[err.code] || ('Errore: ' + err.message));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px 20px',
      paddingTop: 'calc(24px + var(--safe-t))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
    }}>
      <div style={{ fontSize: 60, marginBottom: 12, lineHeight: 1 }}>💪</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)', textAlign: 'center' }}>
        Zero To Athlete
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 36, fontSize: 14, textAlign: 'center' }}>
        {mode === 'login' ? 'Accedi al tuo account' : 'Crea il tuo account'}
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400 }}>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="la@tua.email"
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Minimo 6 caratteri' : 'La tua password'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--red)',
              lineHeight: 1.5,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ padding: '14px', fontSize: 16, fontWeight: 700, marginTop: 4 }}
          >
            {loading
              ? (mode === 'login' ? 'Accesso in corso…' : 'Registrazione…')
              : (mode === 'login' ? 'Accedi' : 'Registrati')
            }
          </button>
        </div>
      </form>

      <p style={{ marginTop: 24, fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
        {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
        <button
          onClick={toggleMode}
          style={{
            color: 'var(--gym)',
            background: 'none',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          {mode === 'login' ? 'Registrati' : 'Accedi'}
        </button>
      </p>
    </div>
  );
}
