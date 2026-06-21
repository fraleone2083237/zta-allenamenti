import { useEffect } from 'react';

export default function Modal({ title, children, footer, onClose, center = false }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className={`modal-overlay ${center ? 'center' : ''}`} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${center ? 'center' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose} style={{ background: 'none', border: 'none' }}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
