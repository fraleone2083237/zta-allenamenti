export default function MenuPage({ setPage }) {
  const tiles = [
    { id: 'calendario', emoji: '📅', title: 'Calendario', sub: 'Tutte le attività', border: 'var(--gym)' },
    { id: 'altreAttivita', emoji: '🎯', title: 'Altre Attività', sub: 'Padel, calcetto…', border: 'var(--other)' },
    { id: 'profilo', emoji: '👤', title: 'Profilo', sub: 'Peso e misure', border: 'var(--cond)' },
    { id: 'impostazioni', emoji: '⚙️', title: 'Impostazioni', sub: 'Backup e dati', border: 'var(--text-muted)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>☰ Altro</h1>
        </div>
      </div>
      <div className="menu-grid">
        {tiles.map(t => (
          <div
            key={t.id}
            className="menu-tile"
            style={{ borderTop: `3px solid ${t.border}` }}
            onClick={() => setPage(t.id)}
          >
            <span className="menu-tile-icon">{t.emoji}</span>
            <span className="menu-tile-title">{t.title}</span>
            <span className="menu-tile-sub">{t.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
