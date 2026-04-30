import { useState, useMemo } from 'react';

// ─── Palette (matches existing dark-on-light app theme) ───────────────────────
const C = {
  gold:    '#C8991A',
  navy:    '#0D2137',
  bg:      '#f0f2f5',
  card:    '#ffffff',
  border:  '#e2e8f0',
  text:    '#1a1a1a',
  muted:   '#64748b',
  green:   '#1E7E34',
  red:     '#C0392B',
  orange:  '#D4770A',
  purple:  '#5C2D91',
  teal:    '#1A6B72',
  bronze:  '#cd7f32',
  silver:  '#94a3b8',
  yellow:  '#D4770A',
  platinum:'#7c3aed',
};

// ─── Static data ──────────────────────────────────────────────────────────────

const PHASES = [
  { id: 0, label: 'Phase 0', name: 'Pre-Registration', color: C.muted,    icon: '📋' },
  { id: 1, label: 'Phase 1', name: 'Bronze',           color: C.bronze,   icon: '🥉' },
  { id: 2, label: 'Phase 2', name: 'Silver',           color: C.silver,   icon: '🥈' },
  { id: 3, label: 'Phase 3', name: 'Gold',             color: C.gold,     icon: '🥇' },
  { id: 4, label: 'Phase 4', name: 'Platinum',         color: C.platinum, icon: '💎' },
];

const ORG_STRUCTURE = [
  {
    phase: 0,
    required: [
      { role: 'Founder / Managing Director',  count: 1, type: 'owner',    salary: 0 },
      { role: 'Legal / Formation Advisor',    count: 1, type: 'contract', salary: 5000 },
    ],
    optional: [],
    outsourced: ['Accountant (CPA)', 'Legal Counsel', 'Company Formation Agent'],
    headcount: 1,
    payroll: 0,
    note: 'SAE formation, commercial registry, tax card, social insurance account. No revenue yet.',
  },
  {
    phase: 1,
    required: [
      { role: 'Managing Director',            count: 1, type: 'owner',    salary: 0     },
      { role: 'Senior Engineer (Syndicate)',  count: 1, type: 'fulltime', salary: 18000 },
      { role: 'Junior Engineer',              count: 1, type: 'fulltime', salary: 10000 },
      { role: 'Technician (Diploma, Elec)',   count: 2, type: 'fulltime', salary: 7000  },
      { role: 'Sales / BD Executive',         count: 1, type: 'fulltime', salary: 8000  },
      { role: 'Admin / Finance Officer',      count: 1, type: 'fulltime', salary: 6000  },
    ],
    optional: [
      { role: 'O&M Technician (part-time)', note: 'only if O&M contracts signed' },
    ],
    outsourced: ['CPA / Auditor', 'Legal Counsel'],
    headcount: 6,
    payroll: 56000,
    note: 'NREA Bronze minimum: 1 engineer + 2 technicians, all on social insurance, all syndicate-registered.',
  },
  {
    phase: 2,
    required: [
      { role: 'Managing Director',              count: 1, type: 'owner',    salary: 0     },
      { role: 'Project Manager',                count: 1, type: 'fulltime', salary: 25000 },
      { role: 'Senior Engineer (Consultant)',   count: 1, type: 'fulltime', salary: 22000 },
      { role: 'Mid-Level Engineer',             count: 2, type: 'fulltime', salary: 14000 },
      { role: 'Junior Engineer',                count: 1, type: 'fulltime', salary: 10000 },
      { role: 'Technician (Diploma)',           count: 4, type: 'fulltime', salary: 7500  },
      { role: 'Sales Manager',                  count: 1, type: 'fulltime', salary: 18000 },
      { role: 'Sales Executive',                count: 2, type: 'fulltime', salary: 8000  },
      { role: 'Procurement Officer',            count: 1, type: 'fulltime', salary: 10000 },
      { role: 'Finance Manager',                count: 1, type: 'fulltime', salary: 15000 },
      { role: 'Admin Assistant',                count: 1, type: 'fulltime', salary: 6000  },
    ],
    optional: [
      { role: 'O&M Engineer', note: 'when O&M portfolio > 200 kW' },
      { role: 'Compliance Officer (part-time)', note: 'when NREA renewal approaching' },
    ],
    outsourced: ['CPA / Auditor', 'IT Support'],
    headcount: 14,
    payroll: 175000,
    note: 'Silver requires broader portfolio and improved permanent-to-temp staff ratio.',
  },
  {
    phase: 3,
    required: [
      { role: 'CEO / Managing Director',        count: 1, type: 'owner',    salary: 0     },
      { role: 'COO / Operations Director',      count: 1, type: 'fulltime', salary: 40000 },
      { role: 'Head of Engineering',            count: 1, type: 'fulltime', salary: 35000 },
      { role: 'Project Manager',                count: 2, type: 'fulltime', salary: 28000 },
      { role: 'Senior Consultant Engineer',     count: 2, type: 'fulltime', salary: 22000 },
      { role: 'Mid-Level Engineer',             count: 3, type: 'fulltime', salary: 15000 },
      { role: 'Junior Engineer',                count: 2, type: 'fulltime', salary: 10000 },
      { role: 'O&M Engineer',                   count: 1, type: 'fulltime', salary: 16000 },
      { role: 'Technician (Diploma)',           count: 8, type: 'fulltime', salary: 8000  },
      { role: 'Sales Director',                 count: 1, type: 'fulltime', salary: 35000 },
      { role: 'Sales Manager (Residential)',    count: 1, type: 'fulltime', salary: 20000 },
      { role: 'Sales Manager (C&I)',            count: 1, type: 'fulltime', salary: 20000 },
      { role: 'Sales Executive',                count: 3, type: 'fulltime', salary: 9000  },
      { role: 'Procurement Manager',            count: 1, type: 'fulltime', salary: 18000 },
      { role: 'Warehouse / Logistics',          count: 2, type: 'fulltime', salary: 8000  },
      { role: 'Finance Manager',                count: 1, type: 'fulltime', salary: 18000 },
      { role: 'Compliance Officer',             count: 1, type: 'fulltime', salary: 12000 },
      { role: 'Admin / HR Manager',             count: 1, type: 'fulltime', salary: 10000 },
    ],
    optional: [
      { role: 'Govt Tender Specialist', note: 'when targeting NREA/EETC tenders' },
      { role: 'Structural Engineer (contract)', note: 'per large rooftop project' },
    ],
    outsourced: ['CPA / Auditor', 'Legal Counsel (tender support)'],
    headcount: 32,
    payroll: 430000,
    note: 'Gold: portfolio > 500 kW, largest single station > 100 kW, consultant-grade engineers mandatory.',
  },
  {
    phase: 4,
    required: [
      { role: 'CEO',                            count: 1, type: 'owner',    salary: 0     },
      { role: 'COO',                            count: 1, type: 'fulltime', salary: 50000 },
      { role: 'CFO',                            count: 1, type: 'fulltime', salary: 45000 },
      { role: 'CTO / Head of Engineering',      count: 1, type: 'fulltime', salary: 45000 },
      { role: 'Project Director',               count: 1, type: 'fulltime', salary: 40000 },
      { role: 'Project Manager',                count: 3, type: 'fulltime', salary: 30000 },
      { role: 'Senior Consultant Engineer',     count: 3, type: 'fulltime', salary: 25000 },
      { role: 'Mid-Level Engineer',             count: 5, type: 'fulltime', salary: 16000 },
      { role: 'Junior Engineer',                count: 4, type: 'fulltime', salary: 11000 },
      { role: 'O&M Manager',                    count: 1, type: 'fulltime', salary: 22000 },
      { role: 'O&M Engineer',                   count: 2, type: 'fulltime', salary: 16000 },
      { role: 'Technician (Diploma)',           count: 14, type: 'fulltime', salary: 8500 },
      { role: 'Sales Director',                 count: 1, type: 'fulltime', salary: 40000 },
      { role: 'Sales Manager (Res/C&I/Gov)',    count: 3, type: 'fulltime', salary: 22000 },
      { role: 'Sales Executive',                count: 5, type: 'fulltime', salary: 10000 },
      { role: 'Procurement Director',           count: 1, type: 'fulltime', salary: 25000 },
      { role: 'Procurement Officer',            count: 2, type: 'fulltime', salary: 12000 },
      { role: 'Warehouse Manager',              count: 1, type: 'fulltime', salary: 14000 },
      { role: 'Logistics / Store',              count: 3, type: 'fulltime', salary: 9000  },
      { role: 'Finance Director',               count: 1, type: 'fulltime', salary: 35000 },
      { role: 'Accountant',                     count: 2, type: 'fulltime', salary: 12000 },
      { role: 'Compliance Manager',             count: 1, type: 'fulltime', salary: 18000 },
      { role: 'HR Manager',                     count: 1, type: 'fulltime', salary: 15000 },
      { role: 'IT / Systems',                   count: 1, type: 'fulltime', salary: 14000 },
    ],
    optional: [],
    outsourced: ['External Legal Counsel (IPO prep)', 'Big 4 Audit (investor-grade)'],
    headcount: 58,
    payroll: 870000,
    note: 'Platinum: score > 75, zero complaints, max capital, 100% permanent staff ratio.',
  },
];

