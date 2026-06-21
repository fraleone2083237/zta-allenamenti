import { useState, useEffect } from 'react';
import { getAllRunSessions } from '../../db.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const TIPI = [
  { value: '', label: 'Tutti' },
  { value: 'lungo-lento', label: 'Lungo lento' },
  { value: 'fartlek', label: 'Fartlek' },
  { value: 'ripetute', label: 'Ripetute' },
  { value: 'ritmo', label: 'Ritmo' },
  { value: 'recupero', label: 'Recupero' },
];

function formatDateShort(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

function paceToSeconds(pace) {
  if (!pace) return null;
  const parts = pace.toString().split(':');
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return null;
}

function secondsToPace(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ color: 'var(--run)', fontWeight: 700 }}>
        {metric === 'passo' ? secondsToPace(val) + ' /km' :
         metric === 'distanza' ? val + ' km' :
         metric === 'fcMedia' ? val + ' bpm' : val}
      </div>
    </div>
  );
};

export default function GraficiCorsa() {
  const [sessions, setSessions] = useState([]);
  const [filterTipo, setFilterTipo] = useState('');
  const [metric, setMetric] = useState('distanza');

  useEffect(() => {
    getAllRunSessions().then(ss => setSessions(ss.sort((a, b) => a.data.localeCompare(b.data))));
  }, []);

  const filtered = filterTipo ? sessions.filter(s => s.tipo === filterTipo) : sessions;

  const chartData = filtered.map(s => ({
    data: formatDateShort(s.data),
    distanza: parseFloat(s.distanza) || null,
    passo: paceToSeconds(s.passoMedio) || null,
    fcMedia: parseInt(s.fcMedia) || null,
  })).filter(d => d[metric] !== null);

  const avgDistanza = chartData.length ? (chartData.reduce((s, d) => s + (d.distanza || 0), 0) / chartData.filter(d => d.distanza).length).toFixed(1) : '—';
  const bestPace = chartData.filter(d => d.passo).length ? Math.min(...chartData.filter(d => d.passo).map(d => d.passo)) : null;
  const avgFc = chartData.filter(d => d.fcMedia).length ? Math.round(chartData.filter(d => d.fcMedia).reduce((s, d) => s + d.fcMedia, 0) / chartData.filter(d => d.fcMedia).length) : '—';

  const tipiPresenti = TIPI.filter(t => !t.value || sessions.some(s => s.tipo === t.value));

  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Nessun dato</h3>
        <p>Registra delle sessioni di corsa per vedere i grafici</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="filter-row">
        {tipiPresenti.map(t => (
          <button
            key={t.value}
            className={`filter-chip ${filterTipo === t.value ? 'active run' : ''}`}
            onClick={() => setFilterTipo(t.value)}
          >{t.label}</button>
        ))}
      </div>

      <div className="filter-row" style={{ paddingTop: 0 }}>
        <button className={`filter-chip ${metric === 'distanza' ? 'active run' : ''}`} onClick={() => setMetric('distanza')}>
          Distanza
        </button>
        <button className={`filter-chip ${metric === 'passo' ? 'active run' : ''}`} onClick={() => setMetric('passo')}>
          Passo medio
        </button>
        <button className={`filter-chip ${metric === 'fcMedia' ? 'active run' : ''}`} onClick={() => setMetric('fcMedia')}>
          Freq. cardiaca
        </button>
      </div>

      {chartData.length < 2 ? (
        <div className="empty-state" style={{ padding: '40px 32px' }}>
          <div className="empty-state-icon">📈</div>
          <h3>Dati insufficienti</h3>
          <p>Servono almeno 2 sessioni con questo filtro per vedere il grafico</p>
        </div>
      ) : (
        <div className="px-16">
          <div className="card card-body">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
              {metric === 'distanza' ? 'Distanza (km)' :
               metric === 'passo' ? 'Passo medio (min/km) — valori più bassi = più veloci' :
               'Frequenza cardiaca media (bpm)'}
            </div>
            <div className="chart-wrap" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    tickFormatter={metric === 'passo' ? secondsToPace : undefined}
                    reversed={metric === 'passo'}
                  />
                  <Tooltip content={<CustomTooltip metric={metric} />} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="var(--run)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--run)', r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="stats-row" style={{ marginTop: 12 }}>
            <div className="stat-box">
              <div className="stat-value text-run">{avgDistanza}</div>
              <div className="stat-label">km medi</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{bestPace ? secondsToPace(bestPace) : '—'}</div>
              <div className="stat-label">miglior passo</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{avgFc}</div>
              <div className="stat-label">FC media</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{chartData.length}</div>
              <div className="stat-label">sessioni</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
