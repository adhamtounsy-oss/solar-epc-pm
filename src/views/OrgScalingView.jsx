import { useState, useMemo } from 'react';

const C = {
  gold:   '#C8991A', navy:  '#0D2137', bg:    '#f0f2f5',
  card:   '#ffffff', border:'#e2e8f0', text:  '#1a1a1a',
  muted:  '#64748b', green: '#1E7E34', red:   '#C0392B',
  orange: '#D4770A', teal:  '#1A6B72', purple:'#5C2D91',
};

// ─── PHASES — revenue-driven, not certification-driven ────────────────────────
const PHASES = [
  { id: 0, label: 'Phase 0', name: 'No Revenue',    color: C.muted,  icon: '🛠',  sub: 'Formation only. Zero payroll.' },
  { id: 1, label: 'Phase 1', name: 'First Deal',    color: C.teal,   icon: '🎯',  sub: '1–3 contracts signed. Survive.' },
  { id: 2, label: 'Phase 2', name: 'Repeatable',    color: C.gold,   icon: '📈',  sub: '3–10 projects/yr. Build the machine.' },
  { id: 3, label: 'Phase 3', name: 'Scaling',       color: C.green,  icon: '🚀',  sub: '>10 projects/yr. Hire ahead of work.' },
];

// ─── ORG STRUCTURE — minimum viable team per phase ───────────────────────────
// Rule: no revenue → no full-time hires. Outsource until cash flows.
// NREA constraints shown as footnotes, not drivers.
const ORG_STRUCTURE = [
  {
    phase: 0,
    headline: 'Founder alone. Outsource everything.',
    mvt: [
      { role: 'Founder / MD',          type: 'owner',      salary: 0,     mode: 'You',         note: 'Sells, designs, manages. Does it all.' },
    ],
    outsourced: [
      { role: 'Company Formation',     cost: '3,000–5,000 one-off',    when: 'Now' },
      { role: 'CPA / Tax Accountant',  cost: '1,500–2,500/mo',         when: 'Now' },
      { role: 'Legal Counsel',         cost: 'Per engagement',          when: 'As needed' },
    ],
    doNotHire: ['Any full-time staff — no revenue to cover salaries'],
    payroll: 0,
    burn: 5000,
    burnNote: 'Formation costs only. Zero recurring payroll.',
    nreaNote: 'NREA application can be filed after Phase 1 revenue confirms viability. Do not pay E£ 5K registration fee before first deal.',
    trigger: 'Exit when: first contract signed OR pipeline > E£ 500K in qualified leads.',
  },
  {
    phase: 1,
    headline: 'Minimum viable team to deliver first contracts.',
    mvt: [
      { role: 'Founder / MD',          type: 'owner',    salary: 0,     mode: 'You',         note: 'Still doing sales + project oversight.' },
      { role: 'Senior Engineer',       type: 'fulltime', salary: 18000, mode: 'Hire',        note: 'NREA requires 1 syndicate-registered engineer. Hire on first contract signature, not before.' },
      { role: 'Technician × 2',        type: 'fulltime', salary: 7000,  mode: 'Hire',        note: 'Hire when installation date confirmed — not on proposal stage.' },
    ],
    outsourced: [
      { role: 'CPA / Accountant',      cost: '2,000/mo',          when: 'Ongoing' },
      { role: 'Procurement',           cost: 'Per-deal markup',   when: 'Per project' },
      { role: 'Sales support',         cost: 'Commission only',   when: 'If referral network exists' },
      { role: 'Admin / Filing',        cost: '1,500–2,000/mo',    when: 'Part-time freelance' },
    ],
    doNotHire: [
      'Project Manager — founder manages first 1–2 projects directly',
      'Finance Manager — CPA covers this at current volume',
      'Sales Executive — founder closes first deals personally',
      'Procurement Officer — founder handles directly at low volume',
    ],
    payroll: 32000,
    burn: 40000,
    burnNote: 'E£ 32K payroll + ~E£ 8K outsourced. Covered by 1 residential contract (E£ 80–120K) in month 2.',
    nreaNote: 'NREA Bronze minimum is met with: 1 engineer + 2 technicians on social insurance. File for Bronze cert after first project completed.',
    trigger: 'Exit when: 3 contracts signed in same quarter OR monthly revenue ≥ E£ 150K.',
  },
  {
    phase: 2,
    headline: 'Build delivery capacity without outrunning cash.',
    mvt: [
      { role: 'Founder / MD',          type: 'owner',    salary: 0,     mode: 'You',         note: 'Transitions from operator to manager.' },
      { role: 'Senior Engineer',       type: 'fulltime', salary: 20000, mode: 'Retain',      note: 'Now also mentors juniors. Salary reviewed at this phase.' },
      { role: 'Junior Engineer',       type: 'fulltime', salary: 10000, mode: 'Hire',        note: 'Hire when: 2nd concurrent project confirmed.' },
      { role: 'Technician × 3',        type: 'fulltime', salary: 7500,  mode: 'Hire/Retain', note: 'Scale field crew with project backlog — not headcount planning.' },
      { role: 'Sales Executive',       type: 'fulltime', salary: 8000,  mode: 'Hire',        note: 'Hire when: founder cannot follow up > 10 active leads. Commission-heavy structure.' },
      { role: 'Admin / Finance',       type: 'fulltime', salary: 6000,  mode: 'Hire',        note: 'Hire when: invoicing + NREA reporting taking > 1 day/week of founder time.' },
    ],
    outsourced: [
      { role: 'CPA / Auditor',         cost: '3,000/mo',          when: 'Ongoing — upgrade to audit-grade at Phase 3' },
      { role: 'Procurement',           cost: 'In-house now viable', when: 'Assign to senior engineer until volume justifies hire' },
      { role: 'Legal',                 cost: 'Per engagement',    when: 'Tender support, contract review' },
    ],
    doNotHire: [
      'Project Manager — founder + senior engineer cover this. Hire at 3+ simultaneous sites.',
      'Finance Manager — admin + CPA covers Phase 2 volume',
      'Procurement Officer — hire at E£ 500K+/mo procurement spend only',
    ],
    payroll: 73500,
    burn: 85000,
    burnNote: 'E£ 73.5K payroll + ~E£ 11.5K outsourced. Requires E£ 250K+/mo revenue to run comfortably at 35% ratio.',
    nreaNote: 'Target NREA Silver at end of Phase 2 (portfolio ≥ 100 kW, score ≥ 55). File upgrade 3 months before current cert expiry.',
    trigger: 'Exit when: 8+ projects delivered OR revenue > E£ 3M/yr OR first C&I deal (>50 kW) closed.',
  },
  {
    phase: 3,
    headline: 'Hire ahead of work — but only with signed pipeline.',
    mvt: [
      { role: 'Founder / CEO',          type: 'owner',    salary: 0,     mode: 'You',         note: 'Full transition to strategy + BD. Out of day-to-day.' },
      { role: 'Project Manager',        type: 'fulltime', salary: 25000, mode: 'Hire',        note: 'First management hire. Must have EPC background. Hire when 3+ concurrent sites confirmed.' },
      { role: 'Senior Engineer × 2',    type: 'fulltime', salary: 22000, mode: 'Hire/Retain', note: 'Second senior engineer when targeting Gold NREA (consultant grade).' },
      { role: 'Mid Engineer × 2',       type: 'fulltime', salary: 14000, mode: 'Hire',        note: 'Hire when project design backlog > 2 weeks.' },
      { role: 'Technician × 6',         type: 'fulltime', salary: 8000,  mode: 'Hire',        note: 'Scale with MW/yr target. 6 techs ≈ 500 kW/yr capacity.' },
      { role: 'Sales Manager',          type: 'fulltime', salary: 20000, mode: 'Hire',        note: 'Hire when sales team ≥ 3 and pipeline > E£ 5M.' },
      { role: 'Sales Executive × 2',    type: 'fulltime', salary: 9000,  mode: 'Hire',        note: 'One residential, one C&I — only after Sales Manager hired.' },
      { role: 'Procurement Officer',    type: 'fulltime', salary: 10000, mode: 'Hire',        note: 'Hire when monthly equipment spend > E£ 300K.' },
      { role: 'Finance Manager',        type: 'fulltime', salary: 15000, mode: 'Hire',        note: 'Hire when monthly invoicing > E£ 500K or investor relationship begins.' },
      { role: 'Compliance Officer',     type: 'fulltime', salary: 12000, mode: 'Hire',        note: 'Hire 6 months before NREA Gold application or first government tender.' },
    ],
    outsourced: [
      { role: 'Big 4 / Audit-grade CPA', cost: '8,000–15,000/mo', when: 'When targeting investors or government tenders' },
      { role: 'Legal (tender support)',  cost: 'Per engagement',   when: 'Active government pipeline' },
    ],
    doNotHire: [
      'COO — founder + PM covers this until revenue > E£ 20M/yr',
      'O&M Manager — assign to senior engineer until O&M portfolio > 500 kW',
      'HR Manager — admin covers at this headcount',
    ],
    payroll: 230000,
    burn: 255000,
    burnNote: 'E£ 230K payroll + ~E£ 25K outsourced. Requires E£ 700K+/mo revenue (35% ratio). Only reachable with 2+ C&I projects running simultaneously.',
    nreaNote: 'NREA Gold target at Phase 3. Requires: portfolio ≥ 500 kW, consultant-grade engineer, score ≥ 65. Fee: E£ 20,000.',
    trigger: 'Exit when: revenue > E£ 15M/yr OR first MW-scale project OR institutional investor engaged.',
  },
];