const HIRING_TRIGGERS = [
  {
    transition: '0 → 1  (Bronze)',
    color: C.bronze,
    triggers: [
      {
        role: 'Senior Engineer (Syndicate)',
        when: ['SAE registration complete', 'NREA application submitted'],
        why: 'NREA Bronze minimum: 1 registered engineer. Without Syndicate card, no certificate issued.',
        cost: 'E£ 18,000/mo',
        channel: 'LinkedIn, Engineers Syndicate job board',
        risk: 'HIGH — compliance dependency. Wrong hire = lost NREA application.',
        fallback: 'Contract consultant temporarily; must convert to permanent before cert issuance.',
      },
      {
        role: 'Technician × 2 (Diploma, Elec)',
        when: ['First 2 feasibility studies sold', 'OR NREA application date set'],
        why: 'NREA Bronze minimum staffing. Also required to execute first installations.',
        cost: 'E£ 7,000/mo each',
        channel: 'Technical institutes (Cairo/Giza), engineer referrals',
        risk: 'MEDIUM — easier to replace than engineers.',
        fallback: 'Subcontract site crew per project; declare as temporary staff in NREA file.',
      },
      {
        role: 'Sales / BD Executive',
        when: ['Company registered', 'First 3 prospect meetings completed by founder'],
        why: '90-day sales cycle needs a dedicated resource. Revenue cannot depend on founder alone.',
        cost: 'E£ 8,000/mo + commission',
        channel: 'LinkedIn, solar industry events',
        risk: 'MEDIUM — high turnover in sales. Hire on 3-month probation.',
        fallback: 'Founder covers sales until pipeline > 5 active leads.',
      },
    ],
  },
  {
    transition: '1 → 2  (Silver)',
    color: C.silver,
    triggers: [
      {
        role: 'Project Manager',
        when: ['Pipeline ≥ 3 concurrent projects', 'OR Revenue ≥ E£ 2M/yr'],
        why: 'Founder + engineer cannot manage 3+ sites. Delays → client complaints → NREA score hit.',
        cost: 'E£ 25,000/mo',
        channel: 'LinkedIn, EPC industry network',
        risk: 'HIGH — wrong PM = project delays = NREA complaint risk.',
        fallback: 'Senior Engineer takes PM role for max 1 project.',
      },
      {
        role: 'Mid-Level Engineer × 2',
        when: ['Portfolio ≥ 100 kW installed', 'OR targeting Silver classification'],
        why: 'Silver requires expanded staffing ratio. Needed for parallel design on concurrent projects.',
        cost: 'E£ 14,000/mo each',
        channel: 'Engineers Syndicate, university engineering job fairs',
        risk: 'MEDIUM.',
        fallback: 'Subcontract design to consultant firm per project.',
      },
      {
        role: 'Procurement Officer',
        when: ['Monthly procurement spend ≥ E£ 200K', 'OR ≥ 4 projects/yr'],
        why: 'Prevents supply chain delays and price volatility without a dedicated buyer.',
        cost: 'E£ 10,000/mo',
        channel: 'Import/export sector, LinkedIn',
        risk: 'LOW — process-driven role, easier to onboard.',
        fallback: 'Finance Manager covers procurement at lower volume.',
      },
      {
        role: 'Sales Manager',
        when: ['Sales team ≥ 2 executives', 'OR monthly inbound leads > 10'],
        why: 'Unmanaged team loses conversion rate. Silver revenue targets need structured pipeline.',
        cost: 'E£ 18,000/mo + OTE',
        channel: 'Solar industry, sales management background',
        risk: 'HIGH — culture setter for the commercial team.',
        fallback: 'MD retains sales management until team size justifies hire.',
      },
    ],
  },
  {
    transition: '2 → 3  (Gold)',
    color: C.gold,
    triggers: [
      {
        role: 'O&M Engineer',
        when: ['O&M portfolio > 200 kW under contract', 'OR 10+ systems in warranty period'],
        why: 'O&M is recurring revenue. Dedicated engineer protects margin and prevents contract churn.',
        cost: 'E£ 16,000/mo',
        channel: 'Field engineering background; SCADA/monitoring experience preferred',
        risk: 'MEDIUM.',
        fallback: 'Assign Junior Engineer to O&M until headcount justified.',
      },
      {
        role: 'Senior Consultant Engineer × 2',
        when: ['Targeting NREA Gold', 'OR largest single station > 100 kW designed'],
        why: 'Gold requires consultant-grade engineers (Syndicate consultant reg or MSc/PhD in PV). Hard rule.',
        cost: 'E£ 22,000/mo each',
        channel: 'Engineers Syndicate consultant database, Cairo University / AUC faculty',
        risk: 'VERY HIGH — scarce profile. Recruit 3–6 months before Gold application.',
        fallback: 'None. Hard NREA requirement for Gold certificate.',
      },
      {
        role: 'Compliance Officer',
        when: ['NREA renewal within 6 months', 'OR government tender pipeline active'],
        why: 'NREA bi-annual reports (Jan + Jul) have zero grace period. Missing = certificate cancellation.',
        cost: 'E£ 12,000/mo',
        channel: 'NREA / EgyptERA / utilities regulatory background',
        risk: 'HIGH — compliance failure blocks all revenue.',
        fallback: 'PM covers compliance as interim — high risk, temporary only.',
      },
      {
        role: 'Sales Director',
        when: ['Annual revenue ≥ E£ 10M', 'OR C&I + government tender pipeline active'],
        why: 'Gold requires large C&I (>100 kW) and government tenders — needs senior commercial leadership.',
        cost: 'E£ 35,000/mo + OTE',
        channel: 'C&I energy sector, EPC/developer background preferred',
        risk: 'VERY HIGH — defines whether Gold revenues materialise.',
        fallback: 'MD covers until revenue justifies hire.',
      },
    ],
  },
  {
    transition: '3 → 4  (Platinum)',
    color: C.platinum,
    triggers: [
      {
        role: 'CFO',
        when: ['Revenue ≥ E£ 30M/yr', 'OR investor round planned', 'OR IPO/exit preparation'],
        why: 'Platinum companies require investor-grade financials and audited accounts.',
        cost: 'E£ 45,000/mo',
        channel: 'Big 4 alumni, energy sector CFO network',
        risk: 'EXISTENTIAL if wrong hire during investor process.',
        fallback: 'Finance Director acts as CFO up to Series A.',
      },
      {
        role: 'O&M Manager + O&M Engineer × 2',
        when: ['O&M portfolio > 1 MW', 'OR recurring O&M revenue > E£ 2M/yr'],
        why: 'At Platinum scale, O&M is a standalone business unit requiring dedicated management.',
        cost: 'E£ 54,000/mo combined',
        channel: 'Field engineering + SCADA + substation experience',
        risk: 'MEDIUM — known profiles in the market.',
        fallback: 'None at this scale — SLA breaches destroy Platinum NREA score.',
      },
      {
        role: 'Full Technician bench (14 total)',
        when: ['Concurrent projects > 5', 'OR deployed capacity > 2 MWp/yr'],
        why: 'Platinum scoring penalises low permanent-to-temp ratios. Must have permanent field crew.',
        cost: 'E£ 8,500/mo × 14 = E£ 119K/mo',
        channel: 'Technical institutes, TVET-Egypt, convert existing temp staff',
        risk: 'LOW individually; HIGH collectively if poorly managed.',
        fallback: 'Continue subcontracting but present conversion plan to NREA during certification.',
      },
    ],
  },
];

