// ─── ORGANIZATIONAL QUALITY MANAGEMENT SYSTEM (QMS) ──────────────────────────
// Company-level quality standards for Solar EPC Egypt

// ─── A. PROCESS QUALITY KPIs ──────────────────────────────────────────────────
export const PROCESS_QUALITY_DEFS = [
  {
    id: 'PQ-1',
    label: 'Proposal Acceptance Rate',
    description: 'Signed EPC contracts / EPC proposals submitted',
    unit: '%',
    target: 30,
    thresholds: { green: 30, yellow: 20, red: 10 },
    inverted: false,
    escalation: 'If <20%: commercial review with founder. Review pricing strategy, FX clause presentation, deposit negotiation script.',
  },
  {
    id: 'PQ-2',
    label: 'Feasibility Yield Accuracy',
    description: 'Actual commissioned yield vs PVsyst-modelled yield',
    unit: '%',
    target: 90,
    thresholds: { green: 90, yellow: 80, red: 70 },
    inverted: false,
    escalation: 'If <80%: engineer review of site assessment methodology. Adjust shading analysis and tilt angle inputs.',
  },
  {
    id: 'PQ-3',
    label: 'Project Rework Rate',
    description: 'Installation phases requiring rework / total phases',
    unit: '%',
    target: 0,
    thresholds: { green: 5, yellow: 10, red: 15 },
    inverted: true,
    escalation: 'If >10%: review subcontractor performance. Reduce work allocation or replace. Root-cause analysis required.',
  },
  {
    id: 'PQ-4',
    label: 'Document Version Compliance',
    description: 'Documents using latest approved templates / total docs issued',
    unit: '%',
    target: 100,
    thresholds: { green: 100, yellow: 90, red: 80 },
    inverted: false,
    escalation: 'If <90%: mandatory document control refresh. All templates must be version-controlled.',
  },
  {
    id: 'PQ-5',
    label: 'Pricing Consistency',
    description: 'Proposals within ±5% of standard price model / total proposals',
    unit: '%',
    target: 100,
    thresholds: { green: 100, yellow: 90, red: 80 },
    inverted: false,
    escalation: 'Any deviation >5% from EGP 27K/kW standard requires founder written approval before proposal is sent.',
  },
];

// ─── B. PARTNER (SUBCONTRACTOR) QUALITY ───────────────────────────────────────
export const PARTNER_QUALITY_DEFS = [
  {
    id: 'PRT-1',
    label: 'On-Time Phase Completion Rate',
    description: 'Installation phases completed on agreed date / total phases',
    unit: '%',
    target: 85,
    thresholds: { green: 85, yellow: 70, red: 60 },
    inverted: false,
    escalation: 'If partner <70% on-time for 2 consecutive phases: reduce scope allocation by 50%. If <60%: activate replacement partner.',
  },
  {
    id: 'PRT-2',
    label: 'Subcontractor Rework Rate',
    description: 'Phases requiring rework attributable to subcontractor / total phases',
    unit: '%',
    target: 0,
    thresholds: { green: 5, yellow: 10, red: 15 },
    inverted: true,
    escalation: 'If >10% rework rate: formal warning + cost of rework deducted from payment. If >15%: replace partner.',
  },
  {
    id: 'PRT-3',
    label: 'Safety Compliance Score',
    description: 'Safety procedures followed / total safety checkpoints observed',
    unit: '%',
    target: 100,
    thresholds: { green: 100, yellow: 95, red: 90 },
    inverted: false,
    escalation: 'Any safety violation: immediate stop-work order. Written incident report required. Two violations = partner disqualification.',
  },
  {
    id: 'PRT-4',
    label: 'IEC Documentation Compliance',
    description: 'IEC-certified equipment used as per BOM / total equipment items',
    unit: '%',
    target: 100,
    thresholds: { green: 100, yellow: null, red: 99.9 },
    inverted: false,
    escalation: 'Any non-IEC-certified equipment installed = immediate stop-work. Remove and replace. NREA certificate at risk.',
  },
];

