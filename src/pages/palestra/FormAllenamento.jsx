import { useState, useEffect } from 'react';
import { getAllExercises, addWorkout, updateWorkout } from '../../db.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const DEFAULT_EQUIPMENT = ['Bilanciere', 'Manubri', 'Macchina', 'Cavo', 'Corpo libero', 'Kettlebell', 'Banda elastica', 'TRX'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function SetRow({ set, index, onChange, onDelete }) {
  return (
    <div className="set-row">
      <div className="set-num">{index + 1}</div>
      <input
        type="number"
        placeholder="Rip."
        min="1"
        value={set.ripetizioni || ''}
        onChange={e => onChange({ ...set, ripetizioni: e.target.value })}
        style={{ maxWidth: 60 }}
      />
      <input
        type="number"
        placeholder="Kg"
        min="0"
        step="0.5"
        value={set.kg || ''}
        onChange={e => onChange({ ...set, kg: e.target.value })}
        style={{ maxWidth: 70 }}
      />
      <input
        list="equipment-list"
        placeholder="Attrezzo"
        value={set.attrezzatura || ''}
        onChange={e => onChange({ ...set, attrezzatura: e.target.value })}
        style={{
          flex: 1,
          background: 'var(--surface3)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text)',
          fontSize: 13,
          padding: '7px 8px',
          outline: 'none',
          minWidth: 0,
        }}
      />
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 16, cursor: 'pointer', padding: 4 }}
      >✕</button>
    </div>
  );
}

function ExerciseBlock({ block, exercises, onUpdate, onDelete }) {
  const ex = exercises.find(e => e.id === block.esercizioId);

  function addSet() {
    const lastSet = block.serie[block.serie.length - 1] || {};
    onUpdate({
      ...block,
      serie: [...block.serie, { ripetizioni: lastSet.ripetizioni || '', kg: lastSet.kg || '', attrezzatura: lastSet.attrezzatura || '' }]
    });
  }

  function updateSet(i, set) {
    const serie = [...block.serie];
    serie[i] = set;
    onUpdate({ ...block, serie });
  }

  function deleteSet(i) {
    const serie = block.serie.filter((_, idx) => idx !== i);
    onUpdate({ ...block, serie });
  }

  return (
    <div className="card" style={{ margin: '0 0 12px' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, flex: 1, fontSize: 15 }}>{block.esercizioNome}</span>
        {ex?.gruppoMuscolare && <span className="badge">{ex.gruppoMuscolare}</span>}
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 18, cursor: 'pointer', padding: 4 }}
        >✕</button>
      </div>
      <div style={{ padding: '8px 14px 4px' }}>
        <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4, paddingLeft: 32 }}>
          <span style={{ minWidth: 60, textAlign: 'center' }}>RIP.</span>
          <span style={{ minWidth: 70, textAlign: 'center' }}>KG</span>
          <span style={{ flex: 1, paddingLeft: 8 }}>ATTREZZO</span>
        </div>
        {block.serie.map((s, i) => (
          <SetRow key={i} set={s} index={i} onChange={set => updateSet(i, set)} onDelete={() => deleteSet(i)} />
        ))}
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8, marginBottom: 8, width: '100%' }}
          onClick={addSet}
        >+ Aggiungi serie</button>
      </div>
    </div>
  );
}

function ExercisePicker({ exercises, selected, onPick, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = exercises.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) &&
    !selected.includes(e.id)
  );

  return (
    <Modal title="Scegli esercizio" onClose={onClose}>
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>🔍</span>
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca esercizio…"
          autoFocus
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          {exercises.length === 0
            ? 'Aggiungi prima esercizi alla libreria'
            : 'Nessun risultato'}
        </div>
      ) : (
        <div style={{ margin: '0 -20px' }}>
          {filtered.map(ex => (
            <div key={ex.id} className="list-item" onClick={() => { onPick(ex); onClose(); }}>
              {ex.immagine
                ? <img src={ex.immagine} className="exercise-img" alt="" />
                : <div className="exercise-img-placeholder" style={{ fontSize: 16 }}>🏋️</div>
              }
              <div className="list-item-body">
                <div className="list-item-title">{ex.nome}</div>
                <div className="list-item-sub"><span className="badge">{ex.gruppoMuscolare}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function FormAllenamento({ initial, onSave, onClose }) {
  const [data, setData] = useState(initial?.data || todayStr());
  const [note, setNote] = useState(initial?.note || '');
  const [esercizi, setEsercizi] = useState(initial?.esercizi || []);
  const [exercises, setExercises] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const toast = useToast();

  useEffect(() => { getAllExercises().then(setExercises); }, []);

  function pickExercise(ex) {
    setEsercizi(prev => [...prev, {
      esercizioId: ex.id,
      esercizioNome: ex.nome,
      serie: [{ ripetizioni: '', kg: '', attrezzatura: '' }]
    }]);
  }

  function updateBlock(i, block) {
    const arr = [...esercizi];
    arr[i] = block;
    setEsercizi(arr);
  }

  function deleteBlock(i) {
    setEsercizi(esercizi.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!data) { toast('Inserisci la data', 'error'); return; }
    if (esercizi.length === 0) { toast('Aggiungi almeno un esercizio', 'error'); return; }
    const workout = { ...initial, data, note, esercizi };
    await onSave(workout);
  }

  return (
    <Modal
      title={initial?.id ? 'Modifica allenamento' : 'Nuovo allenamento'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary flex-1" onClick={handleSave}>Salva</button>
        </>
      }
    >
      <datalist id="equipment-list">
        {DEFAULT_EQUIPMENT.map(e => <option key={e} value={e} />)}
      </datalist>

      <div className="form-group">
        <label className="form-label">Data allenamento</label>
        <input type="date" className="form-input" value={data} onChange={e => setData(e.target.value)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="form-label" style={{ margin: 0 }}>Esercizi</label>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPicker(true)}>+ Esercizio</button>
        </div>

        {esercizi.length === 0 ? (
          <div
            onClick={() => setShowPicker(true)}
            style={{
              border: '2px dashed var(--border2)',
              borderRadius: 'var(--radius)',
              padding: '28px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Tocca per aggiungere esercizi
          </div>
        ) : (
          esercizi.map((block, i) => (
            <ExerciseBlock
              key={i}
              block={block}
              exercises={exercises}
              onUpdate={b => updateBlock(i, b)}
              onDelete={() => deleteBlock(i)}
            />
          ))
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Note allenamento</label>
        <textarea
          className="form-input"
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Come ti sei sentito, recupero, sensazioni…"
        />
      </div>

      {showPicker && (
        <ExercisePicker
          exercises={exercises}
          selected={esercizi.map(e => e.esercizioId)}
          onPick={pickExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </Modal>
  );
}
