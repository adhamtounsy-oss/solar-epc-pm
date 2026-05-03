import { useState, useEffect, useCallback } from 'react';

const SETUP_KEY = 'setup_state_v1';
const FOS_KEY   = 'fos_state_v3';

// Which setup task completions auto-flip a fosState flag
const TASK_FOS_FLAGS = {
  'T-B1': 'bankAccountOpen',
  'T-R1': 'nreaSubmitted',
  'T-R2': 'egyptERASubmitted',
  'T-L2': 'gafiRegistered',
  'T-L3': 'taxRegistered',
  'T-P1': 'syndicateRegistered',
  'T-R3': 'discoPreRegistered',
  'T-P3': 'lawyerEngaged',  // GAFI investment profile triggers lawyer engaged flag
};

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

// ── Supplier Address Book ──────────────────────────────────────────────────────
const SUPPLIER_LS   = 'suppliers_v1';
const SUPPLIER_CATS = ['Panels','Inverters','BOS / Mounting','DC Cabling','AC / Switchgear','Other'];
const PAYMENT_TERMS = ['Upfront 100%','30/70','50/50','30/60/10','Net 30','Net 60','Custom'];
const EMPTY_SUPPLIER = { name:'', category:'Panels', contactPerson:'', phone:'', whatsapp:'', email:'', paymentTerms:'50/50', leadTimeDays:'', priceNotes:'', notes:'', rating:0 };

const loadSuppliers = () => { try { const s = localStorage.getItem(SUPPLIER_LS); return s ? JSON.parse(s) : []; } catch { return []; } };
const saveSuppliers = (d) => { try { localStorage.setItem(SUPPLIER_LS, JSON.stringify(d)); } catch {} };

const StarRating = ({ value, onChange }) => (
  <div style={{ display:'flex', gap:3 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} onClick={() => onChange(n === value ? 0 : n)}
        style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color: n <= value ? '#C8991A' : '#ddd', padding:0 }}>
        ★
      </button>
    ))}
  </div>
);