// ─── C. CUSTOMER EXPERIENCE QUALITY ─────────────────────────────────────────
export const CUSTOMER_QUALITY_DEFS = [
  {
    id: 'CX-1',
    label: 'Client Response Time (hrs)',
    description: 'Average time to respond to client queries',
    unit: 'hrs',
    target: 24,
    thresholds: { green: 24, yellow: 48, red: 72 },
    inverted: true,
    escalation: 'If average >48h: flag to founder. If any complaint response exceeds 10 working days: NREA certificate risk (Article 9). Log all responses.',
  },
  {
    id: 'CX-2',
    label: 'Issue Resolution Time (days)',
    description: 'Average calendar days from issue raised to resolved',
    unit: 'days',
    target: 7,
    thresholds: { green: 7, yellow: 14, red: 30 },
    inverted: true,
    escalation: 'If >14 days: escalate to founder. Technical issues: engineer must produce resolution timeline within 48h of issue raised.',
  },
  {
    id: 'CX-3',
    label: 'Client Satisfaction Score',
    description: 'Post-project satisfaction score (1-10 survey)',
    unit: '/10',
    target: 8,
    thresholds: { green: 8, yellow: 6, red: 4 },
    inverted: false,
    escalation: 'If <6: post-project review call with client within 5 days. Root-cause analysis logged.',
  },
  {
    id: 'CX-4',
    label: 'Net Promoter Score (NPS)',
    description: '% promoters − % detractors from client survey',
    unit: '',
    target: 40,
    thresholds: { green: 40, yellow: 20, red: 0 },
    inverted: false,
    escalation: 'If NPS <20: systematic review of client journey. O&M touchpoints are the primary NPS drivers post-commissioning.',
  },
];

// ─── D. INTERNAL CONTROLS ────────────────────────────────────────────────────
export const INTERNAL_CONTROLS = [
  { id: 'IC-1', category: 'Approval Workflow',   control: 'Any single spend >EGP 5,000 requires founder written approval before commitment', status: 'Active' },
  { id: 'IC-2', category: 'Approval Workflow',   control: 'Any deviation from EGP 23K/kW price floor requires founder sign-off + written justification', status: 'Active' },
  { id: 'IC-3', category: 'Document Review',     control: 'All EPC contracts reviewed by corporate lawyer before signature (not just template review)', status: 'Active' },
  { id: 'IC-4', category: 'Document Review',     control: 'Feasibility reports reviewed by engineer before delivery (accuracy, assumptions, PVsyst parameters)', status: 'Active' },
  { id: 'IC-5', category: 'Version Control',     control: 'All templates versioned (v1.0, v1.1...). No previous version used without founder approval', status: 'Active' },
  { id: 'IC-6', category: 'Version Control',     control: 'Design standards document updated after every project. New edition distributed to engineer within 7 days of commissioning', status: 'Active' },
  { id: 'IC-7', category: 'Financial Control',   control: 'Client deposits held in dedicated sub-account. Released to WC pool only when equipment order is placed', status: 'Active' },
  { id: 'IC-8', category: 'Financial Control',   control: 'Equipment supplier payments: 30% on PO, 70% only after signed delivery acceptance. No exceptions', status: 'Active' },
  { id: 'IC-9', category: 'Compliance',          control: 'No installation work to begin until all pre-install quality gates are cleared (signed by engineer)', status: 'Active' },
  { id: 'IC-10',category: 'Compliance',          control: 'NREA bi-annual report (Jan W1, Jul W1) — calendar alert 30 days in advance. Founder is directly responsible', status: 'Active' },
];

// Initial values for editable KPIs
export const INIT_ORG_QUALITY = {
  process:  Object.fromEntries([...PROCESS_QUALITY_DEFS,  ...PARTNER_QUALITY_DEFS, ...CUSTOMER_QUALITY_DEFS].map(d => [d.id, 0])),
};
