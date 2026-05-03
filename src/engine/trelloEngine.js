// ─── TRELLO EXECUTION ENGINE ──────────────────────────────────────────────────
// The brain (fosEngine) produces decisions → this layer converts them to Trello
// cards. It also syncs completed cards back to update CRM + system state.
//
// Architecture:
//   fosEngine output → generateTasks() → task queue
//   task queue + user click → pushToTrello()
//   Trello webhook/poll → syncCompletedTasks() → CRM + state updates

const TRELLO_BASE = 'https://api.trello.com/1';

// ── Task type definitions ─────────────────────────────────────────────────────

export const TASK_TYPES = {
  SALES:      { label:'Sales',      color:'#1E7E34', trelloColor:'green'  },
  TECHNICAL:  { label:'Technical',  color:'#1A6B72', trelloColor:'sky'    },
  COMPLIANCE: { label:'Compliance', color:'#856404', trelloColor:'orange' },
  EXECUTION:  { label:'Execution',  color:'#5C2D91', trelloColor:'purple' },
  HIRING:     { label:'Hiring',     color:'#C0392B', trelloColor:'red'    },
};

export const LIST_TARGETS = {
  'this-week':   { label:'This Week',    trelloName:'🔴 This Week',    priority: 1 },
  'in-progress': { label:'In Execution', trelloName:'🔵 In Execution', priority: 0 },
  'backlog':     { label:'Queued',       trelloName:'📋 Queued',        priority: 2 },
};

// ── Role definitions ───────────────────────────────────────────────────────────
// Trello label name uses '→ ' prefix to distinguish from task-type labels.
// When a real employee joins Trello they are assigned as a board member and
// the role label is removed in bulk — zero friction transition.

export const ROLE_LABELS = {
  FOUNDER:     { label:'Founder',      trelloName:'→ Founder',      color:'#856404', trelloColor:'yellow'       },
  ENGINEER:    { label:'Engineer',     trelloName:'→ Engineer',     color:'#1A6B72', trelloColor:'blue'         },
  SALES_REP:   { label:'Sales Rep',    trelloName:'→ Sales Rep',    color:'#1E7E34', trelloColor:'lime'         },
  ACCOUNTANT:  { label:'Accountant',   trelloName:'→ Accountant',   color:'#C0392B', trelloColor:'pink'         },
  PROCUREMENT: { label:'Procurement',  trelloName:'→ Procurement',  color:'#5C2D91', trelloColor:'orange' },
  TECHNICIAN:  { label:'Technician',   trelloName:'→ Technician',   color:'#555',    trelloColor:'sky'    },
};

// ── Assignment logic ───────────────────────────────────────────────────────────
// Returns { primary: ROLE_KEY, secondary: ROLE_KEY | null }
// Rule: critical or high priority → Founder always secondary unless already primary

export const getTaskAssignees = (task) => {
  const { id, type, source, priority } = task;

  let primary = 'FOUNDER';
  let secondary = null;

  if (id === 'C-BANK') {
    primary = 'FOUNDER'; secondary = 'ACCOUNTANT';
  } else if (id === 'C-NREA' || (source === 'compliance' && /nrea/i.test(id))) {
    primary = 'FOUNDER'; secondary = 'ENGINEER';
  } else if (id === 'C-FX') {
    primary = 'FOUNDER'; secondary = 'ACCOUNTANT';
  } else if (id === 'C-ENG' || source === 'hiring' || type === 'HIRING') {
    primary = 'FOUNDER'; secondary = null;
  } else if (source === 'decision') {
    primary = 'FOUNDER'; secondary = null;
  } else if (/disco/i.test(id)) {
    primary = 'FOUNDER'; secondary = 'ENGINEER';
  } else if (/deposit/i.test(id)) {
    primary = 'FOUNDER'; secondary = 'ACCOUNTANT';
  } else if (/order/i.test(id)) {
    primary = 'PROCUREMENT'; secondary = 'FOUNDER';
  } else if (type === 'TECHNICAL') {
    primary = 'ENGINEER'; secondary = 'FOUNDER';
  } else if (type === 'SALES') {
    primary = 'SALES_REP'; secondary = null;
  } else if (type === 'EXECUTION') {
    primary = 'ENGINEER'; secondary = null;
  } else if (type === 'COMPLIANCE') {
    primary = 'FOUNDER'; secondary = 'ENGINEER';
  }

  // Critical/high override: Founder always present unless already assigned
  if ((priority === 'critical' || priority === 'high') && primary !== 'FOUNDER' && !secondary) {
    secondary = 'FOUNDER';
  }

  return { primary, secondary };
};

// ── Task schema factory ────────────────────────────────────────────────────────

const task = (id, title, desc, type, priority, listTarget, dueInDays, source, sourceRef, onComplete = {}) => {
  const t = {
    id, title, description: desc, type, priority,
    listTarget,   // 'this-week' | 'in-progress' | 'backlog'
    dueInDays,
    source,       // 'crm' | 'decision' | 'hiring' | 'compliance'
    sourceRef,
    onComplete,
    pushed: false, trelloCardId: null, completed: false, createdAt: Date.now(),
  };
  t.assignees = getTaskAssignees(t);
  return t;
};

// ── Next CRM stage map ────────────────────────────────────────────────────────

const NEXT_STAGE = {
  site_visit_scheduled:  'site_visit_completed',
  site_visit_completed:  'feasibility_proposed',
  feasibility_proposed:  'feasibility_sold',
  feasibility_sold:      'feasibility_delivered',
  feasibility_delivered: 'proposal_sent',
  proposal_sent:         'negotiation',
  negotiation:           'won',
};

// ── CRM sales chain definition ────────────────────────────────────────────────
// Single source of truth for stage ordering, step labels, and chain context
// blocks embedded in every task description.

const CRM_CHAIN = [
  { stage: 'site_visit_scheduled',  label: 'Site visit' },
  { stage: 'site_visit_completed',  label: 'Propose feasibility study' },
  { stage: 'feasibility_proposed',  label: 'Close feasibility study sale' },
  { stage: 'feasibility_sold',      label: 'Deliver feasibility study' },
  { stage: 'feasibility_delivered', label: 'Send EPC proposal' },
  { stage: 'proposal_sent',         label: 'Follow up on proposal' },
  { stage: 'negotiation',           label: 'Close contract' },
];

// Returns { step: '[N/6] ', ctx: '\n\n── Sales Chain...' }
const crmChain = (currentStage) => {
  const idx   = CRM_CHAIN.findIndex(s => s.stage === currentStage);
  if (idx < 0) return { step: '', ctx: '' };
  const total = CRM_CHAIN.length;
  const lines = CRM_CHAIN.map((s, i) => {
    const marker = i < idx ? '✓' : i === idx ? '→' : ' ';
    return `${marker} ${i + 1}/${total}  ${s.label}`;
  }).join('\n');
  return {
    step: `[${idx + 1}/${total}] `,
    ctx:  `\n\n── Sales Chain ─────────────────────────────\n${lines}\n         → Execution tracks unlock on contract close`,
  };
};

// Pre-built execution chain context blocks for won-stage tasks.
const WON_CHAIN_DEPOSIT =
  `\n\n── Execution Chain ─────────────────────────\n` +
  `Track A — Sequential (deposit-gated)\n` +
  `→ A1  Collect 30% deposit\n` +
  `  A2  Submit DISCO application      ⟵ unlocks after deposit received\n` +
  `  A2  Place equipment order         ⟵ unlocks after deposit received\n\n` +
  `Track B — Parallel (start now)\n` +
  `→ B1  Brief engineer & confirm mobilization\n\n` +
  `⚡ Mark deposit milestone Received in Projects tab\n` +
  `   → DISCO + Equipment Order tasks appear in Trello automatically`;

const WON_CHAIN_ENG =
  `\n\n── Execution Chain ─────────────────────────\n` +
  `Track A — Sequential (deposit-gated)\n` +
  `  A1  Collect 30% deposit           ← in progress\n` +
  `  A2  Submit DISCO application      ⟵ unlocks after deposit received\n` +
  `  A2  Place equipment order         ⟵ unlocks after deposit received\n\n` +
  `Track B — Parallel\n` +
  `→ B1  Brief engineer & confirm mobilization`;

const WON_CHAIN_POST_DEPOSIT =
  `\n\n── Execution Chain ─────────────────────────\n` +
  `Track A — Sequential\n` +
  `✓ A1  Collect 30% deposit\n` +
  `→ A2  Submit DISCO application\n` +
  `→ A2  Place equipment order\n\n` +
  `Track B — Parallel\n` +
  `  B1  Brief engineer & confirm mobilization`;

// ── TASK GENERATION ────────────────────────────────────────────────────────────
// Takes fosEngine output + raw leads → returns array of pending tasks
// Only generates tasks that don't already exist in the pushed queue

