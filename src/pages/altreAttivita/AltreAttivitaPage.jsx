import { useState, useEffect } from 'react';
import { getAllOtherActivities, addOtherActivity, updateOtherActivity, deleteOtherActivity, getOtherActivity } from '../../db.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const TIPI_DEFAULT = ['Padel', 'Calcetto', 'Tennis', 'Nuoto', 'Ciclismo', 'Yoga', 'Pilates', 'Boxe', 'Arrampicata', 'Escursionismo', 'Sci', 'Basket', 'Volleyball', 'Golf'];

const TIPO_EMOJI = {
  'Padel': '🏓', 'Calcetto': '⚽', 'Tennis': '🎾', 'Nuoto': '🏊', 'Ciclismo': '🚴',
  'Yoga': '🧘', 'Pilates': '🤸', 'Boxe': '🥊', 'Arrampicata': '🧗', 'Escursionismo': '🥾',
  'Sci': '⛷️', 'Basket': '🏀', 'Volleyball': '🏐', 'Golf': '⛳',
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function ActivityModal({ initial, onSave, onClose }) {
  const [data, setData] = useState(initial?.data || todayStr());
  const [tipo, setTipo] = useState(initial?.tipo || '');
  const [durata, setDurata] = useState(initial?.durata || '');
  const [note, setNote] = useState(initial?.note || '');
  const [extra, setExtra] = useState(initial?.extra || '');

  return (
    <Modal
      title={initial?.id ? 'Modifica attività' : 'Nuova attività'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button
            className="btn btn-other flex-1"
            onClick={() => tipo.trim() && onSave({ ...initial, data, tipo: tipo.trim(), durata, note, extra })}
            disabled={!tipo.trim()}
          >Salva</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Data</label>
        <input type="date" className="form-input other" value={data} onChange={e => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Tipo di attività *</label>
        <input
          className="form-input other"
          list="tipi-list"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          placeholder="es. Padel, Tennis…"
          autoFocus
        />
        <datalist id="tipi-list">
          {TIPI_DEFAULT.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>

      <div className="form-group">
        <label className="form-label">Durata (min o HH:MM)</label>
        <input className="form-input other" placeholder="90 oppure 1:30" value={durata} onChange={e => setDurata(e.target.value)} style={{ maxWidth: '60%' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Info aggiuntive (opzionale)</label>
        <input className="form-input other" value={extra} onChange={e => setExtra(e.target.value)} placeholder='es. "3-2 set vinti", "10 vasche", punteggio…' />
      </div>

      <div className="form-group">
        <label className="form-label">Note</label>
        <textarea className="form-input other" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Come è andata, con chi, dove…" />
      </div>
    </Modal>
  );
}

export default function AltreAttivitaPage({ pending, clearPending }) {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterTipo, setFilterTipo] = useState('');
  const toast = useToast();

  async function load() {
    const all = await getAllOtherActivities();
    setActivities(all.sort((a, b) => b.data.localeCompare(a.data)));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.type === 'new' && pending.date) { setForm({ data: pending.date }); clearPending(); }
    else if (pending.type === 'edit' && pending.section === 'altro') {
      getOtherActivity(pending.id).then(a => { if (a) setForm(a); clearPending(); });
    }
  }, [pending]);

  async function handleSave(a) {
    if (a.id) { await updateOtherActivity(a); toast('Attività aggiornata'); }
    else { await addOtherActivity(a); toast('Attività salvata'); }
    setForm(null); load();
  }

  async function handleDelete(a) {
    await deleteOtherActivity(a.id); toast('Attività eliminata');
    setDeleteConfirm(null); load();
  }

  const tipiPresenti = [...new Set(activities.map(a => a.tipo))].sort();
  const filtered = filterTipo ? activities.filter(a => a.tipo === filterTipo) : activities;

  return (
    <div>
      <div className="page-header">
        <div><h1>🎯 Altre Attività</h1></div>
      </div>

      <div className="filter-row">
        <button className={`filter-chip ${!filterTipo ? 'active other' : ''}`} onClick={() => setFilterTipo('')}>Tutti</button>
        {tipiPresenti.map(t => (
          <button key={t} className={`filter-chip ${filterTipo === t ? 'active other' : ''}`} onClick={() => setFilterTipo(t)}>
            {TIPO_EMOJI[t] || '🎯'} {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>Nessuna attività</h3>
          <p>Registra sport e attività extra come padel, nuoto, tennis…</p>
        </div>
      ) : (
        <div className="card" style={{ margin: '8px 16px' }}>
          {filtered.map(a => (
            <div key={a.id} className="list-item" onClick={() => setForm(a)}>
              <div className="list-item-icon other">
                <span style={{ fontSize: 20 }}>{TIPO_EMOJI[a.tipo] || '🎯'}</span>
              </div>
              <div className="list-item-body">
                <div className="list-item-title">{a.tipo}</div>
                <div className="list-item-sub" style={{ marginTop: 3 }}>
                  {formatDate(a.data)}
                  {a.durata && <span style={{ marginLeft: 6 }}>· {a.durata} min</span>}
                  {a.extra && <span style={{ marginLeft: 6, color: 'var(--other-light)', fontWeight: 600 }}>· {a.extra}</span>}
                </div>
                {a.note && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontStyle: 'italic' }}>{a.note}</div>}
              </div>
              <button
                className="btn-icon"
                onClick={e => { e.stopPropagation(); setDeleteConfirm(a); }}
                style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
              >🗑</button>
            </div>
          ))}
        </div>
      )}

      <button className="fab other" onClick={() => setForm({})}>+</button>

      {form !== null && (
        <ActivityModal initial={form?.id ? form : (form?.data ? form : null)} onSave={handleSave} onClose={() => setForm(null)} />
      )}
      {deleteConfirm && (
        <Modal title="Elimina attività" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20 }}>Vuoi eliminare l'attività del <strong>{formatDate(deleteConfirm.data)}</strong>?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
