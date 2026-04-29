import { useState } from 'react';
import { QUALITY_GATE_DEFS, INIT_QUALITY_GATES } from '../data/qualityGates';

const LS_KEY = 'solar_quality_gates_v1';

const load = () => {
  try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
  return null;
};

const save = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
};

const catColor = {
  'IEC Compliance': '#1A6B72',
  'Regulatory':     '#8E44AD',
  'Design':         '#2471A3',
  'Site':           '#1E7E34',
  'Procurement':    '#D35400',
  'Financial':      '#C8991A',
  'Legal':          '#C0392B',
  'Safety':         '#E74C3C',
  'Installation':   '#1A6B72',
  'Documentation':  '#555',
  'NREA':           '#8E44AD',
  'Performance':    '#27AE60',
  'Handover':       '#2471A3',
  'Revenue':        '#C8991A',
};

export const QualityGatesView = () => {
  const [checks, setChecks] = useState(() => load() ?? INIT_QUALITY_GATES);

  const toggle = (id) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      save(next);
      return next;
    });
  };

  const stages = Object.entries(QUALITY_GATE_DEFS);
  const allItems = stages.flatMap(([, s]) => s.items);
  const totalDone = allItems.filter(i => checks[i.id]).length;

  const card = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.09)' };

  return (
    <div>
      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
        IEC + NREA Article 5 compliant quality gates. Blocking items (marked ⛔) must all pass before proceeding. No phase skipping.
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
        {stages.map(([key, stage]) => {
          const items = stage.items;
          const done = items.filter(i => checks[i.id]).length;
          const blocking = items.filter(i => i.blocking);
          const blockingDone = blocking.filter(i => checks[i.id]).length;
          const allBlockingDone = blockingDone === blocking.length;
          return (
            <div key={key} style={{ ...card, padding: 12, borderTop: `3px solid ${allBlockingDone ? '#1E7E34' : '#C8991A'}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>{stage.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: allBlockingDone ? '#1E7E34' : '#0D2137', marginBottom: 2 }}>{done}<span style={{ fontSize: 14, color: '#888' }}>/{items.length}</span></div>
              <div style={{ fontSize: 10, color: allBlockingDone ? '#1E7E34' : '#C0392B' }}>
                {allBlockingDone ? '✓ All blocking passed' : `${blocking.length - blockingDone} blocking remaining`}
              </div>
            </div>
          );
        })}
        <div style={{ ...card, padding: 12, borderTop: '3px solid #0D2137' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>Total Progress</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0D2137', marginBottom: 2 }}>{totalDone}<span style={{ fontSize: 14, color: '#888' }}>/{allItems.length}</span></div>
          <div style={{ fontSize: 10, color: '#888' }}>{Math.round(totalDone / allItems.length * 100)}% complete</div>
        </div>
      </div>

      {/* Stage sections */}
      {stages.map(([key, stage]) => {
        const items = stage.items;
        const done = items.filter(i => checks[i.id]).length;
        const allBlockingDone = items.filter(i => i.blocking).every(i => checks[i.id]);

        return (
          <div key={key} style={{ ...card, borderLeft: `4px solid ${allBlockingDone ? '#1E7E34' : '#C8991A'}` }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0D2137', marginBottom: 3 }}>{stage.label}</div>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{stage.subtitle}</div>
              <div style={{ background: '#e8ecf0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${done / items.length * 100}%`, height: '100%', background: allBlockingDone ? '#1E7E34' : '#C8991A', transition: 'width .3s' }} />
              </div>
            </div>

            {/* Fail action */}
            {!allBlockingDone && (
              <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: 4, padding: '7px 12px', fontSize: 11, color: '#7B241C', marginBottom: 12, lineHeight: 1.5 }}>
                <b>Stop Rule: </b>{stage.failAction}
              </div>
            )}

            {/* Items */}
            <div>
              {items.map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f2f5', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={checks[item.id] ?? false}
                    onChange={() => toggle(item.id)}
                    style={{ marginTop: 2, accentColor: '#1A6B72', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1A6B72', fontSize: 11 }}>{item.id}</span>
                      <span style={{ background: catColor[item.category] ?? '#888', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>{item.category}</span>
                      {item.blocking && <span style={{ fontSize: 10, color: '#C0392B', fontWeight: 700 }}>⛔ Blocking</span>}
                    </div>
                    <span style={{ fontSize: 12, color: checks[item.id] ? '#888' : '#1a1a1a', textDecoration: checks[item.id] ? 'line-through' : 'none', lineHeight: 1.5 }}>
                      {item.label}
                    </span>
                  </div>
                  {checks[item.id] && <span style={{ color: '#1E7E34', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
