import { useState } from 'react';
import { KANBAN_COLS, ALL_LABELS, LABEL_COLORS, WBS_META } from '../constants';
import { Badge, StatusBadge } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';

export const KanbanView = ({ tasks, onUpdate }) => {
  const [editing, setEditing]   = useState(null);
  const [filterLabel, setFilter] = useState('all');

  const filtered = filterLabel === 'all' ? tasks : tasks.filter(t => t.labels.includes(filterLabel));

  const borderColor = t => {
    if (t.labels.includes('Critical Path')) return '#C0392B';
    if (t.labels.includes('Revenue'))       return '#1E7E34';
    if (t.labels.includes('Compliance'))    return '#1A6B72';
    if (t.labels.includes('Cash Flow'))     return '#D4770A';
    return '#ddd';
  };

  return (
    <div>
      {editing && <TaskModal task={editing} onSave={onUpdate} onClose={() => setEditing(null)} />}

      {/* label filter strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, padding: 12, background: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Filter:</span>
        {['all', ...ALL_LABELS].map(l => (
          <span
            key={l}
            onClick={() => setFilter(l)}
            style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 12,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filterLabel === l ? (l === 'all' ? '#0D2137' : LABEL_COLORS[l]) : '#e8ecf0',
              color: filterLabel === l ? '#fff' : '#555',
              userSelect: 'none',
            }}
          >
            {l === 'all' ? 'All' : l}
          </span>
        ))}
      </div>

      {/* board */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, minHeight: 'calc(100vh - 200px)' }}>
        {KANBAN_COLS.map(col => {
          const cards = filtered.filter(t => t.col === col.id);
          return (
            <div key={col.id} style={{ background: '#e8ecf0', borderRadius: 6, width: 230, minWidth: 230, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: 11, color: '#0D2137', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '2px solid #C8991A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{col.label}</span>
                <span style={{ background: '#0D2137', color: '#C8991A', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{cards.length}</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
                {cards.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', padding: 16, textAlign: 'center', fontSize: 11 }}>Empty</div>}
                {cards.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setEditing(t)}
                    style={{
                      background: '#fff', borderRadius: 5, padding: 10,
                      boxShadow: '0 1px 3px rgba(0,0,0,.08)', cursor: 'pointer',
                      borderLeft: `3px solid ${borderColor(t)}`,
                      transition: 'box-shadow .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)'}
                  >
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 700 }}>{t.id} · {WBS_META[t.wbs]}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0D2137', margin: '3px 0 6px' }}>{t.name}</div>
                    <div style={{ marginBottom: 6 }}>{t.labels.map(l => <Badge key={l} label={l} />)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#666' }}>👤 {t.owner}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    {t.end && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Due: {t.end}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
