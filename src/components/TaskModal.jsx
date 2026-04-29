import { useState } from 'react';
import { ALL_STATUS, ALL_LABELS, KANBAN_COLS, LABEL_COLORS } from '../constants';
import { Btn } from './Badge';

const Field = ({ label, children }) => (
  <div style={{ gridColumn: label === 'Task Name' || label === 'Labels' || label === 'Notes' ? '1/-1' : undefined }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
);

const inp = {
  width: '100%',
  border: '1px solid #dde1e7',
  borderRadius: 4,
  padding: '7px 10px',
  fontSize: 13,
  color: '#1a1a1a',
  fontFamily: 'inherit',
};

export const TaskModal = ({ task, onSave, onClose }) => {
  const [form, setForm] = useState({ ...task });

  const toggle = (label) => {
    const has = form.labels.includes(label);
    setForm(f => ({ ...f, labels: has ? f.labels.filter(l => l !== label) : [...f.labels, label] }));
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: '40px 20px', overflowY: 'auto',
      }}
    >
      <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 680, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background: '#0D2137', color: '#fff', padding: '14px 20px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, color: '#C8991A', fontWeight: 700 }}>{form.id} — {form.name.slice(0, 55)}{form.name.length > 55 ? '…' : ''}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Task Name">
            <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Owner">
            <input style={inp} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
          </Field>
          <Field label="Status">
            <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {ALL_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Start">
            <input style={inp} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
          </Field>
          <Field label="End / Due">
            <input style={inp} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
          </Field>
          <Field label="Depends On">
            <input style={inp} value={form.depends} onChange={e => setForm(f => ({ ...f, depends: e.target.value }))} />
          </Field>
          <Field label="Kanban Column">
            <select style={inp} value={form.col} onChange={e => setForm(f => ({ ...f, col: e.target.value }))}>
              {KANBAN_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Labels">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {ALL_LABELS.map(l => (
                <span
                  key={l}
                  onClick={() => toggle(l)}
                  style={{
                    display: 'inline-block', padding: '4px 10px', borderRadius: 12,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: '2px solid transparent',
                    background: form.labels.includes(l) ? LABEL_COLORS[l] : '#f0f2f5',
                    color: form.labels.includes(l) ? '#fff' : '#555',
                    borderColor: form.labels.includes(l) ? LABEL_COLORS[l] : '#ddd',
                    userSelect: 'none',
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <textarea
              rows={3} style={{ ...inp, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </Field>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => { onSave(form); onClose(); }}>Save Changes</Btn>
        </div>
      </div>
    </div>
  );
};
