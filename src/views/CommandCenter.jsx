import { useState } from 'react';
import { INIT_FOS_STATE, computeMode, computeAlerts, computeTodayTasks, computeDecision, fmtEgp } from '../data/fosData';

const LS_KEY = 'solar_fos_v2';
const load = () => { try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {} return null; };
const save = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };

const MODE = {
  normal:   { label: 'NORMAL MODE',   sub: 'Balanced execution — all systems go',                               headerBg: '#0D2137', accentBg: '#1A6B72', textColor: '#7ed9e8', border: '#1A6B72' },
  recovery: { label: 'RECOVERY MODE', sub: 'Pipeline + sales focus — non-critical tasks suspended',             headerBg: '#5c3d00', accentBg: '#C8991A', textColor: '#ffe066', border: '#C8991A' },
  survival: { label: '⚠ SURVIVAL MODE', sub: 'STOP ALL SPENDING — revenue tasks only — founder emergency',     headerBg: '#5c0000', accentBg: '#C0392B', textColor: '#ff9999', border: '#C0392B' },
};

const STATUS_COLOR = { green: '#1E7E34', yellow: '#856404', red: '#C0392B' };
const STATUS_BG    = { green: '#e8f5e9', yellow: '#fff3cd', red: '#fff5f5' };
const TYPE_COLOR   = { REVENUE: { color: '#1E7E34', bg: '#e8f5e9' }, CRITICAL: { color: '#C0392B', bg: '#fff5f5' } };

