import { useState, useEffect } from 'react';
import { getAllWorkouts, addWorkout, updateWorkout, deleteWorkout, getWorkout } from '../../db.js';
import FormAllenamento from './FormAllenamento.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

function formatDate(s) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function WorkoutCard({ workout, onClick, onDelete }) {
  const totalSerie = workout.esercizi?.reduce((s, e) => s + (e.serie?.length || 0), 0) || 0;
  return (
    <div className="card" style={{ margin: '0 16px 10px' }}>
      <div className="list-item" style={{ borderBottom: workout.esercizi?.length ? '1px solid var(--border)' : 'none' }} onClick={onClick}>
        <div className="list-item-icon">🏋️</div>
        <div className="list-item-body">
          <div className="list-item-title">{formatDate(workout.data)}</div>
          <div className="list-item-sub" style={{ marginTop: 4 }}>
            <span className="badge">{workout.esercizi?.length || 0} esercizi</span>
            {' '}<span className="badge muted">{totalSerie} serie</span>
          </div>
        </div>
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
        >🗑</button>
      </div>
      {workout.esercizi?.slice(0, 3).map((e, i) => (
        <div key={i} style={{ padding: '8px 14px', fontSize: 13, borderBottom: i < Math.min(workout.esercizi.length, 3) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>{e.esercizioNome}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {e.serie?.length}×{e.serie?.map(s => s.ripetizioni).filter(Boolean).join('/')}
            {e.serie?.some(s => s.kg) ? ` @ ${Math.max(...e.serie.map(s => parseFloat(s.kg) || 0))}kg` : ''}
          </span>
        </div>
      ))}
      {(workout.esercizi?.length || 0) > 3 && (
        <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-dim)' }}>+{workout.esercizi.length - 3} altri esercizi…</div>
      )}
      {workout.note && (
        <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', fontStyle: 'italic' }}>"{workout.note}"</div>
      )}
    </div>
  );
}

export default function AllenamentiPalestra({ pending, clearPending }) {
  const [workouts, setWorkouts] = useState([]);
  const [form, setForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const toast = useToast();

  async function load() {
    const all = await getAllWorkouts();
    setWorkouts(all.sort((a, b) => b.data.localeCompare(a.data)));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!pending) return;
    if (pending.type === 'new' && pending.date) { setForm({ data: pending.date }); clearPending(); }
    else if (pending.type === 'edit' && pending.section === 'palestra') {
      getWorkout(pending.id).then(w => { if (w) setForm(w); clearPending(); });
    }
  }, [pending]);

  async function handleSave(workout) {
    if (workout.id) { await updateWorkout(workout); toast('Allenamento aggiornato'); }
    else { await addWorkout(workout); toast('Allenamento salvato'); }
    setForm(null); load();
  }

  async function handleDelete(w) {
    await deleteWorkout(w.id); toast('Allenamento eliminato');
    setDeleteConfirm(null); load();
  }

  const months = [...new Set(workouts.map(w => w.data.slice(0, 7)))];
  const filtered = filterMonth ? workouts.filter(w => w.data.startsWith(filterMonth)) : workouts;

  function monthLabel(m) {
    const [y, mo] = m.split('-');
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }

  return (
    <div>
      <div className="filter-row">
        <button className={`filter-chip ${!filterMonth ? 'active' : ''}`} onClick={() => setFilterMonth('')}>Tutti</button>
        {months.map(m => (
          <button key={m} className={`filter-chip ${filterMonth === m ? 'active' : ''}`} onClick={() => setFilterMonth(m)}>{monthLabel(m)}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Nessun allenamento</h3>
          <p>Premi + per registrare il tuo primo allenamento</p>
        </div>
      ) : (
        <div style={{ paddingTop: 8 }}>
          {filtered.map(w => (
            <WorkoutCard key={w.id} workout={w} onClick={() => setForm(w)} onDelete={() => setDeleteConfirm(w)} />
          ))}
        </div>
      )}
      <button className="fab" onClick={() => setForm({})}>+</button>
      {form !== null && (
        <FormAllenamento initial={form?.id ? form : (form?.data ? form : null)} onSave={handleSave} onClose={() => setForm(null)} />
      )}
      {deleteConfirm && (
        <Modal title="Elimina allenamento" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20 }}>Vuoi eliminare l'allenamento del <strong>{formatDate(deleteConfirm.data)}</strong>?</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