export const generateTasks = (engineState, leads, pushedTasks = []) => {
  const tasks  = [];
  const pushed = new Set(pushedTasks.map(t => t.id));

  const add = (t) => { if (!pushed.has(t.id)) tasks.push(t); };

  // Load projects once — used for won-stage deposit gating and project governance
  const allProjs = (() => { try { return JSON.parse(localStorage.getItem('projects_v1') || '[]'); } catch { return []; } })();

  const { day, crm, compliance, hiring, primaryDecision, mode } = engineState;

  // Compliance lookup for structural gates — keyed by item id (e.g. 'C-NREA', 'C-DISCO-REG')
  const compMap = Object.fromEntries((compliance?.items || []).map(i => [i.id, i]));

  // ── 1. CRM-driven tasks (per lead stage) ──────────────────────────────────
  // Each description is pre-filled from the Stage Dossier so the person
  // executing the task has every relevant field without opening another tab.

  for (const lead of leads) {
    const name  = lead.orgName || lead.id;
    const value = lead.dealValue ? ` (EGP ${Number(lead.dealValue).toLocaleString()})` : '';
    const kw    = lead.systemSizeKW ? ` · ${lead.systemSizeKW}kW` : '';

    // Decision-maker contact — injected into every actionable card so the
    // card is self-contained and can be actioned without opening the CRM.
    const contactLine = (() => {
      const parts = [
        lead.contactPerson,
        lead.contactRole,
        lead.contactPhone  && `📞 ${lead.contactPhone}`,
        lead.contactEmail  && `✉ ${lead.contactEmail}`,
      ].filter(Boolean);
      return parts.length ? `\nDM contact: ${parts.join(' · ')}` : '';
    })();

    // Stage Dossier shortcuts — available whenever the dossier has been filled
    const sd     = lead.stageData || {};
    const sCont  = sd.contacted               || {};
    const sQual  = sd.qualified               || {};
    const sSvSch = sd.site_visit_scheduled    || {};
    const sSv    = sd.site_visit_completed    || {};
    const sFs    = sd.feasibility_sold        || {};
    const sFd    = sd.feasibility_delivered   || {};
    const sPs    = sd.proposal_sent           || {};
    const sNeg   = sd.negotiation             || {};
    const sWon   = sd.won                     || {};

    if (lead.stage === 'site_visit_scheduled') {
      const timeSlot  = sSvSch.scheduledDate  ? `\nScheduled: ${sSvSch.scheduledDate}${sSvSch.scheduledTime?' @ '+sSvSch.scheduledTime:''}` : '';
      const address   = sSvSch.siteAddress    ? `\nAddress: ${sSvSch.siteAddress}` : '';
      const onSiteCt  = sSvSch.onSiteContactName ? `\nOn-site contact: ${sSvSch.onSiteContactName}${sSvSch.onSiteContactPhone?' / '+sSvSch.onSiteContactPhone:''}` : '';
      const access    = sSvSch.accessNotes    ? `\nAccess: ${sSvSch.accessNotes}` : '';
      const billLine  = sQual.monthlyBillConfirmedEGP
        ? `\nConfirmed bill: EGP ${Number(sQual.monthlyBillConfirmedEGP).toLocaleString()}/mo${sQual.tariffCategory?' · '+sQual.tariffCategory:''}`
        : (lead.monthlyBill ? `\nEstimated bill: EGP ${Number(lead.monthlyBill).toLocaleString()}/mo` : '');
      const phaseConf = sQual.gridPhase       ? `\nGrid phase: ${sQual.gridPhase}` : '';
      const dmLine    = sCont.decisionMakerName ? `\nDecision maker: ${sCont.decisionMakerName}${sCont.decisionMakerRole?' ('+sCont.decisionMakerRole+')':''}` : '';
      const diesel    = sQual.existingDiesel  ? `\n⚠ Diesel generator on-site — assess hybrid/battery potential` : '';
      const { step: s1, ctx: c1 } = crmChain('site_visit_scheduled');
      add(task(
        `crm-visit-${lead.id}`,
        `${s1}Site visit — ${name}`,
        `Conduct qualifying site visit.${timeSlot}${address}${onSiteCt}${access}${contactLine}${billLine}${phaseConf}${dmLine}${diesel}\nSystem: ${lead.systemSizeKW||'?'}kW${value}.\nBring: smartphone meter app, tape measure, ≥10 photos, load data request, site checklist.\nGoal: roof area + shading + DISCO + electrical panel rating + confirm decision maker present.${c1}`,
        'SALES', 'high', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'site_visit_completed' }
      ));
    }

    if (lead.stage === 'site_visit_completed') {
      const recSize   = sSv.recommendedSizeKwp    ? `\nRecommended size from visit: ${sSv.recommendedSizeKwp} kWp` : '';
      const annSav    = sSv.estimatedAnnualSavingsEGP ? `\nEst. annual savings: EGP ${Number(sSv.estimatedAnnualSavingsEGP).toLocaleString()} — anchor for study fee` : '';
      const payback   = sSv.roughPaybackYears     ? `\nRough payback: ~${sSv.roughPaybackYears} yr` : '';
      const shading   = sSv.shadingRisk && sSv.shadingRisk !== 'None' ? `\n⚠ Shading: ${sSv.shadingRisk}${sSv.shadingNotes?' — '+sSv.shadingNotes:''}` : '';
      const netMeter  = sSv.netMeteringEligible   ? `\n✓ Net metering eligible (${sSv.disco||'DISCO TBC'})` : (sSv.disco ? `\nDISCO: ${sSv.disco}` : '');
      const { step: s2, ctx: c2 } = crmChain('site_visit_completed');
      add(task(
        `crm-propose-fs-${lead.id}`,
        `${s2}Propose paid feasibility study — ${name}`,
        `Site visit done. Follow up within 48h.${contactLine}${recSize}${annSav}${payback}${shading}${netMeter}\nFee: EGP 3,000–5,000 (credit against EPC contract). Issue invoice on confirmation.\nCollect deposit before analysis starts.${c2}`,
        'SALES', 'high', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_proposed' }
      ));
    }

    if (lead.stage === 'feasibility_proposed') {
      const recSize   = sSv.recommendedSizeKwp        ? `\nRecommended size from visit: ${sSv.recommendedSizeKwp} kWp` : '';
      const annSav    = sSv.estimatedAnnualSavingsEGP  ? `\nEst. annual savings: EGP ${Number(sSv.estimatedAnnualSavingsEGP).toLocaleString()} — anchor for study fee` : '';
      const payback   = sSv.roughPaybackYears          ? `\nRough payback: ~${sSv.roughPaybackYears} yr` : '';
      const netMeter  = sSv.netMeteringEligible        ? `\n✓ Net metering eligible — include in ROI pitch` : '';
      const { step: sFp, ctx: cFp } = crmChain('feasibility_proposed');
      add(task(
        `crm-close-fs-${lead.id}`,
        `${sFp}Close feasibility study sale — ${name}`,
        `Feasibility proposed. Follow up to collect payment and confirm scope.${contactLine}${recSize}${annSav}${payback}${netMeter}\nFee: EGP 3,000–5,000 (credited against EPC contract).\nCollect deposit before analysis starts. Issue invoice on verbal confirmation.\nGoal: deposit received + delivery date agreed this week.${cFp}`,
        'SALES', 'high', 'this-week', 5, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_sold' }
      ));
    }

    if (lead.stage === 'feasibility_sold') {
      const deposit   = sFs.depositCollectedEGP  ? `\nDeposit: EGP ${Number(sFs.depositCollectedEGP).toLocaleString()} (${sFs.paymentMethod||'method TBC'})` : '';
      const deadline  = sFs.deliveryPromisedBy   ? `\nDeadline: ${sFs.deliveryPromisedBy} — HARD` : '';
      const assignee  = sFs.assignedTo           ? `\nAssigned to: ${sFs.assignedTo}` : '';
      const pvSize    = sSv.recommendedSizeKwp   ? `\n• Size: ${sSv.recommendedSizeKwp} kWp` : (lead.systemSizeKW ? `\n• Size: ${lead.systemSizeKW} kWp` : '');
      const pvRoof    = sSv.roofType             ? `\n• Roof: ${sSv.roofType}, ${sSv.usableAreaM2||'?'}m², Az ${sSv.azimuthDeg||'?'}°, Tilt ${sSv.tiltDeg||'?'}°` : '';
      const pvShading = sSv.shadingRisk          ? `\n• Shading: ${sSv.shadingRisk}` : '';
      const pvConsump = sSv.avgMonthlyKwh        ? `\n• Consumption: ${sSv.avgMonthlyKwh} kWh/mo · Peak: ${sSv.peakDemandKva||'?'} kVA · ${sSv.operatingProfile||''}` : '';
      const pvDisco   = sSv.disco                ? `\n• DISCO: ${sSv.disco} · ${sSv.gridPhaseConfirmed||''} · ${sSv.feederVoltage||''}` : '';
      const pvTariff  = sQual.tariffCategory     ? `\n• Tariff: ${sQual.tariffCategory}` : '';
      const { step: s3, ctx: c3 } = crmChain('feasibility_sold');
      add(task(
        `crm-deliver-fs-${lead.id}`,
        `${s3}Deliver feasibility study — ${name}`,
        `Feasibility deposit received. Deliver within 14 days.${contactLine}${deposit}${deadline}${assignee}\n\nPVsyst inputs:${pvSize}${pvRoof}${pvShading}${pvConsump}${pvDisco}${pvTariff}\n\nDeliverable: PVsyst report, yield, payback, IRR, FX clause notice.\nDeliver IN PERSON — not by email. Push EPC proposal in the same meeting.${c3}`,
        'TECHNICAL', 'critical', 'in-progress', 14, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_delivered' }
      ));
    }

    if (lead.stage === 'feasibility_delivered') {
      const finalSize = sFd.finalSizeKwp         ? `\nFinal size: ${sFd.finalSizeKwp} kWp` : '';
      const pbLine    = sFd.simplePaybackYears    ? `\nPayback: ${sFd.simplePaybackYears} yr · IRR: ${sFd.irr||'—'}%` : '';
      const npvLine   = sFd.npvEGP               ? `\nNPV: EGP ${Number(sFd.npvEGP).toLocaleString()}` : '';
      const equip     = sFd.panelBrandModel       ? `\nEquipment: ${sFd.panelBrandModel}${sFd.inverterBrandModel?' / '+sFd.inverterBrandModel:''}` : '';
      const clientFb  = sFd.clientFeedback        ? `\nClient reaction: "${sFd.clientFeedback.slice(0,100)}"` : '';
      const nmLine    = sSv.netMeteringEligible   ? `\n✓ Net metering eligible — include in ROI` : '';
      const fxLine    = sPs.fxClause === true ? `\n✓ FX clause already in proposal` : `\n⚠ Ensure FX escalation clause is in the proposal`;
      const { step: s4, ctx: c4 } = crmChain('feasibility_delivered');
      add(task(
        `crm-proposal-${lead.id}`,
        `${s4}Send EPC proposal — ${name}`,
        `Feasibility delivered. Send EPC proposal within 48h.${contactLine}${finalSize}${pbLine}${npvLine}${equip}${clientFb}${nmLine}${fxLine}\nMust include: FX escalation clause · 30% deposit requirement · IEC-certified BOM · Performance guarantee.${c4}`,
        'SALES', 'critical', 'this-week', 2, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'proposal_sent' }
      ));
    }

    if (lead.stage === 'proposal_sent') {
      const ctVal     = sPs.contractValueEGP     ? `\nContract value: EGP ${Number(sPs.contractValueEGP).toLocaleString()}` : (value ? `\nEst. deal value:${value}` : '');
      const validLine = sPs.validUntil           ? `\nValid until: ${sPs.validUntil} — use as close lever` : '';
      const fxLine    = sPs.fxClause === true ? `\n✓ FX clause included` : `\n⚠ No FX clause — add immediately in any revision`;
      const termsLine = sPs.paymentTerms         ? `\nPayment terms: ${sPs.paymentTerms}` : '';
      const objLine   = sQual.objections         ? `\nKnown objections: ${sQual.objections.slice(0,100)}` : '';
      const fbLine    = sFd.clientFeedback        ? `\nFeasibility reaction: "${sFd.clientFeedback.slice(0,80)}"` : '';
      const { step: s5, ctx: c5 } = crmChain('proposal_sent');
      add(task(
        `crm-followup-prop-${lead.id}`,
        `${s5}Follow up on EPC proposal — ${name}`,
        `Proposal sent. Follow up 2×/week.${contactLine}${ctVal}${validLine}${fxLine}${termsLine}${objLine}${fbLine}\nStrategy: in-person meeting with irradiance model. If no response in 10 days: invoke 48h FX validity notice.${c5}`,
        'SALES', 'high', 'this-week', 5, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'negotiation' }
      ));
    }

    if (lead.stage === 'negotiation') {
      const ctVal     = sPs.contractValueEGP     ? `\nCurrent value: EGP ${Number(sPs.contractValueEGP).toLocaleString()}` : (value ? `\nEst. value:${value}` : '');
      const stickLine = sNeg.mainStickingPoints  ? `\nSticking points: ${sNeg.mainStickingPoints.slice(0,120)}` : '';
      const concLine  = sNeg.concessionsMade     ? `\nConcessions so far: ${sNeg.concessionsMade.slice(0,100)}` : '';
      const marginLine= sNeg.marginImpactEGP     ? `\n⚠ Margin reduced EGP ${Number(sNeg.marginImpactEGP).toLocaleString()} already` : '';
      const revLine   = sNeg.revisedProposalSent ? `\n✓ Revised proposal already sent` : '';
      const fxLine    = sPs.fxClause === true ? `\n✓ FX clause confirmed` : `\n⚠ No FX clause — non-negotiable: must be in final contract`;
      const { step: s6, ctx: c6 } = crmChain('negotiation');
      add(task(
        `crm-close-${lead.id}`,
        `${s6}Close contract — ${name}${value}`,
        `Active negotiation. Book in-person meeting this week.${contactLine}${ctVal}${stickLine}${concLine}${marginLine}${revLine}${fxLine}\nFloor: 30% deposit (25% absolute minimum for deals >EGP 1.5M).\nBring: signed contract template, deposit invoice, FX clause explainer.\nWalk away if deposit refused.${c6}`,
        'SALES', 'critical', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'won' }
      ));
    }

    // ── Proposal expiry alert ─────────────────────────────────────────────────
    if ((lead.stage === 'proposal_sent' || lead.stage === 'negotiation') && sPs.validUntil) {
      const today      = new Date().toISOString().split('T')[0];
      const daysLeft   = Math.round((new Date(sPs.validUntil) - new Date(today)) / 86400000);
      if (daysLeft <= 5) {
        const expired    = daysLeft < 0;
        const ctVal      = sPs.contractValueEGP ? ` · EGP ${Number(sPs.contractValueEGP).toLocaleString()}` : value;
        add(task(
          `prop-expiry-${lead.id}`,
          `Proposal ${expired ? 'EXPIRED' : `expiring in ${daysLeft}d`} — ${name}${ctVal}`,
          `Proposal validity ${expired ? `expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft)!==1?'s':''} ago` : `expires ${sPs.validUntil} (${daysLeft} day${daysLeft!==1?'s':''})`}.\nLead: ${name}${contactLine}\nProposal ref: ${sPs.proposalRef || '—'}\n${expired ? '⚠ EXPIRED: Send revised proposal immediately or client may disengage.\nOptions: extend validity (add 30 days), or use expiry as close lever: "Our pricing changes tomorrow — ready to sign?"' : 'Action: Call client today. Use expiry as urgency lever.\nScript: "Our current pricing is valid until ' + sPs.validUntil + '. Equipment costs are rising — shall we lock this in?"'}`,
          'SALES', expired ? 'critical' : 'high', 'this-week', 0, 'crm', lead.id,
          { crmLeadId: lead.id }
        ));
      }
    }

    if (lead.stage === 'won') {
      const contractRef = sWon.contractRef     ? ` (${sWon.contractRef})` : '';
      const kickoff     = sWon.kickoffDate     ? `\nKickoff date: ${sWon.kickoffDate}` : '';
      const ctVal       = sPs.contractValueEGP ? `\nContract value: EGP ${Number(sPs.contractValueEGP).toLocaleString()}` : (value ? `\nEst. value:${value}` : '');

      // Check if deposit milestone is received in the linked project.
      // DISCO and procurement are gated on this — they must not exist on the
      // board before cleared funds are confirmed, as ordering without deposit
      // is a cash-flow and counterparty risk.
      const linkedProj      = allProjs.find(p => p.linkedLeadId === lead.id);
      const depositReceived = !!(linkedProj?.milestones?.some(
        m => m.label.toLowerCase().includes('deposit') && m.status === 'received'
      ));

      // Track A step 1 — always fires immediately on contract win
      add(task(
        `exec-deposit-${lead.id}`,
        `[Exec A1] Collect 30% deposit — ${name}`,
        `Contract signed${contractRef}. Confirm deposit cleared before ANY equipment order or DISCO submission.${contactLine}${ctVal}${kickoff}\nIssue deposit invoice immediately. No procurement without cleared funds.${WON_CHAIN_DEPOSIT}`,
        'EXECUTION', 'critical', 'in-progress', 2, 'crm', lead.id,
        { fosStateUpdate: { depositCollected: true } }
      ));

      // Track B — parallel, no deposit dependency
      const engBrief   = sWon.engineerBrief        ? `\nEngineer brief: ${sWon.engineerBrief}` : '';
      const roofLine   = sSv.roofType              ? `\nRoof: ${sSv.roofType}, ${sSv.usableAreaM2||'?'}m², Az ${sSv.azimuthDeg||'?'}°, Tilt ${sSv.tiltDeg||'?'}°` : '';
      const shadingMob = sSv.shadingRisk && sSv.shadingRisk !== 'None' ? `\n⚠ Shading: ${sSv.shadingRisk}${sSv.shadingNotes?' — '+sSv.shadingNotes:''}` : '';
      const brkrLine   = sSv.mainBreakerAmps       ? `\nMain breaker: ${sSv.mainBreakerAmps}A · DB: ${sSv.dbPanelBrand||'TBC'}` : '';
      const gridLine   = sSv.gridPhaseConfirmed    ? `\nGrid: ${sSv.gridPhaseConfirmed} · ${sSv.feederVoltage||'voltage TBC'}` : '';
      const facilsLine = sSv.facilitiesContactName ? `\nOn-site contact: ${sSv.facilitiesContactName}${sSv.facilitiesContactPhone?' / '+sSv.facilitiesContactPhone:''}` : '';
      // Warn if no technician is on the team yet — installation cannot proceed without one
      const techWarn   = (hiring || []).some(h => h.role.includes('Technician'))
        ? `\n⚠ No technician or subcontractor confirmed — arrange installation team before mobilisation date`
        : '';
      add(task(
        `exec-eng-brief-${lead.id}`,
        `[Exec B1] Brief engineer & confirm mobilization — ${name}`,
        `Contract won. Brief engineer and lock mobilization date.${contactLine}${kickoff}${engBrief}${roofLine}${shadingMob}${brkrLine}${gridLine}${facilsLine}${techWarn}\nConfirm: PPE on-site, installation permits ready, equipment delivery date aligns with mobilization.${WON_CHAIN_ENG}`,
        'TECHNICAL', 'critical', 'in-progress', 1, 'crm', lead.id,
        {}
      ));

      // Track A step 2 — only after deposit is marked Received in Projects tab.
      // Additionally gated on NREA certificate + DISCO contractor pre-registration:
      // DISCO rejects applications from non-certified and non-pre-registered contractors.
      // The 5-second leads poll in ControlCenter re-reads projects_v1, so these
      // tasks appear in the Trello queue automatically within 5s of the update.
      if (depositReceived) {
        const nreaCertDone = compMap['C-NREA']?.status === 'done';
        const discoPreDone = compMap['C-DISCO-REG']?.status === 'done';

        const discoName  = sSv.disco || 'DISCO';
        const nmStatus   = sSv.netMeteringEligible === true
          ? `\n✓ Net metering eligibility confirmed at site visit`
          : `\n⚠ Net metering eligibility not confirmed — verify with ${discoName} before submitting`;
        const sysSpec    = sFd.finalSizeKwp || sSv.recommendedSizeKwp || lead.systemSizeKW;
        const sysLine    = sysSpec ? `\nSystem: ${sysSpec} kWp — prepare spec sheet` : '';
        const addrLine   = sSvSch.siteAddress ? `\nSite: ${sSvSch.siteAddress}` : '';
        const panelSpec  = sFd.panelBrandModel ? `\nPanel for spec sheet: ${sFd.panelBrandModel}` : '';
        const feederLine = sSv.feederVoltage   ? `\nFeeder: ${sSv.feederVoltage} · ${sSv.gridPhaseConfirmed||'phase TBC'}` : '';

        if (nreaCertDone && discoPreDone) {
          add(task(
            `exec-disco-${lead.id}`,
            `[Exec A2] Submit ${discoName} net-metering application — ${name}`,
            `Deposit confirmed. Submit ${discoName} application now.${nmStatus}${sysLine}${addrLine}${panelSpec}${feederLine}\nDocuments: system spec sheet, site plan, NREA certificate copy, commercial register.\nGet reference number — log in CRM notes.${WON_CHAIN_POST_DEPOSIT}`,
            'COMPLIANCE', 'critical', 'this-week', 1, 'crm', lead.id,
            { fosStateUpdate: { discoSubmitted: true } }
          ));
        } else {
          // Surface a blocked notice — same prune effect auto-archives this when gates clear
          add(task(
            `exec-disco-blocked-${lead.id}`,
            `[Exec A2] DISCO application blocked — complete compliance first — ${name}`,
            `Deposit received. DISCO submission blocked by missing compliance prerequisites.\n\n── Compliance Prerequisites ─────────────────\n${nreaCertDone ? '✓' : '→'} NREA qualification certificate (DISCO rejects applications without it)\n${discoPreDone ? '✓' : '→'} DISCO contractor pre-registration (company must be on approved contractor list)\n  Submit ${discoName} net-metering application\n\nMark prerequisites done in Setup → Compliance. DISCO task appears automatically.${WON_CHAIN_POST_DEPOSIT}`,
            'COMPLIANCE', 'critical', 'this-week', 0, 'crm', lead.id,
            {}
          ));
        }

        const panelLine = sFd.panelBrandModel     ? `\nPanels: ${sFd.panelBrandModel}` : '';
        const invLine   = sFd.inverterBrandModel  ? `\nInverter: ${sFd.inverterBrandModel}` : '';
        const pcLine    = sSv.estimatedPanelCount ? `\nPanel count: ~${sSv.estimatedPanelCount} × 400W` : '';
        const sizeProc  = sFd.finalSizeKwp || sSv.recommendedSizeKwp || lead.systemSizeKW;
        const sizeLine  = sizeProc ? `\nSystem: ${sizeProc} kWp` : '';
        add(task(
          `exec-procure-${lead.id}`,
          `[Exec A2] Place equipment order — ${name}`,
          `Deposit confirmed. Place orders now.${sizeLine}${panelLine}${invLine}${pcLine}\nLead times: panels 3–4 weeks, inverters 2–3 weeks, BOS 1–2 weeks.\nLock panel price within 72h of contract signature. Collect IEC certificates with every order.${WON_CHAIN_POST_DEPOSIT}`,
          'EXECUTION', 'critical', 'this-week', 1, 'crm', lead.id,
          {}
        ));
      }
    }

    // Overdue follow-ups regardless of stage
    if (lead.nextFollowUp && lead.nextFollowUp < new Date().toISOString().split('T')[0] &&
        !['won','lost','nurture'].includes(lead.stage)) {
      const id = `crm-overdue-${lead.id}`;
      if (!pushed.has(id)) {
        const dmLine    = sCont.decisionMakerName ? ` · DM: ${sCont.decisionMakerName}` : '';
        const budgetLine= sCont.budgetIndication  ? `\nBudget: ${sCont.budgetIndication}` : '';
        const needsLine = sCont.needsSummary      ? `\nNeeds: ${sCont.needsSummary.slice(0,100)}` : '';
        add(task(
          id,
          `Follow up — ${name} [OVERDUE]`,
          `Follow-up is overdue.${contactLine}${dmLine}\nNext action: ${lead.nextAction || 'contact lead'}.\nStage: ${lead.stage.replace(/_/g,' ')}.${budgetLine}${needsLine}`,
          'SALES', 'high', 'this-week', 0, 'crm', lead.id,
          {}
        ));
      }
    }
  }

  // ── 2. Compliance-driven tasks ─────────────────────────────────────────────

  const compItems = compliance?.items || [];

  for (const item of compItems) {
    if (item.status === 'done') continue;

    if (item.id === 'C-BANK' && item.status !== 'done') {
      add(task(
        'comp-bank', 'Open corporate bank account (CIB or NBE Business)',
        'Required for client deposits and payments.\nBring: commercial register, articles of incorporation, 2 signatories.\nRequest: current account + overdraft facility EGP 200K–300K.',
        'COMPLIANCE', 'critical', 'this-week', 3, 'compliance', 'C-BANK',
        { fosStateUpdate: { bankAccountOpen: true } }
      ));
    }

    if (item.id === 'C-ENG' && item.status !== 'done') {
      add(task(
        'comp-eng-hire', 'Post senior engineer job — Wuzzuf + LinkedIn + Engineers Syndicate',
        `Post simultaneously on all 3 platforms today.\nRequirements: Grade B, Syndicate registered, PVsyst experience, grid-tie commissioning.\nSalary range: EGP 18,000–22,000/month.\nAsk for: CV + Syndicate card number + references.`,
        'HIRING', 'critical', 'this-week', 1, 'compliance', 'C-ENG',
        { fosStateUpdate: { engineerHired: false } } // update manually when hired
      ));
    }

    if (item.id === 'C-NREA' && item.status !== 'done') {
      // NREA requires: bank account (capital proof), Syndicate company registration,
      // and a Syndicate-registered engineer CV. Gate on all three.
      const bankDone = compItems.some(i => i.id === 'C-BANK' && i.status === 'done');
      const engDone  = compItems.some(i => i.id === 'C-ENG'  && i.status === 'done');
      const syndDone = compMap['C-SYND']?.status === 'done';
      if (bankDone && engDone && syndDone) {
        add(task(
          'comp-nrea', 'Submit NREA Bronze qualification dossier',
          'Required for all DISCO connections. No certificate = no revenue.\nFee: EGP 5,000 (Bronze) + EGP 5,000 review.\nDocuments: commercial register, capital proof, Syndicate company registration, engineer CV (Syndicate), equipment specs.\nSubmit paper + electronic to NREA Technical Affairs.\n\n── Setup Chain ──────────────────────────────\n✓ Bank account open (capital proof)\n✓ Engineers\' Syndicate company registered\n✓ Engineer hired (Syndicate-registered)\n→ Submit NREA Bronze dossier\n  Await NREA certificate (~30 days)',
          'COMPLIANCE', item.status === 'critical' ? 'critical' : 'high', 'this-week', 7, 'compliance', 'C-NREA',
          { fosStateUpdate: { nreaSubmitted: true } }
        ));
      } else {
        const missing = !bankDone ? 'open bank account first' : !syndDone ? 'register with Engineers\' Syndicate first' : 'hire engineer first';
        add(task(
          'comp-nrea-blocked',
          `NREA submission blocked — ${missing}`,
          `Cannot submit NREA dossier until prerequisites are complete.\n\n── Setup Chain ──────────────────────────────\n${bankDone ? '✓' : '→'} Open corporate bank account (capital proof required)\n${syndDone ? '✓' : '→'} Register company with Engineers\' Syndicate (required for company-level NREA application)\n${engDone  ? '✓' : '→'} Hire Syndicate-registered engineer (CV required in dossier)\n  Submit NREA Bronze dossier\n  Await NREA certificate (~30 days)\n\nComplete the blocking step above first.`,
          'COMPLIANCE', 'high', 'this-week', 0, 'compliance', 'C-NREA',
          {}
        ));
      }
    }

    if (item.id === 'C-FX' && item.status !== 'done') {
      add(task(
        'comp-fx', 'Configure USD/EGP rate alert on XE.com',
        'Set ±5% monthly trigger → SMS to founder phone.\nAlso configure in banking app.\nRequired before sending any EPC proposal.',
        'COMPLIANCE', 'medium', 'this-week', 1, 'compliance', 'C-FX',
        { fosStateUpdate: { fxAlertActive: true } }
      ));
    }
  }

  // ── Cross-lead compliance checks ──────────────────────────────────────────

  // FX exposure: proposals out without FX clause (uses dossier data)
  const propsWithoutFX = leads.filter(l =>
    (l.stage === 'proposal_sent' || l.stage === 'negotiation') &&
    ((l.stageData || {}).proposal_sent || {}).contractValueEGP &&
    ((l.stageData || {}).proposal_sent || {}).fxClause === false
  );
  if (propsWithoutFX.length > 0) {
    const totalExp = propsWithoutFX.reduce((s, l) =>
      s + (Number(((l.stageData||{}).proposal_sent||{}).contractValueEGP)||0), 0);
    add(task(
      'comp-fx-exposure',
      `FX exposure: ${propsWithoutFX.length} proposal${propsWithoutFX.length>1?'s':''} without FX clause`,
      `EGP ${totalExp.toLocaleString()} in open proposals with no FX escalation clause.\nLeads: ${propsWithoutFX.map(l=>l.orgName).join(', ')}.\nAction: send revised proposals with FX clause today.\nRisk: EGP/USD devaluation >5% wipes margin on these contracts entirely.`,
      'COMPLIANCE', 'critical', 'this-week', 1, 'compliance', 'C-FX',
      {}
    ));
  }

  // NREA capacity: approaching Bronze tier ceiling (500 kWp per single project)
  const wonLeads = leads.filter(l => l.stage === 'won');
  const totalKwpCommitted = wonLeads.reduce((s, l) => {
    const sz = (l.stageData?.feasibility_delivered?.finalSizeKwp) ||
               (l.stageData?.site_visit_completed?.recommendedSizeKwp) ||
               parseFloat(l.systemSizeKW) || 0;
    return s + Number(sz);
  }, 0);
  if (totalKwpCommitted >= 400) {
    const isBreach = totalKwpCommitted > 500;
    add(task(
      'comp-nrea-tier',
      `NREA tier: ${Math.round(totalKwpCommitted)} kWp committed${isBreach?' — Bronze BREACHED':''}`,
      `${Math.round(totalKwpCommitted)} kWp across won projects. Bronze ceiling: 500 kWp per single project.\n${isBreach?'⚠ BREACH: You cannot execute the current project portfolio under Bronze tier.':'Approaching ceiling — upgrade before signing any new contract ≥ 500 kWp.'}\nUpgrade to Silver (≤ 5 MWp): EGP 10,000 + review fee.\nDocuments: updated capital proof, additional licensed engineer CV with Syndicate stamp.\nSubmit to NREA Technical Affairs before next contract signature.`,
      'COMPLIANCE', isBreach ? 'critical' : 'high', 'this-week', 7, 'compliance', 'C-NREA',
      {}
    ));
  }

  // ── AR aging: overdue invoice collection ──────────────────────────────────
  // Fires a collection task when a milestone has been in 'invoiced' state for ≥14 days.
  try {
    for (const proj of allProjs) {
      for (const ms of (proj.milestones || [])) {
        if (ms.status !== 'invoiced' || !ms.invoicedDate) continue;
        const daysOut = Math.floor((Date.now() - new Date(ms.invoicedDate)) / 86400000);
        if (daysOut < 14) continue;
        const clientName = proj.clientName || proj.name;
        add(task(
          `ar-aging-${proj.id}-${ms.id}`,
          `Collect payment — ${clientName} [${daysOut}d outstanding]`,
          `Invoice overdue ${daysOut} days.\nProject: ${proj.name}\nMilestone: ${ms.label}\nAmount: EGP ${Number(ms.amount).toLocaleString()}\nInvoiced: ${ms.invoicedDate}\n${daysOut >= 30 ? '⚠ ESCALATE: >30 days. Formal demand letter required.' : 'Action: Call client, follow up by WhatsApp, confirm receipt of invoice.'}`,
          'EXECUTION', daysOut >= 30 ? 'critical' : 'high',
          'this-week', 0, 'crm', proj.id, {}
        ));
      }
    }
  } catch {}

  // ── Document gap tasks ─────────────────────────────────────────────────────
  // Fires a Trello card for each missing critical document at the right stage.
  try {
    for (const proj of allProjs) {
      if (proj.status === 'complete') continue;
      const docs       = proj.documents || [];
      const client     = proj.clientName || proj.name;
      // Returns true if a doc of this type doesn't exist OR is still pending
      const docPending = (typeId) => {
        const d = docs.find(d => d.type === typeId);
        return !d || d.status === 'pending';
      };

      // EPC Contract — critical for any active project
      if (docPending('epc_contract')) {
        add(task(
          `doc-contract-${proj.id}`,
          `File signed EPC contract — ${client}`,
          `Signed EPC contract not yet filed in the document tracker.\nProject: ${proj.name}\nAction: Scan → upload to Google Drive → paste link in Projects → Documents tab.\nRequired before: procurement orders, DISCO application, any invoicing.`,
          'COMPLIANCE', 'critical', 'this-week', 2, 'crm', proj.id, {}
        ));
      }

      // Deposit invoice — once the deposit milestone has been invoiced/received
      const depositMs = (proj.milestones || []).find(m =>
        m.label.toLowerCase().includes('deposit') && m.status !== 'pending');
      if (depositMs && docPending('deposit_invoice')) {
        add(task(
          `doc-deposit-invoice-${proj.id}`,
          `File deposit invoice — ${client}`,
          `Deposit milestone marked ${depositMs.status} but invoice not filed.\nProject: ${proj.name}\nAmount: EGP ${Number(depositMs.amount).toLocaleString()}\nAction: Upload invoice copy to Projects → Documents tab.`,
          'COMPLIANCE', 'high', 'this-week', 1, 'crm', proj.id, {}
        ));
      }

      // DISCO application receipt — only after the application has actually been submitted.
      // discoSubmittedDate is set when exec-disco is actioned and logged in the project.
      if (['in_progress', 'commissioning'].includes(proj.status) && docPending('disco_application') && proj.discoSubmittedDate) {
        add(task(
          `doc-disco-app-${proj.id}`,
          `File DISCO application receipt — ${client}`,
          `DISCO application submitted ${proj.discoSubmittedDate}. File the submission receipt now.\nProject: ${proj.name}\nAction: Scan DISCO submission receipt → upload to Projects → Documents tab.\nRequired for: net metering approval, grid connection sign-off.`,
          'COMPLIANCE', 'critical', 'this-week', 1, 'crm', proj.id, {}
        ));
      }

      // IEC certificates — when procurement items exist without certs
      const missingIEC = (proj.procurement || []).filter(i => i.iecCertStatus !== 'received');
      if (missingIEC.length > 0 && (docPending('panel_iec') || docPending('inverter_iec'))) {
        add(task(
          `doc-iec-certs-${proj.id}`,
          `Collect IEC certificates — ${client} (${missingIEC.length} items)`,
          `${missingIEC.length} procurement item${missingIEC.length > 1 ? 's' : ''} without IEC certificates.\nProject: ${proj.name}\nItems: ${missingIEC.map(i => i.supplier || i.category).join(', ')}\nRequest cert from supplier on PO confirmation. Required for NREA compliance.`,
          'COMPLIANCE', 'critical', 'this-week', 7, 'crm', proj.id, {}
        ));
      }

      // Net metering approval chase — only after DISCO application is submitted.
      // Chasing approval for a submission that hasn't happened is noise.
      if (['in_progress', 'commissioning'].includes(proj.status) && docPending('net_metering_approval') && proj.discoSubmittedDate) {
        const daysSinceSubmit = Math.floor((Date.now() - new Date(proj.discoSubmittedDate)) / 86400000);
        add(task(
          `doc-net-metering-${proj.id}`,
          `File net metering approval — ${client}`,
          `DISCO submitted ${proj.discoSubmittedDate} (${daysSinceSubmit} days ago). Approval letter not yet filed.\nProject: ${proj.name}\nAction: Chase DISCO office for approval status → once received, upload to Projects → Documents tab.\nRequired before commissioning sign-off.`,
          'COMPLIANCE', 'high', 'backlog', 30, 'crm', proj.id, {}
        ));
      }

      // Commissioning docs — when project reaches commissioning stage
      if (proj.status === 'commissioning') {
        if (docPending('commissioning_report')) {
          add(task(
            `doc-commissioning-${proj.id}`,
            `Compile commissioning test report — ${client}`,
            `Project at commissioning stage. Test report not yet filed.\nProject: ${proj.name}\nIncludes: DC/AC open-circuit tests, string IV curves, inverter logs, grid connection test.\nRequired for: warranty activation, client handover sign-off.`,
            'TECHNICAL', 'critical', 'this-week', 3, 'crm', proj.id, {}
          ));
        }
        // Handover certificate requires the commissioning test report to exist first —
        // the client signs the certificate after reviewing the test results.
        const commReportFiled = !docPending('commissioning_report');
        if (docPending('handover_certificate') && commReportFiled) {
          add(task(
            `doc-handover-${proj.id}`,
            `File client handover certificate — ${client}`,
            `Commissioning report filed. Get client signature on handover certificate now.\nProject: ${proj.name}\nAction: Present commissioning report → client signs certificate → scan → upload to Documents tab.\nTriggers: warranty period start, final payment milestone.\n\n── Commissioning Chain ──────────────────────\n✓ Compile commissioning test report\n→ Get client to sign handover certificate\n  Invoice final milestone (${proj.milestones?.slice(-1)[0]?.pct || 10}%)`,
            'EXECUTION', 'critical', 'this-week', 2, 'crm', proj.id, {}
          ));
        } else if (docPending('handover_certificate') && !commReportFiled) {
          // Report not yet filed — handover is blocked, surface it clearly
          add(task(
            `doc-handover-${proj.id}`,
            `File client handover certificate — ${client}`,
            `Handover certificate cannot be issued until the commissioning test report is filed.\nProject: ${proj.name}\n\n── Commissioning Chain ──────────────────────\n→ Compile & file commissioning test report first\n  Then: get client signature on handover certificate\n  Then: invoice final milestone`,
            'EXECUTION', 'critical', 'this-week', 2, 'crm', proj.id, {}
          ));
        }
      }
    }
  } catch {}

  // ── 3. Hiring-driven tasks ─────────────────────────────────────────────────

  for (const h of (hiring || [])) {
    if (!h.hire) continue;
    if (h.role.includes('Engineer') && h.urgency !== 'low') {
      const id = `hire-eng-${h.urgency}`;
      add(task(
        id,
        `Start hiring: ${h.role}`,
        `${h.reason}\n\nConditions: ${h.condition || 'See hiring panel.'}\n\nNext step: Post job ads today, shortlist in 48h, interview within 7 days.`,
        'HIRING', h.urgency === 'critical' ? 'critical' : 'high', 'this-week', 3, 'hiring', h.role,
        {}
      ));
    }
    if (h.role.includes('Technician') && h.urgency !== 'low') {
      add(task(
        'hire-tech', `Start hiring: ${h.role}`,
        `${h.reason}\n\nMust be DISCO-registered or under a registered subcontractor.`,
        'HIRING', 'high', 'backlog', 14, 'hiring', h.role,
        {}
      ));
    }
  }

  // ── 4. Decision-driven tasks ──────────────────────────────────────────────

  const decision = primaryDecision;
  if (decision && decision.urgency !== 'low') {
    const decId = `decision-${decision.id}`;
    if (!pushed.has(decId)) {
      const decTypeMap = {
        'HIRING':     'HIRING',
        'STRATEGY':   'SALES',
        'COMPLIANCE': 'COMPLIANCE',
        'CASH':       'EXECUTION',
        'COMMERCIAL': 'SALES',
        'SURVIVAL':   'EXECUTION',
      };
      add(task(
        decId,
        `DECISION: ${decision.question}`,
        `Urgency: ${decision.urgency.toUpperCase()}\n\nOption A: ${decision.options[0]?.label || ''}\n${decision.options[0]?.detail || ''}\n\nOption B: ${decision.options[1]?.label || ''}\n${decision.options[1]?.detail || ''}`,
        decTypeMap[decision.category] || 'EXECUTION',
        decision.urgency === 'critical' ? 'critical' : 'high',
        'this-week', 1, 'decision', decision.id,
        {}
      ));
    }
  }

  // ── 5. Project governance alerts ──────────────────────────────────────────
  try {
    const EG_PSH = [4.1,4.8,5.7,6.6,7.0,7.3,7.1,6.9,6.5,5.6,4.5,3.9];

    for (const proj of allProjs) {
      if (['on_hold'].includes(proj.status)) continue;
      const client = proj.clientName || proj.name;

      // DISCO approval delay
      if (proj.discoSubmittedDate && !proj.discoApprovedDate) {
        const days = Math.floor((Date.now() - new Date(proj.discoSubmittedDate)) / 86400000);
        if (days >= 21) {
          add(task(
            `disco-delay-${proj.id}`,
            `Chase DISCO approval — ${client} [${days}d pending]`,
            `DISCO application submitted ${proj.discoSubmittedDate} — no approval received after ${days} days.\nProject: ${proj.name}\nBenchmark: 30–60 day approval in Egypt is common, but chase at day 21.\nAction: Call DISCO office, ask for reference number status, log response in Projects → DISCO tracker.\nEvery week of delay costs ~EGP 1,000–2,000 in subcontractor standby and holds the final 10% milestone.`,
            'EXECUTION', days >= 35 ? 'critical' : 'high', 'this-week', 0, 'crm', proj.id, {}
          ));
        }
      }

      // Unsigned change orders
      const unsigned = (proj.changeOrders||[]).filter(co => !co.clientSigned);
      if (unsigned.length > 0 && !['complete'].includes(proj.status)) {
        const totalVal = unsigned.reduce((s,co)=>s+(Number(co.amountEGP)||0),0);
        add(task(
          `co-unsigned-${proj.id}`,
          `Get client sign-off: ${unsigned.length} change order${unsigned.length>1?'s':''} — ${client}`,
          `${unsigned.length} unsigned change order${unsigned.length>1?'s':''} on project: ${proj.name}\nUnsigned COs: ${unsigned.map(co=>`CO-${String(co.num).padStart(3,'0')}: ${co.description} (${co.amountEGP ? `EGP ${Number(co.amountEGP).toLocaleString()}` : 'no amount'})`).join('\n')}\nTotal unsigned value: EGP ${totalVal.toLocaleString()}\nAction: Send formal change order document for client signature. Do not proceed with scope change until signed.\nRule: Industry standard — any change >2% of contract value requires written sign-off.`,
          'EXECUTION', 'high', 'this-week', 0, 'crm', proj.id, {}
        ));
      }

      // Low contingency (<5%)
      const cv = Number(proj.contractValue)||0;
      if (cv > 0 && !['complete'].includes(proj.status)) {
        const contBudget  = cv * (Number(proj.contingencyBudgetPct)||20) / 100;
        const reworkTotal = (proj.costs||[]).filter(c=>c.category==='rework').reduce((s,c)=>s+(Number(c.amount)||0),0);
        const remPct      = contBudget > 0 ? Math.round((contBudget - reworkTotal) / contBudget * 100) : 100;
        if (remPct < 5) {
          add(task(
            `low-contingency-${proj.id}`,
            `Contingency exhausted (${remPct}% left) — ${client}`,
            `Contingency reserve is ${remPct}% remaining on: ${proj.name}\nContingency budget: EGP ${Math.round(contBudget).toLocaleString()} (${Number(proj.contingencyBudgetPct)||20}% of contract)\nRework costs to date: EGP ${reworkTotal.toLocaleString()}\nRemaining: EGP ${Math.max(0,Math.round(contBudget-reworkTotal)).toLocaleString()}\nAction: Review project scope for further risk. Consider raising a change order for any additional scope. Notify client of budget pressure before next milestone invoice.\nBenchmark: Egypt EPC recommended contingency 20–22% of contract value.`,
            'EXECUTION', 'critical', 'this-week', 0, 'crm', proj.id, {}
          ));
        }
      }

      // No client contact >14 days (active projects)
      if (['in_progress','commissioning'].includes(proj.status)) {
        const commsLog = proj.commsLog || [];
        const lastDate = commsLog.length > 0 ? commsLog.reduce((m,e)=>e.date>m?e.date:m,'') : null;
        const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate)) / 86400000) : null;
        if (daysSince === null || daysSince > 14) {
          add(task(
            `no-contact-${proj.id}`,
            daysSince === null ? `No client contact logged — ${client}` : `${daysSince}d without client contact — ${client}`,
            `Project: ${proj.name}${lastDate ? `\nLast contact: ${lastDate} (${daysSince} days ago)` : '\nNo communication logged.'}\nBenchmark: Weekly minimum contact during active construction (Planisware stakeholder management).\nAction: Call or WhatsApp client for a status update. Log the contact in Projects → Comms tab.\nRisk: Egyptian clients expect regular personal contact — silence creates doubt and payment delays.`,
            'EXECUTION', daysSince === null || daysSince > 21 ? 'high' : 'medium', 'this-week', 0, 'crm', proj.id, {}
          ));
        }
      }

      // Low PR alert — last 2 months PR <70%
      if (['commissioning','complete'].includes(proj.status)) {
        const kWp = parseFloat(proj.systemSizeKW)||0;
        const yieldLog = proj.yieldLog || [];
        if (kWp > 0 && yieldLog.length >= 2) {
          const recentEntries = [...yieldLog].sort((a,b)=>b.month.localeCompare(a.month)).slice(0,2);
          const prValues = recentEntries.map(e => {
            const actual = parseFloat(e.actualKwh)||0;
            if (!actual) return null;
            const mo = parseInt(e.month.slice(5,7));
            const yr = parseInt(e.month.slice(0,4));
            const days = new Date(yr, mo, 0).getDate();
            const psh  = EG_PSH[mo-1];
            return actual / (kWp * psh * days) * 100;
          }).filter(v => v !== null);
          const avgPR = prValues.length > 0 ? prValues.reduce((s,v)=>s+v,0)/prValues.length : null;
          if (avgPR !== null && avgPR < 70) {
            add(task(
              `low-pr-${proj.id}`,
              `Low performance ratio (${Math.round(avgPR)}%) — investigate — ${client}`,
              `System PR in last ${prValues.length} months: ${Math.round(avgPR)}% — below minimum threshold.\nProject: ${proj.name} (${kWp} kWp)\nBenchmark: Egypt/MENA target 78–85% (IEA PVPS T13-28 2024). Below 70% requires fault investigation per IEC 61724.\nCommon causes in Egypt: excessive soiling (dust), inverter fault or clipping, shading from new obstruction, sensor/monitoring error.\nAction: Site visit to check panels (soiling, physical damage), inverter error logs, string voltage measurements. Log findings in Site Log tab.`,
              'TECHNICAL', avgPR < 65 ? 'critical' : 'high', 'this-week', 0, 'crm', proj.id, {}
            ));
          }
        }
      }

      // NPS not captured for completed projects
      if (proj.status === 'complete' && proj.npsScore === null) {
        add(task(
          `nps-${proj.id}`,
          `Ask client: how likely are you to refer us? — ${client}`,
          `Project completed but no recommendation score recorded: ${proj.name}\nAction: Ask client: "On a scale of 0–10, how likely are you to refer us to a colleague or business partner?"\nRecord in Projects → Comms tab → Recommendation Score prompt at the top.\nWhy it matters: referral likelihood is the leading indicator of your pipeline. Your referral source attribution shows referrals are your primary lead source — every completed project is a referral opportunity.\nBenchmark: B2B solar/energy services score 30–50 (industry average). Score ≥9 → ask directly for a referral introduction.`,
          'SALES', 'medium', 'backlog', 7, 'crm', proj.id, {}
        ));
      }
    }
  } catch {}

  // Sort: in-progress critical first, then this-week critical, then by priority
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const listOrder = { 'in-progress': 0, 'this-week': 1, 'backlog': 2 };
  tasks.sort((a, b) => {
    const la = listOrder[a.listTarget] ?? 3;
    const lb = listOrder[b.listTarget] ?? 3;
    if (la !== lb) return la - lb;
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  return tasks;
};

// ── TRELLO API LAYER ──────────────────────────────────────────────────────────

const trelloReq = async (method, path, body, config) => {
  const sep = path.includes('?') ? '&' : '?';
  const url  = `${TRELLO_BASE}${path}${sep}key=${config.apiKey}&token=${config.apiToken}`;
  const opts  = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Trello ${method} ${path} → ${res.status}: ${txt.slice(0,100)}`);
  }
  return res.json();
};

export const trelloGetBoardLists = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/lists`, null, config);

export const trelloGetBoardUrl = (config) =>
  trelloReq('GET', `/boards/${config.boardId}?fields=shortUrl,name`, null, config);

export const trelloGetBoardLabels = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/labels`, null, config);

export const trelloGetBoardCards = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/cards?filter=all&fields=id,name,desc,idList,labels,dueComplete,closed`, null, config);

