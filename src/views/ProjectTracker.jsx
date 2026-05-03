import { useState, useCallback, useEffect } from 'react';
import { DossierModal } from './CRMView';
import { DOC_TYPES, DOC_PHASES, DOC_STATUS, scaffoldDocuments } from '../engine/docScaffold';
import { BOM_TEMPLATES } from '../engine/bomTemplates';

const PROJECTS_KEY = 'projects_v1';
const LEADS_KEY    = 'crm_leads_v3';

// ── Constants ──────────────────────────────────────────────────────────────────

const COST_CATS = [
  { id: 'panels',      label: 'Panels',          color: '#1A6B72' },
  { id: 'inverters',   label: 'Inverters',        color: '#0D2137' },
  { id: 'bos',         label: 'Mounting & BOS',   color: '#556678' },
  { id: 'install',     label: 'Installation',     color: '#856404' },
  { id: 'permits',     label: 'Permits & DISCO',  color: '#6b3fa0' },
  { id: 'engineering', label: 'Engineering',      color: '#1E7E34' },
  { id: 'transport',   label: 'Transport',        color: '#C8991A' },
  { id: 'rework',      label: 'Rework / Defects', color: '#C0392B' },
  { id: 'other',       label: 'Other',            color: '#888'    },
];
const CAT_MAP = Object.fromEntries(COST_CATS.map(c => [c.id, c]));

const PROCURE_CATS = [
  { id: 'panels',    label: 'Solar Panels',   color: '#1A6B72' },
  { id: 'inverters', label: 'Inverters',       color: '#0D2137' },
  { id: 'mounting',  label: 'Mounting / BOS',  color: '#556678' },
  { id: 'dc',        label: 'DC Wiring',       color: '#C8991A' },
  { id: 'ac',        label: 'AC / MDB',        color: '#856404' },
  { id: 'other',     label: 'Other',           color: '#888'    },
];

const IEC_STATUS = {
  pending:  { label: 'Cert Pending',  color: '#888',    bg: '#f5f5f5' },
  received: { label: 'Cert Received', color: '#1a7a3f', bg: '#f0faf4' },
  missing:  { label: 'Cert Missing',  color: '#C0392B', bg: '#fff5f5' },
};

const PROJ_COMM_METHODS = ['Call', 'WhatsApp', 'Site Visit', 'Email', 'Meeting'];

const MS_STATUS = {
  pending:  { label: 'Pending',  color: '#888',    bg: '#f5f5f5' },
  invoiced: { label: 'Invoiced', color: '#b8860b', bg: '#fffbee' },
  received: { label: 'Received', color: '#1a7a3f', bg: '#f0faf4' },
};

const PROJ_STATUS = {
  planning:      { label: 'Planning',      color: '#1A6B72', bg: '#e8f8f9' },
  in_progress:   { label: 'In Progress',   color: '#b8860b', bg: '#fffbee' },
  commissioning: { label: 'Commissioning', color: '#6b3fa0', bg: '#f3efff' },
  complete:      { label: 'Complete',      color: '#1a7a3f', bg: '#f0faf4' },
  on_hold:       { label: 'On Hold',       color: '#C0392B', bg: '#fff5f5' },
};