function SupplierModal({ supplier, onSave, onClose }) {
  const [f, setF] = useState(supplier ? { ...supplier } : { ...EMPTY_SUPPLIER, id: `sup-${Date.now()}` });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { border:'1px solid #dde1e7', borderRadius:4, padding:'6px 9px', fontSize:12, fontFamily:'inherit', color:'#0D2137', width:'100%', boxSizing:'border-box' };
  const lb  = { fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3, display:'block' };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,.25)', marginBottom:40 }}>
        <div style={{ background:'#0D2137', color:'#C8991A', padding:'14px 20px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:900, fontSize:13 }}>{supplier ? 'Edit Supplier' : 'Add Supplier'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lb}>Company Name *</label>
            <input style={inp} value={f.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. SolarEdge Egypt" />
          </div>
          <div>
            <label style={lb}>Category</label>
            <select style={inp} value={f.category} onChange={e=>set('category',e.target.value)}>
              {SUPPLIER_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lb}>Payment Terms</label>
            <select style={inp} value={f.paymentTerms} onChange={e=>set('paymentTerms',e.target.value)}>
              {PAYMENT_TERMS.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lb}>Contact Person</label>
            <input style={inp} value={f.contactPerson} onChange={e=>set('contactPerson',e.target.value)} />
          </div>
          <div>
            <label style={lb}>Lead Time (days)</label>
            <input type="number" min="0" style={inp} value={f.leadTimeDays} onChange={e=>set('leadTimeDays',e.target.value)} placeholder="e.g. 21" />
          </div>
          <div>
            <label style={lb}>Phone</label>
            <input type="tel" style={inp} value={f.phone} onChange={e=>set('phone',e.target.value)} />
          </div>
          <div>
            <label style={lb}>WhatsApp</label>
            <input type="tel" style={inp} value={f.whatsapp} onChange={e=>set('whatsapp',e.target.value)} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lb}>Email</label>
            <input type="email" style={inp} value={f.email} onChange={e=>set('email',e.target.value)} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lb}>Pricing Notes</label>
            <textarea rows={2} style={{ ...inp, resize:'vertical' }} value={f.priceNotes} onChange={e=>set('priceNotes',e.target.value)} placeholder="Current panel price per Wp, inverter per kW, discount tiers, etc." />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lb}>Notes</label>
            <textarea rows={2} style={{ ...inp, resize:'vertical' }} value={f.notes} onChange={e=>set('notes',e.target.value)} placeholder="Reliability, delivery experience, warranty support, etc." />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lb}>Rating</label>
            <StarRating value={f.rating||0} onChange={v=>set('rating',v)} />
          </div>
        </div>
        <div style={{ padding:'12px 20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'7px 16px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          <button onClick={() => { if(f.name.trim()) onSave(f); }} style={{ padding:'7px 18px', background:'#0D2137', color:'#fff', border:'none', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function SupplierBook() {
  const [suppliers, setSuppliers] = useState(loadSuppliers);
  const [modal, setModal]         = useState(null); // null | 'new' | supplier obj
  const [filterCat, setFilterCat] = useState('All');

  const save = (list) => { setSuppliers(list); saveSuppliers(list); };

  const saveSupplier = (s) => {
    save(suppliers.some(x=>x.id===s.id) ? suppliers.map(x=>x.id===s.id?s:x) : [...suppliers, s]);
    setModal(null);
  };
  const del = (id) => { save(suppliers.filter(s=>s.id!==id)); };

  const filtered = filterCat === 'All' ? suppliers : suppliers.filter(s=>s.category===filterCat);
  const catCounts = SUPPLIER_CATS.reduce((acc, c) => ({ ...acc, [c]: suppliers.filter(s=>s.category===c).length }), {});

  const CAT_COLOR = { 'Panels':'#1A6B72','Inverters':'#0D2137','BOS / Mounting':'#556678','DC Cabling':'#C8991A','AC / Switchgear':'#856404','Other':'#888' };

  return (
    <div style={{ background:'#fff', borderRadius:6, border:'1px solid #e0e0e0', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f5f7fa', borderBottom:'1px solid #e0e0e0', flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#0D2137' }}>Supplier Address Book</span>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)}
            style={{ fontSize:11, padding:'3px 8px', border:'1px solid #ddd', borderRadius:4, fontFamily:'inherit' }}>
            <option>All</option>
            {SUPPLIER_CATS.map(c=><option key={c}>{c} ({catCounts[c]||0})</option>)}
          </select>
          <button onClick={()=>setModal('new')}
            style={{ padding:'4px 12px', fontSize:11, fontWeight:700, background:'#0D2137', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>
            + Add Supplier
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding:24, textAlign:'center', color:'#aaa', fontSize:12 }}>
          {suppliers.length === 0 ? 'No suppliers yet. Add your panel, inverter, and BOS suppliers.' : 'No suppliers in this category.'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12, padding:14 }}>
          {filtered.map(s => {
            const cc = CAT_COLOR[s.category]||'#888';
            return (
              <div key={s.id} style={{ background:'#f8f9fa', borderRadius:6, padding:12, border:`1px solid #e8e8e8`, borderTop:`3px solid ${cc}`, position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#0D2137', flex:1, lineHeight:1.2 }}>{s.name}</div>
                  <span style={{ fontSize:9, fontWeight:700, color:cc, background:`${cc}22`, borderRadius:3, padding:'2px 6px', marginLeft:4, flexShrink:0 }}>{s.category}</span>
                </div>
                {s.rating > 0 && (
                  <div style={{ fontSize:13, color:'#C8991A', marginBottom:4 }}>{'★'.repeat(s.rating)}{'☆'.repeat(5-s.rating)}</div>
                )}
                <div style={{ fontSize:10, color:'#555', lineHeight:1.6 }}>
                  {s.contactPerson && <div>{s.contactPerson}</div>}
                  {s.phone && <div>📞 {s.phone}</div>}
                  {s.whatsapp && <div>💬 {s.whatsapp}</div>}
                  {s.paymentTerms && <div>Payment: {s.paymentTerms}</div>}
                  {s.leadTimeDays && <div>Lead time: {s.leadTimeDays}d</div>}
                  {s.priceNotes && <div style={{ marginTop:4, color:'#888', fontStyle:'italic' }}>{s.priceNotes.slice(0,80)}{s.priceNotes.length>80?'…':''}</div>}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:8 }}>
                  {s.whatsapp && (
                    <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                      style={{ padding:'3px 8px', background:'#25D366', color:'#fff', borderRadius:4, fontSize:10, fontWeight:700, textDecoration:'none' }}>
                      WA
                    </a>
                  )}
                  <button onClick={()=>setModal(s)} style={{ padding:'3px 8px', background:'#f0f2f5', color:'#555', border:'none', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                  <button onClick={()=>{ if(window.confirm(`Delete ${s.name}?`)) del(s.id); }} style={{ padding:'3px 8px', background:'#fff5f5', color:'#C0392B', border:'none', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <SupplierModal
          supplier={modal === 'new' ? null : modal}
          onSave={saveSupplier}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}

// ── Risk Register ─────────────────────────────────────────────────────────────

const RISK_LS = 'risk_register_v1';

const DEFAULT_RISKS = [
  { id:'R-1',  label:'FX devaluation (EGP/USD)',          category:'Financial',   probability:70, impactEGP:150000, mitigation:'FX escalation clause in all proposals. Monitor XE.com weekly.' },
  { id:'R-2',  label:'DISCO approval delay (>60 days)',    category:'Regulatory',  probability:65, impactEGP:25000,  mitigation:'Submit DISCO application same day deposit clears. Chase at day 21.' },
  { id:'R-3',  label:'Equipment price spike (panels/inv)', category:'Procurement', probability:50, impactEGP:80000,  mitigation:'Signed proforma invoice before contract. Lock price at deposit.' },
  { id:'R-4',  label:'Client deposit default',             category:'Commercial',  probability:20, impactEGP:0,      mitigation:'No procurement orders before deposit clears. 30% deposit minimum.' },
  { id:'R-5',  label:'Rework / installation defects',      category:'Execution',   probability:40, impactEGP:30000,  mitigation:'Phase sign-off gates. Subcontractor payment tied to QG completion.' },
  { id:'R-6',  label:'NREA certificate delay',             category:'Regulatory',  probability:30, impactEGP:50000,  mitigation:'Submit by Day 60. Engage NREA liaison. Bronze tier for up to 500 kWp.' },
  { id:'R-7',  label:'Subcontractor quality failure',      category:'Execution',   probability:35, impactEGP:20000,  mitigation:'Pre-qualify subcontractors. Punch list before final payment release.' },
  { id:'R-8',  label:'Scope creep / undocumented changes', category:'Commercial',  probability:55, impactEGP:15000,  mitigation:'Change order log. Client sign-off for any change >2% of contract.' },
  { id:'R-9',  label:'Cash flow gap (milestone delay)',     category:'Financial',   probability:45, impactEGP:40000,  mitigation:'30-day AR escalation. Overdraft facility pre-arranged at bank.' },
  { id:'R-10', label:'Customs delay / HS code issue',      category:'Procurement', probability:25, impactEGP:20000,  mitigation:'Verify HS codes before ordering. Use bonded warehouse supplier.' },
];

const RISK_CATS   = ['Financial','Regulatory','Procurement','Commercial','Execution','Other'];
const RISK_CAT_C  = { Financial:'#1A6B72', Regulatory:'#856404', Procurement:'#5C2D91', Commercial:'#1E7E34', Execution:'#C0392B', Other:'#888' };
const PROB_LABELS = { 10:'Very Low', 25:'Low', 40:'Medium', 55:'High', 70:'Very High' };

function RiskRegister() {
  const loadRisks = () => {
    try { const r = localStorage.getItem(RISK_LS); return r ? JSON.parse(r) : DEFAULT_RISKS.map(r=>({...r})); }
    catch { return DEFAULT_RISKS.map(r=>({...r})); }
  };
  const saveRisks = (d) => { try { localStorage.setItem(RISK_LS, JSON.stringify(d)); } catch {} };

  const [risks, setRisks] = useState(loadRisks);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label:'', category:'Financial', probability:40, impactEGP:'', mitigation:'' });
  const setF = (k, v) => setForm(p => ({...p, [k]:v}));

  const update = (next) => { setRisks(next); saveRisks(next); };

  const sortedRisks = [...risks].sort((a,b) => {
    const evA = a.probability / 100 * (Number(a.impactEGP)||0);
    const evB = b.probability / 100 * (Number(b.impactEGP)||0);
    return evB - evA;
  });

  const totalEV = risks.reduce((s,r) => s + r.probability / 100 * (Number(r.impactEGP)||0), 0);

  const saveRisk = () => {
    if (!form.label.trim()) return;
    if (editing) {
      update(risks.map(r => r.id===editing ? { ...r, ...form, impactEGP:Number(form.impactEGP)||0 } : r));
      setEditing(null);
    } else {
      const id = `R-${Date.now()}`;
      update([...risks, { id, ...form, impactEGP:Number(form.impactEGP)||0 }]);
    }
    setForm({ label:'', category:'Financial', probability:40, impactEGP:'', mitigation:'' });
    setShowForm(false);
  };

  const startEdit = (r) => {
    setForm({ label:r.label, category:r.category, probability:r.probability, impactEGP:String(r.impactEGP), mitigation:r.mitigation });
    setEditing(r.id);
    setShowForm(true);
  };

  const del = (id) => { if (window.confirm('Remove this risk?')) update(risks.filter(r=>r.id!==id)); };

  const inp2 = { border:'1px solid #dde1e7', borderRadius:4, padding:'6px 9px', fontSize:12, fontFamily:'inherit', color:'#0D2137', width:'100%', boxSizing:'border-box' };
  const lbl2 = { fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3, display:'block' };

  const fmtEGP = (n) => { const v=Number(n||0); if(v>=1e6) return `EGP ${(v/1e6).toFixed(1)}M`; if(v>=1000) return `EGP ${Math.round(v/1000)}K`; return `EGP ${v.toLocaleString()}`; };

  return (
    <div style={{ background:'#fff', borderRadius:6, border:'1px solid #e0e0e0', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'#f8f9fa', borderBottom:'1px solid #e0e0e0', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:900, color:'#0D2137', textTransform:'uppercase', letterSpacing:'.5px' }}>Risk Register</div>
          {totalEV > 0 && <div style={{ fontSize:10, color:'#888', marginTop:2 }}>Total expected exposure: <b style={{ color:'#C0392B' }}>{fmtEGP(totalEV)}</b> · sorted by financial exposure</div>}
        </div>
        <button onClick={() => { setEditing(null); setForm({ label:'', category:'Financial', probability:40, impactEGP:'', mitigation:'' }); setShowForm(v=>!v); }}
          style={{ padding:'5px 14px', background:'#0D2137', color:'#fff', border:'none', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          {showForm && !editing ? 'Cancel' : '+ Add Risk'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding:14, background:'#fffbee', borderBottom:'1px solid #ffe082' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:10 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl2}>Risk Description <span style={{ color:'#C0392B' }}>*</span></label>
              <input style={inp2} value={form.label} onChange={e=>setF('label',e.target.value)} placeholder="e.g. Equipment supplier defaults on delivery" />
            </div>
            <div>
              <label style={lbl2}>Category</label>
              <select style={inp2} value={form.category} onChange={e=>setF('category',e.target.value)}>
                {RISK_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl2}>Probability (%)</label>
              <input type="number" min="1" max="99" style={inp2} value={form.probability} onChange={e=>setF('probability',parseInt(e.target.value)||1)} placeholder="e.g. 40" />
            </div>
            <div>
              <label style={lbl2}>Impact (EGP)</label>
              <input type="number" min="0" style={inp2} value={form.impactEGP} onChange={e=>setF('impactEGP',e.target.value)} placeholder="e.g. 50000" />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl2}>Mitigation</label>
              <input style={inp2} value={form.mitigation} onChange={e=>setF('mitigation',e.target.value)} placeholder="How to reduce probability or impact" />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={saveRisk} style={{ padding:'6px 14px', background:'#0D2137', color:'#fff', border:'none', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {editing ? 'Save Changes' : 'Add Risk'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding:'6px 14px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Risk list */}
      <div style={{ padding:'0 16px' }}>
        {sortedRisks.length === 0 ? (
          <div style={{ padding:'20px 0', fontSize:11, color:'#bbb' }}>No risks logged. Add risks above.</div>
        ) : (
          sortedRisks.map((r, i) => {
            const ev      = Math.round(r.probability / 100 * (Number(r.impactEGP)||0));
            const cc      = RISK_CAT_C[r.category] || '#888';
            const probC   = r.probability >= 60 ? '#C0392B' : r.probability >= 40 ? '#856404' : '#1a7a3f';
            return (
              <div key={r.id} style={{ padding:'10px 0', borderBottom: i<sortedRisks.length-1?'1px solid #f0f0f0':'none' }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                      <span style={{ fontSize:10, fontWeight:800, color:'#aaa' }}>{r.id}</span>
                      <span style={{ fontSize:9, fontWeight:700, color:cc, background:`${cc}18`, borderRadius:3, padding:'1px 6px' }}>{r.category}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#0D2137' }}>{r.label}</span>
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, fontWeight:700, color:probC }}>P: {r.probability}%</span>
                      {r.impactEGP > 0 && <span style={{ fontSize:10, color:'#888' }}>Impact: {fmtEGP(r.impactEGP)}</span>}
                      {ev > 0 && <span style={{ fontSize:10, fontWeight:700, color:'#C0392B' }}>EV: {fmtEGP(ev)}</span>}
                    </div>
                    {r.mitigation && <div style={{ fontSize:10, color:'#1A6B72', marginTop:4 }}>→ {r.mitigation}</div>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button onClick={() => startEdit(r)} style={{ padding:'2px 8px', background:'#f0f2f5', color:'#555', border:'none', borderRadius:4, fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
                    <button onClick={() => del(r.id)} style={{ padding:'2px 8px', background:'#fff5f5', color:'#C0392B', border:'none', borderRadius:4, fontSize:9, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

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
    // Auto-sync fosState flag when a linked task is marked done
    if (status === 'done' && TASK_FOS_FLAGS[taskId]) {
      try {
        const raw = localStorage.getItem(FOS_KEY);
        const fos = raw ? JSON.parse(raw) : {};
        fos[TASK_FOS_FLAGS[taskId]] = true;
        localStorage.setItem(FOS_KEY, JSON.stringify(fos));
      } catch {}
    }
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

      <SupplierBook />

      <RiskRegister />

    </div>
  );
}
