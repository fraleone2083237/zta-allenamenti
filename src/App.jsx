import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import Navigation from './components/Navigation.jsx';
import { ToastProvider } from './components/Toast.jsx';
import LoginPage from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PalestraPage from './pages/palestra/PalestraPage.jsx';
import CorsaPage from './pages/corsa/CorsaPage.jsx';
import ConditioningPage from './pages/conditioning/ConditioningPage.jsx';
import AltreAttivitaPage from './pages/altreAttivita/AltreAttivitaPage.jsx';
import CalendarioPage from './pages/calendario/CalendarioPage.jsx';
import ProfiloPage from './pages/profilo/ProfiloPage.jsx';
import Impostazioni from './pages/Impostazioni.jsx';
import MenuPage from './pages/MenuPage.jsx';

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0d16',
      gap: 16,
    }}>
      <div style={{ fontSize: 52 }}>💪</div>
      <div style={{ color: '#8080a0', fontSize: 14 }}>Caricamento…</div>
    </div>
  );
}

export default function App() {
  // undefined = in attesa auth, null = non loggato, oggetto = loggato
  const [user, setUser] = useState(undefined);
  const [page, setPage] = useState('dashboard');
  // pending: { type: 'new', date: '...' } | { type: 'edit', section: '...', id: ... } | null
  const [pending, setPending] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null));
  }, []);

  function navigateTo(targetPage, pendingState = null) {
    setPage(targetPage);
    if (pendingState) setPending(pendingState);
  }

  function clearPending() { setPending(null); }

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <ToastProvider>
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-content">
          {page === 'dashboard' && (
            <>
              <div className="page-header">
                <div>
                  <h1 style={{ fontSize: 18 }}>💪 Zero To Athlete</h1>
                  <div className="subtitle" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>Tracking allenamenti</div>
                  <div className="subtitle">{today}</div>
                </div>
              </div>
              <Dashboard setPage={setPage} />
            </>
          )}
          {page === 'palestra' && <PalestraPage pending={pending} clearPending={clearPending} />}
          {page === 'corsa' && <CorsaPage pending={pending} clearPending={clearPending} />}
          {page === 'conditioning' && <ConditioningPage pending={pending} clearPending={clearPending} />}
          {page === 'altreAttivita' && <AltreAttivitaPage pending={pending} clearPending={clearPending} />}
          {page === 'calendario' && <CalendarioPage onNavigate={navigateTo} />}
          {page === 'profilo' && <ProfiloPage />}
          {page === 'impostazioni' && <Impostazioni />}
          {page === 'menu' && <MenuPage setPage={setPage} />}
        </div>
        <Navigation page={page} setPage={setPage} />
      </div>
    </ToastProvider>
  );
}