const STAGE_LABELS = {
  unqualified: 'Unqualified', contacted: 'Contacted', qualified: 'Qualified',
  site_visit_scheduled: 'Site Visit Sched.', site_visit_completed: 'Site Visit Done',
  feasibility_proposed: 'Feasibility Proposed', feasibility_sold: 'Feasibility Sold',
  feasibility_delivered: 'Feasibility Delivered', proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation', won: 'Won', lost: 'Lost', nurture: 'Nurture',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtEGP = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6) return `EGP ${(v / 1e6).toFixed(2)}M`;
  if (v >= 1000) return `EGP ${Math.round(v / 1000)}K`;
  return `EGP ${v.toLocaleString('en-EG')}`;
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const mkMilestones = (cv) => {
  const c = Number(cv) || 0;
  return [
    { id: uid(), label: 'Contract Deposit (30%)',         pct: 30, amount: Math.round(c * 0.30), dueDate: '', status: 'pending', invoicedDate: null },
    { id: uid(), label: 'Equipment Delivery (30%)',       pct: 30, amount: Math.round(c * 0.30), dueDate: '', status: 'pending', invoicedDate: null },
    { id: uid(), label: 'Installation Complete (30%)',    pct: 30, amount: Math.round(c * 0.30), dueDate: '', status: 'pending', invoicedDate: null },
    { id: uid(), label: 'Commissioning & Handover (10%)', pct: 10, amount: Math.round(c * 0.10), dueDate: '', status: 'pending', invoicedDate: null },
  ];
};

const newProject = () => ({
  id: uid(),
  name: '',
  clientName: '',
  systemSizeKW: '',
  contractValue: '',
  startDate: '',
  expectedEndDate: '',
  status: 'planning',
  notes: '',
  milestones: [],
  costs: [],
  procurement: [],
  commsLog: [],
  documents: [],
  siteLogs: [],
  punchList: [],
  yieldLog: [],
  changeOrders: [],
  discoSubmittedDate: '',
  discoApprovedDate: '',
  contingencyBudgetPct: 20,
  npsScore: null,
  linkedLeadId: null,
});

const loadProjects = () => {
  try { const r = localStorage.getItem(PROJECTS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
};

const saveProjects = (d) => {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(d)); } catch {}
};

const loadLeads = () => {
  try { const r = localStorage.getItem(LEADS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
};

// ── Design tokens ──────────────────────────────────────────────────────────────

const N  = '#0D2137';
const T  = '#1A6B72';
const GR = '#1a7a3f';
const inp = {
  border: '1px solid #dde1e7', borderRadius: 4, padding: '6px 9px',
  fontSize: 12, fontFamily: 'inherit', color: N,
  width: '100%', boxSizing: 'border-box',
};
const lbl = {
  fontSize: 10, fontWeight: 700, color: '#888',
  textTransform: 'uppercase', letterSpacing: '.4px',
  marginBottom: 3, display: 'block',
};
const btnS = (bg = N, color = '#fff') => ({
  padding: '6px 14px', background: bg, color, border: 'none',
  borderRadius: 4, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
});

const SITE_LOG_WEATHERS = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Dust Storm', 'Hot +40°C'];

const EG_MONTHLY_PSH = [4.1,4.8,5.7,6.6,7.0,7.3,7.1,6.9,6.5,5.6,4.5,3.9];

const PUNCH_LIST_TEMPLATE = [
  { id:'p1',  label:'Panels physically secured — no movement or tilt',          category:'Structural' },
  { id:'p2',  label:'Mounting rails torqued to spec',                            category:'Structural' },
  { id:'p3',  label:'Roof penetrations waterproofed and sealed',                 category:'Structural' },
  { id:'p4',  label:'DC wiring labelled and routed correctly',                   category:'Electrical' },
  { id:'p5',  label:'MC4 connectors crimped and mated properly',                 category:'Electrical' },
  { id:'p6',  label:'String open-circuit voltage measured and within spec',      category:'Electrical' },
  { id:'p7',  label:'Inverter AC/DC breakers installed and labelled',            category:'Electrical' },
  { id:'p8',  label:'Earth bonding connected to all metal frames',               category:'Electrical' },
  { id:'p9',  label:'Lightning arrester installed and bonded',                   category:'Electrical' },
  { id:'p10', label:'Inverter powers on, no fault codes',                        category:'Commissioning' },
  { id:'p11', label:'Net metering meter installed and bidirectional',            category:'Commissioning' },
  { id:'p12', label:'DISCO inspector visited and approved connection',           category:'Commissioning' },
  { id:'p13', label:'Monitoring system live and reporting data online',          category:'Commissioning' },
  { id:'p14', label:'Client walkthrough completed — system demonstrated',        category:'Handover' },
  { id:'p15', label:'Client signed handover certificate',                        category:'Handover' },
  { id:'p16', label:'All IEC certificates handed to client',                     category:'Handover' },
  { id:'p17', label:'Warranty documents (panels / inverter) handed to client',   category:'Handover' },
  { id:'p18', label:'As-built drawing provided to client',                       category:'Handover' },
  { id:'p19', label:'Site cleaned — no debris or packaging left on roof',        category:'Closeout' },
  { id:'p20', label:'Final photo log taken and filed',                           category:'Closeout' },
];

// ── Daily Site Log Tab ─────────────────────────────────────────────────────────
function DailySiteLogTab({ project, onChange }) {
  const logs   = project.siteLogs || [];
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weather: 'Clear', crew: '', deliveries: '', issues: '', notes: '' });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addLog = () => {
    if (!form.date) return;
    onChange({ ...project, siteLogs: [{ ...form, id: uid() }, ...logs] });
    setForm(p => ({ ...p, crew: '', deliveries: '', issues: '', notes: '' }));
  };
  const deleteLog = (id) => onChange({ ...project, siteLogs: logs.filter(l => l.id !== id) });

  return (
    <div>
      <div style={{ background: '#f8f9fa', borderRadius: 6, padding: 12, marginBottom: 14, border: '1px solid #e0e0e0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>New Entry</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Date</label>
            <input type="date" style={inp} value={form.date} onChange={e=>setF('date',e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Weather</label>
            <select style={inp} value={form.weather} onChange={e=>setF('weather',e.target.value)}>
              {SITE_LOG_WEATHERS.map(w=><option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Crew (headcount)</label>
            <input type="number" min="0" style={inp} value={form.crew} onChange={e=>setF('crew',e.target.value)} placeholder="e.g. 5" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Deliveries</label>
            <input style={inp} value={form.deliveries} onChange={e=>setF('deliveries',e.target.value)} placeholder="Equipment received today" />
          </div>
          <div>
            <label style={lbl}>Issues / Blockers</label>
            <input style={inp} value={form.issues} onChange={e=>setF('issues',e.target.value)} placeholder="Any problems or delays" />
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input style={inp} value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="Summary of work done" />
          </div>
        </div>
        <button onClick={addLog} style={btnS()}>+ Log Entry</button>
      </div>

      {logs.length === 0 ? (
        <div style={{ fontSize: 11, color: '#bbb', padding: '12px 0' }}>No site log entries yet. Add your first entry above.</div>
      ) : (
        logs.map(l => (
          <div key={l.id} style={{ padding: '10px 12px', marginBottom: 8, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6, borderLeft: `3px solid ${l.issues ? '#C0392B' : T}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: N }}>{l.date}</span>
                <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>{l.weather}</span>
                {l.crew && <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>👷 {l.crew} crew</span>}
              </div>
              <button onClick={() => deleteLog(l.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
            </div>
            {l.deliveries && <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>📦 <b>Deliveries:</b> {l.deliveries}</div>}
            {l.issues    && <div style={{ fontSize: 11, color: '#C0392B', marginBottom: 3 }}>⚠ <b>Issues:</b> {l.issues}</div>}
            {l.notes     && <div style={{ fontSize: 11, color: '#555' }}>{l.notes}</div>}
          </div>
        ))
      )}
    </div>
  );
}

// ── Punch List Tab ─────────────────────────────────────────────────────────────
function PunchListTab({ project, onChange }) {
  const list = project.punchList && project.punchList.length > 0
    ? project.punchList
    : PUNCH_LIST_TEMPLATE.map(t => ({ ...t, done: false, note: '' }));

  const ensureList = (updater) => {
    const base = project.punchList && project.punchList.length > 0
      ? project.punchList
      : PUNCH_LIST_TEMPLATE.map(t => ({ ...t, done: false, note: '' }));
    onChange({ ...project, punchList: updater(base) });
  };

  const toggle    = (id) => ensureList(l => l.map(i => i.id === id ? { ...i, done: !i.done } : i));
  const setNote   = (id, note) => ensureList(l => l.map(i => i.id === id ? { ...i, note } : i));

  const done  = list.filter(i => i.done).length;
  const cats  = [...new Set(list.map(i => i.category))];
  const pct   = Math.round(done / list.length * 100);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            <span style={{ color: N }}>Commissioning Checklist</span>
            <span style={{ color: done === list.length ? GR : '#856404' }}>{done}/{list.length} complete ({pct}%)</span>
          </div>
          <div style={{ background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: done === list.length ? GR : T, transition: 'width .3s' }} />
          </div>
        </div>
        {done < list.length && (
          <span style={{ fontSize: 9, fontWeight: 800, color: '#C0392B', background: '#fff5f5', borderRadius: 3, padding: '3px 8px' }}>
            {list.length - done} outstanding
          </span>
        )}
      </div>
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{cat}</div>
          {list.filter(i => i.category === cat).map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 8, padding: '7px 10px', marginBottom: 4, borderRadius: 4, background: item.done ? '#f0faf4' : '#fff', border: `1px solid ${item.done ? '#1a7a3f33' : '#e8e8e8'}` }}>
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)}
                style={{ accentColor: GR, width: 14, height: 14, marginTop: 2, flexShrink: 0, cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: item.done ? '#888' : N, textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.35 }}>{item.label}</div>
                {!item.done && (
                  <input style={{ ...inp, marginTop: 4, fontSize: 10, padding: '3px 7px' }} value={item.note||''} onChange={e=>setNote(item.id,e.target.value)} placeholder="Note (optional)" />
                )}
                {item.done && item.note && (
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>✓ {item.note}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Yield Tracker Tab ──────────────────────────────────────────────────────────
function YieldTrackerTab({ project, onChange, linkedLead }) {
  const log         = project.yieldLog || [];
  const annualModel = parseFloat(linkedLead?.stageData?.feasibility_delivered?.annualYieldKwh) || 0;
  const monthlyModel= annualModel > 0 ? Math.round(annualModel / 12) : 0;
  const systemKwp   = parseFloat(project?.systemSizeKW) || 0;
  const [form, setForm] = useState({ month: new Date().toISOString().slice(0,7), actualKwh: '', note: '' });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const computePR = (entry) => {
    if (!systemKwp || !entry.actualKwh) return null;
    const mo   = parseInt(entry.month.slice(5,7));
    const yr   = parseInt(entry.month.slice(0,4));
    const days = new Date(yr, mo, 0).getDate();
    const psh  = EG_MONTHLY_PSH[mo - 1];
    const pr   = parseFloat(entry.actualKwh) / (systemKwp * psh * days) * 100;
    return isFinite(pr) ? Math.round(pr) : null;
  };

  const addEntry = () => {
    if (!form.month || !form.actualKwh) return;
    const existing = log.find(e => e.month === form.month);
    if (existing) {
      onChange({ ...project, yieldLog: log.map(e => e.month === form.month ? { ...e, actualKwh: form.actualKwh, note: form.note } : e) });
    } else {
      onChange({ ...project, yieldLog: [...log, { id: uid(), ...form }].sort((a,b)=>a.month.localeCompare(b.month)) });
    }
    setForm(p => ({ ...p, actualKwh: '', note: '' }));
  };
  const del = (id) => onChange({ ...project, yieldLog: log.filter(e => e.id !== id) });

  const totalActual = log.reduce((s, e) => s + (parseFloat(e.actualKwh)||0), 0);
  const prValues    = log.map(computePR).filter(v => v !== null);
  const avgPR       = prValues.length > 0 ? Math.round(prValues.reduce((s,v)=>s+v,0)/prValues.length) : null;
  const totalModel  = monthlyModel * log.length;
  const prActual    = annualModel > 0 && totalActual > 0 ? Math.round(totalActual / (annualModel * log.length / 12) * 100) : null;
  const egpSavings  = Math.round(totalActual * 0.8);
  const maxY        = Math.max(...log.map(e => parseFloat(e.actualKwh)||0), monthlyModel, 1);

  return (
    <div>
      {/* Summary strip */}
      {log.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8, marginBottom:14 }}>
          {[
            { label:'Total Actual', value:`${Math.round(totalActual).toLocaleString()} kWh`, color:T },
            ...(totalModel > 0 ? [{ label:'vs. Model', value:`${Math.round(totalActual/totalModel*100)}%`, color: totalActual>=totalModel?GR:'#C0392B' }] : []),
            ...(avgPR !== null ? [{ label:'Avg PR (IEC)', value:`${avgPR}%`, color: avgPR>=78?GR:avgPR>=70?'#856404':'#C0392B',
              title:'Performance Ratio per IEC 61724. Egypt benchmark: 78–85%' }] : []),
            ...(prActual !== null ? [{ label:'vs. Model PR', value:`${prActual}%`, color: prActual>=90?GR:prActual>=80?'#856404':'#C0392B' }] : []),
            { label:'Est. EGP Savings', value:`EGP ${egpSavings.toLocaleString()}`, color:GR },
            { label:`${log.length} Mo. Logged`, value:annualModel>0?`${(annualModel/1000).toFixed(1)}k kWh/yr model`:'—', color:'#888' },
          ].map(t => (
            <div key={t.label} style={{ background:'#f8f9fa', borderRadius:6, padding:'8px 10px', borderBottom:`2px solid ${t.color}` }}>
              <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>{t.label}</div>
              <div style={{ fontSize:13, fontWeight:900, color:t.color }}>{t.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      {log.length > 0 && (
        <div style={{ background:'#f8f9fa', borderRadius:6, padding:12, marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 }}>Actual vs. Modelled (kWh/month)</div>
          <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:80 }}>
            {log.map(e => {
              const actual = parseFloat(e.actualKwh)||0;
              const aH = Math.max(4, actual/maxY*70);
              const mH = monthlyModel > 0 ? Math.max(2, monthlyModel/maxY*70) : 0;
              return (
                <div key={e.id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:0 }}>
                  <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', justifyContent:'center' }}>
                    <div style={{ flex:1, height:`${aH}px`, background:actual>=monthlyModel?GR:'#C0392B', borderRadius:'2px 2px 0 0', maxWidth:14 }} title={`Actual: ${actual} kWh`} />
                    {mH > 0 && <div style={{ flex:1, height:`${mH}px`, background:'#ccc', borderRadius:'2px 2px 0 0', maxWidth:14 }} title={`Model: ${monthlyModel} kWh`} />}
                  </div>
                  <div style={{ fontSize:8, color:'#aaa', textAlign:'center' }}>{e.month.slice(5)}/{e.month.slice(2,4)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:6, fontSize:9, color:'#888' }}>
            <span style={{ color:GR }}>▬ Actual</span>
            {monthlyModel > 0 && <span style={{ color:'#ccc' }}>▬ Model ({monthlyModel.toLocaleString()} kWh/mo)</span>}
          </div>
        </div>
      )}

      {/* Entry form */}
      <div style={{ background:'#f8f9fa', borderRadius:6, padding:12, marginBottom:14, border:'1px solid #e0e0e0' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:10 }}>Log Monthly Production</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
          <div>
            <label style={lbl}>Month</label>
            <input type="month" style={inp} value={form.month} onChange={e=>setF('month',e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Actual Yield (kWh)</label>
            <input type="number" min="0" style={inp} value={form.actualKwh} onChange={e=>setF('actualKwh',e.target.value)} placeholder={monthlyModel>0?`Model: ${monthlyModel}`:'kWh'} />
          </div>
          <div>
            <label style={lbl}>Note</label>
            <input style={inp} value={form.note} onChange={e=>setF('note',e.target.value)} placeholder="e.g. inverter offline 3 days" />
          </div>
        </div>
        <button onClick={addEntry} style={btnS()}>+ Log Entry</button>
      </div>

      {/* Log table */}
      {log.length === 0 ? (
        <div style={{ fontSize:11, color:'#bbb', padding:'12px 0' }}>
          No yield data yet.{annualModel > 0 ? ` Model baseline: ${Math.round(annualModel).toLocaleString()} kWh/yr (${monthlyModel.toLocaleString()} kWh/mo avg).` : ' Link a lead with feasibility data to see the model baseline.'}
        </div>
      ) : (
        <div>
          {log.map(e => {
            const actual = parseFloat(e.actualKwh)||0;
            const diff   = monthlyModel > 0 ? actual - monthlyModel : null;
            const pr     = computePR(e);
            const prColor = pr === null ? '#aaa' : pr >= 78 ? GR : pr >= 70 ? '#856404' : '#C0392B';
            return (
              <div key={e.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f0f0f0', gap:8 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:N }}>{e.month}</span>
                  {e.note && <span style={{ fontSize:10, color:'#888', marginLeft:8 }}>{e.note}</span>}
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center', flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:T }}>{actual.toLocaleString()} kWh</span>
                  {diff !== null && (
                    <span style={{ fontSize:10, fontWeight:700, color: diff>=0?GR:'#C0392B' }}>
                      {diff>=0?'+':''}{diff.toLocaleString()} vs model
                    </span>
                  )}
                  {pr !== null && (
                    <span style={{ fontSize:10, fontWeight:800, color:prColor, background:'#f8f9fa', borderRadius:4, padding:'1px 6px' }}
                      title="Performance Ratio (IEC 61724). Egypt benchmark: 78–85%">
                      PR {pr}%
                    </span>
                  )}
                  <button onClick={() => del(e.id)} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:14 }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Change Order Tab ───────────────────────────────────────────────────────────

function ChangeOrderTab({ project, onChange }) {
  const cos = project.changeOrders || [];
  const emptyForm = { date: new Date().toISOString().split('T')[0], description: '', amountEGP: '', clientSigned: false };
  const [form, setForm] = useState(emptyForm);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addCO = () => {
    if (!form.description.trim() || !form.amountEGP) return;
    const num = cos.length + 1;
    onChange({ ...project, changeOrders: [...cos, { id: uid(), num, ...form, amountEGP: Number(form.amountEGP) }] });
    setForm(emptyForm);
  };
  const toggleSign = (id) => onChange({ ...project, changeOrders: cos.map(co => co.id === id ? { ...co, clientSigned: !co.clientSigned } : co) });
  const del = (id) => onChange({ ...project, changeOrders: cos.filter(co => co.id !== id) });

  const totalCO  = cos.reduce((s, co) => s + (Number(co.amountEGP)||0), 0);
  const cv       = Number(project.contractValue)||0;
  const coPct    = cv > 0 ? Math.round(totalCO / cv * 100) : 0;
  const unsigned = cos.filter(co => !co.clientSigned);

  return (
    <div>
      {unsigned.length > 0 && (
        <div style={{ background:'#fff5f5', border:'1px solid #C0392B33', borderRadius:6, padding:'8px 12px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#C0392B' }}>
            ⚠ {unsigned.length} change order{unsigned.length>1?'s':''} pending client sign-off — do not proceed until signed
          </div>
        </div>
      )}

      {cos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8, marginBottom:14 }}>
          {[
            { label:'Total Changes', value:`+${fmtEGP(totalCO)}`, color:N },
            { label:'vs Contract', value:`${coPct>=0?'+':''}${coPct}%`, color:coPct>10?'#C0392B':coPct>5?'#856404':GR },
            { label:'Signed', value:`${cos.filter(co=>co.clientSigned).length}/${cos.length}`, color:unsigned.length>0?'#C0392B':GR },
          ].map(t => (
            <div key={t.label} style={{ background:'#f8f9fa', borderRadius:6, padding:'8px 10px', borderBottom:`2px solid ${t.color}` }}>
              <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3 }}>{t.label}</div>
              <div style={{ fontSize:13, fontWeight:900, color:t.color }}>{t.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'#f8f9fa', borderRadius:6, padding:12, marginBottom:14, border:'1px solid #e0e0e0' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:10 }}>New Change Order</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={form.date} onChange={e=>setF('date',e.target.value)} /></div>
          <div><label style={lbl}>Amount (EGP)</label><input type="number" style={inp} value={form.amountEGP} onChange={e=>setF('amountEGP',e.target.value)} placeholder="e.g. 15000" /></div>
          <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:4 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, userSelect:'none' }}>
              <input type="checkbox" checked={form.clientSigned} onChange={e=>setF('clientSigned',e.target.checked)} style={{ accentColor:GR, width:14, height:14, cursor:'pointer' }} />
              Client Signed
            </label>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={lbl}>Description <span style={{ color:'#C0392B' }}>*</span></label>
          <input style={inp} value={form.description} onChange={e=>setF('description',e.target.value)} placeholder="Scope change and reason (e.g. additional cable run — client relocated DB)" />
        </div>
        <button onClick={addCO} style={btnS()}>+ Add Change Order</button>
      </div>

      {cos.length === 0 ? (
        <div style={{ fontSize:11, color:'#bbb', padding:'12px 0' }}>No change orders yet. Log any scope changes here — industry standard: get client sign-off for any change &gt;2% of contract.</div>
      ) : (
        cos.map(co => (
          <div key={co.id} style={{ padding:'10px 12px', marginBottom:8, background:'#fff', border:'1px solid #e8e8e8', borderRadius:6, borderLeft:`3px solid ${co.clientSigned?GR:'#C0392B'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div>
                <span style={{ fontSize:10, fontWeight:900, color:'#888', textTransform:'uppercase', letterSpacing:'.5px' }}>CO-{String(co.num).padStart(3,'0')}</span>
                <span style={{ fontSize:10, color:'#aaa', marginLeft:8 }}>{co.date}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, fontWeight:800, color:N }}>{fmtEGP(co.amountEGP)}</span>
                <button onClick={() => toggleSign(co.id)}
                  style={{ padding:'2px 9px', fontSize:9, fontWeight:800, borderRadius:4, border:'none', cursor:'pointer', fontFamily:'inherit',
                    background:co.clientSigned?'#e8f5e9':'#fff5f5', color:co.clientSigned?GR:'#C0392B' }}>
                  {co.clientSigned ? '✓ SIGNED' : 'UNSIGNED'}
                </button>
                <button onClick={() => del(co.id)} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:14 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#333', lineHeight:1.4 }}>{co.description}</div>
          </div>
        ))
      )}
      <div style={{ marginTop:8, fontSize:9, color:'#aaa' }}>Benchmark: &gt;2% of contract requires written sign-off. Cumulative change orders {coPct}% of contract.</div>
    </div>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────────

function SummaryBar({ projects }) {
  const active      = projects.filter(p => !['complete','on_hold'].includes(p.status));
  const totContract = projects.reduce((s, p) => s + (Number(p.contractValue) || 0), 0);
  const totReceived = projects.reduce((s, p) =>
    s + p.milestones.filter(m => m.status === 'received').reduce((ms, m) => ms + (Number(m.amount) || 0), 0), 0);
  const totCosts    = projects.reduce((s, p) =>
    s + p.costs.filter(c => c.paid).reduce((cs, c) => cs + (Number(c.amount) || 0), 0), 0);
  const margin = totReceived - totCosts;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 16 }}>
      {[
        { label: 'Active Projects',     value: active.length, color: T,  fmt: false },
        { label: 'Total Contract',      value: totContract,   color: N,  fmt: true  },
        { label: 'Cash Received',       value: totReceived,   color: GR, fmt: true  },
        { label: 'Costs Paid',          value: totCosts,      color: '#856404', fmt: true },
        { label: 'Net Margin',          value: margin,        color: margin >= 0 ? GR : '#C0392B', fmt: true },
      ].map(t => (
        <div key={t.label} style={{ background: '#fff', borderRadius: 6, padding: '12px 14px', border: '1px solid #e0e0e0', borderTop: `3px solid ${t.color}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>{t.label}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: t.color, lineHeight: 1 }}>
            {t.fmt ? fmtEGP(t.value) : t.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lead selector (inside form) ────────────────────────────────────────────────

function LeadSelector({ leads, value, onChange, onAutoFill }) {
  const options = [...leads]
    .filter(l => !['lost', 'nurture', 'unqualified', 'contacted'].includes(l.stage))
    .sort((a, b) => {
      const order = { won: 0, negotiation: 1, proposal_sent: 2, feasibility_delivered: 3 };
      return (order[a.stage] ?? 9) - (order[b.stage] ?? 9);
    });

  const selected = leads.find(l => l.id === value);

  return (
    <div>
      <label style={lbl}>Link to CRM Lead (optional)</label>
      <select
        style={inp}
        value={value || ''}
        onChange={e => {
          const id = e.target.value || null;
          onChange(id);
          if (id) {
            const lead = leads.find(l => l.id === id);
            if (lead) onAutoFill(lead);
          }
        }}
      >
        <option value="">— No linked lead —</option>
        {options.map(l => (
          <option key={l.id} value={l.id}>
            {l.orgName} · {STAGE_LABELS[l.stage] || l.stage} · {l.temperature}
          </option>
        ))}
      </select>
      {selected && (
        <div style={{ marginTop: 4, fontSize: 10, color: T, background: '#e8f8f9', padding: '4px 8px', borderRadius: 4 }}>
          Linked: {selected.orgName} — {selected.contactPerson || 'no contact'}
          {selected.phone ? ` · ${selected.phone}` : ''}
        </div>
      )}
    </div>
  );
}

// ── Project form ───────────────────────────────────────────────────────────────

function ProjectForm({ project, leads, onSave, onCancel }) {
  const [f, setF]   = useState({ ...project });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleAutoFill = (lead) => {
    setF(p => {
      const docs = (!p.documents || p.documents.length === 0) && lead.stageData
        ? scaffoldDocuments(lead, uid)
        : p.documents;
      return {
        ...p,
        clientName:    lead.orgName      || p.clientName,
        systemSizeKW:  lead.systemSizeKW || p.systemSizeKW,
        contractValue: lead.dealValue    || p.contractValue,
        documents:     docs,
        notes: p.notes
          ? p.notes
          : [
              lead.notes      && `CRM Notes: ${lead.notes}`,
              lead.nextAction && `Next Action: ${lead.nextAction}`,
            ].filter(Boolean).join('\n'),
      };
    });
  };

  const handleSave = () => {
    if (!f.name.trim()) {
      setErr('Project name is required.');
      return;
    }
    setErr('');
    const milestones = f.milestones.length > 0 ? f.milestones : mkMilestones(f.contractValue);
    onSave({ ...f, milestones });
  };

  return (
    <div style={{ background: '#fff', border: '2px solid #dde1e7', borderRadius: 8, padding: 18, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: N, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {project.name ? 'Edit Project' : 'New Project'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>

        {/* Lead link — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <LeadSelector
            leads={leads}
            value={f.linkedLeadId}
            onChange={id => set('linkedLeadId', id)}
            onAutoFill={handleAutoFill}
          />
        </div>

        {/* Project name — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Project Name <span style={{ color: '#C0392B' }}>*</span></label>
          <input
            style={{ ...inp, borderColor: err ? '#C0392B' : '#dde1e7' }}
            value={f.name}
            onChange={e => { set('name', e.target.value); if (err) setErr(''); }}
            placeholder="e.g. Cairo Industrial Site — 150 kWp"
          />
          {err && <div style={{ fontSize: 10, color: '#C0392B', marginTop: 3 }}>{err}</div>}
        </div>

        <div>
          <label style={lbl}>Client Name</label>
          <input style={inp} value={f.clientName} onChange={e => set('clientName', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>System Size (kWp)</label>
          <input type="number" style={inp} value={f.systemSizeKW} onChange={e => set('systemSizeKW', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Contract Value (EGP)</label>
          <input type="number" style={inp} value={f.contractValue} onChange={e => set('contractValue', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Status</label>
          <select style={inp} value={f.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(PROJ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Start Date</label>
          <input type="date" style={inp} value={f.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Expected End Date</label>
          <input type="date" style={inp} value={f.expectedEndDate} onChange={e => set('expectedEndDate', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Contingency Budget (%)</label>
          <input type="number" min="0" max="50" style={inp} value={f.contingencyBudgetPct??20} onChange={e => set('contingencyBudgetPct', parseFloat(e.target.value)||20)}
            placeholder="20" title="% of contract value reserved for contingency. Benchmark: 20-22% for Egypt EPC" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Notes</label>
          <textarea rows={2} style={{ ...inp, resize: 'vertical' }} value={f.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={btnS()}>
          {project.name ? 'Save Changes' : 'Create Project'}
        </button>
        <button onClick={onCancel} style={btnS('#f5f5f5', '#555')}>Cancel</button>
      </div>
    </div>
  );
}

// ── Milestone row ──────────────────────────────────────────────────────────────

function MilestoneRow({ ms, onChange }) {
  const m    = MS_STATUS[ms.status];
  const next = { pending: 'invoiced', invoiced: 'received', received: 'pending' };

  const daysOut = ms.status === 'invoiced' && ms.invoicedDate
    ? Math.floor((Date.now() - new Date(ms.invoicedDate)) / 86400000)
    : null;

  const handleStatusClick = () => {
    const newStatus = next[ms.status];
    const updates = { ...ms, status: newStatus };
    if (newStatus === 'invoiced' && !ms.invoicedDate) {
      updates.invoicedDate = new Date().toISOString().split('T')[0];
    }
    onChange(updates);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f2f5', flexWrap: 'wrap' }}>
      <input style={{ ...inp, flex: '1 1 160px', minWidth: 100, fontSize: 11 }}
        value={ms.label} onChange={e => onChange({ ...ms, label: e.target.value })} />
      <input type="number" style={{ ...inp, width: 110, fontSize: 11, textAlign: 'right' }}
        value={ms.amount} onChange={e => onChange({ ...ms, amount: e.target.value })} />
      <input type="date" style={{ ...inp, width: 135, fontSize: 11 }}
        value={ms.dueDate} onChange={e => onChange({ ...ms, dueDate: e.target.value })} />
      <button
        onClick={handleStatusClick}
        style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, color: m.color, background: m.bg, border: `1px solid ${m.color}40`, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {m.label}
      </button>
      {daysOut !== null && (
        <span style={{ fontSize: 9, fontWeight: 700,
          color: daysOut >= 30 ? '#C0392B' : daysOut >= 14 ? '#856404' : '#888',
          background: daysOut >= 30 ? '#fff5f5' : daysOut >= 14 ? '#fff3cd' : '#f5f5f5',
          borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
          {daysOut}d outstanding
        </span>
      )}
    </div>
  );
}

// ── Cost row ───────────────────────────────────────────────────────────────────

function CostRow({ cost, onChange, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5', flexWrap: 'wrap' }}>
      <select style={{ ...inp, width: 130, fontSize: 11, padding: '4px 6px', flex: '0 0 auto' }}
        value={cost.category} onChange={e => onChange({ ...cost, category: e.target.value })}>
        {COST_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <input style={{ ...inp, flex: '1 1 120px', minWidth: 80, fontSize: 11 }}
        value={cost.description} onChange={e => onChange({ ...cost, description: e.target.value })} placeholder="Description" />
      <input style={{ ...inp, flex: '0 1 100px', minWidth: 60, fontSize: 11 }}
        value={cost.vendor} onChange={e => onChange({ ...cost, vendor: e.target.value })} placeholder="Vendor" />
      <input type="number" style={{ ...inp, width: 100, textAlign: 'right', fontSize: 11, flex: '0 0 auto' }}
        value={cost.amount} onChange={e => onChange({ ...cost, amount: e.target.value })} placeholder="EGP" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
        <input type="checkbox" checked={cost.paid} onChange={e => onChange({ ...cost, paid: e.target.checked })} style={{ accentColor: GR }} />
        Paid
      </label>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ddd', padding: '0 2px', flex: '0 0 auto' }}>×</button>
    </div>
  );
}

// ── Procurement row ────────────────────────────────────────────────────────────

function ProcurementRow({ item, onChange, onDelete }) {
  const ic = IEC_STATUS[item.iecCertStatus] || IEC_STATUS.pending;
  const isOverdue = item.expectedDeliveryDate && item.expectedDeliveryDate < new Date().toISOString().split('T')[0];
  const suppliers = (() => { try { return JSON.parse(localStorage.getItem('suppliers_v1')||'[]'); } catch { return []; } })();
  const catKey = item.category; // e.g. 'panels' → match supplier category roughly
  const catMap = { panels:'Panels', inverters:'Inverters', mounting:'BOS / Mounting', dc:'DC Cabling', ac:'AC / Switchgear', other:'Other' };
  const relevantSuppliers = suppliers.filter(s => !catKey || s.category === catMap[catKey] || s.category === 'Other');
  const listId = `sup-list-${item.id}`;

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5', flexWrap: 'wrap' }}>
      <select style={{ ...inp, width: 120, fontSize: 11, flex: '0 0 auto' }}
        value={item.category} onChange={e => onChange({ ...item, category: e.target.value })}>
        {PROCURE_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      {relevantSuppliers.length > 0 && (
        <datalist id={listId}>
          {relevantSuppliers.map(s => <option key={s.id} value={s.name} />)}
        </datalist>
      )}
      <input list={relevantSuppliers.length > 0 ? listId : undefined}
        style={{ ...inp, flex: '1 1 110px', minWidth: 80, fontSize: 11 }}
        value={item.supplier} onChange={e => onChange({ ...item, supplier: e.target.value })} placeholder="Supplier" />
      <input type="number" style={{ ...inp, width: 100, fontSize: 11, textAlign: 'right', flex: '0 0 auto' }}
        value={item.quotedPriceEGP} onChange={e => onChange({ ...item, quotedPriceEGP: e.target.value })} placeholder="EGP" />
      <input style={{ ...inp, flex: '0 1 100px', fontSize: 11 }}
        value={item.orderConfirmNumber} onChange={e => onChange({ ...item, orderConfirmNumber: e.target.value })} placeholder="Order #" />
      <input type="date" style={{ ...inp, width: 130, fontSize: 11,
        color: isOverdue ? '#C0392B' : undefined, fontWeight: isOverdue ? 700 : undefined }}
        value={item.expectedDeliveryDate} onChange={e => onChange({ ...item, expectedDeliveryDate: e.target.value })} />
      <button
        onClick={() => {
          const cycle = { pending: 'received', received: 'missing', missing: 'pending' };
          onChange({ ...item, iecCertStatus: cycle[item.iecCertStatus] || 'pending' });
        }}
        style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
          color: ic.color, background: ic.bg, border: `1px solid ${ic.color}40`,
          cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
        {ic.label}
      </button>
      <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ddd', padding: '0 2px', flex: '0 0 auto' }}>×</button>
    </div>
  );
}

// ── Project comms tab ──────────────────────────────────────────────────────────

function ProjectCommsTab({ project, onChange }) {
  const emptyEntry = { date: '', method: 'Call', summary: '', nextAction: '' };
  const [form, setForm]     = useState(emptyEntry);
  const [showForm, setShowForm] = useState(false);
  const [showNPS, setShowNPS] = useState(false);
  const [npsInput, setNpsInput] = useState('');

  const commsLog = project.commsLog || [];

  const addEntry = () => {
    if (!form.date || !form.summary) return;
    onChange({ ...project, commsLog: [...commsLog, { ...form, id: `comm-${Date.now()}` }] });
    setForm(emptyEntry);
    setShowForm(false);
  };

  const deleteEntry = (id) => onChange({ ...project, commsLog: commsLog.filter(e => e.id !== id) });

  const saveNPS = () => {
    const score = parseInt(npsInput);
    if (isNaN(score) || score < 0 || score > 10) return;
    onChange({ ...project, npsScore: score });
    setShowNPS(false);
    setNpsInput('');
  };

  return (
    <div>
      {/* NPS capture prompt for completed projects */}
      {project.status === 'complete' && project.npsScore === null && (
        <div style={{ background:'#fffbee', border:'1px solid #ffe082', borderRadius:6, padding:'10px 14px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#856404', marginBottom:6 }}>
            How likely is the client to recommend you? Ask: "On a scale of 0–10, how likely are you to refer us to someone?"
          </div>
          {!showNPS ? (
            <button onClick={() => setShowNPS(true)} style={{ ...btnS('#C8991A'), fontSize:10 }}>Record Recommendation Score</button>
          ) : (
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setNpsInput(String(n))}
                    style={{ width:26, height:26, borderRadius:4, border:`1px solid ${npsInput===String(n)?'#0D2137':'#dde1e7'}`,
                      background:npsInput===String(n)?'#0D2137':'#fff', color:npsInput===String(n)?'#fff':'#555',
                      fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={saveNPS} style={{ ...btnS(GR), fontSize:10 }}>Save</button>
              <button onClick={() => setShowNPS(false)} style={{ ...btnS('#f5f5f5','#555'), fontSize:10 }}>Cancel</button>
              <span style={{ fontSize:9, color:'#aaa' }}>0–6 Unlikely to refer · 7–8 Neutral · 9–10 Likely to refer</span>
            </div>
          )}
        </div>
      )}
      {project.status === 'complete' && project.npsScore !== null && (
        <div style={{ background:'#e8f5e9', borderRadius:6, padding:'8px 12px', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, fontWeight:700, color:GR }}>
            Recommendation Score: {project.npsScore}/10 — {project.npsScore>=9?'Will refer 🌟':project.npsScore>=7?'Satisfied':'Unlikely to refer'}
          </span>
          <button onClick={() => onChange({ ...project, npsScore: null })}
            style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer', fontSize:11 }}>re-score</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#aaa' }}>Log every client touchpoint — calls, site visits, WhatsApp exchanges.</div>
        <button onClick={() => setShowForm(v => !v)} style={btnS()}>+ Log</button>
      </div>

      {showForm && (
        <div style={{ background: '#fffbee', border: '1px solid #ffe082', borderRadius: 6, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={lbl}>Date <span style={{ color: '#C0392B' }}>*</span></label>
              <input type="date" style={inp} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Method</label>
              <select style={inp} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                {PROJ_COMM_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Summary <span style={{ color: '#C0392B' }}>*</span></label>
            <textarea rows={2} style={{ ...inp, resize: 'vertical' }}
              value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="What was discussed or decided?" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Next Action</label>
            <input style={inp} value={form.nextAction} onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
              placeholder="e.g. Send installation schedule by Thursday" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addEntry} style={btnS(GR)}>Save</button>
            <button onClick={() => { setShowForm(false); setForm(emptyEntry); }} style={btnS('#f5f5f5', '#555')}>Cancel</button>
          </div>
        </div>
      )}

      {commsLog.length === 0 ? (
        <div style={{ fontSize: 11, color: '#bbb', padding: '12px 0' }}>No communication logged yet.</div>
      ) : (
        [...commsLog].reverse().map(entry => (
          <div key={entry.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: N }}>{entry.date}</span>
              <span style={{ padding: '1px 7px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: '#e8f4fd', color: '#1565c0' }}>
                {entry.method}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: '#333' }}>{entry.summary}</span>
              <button onClick={() => deleteEntry(entry.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ccc', padding: 0 }}>×</button>
            </div>
            {entry.nextAction && (
              <div style={{ fontSize: 10, color: '#b8860b' }}>→ {entry.nextAction}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Document row ───────────────────────────────────────────────────────────────

function DocumentRow({ doc, onChange, onDelete }) {
  const [showNotes, setShowNotes] = useState(false);
  const def = DOC_TYPES.find(d => d.id === doc.type) || DOC_TYPES[DOC_TYPES.length - 1];
  const st  = DOC_STATUS[doc.status] || DOC_STATUS.pending;

  return (
    <div style={{ borderBottom: '1px solid #f0f2f5', paddingBottom: 6, marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

        <span style={{ fontSize: 14, flexShrink: 0 }}>{def.icon}</span>

        {/* Type selector */}
        <select
          style={{ ...inp, width: 180, fontSize: 11, flex: '0 0 auto' }}
          value={doc.type}
          onChange={e => {
            const nd = DOC_TYPES.find(d => d.id === e.target.value);
            onChange({ ...doc, type: e.target.value, name: nd?.label || doc.name, critical: nd?.critical ?? false });
          }}>
          {DOC_PHASES.map(phase => (
            <optgroup key={phase.id} label={phase.label}>
              {DOC_TYPES.filter(d => d.phase === phase.id).map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom name override */}
        <input
          style={{ ...inp, flex: '1 1 110px', minWidth: 80, fontSize: 11 }}
          value={doc.name === def.label ? '' : doc.name}
          onChange={e => onChange({ ...doc, name: e.target.value || def.label })}
          placeholder={def.label}
        />

        {/* Date */}
        <input type="date" style={{ ...inp, width: 130, fontSize: 11 }}
          value={doc.date} onChange={e => onChange({ ...doc, date: e.target.value })} />

        {/* Status badge */}
        <button
          onClick={() => onChange({ ...doc, status: st.next })}
          style={{ padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700,
            color: st.color, background: st.bg, border: `1px solid ${st.color}40`,
            cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
          {st.label}
        </button>

        {/* URL input + open link */}
        <input
          style={{ ...inp, flex: '1 1 150px', minWidth: 100, fontSize: 11 }}
          value={doc.url}
          onChange={e => onChange({ ...doc, url: e.target.value })}
          placeholder="Paste Google Drive / Dropbox link…"
        />
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: T, fontWeight: 700, textDecoration: 'none',
              flexShrink: 0, padding: '4px 8px', background: '#e8f8f9', borderRadius: 4 }}>
            🔗 Open
          </a>
        )}

        {/* Required badge */}
        {doc.critical && doc.status === 'pending' && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C0392B', background: '#fff5f5',
            borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Required
          </span>
        )}

        {/* Notes toggle */}
        <button onClick={() => setShowNotes(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10,
            color: doc.notes ? '#b8860b' : '#ccc', padding: '0 3px', flexShrink: 0 }}
          title={showNotes ? 'Hide notes' : 'Notes'}>
          {showNotes ? '▲' : '▼'}
        </button>

        <button onClick={onDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ddd', padding: '0 2px', flexShrink: 0 }}>×</button>
      </div>

      {showNotes && (
        <input
          style={{ ...inp, marginTop: 5, fontSize: 11, marginLeft: 22 }}
          value={doc.notes}
          onChange={e => onChange({ ...doc, notes: e.target.value })}
          placeholder="Notes (e.g. contract ref, submission date, file version)…"
        />
      )}
    </div>
  );
}

// ── Documents tab ──────────────────────────────────────────────────────────────

function DocumentsTab({ project, onChange }) {
  const documents = project.documents || [];

  const total       = documents.length;
  const collected   = documents.filter(d => d.status !== 'pending').length;
  const critPending = documents.filter(d => d.critical && d.status === 'pending');

  const updateDoc = (id, u) => onChange({ ...project, documents: documents.map(d => d.id === id ? u : d) });
  const deleteDoc = (id)    => onChange({ ...project, documents: documents.filter(d => d.id !== id) });
  const addDoc    = ()      => onChange({ ...project, documents: [...documents, {
    id: uid(), type: 'other', name: 'Other Document',
    date: '', status: 'pending', url: '', notes: '', critical: false,
  }]});

  // Group by phase
  const byPhase = Object.fromEntries(DOC_PHASES.map(p => [p.id, []]));
  documents.forEach(d => {
    const phase = (DOC_TYPES.find(t => t.id === d.type)?.phase) || 'other';
    (byPhase[phase] || byPhase.other).push(d);
  });

  const pct = total > 0 ? Math.round(collected / total * 100) : 0;

  return (
    <div>
      {/* Header: progress + add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 3 }}>
            <span>Document completeness</span>
            <span style={{ fontWeight: 700, color: pct === 100 ? GR : N }}>{pct}% · {collected}/{total}</span>
          </div>
          <div style={{ background: '#eee', borderRadius: 3, height: 5, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%',
              background: pct === 100 ? GR : pct >= 60 ? T : '#C8991A', transition: 'width .3s' }} />
          </div>
        </div>
        <button onClick={addDoc} style={btnS()}>+ Add Document</button>
      </div>

      {/* Critical gap alert */}
      {critPending.length > 0 && (
        <div style={{ background: '#fff5f5', border: '1px solid #C0392B33', borderRadius: 6,
          padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C0392B', marginBottom: 4 }}>
            ⚠ {critPending.length} required document{critPending.length > 1 ? 's' : ''} still pending
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px' }}>
            {critPending.map(d => {
              const def = DOC_TYPES.find(t => t.id === d.type);
              return (
                <span key={d.id} style={{ fontSize: 10, color: '#C0392B' }}>{def?.icon} {d.name}</span>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div style={{ fontSize: 11, color: '#bbb', padding: '20px 0', textAlign: 'center', lineHeight: 1.8 }}>
          No documents yet.
          <br />
          <span style={{ fontSize: 10 }}>Link a CRM lead and it will auto-scaffold the full document checklist from the dossier.</span>
        </div>
      ) : (
        DOC_PHASES.map(phase => {
          const phaseDocs = byPhase[phase.id] || [];
          if (phaseDocs.length === 0) return null;
          const phaseDone = phaseDocs.filter(d => d.status !== 'pending').length;
          const phasePct  = Math.round(phaseDone / phaseDocs.length * 100);

          return (
            <div key={phase.id} style={{ marginBottom: 16 }}>
              {/* Phase header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                paddingBottom: 5, borderBottom: `2px solid ${phase.color}22` }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: phase.color,
                  textTransform: 'uppercase', letterSpacing: '.6px' }}>
                  {phase.label}
                </span>
                <span style={{ fontSize: 9, color: '#aaa', fontWeight: 600 }}>
                  {phaseDone}/{phaseDocs.length}
                </span>
                <div style={{ flex: 1, height: 3, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${phasePct}%`, height: '100%',
                    background: phasePct === 100 ? GR : phase.color, transition: 'width .3s' }} />
                </div>
              </div>

              {phaseDocs.map(d => (
                <DocumentRow key={d.id} doc={d}
                  onChange={u => updateDoc(d.id, u)}
                  onDelete={() => deleteDoc(d.id)} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Dossier data panel (collapsible) ──────────────────────────────────────────

function DossierDataPanel({ title, icon, fields, data, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const filled = fields.filter(([k]) => data[k] !== undefined && data[k] !== '' && data[k] !== false && data[k] != null);
  if (filled.length === 0) return null;
  return (
    <div style={{ border:'1px solid #e0eff0', borderRadius:6, marginBottom:8, overflow:'hidden' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#f5fcfd', cursor:'pointer', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13 }}>{icon}</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#1A6B72' }}>{title}</span>
          <span style={{ fontSize:9, color:'#aaa', fontWeight:700 }}>{filled.length} field{filled.length!==1?'s':''}</span>
        </div>
        <span style={{ fontSize:10, color:'#bbb' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding:'8px 12px 12px', borderTop:'1px solid #e0eff0', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'4px 12px' }}>
          {filled.map(([k, label]) => (
            <div key={k} style={{ padding:'3px 0' }}>
              <div style={{ fontSize:8, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:1 }}>{label}</div>
              <div style={{ fontSize:11, color:'#0D2137', lineHeight:1.4, wordBreak:'break-word' }}>
                {typeof data[k] === 'boolean' ? '✓ Yes' : String(data[k])}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Linked lead panel ──────────────────────────────────────────────────────────

function LinkedLeadPanel({ lead }) {
  const [showDossier, setShowDossier] = useState(false);

  const stageLabel  = STAGE_LABELS[lead.stage] || lead.stage;
  const tempColor   = { Hot: '#C0392B', Warm: '#D4770A', Cold: '#555' }[lead.temperature] || '#555';
  const isOverdue   = lead.nextFollowUp && lead.nextFollowUp < new Date().toISOString().split('T')[0];
  const daysSince   = lead.lastContacted
    ? Math.floor((Date.now() - new Date(lead.lastContacted)) / 86400000)
    : null;

  const field = (label, value) => value ? (
    <div key={label} style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: N }}>{value}</div>
    </div>
  ) : null;

  return (
    <div>
      {showDossier && (
        <DossierModal lead={lead} onClose={() => setShowDossier(false)} onEdit={() => setShowDossier(false)} />
      )}

      {/* Header strip */}
      <div style={{ background: '#f5f7fa', borderRadius: 6, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: N, marginBottom: 3 }}>{lead.orgName}</div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {lead.contactPerson && <span>{lead.contactPerson}</span>}
            {lead.contactRole   && <span> · {lead.contactRole}</span>}
            {lead.segment       && <span> · {lead.segment}</span>}
            {lead.governorate   && <span> · {lead.governorate}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: tempColor, borderRadius: 8, padding: '2px 9px' }}>
            {lead.temperature}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: T, background: '#e8f8f9', borderRadius: 8, padding: '2px 9px' }}>
            {stageLabel}
          </span>
          <button
            onClick={() => setShowDossier(true)}
            style={{ padding: '3px 10px', background: T, color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '.2px' }}>
            📋 Full Dossier
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 0 }}>
        {/* Contact */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: 12, marginRight: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Contact</div>
          {field('Phone',     lead.phone)}
          {field('WhatsApp',  lead.whatsapp)}
          {field('Email',     lead.email)}
          {field('Source',    lead.sourceType)}
        </div>

        {/* Technical */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: 12, marginRight: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Project Details</div>
          {field('Monthly Bill',  lead.monthlyBill ? `EGP ${Number(lead.monthlyBill).toLocaleString()}` : null)}
          {field('System Size',   lead.systemSizeKW ? `${lead.systemSizeKW} kWp` : null)}
          {field('Pain Point',    lead.painPoint)}
          {field('Deal Value',    lead.dealValue ? fmtEGP(lead.dealValue) : null)}
        </div>

        {/* CRM status */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>CRM Status</div>
          {field('Touches',       lead.touches ? `${lead.touches} contacts` : null)}
          {field('Last Contacted', daysSince !== null ? `${daysSince}d ago (${lead.lastContacted})` : null)}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 2 }}>Next Follow-Up</div>
            <div style={{ fontSize: 12, color: isOverdue ? '#C0392B' : N, fontWeight: isOverdue ? 700 : 400 }}>
              {lead.nextFollowUp || '—'}
              {isOverdue && ' ⚠ Overdue'}
            </div>
          </div>
          {field('Next Action',  lead.nextAction)}
        </div>
      </div>

      {/* Dossier panels */}
      {lead.stageData && (() => {
        const sv  = lead.stageData.site_visit_completed  || {};
        const svs = lead.stageData.site_visit_scheduled  || {};
        const fd  = lead.stageData.feasibility_delivered || {};
        const ps  = lead.stageData.proposal_sent         || {};
        const wd  = lead.stageData.won                   || {};
        return (
          <div style={{ marginBottom: 10 }}>
            <DossierDataPanel title="Technical Brief" icon="🔍" defaultOpen={true}
              data={{ ...sv, ...fd }}
              fields={[
                ['roofType',              'Roof Type'],
                ['usableAreaM2',          'Usable Area (m²)'],
                ['azimuthDeg',            'Azimuth (°)'],
                ['tiltDeg',               'Tilt (°)'],
                ['shadingRisk',           'Shading Risk'],
                ['disco',                 'DISCO'],
                ['netMeteringEligible',   'Net Metering'],
                ['recommendedSizeKwp',    'Recommended Size (kWp)'],
                ['estimatedAnnualYieldKwh','Est. Annual Yield (kWh)'],
                ['roughPaybackYears',     'Rough Payback (yr)'],
                ['finalSizeKwp',          'Final Size (kWp)'],
                ['annualYieldKwh',        'Final Yield (kWh/yr)'],
                ['simplePaybackYears',    'Payback (yr)'],
                ['irr',                   'IRR (%)'],
                ['panelBrandModel',       'Panels'],
                ['inverterBrandModel',    'Inverter'],
              ]}
            />
            <DossierDataPanel title="Contract Summary" icon="📄"
              data={{ ...ps, ...wd }}
              fields={[
                ['contractValueEGP',   'Contract Value (EGP)'],
                ['paymentTerms',       'Payment Terms'],
                ['fxClause',           'FX Clause'],
                ['panelBrand',         'Panel Brand'],
                ['inverterBrand',      'Inverter Brand'],
                ['timelineWeeks',      'Timeline (wks)'],
                ['contractRef',        'Contract Ref'],
                ['contractSignedDate', 'Signed Date'],
                ['depositClearedEGP',  'Deposit Cleared (EGP)'],
                ['kickoffDate',        'Kickoff Date'],
              ]}
            />
            <DossierDataPanel title="Engineer Brief" icon="⚡"
              data={{ ...svs, ...sv }}
              fields={[
                ['siteAddress',           'Site Address'],
                ['gpsCoords',             'GPS Coordinates'],
                ['roofType',              'Roof Type'],
                ['totalRoofAreaM2',       'Total Roof Area (m²)'],
                ['usableAreaM2',          'Usable Area (m²)'],
                ['azimuthDeg',            'Azimuth (°)'],
                ['tiltDeg',               'Tilt (°)'],
                ['mainBreakerAmps',       'Main Breaker (A)'],
                ['dbPanelBrand',          'DB Panel Brand'],
                ['gridPhaseConfirmed',    'Grid Phase'],
                ['feederVoltage',         'Feeder Voltage'],
                ['disco',                 'DISCO'],
                ['netMeteringEligible',   'Net Metering Eligible'],
                ['avgMonthlyKwh',         'Avg Monthly kWh'],
                ['peakDemandKva',         'Peak Demand (kVA)'],
                ['operatingProfile',      'Operating Profile'],
                ['facilitiesContactName', 'Facilities Contact'],
                ['facilitiesContactPhone','Facilities Phone'],
              ]}
            />
          </div>
        );
      })()}

      {/* Notes */}
      {lead.notes && (
        <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>CRM Notes</div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lead.notes}</div>
        </div>
      )}

      {/* WhatsApp script */}
      {lead.waScript && (
        <div style={{ background: '#f0faf4', borderRadius: 6, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: GR, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>WhatsApp Script</div>
          <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{lead.waScript}</div>
        </div>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {lead.tags.map(tag => (
            <span key={tag} style={{ fontSize: 9, fontWeight: 700, color: T, background: '#e8f8f9', borderRadius: 8, padding: '2px 8px' }}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Project detail ─────────────────────────────────────────────────────────────

function ProjectDetail({ project, leads, onChange, onDelete }) {
  const linkedLead  = leads.find(l => l.id === project.linkedLeadId);
  const defaultTab  = linkedLead ? 'lead' : 'milestones';
  const [tab, setTab] = useState(defaultTab);

  const totalContract = Number(project.contractValue) || 0;
  const totalReceived = project.milestones.filter(m => m.status === 'received').reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const totalCostPaid = project.costs.filter(c => c.paid).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalCostAll  = project.costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const margin        = totalReceived - totalCostPaid;
  const marginPct     = totalContract > 0 ? Math.round(margin / totalContract * 100) : 0;

  // Rework & contingency
  const reworkTotal = project.costs.filter(c => c.category === 'rework').reduce((s, c) => s + (Number(c.amount)||0), 0);
  const reworkPct   = totalContract > 0 ? Math.round(reworkTotal / totalContract * 100) : 0;
  const contBudPct  = Number(project.contingencyBudgetPct) || 20;
  const contBudget  = Math.round(totalContract * contBudPct / 100);
  const contUsed    = reworkTotal;
  const contRemain  = contBudget - contUsed;
  const contRemPct  = contBudget > 0 ? Math.round(contRemain / contBudget * 100) : 100;

  // Earned Value — work%: weighted milestones done, cost%: costs paid vs budget, revenue%: received vs contract
  const msDone    = project.milestones.filter(m => m.status === 'received' || m.status === 'invoiced');
  const workPct   = totalContract > 0 ? Math.min(100, Math.round(msDone.reduce((s,m)=>s+(Number(m.amount)||0),0) / totalContract * 100)) : 0;
  const costPct   = totalContract > 0 ? Math.min(150, Math.round(totalCostAll / totalContract * 100)) : 0;
  const revPct    = totalContract > 0 ? Math.min(100, Math.round(totalReceived / totalContract * 100)) : 0;

  // Days since last client contact
  const commsLogAll = project.commsLog || [];
  const lastCommsDate = commsLogAll.length > 0
    ? commsLogAll.reduce((max, e) => e.date > max ? e.date : max, '')
    : null;
  const daysSinceContact = lastCommsDate ? Math.floor((Date.now() - new Date(lastCommsDate)) / 86400000) : null;

  // DISCO tracking
  const discoWaitDays = project.discoSubmittedDate && !project.discoApprovedDate
    ? Math.floor((Date.now() - new Date(project.discoSubmittedDate)) / 86400000)
    : null;

  // Change orders
  const unsignedCOs = (project.changeOrders||[]).filter(co => !co.clientSigned).length;

  const invoicedMs    = project.milestones.filter(m => m.status === 'invoiced');
  const totalInvoiced = invoicedMs.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const overdueMs     = invoicedMs.filter(m => m.invoicedDate &&
    Math.floor((Date.now() - new Date(m.invoicedDate)) / 86400000) >= 14);
  const overdueARTotal= overdueMs.reduce((s, m) => s + (Number(m.amount) || 0), 0);

  const procurement   = project.procurement || [];

  const updateMilestone  = (id, u) => onChange({ ...project, milestones: project.milestones.map(m => m.id === id ? u : m) });
  const addMilestone     = () => onChange({ ...project, milestones: [...project.milestones, { id: uid(), label: 'New Milestone', pct: 0, amount: 0, dueDate: '', status: 'pending', invoicedDate: null }] });
  const updateCost       = (id, u) => onChange({ ...project, costs: project.costs.map(c => c.id === id ? u : c) });
  const addCost          = () => onChange({ ...project, costs: [...project.costs, { id: uid(), category: 'panels', description: '', vendor: '', amount: '', paid: false }] });
  const deleteCost       = (id) => onChange({ ...project, costs: project.costs.filter(c => c.id !== id) });
  const updateProcurement= (id, u) => onChange({ ...project, procurement: procurement.map(i => i.id === id ? u : i) });
  const addProcurement   = () => onChange({ ...project, procurement: [...procurement, { id: uid(), category: 'panels', supplier: '', quotedPriceEGP: '', orderConfirmNumber: '', expectedDeliveryDate: '', iecCertStatus: 'pending' }] });
  const deleteProcurement= (id) => onChange({ ...project, procurement: procurement.filter(i => i.id !== id) });

  const catBreakdown = COST_CATS.map(cat => ({
    ...cat,
    total: project.costs.filter(c => c.category === cat.id).reduce((s, c) => s + (Number(c.amount) || 0), 0),
  })).filter(c => c.total > 0);

  const secBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)}
      style={{ padding: '5px 12px', background: tab === id ? N : '#f0f2f5', color: tab === id ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );

  return (
    <div style={{ paddingTop: 14, borderTop: '1px solid #eee' }}>

      {/* Financial strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(105px,1fr))', gap: 8, marginBottom: 8 }}>
        {[
          { label: 'Contract',     value: fmtEGP(totalContract), color: N },
          { label: 'Received',     value: fmtEGP(totalReceived), color: GR },
          { label: 'Invoiced',     value: fmtEGP(totalInvoiced), color: '#1A6B72' },
          { label: 'Costs (paid)', value: fmtEGP(totalCostPaid), color: '#856404' },
          { label: `Margin (${marginPct}%)`, value: fmtEGP(margin), color: margin >= 0 ? GR : '#C0392B' },
          ...(overdueARTotal > 0 ? [{ label: `AR Overdue (${overdueMs.length})`, value: fmtEGP(overdueARTotal), color: '#C0392B' }] : []),
          ...(reworkTotal > 0 ? [{ label: `Rework (${reworkPct}%)`, value: fmtEGP(reworkTotal), color: reworkPct>5?'#C0392B':reworkPct>2?'#856404':'#888' }] : []),
          ...(totalContract > 0 ? [{ label: `Contingency (${contRemPct}% left)`, value: fmtEGP(Math.max(0,contRemain)), color: contRemPct<5?'#C0392B':contRemPct<10?'#856404':GR }] : []),
        ].map(t => (
          <div key={t.label} style={{ background: '#f8f9fa', borderRadius: 6, padding: '8px 10px', borderBottom: `2px solid ${t.color}` }}>
            <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{t.label}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: t.color }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Earned Value 3-bar strip */}
      {totalContract > 0 && (
        <div style={{ background:'#f8f9fa', borderRadius:6, padding:'8px 12px', marginBottom:8, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize:9, fontWeight:800, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', flexShrink:0 }}>Earned Value</div>
          {[
            { label:'Work Done', pct:workPct, color:T },
            { label:'Cost Spent', pct:costPct, color: costPct>workPct+10?'#C0392B':'#856404' },
            { label:'Revenue', pct:revPct, color: revPct<costPct?'#C0392B':GR },
          ].map(ev => (
            <div key={ev.label} style={{ flex:'1 1 80px', minWidth:80 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'#888', marginBottom:2 }}>
                <span>{ev.label}</span><span style={{ fontWeight:700, color:ev.color }}>{ev.pct}%</span>
              </div>
              <div style={{ background:'#e0e0e0', borderRadius:2, height:5, overflow:'hidden' }}>
                <div style={{ width:`${Math.min(100,ev.pct)}%`, height:'100%', background:ev.color, transition:'width .3s' }} />
              </div>
            </div>
          ))}
          {costPct > workPct + 10 && <span style={{ fontSize:9, fontWeight:700, color:'#C0392B' }}>⚠ Cost ahead of work</span>}
          {revPct < costPct && totalCostAll > 0 && <span style={{ fontSize:9, fontWeight:700, color:'#C0392B' }}>⚠ Cash gap</span>}
        </div>
      )}

      {/* DISCO tracker + alerts row */}
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        {/* DISCO dates */}
        <div style={{ display:'flex', gap:8, alignItems:'center', background:'#f5f7fa', borderRadius:6, padding:'6px 10px', flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px' }}>DISCO</span>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <label style={{ fontSize:9, color:'#aaa' }}>Submitted</label>
            <input type="date" style={{ ...inp, width:130, fontSize:10, padding:'3px 6px' }}
              value={project.discoSubmittedDate||''} onChange={e => onChange({ ...project, discoSubmittedDate: e.target.value })} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <label style={{ fontSize:9, color:'#aaa' }}>Approved</label>
            <input type="date" style={{ ...inp, width:130, fontSize:10, padding:'3px 6px' }}
              value={project.discoApprovedDate||''} onChange={e => onChange({ ...project, discoApprovedDate: e.target.value })} />
          </div>
          {discoWaitDays !== null && (
            <span style={{ fontSize:10, fontWeight:800, color:discoWaitDays>21?'#C0392B':'#856404',
              background:discoWaitDays>21?'#fff5f5':'#fff3cd', borderRadius:4, padding:'2px 8px' }}>
              Awaiting approval: {discoWaitDays}d {discoWaitDays>21?'⚠ Chase now':''}
            </span>
          )}
          {project.discoApprovedDate && (
            <span style={{ fontSize:10, fontWeight:700, color:GR, background:'#e8f5e9', borderRadius:4, padding:'2px 8px' }}>✓ DISCO Approved</span>
          )}
        </div>
        {/* Governance badges */}
        {daysSinceContact !== null && ['in_progress','commissioning'].includes(project.status) && (
          <span style={{ fontSize:10, fontWeight:700, padding:'4px 9px', borderRadius:6,
            background:daysSinceContact>14?'#fff5f5':daysSinceContact>7?'#fff3cd':'#f5f5f5',
            color:daysSinceContact>14?'#C0392B':daysSinceContact>7?'#856404':'#888' }}>
            Last contact: {daysSinceContact === 0 ? 'Today' : `${daysSinceContact}d ago`}
          </span>
        )}
        {unsignedCOs > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:'#C0392B', background:'#fff5f5', borderRadius:6, padding:'4px 9px' }}>
            {unsignedCOs} unsigned CO{unsignedCOs>1?'s':''}
          </span>
        )}
        {/* NPS badge for completed projects */}
        {project.status === 'complete' && (
          <span style={{ fontSize:10, fontWeight:700, padding:'4px 9px', borderRadius:6,
            background:project.npsScore!==null?'#e8f5e9':'#fff3cd',
            color:project.npsScore!==null?GR:'#856404' }}>
            {project.npsScore !== null ? `Referral score: ${project.npsScore}/10` : 'Referral score not captured'}
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {linkedLead && secBtn('lead', `Lead: ${linkedLead.orgName}`)}
        {secBtn('milestones', `Milestones (${project.milestones.length})`)}
        {secBtn('costs', `Costs (${project.costs.length})`)}
        {secBtn('procurement', `Procurement (${procurement.length})`)}
        {secBtn('comms', `Comms (${(project.commsLog||[]).length})`)}
        {secBtn('documents', `Docs (${(project.documents||[]).filter(d=>d.status!=='pending').length}/${(project.documents||[]).length})`)}
        {secBtn('sitelog', `Site Log (${(project.siteLogs||[]).length})`)}
        {['commissioning','complete'].includes(project.status) && secBtn('punchlist', `Punch List`)}
        {['commissioning','complete'].includes(project.status) && secBtn('yield', `Yield`)}
        {secBtn('changeorders', `Change Orders (${(project.changeOrders||[]).length})`)}
        {catBreakdown.length > 0 && secBtn('breakdown', 'Breakdown')}
      </div>

      {/* Lead tab */}
      {tab === 'lead' && linkedLead && <LinkedLeadPanel lead={linkedLead} />}

      {/* Milestones */}
      {tab === 'milestones' && (
        <div>
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8 }}>Click status badge to advance: Pending → Invoiced → Received</div>
          {project.milestones.length === 0 && (
            <div style={{ fontSize: 11, color: '#bbb', padding: '12px 0' }}>No milestones yet.</div>
          )}
          {project.milestones.map(ms => (
            <MilestoneRow key={ms.id} ms={ms} onChange={u => updateMilestone(ms.id, u)} />
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={addMilestone} style={btnS('#f0f2f5', '#555')}>+ Add Milestone</button>
            {project.milestones.length === 0 && (
              <button onClick={() => onChange({ ...project, milestones: mkMilestones(project.contractValue) })}
                style={btnS()}>Generate 30/30/30/10 Milestones</button>
            )}
          </div>
        </div>
      )}

      {/* Costs */}
      {tab === 'costs' && (
        <div>
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8 }}>Check "Paid" when payment is confirmed. Unpaid costs show as committed.</div>
          {project.costs.length === 0 && (
            <div style={{ fontSize: 11, color: '#bbb', padding: '12px 0' }}>No costs logged yet.</div>
          )}
          {project.costs.map(c => (
            <CostRow key={c.id} cost={c} onChange={u => updateCost(c.id, u)} onDelete={() => deleteCost(c.id)} />
          ))}
          <button onClick={addCost} style={{ ...btnS('#f0f2f5', '#555'), marginTop: 10 }}>+ Add Cost Item</button>
        </div>
      )}

      {/* Procurement */}
      {tab === 'procurement' && (
        <div>
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8 }}>
            Track every equipment order. IEC certificates required for NREA compliance.
            Click IEC badge to cycle: Pending → Received → Missing.
          </div>
          {procurement.length === 0 && (
            <div style={{ fontSize: 11, color: '#bbb', padding: '12px 0' }}>No procurement items yet.</div>
          )}
          {(() => {
            const missingCerts = procurement.filter(i => i.iecCertStatus === 'missing');
            const overdueDeliveries = procurement.filter(i => i.expectedDeliveryDate && i.expectedDeliveryDate < new Date().toISOString().split('T')[0]);
            const totalQuoted = procurement.reduce((s, i) => s + (Number(i.quotedPriceEGP) || 0), 0);
            return (
              <>
                {(missingCerts.length > 0 || overdueDeliveries.length > 0) && (
                  <div style={{ background: '#fff5f5', border: '1px solid #C0392B33', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 11, color: '#C0392B' }}>
                    {missingCerts.length > 0 && <div>⚠ {missingCerts.length} item{missingCerts.length > 1 ? 's' : ''} missing IEC certificates — collect before commissioning</div>}
                    {overdueDeliveries.length > 0 && <div>⚠ {overdueDeliveries.length} delivery overdue — chase supplier</div>}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4, display: 'flex', gap: 12 }}>
                  <span>Supplier · EGP · Order# · Expected · IEC Cert</span>
                  {totalQuoted > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: N }}>Total quoted: {fmtEGP(totalQuoted)}</span>}
                </div>
              </>
            );
          })()}
          {procurement.map(i => (
            <ProcurementRow key={i.id} item={i} onChange={u => updateProcurement(i.id, u)} onDelete={() => deleteProcurement(i.id)} />
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={addProcurement} style={btnS('#f0f2f5', '#555')}>+ Add Item</button>
            {procurement.length === 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: '#aaa' }}>or load a BOM template:</span>
                {BOM_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => {
                    const items = tpl.items.map(t => ({ id: uid(), ...t, quotedPriceEGP: String(t.unitEGP * (t.qty||1)), orderConfirmNumber: '', expectedDeliveryDate: '', iecCertStatus: 'pending' }));
                    onChange({ ...project, procurement: items });
                  }} style={{ ...btnS(T, '#fff'), padding: '4px 10px', fontSize: 10 }}>
                    {tpl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comms */}
      {tab === 'comms' && (
        <ProjectCommsTab project={project} onChange={onChange} />
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <DocumentsTab project={project} onChange={onChange} />
      )}

      {/* Site Log */}
      {tab === 'sitelog' && (
        <DailySiteLogTab project={project} onChange={onChange} />
      )}

      {/* Punch List */}
      {tab === 'punchlist' && ['commissioning','complete'].includes(project.status) && (
        <PunchListTab project={project} onChange={onChange} />
      )}

      {/* Yield Tracker */}
      {tab === 'yield' && ['commissioning','complete'].includes(project.status) && (
        <YieldTrackerTab project={project} onChange={onChange} linkedLead={linkedLead} />
      )}

      {/* Change Orders */}
      {tab === 'changeorders' && (
        <ChangeOrderTab project={project} onChange={onChange} />
      )}

      {/* Breakdown */}
      {tab === 'breakdown' && (
        <div>
          {catBreakdown.map(cat => {
            const pct = totalCostAll > 0 ? Math.round(cat.total / totalCostAll * 100) : 0;
            return (
              <div key={cat.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: cat.color, marginBottom: 3 }}>
                  <span>{cat.label}</span>
                  <span>{fmtEGP(cat.total)} ({pct}%)</span>
                </div>
                <div style={{ background: '#eee', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: cat.color, transition: 'width .3s' }} />
                </div>
              </div>
            );
          })}
          {totalCostAll > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: N, marginTop: 10, paddingTop: 10, borderTop: '1px solid #eee' }}>
              Total committed: {fmtEGP(totalCostAll)}
              {totalContract > 0 && <span style={{ color: '#888', fontWeight: 400 }}> ({Math.round(totalCostAll / totalContract * 100)}% of contract)</span>}
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { if (window.confirm(`Delete "${project.name}"?`)) onDelete(project.id); }}
          style={{ padding: '4px 12px', background: '#fff5f5', color: '#C0392B', border: '1px solid #C0392B40', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          Delete Project
        </button>
      </div>
    </div>
  );
}

// ── Project card ───────────────────────────────────────────────────────────────

function ProjectCard({ project, leads, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);

  const ps   = PROJ_STATUS[project.status] || PROJ_STATUS.planning;
  const cv   = Number(project.contractValue) || 0;
  const recv = project.milestones.filter(m => m.status === 'received').reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const pct  = cv > 0 ? Math.min(100, Math.round(recv / cv * 100)) : 0;
  const link = leads.find(l => l.id === project.linkedLeadId);

  const docs        = project.documents || [];
  const docsTotal   = docs.length;
  const docsDone    = docs.filter(d => d.status !== 'pending').length;
  const critMissing = docs.filter(d => d.critical && d.status === 'pending').length;

  const cardCommsLog  = project.commsLog || [];
  const cardLastComms = cardCommsLog.length > 0 ? cardCommsLog.reduce((max,e)=>e.date>max?e.date:max,'') : null;
  const cardDaysSince = cardLastComms ? Math.floor((Date.now()-new Date(cardLastComms))/86400000) : null;
  const cardUnsignedCOs = (project.changeOrders||[]).filter(co=>!co.clientSigned).length;
  const cardDiscoWait = project.discoSubmittedDate && !project.discoApprovedDate
    ? Math.floor((Date.now()-new Date(project.discoSubmittedDate))/86400000) : null;

  if (editing) {
    return (
      <ProjectForm
        project={project}
        leads={leads}
        onSave={f => { onUpdate(f); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', borderLeft: `4px solid ${ps.color}`, marginBottom: 10, overflow: 'hidden' }}>
      <div
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: N }}>{project.name}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{project.clientName}{project.systemSizeKW ? ` · ${project.systemSizeKW} kWp` : ''}</span>
            {link && (
              <span style={{ fontSize: 9, fontWeight: 700, color: T, background: '#e8f8f9', borderRadius: 8, padding: '1px 7px' }}>
                CRM: {link.orgName}
              </span>
            )}
            {docsTotal > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700,
                color: critMissing > 0 ? '#C0392B' : docsDone === docsTotal ? GR : '#888',
                background: critMissing > 0 ? '#fff5f5' : '#f5f5f5',
                borderRadius: 4, padding: '1px 6px' }}>
                📄 {docsDone}/{docsTotal}
              </span>
            )}
            {cardDaysSince !== null && ['in_progress','commissioning'].includes(project.status) && cardDaysSince > 7 && (
              <span style={{ fontSize:9, fontWeight:700, borderRadius:4, padding:'1px 6px',
                background:cardDaysSince>14?'#fff5f5':'#fff3cd',
                color:cardDaysSince>14?'#C0392B':'#856404' }}>
                {cardDaysSince}d no contact
              </span>
            )}
            {cardUnsignedCOs > 0 && (
              <span style={{ fontSize:9, fontWeight:700, color:'#C0392B', background:'#fff5f5', borderRadius:4, padding:'1px 6px' }}>
                CO unsigned
              </span>
            )}
            {cardDiscoWait !== null && cardDiscoWait > 21 && (
              <span style={{ fontSize:9, fontWeight:700, color:'#C0392B', background:'#fff5f5', borderRadius:4, padding:'1px 6px' }}>
                DISCO {cardDiscoWait}d
              </span>
            )}
          </div>
        </div>

        <span style={{ fontSize: 10, fontWeight: 700, color: ps.color, background: ps.bg, borderRadius: 8, padding: '2px 9px', whiteSpace: 'nowrap' }}>
          {ps.label}
        </span>

        {cv > 0 && (
          <div style={{ textAlign: 'right', minWidth: 110 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{fmtEGP(recv)} / {fmtEGP(cv)}</div>
            <div style={{ background: '#eee', borderRadius: 3, height: 5, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? GR : '#C8991A', transition: 'width .3s' }} />
            </div>
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); setEditing(true); }}
          style={{ padding: '3px 10px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          Edit
        </button>
        <span style={{ fontSize: 10, color: '#ccc' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          <ProjectDetail project={project} leads={leads} onChange={onUpdate} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function ProjectTracker() {
  const [projects, setProjects] = useState(loadProjects);
  const [leads,    setLeads]    = useState(loadLeads);
  const [formProject, setFormProject] = useState(null); // null = closed, object = open

  // Refresh leads every 5s in case CRM tab updated them
  useEffect(() => {
    const id = setInterval(() => setLeads(loadLeads()), 5000);
    return () => clearInterval(id);
  }, []);

  const save = useCallback((next) => {
    setProjects(next);
    saveProjects(next);
  }, []);

  const openNewForm = () => setFormProject(newProject());

  const addProject = (p) => {
    save([...projects, p]);
    setFormProject(null);
  };

  const updateProject = (p) => save(projects.map(x => x.id === p.id ? p : x));
  const deleteProject = (id) => save(projects.filter(p => p.id !== id));

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      {projects.length > 0 && <SummaryBar projects={projects} />}

      {formProject && (
        <ProjectForm
          project={formProject}
          leads={leads}
          onSave={addProject}
          onCancel={() => setFormProject(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: N }}>
          {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </div>
        {!formProject && (
          <button onClick={openNewForm} style={btnS()}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 && !formProject && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 8, border: '1px dashed #ddd', color: '#bbb', fontSize: 12 }}>
          Add your first project to start tracking costs and payment milestones.
          <br />
          <span style={{ fontSize: 11 }}>You can link a CRM lead to auto-populate client info.</span>
        </div>
      )}

      {projects.map(p => (
        <ProjectCard key={p.id} project={p} leads={leads} onUpdate={updateProject} onDelete={deleteProject} />
      ))}
    </div>
  );
}
