import { useState, useMemo, useRef } from 'react';
import { scaffoldDocuments } from '../engine/docScaffold';
import {
  PIPELINE_STAGES, SEGMENTS, SOURCE_TYPES, PAIN_POINTS, TEMPERATURES,
  GOVERNORATES, CRM_TAGS, computeLeadScore, getScoreCategory,
  INIT_LEADS, INIT_TENDERS, INIT_RESEARCH, CSV_TEMPLATE_HEADERS,
} from '../data/crmData';

// ── Storage ────────────────────────────────────────────────────────────────────
const LS = { leads:'crm_leads_v3', tenders:'crm_tenders_v2', research:'crm_research_v2' };
const loadLS  = (k, fallback) => { try { const s = localStorage.getItem(k); if (s) return JSON.parse(s); } catch {} return fallback; };
const saveLS  = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Design tokens ──────────────────────────────────────────────────────────────
const N = '#0D2137'; const G = '#C8991A'; const T = '#1A6B72';
const R = '#C0392B'; const GR = '#1E7E34'; const AM = '#856404';
const CARD = { background:'#fff', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.1)' };
const INP  = { width:'100%', border:'1px solid #dde1e7', borderRadius:4, padding:'7px 10px', fontSize:13, color:'#1a1a1a', fontFamily:'inherit', boxSizing:'border-box' };
const SL   = { fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'1px', color:'#888' };
const BTN  = { padding:'7px 14px', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', letterSpacing:'.3px' };

// ── Helpers ────────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const isOverdue = (s) => s && s < todayStr();
const daysUntil = (s) => s ? Math.round((new Date(s) - new Date(todayStr())) / 86400000) : null;
const fmtEGP = (n) => { const v = parseFloat(n)||0; if(v>=1e6) return `EGP ${(v/1e6).toFixed(1)}M`; if(v>=1000) return `EGP ${(v/1000).toFixed(0)}K`; return `EGP ${v.toLocaleString()}`; };
const stageById = Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, s]));
const stageLabel = id => stageById[id]?.label ?? id;
const stageProb  = id => stageById[id]?.prob ?? 0;

const nextId = (arr, prefix) => {
  const nums = arr.map(x => parseInt(x.id.replace(prefix+'-','')) || 0);
  return `${prefix}-${String(Math.max(0,...nums)+1).padStart(3,'0')}`;
};

// ── Auto-project creation when a lead is won ───────────────────────────────────
const _uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const _mkMs = (cv) => { // eslint-disable-line no-unused-vars
  const c = Number(cv) || 0;
  return [
    { id:_uid(), label:'Contract Deposit (30%)',         pct:30, amount:Math.round(c*.30), dueDate:'', status:'pending', invoicedDate:null },
    { id:_uid(), label:'Equipment Delivery (30%)',       pct:30, amount:Math.round(c*.30), dueDate:'', status:'pending', invoicedDate:null },
    { id:_uid(), label:'Installation Complete (30%)',    pct:30, amount:Math.round(c*.30), dueDate:'', status:'pending', invoicedDate:null },
    { id:_uid(), label:'Commissioning & Handover (10%)', pct:10, amount:Math.round(c*.10), dueDate:'', status:'pending', invoicedDate:null },
  ];
};

const autoCreateProject = (lead) => {
  try {
    const raw  = localStorage.getItem('projects_v1');
    const list = raw ? JSON.parse(raw) : [];
    if (list.some(p => p.linkedLeadId === lead.id)) return false; // already exists
    const name = `${lead.orgName}${lead.systemSizeKW ? ` — ${lead.systemSizeKW} kWp` : lead.segment ? ` — ${lead.segment}` : ''}`;
    list.push({
      id: _uid(), name, clientName: lead.orgName,
      systemSizeKW: lead.systemSizeKW || '', contractValue: lead.dealValue || '',
      startDate: todayStr(), expectedEndDate: '', status: 'planning',
      notes: lead.notes || '', milestones: _mkMs(lead.dealValue),
      costs: [], procurement: [], commsLog: [],
      documents: scaffoldDocuments(lead, _uid),
      linkedLeadId: lead.id,
    });
    localStorage.setItem('projects_v1', JSON.stringify(list));
    return true;
  } catch { return false; }
};

const EMPTY_LEAD = { orgName:'', segment:'School', governorate:'Cairo', contactPerson:'', contactRole:'', phone:'', whatsapp:'', email:'', website:'', sourceType:'Referral', monthlyBill:'', systemSizeKW:'', painPoint:'High Bills', temperature:'Warm', stage:'unqualified', nextAction:'', lastContacted:todayStr(), nextFollowUp:'', touches:'0', probability:'5', dealValue:'', notes:'', tags:[], stageData:{} };

// ── Micro-components ───────────────────────────────────────────────────────────
const Chip = ({ label, color='#1A6B72', bg='#e8f8f9' }) => (
  <span style={{ fontSize:9, fontWeight:800, color, background:bg, borderRadius:3, padding:'1px 6px', letterSpacing:'.4px', whiteSpace:'nowrap', display:'inline-block' }}>{label}</span>
);

const TempChip = ({ t }) => {
  const m = { Hot:{color:'#fff',bg:R}, Warm:{color:'#fff',bg:'#D4770A'}, Cold:{color:'#fff',bg:'#555'} };
  const c = m[t]||m.Cold;
  return <Chip label={t} color={c.color} bg={c.bg} />;
};

const ScoreChip = ({ score }) => {
  const c = getScoreCategory(score);
  return <span style={{ fontSize:12, fontWeight:900, color:c.color, background:c.bg, borderRadius:4, padding:'2px 8px' }}>{score}</span>;
};

const StagePill = ({ stageId }) => {
  const m = { won:GR, lost:R, nurture:AM };
  const bg = m[stageId]||T;
  return <span style={{ fontSize:9, fontWeight:800, color:'#fff', background:bg, borderRadius:3, padding:'2px 7px', whiteSpace:'nowrap' }}>{stageLabel(stageId)}</span>;
};

const MetricCard = ({ label, value, sub, color=N, urgent }) => (
  <div style={{ ...CARD, padding:'14px 16px', borderTop:`3px solid ${urgent?R:color}` }}>
    <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.7px', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:900, color:urgent?R:color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:'#aaa', marginTop:4 }}>{sub}</div>}
  </div>
);

// ── PM Integration alert types ─────────────────────────────────────────────────
const PM_TRIGGERS = {
  feasibility_sold:      { icon:'📋', title:'Feasibility Study Sold — Create PM Task', color:T, bg:'#e8f8f9', action:'Go to Tasks tab → create "Prepare Feasibility Study for [Lead]" under WBS-3.' },
  proposal_sent:         { icon:'💰', title:'EPC Proposal Sent — Check Cash Exposure', color:AM, bg:'#fff3cd', action:'Confirm deposit collected. Verify FX escalation clause in proposal. Reserve cash for procurement exposure.' },
  won:                   { icon:'🏆', title:'Contract Won — Execution Workflow Launched', color:GR, bg:'#e8f5e9', action:'Project automatically created in the Projects tab with 30/30/30/10 milestones. Also open Tasks tab → add execution tasks: contract checklist, engineer briefing, procurement readiness, DISCO submission.' },
};

