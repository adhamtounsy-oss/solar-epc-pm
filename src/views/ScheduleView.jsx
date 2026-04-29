import { Badge, StatusBadge } from '../components/Badge';

const PHASES = [
  { label: 'Week 1–2 (D1–14)',      col: 'w1-2' },
  { label: 'Week 3–4 (D15–28)',     col: 'w3-4' },
  { label: 'Month 2 (D29–60)',      col: 'month2' },
  { label: 'Month 3 (D61–90)',      col: 'month3' },
  { label: 'Execution (D91–240)',   col: 'execution' },
  { label: 'Backlog / Ongoing',     col: 'backlog' },
];

const th = { background: '#0D2137', color: '#fff', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 };
const td = { padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' };
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0D2137', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px', borderLeft: '3px solid #C8991A', paddingLeft: 10 };

export const ScheduleView = ({ tasks }) => (
  <div>
    <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
      Critical path tasks highlighted red. Full commissioning target: Day 175. Month 6 gate: Day 180 (no signed contract = invoke gate).
    </div>

    {PHASES.map(({ label, col }) => {
      const phaseTasks = tasks.filter(t => t.col === col && t.col !== 'done');
      if (!phaseTasks.length) return null;
      return (
        <div key={col} style={{ marginBottom: 20 }}>
          <div style={sectionTitle}>{label}</div>
          <div style={{ overflowX: 'auto', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 50 }}>ID</th>
                  <th style={th}>Task</th>
                  <th style={{ ...th, width: 120 }}>Owner</th>
                  <th style={{ ...th, width: 70 }}>Start</th>
                  <th style={{ ...th, width: 70 }}>End</th>
                  <th style={{ ...th, width: 100 }}>Status</th>
                  <th style={{ ...th, width: 200 }}>Labels</th>
                  <th style={{ ...th, width: 160 }}>Depends On</th>
                </tr>
              </thead>
              <tbody>
                {phaseTasks.map((t, i) => (
                  <tr key={t.id} style={{ background: t.labels.includes('Critical Path') ? '#fff5f5' : t.status === 'Done' ? '#f0fff4' : i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={td}><b style={{ color: t.labels.includes('Critical Path') ? '#C0392B' : '#0D2137' }}>{t.id}</b></td>
                    <td style={td}>{t.name}</td>
                    <td style={{ ...td, fontSize: 11, color: '#555' }}>{t.owner}</td>
                    <td style={{ ...td, fontSize: 11 }}>{t.start}</td>
                    <td style={{ ...td, fontSize: 11 }}>{t.end}</td>
                    <td style={td}><StatusBadge status={t.status} /></td>
                    <td style={td}>{t.labels.map(l => <Badge key={l} label={l} />)}</td>
                    <td style={{ ...td, fontSize: 11, color: '#888' }}>{t.depends}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    })}
  </div>
);