// ─── HIRING TRIGGERS — revenue-first logic ───────────────────────────────────
const HIRING_TRIGGERS = [
  {
    role: 'Senior Engineer',
    phase: 'Phase 1 — First Deal',
    color: C.teal,
    fireWhen: 'First contract signed (not on proposal, not on verbal commitment)',
    doNotFireWhen: 'Pipeline only, no signed contract — use freelance engineer for feasibility studies',
    cost: 'E£ 18,000–20,000/mo full-time',
    freelanceAlternative: 'E£ 3,000–5,000 per feasibility study. Use until revenue is confirmed.',
    runwayImpact: 'Adds E£ 216K–240K/yr fixed cost. Covered by ~2–3 residential contracts.',
    nreaConstraint: 'NREA Bronze requires 1 syndicate-registered engineer on payroll. File cert after hire — not before.',
    risk: 'Hiring before contract = burning runway on a bet. Wrong engineer = NREA cert risk.',
  },
  {
    role: 'Technicians (Field)',
    phase: 'Phase 1 — First Deal',
    color: C.teal,
    fireWhen: 'Installation date confirmed on signed contract',
    doNotFireWhen: 'Design phase, procurement phase — no site work yet',
    cost: 'E£ 7,000–8,000/mo each',
    freelanceAlternative: 'Subcontract day-rate crew: E£ 800–1,200/day per tech. Break-even at ~10 days/mo per person.',
    runwayImpact: '2 techs = E£ 168–192K/yr. Justified once monthly site-days exceed 20.',
    nreaConstraint: 'NREA minimum: 2 diploma technicians on social insurance. Convert subcontractors to permanent before filing cert.',
    risk: 'Under-hiring here = project delays. Over-hiring = E£ 14–16K/mo dead weight between projects.',
  },
  {
    role: 'Sales Executive',
    phase: 'Phase 2 — Repeatable',
    color: C.gold,
    fireWhen: 'Founder cannot personally follow up > 10 active leads simultaneously',
    doNotFireWhen: 'Pipeline < 10 qualified leads/mo — founder handles this cheaper',
    cost: 'E£ 7,000–8,000 base + 1–2% commission on closed deals',
    freelanceAlternative: 'Referral agents on 2–3% commission only. Zero fixed cost.',
    runwayImpact: 'Base alone = E£ 84–96K/yr. Commission at E£ 2M sales = E£ 40–60K. Total ~E£ 140K/yr.',
    nreaConstraint: 'None — purely commercial hire.',
    risk: 'Hiring too early = fixed cost with no pipeline to work. Sales people need leads to survive — don\'t hire into a dry pipeline.',
  },
  {
    role: 'Admin / Finance Officer',
    phase: 'Phase 2 — Repeatable',
    color: C.gold,
    fireWhen: 'Founder spending > 1 day/week on invoicing, NREA reports, or filing',
    doNotFireWhen: 'CPA + occasional freelancer covers it — don\'t hire a full-time person for part-time work',
    cost: 'E£ 5,500–6,500/mo',
    freelanceAlternative: 'Part-time bookkeeper: E£ 2,000–3,000/mo. Covers up to Phase 2 volume.',
    runwayImpact: 'E£ 66–78K/yr. Frees ~40 founder hours/mo — worth it once monthly invoicing > E£ 300K.',
    nreaConstraint: 'Needed for bi-annual NREA reports (Jan + Jul). Missing these = cert cancellation. Hire before first renewal.',
    risk: 'Underfunding admin = missed NREA deadlines = certificate cancellation. This hire protects the licence.',
  },
  {
    role: 'Project Manager',
    phase: 'Phase 3 — Scaling',
    color: C.green,
    fireWhen: '3+ projects running simultaneously OR founder spending > 50% of time on site coordination',
    doNotFireWhen: 'Less than 3 concurrent projects — founder + senior engineer manage this',
    cost: 'E£ 22,000–28,000/mo',
    freelanceAlternative: 'None viable. PM must be embedded — project risk too high for freelance at this stage.',
    runwayImpact: 'E£ 264–336K/yr. Needs ~E£ 800K/yr in project margin to justify. Only viable at Phase 3 revenue.',
    nreaConstraint: 'None directly — but missed deadlines from no PM = client complaints = NREA score hit.',
    risk: 'Wrong PM = project delays, cost overruns, complaints. Most expensive bad hire. Spend 2–3 months recruiting properly.',
  },
  {
    role: 'Compliance Officer',
    phase: 'Phase 3 — Scaling',
    color: C.green,
    fireWhen: '6 months before NREA Gold application OR first government tender in pipeline',
    doNotFireWhen: 'Phase 1–2 — admin officer + founder cover compliance at that volume',
    cost: 'E£ 10,000–14,000/mo',
    freelanceAlternative: 'Compliance consultant: E£ 5,000–8,000/mo retainer. Use until Phase 3.',
    runwayImpact: 'E£ 120–168K/yr. Non-negotiable at Gold/Platinum — protecting a E£ 20–30K/yr cert and E£ millions in tender eligibility.',
    nreaConstraint: 'NREA bi-annual reports (Jan + Jul) — zero grace period. Missing = automatic cancellation. This hire exists to prevent that.',
    risk: 'Not having this person when government tenders are active = losing the bid on compliance grounds.',
  },
];

