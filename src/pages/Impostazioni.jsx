import { useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { exportAllData, importAllData } from '../db.js';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Impostazioni() {
  const fileRef = useRef();
  const [importConfirm, setImportConfirm] = useState(false);
  const [importData, setImportData] = useState(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const toast = useToast();

  const userEmail = auth.currentUser?.email || '';

  async function handleExport() {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allenamenti-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Backup esportato!');
    } catch { toast('Errore durante l\'esportazione', 'error'); }
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.exercises && !data.workouts && !data.runSessions && !data.conditioningWorkouts) {
          toast('File non valido', 'error'); return;
        }
        setImportData(data);
        setImportConfirm(true);
      } catch { toast('File JSON non valido', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function confirmImport() {
    try {
      await importAllData(importData);
      toast('Dati importati con successo!');
      setImportConfirm(false);
      setImportData(null);
    } catch { toast('Errore durante l\'importazione', 'error'); }
  }

  async function handleLogout() {
    await signOut(auth);
    setLogoutConfirm(false);
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>⚙️ Impostazioni</h1></div>
      </div>

      {/* Account */}
      <div className="section-title">Account</div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card card-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>👤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Accesso attivo</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{userEmail}</div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '8px 14px', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={() => setLogoutConfirm(true)}
            >
              Esci
            </button>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="section-title" style={{ marginTop: 8 }}>Backup dati</div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card card-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>📤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Esporta dati</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Scarica un file JSON con tutti gli allenamenti, le corse, le sessioni conditioning, le altre attività, le misurazioni corporee e la libreria esercizi.
              </div>
              <button className="btn btn-primary" onClick={handleExport}>Scarica backup JSON</button>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32 }}>📥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Importa dati</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Carica un backup JSON. <strong style={{ color: 'var(--red)' }}>Attenzione:</strong> i dati attuali verranno sostituiti completamente.
              </div>
              <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>Scegli file JSON</button>
              <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />
            </div>
          </div>
        </div>
      </div>

      {/* Archiviazione */}
      <div className="section-title" style={{ marginTop: 8 }}>Archiviazione</div>
      <div style={{ padding: '0 16px' }}>
        <div className="card card-body">
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 28 }}>☁️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Cloud sync (Firestore)</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I dati sono salvati su Firebase e sincronizzati automaticamente su tutti i dispositivi con il tuo account.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="section-title" style={{ marginTop: 8 }}>Informazioni</div>
      <div style={{ padding: '0 16px 24px' }}>
        <div className="card card-body">
          {[
            ['App', 'Allenamenti'],
            ['Versione', '3.0.0'],
            ['Backend', 'Firebase Firestore'],
            ['Piattaforma', 'Web (PWA)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modali */}
      {logoutConfirm && (
        <Modal title="Esci dall'account" onClose={() => setLogoutConfirm(false)} center>
          <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
            Sei sicuro di voler uscire? Potrai rientrare in qualsiasi momento con email e password.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => setLogoutConfirm(false)}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={handleLogout}>Esci</button>
          </div>
        </Modal>
      )}

      {importConfirm && importData && (
        <Modal title="Conferma importazione" onClose={() => { setImportConfirm(false); setImportData(null); }} center>
          <p style={{ lineHeight: 1.6, marginBottom: 16 }}>Stai per importare:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              ['Esercizi', importData.exercises?.length || 0, 'gym'],
              ['Allenamenti', importData.workouts?.length || 0, 'gym'],
              ['Corse', importData.runSessions?.length || 0, 'run'],
              ['Conditioning', importData.conditioningWorkouts?.length || 0, 'cond'],
              ['Altre att.', importData.otherActivities?.length || 0, 'other'],
              ['Misurazioni', importData.bodyMeasurements?.length || 0, 'cond'],
            ].map(([label, val, type]) => (
              <div key={label} className="stat-box">
                <div className={`stat-value text-${type}`}>{val}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
            ⚠️ I dati attuali verranno eliminati e sostituiti con quelli del backup.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary flex-1" onClick={() => { setImportConfirm(false); setImportData(null); }}>Annulla</button>
            <button className="btn btn-danger flex-1" onClick={confirmImport}>Importa</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
