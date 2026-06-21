import { useState } from 'react';
import LibreriaConditioning from './LibreriaConditioning.jsx';
import AllenamentiConditioning from './AllenamentiConditioning.jsx';
import GraficiConditioning from './GraficiConditioning.jsx';

export default function ConditioningPage({ pending, clearPending }) {
  const [tab, setTab] = useState('sessioni');

  return (
    <div>
      <div className="page-header">
        <div><h1>⚡ Conditioning</h1></div>
      </div>
      <div className="sub-tabs" style={{ top: 61 }}>
        <button className={`sub-tab ${tab === 'sessioni' ? 'active cond' : ''}`} onClick={() => setTab('sessioni')}>Sessioni</button>
        <button className={`sub-tab ${tab === 'esercizi' ? 'active cond' : ''}`} onClick={() => setTab('esercizi')}>Esercizi</button>
        <button className={`sub-tab ${tab === 'grafici' ? 'active cond' : ''}`} onClick={() => setTab('grafici')}>Grafici</button>
      </div>
      {tab === 'sessioni' && <AllenamentiConditioning pending={pending} clearPending={clearPending} />}
      {tab === 'esercizi' && <LibreriaConditioning />}
      {tab === 'grafici' && <GraficiConditioning />}
    </div>
  );
}
