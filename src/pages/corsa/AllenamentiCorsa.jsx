import { useState, useEffect } from 'react';
import { getAllRunSessions, addRunSession, updateRunSession, deleteRunSession, getRunSession } from '../../db.js';
import FormCorsa from './FormCorsa.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const TIPO_LABELS = { 'lungo-lento': 'Lungo lento', 'fartlek': 'Fartlek', 'ripetute': 'Ripetute', 'ritmo': 'Ritmo', 'recupero': 'Recupero', 'altro': 'Libero' };
const TIPO_EMOJI = { 'lungo-lento': '🐢', 'fartlek': '⚡', 'ripetute': '🔁', 'ritmo': '⏱️', 'recupero': '😌', 'altro': '🏃' };

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function RunCard({ session, onClick, onDelete }) {
  return (
    <div className="card" style={{ margin: '0 16px 10px' }}>
      <div className="list-item" style={{ borderBottom: '1px solid var(--border)' }} onClick={onClick}>
        <div className="list-item-icon run">{TIPO_EMOJI[session.tipo] || '🏃'}</div>
        <div className="list-item-body">
          <div className="list-item-title">{formatDate(session.data)}</div>
          <div className="list-item-sub" style={{ marginTop: 4 }}>
            <span className="badge run">{TIPO_LABELS[session.tipo] || session.tipoAltro || session.tipo}</span>
          </div>
        </div>
        <button className="btn-icon" onClick={e => { e.stopPropagation(); onDelete(); }} style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}>🗑</button>
      </div>
      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Km', value: session.distanza || '—', color: 'var(--run)' },
          { label: 'Tempo', value: session.tempo || '—' },
          { label: 'Passo', value: session.passoMedio ? session.passoMedio + '/km' : '—' },
          { label: 'FC media', value: session.fcMedia ? session.fcMedia + ' bpm' : '—' },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: stat.color || 'var(--text)' }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      {session.intervalli?.length > 0 && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          {session.intervalli.length} ripetute{session.intervalli[0]?.distanza ? ` × ${session.intervalli[0].distanza}km` : ''}
        </div>
      )}
      {session.note && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{session.note}"</div>
      )}
    </div>
  );
}

export default function AllenamentiCorsa({ pending, clearPending }) {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterTipo, setFilterTipo] = useState('');
  const toast = useToast();

  async function load() {
    const all = await getAllRunSessions();
    setSessions(all.sort((a, b) => b.data.localeCompare(a.data)));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.type === 'new' && pending.date) { setForm({ data: pending.date }); clearPending(); }
    else if (pending.type === 'edit' && pending.section === 'corsa') {
      getRunSession(pending.id).then(s => { if (s) setForm(s); clearPending(); });
    }
  }, [pending]);

  async function handleSave(session) {
    if (session.id) { await updateRunSession(session); toast('Sessione aggiornata'); }
    else { await addRunSession(session); toast('Sessione salvata'); }
    setForm(null); load();
  }

  async function handleDelete(s) {
    await deleteRunSession(s.id); toast('Sessione eliminata');
    setDeleteConfirm(null); load();
  }

  const tipiPresenti = [...new Set(sessions.map(s => s.tipo))];
  const filtered = filterTipo ? sessions.filter(s => s.tipo === filterTipo) : sessions;

  return (
    <div>
      <div className="filter-row">
        <button className={`filter-chip ${!filterTipo ? 'active run' : ''}`} onClick={() => setFilterTipo('')}>Tutti</button>
        {tipiPresenti.map(t => (
          <button key={t} className={`filter-chip ${filterTipo === t ? 'active run' : ''}`} onClick={() => setFilterTipo(t)}>
            {TIPO_EMOJI[t]} {TIPO_LABELS[t] || t}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏃</div>
          <h3>Nessuna corsa</h3>
          <p>Premi + per registrare la tua prima sessione</p>
        </div>
      ) : (
        <div style={{ paddingTop: 8 }}>
          {filtered.map(s => <RunCard key={s.id} session={s} onClick={() => setForm(s)} onDelete={() => setDeleteConfirm(s)} />)}
        </div>
      )}
      <button className="fab run" onClick={() => setForm({})}>+</button>
      {form !== null && (
        <FormCorsa initial={form?.id ? form : (form?.data ? form : null)} onSave={handleSave} onClose={() => setForm(null)} />
      )}
      {deleteConfirm && (
        <Modal title="Elimina sessione" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20 }}>Vuoi eliminare la corsa del <strong>{formatDate(deleteConfirm.data)}</strong>?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
