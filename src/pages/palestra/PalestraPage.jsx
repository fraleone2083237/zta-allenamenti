import { useState } from 'react';
import Libreria from './Libreria.jsx';
import AllenamentiPalestra from './AllenamentiPalestra.jsx';
import GraficiPalestra from './GraficiPalestra.jsx';

export default function PalestraPage({ pending, clearPending }) {
  const [tab, setTab] = useState('allenamenti');

  return (
    <div>
      <div className="page-header">
        <div><h1>🏋️ Palestra</h1></div>
      </div>
      <div className="sub-tabs" style={{ top: 61 }}>
        <button className={`sub-tab ${tab === 'allenamenti' ? 'active' : ''}`} onClick={() => setTab('allenamenti')}>Allenamenti</button>
        <button className={`sub-tab ${tab === 'libreria' ? 'active' : ''}`} onClick={() => setTab('libreria')}>Esercizi</button>
        <button className={`sub-tab ${tab === 'grafici' ? 'active' : ''}`} onClick={() => setTab('grafici')}>Grafici</button>
      </div>
      {tab === 'allenamenti' && <AllenamentiPalestra pending={pending} clearPending={clearPending} />}
      {tab === 'libreria' && <Libreria />}
      {tab === 'grafici' && <GraficiPalestra />}
    </div>
  );
}