export const trelloArchiveCard = (config, cardId)            => trelloReq('PUT',  `/cards/${cardId}`,              { closed: true }, config);
export const trelloUpdateCardName = (config, cardId, name) => trelloReq('PUT',  `/cards/${cardId}`,              { name }, config);
const trelloAddCardLabel   = (config, cardId, labelId)   => trelloReq('POST', `/cards/${cardId}/idLabels`,     { value: labelId }, config);
const trelloRemoveCardLabel= (config, cardId, labelId)   => trelloReq('DELETE',`/cards/${cardId}/idLabels/${labelId}`, null, config);
const trelloRenameList   = (config, listId, name)   => trelloReq('PUT',  `/lists/${listId}`,          { name }, config);
const trelloArchiveList  = (config, listId)          => trelloReq('PUT',  `/lists/${listId}/closed`,   { value: true }, config);
const trelloCreateList   = (config, name, pos = 'bottom') =>
  trelloReq('POST', `/boards/${config.boardId}/lists`, { name, pos }, config);

// ── BOARD LIST MIGRATION ───────────────────────────────────────────────────────
// Renames the 3 mapped lists to solar-EPC-relevant names, archives the 3
// time-based placeholder lists, and adds a Blocked list for manual stalls.
// Returns an updated { lists, listMapping } to merge into config.
export const migrateBoardLists = async (config) => {
  const TARGET_NAMES = {
    [config.listMapping['this-week']]:   '🔴 This Week',
    [config.listMapping['in-progress']]: '🔵 In Execution',
    [config.listMapping['backlog']]:      '📋 Queued',
  };

  const mappedIds = new Set(Object.values(config.listMapping));
  const currentLists = await trelloGetBoardLists(config);

  for (const list of currentLists) {
    if (TARGET_NAMES[list.id]) {
      await trelloRenameList(config, list.id, TARGET_NAMES[list.id]);
    } else if (!mappedIds.has(list.id)) {
      const isCompletionList = /done|complet/i.test(list.name);
      if (isCompletionList) {
        await trelloRenameList(config, list.id, '✅ Done');
      } else {
        // Only archive if the list is empty — never destroy cards
        const cards = await trelloReq('GET', `/lists/${list.id}/cards?fields=id`, null, config);
        if (cards.length === 0) await trelloArchiveList(config, list.id);
      }
    }
  }

  // Add Blocked list if it doesn't already exist
  const refreshed = await trelloGetBoardLists(config);
  const hasBlocked = refreshed.some(l => l.name === '⛔ Blocked');
  if (!hasBlocked) await trelloCreateList(config, '⛔ Blocked');

  const finalLists = await trelloGetBoardLists(config);
  return { lists: finalLists };
};

