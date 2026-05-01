// ─── FOUNDER OPERATING SYSTEM — DECISION ENGINE ────────────────────────────
// Single source of truth. Takes fosState + CRM leads → outputs full system state.
// Nothing in here is static. Everything is computed.

import { PIPELINE_STAGES } from '../data/crmData';

// ── Constants ────────────────────────────────────────────────────────────────

export const STRATEGY = {
  A: { label:'Strategy A — Full EPC',         capital: 2000000, burnBase: 82000, margin: 0.115 },
  B: { label:'Strategy B — Developer + Procure', capital: 1700000, burnBase: 60000, margin: 0.18 },
  C: { label:'Strategy C — Pure Developer',   capital: 400000,  burnBase: 25000, margin: 0.06 },
};

const STAGE_PROB = Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s.prob]));

// Engineering hours demanded per lead at each stage (hours/week while in this stage)
const STAGE_ENG_DEMAND = {
  site_visit_scheduled:  5,
  site_visit_completed:  3,
  feasibility_proposed:  6,
  feasibility_sold:     20,  // active study production
  feasibility_delivered: 5,
  proposal_sent:         6,
  negotiation:           4,
  won:                  35,  // execution phase per active project
};

// Sales/founder hours demanded per stage (hours/week)
const STAGE_SALES_DEMAND = {
  unqualified:           1,
  contacted:             2,
  qualified:             3,
  site_visit_scheduled:  2,
  site_visit_completed:  4,
  feasibility_proposed:  4,
  feasibility_sold:      2,
  feasibility_delivered: 5,
  proposal_sent:         6,
  negotiation:           8,
  won:                   3,
};

const SURVIVAL_FLOOR  = 200000;
const RECOVERY_FLOOR  = 500000;
const ABSOLUTE_FLOOR  = 83000;

// ── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtEgp   = (n) => `EGP ${Number(n || 0).toLocaleString('en-EG')}`;
const fmtEgpShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1e6)  return `EGP ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1000) return `EGP ${(v / 1000).toFixed(0)}K`;
  return `EGP ${v.toLocaleString()}`;
};
const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - Date.now()) / 86400000);
};
const isOverdue = (str) => str && str < todayStr();

// ── CRM Summary (computed from live lead data) ────────────────────────────────

export const computeCRMSummary = (leads) => {
  const active = leads.filter(l => l.stage !== 'lost' && l.stage !== 'nurture');

  const siteVisitsComplete = leads.filter(l =>
    ['site_visit_completed','feasibility_proposed','feasibility_sold',
     'feasibility_delivered','proposal_sent','negotiation','won'].includes(l.stage)
  ).length;

  const feasibilitySold = leads.filter(l =>
    ['feasibility_sold','feasibility_delivered','proposal_sent','negotiation','won'].includes(l.stage)
  ).length;

  const proposalsOut = leads.filter(l =>
    ['proposal_sent','negotiation'].includes(l.stage)
  ).length;

  const contractsSigned = leads.filter(l => l.stage === 'won').length;

  const overdue = leads.filter(l =>
    isOverdue(l.nextFollowUp) && !['won','lost'].includes(l.stage)
  );

  const hot = leads.filter(l => l.temperature === 'Hot' && !['won','lost'].includes(l.stage));

  const dueToday = leads.filter(l => {
    const d = daysUntil(l.nextFollowUp);
    return d !== null && d <= 0 && d >= -1 && !['won','lost'].includes(l.stage);
  });

  const weightedPipeline = active.reduce((sum, l) => {
    const prob = STAGE_PROB[l.stage] || 5;
    return sum + (parseFloat(l.dealValue) || 0) * prob / 100;
  }, 0);

  const expectedRevenue = leads
    .filter(l => l.stage === 'won')
    .reduce((sum, l) => sum + (parseFloat(l.dealValue) || 0), 0);

  const totalPipelineValue = active.reduce((sum, l) =>
    sum + (parseFloat(l.dealValue) || 0), 0);

  // Top overdue leads by score priority
  const overdueTopLeads = [...overdue]
    .sort((a, b) => {
      const scoreA = parseFloat(a.dealValue) || 0;
      const scoreB = parseFloat(b.dealValue) || 0;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  // Leads needing action at hot stages
  const needsActionNow = leads.filter(l =>
    ['site_visit_scheduled','feasibility_sold','negotiation'].includes(l.stage) &&
    !['won','lost'].includes(l.stage)
  );

  return {
    totalLeads:         leads.length,
    qualifiedLeads:     leads.filter(l => ['qualified','site_visit_scheduled','site_visit_completed',
                                           'feasibility_proposed','feasibility_sold','feasibility_delivered',
                                           'proposal_sent','negotiation'].includes(l.stage)).length,
    hotLeads:           hot.length,
    topHotLeads:        hot.slice(0, 3),
    siteVisitsComplete,
    feasibilitySold,
    proposalsOut,
    contractsSigned,
    overdueFollowUps:   overdue.length,
    overdueTopLeads,
    dueToday:           dueToday.length,
    dueTodayLeads:      dueToday.slice(0, 2),
    weightedPipeline,
    expectedRevenue,
    totalPipelineValue,
    needsActionNow,
  };
};

// ── Company Day (computed from start date) ────────────────────────────────────

export const computeCompanyDay = (startDate) => {
  if (!startDate) return 1;
  return Math.max(1, daysSince(startDate));
};

// ── Workload Engine ────────────────────────────────────────────────────────────

export const computeWorkload = (leads) => {
  const active = leads.filter(l => !['lost','nurture'].includes(l.stage));
  let engDemand = 0;
  let salesDemand = 0;

  for (const lead of active) {
    engDemand   += (STAGE_ENG_DEMAND[lead.stage]   || 0);
    salesDemand += (STAGE_SALES_DEMAND[lead.stage] || 1);
  }

  // Add minimum founder baseline (admin, compliance, planning)
  const adminDemand = 10;

  return { engDemand, salesDemand, adminDemand, total: engDemand + salesDemand + adminDemand };
};

// ── Resource Engine ────────────────────────────────────────────────────────────

const CAPACITY = {
  founder:     { eng: 15, sales: 35, admin: 15 },
  engineer:    { eng: 40, sales:  0, admin:  5 },
  technician:  { eng: 10, sales:  0, admin:  5 },
};

export const computeResourceStatus = (workload, headcount) => {
  const { numEngineers = 0, numTechnicians = 0 } = headcount;

  const available = {
    eng:   CAPACITY.founder.eng   + numEngineers   * CAPACITY.engineer.eng   + numTechnicians * CAPACITY.technician.eng,
    sales: CAPACITY.founder.sales,
    admin: CAPACITY.founder.admin + numEngineers   * CAPACITY.engineer.admin + numTechnicians * CAPACITY.technician.admin,
  };

  const engGap   = workload.engDemand   - available.eng;
  const salesGap = workload.salesDemand - available.sales;

  const criticalRoles = [];
  if (engGap > 10)  criticalRoles.push({ role:'Senior Engineer', gap: Math.round(engGap),   unit:'h/week' });
  if (salesGap > 10) criticalRoles.push({ role:'Sales Support',   gap: Math.round(salesGap), unit:'h/week' });

  const founderOverload = (workload.engDemand + workload.salesDemand + workload.adminDemand) > 60;

  return { available, engGap, salesGap, criticalRoles, founderOverload };
};

// ── Hiring Decision Engine ─────────────────────────────────────────────────────

export const computeHiringDecisions = (state) => {
  const { day, headcount, cashProjection, crm, complianceState, strategy } = state;
  const { numEngineers = 0 } = headcount;
  const decisions = [];

  const canAffordEngineer = cashProjection.cash >= (RECOVERY_FLOOR + 22000 * 6);
  const canAffordTech     = cashProjection.cash >= (RECOVERY_FLOOR + 12000 * 6);

  // Engineer — critical from Day 1
  if (numEngineers === 0) {
    const urgency = day >= 30 ? 'critical' : day >= 14 ? 'high' : 'medium';
    const status  = urgency === 'critical' ? 'OVERDUE — HIRE NOW' : 'HIRE IMMEDIATELY';
    decisions.push({
      role: 'Senior Engineer (Grade B)',
      status,
      urgency,
      hire: true,
      salary: 'EGP 18,000–22,000/month',
      reason: day >= 30
        ? `Day ${day}: Every day without an engineer blocks NREA application, site visits, and feasibility studies. This is your #1 blocker.`
        : 'NREA Bronze tier requires a registered engineer (Engineers Syndicate). Post simultaneously: Wuzzuf, LinkedIn, Engineers Syndicate bulletin.',
      condition: 'Must verify: Syndicate membership (EGX #), PVsyst experience, Grid-tie commissioning history.',
      nreaRequired: true,
    });
  } else if (crm.contractsSigned >= 1 && crm.siteVisitsComplete >= 5) {
    decisions.push({
      role: 'Senior Engineer (2nd)',
      status: canAffordEngineer ? 'CONSIDER HIRING' : 'WAIT',
      urgency: 'medium',
      hire: canAffordEngineer,
      salary: 'EGP 18,000–22,000/month',
      reason: 'Execution load on first project + active pipeline creates dual-demand. Only hire if runway > 8 months post-hire.',
      condition: `Current runway: ${fmtEgpShort(cashProjection.cash)}. Required reserve: ${fmtEgpShort(RECOVERY_FLOOR + 22000 * 8)}.`,
    });
  }

  // Electrician/Technician — only after contract signed
  if (crm.contractsSigned >= 1 && headcount.numTechnicians === 0) {
    decisions.push({
      role: 'Electrical Technician',
      status: canAffordTech ? 'HIRE NOW' : 'SUBCONTRACT',
      urgency: 'high',
      hire: canAffordTech,
      salary: 'EGP 8,000–12,000/month',
      reason: 'First project requires installation team. If cash is tight, subcontract this project — evaluate own hire before second project.',
      condition: 'Must be DISCO-registered or working under a DISCO-registered subcontractor.',
    });
  }

  // Admin support — only in normal mode with 2+ active projects
  if (crm.contractsSigned >= 2 && strategy === 'A') {
    decisions.push({
      role: 'Project Coordinator / Admin',
      status: 'PLAN — NOT YET',
      urgency: 'low',
      hire: false,
      salary: 'EGP 7,000–9,000/month',
      reason: 'Document control, NREA reports, invoicing. Plan this for Year 2 when execution load exceeds founder admin capacity.',
      condition: 'Defer until you have 3+ concurrent projects.',
    });
  }

  return decisions;
};

