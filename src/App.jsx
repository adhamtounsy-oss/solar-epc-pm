import { useState, useEffect } from 'react';
import { ControlCenter } from './views/ControlCenter';
import { CRMView }       from './views/CRMView';

// ── Hash-based Trello setup ────────────────────────────────────────────────────
// Visiting /#trello=BASE64 pre-configures Trello without needing the console.
// Hash is never sent to the server. Cleared from URL after reading.
const bootstrapFromHash = () => {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#trello=')) return false;
    const encoded = hash.slice('#trello='.length);
    const config  = JSON.parse(atob(encoded));
    if (!config.apiKey || !config.apiToken || !config.boardId) return false;
    localStorage.setItem('trello_config_v1', JSON.stringify(config));
    // Clean the hash so it isn't reused on refresh
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  } catch {
    return false;
  }
};

const TABS = [
  { id:'control', label:'Control Center' },
  { id:'crm',     label:'CRM / Leads' },
];

export default function App() {
  const [tab, setTab]             = useState('control');
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    const applied = bootstrapFromHash();
    if (applied) setSetupDone(true);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5',
      fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', fontSize:13, color:'#1a1a1a' }}>

      {/* Trello bootstrap success banner */}
      {setupDone && (
        <div style={{ background:'#1a7a3f', color:'#fff', padding:'10px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12 }}>
          <span>✓ Trello connected — board and lists configured automatically.</span>
          <button onClick={() => setSetupDone(false)}
            style={{ background:'none', border:'none', color:'rgba(255,255,255,.7)',
              cursor:'pointer', fontSize:16, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#0D2137', color:'#fff', padding:'0 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:48, position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:15, fontWeight:900, color:'#C8991A', letterSpacing:'.4px' }}>
            ☀ Solar EPC Egypt
          </span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:400 }}>
            Founder Operating System
          </span>
        </div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', letterSpacing:'.3px' }}>v3.0</div>
      </div>

      {/* Tab bar */}
      <div style={{ background:'#0D2137', padding:'0 20px',
        borderBottom:'2px solid #C8991A', display:'flex', gap:2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'9px 20px', background:'transparent', border:'none',
              borderBottom: tab === t.id ? '2px solid #C8991A' : '2px solid transparent',
              color: tab === t.id ? '#C8991A' : 'rgba(255,255,255,.4)',
              fontSize:12, fontWeight:700, letterSpacing:'.3px', cursor:'pointer',
              textTransform:'uppercase', marginBottom:-2, fontFamily:'inherit',
              whiteSpace:'nowrap', transition:'color .12s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'20px', minHeight:'calc(100vh - 96px)' }}>
        {tab === 'control' && <ControlCenter />}
        {tab === 'crm'     && <CRMView />}
      </div>
    </div>
  );
}
