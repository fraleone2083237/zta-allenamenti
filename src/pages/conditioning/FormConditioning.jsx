import { useState, useEffect } from 'react';
import { getAllConditioningExercises } from '../../db.js';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const MODALITA = [
  { value: 'amrap', label: 'AMRAP', desc: 'Più round possibili in un tempo dato' },
  { value: 'emom', label: 'EMOM', desc: 'Un esercizio/round ogni minuto' },
  { value: 'tabata', label: 'Tabata', desc: 'Intervalli lavoro/recupero fissi' },
  { value: 'perTempo', label: 'Per tempo', desc: 'Round fissi, a cronometro' },
  { value: 'roundFissi', label: 'Round fissi', desc: 'Round fissi senza timer' },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function ExPicker({ exercises, onPick, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = exercises.filter(e => e.nome.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal title="Scegli dalla libreria" onClose={onClose}>
      <div style={{ marginBottom: 12, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>🔍</span>
        <input className="form-input" style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca…" autoFocus />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          {exercises.length === 0 ? 'Libreria vuota — aggiungi esercizi dalla tab Esercizi' : 'Nessun risultato'}
        </div>
      ) : (
        <div style={{ margin: '0 -20px' }}>
          {filtered.map(ex => (
            <div key={ex.id} className="list-item" onClick={() => { onPick(ex.nome); onClose(); }}>
              <div className="list-item-body">
                <div className="list-item-title">{ex.nome}</div>
                <div className="list-item-sub"><span className="badge cond">{ex.categoria}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function BloccoCard({ blocco, index, exercises, onUpdate, onDelete }) {
  const [pickerFor, setPickerFor] = useState(null);

  function setField(key, val) { onUpdate({ ...blocco, [key]: val }); }

  function addEsercizio() {
    onUpdate({ ...blocco, esercizi: [...(blocco.esercizi || []), { nome: '', reps: '', peso: '' }] });
  }

  function updateEx(i, field, val) {
    const arr = [...(blocco.esercizi || [])];
    arr[i] = { ...arr[i], [field]: val };
    onUpdate({ ...blocco, esercizi: arr });
  }

  function deleteEx(i) {
    onUpdate({ ...blocco, esercizi: (blocco.esercizi || []).filter((_, idx) => idx !== i) });
  }

  const m = blocco.modalita || 'amrap';

  return (
    <div className="block-card">
      <div className="block-header">
        <span className="block-header-title">Blocco {index + 1}</span>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>
      <div className="block-body">
        <div className="form-group">
          <label className="form-label">Modalità</label>
          <select className="form-select" value={m} onChange={e => setField('modalita', e.target.value)}>
            {MODALITA.map(mo => <option key={mo.value} value={mo.value}>{mo.label} — {mo.desc}</option>)}
          </select>
        </div>

        {/* Conditional fields by modalità */}
        {m === 'amrap' && (
          <div className="form-group">
            <label className="form-label">Durata (minuti)</label>
            <input className="form-input cond" type="number" placeholder="10" value={blocco.durata || ''} onChange={e => setField('durata', e.target.value)} style={{ maxWidth: 120 }} />
          </div>
        )}
        {m === 'emom' && (
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Durata totale (min)</label>
              <input className="form-input cond" type="number" placeholder="12" value={blocco.durata || ''} onChange={e => setField('durata', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Intervallo (sec)</label>
              <input className="form-input cond" type="number" placeholder="60" value={blocco.intervallo || ''} onChange={e => setField('intervallo', e.target.value)} />
            </div>
          </div>
        )}
        {m === 'tabata' && (
          <div className="form-row-3" style={{ marginBottom: 16 }}>
            <div>
              <label className="form-label">Lavoro (sec)</label>
              <input className="form-input cond" type="number" placeholder="20" value={blocco.durataLavoro || ''} onChange={e => setField('durataLavoro', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Recupero (sec)</label>
              <input className="form-input cond" type="number" placeholder="10" value={blocco.durataRecupero || ''} onChange={e => setField('durataRecupero', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Round</label>
              <input className="form-input cond" type="number" placeholder="8" value={blocco.rounds || ''} onChange={e => setField('rounds', e.target.value)} />
            </div>
          </div>
        )}
        {m === 'perTempo' && (
          <div className="form-group">
            <label className="form-label">Round target (opzionale)</label>
            <input className="form-input cond" type="number" placeholder="5" value={blocco.rounds || ''} onChange={e => setField('rounds', e.target.value)} style={{ maxWidth: 120 }} />
          </div>
        )}
        {m === 'roundFissi' && (
          <div className="form-group">
            <label className="form-label">Numero round</label>
            <input className="form-input cond" type="number" placeholder="5" value={blocco.rounds || ''} onChange={e => setField('rounds', e.target.value)} style={{ maxWidth: 120 }} />
          </div>
        )}

        {/* Esercizi */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="form-label" style={{ margin: 0 }}>Esercizi nel blocco</label>
          </div>
          {(blocco.esercizi || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>Aggiungi almeno un esercizio</div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                <span style={{ flex: 2, paddingLeft: 4 }}>ESERCIZIO</span>
                <span style={{ flex: 1, textAlign: 'center' }}>REPS/LAVORO</span>
                <span style={{ flex: 1, textAlign: 'center' }}>PESO</span>
                <span style={{ width: 24 }}></span>
              </div>
              {(blocco.esercizi || []).map((ex, i) => (
                <div key={i} className="block-ex-row">
                  <div style={{ flex: 2, display: 'flex', gap: 4, minWidth: 0 }}>
                    <input
                      className="block-ex-name"
                      placeholder="Nome esercizio"
                      value={ex.nome || ''}
                      onChange={e => updateEx(i, 'nome', e.target.value)}
                    />
                    <button
                      onClick={() => setPickerFor(i)}
                      style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', padding: '0 4px', color: 'var(--cond-light)', flexShrink: 0 }}
                      title="Scegli dalla libreria"
                    >📚</button>
                  </div>
                  <input
                    className="block-ex-input"
                    style={{ flex: 1 }}
                    placeholder={m === 'tabata' ? '20sec' : '10'}
                    value={ex.reps || ''}
                    onChange={e => updateEx(i, 'reps', e.target.value)}
                  />
                  <input
                    className="block-ex-input"
                    style={{ flex: 1 }}
                    placeholder="peso"
                    value={ex.peso || ''}
                    onChange={e => updateEx(i, 'peso', e.target.value)}
                  />
                  <button
                    onClick={() => deleteEx(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 14, cursor: 'pointer', width: 24, padding: 0, flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}
            </>
          )}
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%' }} onClick={addEsercizio}>
            + Aggiungi esercizio
          </button>
        </div>
      </div>

      {pickerFor !== null && (
        <ExPicker
          exercises={exercises}
          onPick={nome => updateEx(pickerFor, 'nome', nome)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}

export default function FormConditioning({ initial, onSave, onClose }) {
  const [data, setData] = useState(initial?.data || todayStr());
  const [blocchi, setBlocchi] = useState(initial?.blocchi || []);
  const [tempoTotale, setTempoTotale] = useState(initial?.tempoTotale || '');
  const [roundCompletati, setRoundCompletati] = useState(initial?.roundCompletati || '');
  const [rpe, setRpe] = useState(initial?.rpe || null);
  const [note, setNote] = useState(initial?.note || '');
  const [exercises, setExercises] = useState([]);
  const toast = useToast();

  useEffect(() => { getAllConditioningExercises().then(setExercises); }, []);

  function addBlocco() {
    setBlocchi(prev => [...prev, { modalita: 'amrap', durata: '', esercizi: [] }]);
  }

  function updateBlocco(i, b) {
    const arr = [...blocchi]; arr[i] = b; setBlocchi(arr);
  }

  function deleteBlocco(i) { setBlocchi(blocchi.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    if (!data) { toast('Inserisci la data', 'error'); return; }
    if (blocchi.length === 0) { toast('Aggiungi almeno un blocco', 'error'); return; }
    await onSave({ ...initial, data, blocchi, tempoTotale, roundCompletati, rpe, note });
  }

  return (
    <Modal
      title={initial?.id ? 'Modifica sessione' : 'Nuova sessione conditioning'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-cond flex-1" onClick={handleSave}>Salva</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Data</label>
        <input type="date" className="form-input cond" value={data} onChange={e => setData(e.target.value)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="form-label" style={{ margin: 0 }}>Blocchi</label>
          <button className="btn btn-cond btn-sm" onClick={addBlocco}>+ Blocco</button>
        </div>
        {blocchi.length === 0 ? (
          <div
            onClick={addBlocco}
            style={{ border: '2px dashed var(--border2)', borderRadius: 'var(--radius)', padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
          >
            Tocca per aggiungere il primo blocco
          </div>
        ) : (
          blocchi.map((b, i) => (
            <BloccoCard
              key={i}
              blocco={b}
              index={i}
              exercises={exercises}
              onUpdate={b => updateBlocco(i, b)}
              onDelete={() => deleteBlocco(i)}
            />
          ))
        )}
      </div>

      <div className="divider" />
      <div className="form-group">
        <label className="form-label">Risultati sessione</label>
      </div>
      <div className="form-row" style={{ marginBottom: 16 }}>
        <div>
          <label className="form-label">Tempo totale</label>
          <input className="form-input cond" placeholder="45:00" value={tempoTotale} onChange={e => setTempoTotale(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Round completati</label>
          <input className="form-input cond" type="number" placeholder="8" value={roundCompletati} onChange={e => setRoundCompletati(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">RPE — Intensità percepita (1-10)</label>
        <div className="rpe-row">
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} className={`rpe-btn ${rpe === n ? 'active' : ''}`} onClick={() => setRpe(rpe === n ? null : n)}>{n}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Note</label>
        <textarea className="form-input cond" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Sensazioni, difficoltà, note tecniche…" />
      </div>
    </Modal>
  );
}
