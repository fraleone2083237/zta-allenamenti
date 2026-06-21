import { useState, useEffect } from 'react';
import { getAllWorkouts, getAllRunSessions, getAllConditioningWorkouts, getAllOtherActivities } from '../db.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function thisMonth(dateStr) {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function Dashboard({ setPage }) {
  const [workouts, setWorkouts] = useState([]);
  const [runs, setRuns] = useState([]);
  const [cond, setCond] = useState([]);
  const [other, setOther] = useState([]);

  useEffect(() => {
    getAllWorkouts().then(w => setWorkouts(w.sort((a, b) => b.data.localeCompare(a.data))));
    getAllRunSessions().then(r => setRuns(r.sort((a, b) => b.data.localeCompare(a.data))));
    getAllConditioningWorkouts().then(c => setCond(c.sort((a, b) => b.data.localeCompare(a.data))));
    getAllOtherActivities().then(o => setOther(o.sort((a, b) => b.data.localeCompare(a.data))));
  }, []);

  const lastWorkout = workouts[0];
  const lastRun = runs[0];
  const lastCond = cond[0];
  const gymThisMonth = workouts.filter(w => thisMonth(w.data)).length;
  const runThisMonth = runs.filter(r => thisMonth(r.data)).length;
  const condThisMonth = cond.filter(c => thisMonth(c.data)).length;
  const otherThisMonth = other.filter(o => thisMonth(o.data)).length;
  const kmThisMonth = runs.filter(r => thisMonth(r.data)).reduce((s, r) => s + (parseFloat(r.distanza) || 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';

  return (
    <div>
      <div className="dashboard-hero">
        <div className="greeting">{greeting} 💪</div>
        <div className="greeting-sub">Ecco il tuo riepilogo</div>
      </div>

      {/* Quick cards – 4 in 2×2 grid */}
      <div className="quick-cards">
        <div className="quick-card" onClick={() => setPage('palestra')}>
          <div className="quick-card-icon">🏋️</div>
          <div className="quick-card-title">Palestra</div>
          <div className="quick-card-value">{gymThisMonth}</div>
          <div className="quick-card-sub">sessioni questo mese</div>
        </div>
        <div className="quick-card run" onClick={() => setPage('corsa')}>
          <div className="quick-card-icon">🏃</div>
          <div className="quick-card-title">Corsa</div>
          <div className="quick-card-value">{kmThisMonth.toFixed(1)} km</div>
          <div className="quick-card-sub">{runThisMonth} uscite</div>
        </div>
        <div className="quick-card cond" onClick={() => setPage('conditioning')}>
          <div className="quick-card-icon">⚡</div>
          <div className="quick-card-title">Conditioning</div>
          <div className="quick-card-value">{condThisMonth}</div>
          <div className="quick-card-sub">sessioni questo mese</div>
        </div>
        <div className="quick-card other" onClick={() => setPage('altreAttivita')}>
          <div className="quick-card-icon">🎯</div>
          <div className="quick-card-title">Altre attività</div>
          <div className="quick-card-value">{otherThisMonth}</div>
          <div className="quick-card-sub">attività questo mese</div>
        </div>
      </div>

      {/* Last gym workout */}
      <div className="section-title">Ultimo allenamento palestra</div>
      <div className="px-16">
        {lastWorkout ? (
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => setPage('palestra')}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <span style={{ fontWeight: 700 }}>{formatDate(lastWorkout.data)}</span>
                <span className="badge" style={{ marginLeft: 'auto' }}>{lastWorkout.esercizi?.length || 0} esercizi</span>
              </div>
              {lastWorkout.esercizi?.slice(0, 3).map((e, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 4, marginBottom: 2 }}>
                  · {e.esercizioNome} — {e.serie?.length || 0} serie
                </div>
              ))}
              {(lastWorkout.esercizi?.length || 0) > 3 && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', paddingLeft: 4, marginTop: 2 }}>+{lastWorkout.esercizi.length - 3} altri…</div>
              )}
            </div>
          </div>
        ) : (
          <div className="card card-body" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Nessun allenamento ancora —{' '}
            <span className="text-gym" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => setPage('palestra')}>inizia ora!</span>
          </div>
        )}
      </div>

      {/* Last run */}
      <div className="section-title">Ultima corsa</div>
      <div className="px-16">
        {lastRun ? (
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => setPage('corsa')}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <span style={{ fontWeight: 700 }}>{formatDate(lastRun.data)}</span>
                <span className="badge run" style={{ marginLeft: 'auto' }}>{lastRun.tipo}</span>
              </div>
              <div className="stats-row" style={{ margin: 0 }}>
                <div className="stat-box">
                  <div className="stat-value" style={{ color: 'var(--run)', fontSize: 16 }}>{lastRun.distanza || '—'}</div>
                  <div className="stat-label">km</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value" style={{ fontSize: 16 }}>{lastRun.tempo || '—'}</div>
                  <div className="stat-label">tempo</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value" style={{ fontSize: 16 }}>{lastRun.passoMedio || '—'}</div>
                  <div className="stat-label">/km</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card card-body" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Nessuna corsa ancora —{' '}
            <span className="text-run" style={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => setPage('corsa')}>registra ora!</span>
          </div>
        )}
      </div>

      {/* Last conditioning */}
      {lastCond && (
        <>
          <div className="section-title">Ultima sessione conditioning</div>
          <div className="px-16">
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => setPage('conditioning')}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>📅</span>
                  <span style={{ fontWeight: 700 }}>{formatDate(lastCond.data)}</span>
                  <span className="badge cond" style={{ marginLeft: 'auto' }}>{lastCond.blocchi?.length || 0} blocchi</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {lastCond.tempoTotale && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⏱ {lastCond.tempoTotale}</span>}
                  {lastCond.rpe && <span style={{ fontSize: 13, color: 'var(--cond)', fontWeight: 700 }}>RPE {lastCond.rpe}/10</span>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Totals */}
      <div className="section-title">Statistiche generali</div>
      <div className="px-16" style={{ paddingBottom: 8 }}>
        <div className="card card-body">
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value text-gym">{workouts.length}</div>
              <div className="stat-label">palestra</div>
            </div>
            <div className="stat-box">
              <div className="stat-value text-run">{runs.length}</div>
              <div className="stat-label">corse</div>
            </div>
            <div className="stat-box">
              <div className="stat-value text-cond">{cond.length}</div>
              <div className="stat-label">cond.</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{runs.reduce((s, r) => s + (parseFloat(r.distanza) || 0), 0).toFixed(0)}</div>
              <div className="stat-label">km tot.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
