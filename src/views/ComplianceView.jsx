import { useState } from 'react';
import { StatusBadge, Btn } from '../components/Badge';
import { TaskModal } from '../components/TaskModal';

const CATS = [
  { title: '🔴 Critical Deadlines', items: [
    { label: 'NREA Bi-annual Reports', detail: 'January Week 1 + July Week 1 every year. Missing = immediate warning. No grace period. Certificate cancellation on second miss. Tasks C-8, C-9.' },
    { label: 'Client complaint response window', detail: '10 working-day window per NREA Article 9. Repeated valid complaints = certificate cancellation. Log every complaint (C-14).' },
    { label: 'IEC 61215 + IEC 61730 panel certs', detail: 'Must be on file before any installation. DISCO will not connect non-certified equipment. Collect at supplier qualification stage (C-2, C-3).' },
  ]},
  { title: '📋 NREA Qualification Requirements', items: [
    { label: 'Target tier: Bronze (startup-achievable)', detail: 'Score >55/100 required. EGP 2M capital scores strongly on capital criterion (25% of total). Application fee: EGP 5K review + EGP 5K certificate.' },
    { label: 'Engineers Syndicate membership', detail: 'Mandatory for all engineers and consultants. Verify at hiring (C-4). Consultant must hold syndicate registration or MSc/PhD in PV-related field.' },
    { label: 'Required dossier documents', detail: 'Commercial register, tax card, financial statements (3 years or opening balance), org chart + CVs, IEC certs, installed capacity list with signed contracts.' },
    { label: 'Certificate validity', detail: '3 years. Must renew 10 days before expiry. Partnership change: EGP 5K review fee, certificate valid for remaining period.' },
  ]},
  { title: '📄 Contract Obligations (NREA Article 5)', items: [
    { label: 'BOM with IEC specs in every contract', detail: 'Required by NREA Article 5. Include in EPC contract template (L-4). DISCO-approved capacity must be stated.' },
    { label: 'FX escalation clause', detail: 'Every EPC contract without exception. Walk away if client refuses (C-10). Protects against EGP depreciation between signing and commissioning.' },
    { label: '30–40% deposit at signing', detail: 'Every EPC contract in Strategy A/B (C-11). Walk away if refused. Minimum 25% if client is high-value. Never proceed without deposit.' },
    { label: 'Client training at commissioning', detail: 'NREA Article 5 obligation. Document in commissioning report. Include safety labels on all equipment and emergency procedure training (C-12, C-13).' },
    { label: 'Post-warranty maintenance offer', detail: 'Must offer O&M contract after warranty expires (NREA Article 7). Template from L-5. EGP 800/kW/year.' },
  ]},
];

const card = { background: '#fff', borderRadius: 6, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.08)' };
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0D2137', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px', borderLeft: '3px solid #C8991A', paddingLeft: 10 };

const td = { padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' };

export const ComplianceView = ({ tasks, onUpdate }) => {
  const [editing, setEditing] = useState(null);
  const compTasks = tasks.filter(t => t.labels.includes('Compliance'));
  const done      = compTasks.filter(t => t.status === 'Done').length;
  const inprog    = compTasks.filter(t => t.status === 'In Progress').length;
  const todo      = compTasks.filter(t => t.status === 'Todo').length;
  const blocked   = compTasks.filter(t => t.status === 'Blocked').length;

  return (
    <div>
      {editing && <TaskModal task={editing} onSave={onUpdate} onClose={() => setEditing(null)} />}

      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
        Operating without an NREA qualification certificate means DISCO will not connect solar installations — this blocks all revenue. Bronze tier is achievable for a startup with EGP 2M capital.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Compliance', val: compTasks.length, color: '#0D2137' },
          { label: 'Done',             val: done,             color: '#1E7E34' },
          { label: 'In Progress',      val: inprog,           color: '#1A6B72' },
          { label: 'Todo',             val: todo,             color: '#555' },
          { label: 'Blocked',          val: blocked,          color: '#C0392B' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...card, minWidth: 0, padding: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {CATS.map(cat => (
        <div key={cat.title} style={card}>
          <div style={sectionTitle}>{cat.title}</div>
          {cat.items.map(({ label, detail }) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#0D2137', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{detail}</div>
            </div>
          ))}
        </div>
      ))}

      <div style={sectionTitle}>All Compliance Tasks</div>
      <div style={{ overflowX: 'auto', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['ID','Task','Owner','Due','Status','Edit'].map(h => (
                <th key={h} style={{ background: '#0D2137', color: '#fff', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compTasks.map((t, i) => (
              <tr key={t.id} style={{ background: t.status === 'Blocked' ? '#fff5f5' : t.status === 'Done' ? '#f0fff4' : i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={td}><b style={{ color: '#1A6B72' }}>{t.id}</b></td>
                <td style={td}>{t.name}</td>
                <td style={{ ...td, fontSize: 11, color: '#555' }}>{t.owner}</td>
                <td style={{ ...td, fontSize: 11, color: '#888' }}>{t.end}</td>
                <td style={td}><StatusBadge status={t.status} /></td>
                <td style={td}><Btn size="sm" variant="ghost" onClick={() => setEditing(t)}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