const NREA_SCORING = {
  capital:       { label: 'Paid-up Capital',                  weight: 25 },
  portfolio:     { label: 'Total Portfolio Installed (kW)',    weight: 20 },
  singleStation: { label: 'Largest Single Station (kW)',       weight: 10 },
  staff:         { label: 'Staff headcount vs. projects',      weight: 15 },
  permTemp:      { label: 'Permanent / Temporary ratio',       weight: 15 },
  complaints:    { label: 'Client complaints (at renewal)',    weight: 10 },
};

const TIER_THRESHOLDS = [
  { tier: 'Platinum', min: 75, color: C.platinum, fee: 30000 },
  { tier: 'Gold',     min: 65, color: C.gold,     fee: 20000 },
  { tier: 'Silver',   min: 55, color: C.silver,   fee: 10000 },
  { tier: 'Bronze',   min:  0, color: C.bronze,   fee:  5000 },
];

const JOB_DESCRIPTIONS = [
  {
    title: 'Expert / Consultant Engineer',
    nreaLevel: 'Consultant',
    nreaRequired: true,
    phase: 'Silver → Platinum',
    qualifications: 'BSc Elec/Mech Engineering + Syndicate consultant registration OR MSc/PhD in PV-related field',
    certifications: ['Engineers\' Syndicate — Consultant Grade', 'Optional: NABCEP, IEC 62446'],
    experience: 'Min 2 yrs designing, building, installing & testing PV systems ≥ 5 MWp cumulative (all voltage levels)',
    responsibilities: [
      'Lead system design for all project sizes',
      'Sign and stamp engineering drawings (NREA requirement)',
      'Technical review and approval of BOM',
      'DISCO grid connection approval package',
      'NREA compliance signatory',
    ],
  },
  {
    title: 'Mid-Level Engineer',
    nreaLevel: 'Mid',
    nreaRequired: true,
    phase: 'Silver+',
    qualifications: 'BSc Elec/Mech Engineering + Engineers\' Syndicate member',
    certifications: ['Engineers\' Syndicate membership'],
    experience: 'Distribution systems experience + min 2 yrs PV installation/testing ≥ 50 kW cumulative',
    responsibilities: [
      'System design for residential and small C&I (<50 kW)',
      'Site survey and technical assessment',
      'BOM preparation and supplier coordination',
      'Site supervision during installation',
      'PVGIS / simulation software operation',
    ],
  },
  {
    title: 'Junior Engineer',
    nreaLevel: 'Junior',
    nreaRequired: true,
    phase: 'Bronze+',
    qualifications: 'BSc Elec/Mech Engineering + Engineers\' Syndicate membership',
    certifications: ['Engineers\' Syndicate membership'],
    experience: 'Basic electrical distribution + min 1 yr PV installation ≥ 1 MWp cumulative',
    responsibilities: [
      'Design support and drawing preparation',
      'Site survey data collection',
      'BOM quantity take-off',
      'As-built documentation',
      'Client training on system operation',
    ],
  },
  {
    title: 'Technician (Field)',
    nreaLevel: 'Technician',
    nreaRequired: true,
    phase: 'Bronze+',
    qualifications: 'Diploma in Electrical Engineering — accredited by Ministry of Higher Education',
    certifications: ['Social insurance enrollment (mandatory for NREA scoring)'],
    experience: 'Basic LV electrical installations + min 3 yrs PV installation ≥ 50 kW cumulative',
    responsibilities: [
      'Panel mounting and racking installation',
      'DC wiring and string connections',
      'AC panel connections under engineer supervision',
      'Commissioning support and testing',
      'Periodic O&M inspections',
    ],
  },
  {
    title: 'Project Manager',
    nreaLevel: 'Management',
    nreaRequired: false,
    phase: 'Silver+',
    qualifications: 'Engineering or Business degree; PMP preferred',
    certifications: ['PMP or Prince2 preferred'],
    experience: '3+ yrs EPC project management, solar or electrical construction preferred',
    responsibilities: [
      'Project scheduling (CPM baseline) and progress tracking',
      'Subcontractor management and site coordination',
      'Client communication and milestone sign-off',
      'Risk and issue log management',
      'NREA project documentation package',
    ],
  },
  {
    title: 'O&M Engineer',
    nreaLevel: 'O&M',
    nreaRequired: false,
    phase: 'Gold+',
    qualifications: 'BSc Electrical Engineering + Engineers\' Syndicate membership',
    certifications: ['Engineers\' Syndicate', 'SCADA platform certification preferred'],
    experience: '2+ yrs field maintenance, solar PV experience required',
    responsibilities: [
      'Preventive and corrective maintenance scheduling',
      'Performance monitoring via SCADA / inverter portal',
      'Fault diagnosis and component replacement',
      'Annual performance reporting to clients',
      'NREA bi-annual report contribution',
    ],
  },
];

