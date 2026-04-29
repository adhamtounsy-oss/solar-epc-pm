import { useState } from 'react';
import { INIT_GOVERNANCE } from '../data/governance';

const LS_KEY = 'solar_governance_v1';

const load = () => {
  try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
  return null;
};

const save = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
};

const phaseColor = { 'Phase 1': '#1A6B72', 'Phase 2': '#8E44AD' };
const decisionColor = { go: '#1E7E34', nogo: '#C0392B', null: '#888' };

export const GovernanceView = () => {
  const [gates, setGates] = useState(() => load() ?? INIT_GOVERNANCE);

  const toggleCriteria = (gateId, cId) => {
    setGates(gs => {
      const next = gs.map(g => g.id !== gateId ? g : {
        ...g,
        criteria: g.criteria.map(c => c.id !== cId ? c : { ...c, done: !c.done }),
      });
      save(next);
      return next;
    });
  };

  const setDecision = (gateId, decision) => {
    setGates(gs => {
      const next = gs.map(g => g.id !== gateId ? g : {
        ...g,
        decision,
        decidedOn: new Date().toISOString().slice(0, 10),
      });
      save(next);
      return next;
    });
  };

  const setNotes = (gateId, notes) => {
    setGates(gs => {
      const next = gs.map(g => g.id !== gateId ? g : { ...g, notes });
      save(next);
      return next;
    });
  };

  const card = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.09)' };

  return (
    <div>
      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
        Five decision gates across Days 30–175. Each requires explicit Go/No-Go before proceeding. A No-Go triggers the recovery protocol shown below each gate.
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 16 }}>
        {gates.map(g => {
          const passed = g.criteria.filter(c => c.done).length;
          const pct = Math.round(passed / g.criteria.length * 100);
          const isGo = g.decision === 'go';
          const isNogo = g.decision === 'nogo';
          return (
            <div key={g.id} style={{ ...card, padding: 12, borderTop: `3px solid ${isGo ? '#1E7E34' : isNogo ? '#C0392B' : '#C8991A'}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>{g.id}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0D2137', marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Day {g.targetDay} · {g.phase}</div>
              <div style={{ background: '#e8ecf0', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 85 ? '#1E7E34' : pct >= 50 ? '#C8991A' : '#C0392B', transition: 'width .3s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{passed}/{g.criteria.length} criteria</div>
              {g.decision && (
                <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: decisionColor[g.decision], textTransform: 'uppercase' }}>
                  {g.decision === 'go' ? '✓ GO' : '✗ NO-GO'} · {g.decidedOn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gate detail cards */}
      {gates.map(g => {
        const passed = g.criteria.filter(c => c.done).length;
        const meetsThreshold = passed >= g.goThreshold;
        const isGo = g.decision === 'go';
        const isNogo = g.decision === 'nogo';

        return (
          <div key={g.id} style={{ ...card, borderLeft: `4px solid ${isGo ? '#1E7E34' : isNogo ? '#C0392B' : phaseColor[g.phase] ?? '#C8991A'}` }}>
            {/* Gate header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0D2137' }}>{g.id}: {g.name}</span>
                  <span style={{ background: phaseColor[g.phase] ?? '#888', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{g.phase}</span>
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  Target: <b>Day {g.targetDay}</b> · Threshold: <b>{g.goThreshold}/{g.criteria.length} criteria</b> · Status: <b style={{ color: decisionColor[g.decision] }}>{g.decision ? g.decision.toUpperCase() : 'Pending'}</b>
                </div>
              </div>
              {/* Go/No-Go buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDecision(g.id, 'go')}
                  style={{ padding: '6px 16px', background: isGo ? '#1E7E34' : '#e8f5e9', color: isGo ? '#fff' : '#1E7E34', border: '1px solid #1E7E34', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✓ GO
                </button>
                <button
                  onClick={() => setDecision(g.id, 'nogo')}
                  style={{ padding: '6px 16px', background: isNogo ? '#C0392B' : '#fff5f5', color: isNogo ? '#fff' : '#C0392B', border: '1px solid #C0392B', borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✗ NO-GO
                </button>
              </div>
            </div>

            {/* Criteria checklist */}
            <div style={{ marginBottom: 14 }}>
              {g.criteria.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={c.done}
                    onChange={() => toggleCriteria(g.id, c.id)}
                    style={{ marginTop: 1, accentColor: '#1A6B72', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: '#1A6B72', fontSize: 11, marginRight: 6 }}>{c.id}</span>
                    <span style={{ fontSize: 12, color: c.done ? '#888' : '#1a1a1a', textDecoration: c.done ? 'line-through' : 'none' }}>{c.label}</span>
                  </div>
                  {c.done && <span style={{ color: '#1E7E34', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>✓</span>}
                </label>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
                <span>{passed}/{g.criteria.length} criteria met</span>
                <span style={{ fontWeight: 700, color: meetsThreshold ? '#1E7E34' : '#C0392B' }}>
                  {meetsThreshold ? `≥${g.goThreshold} threshold MET` : `Need ${g.goThreshold - passed} more for Green Go`}
                </span>
              </div>
              <div style={{ background: '#e8ecf0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${passed / g.criteria.length * 100}%`, height: '100%', background: meetsThreshold ? '#1E7E34' : '#C8991A', transition: 'width .3s' }} />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4 }}>Decision Notes</div>
              <textarea
                value={g.notes}
                onChange={e => setNotes(g.id, e.target.value)}
                placeholder="Record decision rationale, conditions, or follow-up actions…"
                rows={2}
                style={{ width: '100%', fontSize: 12, border: '1px solid #d0d5dd', borderRadius: 4, padding: '6px 8px', fontFamily: 'inherit', color: '#1a1a1a', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* No-Go recovery action */}
            {(isNogo || !g.decision) && (
              <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#7B241C', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700 }}>No-Go Recovery Protocol: </span>{g.noGoAction}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
