import { useState, useEffect } from 'react';
import { getProfile, saveProfile, getAllBodyMeasurements, addBodyMeasurement, updateBodyMeasurement, deleteBodyMeasurement } from '../../db.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--cond)', fontWeight: 700 }}>{payload[0]?.value} {unit}</div>
    </div>
  );
};

const MEASURES = [
  { key: 'peso', label: 'Peso', unit: 'kg', emoji: '⚖️' },
  { key: 'vita', label: 'Vita', unit: 'cm', emoji: '📏' },
  { key: 'fianchi', label: 'Fianchi', unit: 'cm', emoji: '📏' },
  { key: 'braccio', label: 'Braccio', unit: 'cm', emoji: '💪' },
  { key: 'coscia', label: 'Coscia', unit: 'cm', emoji: '🦵' },
  { key: 'bf', label: 'Grasso Corp.', unit: '%', emoji: '📊' },
];

function MeasurementModal({ initial, onSave, onClose }) {
  const [data, setData] = useState(initial?.data || todayStr());
  const [vals, setVals] = useState({ peso: '', vita: '', fianchi: '', braccio: '', coscia: '', bf: '', ...initial });

  function set(key, v) { setVals(prev => ({ ...prev, [key]: v })); }

  return (
    <Modal
      title={initial?.id ? 'Modifica misurazione' : 'Nuova misurazione'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-cond flex-1" onClick={() => onSave({ ...vals, data })}>Salva</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Data</label>
        <input type="date" className="form-input cond" value={data} onChange={e => setData(e.target.value)} />
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>Compila solo i campi che vuoi registrare.</div>
      <div className="measure-grid">
        {MEASURES.map(m => (
          <div key={m.key} className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">{m.emoji} {m.label} ({m.unit})</label>
            <input
              className="form-input cond"
              type="number"
              step="0.1"
              placeholder="—"
              value={vals[m.key] || ''}
              onChange={e => set(m.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ProfiloPage() {
  const [profile, setProfile] = useState({ nome: '', cognome: '', dataNascita: '', altezza: '' });
  const [measurements, setMeasurements] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [measModal, setMeasModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [chartMetric, setChartMetric] = useState('peso');
  const toast = useToast();

  async function load() {
    const [p, m] = await Promise.all([getProfile(), getAllBodyMeasurements()]);
    setProfile(p);
    setMeasurements(m.sort((a, b) => a.data.localeCompare(b.data)));
  }

  useEffect(() => { load(); }, []);

  async function handleSaveProfile(p) {
    await saveProfile(p);
    setProfile(p);
    setEditingProfile(false);
    toast('Profilo aggiornato');
  }

  async function handleSaveMeas(m) {
    if (m.id) { await updateBodyMeasurement(m); toast('Misurazione aggiornata'); }
    else { await addBodyMeasurement(m); toast('Misurazione salvata'); }
    setMeasModal(null); load();
  }

  async function handleDeleteMeas(m) {
    await deleteBodyMeasurement(m.id); toast('Eliminata');
    setDeleteConfirm(null); load();
  }

  const chartData = measurements
    .filter(m => m[chartMetric] !== undefined && m[chartMetric] !== '' && m[chartMetric] !== null)
    .map(m => ({
      data: new Date(m.data + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      val: parseFloat(m[chartMetric]),
    }));

  const metricCfg = MEASURES.find(m => m.key === chartMetric) || MEASURES[0];

  const latestMeas = measurements[measurements.length - 1];

  function initials() {
    const n = (profile.nome || '').charAt(0).toUpperCase();
    const c = (profile.cognome || '').charAt(0).toUpperCase();
    return n + c || '?';
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="page-header">
        <div><h1>👤 Profilo</h1></div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(true)}>Modifica</button>
      </div>

      {/* Profile card */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div className="card card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--gym-dim)', border: '2px solid var(--gym)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: 'var(--gym-light)',
              flexShrink: 0,
            }}>{initials()}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {profile.nome || profile.cognome ? `${profile.nome} ${profile.cognome}`.trim() : 'Aggiungi il tuo nome'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile.altezza && `${profile.altezza} cm`}
                {profile.dataNascita && profile.altezza && ' · '}
                {profile.dataNascita && `Nato il ${formatDate(profile.dataNascita)}`}
              </div>
            </div>
          </div>
          {latestMeas && (
            <div className="stats-row" style={{ marginTop: 12 }}>
              {['peso', 'vita', 'fianchi', 'bf'].map(k => {
                const m = MEASURES.find(m => m.key === k);
                return latestMeas[k] ? (
                  <div key={k} className="stat-box">
                    <div className="stat-value" style={{ fontSize: 16 }}>{latestMeas[k]}</div>
                    <div className="stat-label">{m?.unit} {m?.label}</div>
                  </div>
                ) : null;
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="section-title">Andamento nel tempo</div>
      <div className="filter-row" style={{ paddingTop: 0 }}>
        {MEASURES.map(m => (
          <button key={m.key} className={`filter-chip ${chartMetric === m.key ? 'active cond' : ''}`} onClick={() => setChartMetric(m.key)}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {chartData.length < 2 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
          Aggiungi almeno 2 misurazioni per vedere il grafico
        </div>
      ) : (
        <div className="px-16" style={{ marginBottom: 8 }}>
          <div className="card card-body">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>
              {metricCfg.label} ({metricCfg.unit})
            </div>
            <div className="chart-wrap" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip unit={metricCfg.unit} />} />
                  <Line type="monotone" dataKey="val" stroke="var(--cond)" strokeWidth={2.5} dot={{ fill: 'var(--cond)', r: 4 }} connectNulls name={metricCfg.label} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Measurement list */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
        <div className="section-title">Storico misurazioni</div>
        <button className="btn btn-cond btn-sm" onClick={() => setMeasModal({})}>+ Nuova</button>
      </div>

      {measurements.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px 32px' }}>
          <div className="empty-state-icon">📏</div>
          <h3>Nessuna misurazione</h3>
          <p>Inizia a registrare peso e misure corporee</p>
        </div>
      ) : (
        <div className="card" style={{ margin: '0 16px' }}>
          {[...measurements].reverse().map(m => (
            <div key={m.id} className="list-item" onClick={() => setMeasModal(m)}>
              <div style={{ fontSize: 22 }}>📏</div>
              <div className="list-item-body">
                <div className="list-item-title">{formatDate(m.data)}</div>
                <div className="list-item-sub" style={{ marginTop: 3 }}>
                  {MEASURES.filter(mr => m[mr.key] !== '' && m[mr.key] !== null && m[mr.key] !== undefined)
                    .map(mr => `${mr.label}: ${m[mr.key]}${mr.unit}`)
                    .join(' · ')}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={e => { e.stopPropagation(); setDeleteConfirm(m); }}
                style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
              >🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Profile edit modal */}
      {editingProfile && (
        <ProfileEditModal profile={profile} onSave={handleSaveProfile} onClose={() => setEditingProfile(false)} />
      )}

      {measModal !== null && (
        <MeasurementModal initial={measModal?.id ? measModal : null} onSave={handleSaveMeas} onClose={() => setMeasModal(null)} />
      )}

      {deleteConfirm && (
        <Modal title="Elimina misurazione" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20 }}>Vuoi eliminare la misurazione del <strong>{formatDate(deleteConfirm.data)}</strong>?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDeleteMeas(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfileEditModal({ profile, onSave, onClose }) {
  const [nome, setNome] = useState(profile.nome || '');
  const [cognome, setCognome] = useState(profile.cognome || '');
  const [dataNascita, setDataNascita] = useState(profile.dataNascita || '');
  const [altezza, setAltezza] = useState(profile.altezza || '');

  return (
    <Modal
      title="Modifica profilo"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary flex-1" onClick={() => onSave({ nome, cognome, dataNascita, altezza })}>Salva</button>
        </>
      }
    >
      <div className="form-row" style={{ marginBottom: 16 }}>
        <div>
          <label className="form-label">Nome</label>
          <input className="form-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario" autoFocus />
        </div>
        <div>
          <label className="form-label">Cognome</label>
          <input className="form-input" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi" />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Data di nascita</label>
          <input type="date" className="form-input" value={dataNascita} onChange={e => setDataNascita(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Altezza (cm)</label>
          <input className="form-input" type="number" placeholder="178" value={altezza} onChange={e => setAltezza(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