const RISKS = [
  {
    type: 'Over-Hiring',
    sev: 'orange',
    scenarios: [
      'Hiring Sales Manager before pipeline > 10 leads/month — burns payroll with no leverage',
      'Hiring full Platinum technician bench (14 people) while still at Silver revenue — E£ 120K/mo fixed',
      'Hiring COO at Phase 1/2 — management overhead exceeds decision velocity',
    ],
    mitigation: 'Strict trigger-based hiring. No hire without a documented pipeline or revenue threshold being met first.',
  },
  {
    type: 'Under-Hiring',
    sev: 'red',
    scenarios: [
      'Delaying Compliance Officer → missed NREA bi-annual report (Jan/Jul) → certificate cancellation',
      'Delaying second engineer → single point of failure during site execution → delays → complaints',
      'No dedicated PM at 3+ concurrent projects → quality failures → NREA complaint score penalised',
    ],
    mitigation: 'Pre-hire compliance roles 3 months before trigger. Never run single-engineer model past Phase 1.',
  },
  {
    type: 'Compliance Failure',
    sev: 'red',
    scenarios: [
      'NREA bi-annual report missed (Jan week 1 or Jul week 1) — automatic certificate cancellation, no grace period',
      'Non-IEC-certified equipment installed (IEC 61215 / IEC 61730) — cancellation + 6-month re-application ban',
      'Engineer leaves without replacement within 10 days — NREA considers staffing requirement unmet',
    ],
    mitigation: 'Compliance calendar hardcoded in system. IEC certs mandatory in procurement checklist. Engineer exit protocol: recruit before departure.',
  },
  {
    type: 'Key-Person Dependency',
    sev: 'orange',
    scenarios: [
      'Phase 0–1: all technical, commercial and compliance knowledge in founder = single point of failure',
      'Single Senior Engineer at Bronze holds NREA certificate standing — departure puts certificate at risk',
      'Single sales executive at Bronze = revenue cliff if they leave mid-pipeline',
    ],
    mitigation: 'Never sole-source critical roles. Cross-train technicians on documentation at Phase 1. Hire second engineer at start of Phase 2.',
  },
];

// ─── Shared components ────────────────────────────────────────────────────────

const card = (accentColor) => ({
  background: C.card,
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  borderTop: `3px solid ${accentColor || C.border}`,
  marginBottom: 12,
  overflow: 'hidden',
});

const CardHeader = ({ label, color, sub }) => (
  <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontWeight: 800, fontSize: 13, color: color || C.text }}>{label}</span>
    {sub && <span style={{ fontSize: 10, color: C.muted }}>{sub}</span>}
  </div>
);

