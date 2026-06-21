export default function Navigation({ page, setPage }) {
  const items = [
    { id: 'dashboard', label: 'Home', emoji: '🏠', cls: '' },
    { id: 'palestra', label: 'Palestra', emoji: '🏋️', cls: '' },
    { id: 'corsa', label: 'Corsa', emoji: '🏃', cls: 'run' },
    { id: 'conditioning', label: 'Cond.', emoji: '⚡', cls: 'cond' },
    { id: 'menu', label: 'Altro', emoji: '☰', cls: 'menu' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.id}
          className={`nav-item ${page === item.id ? `active ${item.cls}` : ''}`}
          onClick={() => setPage(item.id)}
        >
          <span className="nav-emoji">{item.emoji}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