// ── Stage Dossier Config ───────────────────────────────────────────────────────
const STAGE_DOSSIER_CONFIG = [
  {
    stageId:'contacted', label:'First Contact & Needs', icon:'📞',
    fields:[
      { k:'contactDate',          label:'Contact Date',                type:'date' },
      { k:'channel',              label:'Channel',                     type:'select', opts:['Call','WhatsApp','Meeting','Email'] },
      { k:'decisionMakerName',    label:'Decision Maker Name',         type:'text' },
      { k:'decisionMakerRole',    label:'Decision Maker Role',         type:'text' },
      { k:'needsSummary',         label:'Needs / Pain Summary',        type:'textarea', full:true },
      { k:'budgetIndication',     label:'Budget Indication',           type:'select', opts:['Unknown','< EGP 500K','EGP 500K–1M','EGP 1M–3M','EGP 3M+'] },
      { k:'timeline',             label:'Client Timeline',             type:'select', opts:['Unclear','Urgent (< 3 months)','3–6 months','6–12 months','1 year+'] },
      { k:'utilityBillCollected', label:'Utility Bill Collected',      type:'checkbox' },
      { k:'roughSizeKwp',         label:'Rough Size Estimate (kWp)',   type:'number' },
      { k:'nextCommitment',       label:'Next Commitment Made',        type:'text', full:true },
    ],
    summaryFn: d => [d.contactDate, d.channel, d.decisionMakerName && `DM: ${d.decisionMakerName}`].filter(Boolean).join(' · '),
  },
  {
    stageId:'qualified', label:'Qualification Gate', icon:'✅',
    fields:[
      { k:'qualifiedDate',             label:'Qualified Date',                    type:'date' },
      { k:'monthlyBillConfirmedEGP',   label:'Monthly Bill Confirmed (EGP)',      type:'number' },
      { k:'connectedLoadKva',          label:'Connected Load (kVA)',              type:'number' },
      { k:'gridPhase',                 label:'Grid Phase',                        type:'select', opts:['Single Phase','Three Phase'] },
      { k:'tariffCategory',            label:'Tariff Category',                   type:'select', opts:['Commercial','Industrial','Agricultural','Residential'] },
      { k:'ownershipConfirmed',        label:'Roof / Land Ownership Confirmed',   type:'checkbox' },
      { k:'decisionMakerReached',      label:'Decision Maker Reached',            type:'checkbox' },
      { k:'existingDiesel',            label:'Diesel Generator Present',          type:'checkbox' },
      { k:'dieselNotes',               label:'Diesel / Backup Notes',             type:'text', full:true },
      { k:'objections',                label:'Objections Raised',                 type:'textarea', full:true },
    ],
    summaryFn: d => [d.qualifiedDate, d.monthlyBillConfirmedEGP && `Bill: EGP ${Number(d.monthlyBillConfirmedEGP).toLocaleString()}`, d.gridPhase].filter(Boolean).join(' · '),
  },
  {
    stageId:'site_visit_scheduled', label:'Site Visit — Appointment', icon:'📅',
    fields:[
      { k:'scheduledDate',        label:'Visit Date',             type:'date' },
      { k:'scheduledTime',        label:'Visit Time',             type:'time' },
      { k:'siteAddress',          label:'Site Address',           type:'text', full:true },
      { k:'onSiteContactName',    label:'On-Site Contact Name',   type:'text' },
      { k:'onSiteContactPhone',   label:'On-Site Contact Phone',  type:'tel' },
      { k:'accessNotes',          label:'Access Instructions',    type:'textarea', full:true },
    ],
    summaryFn: d => [d.scheduledDate, d.scheduledTime, d.siteAddress && d.siteAddress.slice(0,40)].filter(Boolean).join(' · '),
  },
  {
    stageId:'site_visit_completed', label:'Site Visit — Technical Assessment', icon:'🔍', isSpecial:'site_visit',
    fields:[
      { k:'visitDate',                label:'Visit Date',                    type:'date' },
      { k:'gpsCoords',                label:'GPS Coordinates',               type:'text' },
      { k:'roofType',                 label:'Roof Type',                     type:'select', opts:['Concrete Flat','Concrete Pitched','Steel Structure','Ground Mount','Carport'] },
      { k:'totalRoofAreaM2',          label:'Total Roof Area (m²)',          type:'number' },
      { k:'usableAreaM2',             label:'Usable Area (m²)',              type:'number' },
      { k:'azimuthDeg',               label:'Azimuth (°)',                   type:'number' },
      { k:'tiltDeg',                  label:'Tilt (°)',                      type:'number' },
      { k:'shadingRisk',              label:'Shading Risk',                  type:'select', opts:['None','Low','Medium','High'] },
      { k:'shadingNotes',             label:'Shading Notes',                 type:'textarea', full:true },
      { k:'gridPhaseConfirmed',       label:'Grid Phase (confirmed)',        type:'select', opts:['Single Phase (230V)','Three Phase (400V)'] },
      { k:'mainBreakerAmps',          label:'Main Breaker (A)',              type:'number' },
      { k:'dbPanelBrand',             label:'DB Panel Brand',                type:'text' },
      { k:'disco',                    label:'DISCO',                         type:'select', opts:['EEDCS','UEDCO','UPPCO','BEDC','MEDC','North Cairo','South Cairo','Other'] },
      { k:'feederVoltage',            label:'Feeder Voltage',                type:'select', opts:['LV 380V','MV 11kV','MV 22kV','MV 33kV'] },
      { k:'netMeteringEligible',      label:'Net Metering Eligible',         type:'checkbox' },
      { k:'netMeteringNotes',         label:'Net Metering Notes',            type:'text', full:true },
      { k:'avgMonthlyKwh',            label:'Avg Monthly Consumption (kWh)', type:'number' },
      { k:'peakDemandKva',            label:'Peak Demand (kVA)',             type:'number' },
      { k:'operatingProfile',         label:'Operating Profile',             type:'select', opts:['Office Hours (8h/day)','Two Shifts (16h/day)','24/7','Seasonal'] },
      { k:'facilitiesContactName',    label:'Facilities Contact Name',       type:'text' },
      { k:'facilitiesContactPhone',   label:'Facilities Contact Phone',      type:'tel' },
      { k:'photoCount',               label:'Photos Taken',                  type:'number' },
      { k:'recommendedSizeKwp',       label:'Recommended Size (kWp)',        type:'number' },
      { k:'estimatedPanelCount',      label:'Panel Count (est.)',            type:'number' },
      { k:'estimatedAnnualYieldKwh',  label:'Annual Yield (kWh)',            type:'number' },
      { k:'estimatedAnnualSavingsEGP',label:'Annual Savings (EGP)',          type:'number' },
      { k:'roughPaybackYears',        label:'Rough Payback (years)',         type:'number' },
    ],
    summaryFn: d => [d.visitDate, d.recommendedSizeKwp && `${d.recommendedSizeKwp} kWp est.`, d.shadingRisk && `Shading: ${d.shadingRisk}`].filter(Boolean).join(' · '),
  },
  {
    stageId:'feasibility_proposed', label:'Feasibility Proposal', icon:'📋',
    fields:[
      { k:'proposalDate',       label:'Proposal Date',           type:'date' },
      { k:'feeQuotedEGP',       label:'Fee Quoted (EGP)',        type:'number' },
      { k:'studyScope',         label:'Study Scope Summary',     type:'text', full:true },
      { k:'proposalValidUntil', label:'Valid Until',             type:'date' },
      { k:'clientResponse',     label:'Client Response',         type:'select', opts:['Pending','Accepted','Considering','Price Objection','Rejected'] },
      { k:'clientObjections',   label:'Objections / Questions',  type:'textarea', full:true },
    ],
    summaryFn: d => [d.proposalDate, d.feeQuotedEGP && `EGP ${Number(d.feeQuotedEGP).toLocaleString()}`, d.clientResponse].filter(Boolean).join(' · '),
  },
  {
    stageId:'feasibility_sold', label:'Feasibility Deposit', icon:'💰',
    fields:[
      { k:'depositCollectedEGP', label:'Deposit Collected (EGP)', type:'number' },
      { k:'paymentMethod',       label:'Payment Method',          type:'select', opts:['Bank Transfer','Cash','Cheque'] },
      { k:'receiptRef',          label:'Receipt / Invoice Ref',   type:'text' },
      { k:'deliveryPromisedBy',  label:'Delivery Promised By',    type:'date' },
      { k:'assignedTo',          label:'Assigned To',             type:'text' },
    ],
    summaryFn: d => [d.depositCollectedEGP && `EGP ${Number(d.depositCollectedEGP).toLocaleString()}`, d.deliveryPromisedBy && `Due: ${d.deliveryPromisedBy}`].filter(Boolean).join(' · '),
  },
  {
    stageId:'feasibility_delivered', label:'Feasibility Study', icon:'📊',
    fields:[
      { k:'deliveryDate',          label:'Delivery Date',            type:'date' },
      { k:'docRef',                label:'Document Reference',       type:'text' },
      { k:'finalSizeKwp',          label:'Final System Size (kWp)',  type:'number' },
      { k:'panelBrandModel',       label:'Panel Brand / Model',      type:'text' },
      { k:'inverterBrandModel',    label:'Inverter Brand / Model',   type:'text' },
      { k:'annualYieldKwh',        label:'Annual Yield (kWh/yr)',    type:'number' },
      { k:'performanceRatioPct',   label:'Performance Ratio (%)',    type:'number' },
      { k:'selfConsumptionPct',    label:'Self-Consumption (%)',     type:'number' },
      { k:'co2SavedTonsYear',      label:'CO₂ Saved (t/yr)',         type:'number' },
      { k:'simplePaybackYears',    label:'Payback (years)',          type:'number' },
      { k:'irr',                   label:'IRR (%)',                  type:'number' },
      { k:'npvEGP',                label:'NPV (EGP)',                type:'number' },
      { k:'clientFeedback',        label:'Client Feedback at Delivery', type:'textarea', full:true },
    ],
    summaryFn: d => [d.deliveryDate, d.finalSizeKwp && `${d.finalSizeKwp} kWp`, d.simplePaybackYears && `${d.simplePaybackYears}yr payback`].filter(Boolean).join(' · '),
  },
  {
    stageId:'proposal_sent', label:'EPC Proposal', icon:'📄',
    fields:[
      { k:'proposalRef',           label:'Proposal Reference',        type:'text' },
      { k:'sentDate',              label:'Sent Date',                  type:'date' },
      { k:'contractValueEGP',      label:'Contract Value (EGP)',       type:'number' },
      { k:'paymentTerms',          label:'Payment Terms',              type:'select', opts:['30/30/30/10','40/40/20','50/50','Custom'] },
      { k:'fxClause',              label:'FX Escalation Clause',       type:'checkbox' },
      { k:'panelBrand',            label:'Panel Brand',                type:'text' },
      { k:'inverterBrand',         label:'Inverter Brand',             type:'text' },
      { k:'warrantyYearsPanels',   label:'Panel Warranty (yrs)',       type:'number' },
      { k:'warrantyYearsInverter', label:'Inverter Warranty (yrs)',    type:'number' },
      { k:'timelineWeeks',         label:'Project Timeline (wks)',     type:'number' },
      { k:'validUntil',            label:'Valid Until',                type:'date' },
      { k:'docRef',                label:'Document Reference',         type:'text' },
    ],
    summaryFn: d => [d.sentDate, d.contractValueEGP && `EGP ${(Number(d.contractValueEGP)/1e6).toFixed(1)}M`, d.fxClause ? 'FX ✓' : 'No FX clause'].filter(Boolean).join(' · '),
  },
  {
    stageId:'negotiation', label:'Negotiation', icon:'🤝',
    fields:[
      { k:'mainStickingPoints',  label:'Main Sticking Points',      type:'textarea', full:true },
      { k:'concessionsMade',     label:'Concessions Made',          type:'textarea', full:true },
      { k:'marginImpactEGP',     label:'Margin Impact (EGP)',       type:'number' },
      { k:'revisedProposalSent', label:'Revised Proposal Sent',     type:'checkbox' },
    ],
    summaryFn: d => [d.mainStickingPoints && d.mainStickingPoints.slice(0,60), d.marginImpactEGP && `Margin -EGP ${Number(d.marginImpactEGP).toLocaleString()}`].filter(Boolean).join(' · '),
  },
  {
    stageId:'won', label:'Contract Won', icon:'🏆',
    fields:[
      { k:'contractSignedDate', label:'Contract Signed Date',  type:'date' },
      { k:'contractRef',        label:'Contract Reference',    type:'text' },
      { k:'depositClearedEGP',  label:'Deposit Cleared (EGP)', type:'number' },
      { k:'depositReceiptRef',  label:'Deposit Receipt Ref',   type:'text' },
      { k:'kickoffDate',        label:'Kickoff Date',          type:'date' },
      { k:'engineerBrief',      label:'Brief for Engineer',    type:'textarea', full:true },
    ],
    summaryFn: d => [d.contractSignedDate, d.depositClearedEGP && `EGP ${Number(d.depositClearedEGP).toLocaleString()} cleared`].filter(Boolean).join(' · '),
  },
  {
    stageId:'lost', label:'Deal Lost', icon:'❌',
    fields:[
      { k:'lossDate',           label:'Loss Date',               type:'date' },
      { k:'lossReason',         label:'Loss Reason',             type:'select', opts:['Price','Budget Cut','Timing','Competitor Chosen','Scope Too Large','Regulatory','Relationship','Other'] },
      { k:'competitorName',     label:'Competitor Name',         type:'text' },
      { k:'competitorPriceEGP', label:'Competitor Price (EGP)',  type:'number' },
      { k:'ourFinalPriceEGP',   label:'Our Final Price (EGP)',   type:'number' },
      { k:'lessonsLearned',     label:'Lessons Learned',         type:'textarea', full:true },
      { k:'futureOpportunity',  label:'Future Opportunity?',     type:'checkbox' },
      { k:'nurtureDate',        label:'Reactivate On',           type:'date' },
    ],
    summaryFn: d => [d.lossDate, d.lossReason, d.competitorName && `vs. ${d.competitorName}`].filter(Boolean).join(' · '),
  },
];

