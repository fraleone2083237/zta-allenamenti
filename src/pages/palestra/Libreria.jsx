import { useState, useEffect, useRef } from 'react';
import { getAllExercises, addExercise, updateExercise, deleteExercise } from '../../db.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const GRUPPI = ['Petto', 'Schiena', 'Gambe', 'Spalle', 'Braccia', 'Core', 'Glutei', 'Altro'];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ExerciseModal({ initial, onSave, onClose }) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [gruppo, setGruppo] = useState(initial?.gruppoMuscolare || 'Petto');
  const [note, setNote] = useState(initial?.note || '');
  const [img, setImg] = useState(initial?.immagine || null);
  const fileRef = useRef();

  async function handleImg(e) {
    const f = e.target.files[0];
    if (!f) return;
    const b64 = await fileToBase64(f);
    setImg(b64);
  }

  function handleSave() {
    if (!nome.trim()) return;
    onSave({ ...initial, nome: nome.trim(), gruppoMuscolare: gruppo, note, immagine: img });
  }

  const isEdit = !!initial?.id;

  return (
    <Modal
      title={isEdit ? 'Modifica esercizio' : 'Nuovo esercizio'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={!nome.trim()}>Salva</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Foto esercizio</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {img
            ? <img src={img} className="img-preview" alt="" onClick={() => fileRef.current.click()} style={{ cursor: 'pointer' }} />
            : <div className="img-upload-btn" onClick={() => fileRef.current.click()}>
                <span style={{ fontSize: 22 }}>📷</span>
                <span>Foto</span>
              </div>
          }
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              {img ? 'Cambia' : 'Scegli foto'}
            </button>
            {img && <button className="btn btn-ghost btn-sm" onClick={() => setImg(null)}>Rimuovi</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Nome esercizio *</label>
        <input
          className="form-input"
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="es. Panca piana"
          autoFocus={!isEdit}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Gruppo muscolare</label>
        <select className="form-select" value={gruppo} onChange={e => setGruppo(e.target.value)}>
          {GRUPPI.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Note (opzionale)</label>
        <textarea
          className="form-input"
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Tecnica, varianti, consigli…"
        />
      </div>
    </Modal>
  );
}

const GRUPPO_EMOJI = {
  Petto: '💪', Schiena: '🔙', Gambe: '🦵', Spalle: '🤷',
  Braccia: '💪', Core: '🎯', Glutei: '🍑', Altro: '🏋️'
};

export default function Libreria() {
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [filterGruppo, setFilterGruppo] = useState('Tutti');
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  async function load() {
    const all = await getAllExercises();
    setExercises(all.sort((a, b) => a.nome.localeCompare(b.nome)));
  }

  useEffect(() => { load(); }, []);

  async function handleSave(data) {
    if (data.id) {
      await updateExercise(data);
      toast('Esercizio aggiornato');
    } else {
      await addExercise(data);
      toast('Esercizio aggiunto');
    }
    setModal(null);
    load();
  }

  async function handleDelete(ex) {
    await deleteExercise(ex.id);
    toast('Esercizio eliminato');
    setDeleteConfirm(null);
    load();
  }

  const filtered = exercises.filter(e => {
    const matchSearch = e.nome.toLowerCase().includes(search.toLowerCase());
    const matchGruppo = filterGruppo === 'Tutti' || e.gruppoMuscolare === filterGruppo;
    return matchSearch && matchGruppo;
  });

  const gruppiPresenti = ['Tutti', ...GRUPPI.filter(g => exercises.some(e => e.gruppoMuscolare === g))];

  return (
    <div>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca esercizio…"
        />
      </div>

      <div className="filter-row">
        {gruppiPresenti.map(g => (
          <button key={g} className={`filter-chip ${filterGruppo === g ? 'active' : ''}`} onClick={() => setFilterGruppo(g)}>
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏋️</div>
          <h3>{exercises.length === 0 ? 'Libreria vuota' : 'Nessun risultato'}</h3>
          <p>{exercises.length === 0 ? 'Aggiungi i tuoi esercizi premendo il pulsante +' : 'Prova a cambiare i filtri'}</p>
        </div>
      ) : (
        <div className="card" style={{ margin: '8px 16px' }}>
          {filtered.map(ex => (
            <div key={ex.id} className="list-item" onClick={() => setModal(ex)}>
              {ex.immagine
                ? <img src={ex.immagine} className="exercise-img" alt="" />
                : <div className="exercise-img-placeholder">{GRUPPO_EMOJI[ex.gruppoMuscolare] || '🏋️'}</div>
              }
              <div className="list-item-body">
                <div className="list-item-title">{ex.nome}</div>
                <div className="list-item-sub" style={{ marginTop: 4 }}>
                  <span className="badge">{ex.gruppoMuscolare}</span>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={e => { e.stopPropagation(); setDeleteConfirm(ex); }}
                style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
              >🗑</button>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setModal({})}>+</button>

      {modal !== null && (
        <ExerciseModal
          initial={modal?.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteConfirm && (
        <Modal title="Elimina esercizio" onClose={() => setDeleteConfirm(null)} center>
          <p style={{ marginBottom: 20, lineHeight: 1.6 }}>
            Vuoi eliminare <strong>{deleteConfirm.nome}</strong>?
            <br />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Gli allenamenti già salvati non verranno modificati.
            </span>
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Elimina</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
