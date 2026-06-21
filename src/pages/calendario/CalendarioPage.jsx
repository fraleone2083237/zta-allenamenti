import { useState, useEffect } from 'react';
import {
  getAllWorkouts, getAllRunSessions, getAllConditioningWorkouts, getAllOtherActivities
} from '../../db.js';
import Modal from '../../components/Modal.jsx';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTH_NAMES = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

const TYPE_CONFIG = {
  palestra: { color: 'var(--gym)', emoji: '🏋️', label: 'Palestra' },
  corsa: { color: 'var(--run)', emoji: '🏃', label: 'Corsa' },
  conditioning: { color: 'var(--cond)', emoji: '⚡', label: 'Conditioning' },
  altro: { color: 'var(--other)', emoji: '🎯', label: 'Altre attività' },
};

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function activitySummary(a) {
  if (a._type === 'palestra') return `${a.esercizi?.length || 0} esercizi`;
  if (a._type === 'corsa') return `${a.distanza || '?'} km · ${a.tipo || ''}`;
  if (a._type === 'conditioning') return `${a.blocchi?.length || 0} blocchi${a.rpe ? ` · RPE ${a.rpe}` : ''}`;
  if (a._type === 'altro') return a.tipo + (a.durata ? ` · ${a.durata} min` : '');
  return '';
}

// Monday = 0, Sunday = 6
function dayOfWeekMon(d) { return (d.getDay() + 6) % 7; }

function getWeekStart(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - dayOfWeekMon(r));
  return r;
}

