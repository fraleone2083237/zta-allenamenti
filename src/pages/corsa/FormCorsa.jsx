import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

const TIPI = [
  { value: 'lungo-lento', label: 'Lungo lento' },
  { value: 'fartlek', label: 'Fartlek' },
  { value: 'ripetute', label: 'Ripetute' },
  { value: 'ritmo', label: 'Ritmo' },
  { value: 'recupero', label: 'Recupero' },
  { value: 'altro', label: 'Altro / Libero' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function IntervalRow({ interval, index, onChange, onDelete }) {
  return (
    <div className="interval-card">
      <div className="interval-header">
        <span>Ripetuta {index + 1}</span>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}
        >✕</button>
      </div>
      <div className="form-row-3">
        <div>
          <label className="form-label">Dist. (km)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            placeholder="0.4"
            value={interval.distanza || ''}
            onChange={e => onChange({ ...interval, distanza: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Tempo</label>
          <input
            className="form-input"
            placeholder="1:45"
            value={interval.tempo || ''}
            onChange={e => onChange({ ...interval, tempo: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label">Recupero</label>
          <input
            className="form-input"
            placeholder="2:00"
            value={interval.recupero || ''}
            onChange={e => onChange({ ...interval, recupero: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default function FormCorsa({ initial, onSave, onClose }) {
  const [data, setData] = useState(initial?.data || todayStr());
  const [tipo, setTipo] = useState(initial?.tipo || 'lungo-lento');
  const [tipoAltro, setTipoAltro] = useState(initial?.tipoAltro || '');
  const [distanza, setDistanza] = useState(initial?.distanza || '');
  const [tempo, setTempo] = useState(initial?.tempo || '');
  const [passoMedio, setPassoMedio] = useState(initial?.passoMedio || '');
  const [fcMedia, setFcMedia] = useState(initial?.fcMedia || '');
  const [fcMax, setFcMax] = useState(initial?.fcMax || '');
  const [dislivello, setDislivello] = useState(initial?.dislivello || '');
  const [calorie, setCalorie] = useState(initial?.calorie || '');
  const [intervalli, setIntervalli] = useState(initial?.intervalli || []);
  const [note, setNote] = useState(initial?.note || '');
  const toast = useToast();

  const showIntervals = tipo === 'ripetute' || tipo === 'fartlek';

  function addInterval() {
    setIntervalli(prev => [...prev, { distanza: '', tempo: '', recupero: '' }]);
  }

  function updateInterval(i, val) {
    const arr = [...intervalli];
    arr[i] = val;
    setIntervalli(arr);
  }

  function deleteInterval(i) {
    setIntervalli(intervalli.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!data) { toast('Inserisci la data', 'error'); return; }
    const session = {
      ...initial,
      data, tipo, tipoAltro, distanza, tempo, passoMedio,
      fcMedia, fcMax, dislivello, calorie, intervalli, note,
    };
    await onSave(session);
  }

  return (
    <Modal
      title={initial?.id ? 'Modifica sessione' : 'Nuova corsa'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary flex-1" onClick={onClose}>Annulla</button>
          <button className="btn btn-run flex-1" onClick={handleSave}>Salva</button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Data</label>
        <input type="date" className="form-input run" value={data} onChange={e => setData(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Tipo di allenamento</label>
        <select className="form-select run" value={tipo} onChange={e => setTipo(e.target.value)}>
          {TIPI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {tipo === 'altro' && (
        <div className="form-group">
          <label className="form-label">Descrizione tipo</label>
          <input
            className="form-input run"
            value={tipoAltro}
            onChange={e => setTipoAltro(e.target.value)}
            placeholder="es. Trail, Progressivo…"
          />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label className="form-label">Statistiche Garmin</label>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>Distanza (km)</label>
            <input className="form-input run" type="number" step="0.01" placeholder="10.5" value={distanza} onChange={e => setDistanza(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>Tempo totale</label>
            <input className="form-input run" placeholder="1:02:30" value={tempo} onChange={e => setTempo(e.target.value)} />
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>Passo medio (min/km)</label>
            <input className="form-input run" placeholder="5:55" value={passoMedio} onChange={e => setPassoMedio(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>Dislivello (m)</label>
            <input className="form-input run" type="number" placeholder="150" value={dislivello} onChange={e => setDislivello(e.target.value)} />
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 10 }}>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>FC media (bpm)</label>
            <input className="form-input run" type="number" placeholder="145" value={fcMedia} onChange={e => setFcMedia(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 10 }}>FC massima (bpm)</label>
            <input className="form-input run" type="number" placeholder="172" value={fcMax} onChange={e => setFcMax(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label" style={{ fontSize: 10 }}>Calorie</label>
          <input className="form-input run" type="number" placeholder="650" value={calorie} onChange={e => setCalorie(e.target.value)} style={{ maxWidth: '48%' }} />
        </div>
      </div>

      {showIntervals && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="form-label" style={{ margin: 0 }}>Ripetute / Intervalli</label>
            <button className="btn btn-run btn-sm" onClick={addInterval}>+ Aggiungi</button>
          </div>
          {intervalli.length === 0 ? (
            <div
              onClick={addInterval}
              style={{ border: '2px dashed var(--border2)', borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
            >
              Tocca per aggiungere una ripetuta
            </div>
          ) : (
            intervalli.map((iv, i) => (
              <IntervalRow
                key={i}
                interval={iv}
                index={i}
                onChange={v => updateInterval(i, v)}
                onDelete={() => deleteInterval(i)}
              />
            ))
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Note</label>
        <textarea
          className="form-input run"
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Sensazioni, condizioni meteo, commenti…"
        />
      </div>
    </Modal>
  );
}