// ─── RUNWAY CALCULATOR DATA ───────────────────────────────────────────────────
const RUNWAY_SCENARIOS = [
  { label: 'Lean (Phase 0–1)',  payroll: 32000,  outsourced: 8000,  overhead: 15000 },
  { label: 'Build (Phase 2)',   payroll: 73500,  outsourced: 11500, overhead: 25000 },
  { label: 'Scale (Phase 3)',   payroll: 230000, outsourced: 25000, overhead: 45000 },
];

// ─── NREA AS CONSTRAINT ───────────────────────────────────────────────────────
const NREA_CONSTRAINTS = [
  {
    tier: 'Bronze', fee: 5000, score: '<55',
    when: 'After first project completed — not before',
    minStaff: '1 engineer (Syndicate) + 2 diploma technicians on social insurance',
    capital: 'E£ 500K–1M paid-up scores 10/25 on capital criterion',
    portfolioReq: 'No minimum — Bronze is achievable as a startup',
    timing: 'File within 3 months of first installation completion',
    urgency: 'medium',
  },
  {
    tier: 'Silver', fee: 10000, score: '55–65',
    when: 'When portfolio ≥ 100 kW AND revenue justifies Phase 2 headcount',
    minStaff: 'Expanded team — consultant engineer or MSc/PhD in PV',
    capital: 'E£ 1M–3M scores 18/25',
    portfolioReq: '> 100 kW total installed',
    timing: 'Typically 18–30 months after Bronze — do not rush',
    urgency: 'low',
  },
  {
    tier: 'Gold', fee: 20000, score: '65–75',
    when: 'When portfolio ≥ 500 kW AND targeting government tenders',
    minStaff: 'Consultant-grade engineers mandatory. Full operations structure.',
    capital: '> E£ 3M scores 25/25',
    portfolioReq: '> 500 kW total, largest single station > 100 kW',
    timing: 'Phase 3 milestone — not before',
    urgency: 'low',
  },
  {
    tier: 'Platinum', fee: 30000, score: '>75',
    when: 'When revenue > E£ 30M/yr and investor/government positioning requires it',
    minStaff: 'Full C-suite + 100% permanent staff ratio',
    capital: '> E£ 3M — Platinum also needs zero complaints and max staff ratio',
    portfolioReq: '> 2 MWp total installed',
    timing: 'Phase 4 — plan 12 months in advance',
    urgency: 'future',
  },
];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const cardStyle = (accent) => ({
  background: C.card, borderRadius: 8,
  border: `1px solid ${C.border}`, borderTop: `3px solid ${accent || C.border}`,
  marginBottom: 12, overflow: 'hidden',
});

