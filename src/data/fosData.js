// ─── FOUNDER OPERATING SYSTEM — CORE LOGIC ───────────────────────────────────

export const INIT_FOS_STATE = {
  day:                       1,
  cash:                      2000000,
  engineerHired:             false,
  bankAccountOpen:           false,
  lawyerEngaged:             false,
  nreaSubmitted:             false,
  egyptERASubmitted:         false,
  fxAlertActive:             false,
  leadsInCRM:                0,
  siteVisitsCompleted:       0,
  paidFeasibilityStudies:    0,
  proposalsSubmitted:        0,
  activeNegotiations:        0,
  contractsSigned:           0,
  depositCollected:          false,
  discoSubmitted:            false,
  overdraftActive:           false,
  depositRefused:            false,
  nreaReportOverdue:         false,
};

// ─── MODE ENGINE ──────────────────────────────────────────────────────────────
// SURVIVAL → RECOVERY → NORMAL (highest match wins)

export const computeMode = (s) => {
  if (s.cash < 83000)                                              return 'survival';
  if (s.day > 180 && s.contractsSigned === 0)                     return 'survival';
  if (s.depositRefused && s.contractsSigned === 0)                 return 'survival';
  if (s.cash < 200000)                                             return 'recovery';
  if (s.day >= 60  && s.paidFeasibilityStudies === 0)              return 'recovery';
  if (s.day >= 90  && s.proposalsSubmitted === 0)                  return 'recovery';
  if (s.day >= 30  && !s.engineerHired)                            return 'recovery';
  if (s.nreaReportOverdue)                                         return 'recovery';
  return 'normal';
};

// ─── ALERT ENGINE ─────────────────────────────────────────────────────────────

export const computeAlerts = (s) => {
  const a = [];

  if (s.nreaReportOverdue)
    a.push({ id:'AL-0', level:'critical', msg:'NREA bi-annual report OVERDUE — certificate cancellation risk', action:'Submit immediately. No grace period. Second miss = certificate cancellation.' });
  if (s.cash < 83000)
    a.push({ id:'AL-1', level:'critical', msg:`EMERGENCY: Cash at ${fmtEgp(s.cash)} — below survival floor`, action:'Freeze ALL discretionary spend within 24h. Suspend non-critical salaries. Prepare exit scenario.' });
  if (s.cash >= 83000 && s.cash < 200000)
    a.push({ id:'AL-2', level:'critical', msg:`Cash at ${fmtEgp(s.cash)} — Month 7 gap risk is LIVE`, action:'Activate bank overdraft now. Stop all new OpEx. Shift pipeline to Strategy C (zero procurement exposure).' });
  if (s.depositRefused)
    a.push({ id:'AL-3', level:'critical', msg:'Client refused deposit — walk-away protocol triggered', action:'Do not proceed under any pressure. Document in CRM. Move pipeline focus to next prospect immediately.' });
  if (s.day >= 180 && s.contractsSigned === 0)
    a.push({ id:'AL-4', level:'critical', msg:'MONTH 6 GATE: Day 180 reached with zero contracts', action:'Invoke gate now: freeze hires, cancel subscriptions, strategy review within 5 days.' });
  if (s.day >= 130 && s.contractsSigned === 0)
    a.push({ id:'AL-5', level:'critical', msg:`Day ${s.day}: No contract signed — Month 6 gate approaching`, action:'Stop all equipment procurement. No order without cleared deposit. Invoke gate if Day 180 arrives.' });
  if (s.day >= 60 && !s.nreaSubmitted)
    a.push({ id:'AL-6', level:'critical', msg:'NREA application not submitted past Day 60 deadline', action:'Emergency compliance review. DISCO will not connect any installation without NREA cert. Block all further commercial work.' });
  if (s.day >= 60 && s.paidFeasibilityStudies === 0)
    a.push({ id:'AL-7', level:'critical', msg:'No feasibility revenue by Day 60 — market acceptance unproven', action:'Immediately review pricing. Offer EPC credit-against-fee. Expand prospect targeting criteria.' });
  if (s.day >= 21 && !s.engineerHired)
    a.push({ id:'AL-8', level:'high', msg:`Engineer not hired — Day ${s.day} (deadline was Day 21)`, action:'Raise salary offer EGP 3K/month. Post simultaneously on Wuzzuf + LinkedIn + Engineers Syndicate today.' });
  if (s.day >= 30 && s.leadsInCRM < 30)
    a.push({ id:'AL-9', level:'high', msg:`Only ${s.leadsInCRM} leads in CRM (need 30 by Day 30)`, action:'Activate all referral sources. MEP consultants, accountants, bank managers. Expand before any further outreach.' });
  if (s.day >= 90 && s.proposalsSubmitted === 0)
    a.push({ id:'AL-10', level:'high', msg:'No EPC proposals submitted by Day 90', action:'Stop admin tasks. All energy on commercial pipeline. Consider invoking Month 6 gate review.' });
  if (!s.fxAlertActive && (s.proposalsSubmitted > 0 || s.day >= 30))
    a.push({ id:'AL-11', level:'medium', msg:'FX alert not configured — open proposals at currency risk', action:'Configure XE.com alert to founder phone. Requote all open proposals if EGP moves ±5% in a month.' });

  return a;
};

