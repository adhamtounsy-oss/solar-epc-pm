export const KPIDash = ({ kpis, tasks, setKpis }) => {
  const upd = (k, v) => setKpis(p => ({ ...p, [k]: isNaN(Number(v)) ? v : Number(v) }));

  const done    = tasks.filter(t => t.status === 'Done').length;
  const inprog  = tasks.filter(t => t.status === 'In Progress').length;
  const blocked = tasks.filter(t => t.status === 'Blocked').length;
  const critDone  = tasks.filter(t => t.labels.includes('Critical Path') && t.status === 'Done').length;
  const critTotal = tasks.filter(t => t.labels.includes('Critical Path')).length;
  const compDone  = tasks.filter(t => t.labels.includes('Compliance') && t.status === 'Done').length;
  const compTotal = tasks.filter(t => t.labels.includes('Compliance')).length;

  const card = { background: '#fff', borderRadius: 6, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.08)' };
  const lbl  = { fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 };
  const bar  = { height: 4, background: '#e0e4ea', borderRadius: 2, marginTop: 10 };

  const KPI = ({ label, field, targetField, prefix = '' }) => {
    const val = kpis[field];
    const tgt = targetField ? kpis[targetField] : null;
    const pct = tgt ? Math.min(100, Math.round((val / tgt) * 100)) : null;
    const barColor = pct == null ? '#1A6B72' : pct >= 100 ? '#1E7E34' : pct >= 50 ? '#D4770A' : '#C0392B';
    return (
      <div style={card}>
        <div style={lbl}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          {prefix && <span style={{ fontSize: 11, color: '#888' }}>{prefix}</span>}
          <input
            value={val}
            onChange={e => upd(field, e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: '#0D2137', width: '100%', background: 'transparent', padding: 0, fontFamily: 'inherit', borderBottom: '1px dashed transparent' }}
            onFocus={e => e.target.style.borderBottomColor = '#1A6B72'}
            onBlur={e => e.target.style.borderBottomColor = 'transparent'}
          />
        </div>
        {tgt != null && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Target: {tgt.toLocaleString()}</div>}
        {pct != null && <div style={bar}><div style={{ height: 4, borderRadius: 2, background: barColor, width: `${pct}%`, transition: 'width .3s' }} /></div>}
      </div>
    );
  };

  const StatCard = ({ label, val, total, color }) => (
    <div style={card}>
      <div style={lbl}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>
        {val}<span style={{ fontSize: 14, color: '#aaa', fontWeight: 400 }}>/{total}</span>
      </div>
      <div style={bar}><div style={{ height: 4, borderRadius: 2, background: color, width: `${Math.round((val / total) * 100)}%`, transition: 'width .3s' }} /></div>
    </div>
  );

  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 16 };
  const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0D2137', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px', borderLeft: '3px solid #C8991A', paddingLeft: 10 };

  return (
    <div>
      <div style={sectionTitle}>Business KPIs</div>
      <div style={grid}>
        <KPI label="Days Elapsed"               field="daysElapsed" />
        <KPI label="Cash Position"  prefix="EGP" field="cashPosition" />
        <KPI label="Leads Generated"            field="leadsGenerated"       targetField="leadsTarget" />
        <KPI label="Site Visits"                field="siteVisits"           targetField="siteVisitsTarget" />
        <KPI label="Feasibility Studies Sold"   field="feasStudiesSold"      targetField="feasStudiesTarget" />
        <KPI label="Studies Delivered"          field="feasStudiesDelivered" targetField="feasStudiesTarget" />
        <KPI label="Proposals Submitted"        field="proposalsSubmitted"   targetField="proposalsTarget" />
        <KPI label="Contracts Signed"           field="contractsSigned"      targetField="contractsTarget" />
        <KPI label="Deposits Collected" prefix="EGP" field="depositCollected" targetField="depositTarget" />
        <KPI label="Y1 Revenue"     prefix="EGP" field="revenueY1"           targetField="revenueY1Target" />
      </div>

      <div style={{ ...sectionTitle, marginTop: 16 }}>Compliance & Licensing</div>
      <div style={grid}>
        {[
          { label: 'NREA Qualification', field: 'nreaStatus', opts: ['Not Applied','Dossier Prep','Applied','Bronze','Silver','Gold','Platinum'], pcts: [0,20,40,100,100,100,100] },
          { label: 'EgyptERA License',   field: 'egypteraStatus', opts: ['Not Applied','Submitted','Pending','Approved'], pcts: [0,33,66,100] },
        ].map(({ label, field, opts, pcts }) => {
          const idx = opts.indexOf(kpis[field]);
          const pct = pcts[idx] ?? 0;
          return (
            <div key={field} style={card}>
              <div style={lbl}>{label}</div>
              <select
                value={kpis[field]}
                onChange={e => upd(field, e.target.value)}
                style={{ fontSize: 14, fontWeight: 700, color: '#0D2137', border: 'none', background: 'transparent', width: '100%', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
              <div style={bar}><div style={{ height: 4, borderRadius: 2, background: '#1A6B72', width: `${pct}%`, transition: 'width .3s' }} /></div>
            </div>
          );
        })}
      </div>

      <div style={{ ...sectionTitle, marginTop: 16 }}>Task Health</div>
      <div style={grid}>
        <StatCard label="Tasks Done"          val={done}      total={tasks.length} color="#1E7E34" />
        <StatCard label="In Progress"         val={inprog}    total={tasks.length} color="#1A6B72" />
        <StatCard label="Blocked"             val={blocked}   total={tasks.length} color="#C0392B" />
        <StatCard label="Critical Path Done"  val={critDone}  total={critTotal}    color="#C0392B" />
        <StatCard label="Compliance Done"     val={compDone}  total={compTotal}    color="#1A6B72" />
      </div>
    </div>
  );
};
