import { useState, useMemo } from 'react';
import { ALL_WBS, ALL_LABELS, ALL_STATUS, WBS_META } from '../constants';
import { Badge, StatusBadge, Btn } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';

export const TaskTableView = ({ tasks, onUpdate }) => {
  const [editing, setEditing] = useState(null);
  const [filterWBS,    setWBS]    = useState('all');
  const [filterLabel,  setLabel]  = useState('all');
  const [filterStatus, setStatus] = useState('all');
  const [search,       setSearch] = useState('');

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterWBS    !== 'all' && t.wbs !== filterWBS)               return false;
    if (filterLabel  !== 'all' && !t.labels.includes(filterLabel))   return false;
    if (filterStatus !== 'all' && t.status !== filterStatus)         return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, filterWBS, filterLabel, filterStatus, search]);

  const sel = { border: '1px solid #dde1e7', borderRadius: 4, padding: '5px 8px', fontSize: 12, color: '#1a1a1a', background: '#fff', fontFamily: 'inherit' };

  return (
    <div>
      {editing && <TaskModal task={editing} onSave={onUpdate} onClose={() => setEditing(null)} />}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14, padding: 12, background: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Filter:</span>
        <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...sel, width: 180 }} />
        <select value={filterWBS}    onChange={e => setWBS(e.target.value)}    style={sel}>
          <option value="all">All Workstreams</option>
          {ALL_WBS.map(w => <option key={w} value={w}>{WBS_META[w]}</option>)}
        </select>
        <select value={filterLabel}  onChange={e => setLabel(e.target.value)}  style={sel}>
          <option value="all">All Labels</option>
          {ALL_LABELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setStatus(e.target.value)} style={sel}>
          <option value="all">All Status</option>
          {ALL_STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', color: '#888', fontSize: 11 }}>{filtered.length} tasks</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['ID','WBS','Task','Owner','Start','End','Status','Labels','Edit'].map((h, i) => (
                <th key={h} style={{ background: '#0D2137', color: '#fff', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, letterSpacing: '.3px', whiteSpace: 'nowrap', width: [50,80,undefined,120,70,70,90,200,60][i] }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                onMouseEnter={e => { for (const td of e.currentTarget.cells) td.style.background = '#f0f2f5'; }}
                onMouseLeave={e => { for (const td of e.currentTarget.cells) td.style.background = ''; }}
              >
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><b style={{ color: '#0D2137' }}>{t.id}</b></td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 10, color: '#888' }}>{WBS_META[t.wbs]}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', maxWidth: 320 }}>{t.name}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 11, color: '#555' }}>{t.owner}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 11, color: '#888' }}>{t.start}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 11, color: '#888' }}>{t.end}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><StatusBadge status={t.status} /></td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}>{t.labels.map(l => <Badge key={l} label={l} />)}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><Btn size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