const CardHead = ({ label, color, sub }) => (
  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontWeight: 800, fontSize: 13, color: color || C.text }}>{label}</span>
    {sub && <span style={{ fontSize: 10, color: C.muted }}>{sub}</span>}
  </div>
);

const Banner = ({ label, color, icon, note }) => (
  <div style={{ padding: '8px 14px', marginBottom: 12, background: `${color}15`, borderLeft: `4px solid ${color}`, borderRadius: '0 8px 8px 0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <span style={{ fontSize: 16, marginTop: 1 }}>{icon}</span>
    <div>
      <div style={{ fontWeight: 800, fontSize: 13, color }}>{label}</div>
      {note && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{note}</div>}
    </div>
  </div>
);

const KPI = ({ label, value, sub, color, wide }) => (
  <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', flex: wide ? 2 : 1, minWidth: 100 }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: wide ? 14 : 18, fontWeight: 900, color: color || C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color, bg }) => (
  <span style={{ fontSize: 9, fontWeight: 700, color: color || '#fff', background: bg || color || C.muted, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{label}</span>
);

const modeBg = m => m === 'You' ? C.purple : m === 'Hire' ? C.teal : m === 'Retain' ? C.green : m === 'Hire/Retain' ? C.gold : C.muted;

// ─── Panel A: MVT per Phase ───────────────────────────────────────────────────

function MVTPanel({ phase, setPhase }) {
  const ph   = ORG_STRUCTURE[phase];
  const info = PHASES[phase];

  const annPayroll = ph.payroll * 12;
  const annBurn    = ph.burn * 12;

  return (
    <div>
      {/* Phase selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PHASES.map(p => (
          <button key={p.id} onClick={() => setPhase(p.id)}
            style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${p.color}`, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: phase === p.id ? p.color : 'transparent',
              color: phase === p.id ? '#fff' : p.color, transition: 'all .15s' }}>
            {p.icon} {p.label} — {p.name}
          </button>
        ))}
      </div>

      {/* Headline */}
      <div style={{ padding: '12px 16px', marginBottom: 12, background: `${info.color}12`, borderLeft: `4px solid ${info.color}`, borderRadius: '0 8px 8px 0' }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: info.color }}>{ph.headline}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{info.sub}</div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <KPI label="Monthly Payroll"  value={ph.payroll === 0 ? 'E£ 0' : `E£ ${ph.payroll.toLocaleString()}`}   color={C.orange} />
        <KPI label="Annual Payroll"   value={annPayroll === 0 ? '—' : `E£ ${(annPayroll/1000).toFixed(0)}K`}    color={C.red} />
        <KPI label="Total Monthly Burn" value={`E£ ${ph.burn.toLocaleString()}`}  color={C.purple} />
        <KPI label="Headcount (FT)"   value={ph.mvt.filter(r => r.type !== 'owner').length}  color={info.color} />
        <KPI label="Exit Trigger" value="→" sub={ph.trigger} color={info.color} wide />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* MVT — who's in */}
        <div>
          <div style={cardStyle(info.color)}>
            <CardHead label="Minimum Viable Team" color={info.color} sub="Only these people — nothing more" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left',  color: C.muted, fontWeight: 700 }}>Role</th>
                  <th style={{ padding: '6px 8px',  textAlign: 'center',color: C.muted, fontWeight: 700 }}>Mode</th>
                  <th style={{ padding: '6px 12px', textAlign: 'right', color: C.muted, fontWeight: 700 }}>E£/mo</th>
                </tr>
              </thead>
              <tbody>
                {ph.mvt.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#fafbfc' : C.card }}>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{r.role}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{r.note}</div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <Badge label={r.mode} bg={modeBg(r.mode)} />
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', color: r.salary === 0 ? C.muted : C.orange, fontWeight: r.salary === 0 ? 400 : 700 }}>
                      {r.salary === 0 ? '—' : `${r.salary.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Burn note */}
          <div style={{ padding: '10px 14px', background: '#fff7ed', border: `1px solid #fed7aa`, borderRadius: 8, fontSize: 11, color: C.orange, lineHeight: 1.5 }}>
            <strong>Burn: </strong>{ph.burnNote}
          </div>
        </div>

        {/* Right col */}
        <div>
          {/* Outsourced */}
          <div style={{ ...cardStyle(C.teal), marginBottom: 10 }}>
            <CardHead label="Outsource (not hire)" color={C.teal} />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: '5px 12px', textAlign: 'left',  color: C.muted, fontWeight: 700 }}>Function</th>
                  <th style={{ padding: '5px 10px', textAlign: 'right', color: C.muted, fontWeight: 700 }}>Cost</th>
                  <th style={{ padding: '5px 12px', textAlign: 'right', color: C.muted, fontWeight: 700 }}>When</th>
                </tr>
              </thead>
              <tbody>
                {ph.outsourced.map((o, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#fafbfc' : C.card }}>
                    <td style={{ padding: '5px 12px', color: C.text }}>{o.role}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', color: C.teal, fontWeight: 600 }}>{o.cost}</td>
                    <td style={{ padding: '5px 12px', textAlign: 'right', color: C.muted, fontSize: 10 }}>{o.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Do NOT hire */}
          <div style={{ ...cardStyle(C.red) }}>
            <CardHead label="Do NOT hire yet" color={C.red} sub="At this phase" />
            <div style={{ padding: '8px 14px' }}>
              {ph.doNotHire.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                  <span style={{ color: C.red, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: 11, color: C.text }}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NREA note */}
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 8, fontSize: 10, color: C.teal, lineHeight: 1.5 }}>
            <strong style={{ color: C.teal }}>NREA constraint: </strong>{ph.nreaNote}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel B: Hiring Triggers ─────────────────────────────────────────────────

function HiringPanel() {
  const [sel, setSel] = useState(0);
  const t = HIRING_TRIGGERS[sel];

  const phaseColor = p =>
    p.includes('Phase 1') ? C.teal :
    p.includes('Phase 2') ? C.gold : C.green;

  return (
    <div>
      {/* Role picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
        {HIRING_TRIGGERS.map((h, i) => (
          <button key={i} onClick={() => setSel(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${phaseColor(h.phase)}`, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: sel === i ? phaseColor(h.phase) : 'transparent',
              color: sel === i ? '#fff' : phaseColor(h.phase) }}>
            {h.role}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Left: trigger logic */}
        <div>
          <div style={cardStyle(phaseColor(t.phase))}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: phaseColor(t.phase) }}>{t.role}</div>
                <Badge label={t.phase} bg={phaseColor(t.phase)} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>{t.cost}</div>
                <div style={{ fontSize: 9, color: C.muted }}>full-time cost</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>🟢 Hire WHEN</div>
                <div style={{ padding: '8px 12px', background: '#f0fdf4', border: `1px solid #bbf7d0`, borderRadius: 7, fontSize: 11, color: C.green, fontWeight: 600, lineHeight: 1.5 }}>
                  {t.fireWhen}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>🔴 Do NOT hire if</div>
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: `1px solid #fecaca`, borderRadius: 7, fontSize: 11, color: C.red, lineHeight: 1.5 }}>
                  {t.doNotFireWhen}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>💛 Freelance alternative</div>
                <div style={{ padding: '8px 12px', background: '#fffbeb', border: `1px solid #fde68a`, borderRadius: 7, fontSize: 11, color: C.orange, lineHeight: 1.5 }}>
                  {t.freelanceAlternative}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: cost + impact */}
        <div>
          <div style={{ ...cardStyle(C.red), marginBottom: 10 }}>
            <CardHead label="Runway Impact" color={C.red} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, padding: '8px 12px', background: '#fef2f2', borderRadius: 7, border: `1px solid #fecaca` }}>
                {t.runwayImpact}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle(C.teal), marginBottom: 10 }}>
            <CardHead label="NREA Constraint" color={C.teal} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: C.teal, lineHeight: 1.6, padding: '8px 12px', background: '#f0fdf4', borderRadius: 7, border: `1px solid #bbf7d0` }}>
                {t.nreaConstraint}
              </div>
            </div>
          </div>

          <div style={cardStyle(C.orange)}>
            <CardHead label="Hiring Risk" color={C.orange} />
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: C.orange, lineHeight: 1.6, padding: '8px 12px', background: '#fff7ed', borderRadius: 7, border: `1px solid #fed7aa` }}>
                {t.risk}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel C: Runway Calculator ───────────────────────────────────────────────