export default function CalendarioPage({ onNavigate }) {
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState('month');
  const [activities, setActivities] = useState({});
  const [filterTypes, setFilterTypes] = useState(['palestra', 'corsa', 'conditioning', 'altro']);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayModal, setDayModal] = useState(false);
  const [quickAddModal, setQuickAddModal] = useState(false);

  useEffect(() => { loadActivities(); }, []);

  async function loadActivities() {
    const [workouts, runs, cond, other] = await Promise.all([
      getAllWorkouts(), getAllRunSessions(), getAllConditioningWorkouts(), getAllOtherActivities()
    ]);
    const byDate = {};
    const add = (items, type) => items.forEach(a => {
      const d = a.data;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({ ...a, _type: type });
    });
    add(workouts, 'palestra');
    add(runs, 'corsa');
    add(cond, 'conditioning');
    add(other, 'altro');
    setActivities(byDate);
  }

  function toggleFilter(type) {
    setFilterTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  function activitiesForDay(dateStr) {
    return (activities[dateStr] || []).filter(a => filterTypes.includes(a._type));
  }

  const today = toDateStr(new Date());

  // ── MONTH VIEW ──
  function renderMonth() {
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = dayOfWeekMon(new Date(year, month, 1));
    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

    return (
      <div>
        <div className="cal-grid">
          {DAY_LABELS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          {Array.from({ length: totalCells }, (_, i) => {
            const day = i - startOffset + 1;
            if (day < 1 || day > daysInMonth) return <div key={i} className="cal-day empty" />;
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayActs = activitiesForDay(dateStr);
            const isToday = dateStr === today;
            return (
              <div
                key={i}
                className={`cal-day ${isToday ? 'today' : ''}`}
                onClick={() => { setSelectedDay(dateStr); setDayModal(true); }}
              >
                <span className="cal-day-num">{day}</span>
                <div className="cal-dots">
                  {[...new Set(dayActs.map(a => a._type))].map(t => (
                    <span key={t} className="cal-dot" style={{ background: TYPE_CONFIG[t].color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── WEEK VIEW ──
  function renderWeek() {
    const weekStart = getWeekStart(current);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div style={{ padding: '0 12px 12px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, minWidth: 280 }}>
          {days.map((d, i) => {
            const dateStr = toDateStr(d);
            const dayActs = activitiesForDay(dateStr);
            const isToday = dateStr === today;
            return (
              <div key={i} style={{ cursor: 'pointer' }} onClick={() => { setSelectedDay(dateStr); setDayModal(true); }}>
                <div className="cal-week-header">{DAY_LABELS[i]}</div>
                <div
                  className="cal-week-day-num"
                  style={{ color: isToday ? 'var(--gym)' : 'var(--text)', fontWeight: isToday ? 800 : 600 }}
                >
                  {d.getDate()}
                </div>
                <div>
                  {dayActs.map((a, j) => (
                    <div key={j} className={`cal-week-activity ${a._type === 'corsa' ? 'run' : a._type === 'conditioning' ? 'cond' : a._type === 'altro' ? 'other' : ''}`}>
                      {TYPE_CONFIG[a._type].emoji} {activitySummary(a)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Navigation helpers
  function prevPeriod() {
    const d = new Date(current);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrent(d);
  }
  function nextPeriod() {
    const d = new Date(current);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrent(d);
  }

  const periodLabel = view === 'month'
    ? `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`
    : (() => {
        const ws = getWeekStart(current);
        const we = new Date(ws); we.setDate(we.getDate() + 6);
        return `${ws.getDate()} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`;
      })();

  const selectedActs = selectedDay ? activitiesForDay(selectedDay) : [];

  return (
    <div>
      <div className="page-header">
        <div><h1>📅 Calendario</h1></div>
      </div>

      {/* Filter chips */}
      <div className="filter-row" style={{ paddingBottom: 0 }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <button
            key={type}
            className="filter-chip"
            style={{
              background: filterTypes.includes(type) ? cfg.color : 'var(--surface)',
              borderColor: filterTypes.includes(type) ? cfg.color : 'var(--border)',
              color: filterTypes.includes(type) ? '#fff' : 'var(--text-muted)',
            }}
            onClick={() => toggleFilter(type)}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {/* View toggle + navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <button className="btn btn-icon" onClick={prevPeriod}>‹</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{periodLabel}</span>
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              className="sub-tab"
              style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', padding: '4px 12px', fontSize: 11 }}
              onClick={() => setView('month')}
            >
              <span className={view === 'month' ? 'text-gym' : ''}>Mese</span>
            </button>
            <button
              className="sub-tab"
              style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '4px 12px', fontSize: 11 }}
              onClick={() => setView('week')}
            >
              <span className={view === 'week' ? 'text-gym' : ''}>Settimana</span>
            </button>
          </div>
        </div>
        <button className="btn btn-icon" onClick={nextPeriod}>›</button>
      </div>

      {view === 'month' ? renderMonth() : renderWeek()}

      {/* Day modal */}
      {dayModal && selectedDay && (
        <Modal
          title={new Date(selectedDay + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}
          onClose={() => setDayModal(false)}
        >
          {selectedActs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
              Nessuna attività in questo giorno
            </div>
          ) : (
            <div style={{ margin: '0 -20px' }}>
              {selectedActs.map((a, i) => {
                const cfg = TYPE_CONFIG[a._type];
                return (
                  <div
                    key={i}
                    className="list-item"
                    style={{ borderLeft: `3px solid ${cfg.color}` }}
                    onClick={() => {
                      setDayModal(false);
                      if (onNavigate) onNavigate(
                        a._type === 'palestra' ? 'palestra' :
                        a._type === 'corsa' ? 'corsa' :
                        a._type === 'conditioning' ? 'conditioning' : 'altreAttivita',
                        { type: 'edit', section: a._type === 'altro' ? 'altro' : a._type, id: a.id }
                      );
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{cfg.emoji}</div>
                    <div className="list-item-body">
                      <div className="list-item-title" style={{ fontSize: 14 }}>{cfg.label}</div>
                      <div className="list-item-sub">{activitySummary(a)}</div>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: 16 }}>›</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Aggiungi attività per questo giorno:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <button
                  key={type}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', gap: 6 }}
                  onClick={() => {
                    setDayModal(false);
                    if (onNavigate) onNavigate(
                      type === 'palestra' ? 'palestra' :
                      type === 'corsa' ? 'corsa' :
                      type === 'conditioning' ? 'conditioning' : 'altreAttivita',
                      { type: 'new', date: selectedDay }
                    );
                  }}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
