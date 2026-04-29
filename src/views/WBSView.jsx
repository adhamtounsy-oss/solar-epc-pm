import { useState } from 'react';
import { ALL_WBS, WBS_META } from '../constants';
import { Badge, StatusBadge, Btn } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';

export const WBSView = ({ tasks, onUpdate }) => {
  const [open, setOpen]       = useState(Object.fromEntries(ALL_WBS.map(w => [w, true])));
  const [editing, setEditing] = useState(null);
  const toggle = w => setOpen(p => ({ ...p, [w]: !p[w] }));

  return (
    <div>
      {editing && <TaskModal task={editing} onSave={onUpdate} onClose={() => setEditing(null)} />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Btn size="sm" variant="ghost" onClick={() => setOpen(Object.fromEntries(ALL_WBS.map(w => [w, true])))}>Expand All</Btn>
        <Btn size="sm" variant="ghost" onClick={() => setOpen(Object.fromEntries(ALL_WBS.map(w => [w, false])))}>Collapse All</Btn>
      </div>

      {ALL_WBS.map(wbs => {
        const wbsTasks = tasks.filter(t => t.wbs === wbs);
        const done     = wbsTasks.filter(t => t.status === 'Done').length;
        const blocked  = wbsTasks.filter(t => t.status === 'Blocked').length;
        return (
          <div key={wbs} style={{ marginBottom: 8, border: '1px solid #e0e4ea', borderRadius: 6, overflow: 'hidden' }}>
            <div
              onClick={() => toggle(wbs)}
              style={{ background: '#0D2137', color: '#fff', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <div>
                <span style={{ color: '#C8991A', marginRight: 8, fontWeight: 700 }}>{wbs}</span>
                <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.3px' }}>{WBS_META[wbs]}</span>
              </div>
              <div style={{ fontSize: 11, color: '#aabbcc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{done}/{wbsTasks.length} done</span>
                {blocked > 0 && <span style={{ color: '#ff9999' }}>{blocked} blocked</span>}
                <span>{open[wbs] ? '▲' : '▼'}</span>
              </div>
            </div>

            {open[wbs] && (
              <div style={{ background: '#fff' }}>
                {wbsTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setEditing(t)}
                    style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 14px', borderBottom: '1px solid #f0f2f5', gap: 10, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#888', minWidth: 38 }}>{t.id}</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#1a1a1a', fontWeight: 500 }}>
                      {t.name}
                      <span style={{ marginLeft: 8 }}>{t.labels.map(l => <Badge key={l} label={l} />)}</span>
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <StatusBadge status={t.status} />
                      <span style={{ fontSize: 11, color: '#888' }}>{t.start} → {t.end}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
