import { useState, useEffect, useCallback } from 'react';

const SETUP_KEY = 'setup_state_v1';

// ── Phase definitions ──────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 'legal',
    title: 'Legal Entity Formation',
    icon: '⚖',
    tasks: [
      { id: 'T-L1', label: 'Choose company structure (LLC recommended)', owner: ['Founder', 'Lawyer'],
        notes: 'LLC (ش.ذ.م.م) — 2 shareholders minimum, EGP 1K min capital. Faster than Joint Stock. GAFI Fast Lane.' },
      { id: 'T-L2', label: 'GAFI Commercial Registry registration', owner: ['Lawyer'],
        notes: 'Fast Lane: 72h turnaround. Requires MOA, ID copies, lease/virtual address. Fee: ~EGP 3,500.' },
      { id: 'T-L3', label: 'Tax Registration number (ETA portal)', owner: ['Accountant'],
        notes: 'Online at eta.gov.eg after Commercial Registry. Needed before any invoicing.' },
      { id: 'T-L4', label: 'Social Insurance registration (NOSI)', owner: ['Accountant'],
        notes: 'Register as employer once the first person (including founder) is on payroll.' },
      { id: 'T-L5', label: 'Official company stamp', owner: ['Founder'],
        notes: 'Physical stamp required for government submissions. ~EGP 200. Order same day as registry.' },
    ],
  },
  {
    id: 'banking',
    title: 'Banking & Finance',
    icon: '🏦',
    tasks: [
      { id: 'T-B1', label: 'Open corporate bank account (CIB or NBE Business)', owner: ['Founder'],
        notes: 'Bring: Commercial Registry + tax certificate + company stamp + IDs. CIB Business: 3–5 days.' },
      { id: 'T-B2', label: 'Deposit paid-in capital', owner: ['Founder'],
        notes: 'Required by GAFI before issuing the final Commercial Registry certificate.' },
      { id: 'T-B3', label: 'Configure internet banking + authorized signatories', owner: ['Founder'],
        notes: 'Add accountant as read-only. Set transfer thresholds. Test outbound payment before client money arrives.' },
      { id: 'T-B4', label: 'Set up accounting software (Odoo or QuickBooks)', owner: ['Accountant'],
        notes: 'Odoo Community is free and handles Egyptian VAT (14%) and WHT. Configure chart of accounts per EAS.' },
    ],
  },
  {
    id: 'professional',
    title: 'Professional Registration',
    icon: '🏗',
    tasks: [
      { id: 'T-P1', label: "Engineers' Syndicate — company registration", owner: ['Founder'],
        notes: 'Register the company under your Syndicate membership. Required for NREA application.' },
      { id: 'T-P2', label: 'Verify founder Syndicate membership is current', owner: ['Founder'],
        notes: 'Confirm membership dues paid, ID active, specialization listed. NREA will cross-check this.' },
      { id: 'T-P3', label: 'GAFI investment profile (for >EGP 5M projects)', owner: ['Lawyer'],
        notes: 'Low priority for first 90 days. Only needed for large tenders or foreign-financed projects.' },
    ],
  },
  {
    id: 'regulatory',
    title: 'Regulatory Licensing',
    icon: '📋',
    tasks: [
      { id: 'T-R1', label: 'NREA Bronze Qualification Certificate application', owner: ['Founder'],
        notes: 'Fee: EGP 5K + EGP 5K review + VAT. Requires: Commercial Registry, Syndicate reg, capital proof, founder CV. Submit before Day 60.' },
      { id: 'T-R2', label: 'EgyptERA Solar Contractor License', owner: ['Founder', 'Lawyer'],
        notes: 'Required for all grid-tie projects. Separate from NREA. Target: Day 90.' },
      { id: 'T-R3', label: 'DISCO contractor pre-registration', owner: ['Founder'],
        notes: 'Contact local DISCO (EEDCS / UEDCO) to register as approved solar contractor. Needed for net-metering applications.' },
      { id: 'T-R4', label: 'Ministry of Environment notification', owner: ['Lawyer'],
        notes: 'Required for projects >200 kWp only. Low priority at startup stage.' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations Setup',
    icon: '⚙',
    tasks: [
      { id: 'T-O1', label: 'Register business address (virtual office acceptable)', owner: ['Founder'],
        notes: 'Virtual address: EGP 500–1,500/month. Required for Commercial Registry. Upgrade to real office when 3+ staff.' },
      { id: 'T-O2', label: 'Professional liability insurance', owner: ['Founder'],
        notes: 'Engineering PI insurance: ~EGP 8,000–15,000/year. Many B2B clients require this before signing.' },
      { id: 'T-O3', label: 'Company email domain (@your-company.com)', owner: ['Founder'],
        notes: 'Google Workspace ~EGP 400/user/month or Zoho Mail free tier. Required for credible proposals.' },
      { id: 'T-O4', label: 'EPC contract template (Arabic + English)', owner: ['Lawyer'],
        notes: 'Must include: FX escalation clause, 30% deposit trigger, warranty terms per NREA Art.5, payment milestones.' },
      { id: 'T-O5', label: 'Equipment supplier MOUs (panels + inverters)', owner: ['Founder'],
        notes: 'Pre-negotiate pricing tiers and lead times with 2–3 suppliers. Reduces procurement risk on first project.' },
    ],
  },
];

const ALL_TASK_IDS = PHASES.flatMap(p => p.tasks.map(t => t.id));

const STATUS_META = {
  not_started: { label: 'Not Started', color: '#999',    bg: '#f7f7f7', next: 'in_progress' },
  in_progress:  { label: 'In Progress', color: '#b8860b', bg: '#fffbee', next: 'done'        },
  done:         { label: 'Done',        color: '#1a7a3f', bg: '#f0faf4', next: 'blocked'     },
  blocked:      { label: 'Blocked',     color: '#c0392b', bg: '#fff5f5', next: 'not_started' },
};

const OWNER_COLORS = { Founder: '#0D2137', Lawyer: '#6b3fa0', Accountant: '#1a7a3f' };

const COMM_TYPES = ['Call', 'Meeting', 'Email', 'Document', 'Other'];

// ── Persistence ────────────────────────────────────────────────────────────────

const defaultState = () => ({
  tasks:    Object.fromEntries(ALL_TASK_IDS.map(id => [id, { status: 'not_started', note: '' }])),
  commsLog: [],
  collapsed: {},
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const def   = defaultState();
    return {
      tasks:    { ...def.tasks, ...saved.tasks },
      commsLog: saved.commsLog || [],
      collapsed: saved.collapsed || {},
    };
  } catch {
    return defaultState();
  }
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function OwnerBadge({ owner }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '.2px',
      color: '#fff',
      background: OWNER_COLORS[owner] || '#555',
      marginRight: 4,
    }}>
      {owner}
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const m = STATUS_META[status] || STATUS_META.not_started;
  return (
    <button
      onClick={onClick}
      title="Click to advance status"
      style={{
        padding: '2px 9px',
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.color}40`,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'opacity .12s',
      }}
    >
      {m.label}
    </button>
  );
}

function TaskRow({ task, phaseTask, onStatusChange, onNoteChange }) {
  const [showNote, setShowNote] = useState(false);
  const status = task?.status || 'not_started';
  const note   = task?.note   || '';
  const isDone = status === 'done';

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid #eee',
      background: isDone ? '#fafffe' : '#fff',
      opacity: isDone ? 0.7 : 1,
      transition: 'opacity .12s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StatusBadge status={status} onClick={() => onStatusChange(STATUS_META[status].next)} />

        <span style={{
          flex: 1,
          fontSize: 12,
          color: isDone ? '#888' : '#1a1a1a',
          textDecoration: isDone ? 'line-through' : 'none',
          minWidth: 180,
        }}>
          {phaseTask.label}
        </span>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {phaseTask.owner.map(o => <OwnerBadge key={o} owner={o} />)}
        </div>

        <button
          onClick={() => setShowNote(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: note ? '#b8860b' : '#aaa',
            padding: '0 2px', flexShrink: 0,
          }}
          title={showNote ? 'Hide notes' : 'Show notes'}
        >
          {showNote ? '▲ notes' : '▼ notes'}
        </button>
      </div>

      {showNote && (
        <div style={{ marginTop: 8, marginLeft: 2 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{phaseTask.notes}</div>
          <textarea
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Add your own notes..."
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontSize: 11, padding: '5px 8px',
              border: '1px solid #ddd', borderRadius: 4,
              resize: 'vertical', fontFamily: 'inherit',
              color: '#333',
            }}
          />
        </div>
      )}
    </div>
  );
}

function PhaseHeader({ phase, done, total, collapsed, onToggle }) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const allDone = done === total;

  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: allDone ? '#f0faf4' : '#f5f7fa',
        border: 'none', borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 14 }}>{phase.icon}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: allDone ? '#1a7a3f' : '#0D2137' }}>
        {phase.title}
      </span>
      <span style={{ fontSize: 11, color: allDone ? '#1a7a3f' : '#888', fontWeight: 600 }}>
        {done}/{total}
      </span>
      <div style={{ width: 60, height: 6, background: '#ddd', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: allDone ? '#1a7a3f' : '#C8991A', borderRadius: 3, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 10, color: '#aaa' }}>{collapsed ? '▶' : '▼'}</span>
    </button>
  );
}

function CommsLog({ log, onAdd, onDelete }) {
  const empty = { date: '', type: 'Call', topic: '', notes: '', nextMeeting: '', actionItems: '' };
  const [form, setForm]       = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!form.date || !form.topic) return;
    onAdd({ ...form, id: `comm-${Date.now()}` });
    setForm(empty);
    setShowForm(false);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: '#f5f7fa', borderBottom: '1px solid #e0e0e0',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0D2137' }}>Lawyer / Advisor Communication Log</span>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '3px 10px', fontSize: 11, fontWeight: 700,
            background: '#0D2137', color: '#fff', border: 'none',
            borderRadius: 4, cursor: 'pointer',
          }}
        >
          + Log Entry
        </button>
      </div>

      {showForm && (
        <div style={{ padding: 14, background: '#fffbee', borderBottom: '1px solid #ffe082' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <label style={labelStyle}>
              Date
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Type
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={inputStyle}>
                {COMM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
            Topic
            <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. Commercial Registry documents" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
          </label>
          <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
            Notes / Outcome
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <label style={labelStyle}>
              Action Items
              <input value={form.actionItems} onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))}
                placeholder="e.g. Send lease agreement" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Next Meeting
              <input type="date" value={form.nextMeeting} onChange={e => setForm(f => ({ ...f, nextMeeting: e.target.value }))}
                style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd}
              style={{ padding: '5px 14px', background: '#1a7a3f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
              Save
            </button>
            <button onClick={() => { setShowForm(false); setForm(empty); }}
              style={{ padding: '5px 14px', background: '#eee', color: '#555', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {log.length === 0 ? (
        <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 11, color: '#bbb' }}>
          No entries yet — log your first lawyer call or meeting above.
        </div>
      ) : (
        <div>
          {[...log].reverse().map(entry => (
            <div key={entry.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0D2137' }}>{entry.date}</span>
                <span style={{
                  padding: '1px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                  background: '#e8f4fd', color: '#1565c0',
                }}>
                  {entry.type}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: '#333' }}>{entry.topic}</span>
                <button
                  onClick={() => onDelete(entry.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ccc', padding: 0 }}
                  title="Delete entry"
                >
                  ×
                </button>
              </div>
              {entry.notes && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{entry.notes}</div>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {entry.actionItems && (
                  <span style={{ fontSize: 10, color: '#b8860b' }}>
                    Action: {entry.actionItems}
                  </span>
                )}
                {entry.nextMeeting && (
                  <span style={{ fontSize: 10, color: '#6b3fa0' }}>
                    Next: {entry.nextMeeting}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 10, fontWeight: 700, color: '#555', display: 'flex', flexDirection: 'column', gap: 3 };
const inputStyle = { fontSize: 12, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontFamily: 'inherit', color: '#333' };

// ── Summary bar ────────────────────────────────────────────────────────────────

function SummaryBar({ tasks }) {
  const counts = { not_started: 0, in_progress: 0, done: 0, blocked: 0 };
  Object.values(tasks).forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const pct   = total > 0 ? Math.round(counts.done / total * 100) : 0;

  return (
    <div style={{
      background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 5, fontWeight: 700 }}>
          OVERALL SETUP PROGRESS
        </div>
        <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct === 100 ? '#1a7a3f' : '#C8991A',
            borderRadius: 4, transition: 'width .4s',
          }} />
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 900, color: pct === 100 ? '#1a7a3f' : '#C8991A' }}>
        {pct}%
      </span>
      {Object.entries(counts).map(([s, n]) => (
        <div key={s} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: STATUS_META[s]?.color }}>{n}</div>
          <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase' }}>{STATUS_META[s]?.label}</div>
        </div>
      ))}
      {counts.blocked > 0 && (
        <span style={{
          padding: '3px 10px', background: '#fff5f5', color: '#c0392b',
          border: '1px solid #c0392b40', borderRadius: 10, fontSize: 10, fontWeight: 700,
        }}>
          {counts.blocked} blocked
        </span>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function SetupView() {
  const [state, setState] = useState(loadState);

  const save = useCallback((next) => {
    setState(next);
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const setTaskStatus = (taskId, status) => {
    save(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [taskId]: { ...prev.tasks[taskId], status } },
    }));
  };

  const setTaskNote = (taskId, note) => {
    save(prev => ({
      ...prev,
      tasks: { ...prev.tasks, [taskId]: { ...prev.tasks[taskId], note } },
    }));
  };

  const toggleCollapsed = (phaseId) => {
    save(prev => ({
      ...prev,
      collapsed: { ...prev.collapsed, [phaseId]: !prev.collapsed[phaseId] },
    }));
  };

  const addComm = (entry) => {
    save(prev => ({ ...prev, commsLog: [...prev.commsLog, entry] }));
  };

  const deleteComm = (id) => {
    save(prev => ({ ...prev, commsLog: prev.commsLog.filter(e => e.id !== id) }));
  };

  const allDone = ALL_TASK_IDS.every(id => state.tasks[id]?.status === 'done');

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {allDone && (
        <div style={{
          padding: '12px 16px', background: '#f0faf4', borderRadius: 6,
          border: '1px solid #1a7a3f40', color: '#1a7a3f', fontSize: 12, fontWeight: 700,
        }}>
          All setup tasks complete. Company is operational.
        </div>
      )}

      <SummaryBar tasks={state.tasks} />

      {PHASES.map(phase => {
        const phaseTasks  = phase.tasks;
        const doneCount   = phaseTasks.filter(t => state.tasks[t.id]?.status === 'done').length;
        const collapsed   = state.collapsed[phase.id];

        return (
          <div key={phase.id} style={{ borderRadius: 6, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <PhaseHeader
              phase={phase}
              done={doneCount}
              total={phaseTasks.length}
              collapsed={collapsed}
              onToggle={() => toggleCollapsed(phase.id)}
            />
            {!collapsed && phaseTasks.map(pt => (
              <TaskRow
                key={pt.id}
                task={state.tasks[pt.id]}
                phaseTask={pt}
                onStatusChange={status => setTaskStatus(pt.id, status)}
                onNoteChange={note   => setTaskNote(pt.id, note)}
              />
            ))}
          </div>
        );
      })}

      <CommsLog log={state.commsLog} onAdd={addComm} onDelete={deleteComm} />

    </div>
  );
}
