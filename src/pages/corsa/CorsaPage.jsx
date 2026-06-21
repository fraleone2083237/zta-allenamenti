import { useState } from 'react';
import AllenamentiCorsa from './AllenamentiCorsa.jsx';
import GraficiCorsa from './GraficiCorsa.jsx';

export default function CorsaPage({ pending, clearPending }) {
  const [tab, setTab] = useState('sessioni');
  return (
    <div>
      <div className="page-header">
        <div><h1>🏃 Corsa</h1></div>
      </div>
      <div className="sub-tabs" style={{ top: 61 }}>
        <button className={`sub-tab ${tab === 'sessioni' ? 'active run' : ''}`} onClick={() => setTab('sessioni')}>Sessioni</button>
        <button className={`sub-tab ${tab === 'grafici' ? 'active run' : ''}`} onClick={() => setTab('grafici')}>Grafici</button>
      </div>
      {tab === 'sessioni' && <AllenamentiCorsa pending={pending} clearPending={clearPending} />}
      {tab === 'grafici' && <GraficiCorsa />}
    </div>
  );
}
