// ─── BUDGET BASELINE (EGP) ────────────────────────────────────────────────────
// Based on Business Case v4.0 — Strategy A, EGP 2M starting capital
export const BUDGET_BASELINE = {
  total: 2000000,
  workstreams: {
    'WBS-1': { budget: 30000,   label: 'Legal & Corporate'         }, // lawyer + GAFI + licenses
    'WBS-2': { budget: 8000,    label: 'Market Entry'              }, // CRM, printing, tools
    'WBS-3': { budget: 0,       label: 'Sales & Acquisition'       }, // founder time only
    'WBS-4': { budget: 28000,   label: 'Technical Capability'      }, // PVsyst USD 3K + test order
    'WBS-5': { budget: 5000,    label: 'Financial Control'         }, // accounting software
    'WBS-6': { budget: 1500000, label: 'First Project Execution'   }, // equipment + civil + labor
    'WBS-7': { budget: 3000,    label: 'Auxiliary Revenue'         }, // templates, lender meetings
    'NREA':  { budget: 15000,   label: 'NREA Compliance'           }, // review EGP 5K + cert + EgyptERA
    'PAYROLL':{ budget: 300000, label: 'Payroll (Y1 engineer)'     }, // EGP 18-25K × 12 months
    'OPEX':  { budget: 111000,  label: 'OpEx / Overhead'           }, // office, comms, transport
  },
};

// Initial actuals state (user edits these over time)
export const INIT_ACTUALS = {
  'WBS-1': 0,
  'WBS-2': 0,
  'WBS-3': 0,
  'WBS-4': 0,
  'WBS-5': 0,
  'WBS-6': 0,
  'WBS-7': 0,
  'NREA':  0,
  'PAYROLL':0,
  'OPEX':  0,
};

// ─── SCHEDULE CONTROL ────────────────────────────────────────────────────────
export const SCHEDULE_BASELINE = {
  firstCommissioning: 175,  // target day for first project commissioning
  firstContract:      120,  // latest acceptable contract signing
  firstDeposit:       130,  // latest acceptable deposit collection
  firstProposal:       90,  // latest acceptable first proposal
  month6Gate:         180,  // hard stop if no contract
};

export const SCHEDULE_THRESHOLDS = {
  green:  0.05,   // ≤5% of baseline days
  yellow: 0.15,   // 5–15%
  // red = >15%
};

// ─── CASH FLOW THRESHOLDS ─────────────────────────────────────────────────────
export const CASH_THRESHOLDS = {
  comfortable: 500000,  // Green — operating normally
  caution:     200000,  // Yellow — pause new commitments
  critical:    83000,   // Red — emergency protocol (Month 7 floor from simulation)
  // Decision rules:
  rules: [
    {
      id: 'CF-1',
      trigger: 'Cash > EGP 500K',
      severity: 'green',
      action: 'Operating normally. Monitor weekly.',
    },
    {
      id: 'CF-2',
      trigger: 'Cash EGP 200K–500K',
      severity: 'yellow',
      action: 'Pause any new OpEx commitments. Review weekly. Activate overdraft if not yet approved. Do not sign new subcontractor scopes until cash recovers.',
    },
    {
      id: 'CF-3',
      trigger: 'Cash < EGP 200K',
      severity: 'red',
      action: 'STOP new project commitments. Activate bank overdraft immediately. Shift pipeline focus to Strategy C (commission model — zero procurement cash exposure). Notify founder same day.',
    },
    {
      id: 'CF-4',
      trigger: 'Cash < EGP 83K',
      severity: 'critical',
      action: 'EMERGENCY: Stop all discretionary spend within 24h. Founder review of all active payables. Suspend all non-critical salaries pending board resolution. Prepare exit scenario.',
    },
  ],
};

// ─── COST CONTROL THRESHOLDS ──────────────────────────────────────────────────
export const COST_THRESHOLDS = {
  green:  0.05,   // within +5% of budget → normal
  yellow: 0.10,   // +5–10% → flag for review
  // red = >10% → stop and re-baseline
};

// ─── KPI CONTROL THRESHOLDS ───────────────────────────────────────────────────
// Egyptian market conditions calibrated from business case v4.0
export const KPI_THRESHOLDS = {
  leadsPerWeek: {
    label: 'Leads / Week',
    green: 3, yellow: 2, red: 1,
    unit: '/week',
    escalation: 'If <2 leads/week for 2 consecutive weeks: activate all referral sources, expand to next 20 prospects on list.',
  },
  siteVisitConversion: {
    label: 'Site Visit → Paid Study Rate',
    green: 33, yellow: 20, red: 10,
    unit: '%',
    escalation: 'If <20% conversion: review feasibility pricing. Offer EPC credit-against-fee more prominently. Do not reduce fee — qualify harder instead.',
  },
  proposalClosureRate: {
    label: 'Proposal → Contract Rate',
    green: 30, yellow: 20, red: 10,
    unit: '%',
    escalation: 'If <20% closure: review pricing, FX clause communication, and deposit negotiation approach. Consider one-project pilot at reduced deposit (25% floor).',
  },
  cashPosition: {
    label: 'Cash Position (EGP)',
    green: 500000, yellow: 200000, red: 83000,
    unit: 'EGP',
    escalation: 'See Cash Flow Control rules CF-1 through CF-4.',
  },
  feasStudyDeliveryDays: {
    label: 'Feasibility Study Delivery Time',
    green: 14, yellow: 21, red: 30,
    unit: 'days',
    escalation: 'If >21 days: engineer resource conflict — reprioritize. Feasibility revenue must not be sacrificed for admin tasks.',
  },
};

// ─── RISK TRIGGER THRESHOLDS ─────────────────────────────────────────────────
export const RISK_TRIGGERS = {
  'R-1': { metric: 'daysElapsed', operator: '>', value: 21, label: 'Engineer hire: Day 21 passed with no hire', urgency: 'High', action: 'Increase salary offer by EGP 3K/month. Post on all 3 platforms simultaneously. Contact Engineers Syndicate directly.' },
  'R-2': { metric: 'daysElapsed', operator: '>', value: 180, label: 'Month 6 gate: no signed contract by Day 180', urgency: 'Critical', action: 'Invoke gate immediately: freeze hires, cancel subscriptions, strategy review within 5 days.' },
  'R-3': { metric: 'cashPosition', operator: '<', value: 200000, label: 'Month 7 gap risk: cash below EGP 200K', urgency: 'High', action: 'Activate overdraft. Pause new OpEx. Shift to Strategy C pipeline.' },
  'R-4': { metric: 'fxAlertActive', operator: '==', value: false, label: 'FX alert not configured', urgency: 'Medium', action: 'Configure XE.com alert immediately. Requote all open proposals.' },
  'R-5': { metric: 'nreaStatus', operator: '==', value: 'Not Applied', label: 'NREA application not yet submitted', urgency: 'High', action: 'If Day 60+ and not applied: emergency compliance review. DISCO cannot connect without this.' },
  'R-6': { metric: 'discoDelayDays', operator: '>', value: 45, label: 'DISCO delay >45 days', urgency: 'Medium', action: 'Engineer to escalate to area DISCO office directly. Request inspection date in writing.' },
  'R-9': { metric: 'depositRefused', operator: '==', value: true, label: 'Client refused deposit requirement', urgency: 'High', action: 'Invoke walk-away protocol. Do not proceed. Document refusal in CRM.' },
  'R-10': { metric: 'nreaReportOverdue', operator: '==', value: true, label: 'NREA bi-annual report overdue', urgency: 'Critical', action: 'Submit immediately. NREA no-grace-period rule — certificate cancellation risk.' },
};