export const CommandCenter = () => {
  const [s, setS]           = useState(() => load() ?? INIT_FOS_STATE);
  const [showInputs, setShowInputs] = useState(false);
  const [decidedId, setDecidedId]   = useState(null);
  const [doneTasks, setDoneTasks]   = useState({});

  const update = (key, val) => setS(prev => { const next = { ...prev, [key]: val }; save(next); return next; });

  const mode     = computeMode(s);
  const alerts   = computeAlerts(s);
  const tasks    = computeTodayTasks(s, mode);
  const decision = computeDecision(s, mode);
  const mc       = MODE[mode];

  const cashStatus =
    s.cash >= 500000 ? 'green' :
    s.cash >= 200000 ? 'yellow' : 'red';

  const pipelineStatus =
    s.contractsSigned > 0        ? 'green' :
    s.proposalsSubmitted > 0     ? 'yellow' :
    s.paidFeasibilityStudies > 0 ? 'yellow' : 'red';

  const scheduleStatus = (() => {
    if (s.day > 180 && s.contractsSigned === 0) return 'red';
    if (s.day > 130 && s.contractsSigned === 0) return 'red';
    if (s.day > 90  && s.proposalsSubmitted === 0) return 'red';
    if (s.day > 60  && s.paidFeasibilityStudies === 0) return 'red';
    if (s.day > 30  && s.leadsInCRM < 30) return 'yellow';
    return 'green';
  })();

  const criticalAlerts = alerts.filter(a => a.level === 'critical');

  // ── Layout helpers ──────────────────────────────────────────────────────────
  const card = { background:'#fff', borderRadius:8, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.1)' };
  const sLabel = { fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:12 };

  return (
    <div style={{ maxWidth:1280, margin:'0 auto' }}>

      {/* ── MODE BANNER ──────────────────────────────────────────────────────── */}
      <div style={{ background: mc.headerBg, borderRadius:8, padding:'16px 20px', marginBottom:16, borderLeft:`5px solid ${mc.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, color: mc.textColor, letterSpacing:'1.5px', lineHeight:1.1 }}>{mc.label}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:3 }}>{mc.sub}</div>
          </div>
          <div style={{ display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'1px' }}>Day</div>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1 }}>{s.day}<span style={{ fontSize:13, color:'rgba(255,255,255,.4)', fontWeight:400 }}>/175</span></div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'1px' }}>Cash</div>
              <div style={{ fontSize:15, fontWeight:800, color: cashStatus === 'green' ? '#6fdb8f' : cashStatus === 'yellow' ? '#ffe066' : '#ff6b6b' }}>{fmtEgp(s.cash)}</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'1px' }}>Alerts</div>
              <div style={{ fontSize:26, fontWeight:900, color: alerts.length > 0 ? '#ff6b6b' : '#6fdb8f', lineHeight:1 }}>{alerts.length}</div>
            </div>
            <button
              onClick={() => setShowInputs(v => !v)}
              style={{ padding:'7px 16px', background: mc.accentBg, color:'#fff', border:'none', borderRadius:4, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.5px' }}
            >
              {showInputs ? 'CLOSE' : 'UPDATE STATUS'}
            </button>
          </div>
        </div>

        {/* Inline progress bar */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.35)', marginBottom:4, letterSpacing:'.5px' }}>
            <span>DAY 1</span><span>FOUNDATION GATE (30)</span><span>PIPELINE GATE (60)</span><span>PROPOSAL GATE (90)</span><span>EXECUTION GATE (130)</span><span>COMMISSION (175)</span>
          </div>
          <div style={{ background:'rgba(255,255,255,.1)', borderRadius:4, height:6, overflow:'hidden' }}>
            <div style={{ width:`${Math.min(100, s.day / 175 * 100)}%`, height:'100%', background: mc.accentBg, transition:'width .4s' }} />
          </div>
        </div>
      </div>

      {/* ── STATUS INPUTS ────────────────────────────────────────────────────── */}
      {showInputs && (
        <div style={{ ...card, marginBottom:16, border:`1px solid ${mc.border}` }}>
          <div style={{ fontWeight:800, fontSize:12, color:'#0D2137', marginBottom:14, textTransform:'uppercase', letterSpacing:'.8px' }}>Update Current Status</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12, marginBottom:16 }}>
            {[
              { key:'day',                    label:'Day Number',               type:'number', min:1,   max:365 },
              { key:'cash',                   label:'Cash Position (EGP)',       type:'number', min:0          },
              { key:'leadsInCRM',             label:'Leads in CRM',             type:'number', min:0          },
              { key:'siteVisitsCompleted',    label:'Site Visits Completed',     type:'number', min:0          },
              { key:'paidFeasibilityStudies', label:'Paid Studies Sold',         type:'number', min:0          },
              { key:'proposalsSubmitted',     label:'EPC Proposals Submitted',   type:'number', min:0          },
              { key:'activeNegotiations',     label:'Active Negotiations',       type:'number', min:0          },
              { key:'contractsSigned',        label:'Contracts Signed',          type:'number', min:0          },
            ].map(({ key, label, type, min, max }) => (
              <div key={key}>
                <div style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{label}</div>
                <input type={type} min={min} max={max} value={s[key]} onChange={e => update(key, Number(e.target.value))}
                  style={{ width:'100%', padding:'7px 8px', border:'1px solid #d0d5dd', borderRadius:4, fontSize:14, fontWeight:700, fontFamily:'inherit', color:'#0D2137', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {[
              { key:'engineerHired',     label:'Engineer Hired' },
              { key:'bankAccountOpen',   label:'Bank Account Open' },
              { key:'lawyerEngaged',     label:'Lawyer Engaged' },
              { key:'nreaSubmitted',     label:'NREA Submitted' },
              { key:'egyptERASubmitted', label:'EgyptERA Submitted' },
              { key:'fxAlertActive',     label:'FX Alert Active' },
              { key:'depositCollected',  label:'Deposit Collected' },
              { key:'discoSubmitted',    label:'DISCO Submitted' },
              { key:'overdraftActive',   label:'Overdraft Active' },
              { key:'depositRefused',    label:'Client Refused Deposit' },
              { key:'nreaReportOverdue', label:'NREA Report Overdue' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, color:'#1a1a1a', userSelect:'none' }}>
                <input type="checkbox" checked={s[key]} onChange={e => update(key, e.target.checked)}
                  style={{ accentColor:'#1A6B72', width:14, height:14, cursor:'pointer' }} />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── CRITICAL ALERTS BAR (if any) ─────────────────────────────────────── */}
      {criticalAlerts.length > 0 && (
        <div style={{ background:'#fff5f5', border:'2px solid #C0392B', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:900, color:'#C0392B', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>
            ⚠ {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} — Action Required
          </div>
          {criticalAlerts.map(a => (
            <div key={a.id} style={{ fontSize:12, color:'#7B241C', padding:'4px 0', borderBottom:'1px solid rgba(192,57,43,.15)', lineHeight:1.5 }}>
              <b>{a.msg}</b> — {a.action}
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN 3-COLUMN GRID ───────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>

        {/* COL 1: TODAY'S FOCUS */}
        <div style={{ ...card, borderTop:`3px solid #C8991A` }}>
          <div style={{ ...sLabel, color:'#C8991A' }}>Today's Focus</div>
          {tasks.length === 0 ? (
            <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>No urgent tasks. Review stage gates.</div>
          ) : tasks.map((task, i) => {
            const tc = TYPE_COLOR[task.type] ?? TYPE_COLOR.CRITICAL;
            const isDone = doneTasks[task.id];
            return (
              <div key={task.id} onClick={() => setDoneTasks(d => ({ ...d, [task.id]: !d[task.id] }))}
                style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 0', borderBottom: i < tasks.length - 1 ? '1px solid #f0f2f5' : 'none', cursor:'pointer', opacity: isDone ? 0.45 : 1 }}>
                <div style={{ fontWeight:900, fontSize:18, color: isDone ? '#aaa' : '#C8991A', flexShrink:0, lineHeight:1, minWidth:20 }}>{isDone ? '✓' : i + 1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:5, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:9, fontWeight:900, color: tc.color, background: tc.bg, borderRadius:3, padding:'1px 7px', letterSpacing:'.6px' }}>{task.type}</span>
                    {task.overdue && !isDone && <span style={{ fontSize:9, fontWeight:900, color:'#C0392B', background:'#fff5f5', borderRadius:3, padding:'1px 7px', letterSpacing:'.6px' }}>OVERDUE</span>}
                  </div>
                  <div style={{ fontSize:13, color: isDone ? '#888' : '#0D2137', fontWeight:600, lineHeight:1.45, textDecoration: isDone ? 'line-through' : 'none' }}>{task.label}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:10, fontSize:10, color:'#bbb', fontStyle:'italic' }}>Click task to mark done</div>
        </div>

        {/* COL 2: SYSTEM STATUS + ALERTS */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* System Status */}
          <div style={{ ...card, borderTop:'3px solid #0D2137' }}>
            <div style={{ ...sLabel, color:'#0D2137' }}>System Status</div>
            {[
              { label:'Cash Position',     status: cashStatus,     detail: fmtEgp(s.cash) },
              { label:'Revenue Pipeline',  status: pipelineStatus, detail: `${s.paidFeasibilityStudies} studies · ${s.proposalsSubmitted} proposals · ${s.contractsSigned} contracts` },
              { label:'Schedule',          status: scheduleStatus, detail: `Day ${s.day} of 175` },
              { label:'Engineer',          status: s.engineerHired ? 'green' : s.day > 21 ? 'red' : 'yellow', detail: s.engineerHired ? 'Hired ✓' : `Not hired (Day ${s.day})` },
              { label:'NREA Status',       status: s.nreaSubmitted ? 'green' : s.day > 60 ? 'red' : 'yellow', detail: s.nreaSubmitted ? 'Submitted ✓' : 'Not yet submitted' },
            ].map(({ label, status, detail }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f2f5' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0D2137' }}>{label}</div>
                  <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{detail}</div>
                </div>
                <span style={{ background: STATUS_BG[status], color: STATUS_COLOR[status], borderRadius:4, padding:'3px 10px', fontWeight:900, fontSize:10, letterSpacing:'.5px', flexShrink:0 }}>
                  {status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* All Alerts */}
          <div style={{ ...card, borderTop:`3px solid ${alerts.length > 0 ? '#C0392B' : '#1E7E34'}` }}>
            <div style={{ ...sLabel, color: alerts.length > 0 ? '#C0392B' : '#1E7E34' }}>
              {alerts.length > 0 ? `⚠ ${alerts.length} Active Alert${alerts.length !== 1 ? 's' : ''}` : '✓ No Active Alerts'}
            </div>
            {alerts.length === 0 ? (
              <div style={{ fontSize:13, color:'#888', fontStyle:'italic' }}>All systems nominal. Maintain execution pace.</div>
            ) : alerts.map((a, i) => (
              <div key={a.id} style={{ padding:'8px 0', borderBottom: i < alerts.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
                <div style={{ fontSize:11, fontWeight:700, color: a.level === 'critical' ? '#C0392B' : a.level === 'high' ? '#856404' : '#555', marginBottom:2, lineHeight:1.4 }}>
                  {a.level === 'critical' ? '⚠ ' : a.level === 'high' ? '▲ ' : '• '}{a.msg}
                </div>
                <div style={{ fontSize:10, color:'#666', lineHeight:1.5 }}>{a.action}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COL 3: NEXT DECISION */}
        <div style={{ ...card, borderTop:`3px solid ${decision.urgency === 'critical' ? '#C0392B' : decision.urgency === 'high' ? '#C8991A' : '#1A6B72'}` }}>
          <div style={{ ...sLabel, color: decision.urgency === 'critical' ? '#C0392B' : decision.urgency === 'high' ? '#C8991A' : '#1A6B72' }}>
            {decision.urgency === 'low' ? 'No Decisions Pending' : decision.urgency === 'critical' ? '⚠ Decision Required NOW' : 'Next Decision Required'}
          </div>

          {decision.urgency !== 'low' ? (
            <>
              <div style={{ fontSize:16, fontWeight:900, color:'#0D2137', marginBottom:10, lineHeight:1.3 }}>{decision.question}</div>
              <div style={{ fontSize:11, color:'#555', marginBottom:18, lineHeight:1.7, padding:'10px 12px', background:'#f8f9fa', borderRadius:6, borderLeft:'3px solid #d0d5dd' }}>{decision.context}</div>
              {decidedId === decision.id ? (
                <div style={{ background:'#e8f5e9', border:'1px solid #a3d9a5', borderRadius:6, padding:'12px 16px', fontSize:12, color:'#1E7E34', fontWeight:600 }}>
                  ✓ Decision logged. Update the Status panel to reflect the outcome.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {decision.options.map((opt, i) => (
                    <button key={i} onClick={() => setDecidedId(decision.id)}
                      style={{ padding:'12px 14px', background: i === 0 ? '#0D2137' : '#fff', color: i === 0 ? '#fff' : '#0D2137', border:`2px solid #0D2137`, borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left', lineHeight:1.4, transition:'all .15s' }}>
                      <div style={{ marginBottom:4 }}>{opt.label}</div>
                      <div style={{ fontSize:10, fontWeight:400, opacity:0.65, lineHeight:1.5 }}>{opt.detail}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize:13, color:'#888', marginBottom:20, lineHeight:1.6 }}>
                System is in execution mode. No decisions pending. Maintain pipeline velocity.
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'#0D2137', marginBottom:10, textTransform:'uppercase', letterSpacing:'.5px' }}>Execution Targets</div>
              {[
                { label:'Leads / week',                target:'≥ 3',    ok: true },
                { label:'Site visit → study rate',     target:'≥ 33%',  ok: true },
                { label:'Proposal → contract rate',    target:'≥ 30%',  ok: true },
                { label:'Cash floor',                  target:'EGP 500K+', ok: s.cash >= 500000 },
              ].map(({ label, target, ok }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f0f2f5', fontSize:12 }}>
                  <span style={{ color:'#555' }}>{label}</span>
                  <span style={{ fontWeight:700, color: ok ? '#1E7E34' : '#C0392B' }}>{target}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── PIPELINE FUNNEL ──────────────────────────────────────────────────── */}
      <div style={{ ...card }}>
        <div style={{ ...sLabel, color:'#0D2137' }}>Pipeline Funnel</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>
          {[
            { label:'CRM Leads',     val:s.leadsInCRM,             target:30, icon:'👥' },
            { label:'Site Visits',   val:s.siteVisitsCompleted,    target:8,  icon:'🏭' },
            { label:'Paid Studies',  val:s.paidFeasibilityStudies, target:3,  icon:'📄' },
            { label:'Proposals Out', val:s.proposalsSubmitted,     target:3,  icon:'📋' },
            { label:'Negotiations',  val:s.activeNegotiations,     target:2,  icon:'🤝' },
            { label:'Contracts',     val:s.contractsSigned,        target:1,  icon:'✍' },
          ].map(({ label, val, target, icon }) => {
            const pct = Math.min(100, Math.round(val / target * 100));
            const st  = pct >= 100 ? 'green' : pct >= 50 ? 'yellow' : 'red';
            return (
              <div key={label} style={{ padding:14, background:'#f8f9fa', borderRadius:6, borderBottom:`3px solid ${STATUS_COLOR[st]}` }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:24, fontWeight:900, color: STATUS_COLOR[st], lineHeight:1 }}>
                  {val}<span style={{ fontSize:13, color:'#bbb', fontWeight:400 }}>/{target}</span>
                </div>
                <div style={{ background:'#e0e0e0', borderRadius:3, height:4, marginTop:8, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background: STATUS_COLOR[st], transition:'width .4s' }} />
                </div>
                <div style={{ fontSize:9, color:'#aaa', marginTop:4 }}>{pct}% to target</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODE GUIDE ───────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginTop:16 }}>
        {[
          {
            mode:'normal', label:'NORMAL MODE', color:'#1A6B72', bg:'#e8f8f9',
            active: mode === 'normal',
            triggers:['Cash > EGP 500K', 'Engineer hired', 'Pipeline on track'],
            focus:['Balanced execution across all workstreams', 'Maintain lead velocity ≥3/week', 'Weekly KPI review with founder'],
          },
          {
            mode:'recovery', label:'RECOVERY MODE', color:'#856404', bg:'#fff3cd',
            active: mode === 'recovery',
            triggers:['Cash EGP 200K–500K', 'No paid studies by Day 60', 'Engineer not hired by Day 30'],
            focus:['Revenue pipeline tasks only — no admin', 'Daily founder check-in', 'Activate overdraft, pause new OpEx'],
          },
          {
            mode:'survival', label:'SURVIVAL MODE', color:'#7B241C', bg:'#fff5f5',
            active: mode === 'survival',
            triggers:['Cash < EGP 200K', 'Day 180 with no contract', 'Deposit refused'],
            focus:['Revenue tasks only — zero exceptions', 'Freeze ALL discretionary spend', 'Strategy C pivot: commission-only pipeline'],
          },
        ].map(m => (
          <div key={m.mode} style={{ background: m.active ? m.bg : '#fafafa', border:`2px solid ${m.active ? m.color : '#e0e0e0'}`, borderRadius:8, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:900, color: m.active ? m.color : '#888', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>
              {m.active ? '▶ ' : ''}{m.label}
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:'#555', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>Triggers</div>
            {m.triggers.map(t => <div key={t} style={{ fontSize:11, color:'#444', padding:'2px 0' }}>• {t}</div>)}
            <div style={{ fontSize:10, fontWeight:700, color:'#555', marginTop:8, marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>Focus</div>
            {m.focus.map(f => <div key={f} style={{ fontSize:11, color:'#444', padding:'2px 0', lineHeight:1.4 }}>→ {f}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
};
