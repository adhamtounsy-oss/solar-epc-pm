import { useState } from 'react';
import { CommandCenter }   from './views/CommandCenter';
import { TaskSystem }      from './views/TaskSystem';
import { GovernanceView }  from './views/GovernanceView';
import { RiskView }        from './views/RiskView';
import { INIT_RISKS }      from './data/risks';

const TABS = [
  { id: 'command',    label: '⚡ Command Center' },
  { id: 'tasks',      label: '✓ Tasks' },
  { id: 'gates',      label: '🚪 Stage Gates' },
  { id: 'risks',      label: '⚠ Risks' },
];

const LS_RISKS = 'solar_risks_v1';
const loadRisks = () => { try { const s = localStorage.getItem(LS_RISKS); if (s) return JSON.parse(s); } catch {} return null; };

export default function App() {
  const [tab,   setTab]   = useState('command');
  const [risks, setRisks] = useState(() => loadRisks() ?? INIT_RISKS);

  const handleRisks = (fn) => setRisks(prev => {
    const next = typeof fn === 'function' ? fn(prev) : fn;
    try { localStorage.setItem(LS_RISKS, JSON.stringify(next)); } catch {}
    return next;
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', fontSize:13, color:'#1a1a1a' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background:'#0D2137', color:'#fff', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:48, position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16, fontWeight:900, color:'#C8991A', letterSpacing:'.5px' }}>☀ Solar EPC Egypt</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.35)', fontWeight:400 }}>Founder Operating System · Strategy A · EGP 2M</span>
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:'.3px' }}>v2.0</div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div style={{ background:'#0D2137', padding:'0 20px', borderBottom:'2px solid #C8991A', display:'flex', gap:2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'9px 18px', background:'transparent', border:'none', borderBottom: tab === t.id ? '2px solid #C8991A' : '2px solid transparent', color: tab === t.id ? '#C8991A' : 'rgba(255,255,255,.45)', fontSize:12, fontWeight:700, letterSpacing:'.3px', cursor:'pointer', textTransform:'uppercase', marginBottom:-2, fontFamily:'inherit', whiteSpace:'nowrap', transition:'color .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ padding:'20px', minHeight:'calc(100vh - 96px)' }}>
        {tab === 'command' && <CommandCenter />}
        {tab === 'tasks'   && <TaskSystem />}
        {tab === 'gates'   && <GovernanceView />}
        {tab === 'risks'   && <RiskView risks={risks} setRisks={handleRisks} />}
      </div>
    </div>
  );
}