// ── Cash Projection (6-month) ──────────────────────────────────────────────────

export const computeCashProjection = (s, crm) => {
  const { cash, monthlyBurn, headcount } = s;
  const { numEngineers = 0, numTechnicians = 0 } = headcount;

  // Actual burn = base + salaries
  const engSalary  = numEngineers   * 20000;
  const techSalary = numTechnicians * 10000;
  const actualBurn = (monthlyBurn || 75000) + engSalary + techSalary;

  // Expected deposits from active pipeline
  const depositExpected = crm.proposalsOut > 0
    ? crm.proposalsOut * 300000 * 0.30  // rough: 30% of avg 300K deal, probability-weighted
    : 0;

  const milestoneRevenue = crm.contractsSigned * 500000 * 0.70; // final 70% payment on commissioning

  const months = [];
  let balance = Number(cash) || 0;
  let depositCaptured = false;
  let milestoneCaptured = false;

  for (let m = 1; m <= 6; m++) {
    balance -= actualBurn;
    // Assume deposit arrives month 2 if proposals are out
    if (m === 2 && !depositCaptured && depositExpected > 0) {
      balance += depositExpected;
      depositCaptured = true;
    }
    // Assume commissioning milestone month 4 if contract signed
    if (m === 4 && !milestoneCaptured && milestoneRevenue > 0) {
      balance += milestoneRevenue;
      milestoneCaptured = true;
    }
    months.push({ month: m, cash: Math.round(balance) });
  }

  const breachIdx = months.findIndex(m => m.cash < SURVIVAL_FLOOR);
  const runway    = actualBurn > 0 ? (Number(cash) / actualBurn) : 99;

  const mode =
    Number(cash) < ABSOLUTE_FLOOR  ? 'survival' :
    Number(cash) < SURVIVAL_FLOOR  ? 'survival' :
    Number(cash) < RECOVERY_FLOOR  ? 'recovery' : 'normal';

  return {
    cash:         Number(cash) || 0,
    actualBurn,
    months,
    runway:       Math.round(runway * 10) / 10,
    breachMonth:  breachIdx >= 0 ? breachIdx + 1 : null,
    mode,
    fmtCash:      fmtEgpShort(cash),
    fmtBurn:      fmtEgpShort(actualBurn),
  };
};

// ── Compliance Engine ──────────────────────────────────────────────────────────

const getNextNREAReportDate = () => {
  const now   = new Date();
  const year  = now.getFullYear();
  const jan   = new Date(year, 0, 7);   // January week 1
  const jul   = new Date(year, 6, 7);   // July week 1
  const nexts = [jan, jul, new Date(year + 1, 0, 7)].filter(d => d > now);
  return nexts.length > 0 ? nexts[0].toISOString().split('T')[0] : null;
};