function RunwayPanel() {
  const [capital, setCapital]       = useState(2000000);
  const [revenue, setRevenue]       = useState(0);
  const [scenario, setScenario]     = useState(0);

  const sc         = RUNWAY_SCENARIOS[scenario];
  const totalBurn  = sc.payroll + sc.outsourced + sc.overhead;
  const netBurn    = Math.max(0, totalBurn - revenue);
  const runwayMos  = netBurn > 0 ? Math.floor(capital / netBurn) : 999;
  const runwayOk   = runwayMos >= 12;

  const hireCostRows = [
    { role: 'Senior Engineer',    monthly: 18000, annual: 216000, breakeven: 'E£ 80–120K contract revenue/mo' },
    { role: 'Technician',         monthly:  7000, annual:  84000, breakeven: '~10 site-days/mo @ E£ 800/day' },
    { role: 'Sales Executive',    monthly:  8000, annual:  96000, breakeven: '1 residential deal/mo at avg margin' },
    { role: 'Admin / Finance',    monthly:  6000, annual:  72000, breakeven: 'Saves ~40 founder hrs/mo — worth at E£ 300K+ invoicing' },
    { role: 'Project Manager',    monthly: 25000, annual: 300000, breakeven: '3+ concurrent projects generating margin' },
    { role: 'Compliance Officer', monthly: 12000, annual: 144000, breakeven: 'Protects NREA cert + tender eligibility' },
  ];

  return (
    <div>
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={cardStyle(C.gold)}>
          <CardHead label="Available Capital" color={C.gold} />
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.gold, marginBottom: 8 }}>E£ {capital.toLocaleString()}</div>
            <input type="range" min={500000} max={10000000} step={100000} value={capital}
              onChange={e => setCapital(+e.target.value)}
              style={{ width: '100%', accentColor: C.gold }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.muted }}>
              <span>500K</span><span>2M</span><span>5M</span><span>10M</span>
            </div>
          </div>
        </div>

        <div style={cardStyle(C.green)}>
          <CardHead label="Monthly Revenue" color={C.green} />
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.green, marginBottom: 8 }}>E£ {revenue.toLocaleString()}</div>
            <input type="range" min={0} max={1500000} step={10000} value={revenue}
              onChange={e => setRevenue(+e.target.value)}
              style={{ width: '100%', accentColor: C.green }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.muted }}>
              <span>0</span><span>150K</span><span>500K</span><span>1M</span><span>1.5M</span>
            </div>
          </div>
        </div>

        <div style={cardStyle(C.purple)}>
          <CardHead label="Team Scenario" color={C.purple} />
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RUNWAY_SCENARIOS.map((s, i) => (
              <button key={i} onClick={() => setScenario(i)}
                style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11, fontWeight: 600,
                  background: scenario === i ? C.purple : '#f0f2f5',
                  color: scenario === i ? '#fff' : C.muted }}>
                {s.label}
                <span style={{ fontSize: 9, marginLeft: 6, opacity: .7 }}>E£ {(s.payroll+s.outsourced+s.overhead).toLocaleString()}/mo burn</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runway result */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <KPI label="Monthly Payroll"  value={`E£ ${sc.payroll.toLocaleString()}`}         color={C.orange} />
        <KPI label="Outsourced Costs" value={`E£ ${sc.outsourced.toLocaleString()}`}      color={C.teal} />
        <KPI label="Overhead"         value={`E£ ${sc.overhead.toLocaleString()}`}        color={C.muted} />
        <KPI label="Total Monthly Burn" value={`E£ ${totalBurn.toLocaleString()}`}        color={C.red} />
        <KPI label="Net Monthly Burn" value={netBurn > 0 ? `E£ ${netBurn.toLocaleString()}` : 'Cash positive'} color={netBurn > 0 ? C.red : C.green} />
        <KPI label="Runway"
          value={runwayMos >= 999 ? '∞' : `${runwayMos} months`}
          color={runwayOk ? C.green : C.red}
          sub={runwayMos < 6 ? '⚠ Critical — reduce team or raise capital' : runwayMos < 12 ? 'Tight — need revenue soon' : 'Healthy'} />
      </div>

      {/* Hire cost table */}
      <div style={cardStyle(C.navy)}>
        <CardHead label="Cost of Each Hire — Break-even Reference" color={C.navy} />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: C.navy, color: '#fff' }}>
              <th style={{ padding: '7px 14px', textAlign: 'left',  fontWeight: 700 }}>Role</th>
              <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>Monthly Cost</th>
              <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>Annual Cost</th>
              <th style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 700 }}>Break-even Condition</th>
            </tr>
          </thead>
          <tbody>
            {hireCostRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#f8fafc' : C.card }}>
                <td style={{ padding: '6px 14px', fontWeight: 600, color: C.text }}>{r.role}</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', color: C.orange, fontWeight: 700 }}>E£ {r.monthly.toLocaleString()}</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', color: C.red }}>E£ {r.annual.toLocaleString()}</td>
                <td style={{ padding: '6px 14px', textAlign: 'right', color: C.muted }}>{r.breakeven}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted }}>
          Add 18.75% employer social insurance on top of all salary figures for true labour cost.
        </div>
      </div>
    </div>
  );
}

