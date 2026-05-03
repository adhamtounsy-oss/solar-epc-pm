import { useState, useEffect, useCallback } from 'react';
import {
  computeFullState, INIT_FOS_STATE, STRATEGY,
  fmtEgpShort, todayStr,
} from '../engine/fosEngine';
import { TrelloPanel } from './TrelloPanel';

// ── Storage ───────────────────────────────────────────────────────────────────
const LS_FOS   = 'fos_state_v3';
const LS_LEADS = 'crm_leads_v3';

const loadFOS   = () => { try { const s = localStorage.getItem(LS_FOS);   if (s) return JSON.parse(s); } catch {} return null; };
const loadLeads = () => { try { const s = localStorage.getItem(LS_LEADS); if (s) return JSON.parse(s); } catch {} return []; };
const saveFOS   = (d) => { try { localStorage.setItem(LS_FOS, JSON.stringify(d)); } catch {} };

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:    '#0D2137',
  gold:    '#C8991A',
  teal:    '#1A6B72',
  red:     '#C0392B',
  green:   '#1E7E34',
  amber:   '#856404',
  bg:      '#f0f2f5',
  surface: '#fff',
};

const MODE_CONFIG = {
  normal:   { bg:'#0D2137', accent:'#1A6B72', text:'#7ed9e8', badge:'NORMAL MODE',   sub:'All systems nominal — execute with precision' },
  recovery: { bg:'#3d2800', accent:'#C8991A', text:'#ffe066', badge:'RECOVERY MODE', sub:'Focus: revenue tasks only — pipeline and close' },
  survival: { bg:'#3d0000', accent:'#C0392B', text:'#ff9999', badge:'SURVIVAL MODE', sub:'EMERGENCY — revenue actions only — no discretionary spend' },
};

const URGENCY_COLOR = { critical:'#C0392B', high:'#856404', medium:'#1A6B72', low:'#888' };
const URGENCY_BG    = { critical:'#fff5f5',  high:'#fff3cd',  medium:'#e8f8f9', low:'#f5f5f5' };

const TYPE_COLOR  = { REVENUE:'#1E7E34', CRITICAL:'#C0392B', COMPLIANCE:'#856404' };
const TYPE_BG     = { REVENUE:'#e8f5e9', CRITICAL:'#fff5f5', COMPLIANCE:'#fff3cd' };

// ── Mini-components ────────────────────────────────────────────────────────────

const Tag = ({ label, color, bg }) => (
  <span style={{ fontSize:9, fontWeight:900, letterSpacing:'.8px', textTransform:'uppercase',
    color, background:bg, borderRadius:3, padding:'2px 7px', whiteSpace:'nowrap' }}>
    {label}
  </span>
);

const StatusDot = ({ status }) => {
  const c = { done:'#1E7E34', warn:'#C8991A', critical:'#C0392B', pending:'#aaa' };
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:c[status]||'#aaa', flexShrink:0, marginTop:2 }} />;
};

const Divider = () => <div style={{ height:1, background:'#f0f2f5', margin:'8px 0' }} />;

// ── Section header ────────────────────────────────────────────────────────────
const SHead = ({ label, color=C.navy }) => (
  <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'1.2px', color, marginBottom:12 }}>{label}</div>
);

// ── Card shell ────────────────────────────────────────────────────────────────
const Card = ({ children, accent, style={} }) => (
  <div style={{ background:C.surface, borderRadius:8, padding:18,
    boxShadow:'0 1px 4px rgba(0,0,0,.09)',
    borderTop: accent ? `3px solid ${accent}` : undefined,
    ...style }}>
    {children}
  </div>
);