export const computeComplianceStatus = (s, day) => {
  const items = [];
  const nreaReportDate = getNextNREAReportDate();
  const nreaReportDays = daysUntil(nreaReportDate);

  // NREA application
  items.push({
    id: 'C-NREA',
    label: 'NREA Qualification Certificate',
    status: s.nreaSubmitted ? 'done' : day >= 60 ? 'critical' : day >= 30 ? 'warn' : 'pending',
    detail: s.nreaSubmitted ? 'Submitted ✓' : `Must submit by Day 60 (Day ${day} now). EGP 5,000 fee.`,
    blocking: !s.nreaSubmitted,
    blockingWhat: 'DISCO grid connection — blocks all project commissioning',
  });

  // EgyptERA
  items.push({
    id: 'C-ERA',
    label: 'EgyptERA Solar Contractor License',
    status: s.egyptERASubmitted ? 'done' : day >= 90 ? 'critical' : day >= 60 ? 'warn' : 'pending',
    detail: s.egyptERASubmitted ? 'Submitted ✓' : `Target Day 90. Required for all grid-connected installations.`,
    blocking: !s.egyptERASubmitted,
    blockingWhat: 'Legal authority to execute grid-tie projects',
  });

  // Bank account
  items.push({
    id: 'C-BANK',
    label: 'Corporate Bank Account',
    status: s.bankAccountOpen ? 'done' : day >= 14 ? 'critical' : 'warn',
    detail: s.bankAccountOpen ? 'Open ✓' : 'Required for client payments and deposit collection.',
    blocking: !s.bankAccountOpen,
    blockingWhat: 'Cannot collect client deposits without business account',
  });

  // Engineer hired
  items.push({
    id: 'C-ENG',
    label: 'Senior Engineer Hired (Syndicate Registered)',
    status: s.engineerHired ? 'done' : day >= 21 ? 'critical' : 'warn',
    detail: s.engineerHired ? 'Hired ✓' : `Target Day 21. Day ${day} now. NREA Bronze requires registered engineer.`,
    blocking: !s.engineerHired,
    blockingWhat: 'NREA application, feasibility studies, all technical work',
  });

  // NREA bi-annual report
  if (s.nreaSubmitted) {
    const reportStatus = nreaReportDays !== null && nreaReportDays < 30 ? 'warn' :
                         nreaReportDays !== null && nreaReportDays < 7  ? 'critical' : 'pending';
    items.push({
      id: 'C-REPORT',
      label: `NREA Bi-Annual Report (${nreaReportDate})`,
      status: s.nreaReportOverdue ? 'critical' : reportStatus,
      detail: s.nreaReportOverdue
        ? 'OVERDUE — certificate cancellation risk. Submit immediately.'
        : nreaReportDays !== null
          ? `Due ${nreaReportDate} (${nreaReportDays}d). Paper + electronic to Head of Technical Affairs.`
          : 'Upcoming — January Week 1 + July Week 1 each year.',
      blocking: s.nreaReportOverdue,
      blockingWhat: 'Missing report = automatic certificate cancellation',
    });
  }

  // FX Alert
  items.push({
    id: 'C-FX',
    label: 'FX Rate Alert (XE.com)',
    status: s.fxAlertActive ? 'done' : day >= 7 ? 'warn' : 'pending',
    detail: s.fxAlertActive ? 'Active ✓' : 'Configure USD/EGP alert ±5% monthly trigger. Required if any proposal is open.',
    blocking: false,
    blockingWhat: null,
  });

  const criticalCount = items.filter(i => i.status === 'critical').length;
  const blocking = items.filter(i => i.blocking);

  return { items, criticalCount, blocking };
};

// ── Mode Engine ────────────────────────────────────────────────────────────────

export const computeMode = (cashProjection, day, crm, compliance) => {
  const { cash, breachMonth } = cashProjection;

  // Survival triggers
  if (cash < ABSOLUTE_FLOOR)                                   return 'survival';
  if (breachMonth !== null && breachMonth <= 1)                return 'survival';
  if (day >= 180 && crm.contractsSigned === 0)                 return 'survival';

  // Recovery triggers
  if (cash < SURVIVAL_FLOOR)                                   return 'recovery';
  if (breachMonth !== null && breachMonth <= 2)                return 'recovery';
  if (day >= 60  && crm.feasibilitySold === 0)                 return 'recovery';
  if (day >= 90  && crm.proposalsOut === 0)                    return 'recovery';
  if (day >= 30  && !compliance.items.find(i => i.id === 'C-ENG' && i.status === 'done')) return 'recovery';
  if (compliance.criticalCount > 0)                            return 'recovery';

  return 'normal';
};

// ── Company State (0–5) ────────────────────────────────────────────────────────

export const computeCompanyState = (day, crm, cash) => {
  if (crm.contractsSigned >= 3 || (crm.contractsSigned >= 1 && crm.proposalsOut >= 2))
    return { level: 4, label: 'Execution Pressure', description: 'Managing active projects + active sales simultaneously. Bandwidth constraint.' };
  if (crm.contractsSigned >= 1)
    return { level: 2, label: 'First Deal', description: 'First contract secured. Execution is the constraint. Keep pipeline warm in parallel.' };
  if (crm.proposalsOut >= 1 || crm.feasibilitySold >= 1)
    return { level: 1, label: 'Pipeline Building', description: 'Active commercial pipeline. Revenue is visible. Close the funnel.' };
  if (crm.totalLeads >= 10 && crm.qualifiedLeads >= 2)
    return { level: 1, label: 'Pipeline Building', description: 'Building qualified pipeline. Target: 30 leads, 8 site visits, 3 proposals.' };
  if (day < 30 && crm.totalLeads < 10)
    return { level: 0, label: 'Foundation Stage', description: 'Building infrastructure: legal, compliance, engineer, CRM pipeline.' };
  return { level: 0, label: 'No Revenue Yet', description: 'Foundation stage incomplete or pipeline not building fast enough.' };
};

// ── Break-Next Engine (forward-looking risks) ──────────────────────────────────

