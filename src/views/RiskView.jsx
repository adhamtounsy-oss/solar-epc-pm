import { useState } from 'react';
import { Btn } from '../components/Badge';

const SEV_COLOR  = { Critical: '#7B0000', High: '#C0392B', Medium: '#D4770A', Low: '#1E7E34' };
const PROB_COLOR = { High: '#C0392B', Medium: '#D4770A', Low: '#1E7E34' };

const inp = { width: '100%', border: '1px solid #dde1e7', borderRadius: 4, padding: '7px 10px', fontSize: 13, color: '#1a1a1a', fontFamily: 'inherit' };

export const RiskView = ({ risks, setRisks }) => {
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState(null);

  const openEdit = r => { setEditId(r.id); setForm({ ...r }); };
  const saveRisk = () => { setRisks(rs => rs.map(r => r.id === form.id ? form : r)); setEditId(null); };

  return (
    <div>
      {editId && (
        <div onClick={e => e.target === e.currentTarget && setEditId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}
        >
          <div style={{ background: '#fff', borderRadius: 8, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ background: '#0D2137', color: '#C8991A', padding: '14px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14 }}>
              Edit Risk: {form?.id}
              <button onClick={() => setEditId(null)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Description', field: 'description', full: true },
                { label: 'Category',    field: 'category' },
              ].map(({ label, field, full }) => (
                <div key={field} style={{ gridColumn: full ? '1/-1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
                  <input style={inp} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
                </div>
              ))}
              {[
                { label: 'Severity',    field: 'severity',    opts: ['Critical','High','Medium','Low'] },
                { label: 'Probability', field: 'probability', opts: ['High','Medium','Low'] },
                { label: 'Status',      field: 'status',      opts: ['Open','Mitigated','Accepted'] },
              ].map(({ label, field, opts }) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
                  <select style={inp} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Mitigation</label>
                <textarea rows={3} style={{ ...inp, resize: 'vertical' }} value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Btn variant="ghost" onClick={() => setEditId(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={saveRisk}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 }}>
        {['Critical','High','Medium','Low'].map(s => {
          const n = risks.filter(r => r.severity === s && r.status === 'Open').length;
          return (
            <div key={s} style={{ background: '#fff', borderRadius: 6, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{s} — Open</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: SEV_COLOR[s] }}>{n}</div>
            </div>
          );
        })}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['ID','Category','Risk','Severity','Probability','Status','Mitigation','Edit'].map(h => (
                <th key={h} style={{ background: '#0D2137', color: '#fff', padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {risks.map((r, i) => (
              <tr key={r.id} style={{ background: r.status === 'Mitigated' ? '#f0fff4' : r.status === 'Accepted' ? '#fff8e1' : i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><b>{r.id}</b></td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 11 }}>{r.category}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontWeight: 500 }}>{r.description}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><span style={{ color: SEV_COLOR[r.severity], fontWeight: 700, fontSize: 12 }}>{r.severity}</span></td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><span style={{ color: PROB_COLOR[r.probability], fontWeight: 700, fontSize: 12 }}>{r.probability}</span></td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: r.status === 'Open' ? '#C0392B' : r.status === 'Mitigated' ? '#1E7E34' : '#D4770A' }}>{r.status}</span>
                </td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top', fontSize: 11, color: '#555', lineHeight: 1.4, minWidth: 280 }}>{r.mitigation}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e8ecf0', verticalAlign: 'top' }}><Btn size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
