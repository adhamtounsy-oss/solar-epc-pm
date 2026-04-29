import { useState } from 'react';
import { PROCESS_QUALITY_DEFS, PARTNER_QUALITY_DEFS, CUSTOMER_QUALITY_DEFS, INTERNAL_CONTROLS, INIT_ORG_QUALITY } from '../data/orgQuality';
import { BUDGET_BASELINE, INIT_ACTUALS, CASH_THRESHOLDS } from '../data/control';

const LS_KEY = 'solar_org_quality_v1';
const LS_ACTUALS = 'solar_actuals_v1';
const LS_CASH = 'solar_cash_v1';

const loadQuality = () => { try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {} return null; };
const loadActuals = () => { try { const s = localStorage.getItem(LS_ACTUALS); if (s) return JSON.parse(s); } catch {} return null; };
const loadCash = () => { try { const s = localStorage.getItem(LS_CASH); if (s) return Number(s); } catch {} return 2000000; };

const saveQuality = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };
const saveActuals = (d) => { try { localStorage.setItem(LS_ACTUALS, JSON.stringify(d)); } catch {} };
const saveCash = (v) => { try { localStorage.setItem(LS_CASH, String(v)); } catch {} };

const fmtEgp = (n) => `EGP ${Number(n).toLocaleString('en-EG')}`;

const getStatus = (def, value) => {
  const { thresholds, inverted } = def;
  if (inverted) {
    if (value <= thresholds.green) return 'green';
    if (value <= thresholds.yellow) return 'yellow';
    return 'red';
  }
  if (value >= thresholds.green) return 'green';
  if (thresholds.yellow !== null && value >= thresholds.yellow) return 'yellow';
  return 'red';
};

const statusStyle = { green: { color: '#1E7E34', background: '#e8f5e9' }, yellow: { color: '#856404', background: '#fff3cd' }, red: { color: '#7B241C', background: '#fff5f5' } };

const card = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.09)' };
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0D2137', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px', borderLeft: '3px solid #C8991A', paddingLeft: 10 };
const th = { background: '#0D2137', color: '#fff', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 };
const td = { padding: '8px 10px', borderBottom: '1px solid #e8ecf0', fontSize: 12, verticalAlign: 'middle' };