export const computeBreakNext = (day, crm, cashProjection, compliance, mode) => {
  const risks = [];

  // Cash risks
  if (cashProjection.breachMonth !== null) {
    risks.push({
      id: 'BN-CASH',
      urgency: cashProjection.breachMonth <= 2 ? 'critical' : 'high',
      title: `Cash hits survival floor in Month ${cashProjection.breachMonth}`,
      description: `At ${fmtEgpShort(cashProjection.actualBurn)}/month burn, cash reaches ${fmtEgpShort(SURVIVAL_FLOOR)} floor in ${cashProjection.breachMonth} month${cashProjection.breachMonth > 1 ? 's' : ''}.`,
      action: 'Accelerate pipeline to first deposit. Activate overdraft now as insurance.',
    });
  }

  // Month-6 gate
  if (day >= 150 && crm.contractsSigned === 0) {
    const daysToGate = 180 - day;
    risks.push({
      id: 'BN-M6',
      urgency: daysToGate <= 14 ? 'critical' : 'high',
      title: `Month-6 gate in ${daysToGate} days`,
      description: `Day 180 = hard strategy review gate. No contracts by then → freeze all non-critical spending and reassess.`,
      action: 'Either close a negotiation this week or prepare gate review documentation.',
    });
  }

  // NREA blocking
  const nreaItem = compliance.items.find(i => i.id === 'C-NREA');
  if (nreaItem && nreaItem.status !== 'done') {
    risks.push({
      id: 'BN-NREA',
      urgency: day >= 60 ? 'critical' : 'high',
      title: 'NREA certificate not obtained — first project cannot connect to grid',
      description: 'DISCO will not connect any solar installation without NREA qualification. This blocks all commissioning revenue.',
      action: 'Submit NREA Bronze dossier immediately. Engineer CV required — if not hired, submit with consultant workaround.',
    });
  }

  // Overdue follow-ups destroying pipeline
  if (crm.overdueFollowUps >= 4) {
    risks.push({
      id: 'BN-CRM',
      urgency: 'high',
      title: `${crm.overdueFollowUps} overdue follow-ups — pipeline velocity dropping`,
      description: 'Leads go cold after 14 days without contact. Overdue follow-ups signal a pipeline management breakdown.',
      action: `Open CRM → follow-up the ${Math.min(crm.overdueFollowUps, 3)} highest-value overdue leads today.`,
    });
  }

  // No hot leads
  if (crm.hotLeads === 0 && crm.totalLeads >= 10) {
    risks.push({
      id: 'BN-HOT',
      urgency: 'medium',
      title: 'No hot leads — pipeline missing urgency signals',
      description: 'All leads are Cold or Warm. Without a hot lead, contract probability drops sharply.',
      action: 'Run a 3-call sprint: your top 5 qualified leads. Goal: upgrade one to Hot this week.',
    });
  }

  // Stalled feasibility studies
  if (crm.feasibilitySold > 0) {
    const fsLeads = []; // we'd need lead data here but this is a signal
    risks.push({
      id: 'BN-FS',
      urgency: 'medium',
      title: `${crm.feasibilitySold} feasibility studies sold — delivery pace is critical`,
      description: 'Client trust decays fast after deposit payment. Delayed delivery = lost contract.',
      action: 'Confirm delivery date is within 14 days of deposit collection. Track in Trello daily.',
    });
  }

  // NREA report imminent
  const reportItem = compliance.items.find(i => i.id === 'C-REPORT');
  if (reportItem && (reportItem.status === 'warn' || reportItem.status === 'critical')) {
    risks.push({
      id: 'BN-REPORT',
      urgency: reportItem.status,
      title: 'NREA bi-annual report deadline approaching',
      description: 'Missing this report cancels the NREA certificate with no grace period. Second miss = permanent bar.',
      action: 'Prepare report now: all projects, capacities, costs, locations, component specs. Submit paper + electronic.',
    });
  }

  // Sort: critical → high → medium
  const order = { critical: 0, high: 1, medium: 2 };
  risks.sort((a, b) => (order[a.urgency] || 3) - (order[b.urgency] || 3));

  return risks.slice(0, 4);
};

// ── Decision Engine (the most important output) ───────────────────────────────