const SectionBanner = ({ label, color, icon, note }) => (
  <div style={{ padding: '8px 14px', marginBottom: 12, background: `${color}15`, borderLeft: `4px solid ${color}`, borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <div>
      <div style={{ color, fontWeight: 800, fontSize: 13 }}>{label}</div>
      {note && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{note}</div>}
    </div>
  </div>
);

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: '#f8fafc', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 100 }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 900, color: color || C.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const typeColor = t =>
  t === 'owner'    ? C.gold   :
  t === 'fulltime' ? C.green  :
  t === 'contract' ? C.orange : C.muted;

const typeLabel = t =>
  t === 'owner'    ? 'Owner'    :
  t === 'fulltime' ? 'Full-time' :
  t === 'contract' ? 'Contract' : t;

const riskColor = s => s === 'red' ? C.red : C.orange;

// ─── Panel A: Org Structure ───────────────────────────────────────────────────

function OrgStructurePanel({ currentPhase, setCurrentPhase }) {
  const ph   = ORG_STRUCTURE[currentPhase];
  const info = PHASES[currentPhase];
  const nextPh = ORG_STRUCTURE[currentPhase + 1];
  const newHires = nextPh
    ? nextPh.required.filter(nr => !ph.required.some(r => r.role === nr.role))
    : [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PHASES.map(p => (
          <button key={p.id} onClick={() => setCurrentPhase(p.id)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${p.color}`, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: currentPhase === p.id ? p.color : 'transparent',
              color: currentPhase === p.id ? '#fff' : p.color, transition: 'all .15s' }}>
            {p.icon} {p.label} — {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <KPI label="Headcount"        value={ph.headcount}                                  color={info.color} />
        <KPI label="Monthly Payroll"  value={ph.payroll === 0 ? 'E£ 0' : `E£ ${(ph.payroll/1000).toFixed(0)}K`} color={C.orange} />
        <KPI label="Annual Payroll"   value={ph.payroll === 0 ? '—' : `E£ ${(ph.payroll*12/1000).toFixed(0)}K`} color={C.red} />
        <KPI label="NREA Tier"        value={info.name}                                     color={info.color} />
        <KPI label="Revenue % (est.)" value={['—','45–55%','35–45%','25–35%','20–28%'][currentPhase]} color={C.teal} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={card(info.color)}>
          <CardHeader label="Required Staff" color={info.color} sub="NREA minimum + operations" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
                <th style={{ padding: '6px 12px', textAlign: 'left',   color: C.muted, fontWeight: 700 }}>Role</th>
                <th style={{ padding: '6px 8px',  textAlign: 'center', color: C.muted, fontWeight: 700 }}>n</th>
                <th style={{ padding: '6px 8px',  textAlign: 'right',  color: C.muted, fontWeight: 700 }}>Type</th>
                <th style={{ padding: '6px 12px', textAlign: 'right',  color: C.muted, fontWeight: 700 }}>E£/mo</th>
              </tr>
            </thead>
            <tbody>
              {ph.required.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#fafbfc' : C.card }}>
                  <td style={{ padding: '5px 12px', color: C.text }}>{r.role}</td>
                  <td style={{ padding: '5px 8px',  textAlign: 'center', color: info.color, fontWeight: 700 }}>{r.count}</td>
                  <td style={{ padding: '5px 8px',  textAlign: 'right' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: typeColor(r.type), background: `${typeColor(r.type)}18`, padding: '2px 6px', borderRadius: 10 }}>
                      {typeLabel(r.type)}
                    </span>
                  </td>
                  <td style={{ padding: '5px 12px', textAlign: 'right', color: C.muted }}>
                    {r.salary === 0 ? '—' : `${r.salary.toLocaleString()} × ${r.count}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {ph.optional.length > 0 && (
            <div style={{ ...card(C.orange), marginBottom: 10 }}>
              <CardHeader label="Optional Roles" color={C.orange} />
              <div style={{ padding: '8px 14px' }}>
                {ph.optional.map((o, i) => (
                  <div key={i} style={{ marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: C.text }}>{o.role}</span>
                    <span style={{ fontSize: 10, color: C.muted }}> — {o.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card(C.muted), marginBottom: 10 }}>
            <CardHeader label="Outsourced" color={C.muted} />
            <div style={{ padding: '8px 14px' }}>
              {ph.outsourced.map((o, i) => (
                <div key={i} style={{ color: C.muted, fontSize: 11, marginBottom: 3 }}>• {o}</div>
              ))}
            </div>
          </div>

          {newHires.length > 0 && (
            <div style={card(C.green)}>
              <CardHeader label="Next Required Hires" color={C.green} sub={`to reach ${PHASES[currentPhase+1]?.name}`} />
              <div style={{ padding: '8px 14px' }}>
                {newHires.map((r, i) => (
                  <div key={i} style={{ marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: C.green, fontWeight: 900, fontSize: 12 }}>+{r.count}</span>
                    <span style={{ fontSize: 11, color: C.text, flex: 1 }}>{r.role}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>E£ {r.salary.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '8px 12px', background: '#f0f7ff', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 10, color: C.muted, marginTop: 8 }}>
            <span style={{ color: info.color, fontWeight: 700 }}>Phase note: </span>{ph.note}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel B: Hiring Triggers ─────────────────────────────────────────────────

function HiringTriggersPanel() {
  const [active, setActive] = useState(0);
  const group = HIRING_TRIGGERS[active];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {HIRING_TRIGGERS.map((g, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${g.color}`, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: active === i ? g.color : 'transparent',
              color: active === i ? '#fff' : g.color }}>
            {g.transition}
          </button>
        ))}
      </div>

      {group.triggers.map((t, i) => (
        <div key={i} style={card(group.color)}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: group.color }}>{t.role}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.orange, background: `${C.orange}18`, padding: '2px 8px', borderRadius: 10 }}>{t.cost}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Hire WHEN</div>
              {t.when.map((w, j) => (
                <div key={j} style={{ marginBottom: 4, padding: '4px 8px', background: `${group.color}12`, borderLeft: `2px solid ${group.color}`, borderRadius: '0 5px 5px 0', fontSize: 11, color: C.text }}>{w}</div>
              ))}
              <div style={{ marginTop: 10, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Sourcing Channel</div>
              <div style={{ fontSize: 11, color: C.teal }}>{t.channel}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Why this hire</div>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 10 }}>{t.why}</div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Risk if delayed</div>
              <div style={{ fontSize: 11, color: C.red, lineHeight: 1.5, padding: '4px 8px', background: `${C.red}10`, borderRadius: 5, marginBottom: 8 }}>{t.risk}</div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fallback</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{t.fallback}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel C: NREA Tracker ────────────────────────────────────────────────────

function NREATrackerPanel() {
  const [params, setParams] = useState({ capital: 0, portfolio: 0, singleStation: 0, staffRatio: 1, permRatio: 1, complaints: 0 });
  const upd = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const score = useMemo(() => {
    let s = 0;
    s += params.capital > 3000000 ? 25 : params.capital > 1000000 ? 18 : params.capital > 500000 ? 10 : 5;
    s += params.portfolio > 500 ? 20 : params.portfolio > 100 ? 14 : 6;
    s += params.singleStation > 100 ? 10 : params.singleStation > 50 ? 7 : 3;
    s += params.staffRatio === 2 ? 15 : params.staffRatio === 1 ? 8 : 0;
    s += params.permRatio === 1 ? 15 : 10;
    s += params.complaints === 0 ? 10 : params.complaints === 1 ? 5 : 0;
    return s;
  }, [params]);

  const scorePts = {
    capital:       params.capital > 3000000 ? 25 : params.capital > 1000000 ? 18 : params.capital > 500000 ? 10 : 5,
    portfolio:     params.portfolio > 500 ? 20 : params.portfolio > 100 ? 14 : 6,
    singleStation: params.singleStation > 100 ? 10 : params.singleStation > 50 ? 7 : 3,
    staff:         params.staffRatio === 2 ? 15 : params.staffRatio === 1 ? 8 : 0,
    permTemp:      params.permRatio === 1 ? 15 : 10,
    complaints:    params.complaints === 0 ? 10 : params.complaints === 1 ? 5 : 0,
  };

  const tier     = TIER_THRESHOLDS.find(t => score >= t.min) || TIER_THRESHOLDS[3];
  const nextTier = TIER_THRESHOLDS[TIER_THRESHOLDS.findIndex(t => t.tier === tier.tier) - 1];
  const gap      = nextTier ? nextTier.min - score : 0;

  const sliderInput = (label, key, min, max, step, ticks) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>
        {label} — <span style={{ color: C.text, fontWeight: 700 }}>
          {key === 'capital' ? `E£ ${params[key].toLocaleString()}` : `${params[key]} kW`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={params[key]}
        onChange={e => upd(key, +e.target.value)}
        style={{ width: '100%', accentColor: C.gold }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.muted }}>
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );

  const segmented = (label, key, options, colors) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt, i) => (
          <button key={i} onClick={() => upd(key, i)}
            style={{ flex: 1, padding: '5px 4px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
              background: params[key] === i ? (colors ? colors[i] : C.gold) : '#f0f2f5',
              color: params[key] === i ? '#fff' : C.muted }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={card(C.teal)}>
        <CardHeader label="Company Parameters" color={C.teal} sub="Adjust to model your current position" />
        <div style={{ padding: '12px 16px' }}>
          {sliderInput('Paid-up Capital', 'capital', 0, 5000000, 100000, ['0', 'E£ 500K', 'E£ 1M', 'E£ 3M', 'E£ 5M'])}
          {sliderInput('Total Portfolio Installed', 'portfolio', 0, 2000, 10, ['0', '100 kW', '500 kW', '1 MW', '2 MW'])}
          {sliderInput('Largest Single Station', 'singleStation', 0, 500, 5, ['0', '50 kW', '100 kW', '250 kW', '500 kW'])}
          {segmented('Staff ratio vs. project capacity', 'staffRatio', ['Insufficient (0)', 'Borderline (8)', 'Appropriate (15)'])}
          {segmented('Permanent / Temp ratio', 'permRatio', ['80% perm (10pts)', '100% perm (15pts)'], [C.orange, C.green])}
          {segmented('Client complaints', 'complaints', ['Zero (10pts)', '≤ 1 (5pts)', '> 1 (0pts)'], [C.green, C.orange, C.red])}
        </div>
      </div>

      <div>
        <div style={{ background: `${tier.color}12`, border: `2px solid ${tier.color}`, borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>NREA Score</div>
          <div style={{ fontSize: 60, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 14, color: tier.color }}>/100</div>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '6px 24px', background: tier.color, borderRadius: 20, fontSize: 14, fontWeight: 900, color: '#fff' }}>
            {tier.tier} Tier
          </div>
          {nextTier ? (
            <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
              Need <span style={{ color: nextTier.color, fontWeight: 700 }}>{gap} more points</span> for {nextTier.tier}
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 11, color: C.green, fontWeight: 700 }}>Maximum tier achieved</div>
          )}
        </div>

        <div style={card(tier.color)}>
          <CardHeader label="Score Breakdown" color={tier.color} />
          <div style={{ padding: '10px 14px' }}>
            {Object.entries(NREA_SCORING).map(([key, cat]) => {
              const pts = scorePts[key === 'staff' ? 'staff' : key === 'permTemp' ? 'permTemp' : key];
              const pct = (pts / cat.weight) * 100;
              const col = pct >= 90 ? C.green : pct >= 55 ? C.orange : C.red;
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>{cat.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{pts}/{cat.weight}</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 4, height: 5 }}>
                    <div style={{ width: `${pct}%`, background: col, borderRadius: 4, height: 5, transition: 'width .3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={card(C.border)}>
          <div style={{ padding: '8px 14px' }}>
            {TIER_THRESHOLDS.slice().reverse().map(t => (
              <div key={t.tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, fontWeight: score >= t.min ? 700 : 400, color: score >= t.min ? t.color : C.muted }}>
                  {score >= t.min ? '✓ ' : '○ '}{t.tier}
                </span>
                <span style={{ fontSize: 10, color: C.muted }}>≥ {t.min} pts</span>
                <span style={{ fontSize: 10, color: C.orange }}>E£ {t.fee.toLocaleString()} fee</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel D: Team Cost ───────────────────────────────────────────────────────

function TeamCostPanel() {
  const [annRev, setAnnRev] = useState(5000000);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>
          Estimated Annual Revenue — <strong>E£ {annRev.toLocaleString()}</strong>
        </label>
        <input type="range" min={1000000} max={100000000} step={500000} value={annRev}
          onChange={e => setAnnRev(+e.target.value)}
          style={{ width: '100%', accentColor: C.green }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}>
          <span>E£ 1M</span><span>E£ 10M</span><span>E£ 25M</span><span>E£ 50M</span><span>E£ 100M</span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: C.card, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        <thead>
          <tr style={{ background: C.navy, color: '#fff' }}>
            {['Phase', 'Tier', 'Headcount', 'Monthly Payroll', 'Annual Payroll', '% of Revenue', 'Burn Bar'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Phase' || h === 'Tier' ? 'left' : 'right', fontWeight: 700, fontSize: 11 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORG_STRUCTURE.map((ph, i) => {
            const annPay = ph.payroll * 12;
            const pct    = annRev > 0 ? (annPay / annRev) * 100 : 0;
            const col    = pct > 50 ? C.red : pct > 35 ? C.orange : C.green;
            const info   = PHASES[i];
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#f8fafc' : C.card }}>
                <td style={{ padding: '8px 12px', color: info.color, fontWeight: 700 }}>{info.icon} {info.label}</td>
                <td style={{ padding: '8px 12px', color: info.color }}>{info.name}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.text }}>{ph.headcount}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: C.orange }}>
                  {ph.payroll === 0 ? '—' : `E£ ${ph.payroll.toLocaleString()}`}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: C.red }}>
                  {annPay === 0 ? '—' : `E£ ${(annPay/1000).toFixed(0)}K`}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  {annPay === 0 ? '—' : <span style={{ color: col, fontWeight: 700 }}>{pct.toFixed(1)}%</span>}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <div style={{ width: 60, background: C.border, borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, background: col, borderRadius: 4, height: 6, transition: 'width .3s' }} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 10, padding: '8px 14px', background: '#f0f7ff', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 10, color: C.muted }}>
        <strong style={{ color: C.teal }}>Benchmark: </strong>
        Healthy EPC payroll ratio: 20–35% of revenue. Above 45% = hiring ahead of revenue — reassess.
        All figures exclude employer social insurance (~18.75%). Add ~17% on top of stated payroll for true labour cost.
      </div>
    </div>
  );
}

// ─── Panel E: Scaling Roadmap ─────────────────────────────────────────────────

function ScalingRoadmapPanel() {
  const roadmap = [
    {
      phase: 'Phase 0', name: 'Pre-Registration', color: C.muted, icon: '📋', duration: '0–3 months',
      triggers: ['Decision to incorporate as SAE'],
      milestones: ['SAE registered with GAFI', 'Commercial registry listing solar activities', 'Tax card issued', 'Social insurance account opened', 'Initial capital deposited (min E£ 2M)', 'NREA application package prepared'],
      revenueTarget: 'E£ 0 (pre-revenue)', capitalReq: 'E£ 2M+ paid-up', nreaFee: 'E£ 5,000 review + E£ 5,000 Bronze',
    },
    {
      phase: 'Phase 1', name: 'Bronze', color: C.bronze, icon: '🥉', duration: '3–18 months',
      triggers: ['NREA Bronze certificate obtained', 'First 5 residential projects completed', 'Portfolio ≥ 50 kW installed'],
      milestones: ['NREA Bronze certificate issued', 'EgyptERA contractor license obtained', 'First residential installs (5–15 kWp each)', 'CRM system operational', 'NREA bi-annual report filed (Jan + Jul)', 'IEC-certified equipment procurement established'],
      revenueTarget: 'E£ 1M – 3M/yr', capitalReq: 'E£ 2M paid-up', nreaFee: 'E£ 5,000',
    },
    {
      phase: 'Phase 2', name: 'Silver', color: C.silver, icon: '🥈', duration: '18–36 months',
      triggers: ['Portfolio ≥ 100 kW installed', 'NREA score ≥ 55', 'Revenue ≥ E£ 5M/yr', '3+ concurrent projects'],
      milestones: ['NREA Silver certificate', 'First C&I project > 50 kW delivered', 'O&M portfolio > 200 kW', 'PM hired', 'Structured sales team', 'Formal procurement process'],
      revenueTarget: 'E£ 5M – 15M/yr', capitalReq: 'E£ 3M+ (top capital bracket)', nreaFee: 'E£ 10,000',
    },
    {
      phase: 'Phase 3', name: 'Gold', color: C.gold, icon: '🥇', duration: '36–60 months',
      triggers: ['Portfolio ≥ 500 kW', 'Largest station ≥ 100 kW', 'NREA score ≥ 65', 'Revenue ≥ E£ 15M/yr', 'Government tender participation'],
      milestones: ['NREA Gold certificate', 'First MW-scale project delivered', 'Government tender win', 'Consultant-grade engineers on staff', 'Full compliance structure', 'Investor-ready 3yr audited accounts'],
      revenueTarget: 'E£ 20M – 50M/yr', capitalReq: 'E£ 5M+ or revalued retained earnings', nreaFee: 'E£ 20,000',
    },
    {
      phase: 'Phase 4', name: 'Platinum', color: C.platinum, icon: '💎', duration: '60–84 months',
      triggers: ['Portfolio > 2 MWp', 'NREA score > 75', 'Revenue ≥ E£ 50M/yr', 'O&M portfolio > 1 MW', 'Zero NREA complaints'],
      milestones: ['NREA Platinum certificate', 'Series A or strategic investor', 'O&M as standalone revenue stream', 'Full C-suite in place', '5+ concurrent project sites', 'Potential utility-scale pre-qualification'],
      revenueTarget: 'E£ 50M – 150M/yr', capitalReq: 'E£ 10M+ balance sheet', nreaFee: 'E£ 30,000',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {roadmap.map((r, i) => (
        <div key={i} style={card(r.color)}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: r.color }}>{r.phase} — {r.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{r.duration}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.green }}>{r.revenueTarget}</div>
              <div style={{ fontSize: 9, color: C.muted }}>Revenue target</div>
            </div>
          </div>
          <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Upgrade Triggers</div>
              {r.triggers.map((t, j) => (
                <div key={j} style={{ fontSize: 10, color: C.text, marginBottom: 3, paddingLeft: 8, borderLeft: `2px solid ${r.color}` }}>{t}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Key Milestones</div>
              {r.milestones.map((m, j) => (
                <div key={j} style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>
                  <span style={{ color: r.color }}>✓ </span>{m}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Requirements</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: C.muted }}>Capital</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>{r.capitalReq}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.muted }}>NREA Fee</div>
                <div style={{ fontSize: 11, color: C.teal }}>{r.nreaFee}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel F: Job Descriptions ────────────────────────────────────────────────

function JobDescriptionsPanel() {
  const [sel, setSel] = useState(0);
  const jd = JOB_DESCRIPTIONS[sel];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {JOB_DESCRIPTIONS.map((j, i) => (
          <button key={i} onClick={() => setSel(i)}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11, fontWeight: 600, transition: 'all .15s',
              background: sel === i ? C.navy : '#f0f2f5',
              color: sel === i ? '#fff' : C.muted }}>
            {j.title}
            <div style={{ fontSize: 9, marginTop: 2, color: sel === i ? 'rgba(255,255,255,.5)' : C.border }}>
              {j.nreaRequired ? 'NREA Required' : 'Operational'} · {j.phase}
            </div>
          </button>
        ))}
      </div>

      <div style={card(C.teal)}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: C.navy }}>{jd.title}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: jd.nreaRequired ? '#fff' : C.muted, background: jd.nreaRequired ? C.red : '#e2e8f0', padding: '2px 8px', borderRadius: 10 }}>
              {jd.nreaRequired ? 'NREA Required' : 'Operational'}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: C.teal, padding: '2px 8px', borderRadius: 10 }}>{jd.nreaLevel}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.navy, background: C.gold, padding: '2px 8px', borderRadius: 10 }}>Phase: {jd.phase}</span>
          </div>
        </div>
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Qualifications</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>{jd.qualifications}</div>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Experience</div>
            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6, marginBottom: 12 }}>{jd.experience}</div>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Certifications</div>
            {jd.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 3 }}>• {c}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Responsibilities</div>
            {jd.responsibilities.map((r, i) => (
              <div key={i} style={{ marginBottom: 5, padding: '5px 10px', background: '#f0f7ff', borderLeft: `2px solid ${C.teal}`, borderRadius: '0 5px 5px 0', fontSize: 11, color: C.text }}>{r}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel G: Risk Register ───────────────────────────────────────────────────

function RiskRegisterPanel() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {RISKS.map((risk, i) => (
        <div key={i} style={card(riskColor(risk.sev))}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>{risk.sev === 'red' ? '🔴' : '🟠'}</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: riskColor(risk.sev) }}>{risk.type}</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Risk Scenarios</div>
            {risk.scenarios.map((s, j) => (
              <div key={j} style={{ marginBottom: 5, padding: '5px 8px', background: `${riskColor(risk.sev)}10`, borderLeft: `2px solid ${riskColor(risk.sev)}`, borderRadius: '0 5px 5px 0', fontSize: 11, color: C.text, lineHeight: 1.5 }}>{s}</div>
            ))}
            <div style={{ marginTop: 10, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Mitigation</div>
            <div style={{ fontSize: 11, color: C.green, lineHeight: 1.5 }}>{risk.mitigation}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrgScalingView() {
  const [panel, setPanel]             = useState('org');
  const [currentPhase, setCurrentPhase] = useState(1);

  const subPanels = [
    { id: 'org',     label: '🏢 Org Structure'    },
    { id: 'hiring',  label: '⚡ Hiring Triggers'   },
    { id: 'nrea',    label: '📊 NREA Tracker'      },
    { id: 'cost',    label: '💰 Team Cost'         },
    { id: 'roadmap', label: '🗺 Scaling Roadmap'   },
    { id: 'jd',      label: '📋 Job Descriptions'  },
    { id: 'risk',    label: '⚠ Risk Register'     },
  ];

  const banners = {
    org:     { label: 'Organizational Structure — Phase by Phase',                 color: C.purple,  icon: '🏢', note: 'Select a phase to see org chart, headcount, payroll and next hires.' },
    hiring:  { label: 'Trigger-Based Hiring Logic',                               color: C.green,   icon: '⚡', note: 'Every hire is unlocked by a specific trigger. No trigger = no hire. No compliance trigger = hire immediately.' },
    nrea:    { label: 'NREA Classification Tracker',                               color: C.teal,    icon: '📊', note: 'Adjust parameters to model your current position. Score and tier update live.' },
    cost:    { label: 'Team Cost Dashboard',                                       color: C.orange,  icon: '💰', note: 'Adjust revenue slider to see payroll as % of revenue at each phase.' },
    roadmap: { label: 'Bronze → Silver → Gold → Platinum Scaling Roadmap',        color: C.gold,    icon: '🗺', note: 'Triggers, milestones and capital requirements for each upgrade.' },
    jd:      { label: 'NREA-Compliant Job Descriptions',                           color: C.teal,    icon: '📋', note: 'Based directly on ashtratat.pdf qualification levels.' },
    risk:    { label: 'Risk Register — Hiring & Compliance',                       color: C.red,     icon: '⚠', note: 'Four risk categories — two of which can kill the certificate.' },
  };

  const b = banners[panel];

  return (
    <div>
      {/* Sub-panel tab strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap', padding: '10px 14px', background: C.navy, borderRadius: 8 }}>
        <div style={{ width: '100%', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: C.gold }}>🏗 Organization & Scaling</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginLeft: 10 }}>SAE → Bronze → Silver → Gold → Platinum</span>
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

      <SectionBanner label={b.label} color={b.color} icon={b.icon} note={b.note} />

      {panel === 'org'     && <OrgStructurePanel     currentPhase={currentPhase} setCurrentPhase={setCurrentPhase} />}
      {panel === 'hiring'  && <HiringTriggersPanel   />}
      {panel === 'nrea'    && <NREATrackerPanel       />}
      {panel === 'cost'    && <TeamCostPanel          />}
      {panel === 'roadmap' && <ScalingRoadmapPanel    />}
      {panel === 'jd'      && <JobDescriptionsPanel   />}
      {panel === 'risk'    && <RiskRegisterPanel      />}
    </div>
  );
}