// ─── TODAY'S TASK ENGINE ──────────────────────────────────────────────────────
// Returns max 5, ordered: overdue revenue → overdue critical → active revenue → active critical

export const computeTodayTasks = (s, mode) => {
  const pool = [];

  const add = (id, label, type, overdue) => pool.push({ id, label, type, overdue: !!overdue });

  // SURVIVAL: revenue + cash preservation only
  if (mode === 'survival') {
    if (!s.overdraftActive)       add('S-OD',   'Call bank — activate EGP 200K overdraft facility TODAY', 'CRITICAL', true);
    if (s.activeNegotiations > 0) add('S-CLOSE','Close active contract negotiation — accept 25% deposit minimum', 'REVENUE', true);
    add('S-STRAT', 'Contact 3 licensed solar EPC firms — offer deal introduction (Strategy C commission)', 'REVENUE', true);
    add('S-OPEX',  'Audit all outgoing payments — cancel every non-essential subscription now', 'CRITICAL', true);
    if (s.paidFeasibilityStudies === 0) add('S-CALL', 'Call 10 warm prospects: offer free site visit this week', 'REVENUE', true);
    return pool.slice(0, 5);
  }

  // Overdue critical blockers (any mode)
  if (!s.bankAccountOpen)
    add('T-BANK', 'Open corporate bank account — CIB or NBE Business (2 signatories, EGP 2M)', 'CRITICAL', s.day > 14);
  if (!s.engineerHired)
    add('T-ENG', s.day > 21
      ? `OVERDUE: Raise salary +EGP 3K/month — post engineer hire on all 3 platforms NOW`
      : 'Post senior engineer job: Wuzzuf + LinkedIn + Engineers Syndicate (Day 1 action)', 'CRITICAL', s.day > 21);
  if (!s.lawyerEngaged)
    add('T-LAW', 'Engage corporate lawyer — confirm scope of EPC + O&M templates in writing', 'CRITICAL', s.day > 14);
  if (!s.fxAlertActive)
    add('T-FX', 'Configure USD/EGP rate alert on XE.com → founder phone (±5% monthly trigger)', 'CRITICAL', s.day > 7);

  // Revenue pipeline
  if (s.leadsInCRM < 30)
    add('T-LEADS', `Add ${Math.max(1, 30 - s.leadsInCRM)} C&I accounts to CRM (>EGP 15K/month electricity bills)`, 'REVENUE', s.day > 30);
  if (s.siteVisitsCompleted < 8 && s.leadsInCRM >= 5)
    add('T-VISIT', `Book 3 site visits this week — review electricity bill on-site (${s.siteVisitsCompleted}/8 done)`, 'REVENUE', s.day > 45 && s.siteVisitsCompleted < 5);
  if (s.paidFeasibilityStudies === 0 && s.siteVisitsCompleted >= 2)
    add('T-STUDY', 'Convert best site visit to paid feasibility study — collect payment before analysis starts', 'REVENUE', s.day > 45);
  if (s.paidFeasibilityStudies > 0 && s.proposalsSubmitted < 2)
    add('T-PROP', 'Deliver feasibility report in person and push client toward EPC proposal', 'REVENUE', s.day > 70);
  if (s.proposalsSubmitted > 0 && s.contractsSigned === 0)
    add('T-CLOSE', 'Follow up on open proposal — move to contract negotiation this week', 'REVENUE', s.day > 110);
  if (s.activeNegotiations > 0 && !s.depositCollected)
    add('T-DEPO', 'Confirm 30% deposit cleared before ordering any equipment (no exceptions)', 'REVENUE', true);

  // Compliance (deprioritized in recovery mode unless blocking)
  const compOk = mode === 'normal' || pool.length < 3;
  if (compOk && !s.nreaSubmitted && s.day > 30)
    add('T-NREA', 'Submit NREA qualification dossier — Bronze tier (EGP 5K fee, get reference number)', 'CRITICAL', s.day > 60);
  if (compOk && !s.egyptERASubmitted && s.day > 60)
    add('T-ERA', 'File EgyptERA solar EPC contractor license application', 'CRITICAL', s.day > 90);
  if (compOk && !s.discoSubmitted && s.contractsSigned > 0)
    add('T-DISCO', 'Submit DISCO net-metering application — get reference number today', 'CRITICAL', true);

  // Sort: overdue first, then REVENUE over CRITICAL
  pool.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return  1;
    if (a.type === 'REVENUE' && b.type !== 'REVENUE') return -1;
    if (a.type !== 'REVENUE' && b.type === 'REVENUE') return  1;
    return 0;
  });

  return pool.slice(0, 5);
};