export const computePrimaryDecision = (day, crm, cashProjection, compliance, mode, headcount) => {
  const cash    = cashProjection.cash;
  const breach  = cashProjection.breachMonth;

  // Priority 1: Existential cash crisis
  if (cash < ABSOLUTE_FLOOR) return {
    id: 'D-ABSOLUTE',
    urgency: 'critical',
    category: 'SURVIVAL',
    question: 'Cash below survival floor. Immediate action required.',
    context: `${fmtEgpShort(cash)} remaining. This is below the EGP 83K absolute floor. The company cannot meet payroll next month.`,
    options: [
      { label: 'Activate overdraft + freeze ALL spending',
        detail: 'Call bank now. Suspend all discretionary OpEx within 24h. No new commitments. Daily cash tracking.' },
      { label: 'Full pivot to Strategy C (zero procurement exposure)',
        detail: 'Contact licensed EPC firms today. Offer deal introductions for 5–6% commission. No capital required.' },
    ],
  };

  // Priority 2: Cash breach imminent (1–2 months)
  if (breach !== null && breach <= 2 && crm.contractsSigned === 0) return {
    id: 'D-BREACH',
    urgency: 'critical',
    category: 'CASH',
    question: `Cash hits survival floor in Month ${breach}. Close a deal or pivot?`,
    context: `Burn: ${fmtEgpShort(cashProjection.actualBurn)}/month. No contract signed. If no deposit arrives before Month ${breach}, survival mode is mandatory.`,
    options: [
      { label: 'Emergency close: accept 25% deposit on any active negotiation',
        detail: 'Minimum 25% (not 30%) is acceptable in this scenario only. Close within 10 days or invoke gate.' },
      { label: 'Activate overdraft + shift to Strategy C pipeline in parallel',
        detail: 'Buy 3 months runway via overdraft. Build zero-cost commission pipeline immediately.' },
    ],
  };

  // Priority 3: Month-6 gate
  if (day >= 180 && crm.contractsSigned === 0) return {
    id: 'D-M6GATE',
    urgency: 'critical',
    category: 'STRATEGY',
    question: 'Month-6 gate triggered. Continue or controlled wind-down?',
    context: 'Day 180 with no signed contract. This is the hard stop defined at company launch. Choose one — delay means drift.',
    options: [
      { label: 'Invoke gate: freeze + 5-day strategy review',
        detail: 'Halt all hires and subscriptions. Assess: Strategy C pivot, additional capital injection, or controlled wind-down. No extensions without new capital.' },
      { label: '30-day final push (no extensions)',
        detail: '3 specific pipeline targets. Daily founder review. Zero new OpEx. Hard deadline Day 210 — no exceptions.' },
    ],
  };

  // Priority 4: No revenue by Day 60 — strategy mismatch
  if (day >= 60 && crm.feasibilitySold === 0 && mode !== 'normal') return {
    id: 'D-STRAT60',
    urgency: 'critical',
    category: 'STRATEGY',
    question: 'No paid feasibility revenue by Day 60. Strategy mismatch?',
    context: 'Two possible causes: pricing is too high, or EPC model requires credibility you haven\'t built yet. Both demand a response today.',
    options: [
      { label: 'Reduce feasibility fee + offer as EPC credit',
        detail: 'Drop from EGP 5K to EGP 3K. Position as credit against final EPC contract. Deadline: Day 75, then auto-pivot.' },
      { label: 'Pivot to Strategy C: zero-capital commission model',
        detail: 'Stop asking clients to pay for feasibility. Offer free assessment. Earn 5–6% commission from licensed EPC partners on deal close.' },
    ],
  };

  // Priority 5: Engineer not hired past Day 21
  if (headcount.numEngineers === 0 && day >= 21) return {
    id: 'D-ENG21',
    urgency: 'high',
    category: 'HIRING',
    question: `Day ${day}: No engineer hired. Block all technical work or hire at any cost?`,
    context: 'Every day without an engineer means no site visits, no feasibility studies, no NREA application. Pipeline is stalling.',
    options: [
      { label: 'Raise offer +EGP 3K/month + activate all channels today',
        detail: 'Post simultaneously: Wuzzuf, LinkedIn, Engineers Syndicate. Set 48h response deadline. Target: Grade B with PVsyst experience.' },
      { label: 'Hire consulting engineer part-time (EGP 3K–5K/site visit)',
        detail: 'Unblocks site visits and NREA dossier while search continues. Contract scope: site assessments + feasibility sign-off only.' },
    ],
  };

  // Priority 6: Active negotiation needs deposit decision
  if (crm.proposalsOut > 0 && day >= 90) return {
    id: 'D-DEPO',
    urgency: 'high',
    category: 'COMMERCIAL',
    question: `${crm.proposalsOut} proposal${crm.proposalsOut > 1 ? 's' : ''} out. How to close?`,
    context: 'Proposals that sit without follow-up lose 50% probability every 2 weeks. Define your close strategy now.',
    options: [
      { label: 'In-person close meeting this week — bring FX clause + deposit slip',
        detail: 'Book meeting with decision maker. Present updated irradiance model. Walk out with signed terms or clear objection list.' },
      { label: 'Offer 48-hour deadline on current pricing',
        detail: 'State FX clause: prices valid 48h before EGP adjustment clause activates. Creates urgency without a discount.' },
    ],
  };

  // Priority 7: NREA not submitted at Day 30+
  if (!compliance.items.find(i => i.id === 'C-NREA' && i.status === 'done') && day >= 30) return {
    id: 'D-NREA30',
    urgency: 'high',
    category: 'COMPLIANCE',
    question: 'Submit NREA application now (even if engineer not yet hired)?',
    context: 'DISCO will not connect any installation without NREA certificate. Waiting costs revenue. Submitting gets you in the queue.',
    options: [
      { label: 'Submit now with available documents + get reference number',
        detail: 'NREA allows supplementary submissions. Pay EGP 5K fee today. Add engineer CV when hired. Reference number activates the process.' },
      { label: 'Wait until engineer is onboard (max Day 45)',
        detail: 'Engineer CV improves Bronze score. If no engineer by Day 45, submit without it — score hit is less costly than delay.' },
    ],
  };

  // No critical decision pending
  return {
    id: 'D-EXEC',
    urgency: 'low',
    category: 'EXECUTION',
    question: 'No critical decisions pending.',
    context: 'System is in execution mode. Maintain pipeline velocity and weekly KPI review.',
    options: [],
  };
};