// ── BACKFILL ROLE LABELS ───────────────────────────────────────────────────────
// Applies role labels to all existing open cards on the board.
// Cards with a fos marker get precise assignment from getTaskAssignees.
// Cards without a marker get role inferred from their existing type label.
export const backfillAssigneeLabels = async (config) => {
  const { typeMap, roleMap } = await ensureLabels(config);

  // Invert typeMap so we can look up type name by label ID
  const labelIdToType = Object.fromEntries(Object.entries(typeMap).map(([k, v]) => [v, k]));

  // Fallback assignment by type label when no fos marker present
  const roleByType = {
    SALES:      { primary: 'SALES_REP',   secondary: 'FOUNDER'   },
    TECHNICAL:  { primary: 'ENGINEER',    secondary: 'FOUNDER'   },
    COMPLIANCE: { primary: 'FOUNDER',     secondary: 'ENGINEER'  },
    EXECUTION:  { primary: 'ENGINEER',    secondary: 'FOUNDER'   },
    HIRING:     { primary: 'FOUNDER',     secondary: null        },
  };

  const roleIds = new Set(Object.values(roleMap));
  const cards   = (await trelloGetBoardCards(config)).filter(c => !c.closed);
  let updated   = 0;

  for (const card of cards) {
    // Determine target assignees
    let assignees = null;

    const fosId = extractFosId(card.desc);
    if (fosId) {
      // Reconstruct a minimal task-like object for getTaskAssignees
      const typeLabel = card.labels?.find(l => typeMap[l.name]);
      const fakeTask  = {
        id:       fosId,
        type:     typeLabel?.name ?? 'EXECUTION',
        source:   fosId.startsWith('crm-') ? 'crm' : fosId.startsWith('hire') ? 'hiring' : 'compliance',
        priority: 'high',
      };
      assignees = getTaskAssignees(fakeTask);
    } else {
      const typeLabel = card.labels?.find(l => labelIdToType[l.id]);
      const typeName  = typeLabel ? labelIdToType[typeLabel.id] : null;
      assignees = typeName ? roleByType[typeName] : { primary: 'FOUNDER', secondary: null };
    }

    if (!assignees) continue;

    // Strip any stale role labels already on the card
    for (const lbl of (card.labels || [])) {
      if (roleIds.has(lbl.id)) {
        await trelloRemoveCardLabel(config, card.id, lbl.id).catch(() => {});
      }
    }

    // Apply fresh role labels
    const toAdd = [roleMap[assignees.primary], roleMap[assignees.secondary]].filter(Boolean);
    for (const labelId of toAdd) {
      await trelloAddCardLabel(config, card.id, labelId).catch(() => {});
    }
    updated++;
  }

  return updated;
};

