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

// ── TASK GENERATION ────────────────────────────────────────────────────────────
// Takes fosEngine output + raw leads → returns array of pending tasks
// Only generates tasks that don't already exist in the pushed queue

export const generateTasks = (engineState, leads, pushedTasks = []) => {
  const tasks  = [];
  const pushed = new Set(pushedTasks.map(t => t.id));

  const add = (t) => { if (!pushed.has(t.id)) tasks.push(t); };

  const { day, crm, compliance, hiring, primaryDecision, mode } = engineState;

  // ── 1. CRM-driven tasks (per lead stage) ──────────────────────────────────
  // Each description is pre-filled from the Stage Dossier so the person
  // executing the task has every relevant field without opening another tab.

  for (const lead of leads) {
    const name  = lead.orgName || lead.id;
    const value = lead.dealValue ? ` (EGP ${Number(lead.dealValue).toLocaleString()})` : '';
    const kw    = lead.systemSizeKW ? ` · ${lead.systemSizeKW}kW` : '';

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
      add(task(
        `crm-visit-${lead.id}`,
        `Site visit — ${name}`,
        `Conduct qualifying site visit.${timeSlot}${address}${onSiteCt}${access}${billLine}${phaseConf}${dmLine}${diesel}\nSystem: ${lead.systemSizeKW||'?'}kW${value}.\nBring: smartphone meter app, tape measure, ≥10 photos, load data request, site checklist.\nGoal: roof area + shading + DISCO + electrical panel rating + confirm decision maker present.`,
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
      add(task(
        `crm-propose-fs-${lead.id}`,
        `Propose paid feasibility study — ${name}`,
        `Site visit done. Follow up within 48h.${recSize}${annSav}${payback}${shading}${netMeter}\nFee: EGP 3,000–5,000 (credit against EPC contract). Issue invoice on confirmation.\nCollect deposit before analysis starts.`,
        'SALES', 'high', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_proposed' }
      ));
    }

    if (lead.stage === 'feasibility_sold') {
      const deposit   = sFs.depositCollectedEGP  ? `\nDeposit: EGP ${Number(sFs.depositCollectedEGP).toLocaleString()} (${sFs.paymentMethod||'method TBC'})` : '';
      const deadline  = sFs.deliveryPromisedBy   ? `\nDeadline: ${sFs.deliveryPromisedBy} — HARD` : '';
      const assignee  = sFs.assignedTo           ? `\nAssigned to: ${sFs.assignedTo}` : '';
      // PVsyst simulation inputs — pulled directly from site visit dossier
      const pvSize    = sSv.recommendedSizeKwp   ? `\n• Size: ${sSv.recommendedSizeKwp} kWp` : (lead.systemSizeKW ? `\n• Size: ${lead.systemSizeKW} kWp` : '');
      const pvRoof    = sSv.roofType             ? `\n• Roof: ${sSv.roofType}, ${sSv.usableAreaM2||'?'}m², Az ${sSv.azimuthDeg||'?'}°, Tilt ${sSv.tiltDeg||'?'}°` : '';
      const pvShading = sSv.shadingRisk          ? `\n• Shading: ${sSv.shadingRisk}` : '';
      const pvConsump = sSv.avgMonthlyKwh        ? `\n• Consumption: ${sSv.avgMonthlyKwh} kWh/mo · Peak: ${sSv.peakDemandKva||'?'} kVA · ${sSv.operatingProfile||''}` : '';
      const pvDisco   = sSv.disco                ? `\n• DISCO: ${sSv.disco} · ${sSv.gridPhaseConfirmed||''} · ${sSv.feederVoltage||''}` : '';
      const pvTariff  = sQual.tariffCategory     ? `\n• Tariff: ${sQual.tariffCategory}` : '';
      add(task(
        `crm-deliver-fs-${lead.id}`,
        `Deliver feasibility study — ${name}`,
        `Feasibility deposit received. Deliver within 14 days.${deposit}${deadline}${assignee}\n\nPVsyst inputs:${pvSize}${pvRoof}${pvShading}${pvConsump}${pvDisco}${pvTariff}\n\nDeliverable: PVsyst report, yield, payback, IRR, FX clause notice.\nDeliver IN PERSON — not by email. Push EPC proposal in the same meeting.`,
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
      add(task(
        `crm-proposal-${lead.id}`,
        `Send EPC proposal — ${name}`,
        `Feasibility delivered. Send EPC proposal within 48h.${finalSize}${pbLine}${npvLine}${equip}${clientFb}${nmLine}${fxLine}\nMust include: FX escalation clause · 30% deposit requirement · IEC-certified BOM · Performance guarantee.`,
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
      add(task(
        `crm-followup-prop-${lead.id}`,
        `Follow up on EPC proposal — ${name}`,
        `Proposal sent. Follow up 2×/week.${ctVal}${validLine}${fxLine}${termsLine}${objLine}${fbLine}\nStrategy: in-person meeting with irradiance model. If no response in 10 days: invoke 48h FX validity notice.`,
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
      add(task(
        `crm-close-${lead.id}`,
        `Close contract — ${name}${value}`,
        `Active negotiation. Book in-person meeting this week.${ctVal}${stickLine}${concLine}${marginLine}${revLine}${fxLine}\nFloor: 30% deposit (25% absolute minimum for deals >EGP 1.5M).\nBring: signed contract template, deposit invoice, FX clause explainer.\nWalk away if deposit refused.`,
        'SALES', 'critical', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'won' }
      ));
    }

    if (lead.stage === 'won') {
      const contractRef = sWon.contractRef       ? ` (${sWon.contractRef})` : '';
      const kickoff     = sWon.kickoffDate       ? `\nKickoff date: ${sWon.kickoffDate}` : '';
      const ctVal       = sPs.contractValueEGP   ? `\nContract value: EGP ${Number(sPs.contractValueEGP).toLocaleString()}` : (value ? `\nEst. value:${value}` : '');

      add(task(
        `exec-deposit-${lead.id}`,
        `Collect 30% deposit — ${name}`,
        `Contract signed${contractRef}. Confirm deposit cleared before ANY equipment order.${ctVal}${kickoff}\nIssue deposit invoice immediately. No procurement without cleared funds.`,
        'EXECUTION', 'critical', 'in-progress', 2, 'crm', lead.id,
        { fosStateUpdate: { depositCollected: true } }
      ));

      // DISCO task — named after the specific distribution company from the site visit
      const discoName  = sSv.disco || 'DISCO';
      const nmStatus   = sSv.netMeteringEligible === true
        ? `\n✓ Net metering eligibility confirmed at site visit`
        : `\n⚠ Net metering eligibility not confirmed — verify with ${discoName} before submitting`;
      const sysSpec    = sFd.finalSizeKwp || sSv.recommendedSizeKwp || lead.systemSizeKW;
      const sysLine    = sysSpec ? `\nSystem: ${sysSpec} kWp — prepare spec sheet` : '';
      const addrLine   = sSvSch.siteAddress ? `\nSite: ${sSvSch.siteAddress}` : '';
      const panelSpec  = sFd.panelBrandModel ? `\nPanel for spec sheet: ${sFd.panelBrandModel}` : '';
      const feederLine = sSv.feederVoltage   ? `\nFeeder: ${sSv.feederVoltage} · ${sSv.gridPhaseConfirmed||'phase TBC'}` : '';
      add(task(
        `exec-disco-${lead.id}`,
        `Submit ${discoName} net-metering application — ${name}`,
        `Submit ${discoName} application same day deposit clears.${nmStatus}${sysLine}${addrLine}${panelSpec}${feederLine}\nDocuments: system spec sheet, site plan, NREA certificate copy, commercial register.\nGet reference number — log in CRM notes.`,
        'COMPLIANCE', 'critical', 'this-week', 1, 'crm', lead.id,
        { fosStateUpdate: { discoSubmitted: true } }
      ));

      // Procurement task — pre-filled with equipment from feasibility study
      const panelLine  = sFd.panelBrandModel     ? `\nPanels: ${sFd.panelBrandModel}` : '';
      const invLine    = sFd.inverterBrandModel  ? `\nInverter: ${sFd.inverterBrandModel}` : '';
      const pcLine     = sSv.estimatedPanelCount ? `\nPanel count: ~${sSv.estimatedPanelCount} × 400W` : '';
      const sizeProc   = sFd.finalSizeKwp || sSv.recommendedSizeKwp || lead.systemSizeKW;
      const sizeLine   = sizeProc ? `\nSystem: ${sizeProc} kWp` : '';
      add(task(
        `exec-procure-${lead.id}`,
        `Place equipment order — ${name}`,
        `Only after deposit cleared.${sizeLine}${panelLine}${invLine}${pcLine}\nLead times: panels 3–4 weeks, inverters 2–3 weeks, BOS 1–2 weeks.\nLock panel price within 72h of contract signature. Collect IEC certificates with every order.`,
        'EXECUTION', 'critical', 'backlog', 3, 'crm', lead.id,
        {}
      ));

      // Engineer mobilization brief — new task; lands the engineerBrief dossier field
      const engBrief   = sWon.engineerBrief      ? `\nEngineer brief: ${sWon.engineerBrief}` : '';
      const roofLine   = sSv.roofType            ? `\nRoof: ${sSv.roofType}, ${sSv.usableAreaM2||'?'}m², Az ${sSv.azimuthDeg||'?'}°, Tilt ${sSv.tiltDeg||'?'}°` : '';
      const shadingMob = sSv.shadingRisk && sSv.shadingRisk !== 'None' ? `\n⚠ Shading: ${sSv.shadingRisk}${sSv.shadingNotes?' — '+sSv.shadingNotes:''}` : '';
      const brkrLine   = sSv.mainBreakerAmps     ? `\nMain breaker: ${sSv.mainBreakerAmps}A · DB: ${sSv.dbPanelBrand||'TBC'}` : '';
      const gridLine   = sSv.gridPhaseConfirmed  ? `\nGrid: ${sSv.gridPhaseConfirmed} · ${sSv.feederVoltage||'voltage TBC'}` : '';
      const facilsLine = sSv.facilitiesContactName ? `\nOn-site contact: ${sSv.facilitiesContactName}${sSv.facilitiesContactPhone?' / '+sSv.facilitiesContactPhone:''}` : '';
      add(task(
        `exec-eng-brief-${lead.id}`,
        `Brief engineer & confirm mobilization — ${name}`,
        `Contract won. Brief engineer and lock mobilization date.${kickoff}${engBrief}${roofLine}${shadingMob}${brkrLine}${gridLine}${facilsLine}\nConfirm: PPE on-site, installation permits ready, equipment delivery date aligns with mobilization.`,
        'TECHNICAL', 'critical', 'in-progress', 1, 'crm', lead.id,
        {}
      ));
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
          `Follow-up is overdue.${dmLine}\nNext action: ${lead.nextAction || 'contact lead'}.\nStage: ${lead.stage.replace(/_/g,' ')}.${budgetLine}${needsLine}`,
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
      add(task(
        'comp-nrea', 'Submit NREA Bronze qualification dossier',
        'Required for all DISCO connections. No certificate = no revenue.\nFee: EGP 5,000 (Bronze) + EGP 5,000 review.\nDocuments: commercial register, capital proof, engineer CV (Syndicate), equipment specs.\nSubmit paper + electronic to NREA Technical Affairs.',
        'COMPLIANCE', item.status === 'critical' ? 'critical' : 'high', 'this-week', 7, 'compliance', 'C-NREA',
        { fosStateUpdate: { nreaSubmitted: true } }
      ));
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

const trelloArchiveCard    = (config, cardId)            => trelloReq('PUT',  `/cards/${cardId}`,              { closed: true }, config);
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
  if (existing) return existing.id;

  const { typeMap = {}, roleMap = {} } = labelMaps ?? {};
  const labelIds = [
    typeMap[task.type],
    roleMap[task.assignees?.primary],
    roleMap[task.assignees?.secondary],
  ].filter(Boolean);

  const primary   = ROLE_LABELS[task.assignees?.primary]?.label   ?? task.assignees?.primary   ?? '—';
  const secondary = ROLE_LABELS[task.assignees?.secondary]?.label ?? task.assignees?.secondary ?? null;
  const assigneeLine = `\n\n👤 Primary: ${primary}${secondary ? ` · 👥 CC: ${secondary}` : ''}`;

  const card = await trelloCreateCard(config, {
    title:       task.title,
    description: task.description + assigneeLine + FOS_MARKER(task.id),
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

// ── Clipboard fallback (when Trello not configured) ────────────────────────────

export const taskToClipboard = (task) => {
  const text =
    `## ${task.title}\n\n` +
    `Type: ${task.type} | Priority: ${task.priority.toUpperCase()} | List: ${LIST_TARGETS[task.listTarget]?.label}\n\n` +
    task.description;
  navigator.clipboard?.writeText(text).catch(() => {});
};