// ── Today's Action Stack ────────────────────────────────────────────────────────

export const computeTodayActions = (day, crm, compliance, mode, headcount) => {
  const actions = [];

  const add = (id, label, type, urgency, context = '') =>
    actions.push({ id, label, type, urgency, context, done: false });

  // SURVIVAL mode: revenue + cash only
  if (mode === 'survival') {
    add('S1', 'Call bank — activate overdraft facility TODAY', 'CRITICAL', 'critical', 'Emergency cash buffer. No excuses.');
    if (crm.proposalsOut > 0) add('S2', `Close ${crm.proposalsOut} open proposal(s) — accept 25% deposit minimum`, 'REVENUE', 'critical', 'Survival threshold.');
    add('S3', 'Contact 3 licensed EPC firms — offer deal introduction (5% commission)', 'REVENUE', 'critical', 'Strategy C pivot costs nothing.');
    add('S4', 'Audit all subscriptions — cancel every non-essential payment NOW', 'CRITICAL', 'critical', 'Freeze non-revenue OpEx.');
    if (crm.overdueFollowUps > 0) add('S5', `Call ${Math.min(crm.overdueFollowUps, 5)} overdue leads — offer free site visit`, 'REVENUE', 'critical', 'Free visit converts faster in cash crisis.');
    return actions.slice(0, 5);
  }

  // Compliance blockers (always first if critical)
  const engComp = compliance.items.find(i => i.id === 'C-ENG');
  if (engComp && engComp.status === 'critical') {
    add('C-ENG', `OVERDUE: Post senior engineer job on Wuzzuf + LinkedIn + Engineers Syndicate today`, 'CRITICAL', 'critical',
      `Day ${day}. Every day without engineer blocks NREA, site visits, feasibility.`);
  }

  const bankComp = compliance.items.find(i => i.id === 'C-BANK');
  if (bankComp && bankComp.status !== 'done') {
    add('C-BANK', 'Open corporate bank account — CIB or NBE Business (2 signatories)', 'CRITICAL', 'critical',
      'Cannot collect client deposits without business account.');
  }

  const nreaComp = compliance.items.find(i => i.id === 'C-NREA');
  if (nreaComp && nreaComp.status === 'critical') {
    add('C-NREA', 'Submit NREA Bronze dossier — pay EGP 5K fee, get reference number', 'CRITICAL', 'critical',
      'Blocking all project commissioning. No grace period.');
  }

  // Revenue pipeline actions — CRM-specific
  if (crm.overdueFollowUps > 0) {
    const leadName = crm.overdueTopLeads[0]?.orgName || 'overdue leads';
    add('R-FU', `Follow up ${crm.overdueFollowUps} overdue lead${crm.overdueFollowUps > 1 ? 's' : ''} — start with ${leadName}`, 'REVENUE', 'high',
      'Pipeline velocity drops 50% after 14 days without contact.');
  }

  if (crm.needsActionNow.length > 0) {
    const lead = crm.needsActionNow[0];
    const actionMap = {
      site_visit_scheduled: `Confirm site visit logistics for ${lead.orgName} — bring meter + checklist`,
      feasibility_sold:     `Progress feasibility study for ${lead.orgName} — 14-day delivery window`,
      negotiation:          `Book in-person close meeting with ${lead.orgName} — bring deposit terms`,
    };
    add('R-ACTION', actionMap[lead.stage] || `Action required: ${lead.orgName}`, 'REVENUE', 'high',
      `Stage: ${lead.stage.replace(/_/g, ' ')}. Deal value: ${fmtEgpShort(lead.dealValue)}`);
  }

  // Site visits — if qualified leads exist and no visits scheduled
  if (crm.qualifiedLeads >= 2 && crm.siteVisitsComplete < 8) {
    add('R-VISIT', `Book 2–3 site visits this week (${crm.siteVisitsComplete}/8 done) — review electricity bill on-site`, 'REVENUE', 'high',
      'Visit-to-study conversion: ~40%. Target 8 visits to yield 3 feasibility studies.');
  }

  // Feasibility to proposal conversion
  if (crm.feasibilitySold >= 1 && crm.proposalsOut === 0) {
    add('R-PROP', 'Deliver feasibility report in person — push to EPC proposal in same meeting', 'REVENUE', 'high',
      '48h window after delivery is highest conversion moment. Have proposal draft ready.');
  }

  // Lead building
  if (crm.totalLeads < 30) {
    add('R-LEADS', `Add ${30 - crm.totalLeads} C&I accounts to CRM — target >EGP 15K/month electricity bills`, 'REVENUE', 'medium',
      `Currently ${crm.totalLeads}/30. Factories, farms, schools, malls — all segments.`);
  }

  // FX alert
  const fxComp = compliance.items.find(i => i.id === 'C-FX');
  if (fxComp && fxComp.status !== 'done') {
    add('C-FX', 'Configure USD/EGP rate alert on XE.com (±5% monthly trigger → founder phone)', 'CRITICAL', 'medium',
      'Open proposals are at FX risk without this. 5-minute setup.');
  }

  // NREA report
  const reportComp = compliance.items.find(i => i.id === 'C-REPORT');
  if (reportComp && (reportComp.status === 'warn' || reportComp.status === 'critical')) {
    add('C-REPORT', 'Prepare NREA bi-annual report — all projects, costs, equipment specs', 'CRITICAL', reportComp.status,
      'Missing report cancels certificate. Submit paper + electronic to Head of Technical Affairs.');
  }

  // Sort priority: critical REVENUE > critical CRITICAL > high REVENUE > high CRITICAL > medium
  const score = (a) => {
    const uScore = { critical: 100, high: 50, medium: 20 }[a.urgency] || 0;
    const tScore = a.type === 'REVENUE' ? 5 : 0;
    return uScore + tScore;
  };
  actions.sort((a, b) => score(b) - score(a));

  return actions.slice(0, 5);
};

