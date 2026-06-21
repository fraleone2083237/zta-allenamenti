import { useState, useEffect } from 'react';
import { getAllConditioningWorkouts } from '../../db.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatDateShort(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function GraficiConditioning() {
  const [sessions, setSessions] = useState([]);
  const [metric, setMetric] = useState('rpe');

  useEffect(() => {
    getAllConditioningWorkouts().then(ss => setSessions(ss.sort((a, b) => a.data.localeCompare(b.data))));
  }, []);

  const chartData = sessions
    .filter(s => {
      if (metric === 'rpe') return s.rpe;
      if (metric === 'round') return s.roundCompletati;
      return true;
    })
    .map(s => ({
      data: formatDateShort(s.data),
      rpe: s.rpe || null,
      round: parseInt(s.roundCompletati) || null,
      blocchi: s.blocchi?.length || null,
    }));

  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Nessun dato</h3>
        <p>Registra sessioni conditioning per vedere i grafici</p>
      </div>
    );
  }

  const avgRpe = sessions.filter(s => s.rpe).length
    ? (sessions.filter(s => s.rpe).reduce((s, w) => s + w.rpe, 0) / sessions.filter(s => s.rpe).length).toFixed(1)
    : '—';
  const maxRound = Math.max(0, ...sessions.map(s => parseInt(s.roundCompletati) || 0)) || '—';
  const totalSessions = sessions.length;

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="filter-row">
        <button className={`filter-chip ${metric === 'rpe' ? 'active cond' : ''}`} onClick={() => setMetric('rpe')}>RPE</button>
        <button className={`filter-chip ${metric === 'round' ? 'active cond' : ''}`} onClick={() => setMetric('round')}>Round completati</button>
        <button className={`filter-chip ${metric === 'blocchi' ? 'active cond' : ''}`} onClick={() => setMetric('blocchi')}>Blocchi/sessione</button>
      </div>

      {chartData.length < 2 ? (
        <div className="empty-state" style={{ padding: '40px 32px' }}>
          <div className="empty-state-icon">📈</div>
          <h3>Dati insufficienti</h3>
          <p>Servono almeno 2 sessioni con {metric === 'rpe' ? 'RPE registrato' : 'i dati selezionati'}</p>
        </div>
      ) : (
        <div className="px-16">
          <div className="card card-body">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700 }}>
              {metric === 'rpe' ? 'RPE nel tempo (1-10)' :
               metric === 'round' ? 'Round completati per sessione' : 'Blocchi per sessione'}
            </div>
            <div className="chart-wrap" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={metric === 'rpe' ? [1, 10] : ['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="var(--cond)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--cond)', r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                    name={metric === 'rpe' ? 'RPE' : metric === 'round' ? 'Round' : 'Blocchi'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="stats-row" style={{ marginTop: 12 }}>
            <div className="stat-box">
              <div className="stat-value text-cond">{totalSessions}</div>
              <div className="stat-label">sessioni</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{avgRpe}</div>
              <div className="stat-label">RPE medio</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{maxRound}</div>
              <div className="stat-label">max round</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
