import { useState, useEffect } from 'react';
import { getAllWorkouts, getAllExercises } from '../../db.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function formatDateShort(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}{p.unit || ''}
        </div>
      ))}
    </div>
  );
};

export default function GraficiPalestra() {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExId, setSelectedExId] = useState(null);
  const [metric, setMetric] = useState('maxKg');

  useEffect(() => {
    getAllWorkouts().then(ws => setWorkouts(ws.sort((a, b) => a.data.localeCompare(b.data))));
    getAllExercises().then(es => setExercises(es.sort((a, b) => a.nome.localeCompare(b.nome))));
  }, []);

  // Determine which exercises appear in workouts
  const exercisesInWorkouts = exercises.filter(ex =>
    workouts.some(w => w.esercizi?.some(e => e.esercizioId === ex.id))
  );

  useEffect(() => {
    if (exercisesInWorkouts.length && !selectedExId) {
      setSelectedExId(exercisesInWorkouts[0]?.id || null);
    }
  }, [exercisesInWorkouts.length]);

  const chartData = workouts
    .filter(w => w.esercizi?.some(e => e.esercizioId === selectedExId))
    .map(w => {
      const block = w.esercizi.find(e => e.esercizioId === selectedExId);
      const maxKg = Math.max(0, ...(block.serie?.map(s => parseFloat(s.kg) || 0) || [0]));
      const volume = block.serie?.reduce((s, set) => {
        return s + (parseFloat(set.ripetizioni) || 0) * (parseFloat(set.kg) || 0);
      }, 0) || 0;
      const totalReps = block.serie?.reduce((s, set) => s + (parseFloat(set.ripetizioni) || 0), 0) || 0;
      return {
        data: formatDateShort(w.data),
        maxKg: maxKg || null,
        volume: Math.round(volume) || null,
        totalReps: totalReps || null,
      };
    });

  const selectedEx = exercises.find(e => e.id === selectedExId);

  if (exercisesInWorkouts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Nessun dato</h3>
        <p>Registra degli allenamenti per vedere i grafici di progressione</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: '12px 16px 0' }}>
        <div className="form-group">
          <label className="form-label">Esercizio</label>
          <select
            className="form-select"
            value={selectedExId || ''}
            onChange={e => setSelectedExId(parseInt(e.target.value))}
          >
            {exercisesInWorkouts.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.nome}</option>
            ))}
          </select>
        </div>

        <div className="filter-row" style={{ padding: '0 0 12px' }}>
          <button className={`filter-chip ${metric === 'maxKg' ? 'active' : ''}`} onClick={() => setMetric('maxKg')}>
            Carico max
          </button>
          <button className={`filter-chip ${metric === 'volume' ? 'active' : ''}`} onClick={() => setMetric('volume')}>
            Volume
          </button>
          <button className={`filter-chip ${metric === 'totalReps' ? 'active' : ''}`} onClick={() => setMetric('totalReps')}>
            Rip. totali
          </button>
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className="empty-state" style={{ padding: '40px 32px' }}>
          <div className="empty-state-icon">📈</div>
          <h3>Dati insufficienti</h3>
          <p>Servono almeno 2 sessioni con <strong>{selectedEx?.nome}</strong> per vedere il grafico</p>
        </div>
      ) : (
        <div className="px-16">
          <div className="card card-body">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
              {selectedEx?.nome} —{' '}
              {metric === 'maxKg' ? 'Carico massimo (kg)' :
               metric === 'volume' ? 'Volume (kg × rip.)' : 'Ripetizioni totali'}
            </div>
            <div className="chart-wrap" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="var(--gym)"
                    strokeWidth={2.5}
                    dot={{ fill: 'var(--gym)', r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                    name={metric === 'maxKg' ? 'Kg max' : metric === 'volume' ? 'Volume' : 'Rip.'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini stats */}
          {chartData.length > 0 && (
            <div className="stats-row" style={{ marginTop: 12 }}>
              <div className="stat-box">
                <div className="stat-value text-gym">
                  {metric === 'maxKg'
                    ? Math.max(...chartData.map(d => d.maxKg || 0))
                    : metric === 'volume'
                    ? Math.max(...chartData.map(d => d.volume || 0))
                    : Math.max(...chartData.map(d => d.totalReps || 0))}
                </div>
                <div className="stat-label">massimo</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">
                  {Math.round(
                    chartData.reduce((s, d) => s + (d[metric] || 0), 0) / chartData.filter(d => d[metric]).length
                  ) || '—'}
                </div>
                <div className="stat-label">media</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{chartData.length}</div>
                <div className="stat-label">sessioni</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