// ─── DECISION ENGINE ──────────────────────────────────────────────────────────

export const computeDecision = (s, mode) => {
  if (s.day >= 180 && s.contractsSigned === 0) return {
    id: 'D-M6', urgency: 'critical',
    question: 'Invoke Month 6 Gate — continue or controlled wind-down?',
    context: 'Day 180 reached with no signed contract. This is the hard stop defined in the business plan. You must decide today.',
    options: [
      { label: 'Invoke gate: freeze and review', detail: 'Freeze all hires and subscriptions now. Founder strategy review within 5 days. Evaluate: Strategy C pivot, additional capital, or wind-down.' },
      { label: 'Final 30-day push only', detail: 'Define 3 specific pipeline targets. Daily founder review. Zero new OpEx until contract signed. Hard deadline Day 210 — no extensions.' },
    ],
  };

  if (mode === 'survival' && !s.overdraftActive) return {
    id: 'D-OD', urgency: 'critical',
    question: 'Activate overdraft or pivot to zero-cash Strategy C?',
    context: `Cash is at ${fmtEgp(s.cash)}. Emergency protocol is live. You need a path chosen today — not tomorrow.`,
    options: [
      { label: 'Activate bank overdraft', detail: 'Call bank relationship manager today. Request EGP 200K overdraft. Stop all non-critical OpEx. Track cash daily.' },
      { label: 'Full pivot to Strategy C', detail: 'Freeze all procurement. Build commission-only pipeline. Contact licensed EPC firms for deal introductions. Zero cash exposure until next deposit.' },
    ],
  };

  if (s.day >= 60 && s.paidFeasibilityStudies === 0) return {
    id: 'D-STRAT', urgency: 'critical',
    question: 'Shift to Strategy C (commission model) now?',
    context: 'No paid feasibility revenue by Day 60. Either pricing is wrong, targeting is off, or the EPC model is premature for your current standing.',
    options: [
      { label: 'Pivot to Strategy C now', detail: 'Drop procurement exposure. Offer deal introductions to licensed EPC firms for 3–5% commission per MW. Zero capital required.' },
      { label: 'Stay — final review first', detail: 'Drop feasibility fee to EGP 3K. Offer as EPC credit. Expand prospect list to 50 accounts. Absolute deadline: Day 75, then auto-pivot.' },
    ],
  };

  if (s.day >= 21 && !s.engineerHired) return {
    id: 'D-ENG', urgency: 'high',
    question: 'Raise engineer salary offer immediately?',
    context: `Day ${s.day} with no engineer. EgyptERA Grade B is a hard blocker for NREA qualification and all technical work.`,
    options: [
      { label: 'Yes — raise EGP 3K/month + post everywhere now', detail: 'Post updated salary on Wuzzuf + LinkedIn + Syndicate simultaneously today. Set 48h response deadline.' },
      { label: 'Expand search before raising', detail: 'Contact Engineers Syndicate directly for referrals. Post in engineering WhatsApp groups. Interim: hire part-time consultant to unblock NREA dossier.' },
    ],
  };

  if (s.activeNegotiations > 0 && !s.depositCollected && s.contractsSigned === 0) return {
    id: 'D-DEPO', urgency: 'high',
    question: 'Active negotiation: accept 25% deposit to close?',
    context: 'Standard minimum is 30%. Reducing to 25% is allowed only for high-value clients. Below 25% is a walk-away.',
    options: [
      { label: 'Hold 30% minimum — walk if refused', detail: 'Non-negotiable per plan. Without 30% deposit, you cannot order equipment without personal cash exposure. Walk-away protocol if refused.' },
      { label: 'Accept 25% for this client only', detail: 'Only if contract value >EGP 1.5M or client is anchor tenant for referrals. Requires written founder approval. Document exception in CRM.' },
    ],
  };

  if (!s.nreaSubmitted && s.day >= 30) return {
    id: 'D-NREA', urgency: 'high',
    question: 'Submit NREA application now (even if engineer not yet hired)?',
    context: 'DISCO will not connect any installation without NREA cert. Every day without it is direct revenue risk.',
    options: [
      { label: 'Submit now with available documents', detail: 'NREA allows supplementary submissions. Pay EGP 5K review fee and get reference number today. Add engineer CV when hired.' },
      { label: 'Wait until engineer is onboard', detail: 'Engineer CV is required for Bronze tier score. Maximum wait: Day 45. If engineer not hired by then, submit without CV and accept lower score.' },
    ],
  };

  return {
    id: 'D-NONE', urgency: 'low',
    question: 'No critical decisions pending',
    context: 'System is in execution mode. Maintain pipeline velocity and weekly KPI reviews.',
    options: [],
  };
};