// ── Do-Not List ────────────────────────────────────────────────────────────────

export const computeDoNotList = (day, crm, cashProjection, mode, headcount) => {
  const items = [];

  if (mode !== 'normal' || headcount.numEngineers === 0) {
    items.push({
      action: 'Hire a second engineer',
      reason: 'You cannot afford the cost AND you don\'t have enough execution volume to justify it yet.',
    });
  }

  items.push({
    action: 'Sign a contract without a minimum 30% deposit',
    reason: 'You cannot order equipment without deposit cleared. Signing without one creates a cash trap.',
  });

  items.push({
    action: 'Send an EPC proposal without an FX escalation clause',
    reason: 'Panel prices are denominated in USD. If EGP moves 5%+, your margin disappears completely.',
  });

  if (crm.contractsSigned === 0) {
    items.push({
      action: 'Purchase inventory or panels speculatively',
      reason: 'Never hold inventory without a signed contract and deposit. FX exposure + storage cost + capital lock-up.',
    });
  }

  if (mode === 'survival' || mode === 'recovery') {
    items.push({
      action: 'Start admin or process improvement work',
      reason: `In ${mode} mode, only revenue-generating tasks are permitted. All else is suspended.`,
    });
  }

  if (day < 60) {
    items.push({
      action: 'Pursue government tenders before private sector is proven',
      reason: 'Government tenders require NREA certificate, bid bond, and 90-day decision cycles. Private sector closes 10× faster.',
    });
  }

  return items.slice(0, 4);
};

// ── MASTER COMPUTE FUNCTION ────────────────────────────────────────────────────

export const computeFullState = (fosState, leads) => {
  const day           = computeCompanyDay(fosState.startDate);
  const crm           = computeCRMSummary(leads);
  const workload      = computeWorkload(leads);
  const resource      = computeResourceStatus(workload, fosState.headcount || {});
  const cashProjection= computeCashProjection(fosState, crm);
  const compliance    = computeComplianceStatus(fosState, day);
  const mode          = computeMode(cashProjection, day, crm, compliance);
  const companyState  = computeCompanyState(day, crm, cashProjection.cash);
  const breakNext     = computeBreakNext(day, crm, cashProjection, compliance, mode);
  const primaryDecision = computePrimaryDecision(day, crm, cashProjection, compliance, mode, fosState.headcount || {});
  const todayActions  = computeTodayActions(day, crm, compliance, mode, fosState.headcount || {});
  const doNotList     = computeDoNotList(day, crm, cashProjection, mode, fosState.headcount || {});
  const hiring        = computeHiringDecisions({ day, headcount: fosState.headcount || {}, cashProjection, crm, complianceState: compliance, strategy: fosState.strategy || 'A' });

  return {
    day, crm, workload, resource, cashProjection,
    compliance, mode, companyState,
    breakNext, primaryDecision, todayActions, doNotList, hiring,
  };
};

// ── Exports ────────────────────────────────────────────────────────────────────

export { fmtEgp, fmtEgpShort, todayStr, daysUntil, isOverdue };

export const INIT_FOS_STATE = {
  startDate:        '',          // ISO date — company incorporation date
  strategy:         'A',         // A | B | C
  cash:             2000000,
  monthlyBurn:      75000,
  headcount: {
    numEngineers:   0,
    numTechnicians: 0,
  },
  // Compliance milestones
  bankAccountOpen:    false,
  engineerHired:      false,
  lawyerEngaged:      false,
  nreaSubmitted:      false,
  egyptERASubmitted:  false,
  fxAlertActive:      false,
  depositCollected:   false,
  discoSubmitted:     false,
  overdraftActive:    false,
  depositRefused:     false,
  nreaReportOverdue:  false,
};