// Scans the board for duplicate cards (by fos marker, then by title as fallback),
// archives all but the newest copy of each, and returns the count archived.
export const deduplicateBoardCards = async (config) => {
  const cards = (await trelloGetBoardCards(config)).filter(c => !c.closed);

  // Group: prefer fos marker, fall back to normalised title
  const groups = {};
  for (const card of cards) {
    const fosId = extractFosId(card.desc);
    const key   = fosId ? `fos:${fosId}` : `title:${card.name.trim().toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }

  let archived = 0;
  for (const group of Object.values(groups)) {
    if (group.length < 2) continue;
    // Keep the first card returned by Trello (oldest position); archive the rest
    const [, ...dupes] = group;
    for (const dupe of dupes) {
      await trelloArchiveCard(config, dupe.id);
      archived++;
    }
  }
  return archived;
};

export const trelloCreateLabel = (config, name, color) =>
  trelloReq('POST', `/boards/${config.boardId}/labels`, { name, color }, config);

export const trelloCreateCard = (config, { title, description, listId, labelIds, dueInDays }) => {
  const due = dueInDays != null
    ? new Date(Date.now() + dueInDays * 86400000).toISOString()
    : undefined;
  return trelloReq('POST', '/cards', {
    name: title, desc: description,
    idList: listId, idLabels: labelIds || [],
    due: due || null, pos: 'top',
  }, config);
};

// ── BOARD SETUP ───────────────────────────────────────────────────────────────
// Creates type labels + role labels. Returns { typeMap, roleMap }.
// typeMap keys: SALES, TECHNICAL, COMPLIANCE, EXECUTION, HIRING
// roleMap keys: FOUNDER, ENGINEER, SALES_REP, ACCOUNTANT, PROCUREMENT, TECHNICIAN

export const ensureLabels = async (config) => {
  const existing = await trelloGetBoardLabels(config);
  const byName = {};
  for (const l of existing) {
    if (l.name) byName[l.name] = l.id;
  }

  const typeMap = {};
  for (const [key, def] of Object.entries(TASK_TYPES)) {
    if (byName[key]) { typeMap[key] = byName[key]; }
    else {
      const c = await trelloCreateLabel(config, key, def.trelloColor);
      typeMap[key] = c.id;
    }
  }

  const roleMap = {};
  for (const [key, def] of Object.entries(ROLE_LABELS)) {
    if (byName[def.trelloName]) { roleMap[key] = byName[def.trelloName]; }
    else {
      const c = await trelloCreateLabel(config, def.trelloName, def.trelloColor);
      roleMap[key] = c.id;
    }
  }

  return { typeMap, roleMap };
};

// ── PUSH TASK TO TRELLO ───────────────────────────────────────────────────────
// Embeds a fos:<taskId> marker in every card description so we can detect
// duplicates by scanning board cards — even across devices or after clearing
// localStorage.

const FOS_MARKER = (taskId) => `\n\n<!-- fos:${taskId} -->`;
const extractFosId = (desc = '') => { const m = desc.match(/<!-- fos:([^>]+) -->/); return m ? m[1] : null; };

// Pass pre-fetched boardCards to avoid one extra API call per push when
// pushing in bulk (pushAll fetches once and threads it through).
// labelMaps = { typeMap, roleMap } as returned by ensureLabels.
export const pushTask = async (config, task, listMapping, labelMaps, boardCards = null) => {
  const listId = listMapping[task.listTarget];
  if (!listId) throw new Error(`No list mapped for target "${task.listTarget}"`);

  const cards = boardCards ?? await trelloGetBoardCards(config);
  const existing = cards.find(c => extractFosId(c.desc) === task.id);

  const primary   = ROLE_LABELS[task.assignees?.primary]?.label   ?? task.assignees?.primary   ?? '—';
  const secondary = ROLE_LABELS[task.assignees?.secondary]?.label ?? task.assignees?.secondary ?? null;
  const assigneeLine = `\n\n👤 Primary: ${primary}${secondary ? ` · 👥 CC: ${secondary}` : ''}`;
  const freshDesc = task.description + assigneeLine + FOS_MARKER(task.id);

  if (existing) {
    // Refresh the description with latest dossier data so the card reflects current state
    await trelloReq('PUT', `/cards/${existing.id}`, { desc: freshDesc }, config).catch(() => {});
    return existing.id;
  }

  const { typeMap = {}, roleMap = {} } = labelMaps ?? {};
  const labelIds = [
    typeMap[task.type],
    roleMap[task.assignees?.primary],
    roleMap[task.assignees?.secondary],
  ].filter(Boolean);

  const card = await trelloCreateCard(config, {
    title:       task.title,
    description: freshDesc,
    listId,
    labelIds,
    dueInDays:   task.dueInDays,
  });
  return card.id;
};

// ── SYNC COMPLETED CARDS ──────────────────────────────────────────────────────
// Returns array of completed card IDs from Trello

export const syncCompletedCards = async (config) => {
  const cards = await trelloGetBoardCards(config);
  return cards
    .filter(c => c.dueComplete || c.closed)
    .map(c => c.id);
};

// ── VALIDATE CONNECTION ────────────────────────────────────────────────────────

export const validateTrelloConnection = async (config) => {
  if (!config.apiKey || !config.apiToken || !config.boardId) {
    return { ok: false, error: 'Missing API key, token, or board ID.' };
  }
  try {
    const lists = await trelloGetBoardLists(config);
    return { ok: true, lists };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// ── localStorage helpers for pushed task queue ─────────────────────────────────

const LS_KEY = 'trello_task_queue_v1';

export const loadTaskQueue = () => {
  try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
};

export const saveTaskQueue = (queue) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(queue)); } catch {}
};

export const markTaskPushed = (queue, taskId, cardId) =>
  queue.map(t => t.id === taskId ? { ...t, pushed: true, trelloCardId: cardId } : t);

export const markTaskCompleted = (queue, cardId) =>
  queue.map(t => t.trelloCardId === cardId ? { ...t, completed: true } : t);

// ── Project card lookup ────────────────────────────────────────────────────────
// Returns all open Trello cards whose fos: marker encodes the given projectId.
export const fetchProjectCards = async (config, projectId) => {
  const cards = await trelloGetBoardCards(config);
  return cards.filter(c => {
    const fosId = extractFosId(c.desc);
    return fosId && fosId.includes(projectId) && !c.closed;
  });
};

export const archiveCards = async (config, cardIds) => {
  for (const id of cardIds) await trelloArchiveCard(config, id);
};

// ── Clipboard fallback (when Trello not configured) ────────────────────────────

export const taskToClipboard = (task) => {
  const text =
    `## ${task.title}\n\n` +
    `Type: ${task.type} | Priority: ${task.priority.toUpperCase()} | List: ${LIST_TARGETS[task.listTarget]?.label}\n\n` +
    task.description;
  navigator.clipboard?.writeText(text).catch(() => {});
};