// ── FOS Input Form ─────────────────────────────────────────────────────────────
const InputPanel = ({ state, onUpdate, onClose }) => {
  const [f, setF] = useState({ ...state });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setHC = (k, v) => setF(p => ({ ...p, headcount: { ...p.headcount, [k]: Number(v) } }));

  const save = () => { onUpdate(f); onClose(); };

  const inp = { border:'1px solid #dde1e7', borderRadius:4, padding:'7px 10px', fontSize:13,
    fontFamily:'inherit', color:C.navy, width:'100%', boxSizing:'border-box' };
  const lbl = { fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4, display:'block' };

  return (
    <div style={{ background:C.surface, border:'2px solid #dde1e7', borderRadius:8, padding:20, marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:900, color:C.navy, textTransform:'uppercase', letterSpacing:'.5px' }}>
          Update Company Status
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'#aaa' }}>×</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:16 }}>
        <div>
          <label style={lbl}>Company Start Date</label>
          <input type="date" style={inp} value={f.startDate||''} onChange={e=>set('startDate',e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Strategy</label>
          <select style={inp} value={f.strategy||'A'} onChange={e=>set('strategy',e.target.value)}>
            {Object.entries(STRATEGY).map(([k,v])=><option key={k} value={k}>{k} — {v.label.split(' — ')[1]}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Cash Position (EGP)</label>
          <input type="number" min="0" style={inp} value={f.cash||''} onChange={e=>set('cash',Number(e.target.value))} />
        </div>
        <div>
          <label style={lbl}>Monthly Burn Rate (EGP)</label>
          <input type="number" min="0" style={inp} value={f.monthlyBurn||''} onChange={e=>set('monthlyBurn',Number(e.target.value))} />
        </div>
        <div>
          <label style={lbl}>Engineers on Payroll</label>
          <input type="number" min="0" max="10" style={inp} value={f.headcount?.numEngineers||0} onChange={e=>setHC('numEngineers',e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Technicians on Payroll</label>
          <input type="number" min="0" max="20" style={inp} value={f.headcount?.numTechnicians||0} onChange={e=>setHC('numTechnicians',e.target.value)} />
        </div>
        <div>
          <label style={lbl}>USD/EGP Rate</label>
          <input type="number" min="1" style={inp} value={f.currentUSDEGP||50} onChange={e=>set('currentUSDEGP',parseFloat(e.target.value)||50)} />
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
        {[
          { k:'gafiRegistered',     label:'GAFI Registry Done' },
          { k:'taxRegistered',      label:'Tax Registration Done' },
          { k:'syndicateRegistered',label:'Syndicate Registered' },
          { k:'discoPreRegistered', label:'DISCO Pre-Registered' },
          { k:'engineerHired',      label:'Engineer Hired' },
          { k:'bankAccountOpen',    label:'Bank Account Open' },
          { k:'lawyerEngaged',      label:'Lawyer Engaged' },
          { k:'nreaSubmitted',      label:'NREA Submitted' },
          { k:'egyptERASubmitted',  label:'EgyptERA Submitted' },
          { k:'fxAlertActive',      label:'FX Alert Active' },
          { k:'depositCollected',   label:'Deposit Collected' },
          { k:'discoSubmitted',     label:'DISCO Submitted' },
          { k:'overdraftActive',    label:'Overdraft Active' },
          { k:'depositRefused',     label:'Client Refused Deposit' },
          { k:'nreaReportOverdue',  label:'NREA Report Overdue' },
        ].map(({ k, label }) => (
          <label key={k} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, userSelect:'none' }}>
            <input type="checkbox" checked={f[k]||false} onChange={e=>set(k,e.target.checked)}
              style={{ accentColor:C.teal, width:14, height:14, cursor:'pointer' }} />
            {label}
          </label>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button onClick={onClose} style={{ padding:'8px 16px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
        <button onClick={save}    style={{ padding:'8px 18px', background:C.navy,    color:'#fff', border:'none', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
      </div>
    </div>
  );
};

// ── Primary Decision Card ──────────────────────────────────────────────────────
const DecisionCard = ({ decision }) => {
  const [chosen, setChosen] = useState(null);

  if (decision.urgency === 'low') return (
    <Card accent={C.teal} style={{ height:'100%' }}>
      <SHead label="Decision Engine" color={C.teal} />
      <div style={{ fontSize:14, fontWeight:800, color:C.navy, marginBottom:8 }}>No critical decisions pending</div>
      <div style={{ fontSize:12, color:'#888', lineHeight:1.6, marginBottom:14 }}>System in execution mode. Maintain pipeline velocity and weekly KPI review.</div>
      <Divider />
      <div style={{ fontSize:10, fontWeight:700, color:C.teal, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Execution targets</div>
      {[
        '3+ new leads qualified per week',
        'Site visit conversion ≥ 40%',
        'Proposal → contract in ≤ 30 days',
        'Zero overdue follow-ups by EOW',
      ].map(t => <div key={t} style={{ fontSize:12, color:'#555', padding:'3px 0' }}>→ {t}</div>)}
    </Card>
  );

  const urgColor = URGENCY_COLOR[decision.urgency];
  const urgBg    = URGENCY_BG[decision.urgency];

  return (
    <Card accent={urgColor} style={{ height:'100%', borderTop:`3px solid ${urgColor}` }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
        <Tag label={decision.category} color={urgColor} bg={urgBg} />
        <Tag label={decision.urgency === 'critical' ? 'DECIDE NOW' : 'DECISION REQUIRED'}
             color={urgColor} bg={urgBg} />
      </div>

      <div style={{ fontSize:15, fontWeight:900, color:C.navy, lineHeight:1.3, marginBottom:10 }}>
        {decision.question}
      </div>

      <div style={{ fontSize:11, color:'#555', lineHeight:1.65, padding:'10px 12px',
        background:'#f8f9fa', borderRadius:6, borderLeft:`3px solid ${urgColor}`, marginBottom:14 }}>
        {decision.context}
      </div>

      {chosen !== null ? (
        <div style={{ background:urgBg, border:`1px solid ${urgColor}33`, borderRadius:6, padding:'12px 14px',
          fontSize:12, color:urgColor, fontWeight:600, lineHeight:1.5 }}>
          Decision noted. Update status panel to reflect outcome.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {decision.options.map((opt, i) => (
            <button key={i} onClick={() => setChosen(i)}
              style={{ padding:'11px 14px', background: i === 0 ? C.navy : '#fff',
                color: i === 0 ? '#fff' : C.navy, border:`2px solid ${C.navy}`, borderRadius:6,
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                lineHeight:1.45, transition:'all .12s' }}>
              <div style={{ marginBottom:3 }}>{opt.label}</div>
              <div style={{ fontSize:10, fontWeight:400, opacity:.65, lineHeight:1.5 }}>{opt.detail}</div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

// ── Today's Actions ────────────────────────────────────────────────────────────
const TodayActions = ({ actions }) => {
  const [done, setDone] = useState({});

  return (
    <Card accent={C.gold} style={{ height:'100%' }}>
      <SHead label="Do This Today" color={C.gold} />
      {actions.length === 0 ? (
        <div style={{ fontSize:12, color:'#888', fontStyle:'italic' }}>No urgent actions. Maintain pipeline velocity.</div>
      ) : (
        actions.map((a, i) => {
          const tc = TYPE_COLOR[a.type] || TYPE_COLOR.CRITICAL;
          const tb = TYPE_BG[a.type] || TYPE_BG.CRITICAL;
          const isDone = done[a.id];
          return (
            <div key={a.id} onClick={() => setDone(d => ({ ...d, [a.id]: !d[a.id] }))}
              style={{ display:'flex', gap:10, padding:'10px 0',
                borderBottom: i < actions.length - 1 ? '1px solid #f0f2f5' : 'none',
                cursor:'pointer', opacity: isDone ? .4 : 1 }}>
              <div style={{ fontSize:16, fontWeight:900, color: isDone ? '#aaa' : C.gold,
                flexShrink:0, lineHeight:1.2, minWidth:18 }}>
                {isDone ? '✓' : i + 1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:5, marginBottom:4, flexWrap:'wrap' }}>
                  <Tag label={a.type} color={tc} bg={tb} />
                  {a.urgency === 'critical' && !isDone &&
                    <Tag label="URGENT" color={C.red} bg='#fff5f5' />}
                </div>
                <div style={{ fontSize:12, color: isDone ? '#888' : C.navy, fontWeight:600,
                  lineHeight:1.45, textDecoration: isDone ? 'line-through' : 'none' }}>
                  {a.label}
                </div>
                {a.context && !isDone && (
                  <div style={{ fontSize:10, color:'#999', marginTop:3, lineHeight:1.4 }}>{a.context}</div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div style={{ marginTop:8, fontSize:9, color:'#ccc' }}>Click item to mark done · Resets on next update</div>
    </Card>
  );
};

// ── Break-Next Risks ───────────────────────────────────────────────────────────
const BreakNext = ({ risks }) => (
  <Card accent={risks.some(r => r.urgency === 'critical') ? C.red : C.amber}>
    <SHead label="What Breaks Next" color={risks.some(r => r.urgency === 'critical') ? C.red : C.amber} />
    {risks.length === 0 ? (
      <div style={{ fontSize:12, color:'#888', fontStyle:'italic' }}>No imminent risks detected. Maintain current pace.</div>
    ) : (
      risks.map((r, i) => (
        <div key={r.id} style={{ padding:'10px 0', borderBottom: i < risks.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
          <div style={{ display:'flex', gap:6, alignItems:'flex-start', marginBottom:4 }}>
            <Tag label={r.urgency.toUpperCase()} color={URGENCY_COLOR[r.urgency]} bg={URGENCY_BG[r.urgency]} />
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, lineHeight:1.35, flex:1 }}>{r.title}</div>
          </div>
          <div style={{ fontSize:11, color:'#666', lineHeight:1.5, marginBottom:4 }}>{r.description}</div>
          <div style={{ fontSize:11, fontWeight:600, color:C.teal }}>→ {r.action}</div>
        </div>
      ))
    )}
  </Card>
);

// ── Cash Projection ────────────────────────────────────────────────────────────
const CashPanel = ({ cashProjection }) => {
  const { months, cash, actualBurn, runway, breachMonth, mode } = cashProjection;

  const maxVal = Math.max(...months.map(m => Math.max(m.cash, 0)), cash);
  const FLOOR  = 200000;
  const RCVRY  = 500000;

  const barColor = (v) =>
    v < FLOOR ? C.red : v < RCVRY ? C.amber : C.teal;

  const modeColors = {
    normal:   { accent: C.teal,  label: 'HEALTHY' },
    recovery: { accent: C.amber, label: 'CAUTION' },
    survival: { accent: C.red,   label: 'CRITICAL' },
  };
  const mc = modeColors[mode];

  return (
    <Card accent={mc.accent}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <SHead label="Cash Projection (6 months)" color={mc.accent} />
        <Tag label={mc.label} color={mc.accent} bg={URGENCY_BG[mode === 'normal' ? 'medium' : mode === 'recovery' ? 'high' : 'critical']} />
      </div>

      <div style={{ display:'flex', gap:20, marginBottom:14 }}>
        <div>
          <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Current Cash</div>
          <div style={{ fontSize:18, fontWeight:900, color: barColor(cash), lineHeight:1 }}>{fmtEgpShort(cash)}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Burn / Month</div>
          <div style={{ fontSize:18, fontWeight:900, color:C.navy, lineHeight:1 }}>{fmtEgpShort(actualBurn)}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Runway</div>
          <div style={{ fontSize:18, fontWeight:900, color: runway < 3 ? C.red : runway < 6 ? C.amber : C.green, lineHeight:1 }}>
            {runway > 24 ? '24+ mo' : `${runway} mo`}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:70, marginBottom:8 }}>
        {months.map(m => {
          const pct = maxVal > 0 ? Math.max(0, m.cash) / maxVal : 0;
          const isBreach = breachMonth !== null && m.month === breachMonth;
          return (
            <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <div style={{ fontSize:9, color: barColor(m.cash), fontWeight:700 }}>{fmtEgpShort(m.cash)}</div>
              <div style={{ width:'100%', height:`${Math.max(4, pct * 55)}px`,
                background: barColor(m.cash), borderRadius:'2px 2px 0 0',
                outline: isBreach ? `2px solid ${C.red}` : 'none' }} />
              <div style={{ fontSize:9, color:'#888' }}>M{m.month}</div>
            </div>
          );
        })}
      </div>

      {/* Floor markers */}
      <div style={{ fontSize:10, color:'#aaa', display:'flex', gap:12, flexWrap:'wrap' }}>
        <span style={{ color:C.red }}>▬ Floor: EGP 200K</span>
        <span style={{ color:C.amber }}>▬ Recovery: EGP 500K</span>
        {breachMonth && <span style={{ color:C.red, fontWeight:700 }}>⚠ Floor breach: Month {breachMonth}</span>}
      </div>
    </Card>
  );
};

// ── Pipeline Strip ─────────────────────────────────────────────────────────────
const PipelineStrip = ({ crm }) => {
  const pipeMetrics = [
    { label:'Total Leads',     value:crm.totalLeads,         target:30,  color:C.teal },
    { label:'Qualified',       value:crm.qualifiedLeads,     target:8,   color:C.teal },
    { label:'Hot Leads',       value:crm.hotLeads,           target:3,   color:C.red  },
    { label:'Site Visits Done',value:crm.siteVisitsComplete, target:8,   color:C.teal },
    { label:'Studies Sold',    value:crm.feasibilitySold,    target:3,   color:C.green },
    { label:'Proposals Out',   value:crm.proposalsOut,       target:2,   color:C.amber },
    { label:'Contracts Won',   value:crm.contractsSigned,    target:1,   color:C.green },
    { label:'Overdue F/Up',    value:crm.overdueFollowUps,   target:0,   color:crm.overdueFollowUps > 0 ? C.red : C.green, reverse:true },
  ];

  return (
    <Card>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <SHead label="Pipeline Intelligence (live from CRM)" color={C.navy} />
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Weighted Pipeline</div>
            <div style={{ fontSize:14, fontWeight:900, color:C.teal }}>{fmtEgpShort(crm.weightedPipeline)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Won Revenue</div>
            <div style={{ fontSize:14, fontWeight:900, color:C.green }}>{fmtEgpShort(crm.expectedRevenue)}</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8 }}>
        {pipeMetrics.map(m => {
          const isGood = m.reverse ? m.value <= m.target : m.value >= m.target;
          const pct = m.reverse
            ? (m.value === 0 ? 100 : 0)
            : Math.min(100, m.target > 0 ? Math.round(m.value / m.target * 100) : 0);
          const barColor = isGood ? C.green : pct >= 50 ? C.amber : C.red;

          return (
            <div key={m.label} style={{ background:'#f8f9fa', borderRadius:6, padding:'10px 12px',
              borderBottom:`3px solid ${barColor}` }}>
              <div style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase',
                letterSpacing:'.4px', marginBottom:4, lineHeight:1.3 }}>{m.label}</div>
              <div style={{ fontSize:22, fontWeight:900, color:barColor, lineHeight:1 }}>
                {m.value}
                {!m.reverse && <span style={{ fontSize:11, color:'#ccc', fontWeight:400 }}>/{m.target}</span>}
              </div>
              <div style={{ background:'#e0e0e0', borderRadius:2, height:3, marginTop:6, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:barColor, transition:'width .3s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ── Hiring Panel ───────────────────────────────────────────────────────────────
const HiringPanel = ({ hiring }) => (
  <Card accent={C.navy}>
    <SHead label="Hiring Decisions" color={C.navy} />
    {hiring.length === 0 ? (
      <div style={{ fontSize:12, color:'#888', fontStyle:'italic' }}>No hiring decisions required at current state.</div>
    ) : (
      hiring.map((h, i) => {
        const color = h.urgency === 'critical' ? C.red : h.urgency === 'high' ? C.amber : C.teal;
        const bg    = URGENCY_BG[h.urgency] || '#f5f5f5';
        return (
          <div key={h.role} style={{ padding:'11px 0', borderBottom: i < hiring.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
              <div style={{ fontSize:12, fontWeight:800, color:C.navy }}>{h.role}</div>
              <Tag label={h.status} color={color} bg={bg} />
            </div>
            {h.salary && <div style={{ fontSize:11, color:'#888', marginBottom:4 }}>{h.salary}</div>}
            <div style={{ fontSize:11, color:'#555', lineHeight:1.5, marginBottom: h.condition ? 4 : 0 }}>{h.reason}</div>
            {h.condition && (
              <div style={{ fontSize:10, color:color, background:bg, borderRadius:4, padding:'4px 8px',
                lineHeight:1.5, borderLeft:`2px solid ${color}` }}>
                {h.condition}
              </div>
            )}
          </div>
        );
      })
    )}
  </Card>
);

// ── Do-Not List ────────────────────────────────────────────────────────────────
const DoNotPanel = ({ items }) => (
  <Card>
    <SHead label="Do NOT Do This" color={C.red} />
    {items.map((item, i) => (
      <div key={i} style={{ padding:'8px 0', borderBottom: i < items.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.red, marginBottom:2 }}>✗ {item.action}</div>
        <div style={{ fontSize:11, color:'#666', lineHeight:1.4 }}>{item.reason}</div>
      </div>
    ))}
  </Card>
);

// ── Compliance Panel ───────────────────────────────────────────────────────────
const CompliancePanel = ({ compliance }) => {
  const statusColor = { done:C.green, warn:C.amber, critical:C.red, pending:'#aaa' };
  const statusLabel = { done:'DONE', warn:'DUE SOON', critical:'CRITICAL', pending:'PENDING' };

  return (
    <Card>
      <SHead label="Compliance & Legal" color={C.navy} />
      {compliance.items.map((item, i) => (
        <div key={item.id} style={{ display:'flex', gap:10, padding:'8px 0',
          borderBottom: i < compliance.items.length - 1 ? '1px solid #f0f2f5' : 'none',
          opacity: item.status === 'pending' ? .7 : 1 }}>
          <StatusDot status={item.status} />
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{item.label}</div>
              <Tag label={statusLabel[item.status] || item.status.toUpperCase()}
                   color={statusColor[item.status] || '#888'}
                   bg={URGENCY_BG[item.status === 'critical' ? 'critical' : item.status === 'warn' ? 'high' : 'low']} />
            </div>
            <div style={{ fontSize:10, color:'#888', marginTop:2, lineHeight:1.4 }}>{item.detail}</div>
            {item.blocking && item.status !== 'done' && (
              <div style={{ fontSize:9, color:C.red, fontWeight:700, marginTop:2 }}>
                Blocks: {item.blockingWhat}
              </div>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
};

// ── Resource Bar ───────────────────────────────────────────────────────────────
const ResourceBar = ({ workload, resource }) => {
  const sections = [
    { label:'Engineering',   demand:workload.engDemand,   avail:resource.available.eng,  color:C.teal },
    { label:'Sales',         demand:workload.salesDemand, avail:resource.available.sales, color:C.amber },
    { label:'Admin',         demand:workload.adminDemand, avail:resource.available.admin, color:'#888' },
  ];

  return (
    <Card>
      <SHead label="Workload vs Capacity (h/week)" color={C.navy} />
      {sections.map(s => {
        const gap = s.demand - s.avail;
        const pct = s.avail > 0 ? Math.min(140, Math.round(s.demand / s.avail * 100)) : 100;
        const overloaded = gap > 0;
        return (
          <div key={s.label} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:700,
              color: overloaded ? C.red : C.navy, marginBottom:4 }}>
              <span>{s.label}</span>
              <span style={{ color: overloaded ? C.red : '#888' }}>
                {s.demand}h needed / {s.avail}h available
                {overloaded && <span style={{ color:C.red }}> — GAP: {gap}h</span>}
              </span>
            </div>
            <div style={{ background:'#e0e0e0', borderRadius:3, height:6, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(100, pct)}%`, height:'100%',
                background: overloaded ? C.red : s.color, transition:'width .3s' }} />
            </div>
          </div>
        );
      })}
      {resource.founderOverload && (
        <div style={{ marginTop:8, padding:'8px 10px', background:'#fff5f5', borderRadius:4,
          border:`1px solid ${C.red}33`, fontSize:11, color:C.red, fontWeight:600 }}>
          ⚠ Founder overload detected. Total demand exceeds 60h/week capacity. Hire or deprioritize.
        </div>
      )}
    </Card>
  );
};

// ── Decisions Required Panel ───────────────────────────────────────────────────
const DecisionsRequired = ({ hiring, compliance, mode }) => {
  const items = [];

  // Hiring decisions that need action
  for (const h of hiring) {
    if (h.hire) {
      items.push({
        id:       `hire-${h.role}`,
        category: 'HIRING',
        urgency:  h.urgency,
        title:    `${h.status}: ${h.role}`,
        why:      h.reason,
        action:   h.condition || 'Post job ad + set 48h shortlist deadline.',
      });
    }
  }

  // Compliance blockers
  for (const item of compliance.items) {
    if (item.status === 'critical' && !item.status !== 'done') {
      items.push({
        id:       `comp-${item.id}`,
        category: 'COMPLIANCE',
        urgency:  'critical',
        title:    item.label,
        why:      item.blocking ? `Blocks: ${item.blockingWhat}` : item.detail,
        action:   item.detail,
      });
    }
  }

  // Strategy decision if in recovery
  if (mode === 'recovery') {
    items.push({
      id:       'strat-review',
      category: 'STRATEGY',
      urgency:  'high',
      title:    'Review sales strategy — recovery mode active',
      why:      'System is in recovery mode. Non-revenue tasks are deprioritized.',
      action:   'Audit pipeline: which leads can close within 30 days? Remove everything else from focus.',
    });
  }

  if (items.length === 0) return null;

  const urgColor = { critical:C.red, high:C.amber, medium:C.teal, low:'#aaa' };
  const urgBg    = { critical:'#fff5f5', high:'#fff3cd', medium:'#e8f8f9', low:'#f5f5f5' };
  const catColor = { HIRING:C.red, COMPLIANCE:C.amber, STRATEGY:C.teal, PROCUREMENT:C.navy };

  return (
    <Card accent={C.red}>
      <SHead label="Decisions Required" color={C.red} />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ padding:'10px 12px', borderRadius:6,
            background: urgBg[item.urgency] || '#f5f5f5',
            border:`1px solid ${urgColor[item.urgency]}33` }}>
            <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
              <Tag label={item.category} color={catColor[item.category] || C.navy} bg='rgba(0,0,0,.06)' />
              <Tag label={item.urgency.toUpperCase()} color={urgColor[item.urgency]} bg='rgba(0,0,0,.04)' />
            </div>
            <div style={{ fontSize:12, fontWeight:800, color:C.navy, marginBottom:4 }}>{item.title}</div>
            <div style={{ fontSize:11, color:'#666', marginBottom:4, lineHeight:1.4 }}>
              <b>Why:</b> {item.why}
            </div>
            <div style={{ fontSize:11, color:urgColor[item.urgency], fontWeight:600 }}>→ {item.action}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── NREA Capacity Card ─────────────────────────────────────────────────────────
const NREACapacityCard = ({ leads }) => {
  const projects = (() => {
    try { return JSON.parse(localStorage.getItem('projects_v1') || '[]'); } catch { return []; }
  })();

  // Largest single active project — determines required tier
  const activeProjects = projects.filter(p => p.status !== 'complete' && p.status !== 'on_hold');
  const maxSingleKwp   = activeProjects.reduce((max, p) => Math.max(max, parseFloat(p.systemSizeKW) || 0), 0);
  const totalKwpProj   = activeProjects.reduce((s, p) => s + (parseFloat(p.systemSizeKW) || 0), 0);

  // Also compute from won CRM leads (pipeline view — includes leads without a project yet)
  const wonKwpLeads = leads
    .filter(l => l.stage === 'won')
    .reduce((s, l) => {
      const sz = (l.stageData?.feasibility_delivered?.finalSizeKwp) ||
                 (l.stageData?.site_visit_completed?.recommendedSizeKwp) ||
                 parseFloat(l.systemSizeKW) || 0;
      return s + Number(sz);
    }, 0);

  // Tier thresholds (ceiling for a single project within the tier)
  const TIERS = [
    { name: 'Bronze', limit: 500,   next: 'Silver',   fee: 'EGP 5,000 + EGP 5,000 review' },
    { name: 'Silver', limit: 5000,  next: 'Gold',     fee: 'EGP 10,000 + review'          },
    { name: 'Gold',   limit: 10000, next: 'Platinum', fee: 'EGP 20,000 + review'          },
    { name: 'Platinum', limit: Infinity, next: null,  fee: '—'                            },
  ];

  const tier     = TIERS.find(t => maxSingleKwp <= t.limit) || TIERS[TIERS.length - 1];
  const headroom = tier.limit === Infinity ? Infinity : tier.limit - maxSingleKwp;
  const pct      = tier.limit > 0 && tier.limit !== Infinity ? Math.min(100, Math.round(maxSingleKwp / tier.limit * 100)) : 0;

  const isCritical = pct >= 100;
  const isWarning  = pct >= 70 && !isCritical;
  const accentColor = isCritical ? C.red : isWarning ? C.amber : C.teal;

  return (
    <Card accent={accentColor}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <SHead label="NREA Capacity" color={accentColor} />
        <Tag label={tier.name + ' Tier'}
          color={accentColor}
          bg={isCritical ? '#fff5f5' : isWarning ? '#fff3cd' : '#e8f8f9'} />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px' }}>Largest Project</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.navy, lineHeight: 1 }}>
            {Math.round(maxSingleKwp)} <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>kWp</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px' }}>{tier.name} Ceiling</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#888', lineHeight: 1 }}>
            {tier.limit === Infinity ? '∞' : tier.limit.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>kWp</span>
          </div>
        </div>
        {headroom !== Infinity && (
          <div>
            <div style={{ fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px' }}>Headroom</div>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1,
              color: headroom < 50 ? C.red : headroom < 150 ? C.amber : C.green }}>
              {Math.round(headroom)} <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}>kWp</span>
            </div>
          </div>
        )}
      </div>

      {tier.limit !== Infinity && (
        <>
          <div style={{ background: '#e0e0e0', borderRadius: 3, height: 6, marginBottom: 6, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: accentColor, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>
            {pct}% of {tier.name} ceiling · upgrade to {tier.next} after {tier.limit.toLocaleString()} kWp
          </div>
        </>
      )}

      {isCritical && (
        <div style={{ padding: '7px 10px', background: '#fff5f5', borderRadius: 4, border: `1px solid ${C.red}33`,
          fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 6 }}>
          ⚠ {tier.name} ceiling breached. Submit {tier.next} upgrade application before signing next contract.
          Upgrade fee: {TIERS.find(t => t.name === tier.next)?.fee || '—'}
        </div>
      )}
      {isWarning && tier.next && (
        <div style={{ padding: '7px 10px', background: '#fff3cd', borderRadius: 4, border: `1px solid ${C.amber}33`,
          fontSize: 11, color: C.amber, fontWeight: 600, marginBottom: 6 }}>
          Approaching {tier.name} ceiling. Start {tier.next} upgrade application now. Fee: {tier.fee}
        </div>
      )}

      {wonKwpLeads > 0 && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
          Projects: {Math.round(totalKwpProj)} kWp active · CRM won pipeline: {Math.round(wonKwpLeads)} kWp
        </div>
      )}

      {maxSingleKwp === 0 && (
        <div style={{ fontSize: 11, color: '#aaa' }}>
          No active projects. Bronze allows single projects up to 500 kWp.
        </div>
      )}
    </Card>
  );
};

// ── FX Exposure Card ──────────────────────────────────────────────────────────
const FXExposureCard = ({ leads, fosState }) => {
  const usdRate = parseFloat(fosState?.currentUSDEGP) || 50;
  const proposals = leads.filter(l => ['proposal_sent','negotiation'].includes(l.stage));
  const totalPropEGP = proposals.reduce((s,l) => s + (parseFloat(l.dealValue)||0), 0);
  const totalUSD = totalPropEGP / usdRate;
  const up5 = totalUSD * (usdRate * 1.05);
  const dn5 = totalUSD * (usdRate * 0.95);
  const delta = up5 - totalPropEGP;

  return (
    <Card accent={C.amber}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <SHead label="FX Exposure" color={C.amber} />
        <Tag label={`USD/EGP ${usdRate}`} color={C.amber} bg='#fff3cd' />
      </div>
      <div style={{ display:'flex', gap:14, marginBottom:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Open Proposals</div>
          <div style={{ fontSize:18, fontWeight:900, color:C.navy, lineHeight:1 }}>{fmtEgpShort(totalPropEGP)}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>≈ USD</div>
          <div style={{ fontSize:18, fontWeight:900, color:C.amber, lineHeight:1 }}>${Math.round(totalUSD).toLocaleString()}</div>
        </div>
      </div>
      {totalPropEGP > 0 && (
        <div style={{ fontSize:10, color:'#555', background:'#fff8e8', borderRadius:4, padding:'7px 10px', lineHeight:1.6 }}>
          If EGP weakens 5%: <b style={{ color:C.green }}>+{fmtEgpShort(delta)}</b> revenue<br />
          If EGP strengthens 5%: <b style={{ color:C.red }}>−{fmtEgpShort(delta)}</b> revenue<br />
          <span style={{ fontSize:9, color:'#aaa' }}>FX clause in proposals protects against downside.</span>
        </div>
      )}
      {proposals.length === 0 && (
        <div style={{ fontSize:11, color:'#aaa' }}>No open proposals. FX risk is zero.</div>
      )}
      <div style={{ marginTop:8, fontSize:9, color:'#aaa' }}>
        {proposals.length} proposal{proposals.length!==1?'s':''} outstanding · Update rate in Status panel
      </div>
    </Card>
  );
};

// ── 90-Day Cashflow Strip ──────────────────────────────────────────────────────
const CashflowStrip = () => {
  const projects = (() => { try { return JSON.parse(localStorage.getItem('projects_v1')||'[]'); } catch { return []; } })();
  const today    = new Date();
  const months   = [0,1,2].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { label: d.toLocaleString('default',{month:'short',year:'2-digit'}), key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, inflow:0 };
  });

  projects.forEach(p => {
    (p.milestones||[]).forEach(m => {
      if (!m.dueDate || m.status === 'received') return;
      const mk = m.dueDate.slice(0,7);
      const mo = months.find(mo => mo.key === mk);
      if (mo) mo.inflow += Number(m.amount)||0;
    });
  });

  const maxInflow = Math.max(...months.map(m=>m.inflow), 1);

  return (
    <Card accent={C.teal}>
      <SHead label="90-Day Expected Inflows" color={C.teal} />
      <div style={{ display:'flex', gap:12, alignItems:'flex-end', height:80, marginBottom:8 }}>
        {months.map(m => {
          const pct = m.inflow / maxInflow;
          return (
            <div key={m.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ fontSize:10, fontWeight:700, color: m.inflow>0 ? C.teal : '#ccc' }}>{m.inflow > 0 ? fmtEgpShort(m.inflow) : '—'}</div>
              <div style={{ width:'100%', height:`${Math.max(4, pct*60)}px`, background: m.inflow>0 ? C.teal : '#e0e0e0', borderRadius:'3px 3px 0 0' }} />
              <div style={{ fontSize:10, color:'#888', fontWeight:700 }}>{m.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:10, color:'#aaa' }}>
        Based on pending milestone due dates · received milestones excluded
      </div>
    </Card>
  );
};

// ── Equipment COGS Card ────────────────────────────────────────────────────────
const COGSCard = () => {
  const LS_PRICE = 'pricing_state_v1';
  const INIT_PRICE = { panelEgpWp:7.0, inverterEgpKw:1800, bosEgpKwp:640, installEgpKwp:400, usdEgp:50 };
  const [price, setPrice] = useState(() => {
    try { const s = localStorage.getItem(LS_PRICE); return s ? { ...INIT_PRICE, ...JSON.parse(s) } : INIT_PRICE; } catch { return INIT_PRICE; }
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(price);

  const savePrice = () => {
    setPrice(draft);
    try { localStorage.setItem(LS_PRICE, JSON.stringify(draft)); } catch {}
    setEditing(false);
  };

  const projects = (() => { try { return JSON.parse(localStorage.getItem('projects_v1')||'[]'); } catch { return []; } })();
  const active   = projects.filter(p => !['complete','on_hold'].includes(p.status) && parseFloat(p.systemSizeKW) > 0);

  const cogs = (kWp) => {
    const kW = kWp;
    return Math.round(
      kWp * 1000 * price.panelEgpWp +
      kW  * price.inverterEgpKw +
      kWp * price.bosEgpKwp +
      kWp * price.installEgpKwp
    );
  };

  const inp2 = { border:'1px solid #dde1e7', borderRadius:4, padding:'5px 8px', fontSize:12, fontFamily:'inherit', color:C.navy, width:'100%', boxSizing:'border-box' };

  return (
    <Card accent={C.navy}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <SHead label="Equipment COGS Tracker" color={C.navy} />
        <button onClick={()=>{ setDraft(price); setEditing(v=>!v); }}
          style={{ fontSize:10, padding:'3px 10px', background:editing?'#f5f5f5':C.navy, color:editing?C.navy:'#fff', border:`1px solid ${C.navy}`, borderRadius:4, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
          {editing ? 'Cancel' : 'Edit Rates'}
        </button>
      </div>

      {editing && (
        <div style={{ background:'#f8f9fa', borderRadius:6, padding:12, marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
            {[
              { k:'panelEgpWp',    label:'Panel (EGP/Wp)' },
              { k:'inverterEgpKw', label:'Inverter (EGP/kW)' },
              { k:'bosEgpKwp',     label:'BOS (EGP/kWp)' },
              { k:'installEgpKwp', label:'Install (EGP/kWp)' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:3, display:'block' }}>{label}</label>
                <input type="number" style={inp2} value={draft[k]||''} onChange={e=>setDraft(p=>({...p,[k]:parseFloat(e.target.value)||0}))} />
              </div>
            ))}
          </div>
          <button onClick={savePrice} style={{ padding:'6px 14px', background:C.navy, color:'#fff', border:'none', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
        </div>
      )}

      {active.length === 0 ? (
        <div style={{ fontSize:11, color:'#aaa' }}>No active projects with system size set.</div>
      ) : (
        active.map(p => {
          const kWp  = parseFloat(p.systemSizeKW);
          const cost = cogs(kWp);
          const cv   = Number(p.contractValue)||0;
          const gp   = cv - cost;
          const gpPct= cv > 0 ? Math.round(gp/cv*100) : null;
          return (
            <div key={p.id} style={{ padding:'9px 0', borderBottom:'1px solid #f0f2f5' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.navy, flex:1 }}>{p.name || p.clientName}</div>
                <Tag label={`${kWp} kWp`} color={C.teal} bg='#e8f8f9' />
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                <div style={{ fontSize:11, color:'#555' }}>COGS: <b>{fmtEgpShort(cost)}</b></div>
                {cv > 0 && <div style={{ fontSize:11, color:'#555' }}>Contract: <b>{fmtEgpShort(cv)}</b></div>}
                {gpPct !== null && (
                  <div style={{ fontSize:11, fontWeight:700, color: gp >= 0 ? C.green : C.red }}>
                    GP: {fmtEgpShort(Math.abs(gp))} ({gpPct}%)
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div style={{ marginTop:8, fontSize:9, color:'#aaa' }}>Panels + inverter + BOS + installation at current rates</div>
    </Card>
  );
};

// ── Weighted Pipeline by Month ─────────────────────────────────────────────────
const PipelineByMonth = ({ leads }) => {
  const today = new Date();
  const months = [0,1,2].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { label: d.toLocaleString('default',{month:'short',year:'2-digit'}), key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, value:0, count:0 };
  });

  leads.filter(l => !['won','lost','nurture'].includes(l.stage) && l.nextFollowUp).forEach(l => {
    const mk = l.nextFollowUp.slice(0,7);
    const mo = months.find(m => m.key === mk);
    if (mo) {
      mo.value += (parseFloat(l.dealValue)||0) * (stageProb ? stageProb(l.stage) : 0) / 100;
      mo.count++;
    }
  });

  const maxVal = Math.max(...months.map(m=>m.value), 1);

  return (
    <Card accent={C.green}>
      <SHead label="Weighted Pipeline by Close Month" color={C.green} />
      <div style={{ display:'flex', gap:12, alignItems:'flex-end', height:72, marginBottom:8 }}>
        {months.map(m => {
          const pct = m.value / maxVal;
          return (
            <div key={m.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ fontSize:10, fontWeight:700, color: m.value>0 ? C.green : '#ccc' }}>{m.value>0 ? fmtEgpShort(m.value) : '—'}</div>
              <div style={{ width:'100%', height:`${Math.max(4, pct*52)}px`, background: m.value>0 ? C.green : '#e0e0e0', borderRadius:'3px 3px 0 0' }} />
              <div style={{ fontSize:10, color:'#888', fontWeight:700 }}>{m.label}</div>
              {m.count > 0 && <div style={{ fontSize:9, color:'#aaa' }}>{m.count} lead{m.count!==1?'s':''}</div>}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize:10, color:'#aaa' }}>
        Uses next follow-up date as expected close · probability-weighted
      </div>
    </Card>
  );
};

// ── Project Operations Card ───────────────────────────────────────────────────
const ProjectOpsCard = () => {
  const projects = (() => { try { return JSON.parse(localStorage.getItem('projects_v1')||'[]'); } catch { return []; } })();
  const active   = projects.filter(p => !['complete','on_hold'].includes(p.status));
  const today    = new Date();

  const alerts = [];

  for (const p of active) {
    const client = p.clientName || p.name;
    const commsLog = p.commsLog || [];
    const lastComms = commsLog.length > 0 ? commsLog.reduce((m,e)=>e.date>m?e.date:m,'') : null;
    const daysSince = lastComms ? Math.floor((today - new Date(lastComms)) / 86400000) : null;
    if (['in_progress','commissioning'].includes(p.status)) {
      if (daysSince === null) alerts.push({ level:'warn', msg:`No contact logged — ${client}`, type:'comms' });
      else if (daysSince > 14) alerts.push({ level:'critical', msg:`${daysSince}d without client contact — ${client}`, type:'comms' });
      else if (daysSince > 7) alerts.push({ level:'warn', msg:`${daysSince}d since last contact — ${client}`, type:'comms' });
    }

    if (p.discoSubmittedDate && !p.discoApprovedDate) {
      const days = Math.floor((today - new Date(p.discoSubmittedDate)) / 86400000);
      if (days >= 21) alerts.push({ level:'critical', msg:`DISCO pending ${days}d — chase now — ${client}`, type:'disco' });
      else if (days >= 14) alerts.push({ level:'warn', msg:`DISCO pending ${days}d — ${client}`, type:'disco' });
    }

    const unsigned = (p.changeOrders||[]).filter(co => !co.clientSigned);
    if (unsigned.length > 0) alerts.push({ level:'warn', msg:`${unsigned.length} unsigned change order${unsigned.length>1?'s':''} — ${client}`, type:'co' });

    const cv = Number(p.contractValue)||0;
    if (cv > 0) {
      const contBudget  = cv * (Number(p.contingencyBudgetPct)||20) / 100;
      const reworkTotal = (p.costs||[]).filter(c=>c.category==='rework').reduce((s,c)=>s+(Number(c.amount)||0),0);
      const remPct      = Math.round((contBudget - reworkTotal) / contBudget * 100);
      if (remPct < 5) alerts.push({ level:'critical', msg:`Contingency exhausted (${remPct}% left) — ${client}`, type:'contingency' });
      else if (remPct < 10) alerts.push({ level:'warn', msg:`Low contingency (${remPct}% left) — ${client}`, type:'contingency' });
    }
  }

  const levelColor = { critical:C.red, warn:C.amber };
  const typeIcon   = { comms:'💬', disco:'⚡', co:'📝', contingency:'🛡' };

  return (
    <Card accent={alerts.some(a=>a.level==='critical') ? C.red : alerts.length > 0 ? C.amber : C.teal}>
      <SHead label="Project Operations Alerts" color={alerts.some(a=>a.level==='critical') ? C.red : C.amber} />
      {alerts.length === 0 ? (
        <div style={{ fontSize:12, color:'#888', fontStyle:'italic' }}>All projects: contact current, DISCO tracked, no governance issues.</div>
      ) : (
        alerts.map((a, i) => (
          <div key={i} style={{ display:'flex', gap:8, padding:'7px 0', borderBottom: i<alerts.length-1?'1px solid #f0f2f5':'none', alignItems:'flex-start' }}>
            <span style={{ fontSize:13, flexShrink:0 }}>{typeIcon[a.type]||'⚠'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:levelColor[a.level]||C.navy, lineHeight:1.4 }}>{a.msg}</div>
            </div>
            <Tag label={a.level.toUpperCase()} color={levelColor[a.level]} bg={a.level==='critical'?'#fff5f5':'#fff3cd'} />
          </div>
        ))
      )}
      <div style={{ marginTop:8, fontSize:9, color:'#aaa' }}>
        {active.length} active project{active.length!==1?'s':''} · Contact &gt;7d amber, &gt;14d red · DISCO &gt;14d warn, &gt;21d critical
      </div>
    </Card>
  );
};

// ── Quality Metrics Card ──────────────────────────────────────────────────────
const QualityMetricsCard = () => {
  const projects = (() => { try { return JSON.parse(localStorage.getItem('projects_v1')||'[]'); } catch { return []; } })();
  const EG_PSH   = [4.1,4.8,5.7,6.6,7.0,7.3,7.1,6.9,6.5,5.6,4.5,3.9];

  // FTR rate — punch list 100% at commissioning across completed projects
  const completedWithPunch = projects.filter(p => p.status === 'complete' && p.punchList?.length > 0);
  const ftrCount  = completedWithPunch.filter(p => p.punchList.every(i => i.done)).length;
  const ftrRate   = completedWithPunch.length > 0 ? Math.round(ftrCount / completedWithPunch.length * 100) : null;

  // Average PR across all yield-logged projects
  const prValues = [];
  for (const p of projects) {
    const kWp = parseFloat(p.systemSizeKW)||0;
    if (!kWp || !p.yieldLog?.length) continue;
    for (const e of p.yieldLog) {
      const actual = parseFloat(e.actualKwh)||0;
      if (!actual) continue;
      const mo = parseInt(e.month.slice(5,7));
      const yr = parseInt(e.month.slice(0,4));
      const days = new Date(yr, mo, 0).getDate();
      const psh  = EG_PSH[mo-1];
      const pr   = actual / (kWp * psh * days) * 100;
      if (isFinite(pr) && pr > 0) prValues.push(Math.round(pr));
    }
  }
  const avgPR = prValues.length > 0 ? Math.round(prValues.reduce((s,v)=>s+v,0)/prValues.length) : null;

  // Rework % across active projects
  const activeWithCosts = projects.filter(p => !['on_hold'].includes(p.status) && Number(p.contractValue)>0);
  const totalCV      = activeWithCosts.reduce((s,p)=>s+(Number(p.contractValue)||0),0);
  const totalRework  = activeWithCosts.reduce((s,p)=>s+(p.costs||[]).filter(c=>c.category==='rework').reduce((r,c)=>r+(Number(c.amount)||0),0),0);
  const reworkPct    = totalCV > 0 ? Math.round(totalRework / totalCV * 100) : null;

  const metrics = [
    ...(ftrRate !== null ? [{ label:'FTR Rate', value:`${ftrRate}%`, sub:`${ftrCount}/${completedWithPunch.length} projects pass on first commissioning`, color:ftrRate>=90?C.green:ftrRate>=75?C.amber:C.red, benchmark:'Target: ≥90%' }] : []),
    ...(avgPR !== null ? [{ label:'Avg Performance Ratio', value:`${avgPR}%`, sub:`Across ${prValues.length} monthly readings (IEC 61724)`, color:avgPR>=78?C.green:avgPR>=70?C.amber:C.red, benchmark:'Egypt benchmark: 78–85%' }] : []),
    ...(reworkPct !== null ? [{ label:'Rework Cost', value:`${reworkPct}%`, sub:`${fmtEgpShort(totalRework)} of ${fmtEgpShort(totalCV)} total contracts`, color:reworkPct>5?C.red:reworkPct>2?C.amber:C.green, benchmark:'Target: <5% of contract' }] : []),
  ];

  return (
    <Card accent={C.teal}>
      <SHead label="Quality Metrics" color={C.teal} />
      {metrics.length === 0 ? (
        <div style={{ fontSize:11, color:'#aaa' }}>Complete projects with punch lists and yield logs to see quality metrics.</div>
      ) : (
        metrics.map((m, i) => (
          <div key={m.label} style={{ padding:'10px 0', borderBottom: i<metrics.length-1?'1px solid #f0f2f5':'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{m.label}</div>
              <div style={{ fontSize:20, fontWeight:900, color:m.color, lineHeight:1 }}>{m.value}</div>
            </div>
            <div style={{ fontSize:10, color:'#888', marginBottom:3 }}>{m.sub}</div>
            <div style={{ fontSize:9, color:m.color, fontWeight:700 }}>{m.benchmark}</div>
          </div>
        ))
      )}
      {metrics.length === 0 && <div style={{ fontSize:9, color:'#ccc', marginTop:8 }}>PR tracked per IEC 61724 · FTR = punch list 100% at commissioning</div>}
    </Card>
  );
};

// ── NPS Card ──────────────────────────────────────────────────────────────────
const NPSCard = () => {
  const projects  = (() => { try { return JSON.parse(localStorage.getItem('projects_v1')||'[]'); } catch { return []; } })();
  const scored    = projects.filter(p => p.status === 'complete' && p.npsScore !== null);
  const unscored  = projects.filter(p => p.status === 'complete' && p.npsScore === null);
  const promoters = scored.filter(p => p.npsScore >= 9).length;
  const passives  = scored.filter(p => p.npsScore >= 7 && p.npsScore <= 8).length;
  const detractors= scored.filter(p => p.npsScore <= 6).length;
  const nps       = scored.length > 0 ? Math.round((promoters - detractors) / scored.length * 100) : null;
  const avgScore  = scored.length > 0 ? (scored.reduce((s,p)=>s+p.npsScore,0)/scored.length).toFixed(1) : null;

  return (
    <Card accent={nps !== null && nps >= 30 ? C.green : C.amber}>
      <SHead label="Client Recommendation Score" color={nps !== null && nps >= 30 ? C.green : C.amber} />
      {scored.length === 0 ? (
        <div style={{ fontSize:11, color:'#aaa' }}>
          {unscored.length > 0
            ? `${unscored.length} completed project${unscored.length>1?'s':''} without a recommendation score. Log in Projects → Comms tab.`
            : 'No completed projects yet. Recommendation score is captured when a project is marked complete.'}
        </div>
      ) : (
        <>
          <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Recommendation Score</div>
              <div style={{ fontSize:26, fontWeight:900, color:nps>=50?C.green:nps>=30?C.teal:nps>=0?C.amber:C.red, lineHeight:1 }}>{nps}</div>
              <div style={{ fontSize:9, color:'#aaa' }}>B2B benchmark: 30–50 (industry)</div>
            </div>
            <div>
              <div style={{ fontSize:9, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px' }}>Avg Score</div>
              <div style={{ fontSize:26, fontWeight:900, color:C.navy, lineHeight:1 }}>{avgScore}</div>
              <div style={{ fontSize:9, color:'#aaa' }}>/10</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            {[
              { label:'Will refer (9–10)',     count:promoters,  color:C.green },
              { label:'Satisfied (7–8)',       count:passives,   color:C.amber },
              { label:'Unlikely to refer (≤6)',count:detractors, color:C.red   },
            ].map(b => (
              <div key={b.label} style={{ flex:1, background:'#f8f9fa', borderRadius:4, padding:'6px 8px', borderBottom:`2px solid ${b.color}` }}>
                <div style={{ fontSize:9, color:'#aaa', marginBottom:2, lineHeight:1.3 }}>{b.label}</div>
                <div style={{ fontSize:16, fontWeight:900, color:b.color }}>{b.count}</div>
              </div>
            ))}
          </div>
          {unscored.length > 0 && (
            <div style={{ fontSize:10, color:C.amber, fontWeight:600 }}>⚠ {unscored.length} completed project{unscored.length>1?'s':''} without recommendation score — log in Projects → Comms</div>
          )}
        </>
      )}
    </Card>
  );
};

// ── stageProb helper (local to ControlCenter file) ────────────────────────────
const stageProb = (stageId) => {
  const probs = { unqualified:5, contacted:15, qualified:30, site_visit_scheduled:45, site_visit_completed:55, feasibility_proposed:60, feasibility_sold:70, feasibility_delivered:75, proposal_sent:50, negotiation:70, won:100, lost:0, nurture:10 };
  return probs[stageId] ?? 0;
};

// ── Main ControlCenter ─────────────────────────────────────────────────────────
export const ControlCenter = () => {
  const [fosState, setFosState] = useState(() => {
    const saved = loadFOS();
    return saved ? { ...INIT_FOS_STATE, ...saved } : INIT_FOS_STATE;
  });
  const [leads, setLeads]           = useState(() => loadLeads());
  const [showInputs, setShowInputs] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Re-read CRM leads every 5s (CRM tab may have changed data)
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = loadLeads();
      setLeads(fresh);
      setLastRefresh(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateState = (next) => {
    const merged = { ...fosState, ...next };
    setFosState(merged);
    saveFOS(merged);
  };

  // Trello feedback: when a task completes, advance the CRM lead stage
  const handleCRMUpdate = useCallback((leadId, nextStage) => {
    const LS_LEADS = 'crm_leads_v3';
    try {
      const raw = localStorage.getItem(LS_LEADS);
      if (!raw) return;
      const current = JSON.parse(raw);
      const updated = current.map(l => l.id === leadId ? { ...l, stage: nextStage } : l);
      localStorage.setItem(LS_LEADS, JSON.stringify(updated));
      setLeads(updated);
    } catch {}
  }, []);

  const sys = computeFullState(fosState, leads);
  const mc  = MODE_CONFIG[sys.mode];
  const needsStartDate = !fosState.startDate;

  const hasDecisionsRequired = sys.hiring.some(h => h.hire) ||
    sys.compliance.items.some(i => i.status === 'critical') ||
    sys.mode === 'recovery';

  return (
    <div style={{ maxWidth:1320, margin:'0 auto' }}>

      {/* ── MODE BANNER ──────────────────────────────────────────────────────── */}
      <div style={{ background: mc.bg, borderRadius:8, padding:'14px 20px', marginBottom:14,
        borderLeft:`5px solid ${mc.accent}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:mc.text, letterSpacing:'1.2px', lineHeight:1.1 }}>
              {sys.mode === 'survival' ? '⚠ ' : ''}{mc.badge}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>{mc.sub}</div>
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.7px' }}>Day</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{sys.day}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.7px' }}>Cash</div>
              <div style={{ fontSize:15, fontWeight:800, color:
                sys.cashProjection.cash >= 500000 ? '#6fdb8f' :
                sys.cashProjection.cash >= 200000 ? '#ffe066' : '#ff6b6b' }}>
                {fmtEgpShort(sys.cashProjection.cash)}
              </div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.7px' }}>State</div>
              <div style={{ fontSize:11, fontWeight:700, color:mc.text }}>{sys.companyState.label}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.7px' }}>Strategy</div>
              <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.7)' }}>{fosState.strategy || 'A'}</div>
            </div>
            <button onClick={() => setShowInputs(v => !v)}
              style={{ padding:'7px 16px', background:mc.accent, color:'#fff', border:'none',
                borderRadius:4, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit',
                letterSpacing:'.4px' }}>
              {showInputs ? 'CLOSE' : 'UPDATE STATUS'}
            </button>
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9,
            color:'rgba(255,255,255,.3)', marginBottom:3, letterSpacing:'.3px' }}>
            <span>Foundation</span><span>Pipeline</span><span>Proposals</span><span>First Contract</span><span>Execution</span>
          </div>
          <div style={{ background:'rgba(255,255,255,.1)', borderRadius:3, height:5, overflow:'hidden' }}>
            <div style={{ width:`${Math.min(100, sys.companyState.level / 4 * 100)}%`,
              height:'100%', background:mc.accent, transition:'width .4s' }} />
          </div>
        </div>
      </div>

      {/* ── INPUT PANEL ──────────────────────────────────────────────────────── */}
      {showInputs && (
        <InputPanel state={fosState} onUpdate={updateState} onClose={() => setShowInputs(false)} />
      )}

      {/* ── START DATE NOTICE ────────────────────────────────────────────────── */}
      {needsStartDate && (
        <div style={{ background:'#fff3cd', border:`1px solid ${C.amber}`, borderRadius:6,
          padding:'10px 16px', marginBottom:14, fontSize:12, color:C.amber, fontWeight:600 }}>
          Set your company start date in "Update Status" to enable day-based calculations.
        </div>
      )}

      {/* ── ROW 1: Decision + Today's Actions ────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap:14, marginBottom:14 }}>
        <DecisionCard decision={sys.primaryDecision} />
        <TodayActions actions={sys.todayActions} />
      </div>

      {/* ── ROW 2: Decisions Required + Break-Next + Cash ────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap:14, marginBottom:14 }}>
        {hasDecisionsRequired && (
          <DecisionsRequired hiring={sys.hiring} compliance={sys.compliance} mode={sys.mode} />
        )}
        <BreakNext risks={sys.breakNext} />
        <CashPanel cashProjection={sys.cashProjection} />
      </div>

      {/* ── ROW 3: Pipeline Intelligence ─────────────────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <PipelineStrip crm={sys.crm} />
      </div>

      {/* ── ROW 4: Trello Execution Layer ────────────────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <TrelloPanel engineState={sys} leads={leads} onCRMUpdate={handleCRMUpdate} />
      </Card>

      {/* ── ROW 5: FX + Cashflow + Pipeline-by-Month + COGS ─────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap:14, marginBottom:14 }}>
        <FXExposureCard leads={leads} fosState={fosState} />
        <CashflowStrip />
        <PipelineByMonth leads={leads} />
        <COGSCard />
      </div>

      {/* ── ROW 6: Hiring (full detail) + Do-Not + Compliance + NREA ───────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap:14, marginBottom:14 }}>
        <HiringPanel hiring={sys.hiring} />
        <DoNotPanel items={sys.doNotList} />
        <CompliancePanel compliance={sys.compliance} />
        <NREACapacityCard leads={leads} />
      </div>

      {/* ── ROW 7: Project Ops + Quality + NPS ───────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap:14, marginBottom:14 }}>
        <ProjectOpsCard />
        <QualityMetricsCard />
        <NPSCard />
      </div>

      {/* ── ROW 8: Workload ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <ResourceBar workload={sys.workload} resource={sys.resource} />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div style={{ fontSize:10, color:'#ccc', textAlign:'center', paddingBottom:20 }}>
        Founder Operating System · CRM auto-syncs every 5s · Last: {new Date(lastRefresh).toLocaleTimeString()}
      </div>
    </div>
  );
};