const KpiSection = ({ title, defs, values, onChange }) => (
  <div style={card}>
    <div style={sectionTitle}>{title}</div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {['ID', 'KPI', 'Target', 'Actual', 'Status', 'Escalation'].map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {defs.map((def, i) => {
            const val = values[def.id] ?? 0;
            const status = getStatus(def, val);
            const ss = statusStyle[status];
            return (
              <tr key={def.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}><b style={{ color: '#1A6B72' }}>{def.id}</b></td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{def.label}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{def.description}</div>
                </td>
                <td style={{ ...td, color: '#555' }}>{def.target}{def.unit}</td>
                <td style={{ ...td }}>
                  <input
                    type="number"
                    value={val}
                    onChange={e => onChange(def.id, e.target.value)}
                    style={{ width: 80, padding: '4px 6px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 12, fontFamily: 'inherit', color: '#1a1a1a' }}
                  />
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>{def.unit}</span>
                </td>
                <td style={td}>
                  <span style={{ ...ss, borderRadius: 10, padding: '2px 10px', fontWeight: 700, fontSize: 11 }}>
                    {status.toUpperCase()}
                  </span>
                </td>
                <td style={{ ...td, fontSize: 11, color: '#666', maxWidth: 260 }}>{def.escalation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export const OrgQualityView = () => {
  const [quality, setQuality] = useState(() => loadQuality() ?? INIT_ORG_QUALITY);
  const [actuals, setActuals] = useState(() => loadActuals() ?? INIT_ACTUALS);
  const [cash, setCash] = useState(() => loadCash());

  const updateKpi = (id, val) => {
    setQuality(q => {
      const next = { ...q, process: { ...q.process, [id]: Number(val) } };
      saveQuality(next);
      return next;
    });
  };

  const updateActual = (wbs, val) => {
    setActuals(a => {
      const next = { ...a, [wbs]: Number(val) };
      saveActuals(next);
      return next;
    });
  };

  const updateCash = (val) => {
    const n = Number(val);
    setCash(n);
    saveCash(n);
  };

  const cashStatus = cash >= CASH_THRESHOLDS.comfortable ? 'green' : cash >= CASH_THRESHOLDS.caution ? 'yellow' : 'red';
  const cashRule = CASH_THRESHOLDS.rules.find(r => {
    if (r.severity === 'critical') return cash < CASH_THRESHOLDS.critical;
    if (r.severity === 'red')      return cash < CASH_THRESHOLDS.caution;
    if (r.severity === 'yellow')   return cash < CASH_THRESHOLDS.comfortable;
    return true;
  }) ?? CASH_THRESHOLDS.rules[0];

  const totalBudget = Object.values(BUDGET_BASELINE.workstreams).reduce((s, w) => s + w.budget, 0);
  const totalActual = Object.values(actuals).reduce((s, v) => s + v, 0);
  const overallVariance = totalActual - totalBudget;

  return (
    <div>
      {/* Cash position */}
      <div style={{ ...card, borderLeft: `4px solid ${cashStatus === 'green' ? '#1E7E34' : cashStatus === 'yellow' ? '#C8991A' : '#C0392B'}` }}>
        <div style={sectionTitle}>Cash Position</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 2 }}>Current Cash (EGP)</div>
            <input
              type="number"
              value={cash}
              onChange={e => updateCash(e.target.value)}
              style={{ width: 160, padding: '6px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 16, fontWeight: 700, fontFamily: 'inherit', color: '#0D2137' }}
            />
          </div>
          <div style={{ ...statusStyle[cashStatus], borderRadius: 6, padding: '8px 16px', fontWeight: 700, fontSize: 14 }}>
            {cashStatus.toUpperCase()} — {fmtEgp(cash)}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Comfortable (Green)', val: CASH_THRESHOLDS.comfortable, color: '#1E7E34' },
            { label: 'Caution (Yellow)', val: CASH_THRESHOLDS.caution, color: '#C8991A' },
            { label: 'Critical (Red)', val: CASH_THRESHOLDS.critical, color: '#C0392B' },
          ].map(t => (
            <div key={t.label} style={{ fontSize: 11, color: t.color }}>
              <span style={{ fontWeight: 700 }}>{t.label}: </span>{fmtEgp(t.val)}
            </div>
          ))}
        </div>
        {cashRule && (
          <div style={{ background: cashStatus === 'green' ? '#e8f5e9' : cashStatus === 'yellow' ? '#fff3cd' : '#fff5f5', border: `1px solid ${cashStatus === 'green' ? '#a3d9a5' : cashStatus === 'yellow' ? '#ffc107' : '#ffcccc'}`, borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#333', lineHeight: 1.6 }}>
            <b>{cashRule.trigger}: </b>{cashRule.action}
          </div>
        )}
      </div>

      {/* Budget vs Actuals */}
      <div style={card}>
        <div style={sectionTitle}>Budget vs Actuals</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Total Budget</span><div style={{ fontWeight: 700, fontSize: 18, color: '#0D2137' }}>{fmtEgp(totalBudget)}</div></div>
          <div><span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Total Spent</span><div style={{ fontWeight: 700, fontSize: 18, color: totalActual > totalBudget ? '#C0392B' : '#1E7E34' }}>{fmtEgp(totalActual)}</div></div>
          <div><span style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>Variance</span><div style={{ fontWeight: 700, fontSize: 18, color: overallVariance > 0 ? '#C0392B' : '#1E7E34' }}>{overallVariance >= 0 ? '+' : ''}{fmtEgp(overallVariance)}</div></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['WBS', 'Workstream', 'Budget (EGP)', 'Actual (EGP)', 'Variance', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {Object.entries(BUDGET_BASELINE.workstreams).map(([id, ws], i) => {
                const actual = actuals[id] ?? 0;
                const variance = actual - ws.budget;
                const pct = ws.budget > 0 ? variance / ws.budget : 0;
                const status = pct <= 0.05 ? 'green' : pct <= 0.10 ? 'yellow' : 'red';
                return (
                  <tr key={id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={td}><b style={{ color: '#1A6B72' }}>{id}</b></td>
                    <td style={td}>{ws.label}</td>
                    <td style={td}>{fmtEgp(ws.budget)}</td>
                    <td style={td}>
                      <input
                        type="number"
                        value={actual}
                        onChange={e => updateActual(id, e.target.value)}
                        style={{ width: 110, padding: '3px 6px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }}
                      />
                    </td>
                    <td style={{ ...td, color: variance > 0 ? '#C0392B' : variance < 0 ? '#1E7E34' : '#888', fontWeight: 600 }}>
                      {variance >= 0 ? '+' : ''}{fmtEgp(variance)}
                    </td>
                    <td style={td}>
                      <span style={{ ...statusStyle[status], borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontSize: 10 }}>{status.toUpperCase()}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Quality */}
      <KpiSection
        title="A. Process Quality KPIs"
        defs={PROCESS_QUALITY_DEFS}
        values={quality.process}
        onChange={updateKpi}
      />

      {/* Partner Quality */}
      <KpiSection
        title="B. Partner / Subcontractor Quality"
        defs={PARTNER_QUALITY_DEFS}
        values={quality.process}
        onChange={updateKpi}
      />

      {/* Customer Quality */}
      <KpiSection
        title="C. Customer Experience Quality"
        defs={CUSTOMER_QUALITY_DEFS}
        values={quality.process}
        onChange={updateKpi}
      />

      {/* Internal Controls */}
      <div style={card}>
        <div style={sectionTitle}>D. Internal Controls</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>{['ID', 'Category', 'Control', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {INTERNAL_CONTROLS.map((ic, i) => (
                <tr key={ic.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={td}><b style={{ color: '#1A6B72' }}>{ic.id}</b></td>
                  <td style={td}><span style={{ background: '#e8ecf0', borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600, color: '#0D2137' }}>{ic.category}</span></td>
                  <td style={{ ...td, maxWidth: 380 }}>{ic.control}</td>
                  <td style={td}><span style={{ ...statusStyle.green, borderRadius: 10, padding: '2px 10px', fontWeight: 700, fontSize: 10 }}>{ic.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