// ─── Panel D: NREA as Constraint ─────────────────────────────────────────────

function NREAConstraintPanel() {
  return (
    <div>
      <div style={{ padding: '10px 14px', marginBottom: 14, background: '#fffbeb', border: `1px solid #fde68a`, borderRadius: 8, fontSize: 11, color: C.orange, lineHeight: 1.6 }}>
        <strong>How to read this: </strong>NREA classification is a <em>constraint</em> — it must be met to operate legally,
        but it does not drive your hiring decisions. Revenue and pipeline drive hiring.
        NREA filing happens <em>after</em> the business conditions are already met.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {NREA_CONSTRAINTS.map((n, i) => {
          const col = n.urgency === 'medium' ? C.teal : n.urgency === 'low' ? C.muted : n.urgency === 'future' ? C.purple : C.gold;
          const urgencyLabel = n.urgency === 'medium' ? 'File Soon' : n.urgency === 'low' ? 'Not Yet' : n.urgency === 'future' ? 'Plan Ahead' : 'Now';
          return (
            <div key={i} style={cardStyle(col)}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: col }}>NREA {n.tier}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Badge label={`Score ${n.score}`} bg={col} />
                  <Badge label={urgencyLabel} bg={n.urgency === 'medium' ? C.green : n.urgency === 'future' ? C.purple : '#94a3b8'} />
                  <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>E£ {n.fee.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ padding: '10px 14px' }}>
                {[
                  { label: 'File when', value: n.when },
                  { label: 'Min staff', value: n.minStaff },
                  { label: 'Capital score', value: n.capital },
                  { label: 'Portfolio', value: n.portfolioReq },
                  { label: 'Timing', value: n.timing },
                ].map(({ label, value }, j) => (
                  <div key={j} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label} </span>
                    <span style={{ fontSize: 11, color: C.text }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Panel E: Scaling Triggers ────────────────────────────────────────────────

function ScalingTriggersPanel() {
  const triggers = [
    {
      from: 'Phase 0 → Phase 1',
      color: C.teal,
      icon: '🎯',
      fire: [
        'First contract signed (not a verbal, not a proposal)',
        'OR pipeline > E£ 500K in qualified leads with meeting completed',
      ],
      hires: ['Senior Engineer (on contract signature)', 'Technicians ×2 (on installation date confirmation)'],
      doNot: ['Do not hire based on pipeline alone'],
      capitalNeeded: 'E£ 2M+ for NREA capital score. Have 6–9 months of burn covered before this hire.',
    },
    {
      from: 'Phase 1 → Phase 2',
      color: C.gold,
      icon: '📈',
      fire: [
        '3 contracts signed in the same quarter',
        'OR monthly revenue ≥ E£ 150K for 2 consecutive months',
        'OR 2 projects running simultaneously',
      ],
      hires: ['Junior Engineer (2nd concurrent project confirmed)', 'Sales Executive (founder cannot manage > 10 leads)', 'Admin/Finance (invoicing > 1 day/week of founder time)'],
      doNot: ['Do not hire PM yet — 1–2 projects is founder + senior engineer territory'],
      capitalNeeded: 'Revenue should self-fund Phase 2 hires. If not — reconsider the hire.',
    },
    {
      from: 'Phase 2 → Phase 3',
      color: C.green,
      icon: '🚀',
      fire: [
        '8+ projects delivered with positive cash margin',
        'OR annual revenue > E£ 3M confirmed',
        'OR first C&I deal > 50 kW closed',
        'OR 3+ projects simultaneously stressing founder bandwidth',
      ],
      hires: ['Project Manager (3+ simultaneous sites confirmed)', 'Second Senior Engineer (Gold NREA target)', 'Procurement Officer (monthly equipment spend > E£ 300K)', 'Finance Manager (monthly invoicing > E£ 500K)'],
      doNot: ['Do not scale team before revenue confirms it', 'Do not hire Sales Manager until Sales Director is unjustifiable overhead'],
      capitalNeeded: 'Phase 3 hires must be covered by project margin — not initial capital.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {triggers.map((t, i) => (
        <div key={i} style={cardStyle(t.color)}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontWeight: 900, fontSize: 14, color: t.color }}>{t.from}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🟢 Fire when</div>
              {t.fire.map((f, j) => (
                <div key={j} style={{ marginBottom: 5, padding: '5px 8px', background: `${t.color}10`, borderLeft: `2px solid ${t.color}`, borderRadius: '0 5px 5px 0', fontSize: 11, color: C.text, lineHeight: 1.5 }}>{f}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Hires unlocked</div>
              {t.hires.map((h, j) => (
                <div key={j} style={{ marginBottom: 5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: t.color, fontWeight: 900, flexShrink: 0 }}>+</span>
                  <span style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>🔴 Still do NOT hire</div>
              {t.doNot.map((d, j) => (
                <div key={j} style={{ marginBottom: 5, fontSize: 11, color: C.red, lineHeight: 1.5 }}>✕ {d}</div>
              ))}
              <div style={{ marginTop: 10, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Capital</div>
              <div style={{ fontSize: 10, color: C.orange, lineHeight: 1.5 }}>{t.capitalNeeded}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrgScalingView() {
  const [panel, setPanel]     = useState('mvt');
  const [phase,  setPhase]    = useState(0);

  const subPanels = [
    { id: 'mvt',      label: '🏢 Team per Phase'    },
    { id: 'hiring',   label: '⚡ Hiring Triggers'   },
    { id: 'runway',   label: '💰 Runway Calculator' },
    { id: 'nrea',     label: '📋 NREA Constraints'  },
    { id: 'scaling',  label: '🚀 Scaling Triggers'  },
  ];

  const bannerConfig = {
    mvt:     { label: 'Minimum Viable Team — Phase by Phase',                      color: C.teal,   icon: '🏢', note: 'No revenue = no full-time hires. Outsource everything until cash flows.' },
    hiring:  { label: 'Trigger-Based Hiring — Revenue First',                      color: C.green,  icon: '⚡', note: 'Every hire has a fire condition, a freelance fallback, and a runway impact.' },
    runway:  { label: 'Runway Calculator — Cost of Each Hire',                     color: C.red,    icon: '💰', note: 'Adjust capital, revenue and team scenario. Runway updates live.' },
    nrea:    { label: 'NREA as Constraint — Not a Driver',                         color: C.teal,   icon: '📋', note: 'File for certification after business conditions are met. Do not let compliance drive your org.' },
    scaling: { label: 'Scaling Triggers — When to Move Phase',                     color: C.green,  icon: '🚀', note: 'Each phase transition requires confirmed revenue conditions — not just intent.' },
  };

  const b = bannerConfig[panel];

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', padding: '10px 14px', background: C.navy, borderRadius: 8, alignItems: 'center' }}>
        <div style={{ width: '100%', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>🏗 Organization & Scaling</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginLeft: 10 }}>Revenue-driven · Survival-focused · NREA as constraint</span>
        </div>
        {subPanels.map(p => (
          <button key={p.id} onClick={() => setPanel(p.id)}
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all .15s',
              background: panel === p.id ? C.gold : 'rgba(255,255,255,.08)',
              color: panel === p.id ? C.navy : 'rgba(255,255,255,.55)' }}>
            {p.label}
          </button>
        ))}
      </div>

      <Banner label={b.label} color={b.color} icon={b.icon} note={b.note} />

      {panel === 'mvt'     && <MVTPanel phase={phase} setPhase={setPhase} />}
      {panel === 'hiring'  && <HiringPanel />}
      {panel === 'runway'  && <RunwayPanel />}
      {panel === 'nrea'    && <NREAConstraintPanel />}
      {panel === 'scaling' && <ScalingTriggersPanel />}
    </div>
  );
}