// ── Auto-Sizing Calculator ─────────────────────────────────────────────────────
const AutoSizingCalc = ({ data, lead, onChange, setLead }) => {
  const avg = parseFloat(data.avgMonthlyKwh) || 0;
  if (avg === 0) return (
    <div style={{ gridColumn:'1/-1', background:'#f8f9fa', border:'1px dashed #dde1e7', borderRadius:6, padding:'10px 14px', fontSize:11, color:'#aaa', marginBottom:4 }}>
      Enter <b>Avg Monthly Consumption (kWh)</b> below to auto-calculate system sizing.
    </div>
  );
  const tariff  = lead.monthlyBill && avg ? parseFloat(lead.monthlyBill) / avg : 0.8;
  const kWp     = (avg / 30 / 5.5) / 0.75;
  const panels  = Math.ceil(kWp * 1000 / 400);
  const yield_  = Math.round(kWp * 1500);
  const savings = Math.round(yield_ * (tariff || 0.8));
  const pb      = savings > 0 ? (Math.round(kWp * 8000) / savings).toFixed(1) : '—';
  const apply = () => {
    onChange({ recommendedSizeKwp:parseFloat(kWp.toFixed(1)), estimatedPanelCount:panels, estimatedAnnualYieldKwh:yield_, estimatedAnnualSavingsEGP:savings, roughPaybackYears:parseFloat(pb)||0 });
    if (!lead.systemSizeKW) setLead(p => ({ ...p, systemSizeKW:kWp.toFixed(1) }));
  };
  return (
    <div style={{ gridColumn:'1/-1', background:'#f0f7f4', border:`1px solid ${T}`, borderRadius:6, padding:12, marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:900, color:T, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>Auto-Sizing Calculator (Egypt averages)</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:6, marginBottom:10 }}>
        {[
          { label:'Daily Load',     value:`${(avg/30).toFixed(0)} kWh` },
          { label:'System Size',    value:`${kWp.toFixed(1)} kWp` },
          { label:'Panels',         value:`${panels} × 400W` },
          { label:'Annual Yield',   value:`${yield_.toLocaleString()} kWh` },
          { label:'Annual Savings', value:`EGP ${savings.toLocaleString()}` },
          { label:'Payback',        value:`~${pb} yr` },
        ].map(item => (
          <div key={item.label} style={{ background:'#fff', borderRadius:4, padding:'5px 8px', textAlign:'center', border:`1px solid ${T}33` }}>
            <div style={{ fontSize:8, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{item.label}</div>
            <div style={{ fontSize:12, fontWeight:900, color:N }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={apply} style={{ ...BTN, background:T, color:'#fff', fontSize:11 }}>↙ Apply to Output Fields</button>
        <span style={{ fontSize:9, color:'#aaa' }}>5.5h peak sun · PR 0.75 · EGP 8,000/kWp est. CAPEX</span>
      </div>
    </div>
  );
};

// ── Stage Dossier Section ──────────────────────────────────────────────────────
const StageDossierSection = ({ stageId, label, icon, fields, summaryFn, data, isCurrent, isFuture, isOpen, hasData, onToggle, onChange, lead, setLead, isSpecial }) => {
  const sd = data || {};
  const textFields = fields.filter(f => f.type !== 'checkbox');
  const filled = textFields.filter(f => sd[f.k] && sd[f.k] !== '').length;
  const completionPct = textFields.length > 0 ? Math.round(filled / textFields.length * 100) : 0;
  const borderColor = isCurrent ? G : hasData ? `${T}88` : '#e0e0e0';
  return (
    <div style={{ border:`1px solid ${borderColor}`, borderRadius:6, marginBottom:8, overflow:'hidden', opacity:isFuture ? 0.4 : 1 }}>
      <div onClick={isFuture ? undefined : onToggle}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:isCurrent ? '#fffdf2' : '#fff', cursor:isFuture ? 'default' : 'pointer', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:isFuture ? '#bbb' : N }}>{label}</div>
            {!isFuture && summaryFn && hasData && !isOpen && (
              <div style={{ fontSize:10, color:'#888', marginTop:2, maxWidth:340 }}>{summaryFn(sd)}</div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          {isFuture && <span style={{ fontSize:10, color:'#ccc' }}>Not yet reached</span>}
          {!isFuture && completionPct > 0 && (
            <span style={{ fontSize:9, fontWeight:900, color:completionPct===100?GR:AM, background:completionPct===100?'#e8f5e9':'#fff3cd', borderRadius:10, padding:'1px 7px' }}>{completionPct}%</span>
          )}
          {!isFuture && !hasData && <span style={{ width:8, height:8, borderRadius:'50%', background:'#e0e0e0', display:'inline-block' }} />}
          {!isFuture && hasData && <span style={{ width:8, height:8, borderRadius:'50%', background:GR, display:'inline-block' }} />}
          {!isFuture && <span style={{ fontSize:11, color:'#bbb', marginLeft:2 }}>{isOpen ? '▲' : '▼'}</span>}
        </div>
      </div>
      {isOpen && !isFuture && (
        <div style={{ padding:'4px 14px 14px', borderTop:`1px solid ${borderColor}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
            {isSpecial === 'site_visit' && (
              <AutoSizingCalc data={sd} lead={lead} onChange={onChange} setLead={setLead} />
            )}
            {fields.map(field => (
              <div key={field.k} style={{ gridColumn:field.full ? '1/-1' : undefined }}>
                <div style={{ ...SL, marginBottom:4 }}>{field.label}</div>
                {field.type === 'checkbox' ? (
                  <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:12, marginTop:4 }}>
                    <input type="checkbox" checked={sd[field.k]||false} onChange={e => onChange({ [field.k]:e.target.checked })} style={{ accentColor:T, width:14, height:14 }} />
                    Yes
                  </label>
                ) : field.type === 'select' ? (
                  <select style={INP} value={sd[field.k]||''} onChange={e => onChange({ [field.k]:e.target.value })}>
                    <option value="">— select —</option>
                    {field.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea rows={2} style={{ ...INP, resize:'vertical', fontSize:12 }} value={sd[field.k]||''} onChange={e => onChange({ [field.k]:e.target.value })} />
                ) : (
                  <input type={field.type} style={INP} value={sd[field.k]||''} onChange={e => onChange({ [field.k]:e.target.value })} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Dossier Tab ────────────────────────────────────────────────────────────────
const DossierTab = ({ f, setF }) => {
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === f.stage);
  const [openSection, setOpenSection] = useState(f.stage);
  const setStageData = (stageId, updates) =>
    setF(prev => ({ ...prev, stageData:{ ...(prev.stageData||{}), [stageId]:{ ...(prev.stageData?.[stageId]||{}), ...updates } } }));
  const withData = STAGE_DOSSIER_CONFIG.filter(cfg => {
    const d = f.stageData?.[cfg.stageId] || {};
    return Object.values(d).some(v => v !== '' && v !== false && v != null);
  }).length;
  return (
    <div style={{ padding:'14px 20px 20px', maxHeight:520, overflowY:'auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#888' }}>Structured outputs for each pipeline stage — flows into Projects tab and print dossier.</div>
        <span style={{ fontSize:11, fontWeight:700, color:T, flexShrink:0 }}>{withData} / {STAGE_DOSSIER_CONFIG.length} sections filled</span>
      </div>
      {STAGE_DOSSIER_CONFIG.map(cfg => {
        const stageIdx = PIPELINE_STAGES.findIndex(s => s.id === cfg.stageId);
        const isAccessible = cfg.stageId === 'lost' ? f.stage === 'lost' : stageIdx <= currentStageIdx;
        const isCurrent = cfg.stageId === f.stage;
        const data = f.stageData?.[cfg.stageId] || {};
        const hasData = Object.entries(data).some(([,v]) => v !== '' && v !== false && v != null);
        return (
          <StageDossierSection key={cfg.stageId} {...cfg}
            data={data} isCurrent={isCurrent} isFuture={!isAccessible}
            isOpen={openSection === cfg.stageId} hasData={hasData}
            onToggle={() => setOpenSection(prev => prev === cfg.stageId ? null : cfg.stageId)}
            onChange={updates => setStageData(cfg.stageId, updates)}
            lead={f} setLead={setF}
          />
        );
      })}
    </div>
  );
};

// ── Dossier Timeline Modal ─────────────────────────────────────────────────────
const buildDossierHTML = (lead) => {
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
  const stagesWithData  = STAGE_DOSSIER_CONFIG.filter(cfg => {
    const idx = PIPELINE_STAGES.findIndex(s => s.id === cfg.stageId);
    if (!(cfg.stageId === 'lost' ? lead.stage === 'lost' : idx <= currentStageIdx)) return false;
    const d = lead.stageData?.[cfg.stageId] || {};
    return Object.values(d).some(v => v !== '' && v !== false && v != null);
  });
  const sv = lead.stageData?.site_visit_completed || {};
  const fd = lead.stageData?.feasibility_delivered || {};
  const ps = lead.stageData?.proposal_sent || {};
  const finalSize = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW;
  const fmtV = (field, val) => field.type==='checkbox' ? (val?'✓ Yes':'—') : field.type==='number' ? Number(val).toLocaleString() : String(val);
  const summaryItems = [
    { label:'Stage',        value: PIPELINE_STAGES.find(s=>s.id===lead.stage)?.label || lead.stage },
    { label:'System Size',  value: finalSize ? `${finalSize} kWp` : '—' },
    { label:'Deal Value',   value: ps.contractValueEGP ? `EGP ${Number(ps.contractValueEGP).toLocaleString()}` : lead.dealValue ? `EGP ${Number(lead.dealValue).toLocaleString()}` : '—' },
    { label:'Payback',      value: fd.simplePaybackYears ? `${fd.simplePaybackYears} yr` : sv.roughPaybackYears ? `~${sv.roughPaybackYears} yr` : '—' },
    { label:'IRR',          value: fd.irr ? `${fd.irr}%` : '—' },
    { label:'DISCO',        value: sv.disco || '—' },
  ];
  const stageCards = stagesWithData.map(cfg => {
    const d = lead.stageData?.[cfg.stageId] || {};
    const filled = cfg.fields.filter(f => d[f.k] && d[f.k] !== '' && d[f.k] !== false);
    return `<div class="card"><div class="card-hdr">${cfg.icon} ${cfg.label}</div><div class="fields">${filled.map(f=>`<div class="field"><span class="fl">${f.label}</span><span class="fv">${fmtV(f,d[f.k])}</span></div>`).join('')}</div></div>`;
  }).join('');
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${lead.orgName} — Lead Dossier</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:24px}
  h1{font-size:18px;color:#0D2137;margin-bottom:4px}.meta{color:#888;font-size:10px;margin-bottom:16px}
  .summary{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;background:#f8f9fa;padding:12px;border-radius:4px;margin-bottom:20px}
  .si label{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#888;display:block;margin-bottom:2px}.si strong{font-size:13px;color:#0D2137}
  .card{margin-bottom:18px;page-break-inside:avoid}.card-hdr{font-size:12px;font-weight:900;color:#0D2137;border-bottom:2px solid #1A6B72;padding-bottom:5px;margin-bottom:10px}
  .fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:5px 16px}.field{padding:3px 0}
  .fl{font-size:8px;text-transform:uppercase;letter-spacing:.4px;color:#888;display:block;margin-bottom:1px}.fv{font-size:11px;color:#1a1a1a}
  @page{margin:15mm}@media print{body{padding:0}}</style></head>
  <body><h1>${lead.orgName}</h1>
  <div class="meta">${lead.id} · ${[lead.contactPerson,lead.segment,lead.governorate].filter(Boolean).join(' · ')} · Printed ${new Date().toLocaleDateString('en-GB')}</div>
  <div class="summary">${summaryItems.map(i=>`<div class="si"><label>${i.label}</label><strong>${i.value}</strong></div>`).join('')}</div>
  ${stageCards}</body></html>`);
  win.document.close(); win.print();
};

export const DossierModal = ({ lead, onClose, onEdit }) => {
  const currentStageIdx = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
  const reachedStages   = STAGE_DOSSIER_CONFIG.filter(cfg => {
    const idx = PIPELINE_STAGES.findIndex(s => s.id === cfg.stageId);
    return cfg.stageId === 'lost' ? lead.stage === 'lost' : idx <= currentStageIdx;
  });
  const stagesWithData  = reachedStages.filter(cfg => {
    const d = lead.stageData?.[cfg.stageId] || {};
    return Object.values(d).some(v => v !== '' && v !== false && v != null);
  });
  const sv = lead.stageData?.site_visit_completed || {};
  const fd = lead.stageData?.feasibility_delivered || {};
  const ps = lead.stageData?.proposal_sent || {};
  const finalSize = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW;
  const score = computeLeadScore(lead);

  const summaryItems = [
    { label:'System Size',   value: finalSize ? `${finalSize} kWp` : null },
    { label:'Annual Yield',  value: fd.annualYieldKwh ? `${Number(fd.annualYieldKwh).toLocaleString()} kWh/yr` : sv.estimatedAnnualYieldKwh ? `~${Number(sv.estimatedAnnualYieldKwh).toLocaleString()} kWh/yr` : null },
    { label:'Payback',       value: fd.simplePaybackYears ? `${fd.simplePaybackYears} yr` : sv.roughPaybackYears ? `~${sv.roughPaybackYears} yr` : null },
    { label:'IRR',           value: fd.irr ? `${fd.irr}%` : null },
    { label:'Contract',      value: ps.contractValueEGP ? fmtEGP(ps.contractValueEGP) : lead.dealValue ? fmtEGP(lead.dealValue) : null },
    { label:'DISCO',         value: sv.disco || null },
  ].filter(x => x.value);

  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1100, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 16px', overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:820, boxShadow:'0 24px 64px rgba(0,0,0,.35)', marginBottom:40 }}>

        {/* Header */}
        <div style={{ background:N, padding:'14px 20px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:900, fontSize:15, color:G }}>{lead.orgName}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>Lead Dossier · {lead.id}{lead.contactPerson ? ` · ${lead.contactPerson}` : ''}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <StagePill stageId={lead.stage} />
            <ScoreChip score={score} />
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:22, cursor:'pointer' }}>×</button>
          </div>
        </div>

        {/* Tech summary strip */}
        {summaryItems.length > 0 && (
          <div style={{ background:'#f8f9fa', padding:'12px 20px', borderBottom:'1px solid #eee', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:12 }}>
            {summaryItems.map(item => (
              <div key={item.label}>
                <div style={{ fontSize:8, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:800, color:N }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stage timeline nav */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid #eee', display:'flex', gap:14, overflowX:'auto', alignItems:'flex-start' }}>
          {reachedStages.map(cfg => {
            const hasData  = stagesWithData.some(s => s.stageId === cfg.stageId);
            const isCurrent = cfg.stageId === lead.stage;
            return (
              <div key={cfg.stageId} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity:hasData?1:0.3, flexShrink:0, minWidth:50 }}>
                <span style={{ fontSize:14 }}>{cfg.icon}</span>
                <div style={{ width:8, height:8, borderRadius:'50%', background: isCurrent ? G : hasData ? T : '#ddd' }} />
                <div style={{ fontSize:8, color:'#888', textAlign:'center', maxWidth:60, lineHeight:1.2 }}>{cfg.label.split(' — ')[0]}</div>
              </div>
            );
          })}
        </div>

        {/* Stage data cards */}
        <div style={{ padding:'16px 20px 20px', maxHeight:500, overflowY:'auto' }}>
          {stagesWithData.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 20px', color:'#aaa' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:13, marginBottom:6 }}>No stage data captured yet.</div>
              <div style={{ fontSize:11 }}>Open the lead → Stage Dossier tab → fill in sections as this lead progresses.</div>
            </div>
          ) : stagesWithData.map(cfg => {
            const d = lead.stageData?.[cfg.stageId] || {};
            const filled = cfg.fields.filter(f => d[f.k] && d[f.k] !== '' && d[f.k] !== false);
            return (
              <div key={cfg.stageId} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:6, marginBottom:10, borderBottom:`2px solid ${T}` }}>
                  <span style={{ fontSize:16 }}>{cfg.icon}</span>
                  <span style={{ fontSize:13, fontWeight:900, color:N }}>{cfg.label}</span>
                  {cfg.summaryFn && <span style={{ fontSize:10, color:'#888', marginLeft:'auto' }}>{cfg.summaryFn(d)}</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'5px 14px' }}>
                  {filled.map(field => (
                    <div key={field.k} style={{ padding:'3px 0' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>{field.label}</div>
                      <div style={{ fontSize:12, color:N, fontWeight:['number','date'].includes(field.type)?700:400, lineHeight:1.4, wordBreak:'break-word' }}>
                        {field.type==='checkbox' ? (d[field.k]?'✓ Yes':'—') : String(d[field.k])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => buildDossierHTML(lead)} style={{ ...BTN, background:'#f5f5f5', color:N }}>🖨 Print Dossier</button>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onEdit} style={{ ...BTN, background:T, color:'#fff' }}>Edit Lead</button>
            <button onClick={onClose} style={{ ...BTN, background:'#f5f5f5', color:'#555' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Lead Form Modal ────────────────────────────────────────────────────────────
const LeadModal = ({ lead, leads, onSave, onDelete, onClose }) => {
  const [f, setF] = useState(lead ? { stageData:{}, ...lead } : { ...EMPTY_LEAD, id: nextId(leads, 'L') });
  const [formTab, setFormTab] = useState('profile');
  const isNew = !lead;
  const score = computeLeadScore(f);
  const cat   = getScoreCategory(score);

  const set = (k, v) => setF(p => ({ ...p, [k]: v, probability: k==='stage' ? String(stageProb(v)) : p.probability }));
  const toggleTag = (tag) => setF(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter(t=>t!==tag) : [...p.tags, tag] }));

  const Field = ({ label, k, type='text', opts, full, rows, min }) => (
    <div style={{ gridColumn: full?'1/-1':undefined }}>
      <div style={{ ...SL, marginBottom:4 }}>{label}</div>
      {opts ? (
        <select style={INP} value={f[k]} onChange={e=>set(k,e.target.value)}>
          {opts.map(o=>typeof o==='object'?<option key={o.value} value={o.value}>{o.label}</option>:<option key={o}>{o}</option>)}
        </select>
      ) : rows ? (
        <textarea rows={rows} style={{ ...INP, resize:'vertical' }} value={f[k]||''} onChange={e=>set(k,e.target.value)} />
      ) : (
        <input type={type} min={min} style={INP} value={f[k]||''} onChange={e=>set(k,e.target.value)} />
      )}
    </div>
  );

  const SectionHead = ({ title }) => (
    <div style={{ gridColumn:'1/-1', fontSize:10, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:'1px', borderBottom:`2px solid ${G}`, paddingBottom:4, marginTop:6 }}>{title}</div>
  );

  const govTender = f.segment === 'Government Tender';

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:740, boxShadow:'0 20px 60px rgba(0,0,0,.3)', marginBottom:40 }}>
        {/* Header */}
        <div style={{ background:N, color:G, padding:'14px 20px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:900, fontSize:14 }}>{isNew ? 'New Lead' : 'Edit Lead'}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>{f.id}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)' }}>LEAD SCORE</div>
              <div style={{ fontSize:20, fontWeight:900, color:cat.color }}>{score} <span style={{ fontSize:10, color:'rgba(255,255,255,.4)', fontWeight:400 }}>/ 100</span></div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:22, cursor:'pointer' }}>×</button>
          </div>
        </div>

        {govTender && (
          <div style={{ background:'#fff3cd', borderLeft:`4px solid ${G}`, padding:'10px 20px', fontSize:12, color:AM, fontWeight:600 }}>
            ⚠ Government Tender — Apply <b>Compliance</b> tag. Assign to Tender Tracker. Run Go/No-Go gate before pursuing.
          </div>
        )}

        {/* Score bar */}
        <div style={{ padding:'8px 20px', background:'#f8f9fa', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, background:'#e0e0e0', borderRadius:4, height:6, overflow:'hidden' }}>
            <div style={{ width:`${score}%`, height:'100%', background:cat.color, transition:'width .3s' }} />
          </div>
          <span style={{ fontSize:11, fontWeight:800, color:cat.color, background:cat.bg, borderRadius:4, padding:'2px 8px', flexShrink:0 }}>{cat.label}</span>
        </div>

        {/* Modal tab bar */}
        <div style={{ display:'flex', gap:2, padding:'0 20px', background:'#f8f9fa', borderBottom:'1px solid #eee' }}>
          {[{id:'profile',label:'Profile'},{id:'dossier',label:'📋 Stage Dossier'}].map(t=>(
            <button key={t.id} onClick={()=>setFormTab(t.id)}
              style={{ padding:'8px 16px', background:'transparent', border:'none',
                borderBottom: formTab===t.id ? `2px solid ${G}` : '2px solid transparent',
                color: formTab===t.id ? G : '#888', fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit', letterSpacing:'.3px',
                textTransform:'uppercase', marginBottom:-1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Form */}
        {formTab === 'profile' && (
        <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <SectionHead title="Organization" />
          <Field label="Organization Name" k="orgName" full />
          <Field label="Segment" k="segment" opts={SEGMENTS} />
          <Field label="Governorate" k="governorate" opts={GOVERNORATES} />
          <Field label="Source Type" k="sourceType" opts={SOURCE_TYPES} />
          <Field label="Website / Source URL" k="website" full />

          <SectionHead title="Contact" />
          <Field label="Contact Person" k="contactPerson" />
          <Field label="Role / Title" k="contactRole" />
          <Field label="Phone" k="phone" type="tel" />
          <Field label="WhatsApp" k="whatsapp" type="tel" />
          <Field label="Email" k="email" type="email" />

          <SectionHead title="Project Details" />
          <Field label="Monthly Bill EGP" k="monthlyBill" type="number" min="0" />
          <Field label="System Size kW (estimated)" k="systemSizeKW" type="number" min="0" />
          <Field label="Primary Pain Point" k="painPoint" opts={PAIN_POINTS} />
          <Field label="Lead Temperature" k="temperature" opts={TEMPERATURES} />

          <SectionHead title="Pipeline" />
          <Field label="Pipeline Stage" k="stage" opts={PIPELINE_STAGES.map(s=>({value:s.id,label:s.label}))} />
          <Field label="Probability %" k="probability" type="number" min="0" />
          <Field label="Estimated Deal Value EGP" k="dealValue" type="number" min="0" />
          <Field label="Next Action" k="nextAction" full />

          <SectionHead title="Follow-Up" />
          <Field label="Last Contacted" k="lastContacted" type="date" />
          <Field label="Next Follow-Up Date" k="nextFollowUp" type="date" />
          <Field label="Number of Touches" k="touches" type="number" min="0" />

          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ ...SL, marginBottom:6 }}>WhatsApp Follow-Up Script</div>
            <textarea rows={3} placeholder="Draft WhatsApp message for follow-up..." style={{ ...INP, resize:'vertical', fontSize:12 }} value={f.waScript||''} onChange={e=>set('waScript',e.target.value)} />
          </div>

          <SectionHead title="Tags" />
          <div style={{ gridColumn:'1/-1', display:'flex', flexWrap:'wrap', gap:8 }}>
            {CRM_TAGS.map(tag => (
              <label key={tag} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12, userSelect:'none' }}>
                <input type="checkbox" checked={f.tags?.includes(tag)||false} onChange={()=>toggleTag(tag)} style={{ accentColor:T, cursor:'pointer' }} />
                {tag}
              </label>
            ))}
          </div>

          <SectionHead title="Notes" />
          <Field label="Notes" k="notes" rows={4} full />
        </div>
        )}
        {formTab === 'dossier' && <DossierTab f={f} setF={setF} />}

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            {!isNew && (
              <button onClick={()=>{ if(window.confirm('Delete this lead?')) onDelete(f.id); }} style={{ ...BTN, background:'#fff5f5', color:R, border:`1px solid ${R}` }}>Delete Lead</button>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ ...BTN, background:'#f5f5f5', color:'#555' }}>Cancel</button>
            <button onClick={()=>onSave(f)} style={{ ...BTN, background:N, color:'#fff' }}>{isNew ? 'Add Lead' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tender Form Modal ──────────────────────────────────────────────────────────
const EMPTY_TENDER = { name:'', authority:'', sector:'', location:'', sourceUrl:'', publicationDate:'', deadline:'', bidBond:'', technicalReqs:'', siteVisitRequired:false, submissionStatus:'Not Started', recommendation:'', complianceNotes:'', requiredDocs:'', nextAction:'' };
const TENDER_STATUSES = ['Not Started','Reviewing','Go — Preparing Bid','No-Go','Submitted','Won','Lost'];

const TenderModal = ({ tender, tenders, onSave, onDelete, onClose }) => {
  const [f, setF] = useState(tender ? { ...tender } : { ...EMPTY_TENDER, id: nextId(tenders, 'T') });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const isNew = !tender;

  const days = daysUntil(f.deadline);
  const urgency = days !== null && days < 14;

  const Field = ({ label, k, type='text', opts, full, rows }) => (
    <div style={{ gridColumn:full?'1/-1':undefined }}>
      <div style={{ ...SL, marginBottom:4 }}>{label}</div>
      {opts ? <select style={INP} value={f[k]||''} onChange={e=>set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
        : rows ? <textarea rows={rows} style={{ ...INP, resize:'vertical' }} value={f[k]||''} onChange={e=>set(k,e.target.value)} />
        : <input type={type} style={INP} value={f[k]||''} onChange={e=>set(k,e.target.value)} />}
    </div>
  );

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:680, boxShadow:'0 20px 60px rgba(0,0,0,.3)', marginBottom:40 }}>
        <div style={{ background:N, color:G, padding:'14px 20px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:900, fontSize:14 }}>{isNew?'New Tender':'Edit Tender'} — {f.id}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        {urgency && (
          <div style={{ background:'#fff5f5', borderLeft:`4px solid ${R}`, padding:'8px 20px', fontSize:12, color:R, fontWeight:700 }}>
            ⚠ Deadline in {days} days — urgent action required
          </div>
        )}
        <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Tender Name" k="name" full />
          <Field label="Issuing Authority" k="authority" />
          <Field label="Sector" k="sector" />
          <Field label="Location / Region" k="location" />
          <Field label="Source URL" k="sourceUrl" type="url" full />
          <Field label="Publication Date" k="publicationDate" type="date" />
          <Field label="Submission Deadline" k="deadline" type="date" />
          <Field label="Bid Bond / Financial Req." k="bidBond" full />
          <Field label="Technical Requirements" k="technicalReqs" rows={3} full />
          <Field label="Required Documents" k="requiredDocs" rows={3} full />
          <div>
            <div style={{ ...SL, marginBottom:4 }}>Site Visit Required</div>
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
              <input type="checkbox" checked={f.siteVisitRequired||false} onChange={e=>set('siteVisitRequired',e.target.checked)} style={{ accentColor:T, width:15, height:15 }} />
              Yes — site visit required
            </label>
          </div>
          <Field label="Submission Status" k="submissionStatus" opts={TENDER_STATUSES} />
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ ...SL, marginBottom:6 }}>Go / No-Go Recommendation</div>
            <div style={{ display:'flex', gap:10 }}>
              {['Go','No-Go','Needs Review'].map(opt => (
                <button key={opt} onClick={()=>set('recommendation',opt)}
                  style={{ ...BTN, flex:1, background: f.recommendation===opt ? (opt==='Go'?GR:opt==='No-Go'?R:AM) : '#f5f5f5', color: f.recommendation===opt?'#fff':'#555', border:`1px solid ${f.recommendation===opt?(opt==='Go'?GR:opt==='No-Go'?R:AM):'#ddd'}` }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <Field label="Compliance Notes" k="complianceNotes" rows={3} full />
          <Field label="Next Action" k="nextAction" full />
        </div>
        <div style={{ padding:'14px 20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between' }}>
          <div>{!isNew && <button onClick={()=>{ if(window.confirm('Delete tender?')) onDelete(f.id); }} style={{ ...BTN, background:'#fff5f5', color:R, border:`1px solid ${R}` }}>Delete</button>}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ ...BTN, background:'#f5f5f5', color:'#555' }}>Cancel</button>
            <button onClick={()=>onSave(f)} style={{ ...BTN, background:N, color:'#fff' }}>{isNew?'Add Tender':'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Research Item Modal ────────────────────────────────────────────────────────
const EMPTY_RESEARCH = { targetSegment:'Factory', searchQuery:'', sourceWebsite:'', orgFound:'', contactFound:'', verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false, notes:'' };
const VERIFY_STATUSES = ['Pending','Verified','Not Valid','Imported'];

const ResearchModal = ({ item, items, onSave, onDelete, onClose }) => {
  const [f, setF] = useState(item ? { ...item } : { ...EMPTY_RESEARCH, id: nextId(items,'R') });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const isNew = !item;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
      <div style={{ background:'#fff', borderRadius:8, width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ background:N, color:G, padding:'14px 20px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:900, fontSize:14 }}>{isNew?'New Research Item':'Edit Research Item'} — {f.id}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#aaa', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { label:'Target Segment', k:'targetSegment', opts:SEGMENTS },
            { label:'Verification Status', k:'verificationStatus', opts:VERIFY_STATUSES },
            { label:'Search Query', k:'searchQuery', full:true },
            { label:'Source Website', k:'sourceWebsite', full:true },
            { label:'Organization Found', k:'orgFound', full:true },
            { label:'Contact Found', k:'contactFound', full:true },
            { label:'Assigned To', k:'assignedTo' },
          ].map(({ label,k,opts,full }) => (
            <div key={k} style={{ gridColumn:full?'1/-1':undefined }}>
              <div style={{ ...SL, marginBottom:4 }}>{label}</div>
              {opts ? <select style={INP} value={f[k]||''} onChange={e=>set(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                : <input style={INP} value={f[k]||''} onChange={e=>set(k,e.target.value)} />}
            </div>
          ))}
          <div style={{ gridColumn:'1/-1' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              <input type="checkbox" checked={f.importToCRM||false} onChange={e=>set('importToCRM',e.target.checked)} style={{ accentColor:T, width:15, height:15 }} />
              Import to CRM (creates a new lead from this research)
            </label>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ ...SL, marginBottom:4 }}>Notes</div>
            <textarea rows={3} style={{ ...INP, resize:'vertical' }} value={f.notes||''} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>
        <div style={{ padding:'14px 20px', borderTop:'1px solid #eee', display:'flex', justifyContent:'space-between' }}>
          <div>{!isNew && <button onClick={()=>{ if(window.confirm('Delete item?')) onDelete(f.id); }} style={{ ...BTN, background:'#fff5f5', color:R, border:`1px solid ${R}` }}>Delete</button>}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ ...BTN, background:'#f5f5f5', color:'#555' }}>Cancel</button>
            <button onClick={()=>onSave(f)} style={{ ...BTN, background:N, color:'#fff' }}>{isNew?'Add Item':'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CSV helpers ────────────────────────────────────────────────────────────────
const exportLeadsCSV = (leads) => {
  const rows = leads.map(l => [
    l.id, l.orgName, l.segment, l.governorate, l.contactPerson, l.contactRole,
    l.phone, l.whatsapp, l.email, l.website, l.sourceType, l.monthlyBill,
    l.systemSizeKW, l.painPoint, l.temperature, stageLabel(l.stage),
    l.nextAction, l.lastContacted, l.nextFollowUp, l.touches, l.probability,
    l.dealValue, computeLeadScore(l), (l.tags||[]).join('; '), l.notes,
  ]);
  const csv = [CSV_TEMPLATE_HEADERS, ...rows]
    .map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href:url, download:'solar_crm_leads.csv' });
  a.click(); URL.revokeObjectURL(url);
};

const downloadTemplate = () => {
  const sample = [CSV_TEMPLATE_HEADERS, ['L-NEW','Example Company','Factory','Cairo','Ahmed Mohamed','CEO','01012345678','01012345678','ahmed@example.com','','Referral','50000','100','High Bills','Warm','Qualified','Schedule site visit',todayStr(),'','2','50','1800000','Sample notes here']];
  const csv = sample.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  const a = Object.assign(document.createElement('a'),{href:url,download:'crm_import_template.csv'});
  a.click(); URL.revokeObjectURL(url);
};

const parseImportCSV = (text, existingLeads) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h=>h.replace(/"/g,'').trim());
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v=>v.replace(/"/g,'').trim());
    const row = Object.fromEntries(headers.map((h,j)=>[h, vals[j]||'']));
    const stage = PIPELINE_STAGES.find(s=>s.label===row['Pipeline Stage'])?.id || 'unqualified';
    return {
      id: nextId([...existingLeads, ...lines.slice(1,i+1).map((_,idx)=>({id:`L-${900+idx}`}))], 'L'),
      orgName: row['Organization Name']||'Untitled',
      segment: SEGMENTS.includes(row['Segment']) ? row['Segment'] : 'Other',
      governorate: row['Governorate']||'Cairo',
      contactPerson: row['Contact Person']||'',
      contactRole: row['Role']||'',
      phone: row['Phone']||'', whatsapp: row['WhatsApp']||'', email: row['Email']||'', website: row['Website']||'',
      sourceType: SOURCE_TYPES.includes(row['Source Type']) ? row['Source Type'] : 'Other',
      monthlyBill: row['Monthly Bill EGP']||'', systemSizeKW: row['System Size kW']||'',
      painPoint: PAIN_POINTS.includes(row['Pain Point']) ? row['Pain Point'] : 'High Bills',
      temperature: TEMPERATURES.includes(row['Temperature']) ? row['Temperature'] : 'Cold',
      stage, nextAction: row['Next Action']||'', lastContacted: row['Last Contacted']||todayStr(),
      nextFollowUp: row['Next Follow-Up']||'', touches: row['Touches']||'0',
      probability: row['Probability %']||String(stageProb(stage)),
      dealValue: row['Deal Value EGP']||'', notes: row['Notes']||'', tags:[],
    };
  });
};

// ── DASHBOARD SECTION ──────────────────────────────────────────────────────────
const CRMDashboard = ({ leads, tenders, pmAlerts, onClearAlert }) => {
  const active = leads.filter(l => l.stage !== 'lost' && l.stage !== 'nurture');
  const hot    = leads.filter(l => l.temperature === 'Hot');
  const qualif = leads.filter(l => ['qualified','site_visit_scheduled','site_visit_completed','feasibility_proposed','feasibility_sold','feasibility_delivered','proposal_sent','negotiation'].includes(l.stage));
  const visits = leads.filter(l => l.stage === 'site_visit_scheduled');
  const feaSold  = leads.filter(l => l.stage === 'feasibility_sold' || l.stage === 'feasibility_delivered');
  const proposals = leads.filter(l => l.stage === 'proposal_sent' || l.stage === 'negotiation');
  const won    = leads.filter(l => l.stage === 'won');
  const lost   = leads.filter(l => l.stage === 'lost');
  const overdue = leads.filter(l => isOverdue(l.nextFollowUp) && l.stage !== 'won' && l.stage !== 'lost');
  const govLeads = leads.filter(l => l.segment === 'Government Tender');

  const weightedPipeline = active.reduce((sum,l) => sum + (parseFloat(l.dealValue)||0) * stageProb(l.stage) / 100, 0);
  const expectedRevenue  = won.reduce((sum,l) => sum + (parseFloat(l.dealValue)||0), 0);

  const metrics = [
    { label:'Total Leads',          value:leads.length,        color:N },
    { label:'Hot Leads',            value:hot.length,          color:R,   urgent: hot.length===0 },
    { label:'Qualified',            value:qualif.length,       color:T },
    { label:'Site Visits Sched.',   value:visits.length,       color:T },
    { label:'Feasibility Sold',     value:feaSold.length,      color:GR },
    { label:'Proposals Out',        value:proposals.length,    color:AM },
    { label:'Won',                  value:won.length,          color:GR },
    { label:'Lost',                 value:lost.length,         color:'#888' },
    { label:'Weighted Pipeline',    value:fmtEGP(weightedPipeline), color:N },
    { label:'Expected Revenue',     value:fmtEGP(expectedRevenue),  color:GR },
    { label:'Overdue Follow-Ups',   value:overdue.length,      color:R,   urgent: overdue.length>0 },
    { label:'Gov. Tenders Tracked', value:govLeads.length,     color:AM },
  ];

  return (
    <div>
      {/* PM Integration Alerts */}
      {pmAlerts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          {pmAlerts.map((alert, i) => {
            const cfg = PM_TRIGGERS[alert.stage];
            if (!cfg) return null;
            return (
              <div key={i} style={{ ...CARD, padding:'14px 18px', borderLeft:`5px solid ${cfg.color}`, background:cfg.bg, marginBottom:8, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:900, color:cfg.color, marginBottom:4 }}>{cfg.icon} {cfg.title.replace('[Lead]', alert.leadName)}</div>
                  <div style={{ fontSize:12, color:'#555', lineHeight:1.5 }}><b>{alert.leadName}</b> — {cfg.action}</div>
                  {alert.stage === 'won' && (
                    <div style={{ fontSize:11, fontWeight:700, marginTop:6, color: alert.projectCreated ? GR : AM }}>
                      {alert.projectCreated
                        ? '✓ Project automatically created in Projects tab with 30/30/30/10 milestones'
                        : '⚠ Project already exists in Projects tab — not duplicated'}
                    </div>
                  )}
                </div>
                <button onClick={()=>onClearAlert(i)} style={{ ...BTN, background:'transparent', color:'#999', fontSize:16, padding:'2px 8px', flexShrink:0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, marginBottom:16 }}>
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* Overdue Follow-Ups */}
      {overdue.length > 0 && (
        <div style={{ ...CARD, padding:16, marginBottom:16, borderTop:`3px solid ${R}` }}>
          <div style={{ fontSize:11, fontWeight:900, color:R, textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>⚠ {overdue.length} Overdue Follow-Up{overdue.length!==1?'s':''}</div>
          {overdue.map((l, i) => {
            const days = Math.abs(daysUntil(l.nextFollowUp)||0);
            const score = computeLeadScore(l);
            return (
              <div key={l.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom: i<overdue.length-1?'1px solid #f0f2f5':'none' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:N }}>{l.orgName}</div>
                  <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{l.nextAction || 'No action set'}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  <TempChip t={l.temperature} />
                  <ScoreChip score={score} />
                  <span style={{ fontSize:10, fontWeight:800, color:R, background:'#fff5f5', borderRadius:3, padding:'2px 8px' }}>{days}d overdue</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pipeline Funnel */}
      <div style={{ ...CARD, padding:16 }}>
        <div style={{ ...SL, marginBottom:12 }}>Pipeline Funnel</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
          {PIPELINE_STAGES.filter(s=>!['lost','nurture','won'].includes(s.id)).map(stage => {
            const count = leads.filter(l=>l.stage===stage.id).length;
            const val   = leads.filter(l=>l.stage===stage.id).reduce((sum,l)=>sum+(parseFloat(l.dealValue)||0),0);
            return (
              <div key={stage.id} style={{ background:'#f8f9fa', borderRadius:6, padding:'10px 12px', borderBottom:`3px solid ${count>0?T:'#e0e0e0'}` }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4, lineHeight:1.3 }}>{stage.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color:count>0?N:'#ccc', lineHeight:1 }}>{count}</div>
                {val>0 && <div style={{ fontSize:9, color:T, marginTop:3, fontWeight:700 }}>{fmtEGP(val)}</div>}
                <div style={{ fontSize:9, color:'#aaa', marginTop:3 }}>{stage.prob}% prob.</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Legend */}
      <div style={{ ...CARD, padding:16, marginTop:16 }}>
        <div style={{ ...SL, marginBottom:10 }}>Lead Score Legend</div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[{range:'80–100',label:'Priority Lead',color:GR,bg:'#e8f5e9'},{range:'60–79',label:'Good Lead',color:T,bg:'#e8f8f9'},{range:'40–59',label:'Nurture',color:AM,bg:'#fff3cd'},{range:'< 40',label:'Low Priority',color:'#888',bg:'#f5f5f5'}].map(c=>(
            <div key={c.range} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, fontWeight:900, color:c.color, background:c.bg, borderRadius:4, padding:'2px 8px' }}>{c.range}</span>
              <span style={{ fontSize:12, color:'#555' }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:11, color:'#888', lineHeight:1.6 }}>
          Score is computed automatically from: bill size (20pts) · system size (15pts) · pain point (10pts) · temperature (15pts) · segment (10pts) · source (10pts) · touches (10pts) · contact info (5pts) · notes (5pts)
        </div>
      </div>
    </div>
  );
};

// ── LEAD TABLE SECTION ─────────────────────────────────────────────────────────
const LeadTable = ({ leads, onEdit, onAdd, onExport, onImport, onDossier }) => {
  const [search, setSearch] = useState('');
  const [seg, setSeg]       = useState('All');
  const [stg, setStg]       = useState('All');
  const [tmp, setTmp]       = useState('All');
  const [sortKey, setSort]  = useState('score');
  const [sortDir, setSortDir] = useState(-1);
  const fileRef = useRef(null);

  const toggleSort = (k) => { if(sortKey===k) setSortDir(d=>-d); else { setSort(k); setSortDir(-1); } };

  const filtered = useMemo(() => {
    let r = leads;
    if (search) r = r.filter(l => l.orgName.toLowerCase().includes(search.toLowerCase()) || l.contactPerson.toLowerCase().includes(search.toLowerCase()) || l.notes.toLowerCase().includes(search.toLowerCase()));
    if (seg !== 'All') r = r.filter(l => l.segment === seg);
    if (stg !== 'All') r = r.filter(l => l.stage === stg);
    if (tmp !== 'All') r = r.filter(l => l.temperature === tmp);
    return [...r].sort((a,b) => {
      let va = sortKey==='score' ? computeLeadScore(a) : sortKey==='dealValue' ? (parseFloat(a.dealValue)||0) : a[sortKey]||'';
      let vb = sortKey==='score' ? computeLeadScore(b) : sortKey==='dealValue' ? (parseFloat(b.dealValue)||0) : b[sortKey]||'';
      return sortDir * (va < vb ? -1 : va > vb ? 1 : 0);
    });
  }, [leads, search, seg, stg, tmp, sortKey, sortDir]);

  const Th = ({ label, k }) => (
    <th onClick={()=>toggleSort(k)} style={{ padding:'8px 10px', background:'#f0f2f5', fontWeight:900, fontSize:10, textTransform:'uppercase', letterSpacing:'.5px', color:'#555', cursor:'pointer', textAlign:'left', whiteSpace:'nowrap', userSelect:'none' }}>
      {label} {sortKey===k ? (sortDir===-1?'↓':'↑') : ''}
    </th>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="Search leads..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...INP, width:200, flex:'0 0 auto' }} />
        <select value={seg} onChange={e=>setSeg(e.target.value)} style={{ ...INP, width:160 }}>
          <option>All</option>
          {SEGMENTS.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={stg} onChange={e=>setStg(e.target.value)} style={{ ...INP, width:180 }}>
          <option>All</option>
          {PIPELINE_STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={tmp} onChange={e=>setTmp(e.target.value)} style={{ ...INP, width:110 }}>
          <option>All</option>
          {TEMPERATURES.map(t=><option key={t}>{t}</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={()=>fileRef.current?.click()} style={{ ...BTN, background:'#f5f5f5', color:N }}>⬆ Import CSV</button>
          <button onClick={downloadTemplate} style={{ ...BTN, background:'#f5f5f5', color:T }}>⬇ CSV Template</button>
          <button onClick={onExport} style={{ ...BTN, background:'#f5f5f5', color:N }}>⬇ Export CSV</button>
          <button onClick={onAdd} style={{ ...BTN, background:N, color:'#fff' }}>+ New Lead</button>
        </div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onImport(ev.target.result); r.readAsText(f); e.target.value=''; }} />
      </div>

      <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>{filtered.length} lead{filtered.length!==1?'s':''} shown</div>

      {/* Table */}
      <div style={{ overflowX:'auto', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff' }}>
          <thead>
            <tr>
              <Th label="Score" k="score" />
              <Th label="Organization" k="orgName" />
              <Th label="Segment" k="segment" />
              <Th label="Governorate" k="governorate" />
              <Th label="Temp" k="temperature" />
              <Th label="Stage" k="stage" />
              <Th label="Deal Value" k="dealValue" />
              <Th label="Next Follow-Up" k="nextFollowUp" />
              <th style={{ padding:'8px 10px', background:'#f0f2f5', fontWeight:900, fontSize:10, textTransform:'uppercase', color:'#555' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding:24, textAlign:'center', color:'#aaa', fontSize:13 }}>No leads match filters. Add a new lead or adjust filters.</td></tr>
            )}
            {filtered.map((l, i) => {
              const score = computeLeadScore(l);
              const over  = isOverdue(l.nextFollowUp) && l.stage !== 'won' && l.stage !== 'lost';
              const days  = daysUntil(l.nextFollowUp);
              return (
                <tr key={l.id} style={{ background: i%2===0?'#fff':'#fafafa', borderBottom:'1px solid #f0f2f5' }}>
                  <td style={{ padding:'10px 10px' }}><ScoreChip score={score} /></td>
                  <td style={{ padding:'10px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:13, color:N, maxWidth:200 }}>{l.orgName}</div>
                    <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{l.contactPerson} {l.contactRole && `· ${l.contactRole}`}</div>
                    {over && <span style={{ fontSize:9, fontWeight:800, color:'#fff', background:R, borderRadius:3, padding:'1px 5px' }}>OVERDUE</span>}
                  </td>
                  <td style={{ padding:'10px 10px', fontSize:12, color:'#555' }}>{l.segment}</td>
                  <td style={{ padding:'10px 10px', fontSize:12, color:'#555' }}>{l.governorate}</td>
                  <td style={{ padding:'10px 10px' }}><TempChip t={l.temperature} /></td>
                  <td style={{ padding:'10px 10px' }}><StagePill stageId={l.stage} /></td>
                  <td style={{ padding:'10px 10px', fontSize:12, fontWeight:700, color:N, whiteSpace:'nowrap' }}>{l.dealValue ? fmtEGP(l.dealValue) : '—'}</td>
                  <td style={{ padding:'10px 10px', fontSize:11, color: over?R:'#555', fontWeight: over?700:400, whiteSpace:'nowrap' }}>
                    {l.nextFollowUp ? (over ? `${Math.abs(days)}d overdue` : days===0 ? 'Today' : `${days}d`) : '—'}
                  </td>
                  <td style={{ padding:'10px 10px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>onDossier(l)} style={{ ...BTN, background:'#e8f8f9', color:T, padding:'5px 8px', fontSize:11 }} title="View Dossier">📋</button>
                      <button onClick={()=>onEdit(l)} style={{ ...BTN, background:T, color:'#fff', padding:'5px 10px', fontSize:11 }}>Edit</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── PIPELINE KANBAN SECTION ────────────────────────────────────────────────────
const CRMKanban = ({ leads, onEdit, onStageChange, onDossier }) => {
  const [filter, setFilter] = useState('All');
  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.segment === filter);

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#555' }}>Filter by segment:</div>
        {['All',...SEGMENTS].map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ ...BTN, padding:'5px 12px', background:filter===s?N:'#f5f5f5', color:filter===s?'#fff':'#555', fontSize:11 }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ overflowX:'auto', paddingBottom:8 }}>
        <div style={{ display:'flex', gap:12, minWidth:'max-content' }}>
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
            const totalVal   = stageLeads.reduce((s,l) => s + (parseFloat(l.dealValue)||0), 0);
            const isTerminal = stage.id === 'won' || stage.id === 'lost';
            const colColor   = stage.id==='won' ? GR : stage.id==='lost' ? R : stage.id==='nurture' ? AM : T;
            return (
              <div key={stage.id} style={{ width:220, flexShrink:0 }}>
                <div style={{ background:colColor, color:'#fff', borderRadius:'6px 6px 0 0', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.5px' }}>{stage.label}</div>
                    <div style={{ fontSize:9, opacity:.7, marginTop:2 }}>{stage.prob}% probability</div>
                  </div>
                  <span style={{ background:'rgba(255,255,255,.2)', borderRadius:10, padding:'2px 8px', fontSize:12, fontWeight:900 }}>{stageLeads.length}</span>
                </div>
                {totalVal > 0 && (
                  <div style={{ background:'rgba(0,0,0,.04)', padding:'4px 12px', fontSize:10, fontWeight:700, color:'#555' }}>{fmtEGP(totalVal)}</div>
                )}
                <div style={{ background:'#f8f9fa', borderRadius:'0 0 6px 6px', padding:8, display:'flex', flexDirection:'column', gap:8, minHeight:60 }}>
                  {stageLeads.length === 0 && (
                    <div style={{ fontSize:11, color:'#bbb', textAlign:'center', padding:'16px 0' }}>Empty</div>
                  )}
                  {stageLeads.map(l => {
                    const score = computeLeadScore(l);
                    const over  = isOverdue(l.nextFollowUp);
                    const days  = daysUntil(l.nextFollowUp);
                    const stageIdx  = PIPELINE_STAGES.findIndex(s=>s.id===stage.id);
                    const prevStage = stageIdx > 0 ? PIPELINE_STAGES[stageIdx-1] : null;
                    const nextStage = stageIdx < PIPELINE_STAGES.length-1 ? PIPELINE_STAGES[stageIdx+1] : null;
                    return (
                      <div key={l.id} style={{ background:'#fff', borderRadius:6, padding:'10px 10px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', borderLeft:`3px solid ${l.temperature==='Hot'?R:l.temperature==='Warm'?'#D4770A':colColor}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                          <div style={{ fontSize:12, fontWeight:800, color:N, lineHeight:1.2, flex:1 }}>{l.orgName}</div>
                          <ScoreChip score={score} />
                        </div>
                        <div style={{ fontSize:10, color:'#888', marginBottom:5 }}>{l.segment} · {l.governorate}</div>
                        {l.dealValue && <div style={{ fontSize:11, fontWeight:700, color:T, marginBottom:5 }}>{fmtEGP(l.dealValue)}</div>}
                        {l.nextAction && <div style={{ fontSize:10, color:'#555', marginBottom:5, lineHeight:1.4, borderLeft:'2px solid #eee', paddingLeft:6 }}>{l.nextAction.slice(0,80)}{l.nextAction.length>80?'…':''}</div>}
                        {over && <div style={{ fontSize:9, fontWeight:800, color:R, marginBottom:4 }}>⚠ {Math.abs(days||0)}d overdue</div>}
                        {!over && l.nextFollowUp && <div style={{ fontSize:9, color:'#aaa', marginBottom:4 }}>Follow-up: {days===0?'Today':`${days}d`}</div>}
                        <div style={{ display:'flex', gap:4, marginTop:6 }}>
                          <button onClick={()=>onDossier(l)} style={{ ...BTN, padding:'3px 6px', fontSize:9, background:'#e8f8f9', color:T }} title="Dossier">📋</button>
                          <button onClick={()=>onEdit(l)} style={{ ...BTN, padding:'3px 8px', fontSize:9, background:'#f0f2f5', color:N, flex:1 }}>Edit</button>
                          {!isTerminal && nextStage && <button onClick={()=>onStageChange(l.id, nextStage.id, l.orgName)} style={{ ...BTN, padding:'3px 8px', fontSize:9, background:T, color:'#fff' }}>→</button>}
                        </div>
                        {/* Stage dropdown for quick move */}
                        <select value={l.stage} onChange={e=>onStageChange(l.id,e.target.value,l.orgName)}
                          style={{ ...INP, fontSize:9, padding:'3px 6px', marginTop:4, color:'#555' }}>
                          {PIPELINE_STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── TENDER TRACKER SECTION ─────────────────────────────────────────────────────
const TenderTracker = ({ tenders, onEdit, onAdd }) => {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:N }}>Government Tender Tracker</div>
          <div style={{ fontSize:11, color:'#888', marginTop:2 }}>Track, assess, and manage tender opportunities</div>
        </div>
        <button onClick={onAdd} style={{ ...BTN, background:N, color:'#fff' }}>+ Add Tender</button>
      </div>

      {/* Go/No-Go Gate explanation */}
      <div style={{ ...CARD, padding:'12px 16px', marginBottom:16, background:'#f8f9fa', border:'1px solid #eee' }}>
        <div style={{ fontSize:10, fontWeight:900, color:N, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Tender Review Decision Gate</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {['Scope matches capability','Documentation achievable','Capital exposure acceptable','Margin potential positive','Compliance requirements met','Deadline realistic'].map(c=>(
            <span key={c} style={{ fontSize:10, background:'#e8f8f9', color:T, borderRadius:3, padding:'2px 8px', fontWeight:600 }}>✓ {c}</span>
          ))}
        </div>
        <div style={{ fontSize:11, color:'#888', marginTop:8 }}>GO only if <b>all</b> conditions above are met. Otherwise: No-Go or Needs Review.</div>
      </div>

      {tenders.length === 0 && (
        <div style={{ ...CARD, padding:32, textAlign:'center', color:'#aaa' }}>No tenders tracked yet. Add a tender to start monitoring.</div>
      )}

      {tenders.map(t => {
        const days = daysUntil(t.deadline);
        const urgent = days !== null && days < 14 && days >= 0;
        const overdue = days !== null && days < 0;
        const recColors = { Go:{ color:GR, bg:'#e8f5e9' }, 'No-Go':{ color:R, bg:'#fff5f5' }, 'Needs Review':{ color:AM, bg:'#fff3cd' } };
        const rc = recColors[t.recommendation] || { color:'#888', bg:'#f5f5f5' };
        return (
          <div key={t.id} style={{ ...CARD, padding:16, marginBottom:12, borderLeft:`5px solid ${t.recommendation==='Go'?GR:t.recommendation==='No-Go'?R:AM}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:N, marginBottom:4 }}>{t.name}</div>
                <div style={{ fontSize:11, color:'#888' }}>{t.authority} · {t.sector} · {t.location}</div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {t.recommendation && <span style={{ fontSize:12, fontWeight:900, color:rc.color, background:rc.bg, borderRadius:4, padding:'4px 12px' }}>{t.recommendation}</span>}
                <span style={{ fontSize:11, fontWeight:700, color: overdue?R:urgent?AM:'#555', background: overdue?'#fff5f5':urgent?'#fff3cd':'#f5f5f5', borderRadius:4, padding:'4px 10px' }}>
                  {overdue ? `${Math.abs(days)}d OVERDUE` : days===0 ? 'DUE TODAY' : `${days}d left`}
                </span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, marginBottom:10 }}>
              {[
                { label:'Bid Bond', val:t.bidBond },
                { label:'Site Visit', val:t.siteVisitRequired?'Required':'Not Required' },
                { label:'Status', val:t.submissionStatus },
                { label:'Deadline', val:t.deadline },
              ].map(({ label, val }) => val ? (
                <div key={label}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
                  <div style={{ fontSize:12, color:N, marginTop:2 }}>{val}</div>
                </div>
              ) : null)}
            </div>
            {t.technicalReqs && <div style={{ fontSize:11, color:'#555', background:'#f8f9fa', padding:'8px 10px', borderRadius:4, marginBottom:8, lineHeight:1.5 }}><b>Technical Reqs:</b> {t.technicalReqs}</div>}
            {t.complianceNotes && <div style={{ fontSize:11, color:AM, background:'#fff3cd', padding:'8px 10px', borderRadius:4, marginBottom:8, lineHeight:1.5 }}><b>Compliance:</b> {t.complianceNotes}</div>}
            {t.nextAction && <div style={{ fontSize:12, fontWeight:700, color:T, marginBottom:8 }}>→ {t.nextAction}</div>}
            <button onClick={()=>onEdit(t)} style={{ ...BTN, background:'#f5f5f5', color:N, padding:'5px 12px', fontSize:11 }}>Edit Tender</button>
          </div>
        );
      })}
    </div>
  );
};

// ── RESEARCH QUEUE SECTION ─────────────────────────────────────────────────────
const ResearchQueue = ({ items, onEdit, onAdd }) => {
  const statusColors = { 'Pending':'#888', 'Verified':GR, 'Not Valid':R, 'Imported':T };
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:N }}>Lead Research Queue</div>
          <div style={{ fontSize:11, color:'#888', marginTop:2 }}>Track research tasks for discovering new leads by segment</div>
        </div>
        <button onClick={onAdd} style={{ ...BTN, background:N, color:'#fff' }}>+ Add Research Item</button>
      </div>

      <div style={{ ...CARD, padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f0f2f5' }}>
              {['ID','Segment','Search Query','Source','Org Found','Contact Found','Status','Assigned To','Import?','Notes','Actions'].map(h=>(
                <th key={h} style={{ padding:'8px 10px', fontWeight:900, fontSize:10, textTransform:'uppercase', letterSpacing:'.5px', color:'#555', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length===0 && <tr><td colSpan={11} style={{ padding:24, textAlign:'center', color:'#aaa', fontSize:13 }}>No research items. Add a target segment to start building your lead pipeline.</td></tr>}
            {items.map((r, i) => (
              <tr key={r.id} style={{ borderBottom:'1px solid #f0f2f5', background: i%2===0?'#fff':'#fafafa' }}>
                <td style={{ padding:'8px 10px', fontSize:11, color:'#888' }}>{r.id}</td>
                <td style={{ padding:'8px 10px' }}><Chip label={r.targetSegment} /></td>
                <td style={{ padding:'8px 10px', fontSize:11, color:'#555', maxWidth:200 }}>{r.searchQuery}</td>
                <td style={{ padding:'8px 10px', fontSize:11, color:'#555' }}>{r.sourceWebsite||'—'}</td>
                <td style={{ padding:'8px 10px', fontSize:11, color: r.orgFound?N:'#bbb' }}>{r.orgFound||'—'}</td>
                <td style={{ padding:'8px 10px', fontSize:11, color: r.contactFound?N:'#bbb' }}>{r.contactFound||'—'}</td>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:statusColors[r.verificationStatus]||'#888', background:'#f5f5f5', borderRadius:3, padding:'2px 8px' }}>{r.verificationStatus}</span>
                </td>
                <td style={{ padding:'8px 10px', fontSize:11, color:'#555' }}>{r.assignedTo||'—'}</td>
                <td style={{ padding:'8px 10px' }}>
                  <span style={{ fontSize:10, fontWeight:700, color: r.importToCRM?GR:'#aaa' }}>{r.importToCRM?'YES':'No'}</span>
                </td>
                <td style={{ padding:'8px 10px', fontSize:10, color:'#888', maxWidth:180 }}>{r.notes?.slice(0,60)}{r.notes?.length>60?'…':''}</td>
                <td style={{ padding:'8px 10px' }}>
                  <button onClick={()=>onEdit(r)} style={{ ...BTN, padding:'4px 10px', fontSize:10, background:'#f5f5f5', color:N }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── SALES VELOCITY SECTION ────────────────────────────────────────────────────
const VelocityTab = ({ leads }) => {
  const won    = leads.filter(l => l.stage === 'won');
  const lost   = leads.filter(l => l.stage === 'lost');
  const active = leads.filter(l => !['won', 'lost', 'nurture'].includes(l.stage));
  const hot    = leads.filter(l => l.temperature === 'Hot' && !['won','lost'].includes(l.stage));
  const negot  = leads.filter(l => l.stage === 'negotiation');
  const overdue = leads.filter(l => isOverdue(l.nextFollowUp) && !['won','lost'].includes(l.stage));

  const winRate = (won.length + lost.length) > 0
    ? Math.round(won.length / (won.length + lost.length) * 100) : null;

  const avgWonDeal = won.length > 0
    ? Math.round(won.reduce((s, l) => s + (parseFloat(l.dealValue) || 0), 0) / won.length) : 0;

  const weightedPipe = active.reduce((s, l) =>
    s + (parseFloat(l.dealValue) || 0) * stageProb(l.stage) / 100, 0);

  const totalPipe = active.reduce((s, l) =>
    s + (parseFloat(l.dealValue) || 0), 0);

  // Conversion funnel: what % of leads ever reached each stage or beyond
  const funnelOrder = ['contacted', 'qualified', 'site_visit_scheduled', 'site_visit_completed', 'feasibility_proposed', 'feasibility_sold', 'proposal_sent', 'negotiation', 'won'];
  const totalLeads = leads.filter(l => l.stage !== 'nurture').length;

  const funnelData = funnelOrder.map(stageId => {
    const stageIdx = PIPELINE_STAGES.findIndex(s => s.id === stageId);
    const countAtOrBeyond = leads.filter(l => {
      const lIdx = PIPELINE_STAGES.findIndex(s => s.id === l.stage);
      return lIdx >= stageIdx;
    }).length;
    return {
      stageId,
      label: stageById[stageId]?.label || stageId,
      count: countAtOrBeyond,
      pct: totalLeads > 0 ? Math.round(countAtOrBeyond / totalLeads * 100) : 0,
    };
  });

  // Top close targets: hot or negotiation leads with highest deal value
  const closeCandidates = [...leads]
    .filter(l => ['negotiation', 'proposal_sent', 'feasibility_delivered'].includes(l.stage))
    .sort((a, b) => (parseFloat(b.dealValue) || 0) - (parseFloat(a.dealValue) || 0))
    .slice(0, 5);

  // Pipeline health score (0–100)
  const healthFactors = [
    { label: 'Hot leads present',    score: hot.length >= 1 ? 20 : 0,    max: 20 },
    { label: 'No overdue follow-ups', score: overdue.length === 0 ? 20 : Math.max(0, 20 - overdue.length * 4), max: 20 },
    { label: 'Active proposals out', score: negot.length >= 1 ? 20 : leads.filter(l => l.stage === 'proposal_sent').length >= 1 ? 10 : 0, max: 20 },
    { label: 'Pipeline size (leads)', score: Math.min(20, active.length * 2), max: 20 },
    { label: 'Weighted value',        score: Math.min(20, Math.floor(weightedPipe / 50000)), max: 20 },
  ];
  const healthScore = healthFactors.reduce((s, f) => s + f.score, 0);
  const healthColor = healthScore >= 70 ? GR : healthScore >= 40 ? AM : R;

  // Loss analysis data
  const lossWithData = lost.filter(l => l.stageData?.lost);
  const lossReasons = {}; const lossComps = {}; const lossLessons = [];
  lossWithData.forEach(l => {
    const d = l.stageData.lost;
    if (d.lossReason)     lossReasons[d.lossReason]    = (lossReasons[d.lossReason]||0) + 1;
    if (d.competitorName) lossComps[d.competitorName]  = (lossComps[d.competitorName]||0) + 1;
    if (d.lessonsLearned) lossLessons.push({ org: l.orgName, lesson: d.lessonsLearned });
  });
  const maxReasonCnt      = Math.max(...Object.values(lossReasons), 1);
  const sortedLossReasons = Object.entries(lossReasons).sort((a,b) => b[1]-a[1]);
  const sortedLossComps   = Object.entries(lossComps).sort((a,b) => b[1]-a[1]);

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Win Rate', value: winRate !== null ? `${winRate}%` : 'No data', color: winRate >= 30 ? GR : winRate !== null ? AM : '#888', sub: `${won.length} won / ${lost.length} lost` },
          { label: 'Avg Won Deal', value: avgWonDeal ? fmtEGP(avgWonDeal) : '—', color: N, sub: `from ${won.length} closed deals` },
          { label: 'Weighted Pipeline', value: fmtEGP(weightedPipe), color: T, sub: 'probability-adjusted' },
          { label: 'Total Active Value', value: fmtEGP(totalPipe), color: N, sub: `${active.length} active leads` },
          { label: 'Pipeline Health', value: `${healthScore}/100`, color: healthColor, sub: healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs attention' : 'At risk' },
        ].map(m => (
          <div key={m.label} style={{ ...CARD, padding: '14px 16px', borderTop: `3px solid ${m.color}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
            {m.sub && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{m.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>

        {/* Funnel */}
        <div style={{ ...CARD, padding: 16 }}>
          <div style={{ ...SL, marginBottom: 12 }}>Conversion Funnel</div>
          {funnelData.map((row, i) => (
            <div key={row.stageId} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#555', fontWeight: row.stageId === 'won' ? 700 : 400 }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.count > 0 ? T : '#ccc' }}>{row.count} ({row.pct}%)</span>
              </div>
              <div style={{ background: '#eee', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.stageId === 'won' ? GR : T, transition: 'width .3s', opacity: 0.7 + (i / funnelOrder.length) * 0.3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 10, color: '#888' }}>Reads as: "X% of all leads reached this stage or higher"</div>
        </div>

        {/* Pipeline health breakdown */}
        <div style={{ ...CARD, padding: 16 }}>
          <div style={{ ...SL, marginBottom: 12 }}>Pipeline Health Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: healthColor }}>{healthScore}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: healthColor }}>{healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs Attention' : 'At Risk'}</div>
              <div style={{ background: '#eee', borderRadius: 4, height: 8, width: 120, overflow: 'hidden', marginTop: 4 }}>
                <div style={{ width: `${healthScore}%`, height: '100%', background: healthColor, transition: 'width .4s' }} />
              </div>
            </div>
          </div>
          {healthFactors.map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: 11, color: '#555' }}>{f.label}</span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[...Array(f.max / 5)].map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: i < f.score / 5 ? healthColor : '#eee' }} />
                ))}
                <span style={{ fontSize: 10, color: f.score === f.max ? GR : '#aaa', fontWeight: 700, marginLeft: 4 }}>{f.score}/{f.max}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Close candidates */}
        <div style={{ ...CARD, padding: 16 }}>
          <div style={{ ...SL, marginBottom: 12 }}>Top Close Targets</div>
          {closeCandidates.length === 0 ? (
            <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', padding: 20 }}>No proposals or negotiations in progress.</div>
          ) : (
            closeCandidates.map((l, i) => {
              const over = isOverdue(l.nextFollowUp);
              const days = daysUntil(l.nextFollowUp);
              return (
                <div key={l.id} style={{ padding: '9px 0', borderBottom: i < closeCandidates.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: N }}>{l.orgName}</div>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        <StagePill stageId={l.stage} />
                        {' '}
                        {l.temperature === 'Hot' && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: R, borderRadius: 3, padding: '1px 5px' }}>HOT</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T }}>{l.dealValue ? fmtEGP(l.dealValue) : '—'}</div>
                      {l.nextFollowUp && (
                        <div style={{ fontSize: 10, color: over ? R : '#aaa', marginTop: 2 }}>
                          {over ? `${Math.abs(days || 0)}d overdue` : days === 0 ? 'Today' : `${days}d`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Loss Analysis */}
      {lost.length > 0 && (
        <div style={{ ...CARD, padding:16, marginTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ ...SL }}>Loss Analysis</div>
            <span style={{ fontSize:11, color:'#888' }}>
              {lossWithData.length > 0 ? `${lossWithData.length} of ${lost.length} deals have dossier data` : `${lost.length} deal${lost.length!==1?'s':''} lost — fill in Stage Dossier → Deal Lost to see patterns`}
            </span>
          </div>
          {lossWithData.length === 0 ? (
            <div style={{ fontSize:11, color:'#bbb', textAlign:'center', padding:'12px 0' }}>
              Open a lost lead → Stage Dossier tab → Deal Lost section to log loss reasons, competitor names, and lessons.
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
              {sortedLossReasons.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:N, marginBottom:8 }}>Loss Reasons</div>
                  {sortedLossReasons.map(([reason, count]) => (
                    <div key={reason} style={{ marginBottom:7 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:2 }}>
                        <span style={{ color:'#555' }}>{reason}</span>
                        <span style={{ fontWeight:700, color:R }}>{count}</span>
                      </div>
                      <div style={{ background:'#f5f5f5', borderRadius:3, height:6 }}>
                        <div style={{ width:`${count/maxReasonCnt*100}%`, height:'100%', background:R, borderRadius:3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sortedLossComps.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:N, marginBottom:8 }}>Competitors Encountered</div>
                  {sortedLossComps.map(([name, count], i) => (
                    <div key={name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom:i<sortedLossComps.length-1?'1px solid #f5f5f5':'none' }}>
                      <span style={{ fontSize:11, color:'#555' }}>{name}</span>
                      <span style={{ fontSize:11, fontWeight:900, color:R, background:'#fff5f5', borderRadius:3, padding:'1px 8px' }}>{count}×</span>
                    </div>
                  ))}
                </div>
              )}
              {lossLessons.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:N, marginBottom:8 }}>Lessons Learned</div>
                  {lossLessons.slice(0,4).map((item, i) => (
                    <div key={i} style={{ padding:'6px 0', borderBottom:i<Math.min(lossLessons.length,4)-1?'1px solid #f5f5f5':'none' }}>
                      <div style={{ fontSize:9, color:'#aaa', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:2 }}>{item.org}</div>
                      <div style={{ fontSize:11, color:'#555', lineHeight:1.4 }}>{item.lesson.slice(0,120)}{item.lesson.length>120?'…':''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

// ── SCORE GUIDE SECTION ────────────────────────────────────────────────────────
const ScoreGuide = () => (
  <div>
    <div style={{ ...CARD, padding:20, marginBottom:16 }}>
      <div style={{ fontSize:14, fontWeight:900, color:N, marginBottom:4 }}>Lead Scoring Model — 100 Points</div>
      <div style={{ fontSize:11, color:'#888', marginBottom:16 }}>Scores are computed automatically from lead fields. No manual input needed.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {[
          { factor:'Monthly Electricity Bill', max:20, breakdown:'> EGP 80K = 20pts · > 30K = 15pts · > 10K = 10pts · > 5K = 5pts' },
          { factor:'Estimated System Size (kW)', max:15, breakdown:'> 200kW = 15pts · > 50kW = 12pts · > 10kW = 8pts · > 0kW = 3pts' },
          { factor:'Lead Temperature', max:15, breakdown:'Hot = 15pts · Warm = 8pts · Cold = 2pts' },
          { factor:'Primary Pain Point', max:10, breakdown:'Diesel Replacement = 10 · Power Cuts = 8 · High Bills = 6 · Expansion = 5 · ESG = 3' },
          { factor:'Segment Attractiveness', max:10, breakdown:'Factory = 10 · Mall = 9 · Govt Tender = 8 · Farm = 7 · School = 6 · Other = 4' },
          { factor:'Source Quality', max:10, breakdown:'Referral = 10 · Network = 9 · Tender Portal = 7 · LinkedIn = 6 · Cold/Website = 5' },
          { factor:'Number of Touches', max:10, breakdown:'> 5 touches = 10pts · ≥ 3 touches = 7pts · ≥ 1 touch = 4pts' },
          { factor:'Contact Info Completeness', max:5, breakdown:'Phone or WhatsApp = 3pts · Email = 2pts' },
          { factor:'Notes Quality', max:5, breakdown:'Detailed notes (> 30 chars) = 5pts' },
        ].map(({ factor, max, breakdown }) => (
          <div key={factor} style={{ background:'#f8f9fa', borderRadius:6, padding:'10px 14px', borderLeft:`3px solid ${T}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontSize:12, fontWeight:700, color:N }}>{factor}</div>
              <span style={{ fontSize:11, fontWeight:900, color:T, background:'#e8f8f9', borderRadius:4, padding:'1px 8px' }}>max {max}pts</span>
            </div>
            <div style={{ fontSize:10, color:'#888', lineHeight:1.5 }}>{breakdown}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ ...CARD, padding:20 }}>
      <div style={{ fontSize:13, fontWeight:900, color:N, marginBottom:12 }}>Pipeline Stage Exit Criteria</div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#f0f2f5' }}>
              <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:900, fontSize:10, textTransform:'uppercase', color:'#555' }}>Stage</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:900, fontSize:10, textTransform:'uppercase', color:'#555' }}>Probability</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:900, fontSize:10, textTransform:'uppercase', color:'#555' }}>Exit Criteria</th>
              <th style={{ padding:'8px 12px', textAlign:'left', fontWeight:900, fontSize:10, textTransform:'uppercase', color:'#555' }}>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { stage:'Unqualified Lead', prob:'5%', exit:'Lead captured from any source', next:'Make first contact by phone or WhatsApp' },
              { stage:'Contacted', prob:'15%', exit:'First contact made — responded or not', next:'Qualify: bill size, ownership, decision maker' },
              { stage:'Qualified', prob:'30%', exit:'Bill > EGP 10K, owns roof/land, can reach decision maker', next:'Schedule and confirm site visit' },
              { stage:'Site Visit Scheduled', prob:'45%', exit:'Site visit confirmed with date and location', next:'Prepare site checklist, bring engineer if available' },
              { stage:'Site Visit Completed', prob:'55%', exit:'Site assessed — roof area, load data, shading noted', next:'Propose paid feasibility study (EGP 3,000–5,000)' },
              { stage:'Paid Feasibility Proposed', prob:'60%', exit:'Feasibility study proposal sent with price', next:'Follow up 2×/week — collect deposit' },
              { stage:'Feasibility Study Sold', prob:'70%', exit:'Deposit collected — study confirmed', next:'Create PM task, begin study, deliver in 7–14 days' },
              { stage:'Feasibility Delivered', prob:'75%', exit:'Study delivered and presented', next:'Send EPC proposal within 48h of delivery' },
              { stage:'EPC Proposal Sent', prob:'50%', exit:'Full EPC proposal with FX clause sent', next:'Follow up daily — answer questions — collect 30% deposit on signature' },
              { stage:'Negotiation', prob:'70%', exit:'Client engaging on terms', next:'Protect margin — no discount without scope removal. Confirm FX clause.' },
              { stage:'Won', prob:'100%', exit:'Contract signed + deposit collected', next:'Launch execution workflow in PM system' },
              { stage:'Lost', prob:'0%', exit:'Client confirmed no or chose competitor', next:'Log reason — add to nurture list if relationship remains' },
              { stage:'Nurture Later', prob:'10%', exit:'Client interested but timing not right', next:'Monthly check-in — WhatsApp touch every 4–6 weeks' },
            ].map((row, i) => (
              <tr key={row.stage} style={{ borderBottom:'1px solid #f0f2f5', background:i%2===0?'#fff':'#fafafa' }}>
                <td style={{ padding:'8px 12px', fontWeight:600, color:N }}>{row.stage}</td>
                <td style={{ padding:'8px 12px', fontWeight:900, color:T }}>{row.prob}</td>
                <td style={{ padding:'8px 12px', color:'#555', lineHeight:1.4 }}>{row.exit}</td>
                <td style={{ padding:'8px 12px', color:'#555', lineHeight:1.4 }}>{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── MAIN CRM VIEW ──────────────────────────────────────────────────────────────
export const CRMView = () => {
  const [leads,    setLeads]    = useState(() => {
    const raw = loadLS(LS.leads, INIT_LEADS);
    return raw.map(l => ({ stageData:{}, ...l }));
  });
  const [tenders,  setTenders]  = useState(() => loadLS(LS.tenders,  INIT_TENDERS));
  const [research, setResearch] = useState(() => loadLS(LS.research, INIT_RESEARCH));
  const [subTab,   setSubTab]   = useState('dashboard');
  const [leadModal,    setLeadModal]    = useState(null); // null | 'new' | lead object
  const [tenderModal,  setTenderModal]  = useState(null);
  const [researchModal,setResearchModal]= useState(null);
  const [dossierLead,  setDossierLead]  = useState(null);
  const [pmAlerts, setPmAlerts] = useState([]);

  const syncLeads   = (next) => { setLeads(next);   saveLS(LS.leads,   next); };
  const syncTenders = (next) => { setTenders(next); saveLS(LS.tenders, next); };
  const syncResearch= (next) => { setResearch(next);saveLS(LS.research,next); };

  const saveLead = (f) => {
    const oldLead = leads.find(l => l.id === f.id);
    const next = leads.some(l=>l.id===f.id) ? leads.map(l=>l.id===f.id?f:l) : [...leads, f];
    syncLeads(next);
    if (f.stage === 'won' && (!oldLead || oldLead.stage !== 'won')) {
      const created = autoCreateProject(f);
      setPmAlerts(prev => [...prev, { stage:'won', leadName: f.orgName, projectCreated: created }]);
    }
    setLeadModal(null);
  };

  const deleteLead = (id) => { syncLeads(leads.filter(l=>l.id!==id)); setLeadModal(null); };

  const handleStageChange = (leadId, newStage, leadName) => {
    const oldLead = leads.find(l => l.id === leadId);
    const next = leads.map(l => l.id===leadId ? { ...l, stage:newStage, probability:String(stageProb(newStage)) } : l);
    syncLeads(next);
    if (PM_TRIGGERS[newStage]) {
      const wonLead = newStage === 'won' && (!oldLead || oldLead.stage !== 'won')
        ? next.find(l => l.id === leadId) : null;
      const projectCreated = wonLead ? autoCreateProject(wonLead) : false;
      setPmAlerts(prev => [...prev, { stage:newStage, leadName, projectCreated }]);
    }
  };

  const saveTender  = (f) => { const next = tenders.some(t=>t.id===f.id) ? tenders.map(t=>t.id===f.id?f:t) : [...tenders,f]; syncTenders(next); setTenderModal(null); };
  const deleteTender= (id) => { syncTenders(tenders.filter(t=>t.id!==id)); setTenderModal(null); };

  const saveResearch  = (f) => { const next = research.some(r=>r.id===f.id) ? research.map(r=>r.id===f.id?f:r) : [...research,f]; syncResearch(next); setResearchModal(null); };
  const deleteResearch= (id) => { syncResearch(research.filter(r=>r.id!==id)); setResearchModal(null); };

  const handleImport = (csvText) => {
    const newLeads = parseImportCSV(csvText, leads);
    if (newLeads.length === 0) { alert('No valid rows found. Download the template to see the expected format.'); return; }
    if (window.confirm(`Import ${newLeads.length} new lead(s)? Existing leads will not be affected.`)) {
      syncLeads([...leads, ...newLeads]);
      alert(`✓ ${newLeads.length} lead(s) imported successfully.`);
    }
  };

  const SUB_TABS = [
    { id:'dashboard', label:'Dashboard' },
    { id:'leads',     label:'Lead Table' },
    { id:'pipeline',  label:'Pipeline' },
    { id:'velocity',  label:'Velocity' },
    { id:'tenders',   label:'Tender Tracker' },
    { id:'research',  label:'Research Queue' },
    { id:'guide',     label:'Score & Stage Guide' },
  ];

  const overdueCount = leads.filter(l => isOverdue(l.nextFollowUp) && l.stage !== 'won' && l.stage !== 'lost').length;

  return (
    <div style={{ maxWidth:1400, margin:'0 auto' }}>
      {/* Sub-tab nav */}
      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:`2px solid #e0e0e0`, flexWrap:'wrap' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={()=>setSubTab(t.id)}
            style={{ padding:'8px 16px', background:'transparent', border:'none', borderBottom: subTab===t.id?`2px solid ${G}`:'2px solid transparent', color: subTab===t.id?G:'#888', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase', letterSpacing:'.3px', marginBottom:-2, transition:'color .15s', whiteSpace:'nowrap' }}>
            {t.label}
            {t.id==='dashboard' && overdueCount>0 && <span style={{ marginLeft:5, background:R, color:'#fff', borderRadius:10, padding:'0 5px', fontSize:9, fontWeight:900 }}>{overdueCount}</span>}
            {t.id==='dashboard' && pmAlerts.length>0 && <span style={{ marginLeft:4, background:G, color:'#fff', borderRadius:10, padding:'0 5px', fontSize:9, fontWeight:900 }}>{pmAlerts.length}</span>}
          </button>
        ))}
      </div>

      {/* PM alerts banner (persistent across sub-tabs) */}
      {pmAlerts.length > 0 && subTab !== 'dashboard' && (
        <div style={{ background:'#e8f5e9', border:`1px solid ${GR}`, borderRadius:6, padding:'10px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, fontWeight:700, color:GR }}>🏆 {pmAlerts.length} PM action{pmAlerts.length!==1?'s':''} pending — check Dashboard tab</div>
          <button onClick={()=>setPmAlerts([])} style={{ ...BTN, background:'transparent', color:GR, padding:'2px 8px' }}>Dismiss all</button>
        </div>
      )}

      {/* Content */}
      {subTab === 'dashboard' && (
        <CRMDashboard leads={leads} tenders={tenders} pmAlerts={pmAlerts} onClearAlert={i=>setPmAlerts(p=>p.filter((_,idx)=>idx!==i))} />
      )}
      {subTab === 'leads' && (
        <LeadTable leads={leads} onEdit={setLeadModal} onAdd={()=>setLeadModal('new')} onExport={()=>exportLeadsCSV(leads)} onImport={handleImport} onDossier={setDossierLead} />
      )}
      {subTab === 'pipeline' && (
        <CRMKanban leads={leads} onEdit={setLeadModal} onStageChange={handleStageChange} onDossier={setDossierLead} />
      )}
      {subTab === 'velocity' && <VelocityTab leads={leads} />}
      {subTab === 'tenders' && (
        <TenderTracker tenders={tenders} onEdit={setTenderModal} onAdd={()=>setTenderModal('new')} />
      )}
      {subTab === 'research' && (
        <ResearchQueue items={research} onEdit={setResearchModal} onAdd={()=>setResearchModal('new')} />
      )}
      {subTab === 'guide' && <ScoreGuide />}

      {/* Modals */}
      {leadModal && (
        <LeadModal
          lead={leadModal === 'new' ? null : leadModal}
          leads={leads}
          onSave={saveLead}
          onDelete={deleteLead}
          onClose={()=>setLeadModal(null)}
        />
      )}
      {tenderModal && (
        <TenderModal
          tender={tenderModal === 'new' ? null : tenderModal}
          tenders={tenders}
          onSave={saveTender}
          onDelete={deleteTender}
          onClose={()=>setTenderModal(null)}
        />
      )}
      {researchModal && (
        <ResearchModal
          item={researchModal === 'new' ? null : researchModal}
          items={research}
          onSave={saveResearch}
          onDelete={deleteResearch}
          onClose={()=>setResearchModal(null)}
        />
      )}
      {dossierLead && (
        <DossierModal
          lead={dossierLead}
          onClose={() => setDossierLead(null)}
          onEdit={() => { setDossierLead(null); setLeadModal(dossierLead); }}
        />
      )}
    </div>
  );
};