// ─── SIMPLIFIED TASK BUCKETS ──────────────────────────────────────────────────

export const INIT_FOS_TASKS = [
  // ACTIVE — top 5 execution priorities
  { id:'FA-01', name:'Open corporate bank account (CIB/NBE, 2 signatories, EGP 2M)', type:'critical', bucket:'active',   done:false, dueDay:14  },
  { id:'FA-02', name:'Post engineer hire: Wuzzuf + LinkedIn + Engineers Syndicate',   type:'critical', bucket:'active',   done:false, dueDay:21  },
  { id:'FA-03', name:'Engage corporate lawyer — EPC + O&M + feasibility templates',  type:'critical', bucket:'active',   done:false, dueDay:14  },
  { id:'FA-04', name:'Build CRM list: 30 C&I accounts with >EGP 15K/month bills',    type:'revenue',  bucket:'active',   done:false, dueDay:30  },
  { id:'FA-05', name:'Configure FX rate alert on XE.com → founder phone',            type:'critical', bucket:'active',   done:false, dueDay:7   },
  // PIPELINE
  { id:'FP-01', name:'Qualify 3 panel + 3 inverter suppliers (IEC certs on file)',   type:'critical', bucket:'pipeline', done:false, dueDay:45  },
  { id:'FP-02', name:'Complete 8 qualifying site visits',                             type:'revenue',  bucket:'pipeline', done:false, dueDay:60  },
  { id:'FP-03', name:'Sell 3 paid feasibility studies (collect payment first)',       type:'revenue',  bucket:'pipeline', done:false, dueDay:70  },
  { id:'FP-04', name:'Install PVsyst license — engineer confirms operational',        type:'critical', bucket:'pipeline', done:false, dueDay:45  },
  { id:'FP-05', name:'Prepare NREA Bronze dossier and submit (EGP 5K fee)',          type:'critical', bucket:'pipeline', done:false, dueDay:75  },
  { id:'FP-06', name:'Prequalify 2 installation subcontractors (DISCO-registered)',   type:'critical', bucket:'pipeline', done:false, dueDay:60  },
  { id:'FP-07', name:'Submit 2 formal EPC proposals (min EGP 27K/kW)',               type:'revenue',  bucket:'pipeline', done:false, dueDay:90  },
  { id:'FP-08', name:'Apply for bank overdraft facility EGP 200–300K',               type:'critical', bucket:'pipeline', done:false, dueDay:75  },
  { id:'FP-09', name:'File EgyptERA solar EPC contractor license application',        type:'critical', bucket:'pipeline', done:false, dueDay:90  },
  { id:'FP-10', name:'Deliver 3 feasibility reports in person (not by email)',        type:'revenue',  bucket:'pipeline', done:false, dueDay:90  },
  // BACKLOG
  { id:'FB-01', name:'Negotiate and sign first EPC contract (all 9 clauses, FX)',     type:'revenue',  bucket:'backlog',  done:false, dueDay:130 },
  { id:'FB-02', name:'Collect 30% client deposit — confirm cleared before ordering',  type:'revenue',  bucket:'backlog',  done:false, dueDay:130 },
  { id:'FB-03', name:'Submit DISCO net-metering application (get reference number)',   type:'critical', bucket:'backlog',  done:false, dueDay:131 },
  { id:'FB-04', name:'Place equipment order same day deposit clears',                  type:'critical', bucket:'backlog',  done:false, dueDay:131 },
  { id:'FB-05', name:'All pre-install quality gates signed off by engineer',           type:'critical', bucket:'backlog',  done:false, dueDay:135 },
  { id:'FB-06', name:'Electrical installation — 4-phase engineer sign-off',           type:'critical', bucket:'backlog',  done:false, dueDay:160 },
  { id:'FB-07', name:'Commissioning: yield ≥90% PVsyst, all protection tested',       type:'critical', bucket:'backlog',  done:false, dueDay:168 },
  { id:'FB-08', name:'Client acceptance certificate signed (safety snags cleared)',    type:'revenue',  bucket:'backlog',  done:false, dueDay:175 },
  { id:'FB-09', name:'Sign O&M contract at commissioning — before leaving site',      type:'revenue',  bucket:'backlog',  done:false, dueDay:175 },
  { id:'FB-10', name:'Issue final invoice same day as acceptance (60-day clock)',      type:'revenue',  bucket:'backlog',  done:false, dueDay:175 },
  { id:'FB-11', name:'Submit NREA bi-annual report — January Week 1',                 type:'critical', bucket:'backlog',  done:false, dueDay:365 },
  { id:'FB-12', name:'Submit NREA bi-annual report — July Week 1',                    type:'critical', bucket:'backlog',  done:false, dueDay:545 },
];

export const fmtEgp = (n) => `EGP ${Number(n).toLocaleString('en-EG')}`;
