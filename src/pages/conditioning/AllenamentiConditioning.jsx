import { useState, useEffect } from 'react';
import { getAllConditioningWorkouts, addConditioningWorkout, updateConditioningWorkout, deleteConditioningWorkout, getConditioningWorkout } from '../../db.js';
import FormConditioning from './FormConditioning.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const MODALITA_LABEL = { amrap: 'AMRAP', emom: 'EMOM', tabata: 'Tabata', perTempo: 'Per tempo', roundFissi: 'Round fissi' };

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function SessionCard({ session, onClick, onDelete }) {
  const modalita = [...new Set((session.blocchi || []).map(b => MODALITA_LABEL[b.modalita] || b.modalita))];
  const totEsercizi = (session.blocchi || []).reduce((s, b) => s + (b.esercizi?.length || 0), 0);

  return (
    <div className="card" style={{ margin: '0 16px 10px' }}>
      <div className="list-item" style={{ borderBottom: '1px solid var(--border)' }} onClick={onClick}>
        <div className="list-item-icon cond">⚡</div>
        <div className="list-item-body">
          <div className="list-item-title">{formatDate(session.data)}</div>
          <div className="list-item-sub" style={{ marginTop: 4 }}>
            {modalita.map(m => <span key={m} className="badge cond" style={{ marginRight: 4 }}>{m}</span>)}
          </div>
        </div>
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
        >🗑</button>
      </div>

      <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Blocchi', value: session.blocchi?.length || '—' },
          { label: 'Esercizi', value: totEsercizi || '—' },
          { label: 'Tempo', value: session.tempoTotale || '—' },
          { label: 'RPE', value: session.rpe ? `${session.rpe}/10` : '—' },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: stat.label === 'RPE' ? 'var(--cond)' : 'var(--text)' }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {session.blocchi?.map((b, i) => (
        <div key={i} style={{ padding: '6px 14px', fontSize: 12, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="badge cond" style={{ fontSize: 10 }}>{MODALITA_LABEL[b.modalita]}</span>
          {b.durata && <span>{b.durata}min</span>}
          {b.rounds && <span>{b.rounds} round</span>}
          <span>· {b.esercizi?.map(e => e.nome).filter(Boolean).join(', ')}</span>
        </div>
      ))}

      {session.note && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          "{session.note}"
        </div>
      )}
    </div>
  );
}

export default function AllenamentiConditioning({ pending, clearPending }) {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const toast = useToast();

  async function load() {
    const all = await getAllConditioningWorkouts();
    setSessions(all.sort((a, b) => b.data.localeCompare(a.data)));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.type === 'new' && pending.date) { setForm({ data: pending.date }); clearPending(); }
    else if (pending.type === 'edit' && pending.section === 'conditioning') {
      getConditioningWorkout(pending.id).then(w => { if (w) setForm(w); clearPending(); });
    }
  }, [pending]);

  async function handleSave(session) {
    if (session.id) { await updateConditioningWorkout(session); toast('Sessione aggiornata'); }
    else { await addConditioningWorkout(session); toast('Sessione salvata'); }
    setForm(null); load();
  }

  async function handleDelete(s) {
    await deleteConditioningWorkout(s.id); toast('Sessione eliminata');
    setDeleteConfirm(null); load();
  }

  const months = [...new Set(sessions.map(s => s.data.slice(0, 7)))];
  const filtered = filterMonth ? sessions.filter(s => s.data.startsWith(filterMonth)) : sessions;

  function monthLabel(m) {
    const [y, mo] = m.split('-');
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  return (
    <div>
      <div className="filter-row">
        <button className={`filter-chip ${!filterMonth ? 'active cond' : ''}`} onClick={() => setFilterMonth('')}>Tutti</button>
        {months.map(m => (
          <button key={m} className={`filter-chip ${filterMonth === m ? 'active cond' : ''}`} onClick={() => setFilterMonth(m)}>{monthLabel(m)}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <h3>Nessuna sessione</h3>
          <p>Premi + per aggiungere il tuo primo allenamento conditioning</p>
        </div>
      ) : (
        <div style={{ paddingTop: 8 }}>
          {filtered.map(s => (
            <SessionCard key={s.id} session={s} onClick={() => setForm(s)} onDelete={() => setDeleteConfirm(s)} />
          ))}
        </div>
      )}

      <button className="fab cond" onClick={() => setForm({})}>+</button>

      {form !== null && (
        <FormConditioning initial={form?.id ? form : (form?.data ? form : null)} onSave={handleSave} onClose={() => setForm(null)} />
      )}
      {deleteConfirm && (
        <Modal title="Elimina sessione" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20 }}>Vuoi eliminare la sessione del <strong>{formatDate(deleteConfirm.data)}</strong>?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
