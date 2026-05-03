import { useState } from 'react';
import { SalesIntelView } from './SalesIntelView';

const N = '#0D2137';
const G = '#C8991A';
const T = '#1A6B72';

// ── Playbook definitions ───────────────────────────────────────────────────────

const PLAYBOOKS = [
  {
    id: 'PB-1',
    title: 'First Client Meeting',
    role: 'Founder',
    phase: 'Sales',
    duration: '60–90 min',
    trigger: 'When a qualified lead agrees to meet',
    objective: 'Qualify decision-maker authority, confirm technical viability, and set up site visit',
    prereqs: ['Lead is Qualified or higher in CRM', 'Electricity bill confirmed > EGP 10K/month', 'Contact is owner or CFO-level'],
    steps: [
      { n: 1, action: 'Review the lead profile in CRM before the meeting', detail: 'Confirm: bill size, segment, pain points, previous touchpoints. Print or note the lead score.' },
      { n: 2, action: 'Open with pain-focused framing', detail: '"Your current bill at EGP X/month means you\'re spending EGP [12×X] per year. What would you do with that saving?" Let them lead.' },
      { n: 3, action: 'Qualify decision authority explicitly', detail: '"If we present a compelling solution, who else needs to be in the room for approval?" If not the decision-maker, request the right person before the next meeting.' },
      { n: 4, action: 'Collect utility bill on the spot', detail: 'Ask for a recent bill (photo is fine). Confirm the connection type (single-phase vs 3-phase), contracted capacity, and tariff category.' },
      { n: 5, action: 'Do a rough feasibility estimate verbally', detail: 'System size ≈ (monthly bill ÷ EGP/kWh ÷ 30 days ÷ peak hours). For C&I: assume 5h/day. Give a ballpark: "Probably 50–100 kWp range."' },
      { n: 6, action: 'Propose paid feasibility study', detail: '"To give you exact numbers — yield, ROI, payback — we do a site assessment and detailed study for EGP 5,000. That\'s credited against the full EPC contract." Handle objections: common one is "why pay?"' },
      { n: 7, action: 'Set next step with a date', detail: 'Leave with a confirmed site visit date and time, or a decision deadline: "Can we confirm the site visit for Thursday at 10am?"' },
    ],
    tools: ['CRM lead profile', 'Utility bill (paper or photo)', 'Calculator on phone', 'Business card or WhatsApp contact'],
    successCriteria: ['Site visit date confirmed', 'Feasibility study interest expressed', 'Utility bill collected', 'Decision-maker identified'],
    mistakes: ['Presenting pricing before understanding their pain', 'Allowing a meeting without the decision-maker', 'Forgetting to collect the utility bill'],
  },
  {
    id: 'PB-2',
    title: 'Site Visit',
    role: 'Founder (Engineer)',
    phase: 'Technical',
    duration: '2–3 hours on-site',
    trigger: 'Site visit scheduled in CRM',
    objective: 'Collect all data needed to produce a bankable feasibility study',
    prereqs: ['Utility bill reviewed', 'Site visit confirmed with date + contact', 'Checklist prepared'],
    steps: [
      { n: 1, action: 'Arrive with full equipment kit', detail: 'Measuring tape, compass or phone compass app, inclinometer (or phone app), camera, shading analysis app (SunSurveyor), meter readings form, laptop or tablet.' },
      { n: 2, action: 'Inspect roof/ground mounting area', detail: 'Measure usable area (exclude HVAC, water tanks, access paths). Note orientation (azimuth), tilt of existing structure, shading obstacles (buildings, trees, poles) and their height/distance.' },
      { n: 3, action: 'Document electrical infrastructure', detail: 'Identify main DB panel, available 3-phase breaker slots, transformer capacity, connection point for grid-tie. Check for ABB or Schneider panels — note brand for inverter compatibility.' },
      { n: 4, action: 'Photograph everything systematically', detail: '4 compass directions from roof centre, all shading obstacles, DB panel + meter, building exterior, roof condition. Minimum 20 photos.' },
      { n: 5, action: 'Collect load data', detail: 'Monthly consumption for last 12 months (from utility account or bill history). Peak demand (kVA) from bill or DB panel nameplate. Operating hours: 8-hour shift? 24/7? Weekend use?' },
      { n: 6, action: 'Capture DISCO details', detail: 'Note the local DISCO (EEDCS, UEDCO, UPPCO, etc.). Identify feeder type and voltage level. Ask about any net-metering applications the client has already started.' },
      { n: 7, action: 'Take contact details for technical liaison', detail: 'Get the name and direct number of the facilities/maintenance manager — they\'ll be your installation point of contact.' },
      { n: 8, action: 'Update CRM on-site', detail: 'Change stage to Site Visit Completed. Add system size estimate, consumption data, and shading risk level in notes. Set next follow-up: 3 days.' },
    ],
    tools: ['SunSurveyor app (solar path)', 'Phone compass', 'Measuring tape', 'Camera', 'Site visit form', 'CRM app on phone'],
    successCriteria: ['All roof dimensions recorded', 'Load data for 12 months', 'Shading assessment done', 'DB panel photo taken', 'Stage updated in CRM', 'Next follow-up set'],
    mistakes: ['Forgetting load data — no study can be done without it', 'Not photographing the DB panel', 'Not checking net-metering eligibility at DISCO level', 'Leaving without a confirmed feasibility study start date'],
  },
  {
    id: 'PB-3',
    title: 'Feasibility Study Delivery',
    role: 'Founder (Engineer)',
    phase: 'Technical → Sales',
    duration: '5–14 days production, 30 min delivery meeting',
    trigger: 'Feasibility deposit collected from client',
    objective: 'Deliver a credible, client-facing study that transitions directly into an EPC proposal discussion',
    prereqs: ['Site data complete', 'Feasibility deposit collected (EGP 3K–5K)', 'PVsyst or PV*SOL available'],
    steps: [
      { n: 1, action: 'Run PVsyst simulation', detail: 'Use Meteonorm or SolarGIS data for the site. Model shading with nearby obstacles. Use IEC-certified panel model. Target yield: 1,400–1,600 kWh/kWp/year for Egypt.' },
      { n: 2, action: 'Build the financial model', detail: 'Revenue: self-consumption savings + net-metering export. CAPEX: EGP/Wp estimate for the system size. Opex: O&M 1% of CAPEX/year. Discount rate: 15–18% (EGP inflation hedge). Calculate: payback, NPV, IRR.' },
      { n: 3, action: 'Prepare client-facing report', detail: 'Arabic + English. Sections: site summary, yield simulation, financial model, equipment spec, NREA/DISCO process, next steps. Max 15 pages — keep it visual.' },
      { n: 4, action: 'Internal review before delivery', detail: 'Check: all numbers consistent, no EGP typos, simulation assumptions documented, IEC certificates referenced. Have the accountant check the financial page.' },
      { n: 5, action: 'Deliver in person — never by email alone', detail: 'Present the report in a 30-min meeting. Walk through: yield numbers, payback, IRR. Highlight the FX risk slide — "panel prices are USD-denominated, which is why we recommend moving quickly."' },
      { n: 6, action: 'Present the EPC proposal at the same meeting', detail: 'Bring a pre-prepared EPC proposal with the contract value, scope, payment schedule (30/30/30/10), and FX escalation clause. Say: "The feasibility fee is deducted from this." Ask for in-principle agreement before leaving.' },
      { n: 7, action: 'Update CRM', detail: 'Move to Feasibility Delivered. Set next follow-up: 48 hours. Note any objections raised in the meeting.' },
    ],
    tools: ['PVsyst or PV*SOL', 'Excel financial model', 'PowerPoint or PDF report', 'Printed EPC proposal', 'FX rate screenshot on the day'],
    successCriteria: ['Report delivered in person', 'EPC proposal presented', 'Client\'s key objections documented', 'Next step with date agreed'],
    mistakes: ['Emailing the report without a meeting', 'Not having the EPC proposal ready at delivery', 'Forgetting the FX escalation clause', 'Making the report > 20 pages'],
  },
  {
    id: 'PB-4',
    title: 'Contract Signing & Deposit Collection',
    role: 'Founder + Lawyer',
    phase: 'Commercial',
    duration: 'Same session as negotiation close',
    trigger: 'Client agrees to proceed with EPC proposal',
    objective: 'Execute a signed contract and collect 30% deposit before any procurement begins',
    prereqs: ['EPC contract template reviewed by lawyer', 'FX escalation clause included', 'NREA certificate submitted or referenced', 'Bank account open'],
    steps: [
      { n: 1, action: 'Confirm scope and price verbally before printing', detail: 'No ambiguity on: system size (kWp), panel brand/model, inverter brand/model, mounting type, grid-tie type, warranty periods, DISCO application scope.' },
      { n: 2, action: 'Print 2 originals of the contract', detail: 'Client keeps one, you keep one. Stamp both copies with company seal. Both parties sign all pages — not just the last.' },
      { n: 3, action: 'Confirm payment details on the spot', detail: 'Give the client your company bank account details in writing. Agree on transfer method and timeline: "30% within 3 working days of today." Get confirmation in WhatsApp.' },
      { n: 4, action: 'Do NOT start procurement until deposit clears', detail: 'This is a hard rule. Transfer shows in account = cleared. Call or check online banking to confirm before ordering anything.' },
      { n: 5, action: 'Send deposit receipt and project timeline', detail: 'Same day the deposit clears: send a receipt email + WhatsApp with the next milestone dates. Client should know exactly what happens next.' },
      { n: 6, action: 'Update CRM and create Trello project', detail: 'Move lead to Won. Log deposit amount and date. Create project in Project Tracker. Add execution tasks in Trello under "In Execution" list.' },
    ],
    tools: ['Signed EPC contract (2 originals)', 'Company stamp', 'Bank account details', 'Project Tracker (this app)', 'CRM — stage update to Won'],
    successCriteria: ['Both originals signed and stamped', 'Deposit transfer confirmed', 'Project created in tracker', 'Execution timeline sent to client'],
    mistakes: ['Starting procurement before deposit clears — cash trap', 'Signing without FX escalation clause', 'Not getting client signature on every page', 'Not updating CRM immediately'],
  },
  {
    id: 'PB-5',
    title: 'Equipment Procurement',
    role: 'Founder + Procurement',
    phase: 'Execution',
    duration: '2–3 days sourcing, 7–21 days delivery',
    trigger: '30% deposit cleared in bank account',
    objective: 'Procure IEC-certified equipment at target BOM cost, delivered to site on schedule',
    prereqs: ['Deposit confirmed cleared', 'BOM finalized from feasibility study', 'FX rate checked (XE.com)', 'At least 2 supplier quotes'],
    steps: [
      { n: 1, action: 'Request updated quotes from 3 suppliers', detail: 'Always get 3 quotes minimum. Specify: panel brand, model, wattage, IEC 61215 + IEC 61730 certificates required. Inverter: brand, kVA, SPS or 3-phase, MPPT count.' },
      { n: 2, action: 'Verify IEC certificates before ordering', detail: 'Request the IEC certificate PDF from supplier. Check: certificate number, panel model match, issuing lab (TÜV, Bureau Veritas, etc.). Non-certified panels = NREA violation.' },
      { n: 3, action: 'Check FX rate and lock price', detail: 'Get today\'s USD/EGP rate on XE.com. If rate has moved >3% since proposal, activate the FX escalation clause and notify client before ordering.' },
      { n: 4, action: 'Place order with purchase order document', detail: 'Formal PO with: supplier name, panel model+qty, inverter model+qty, delivery date, delivery address, payment terms, penalty clause for late delivery.' },
      { n: 5, action: 'Log all costs in Project Tracker', detail: 'Enter panel cost, inverter cost, mounting hardware, cables/BOS. Mark as committed (unpaid) until payment made.' },
      { n: 6, action: 'Confirm delivery logistics', detail: 'Agree delivery time with site facilities manager. Equipment needs a dry, secure storage area. Confirm crane or forklift availability if panels are heavy.' },
    ],
    tools: ['BOM from feasibility study', 'Supplier quote emails', 'IEC certificate PDFs', 'XE.com rate', 'Purchase order template', 'Project Tracker cost log'],
    successCriteria: ['3 quotes obtained and compared', 'IEC certificates verified', 'Purchase orders placed', 'Delivery date confirmed with site', 'Costs logged in tracker'],
    mistakes: ['Ordering without verifying IEC certificates', 'Not checking FX rate vs proposal price', 'Single supplier dependency', 'No written PO (verbal orders cause disputes)'],
  },
  {
    id: 'PB-6',
    title: 'NREA Bronze Application',
    role: 'Founder',
    phase: 'Compliance',
    duration: '1 week preparation, processing time 4–8 weeks at NREA',
    trigger: 'Company registered + Commercial Registry issued',
    objective: 'Submit complete NREA Bronze qualification dossier and receive application reference number',
    prereqs: ['Commercial Registry issued', 'Company Syndicate registration done', 'Founder Syndicate membership current', 'EGP 10,000 available (fee + review)'],
    steps: [
      { n: 1, action: 'Prepare the document dossier', detail: 'Required: Commercial Registry (original + copy), Tax Registration certificate, Engineers\' Syndicate company registration, Founder Syndicate membership card, capital proof (bank statement showing paid-in capital), company stamp.' },
      { n: 2, action: 'Prepare founder CV in required format', detail: 'Include: academic qualifications (BSc Engineering), Syndicate ID number, years in PV field, installed kWp portfolio (include any personal projects), any training certificates. NREA checks this for intermediate-tier scoring.' },
      { n: 3, action: 'Complete the NREA scoring self-assessment', detail: 'Capital (25%): EGP 2M scores maximum. Portfolio (20%): 0 kWp at start — flag honest figure. Single station (10%): 0 kWp at start. Staff ratio (15%): founder alone at launch is fine. Submit honest — NREA verifies.' },
      { n: 4, action: 'Pay application fee at NREA finance office', detail: 'Bronze: EGP 5,000 application + EGP 5,000 review + 14% VAT. Pay in person at NREA headquarters (Nasr City, Cairo). Get a numbered receipt — this is your reference number.' },
      { n: 5, action: 'Submit dossier to Technical Affairs', detail: 'Hand deliver to NREA Head of Technical Affairs. Get a timestamped submission confirmation. Take photos of all documents submitted.' },
      { n: 6, action: 'Set a 6-week follow-up reminder', detail: 'NREA processing is typically 4–8 weeks. Follow up by phone if no response in 6 weeks. Reference your submission date and receipt number.' },
      { n: 7, action: 'Update compliance status in app', detail: 'In Control Center → Update Status → tick "NREA Submitted". This removes the NREA compliance alert from the dashboard.' },
    ],
    tools: ['Original Commercial Registry', 'Founder CV (Arabic)', 'Syndicate membership card', 'NREA headquarters address (Nasr City)', 'Submission receipt'],
    successCriteria: ['All documents verified and photocopied', 'Fee paid and receipt obtained', 'Dossier hand-delivered with timestamp', 'Follow-up reminder set', 'App compliance status updated'],
    mistakes: ['Submitting incomplete dossier — add to the queue even partially, reference number is key', 'Not getting a timestamped confirmation', 'Not setting a follow-up reminder'],
  },
  {
    id: 'PB-7',
    title: 'DISCO Net-Metering Application',
    role: 'Founder',
    phase: 'Execution',
    duration: '2–4 weeks for approval, longer in some regions',
    trigger: 'Installation complete and commissioned',
    objective: 'Receive DISCO approval for grid connection and net-metering agreement',
    prereqs: ['NREA certificate obtained', 'Installation complete and tested', 'Single-line diagram (SLD) prepared', 'All IEC certificates on file'],
    steps: [
      { n: 1, action: 'Prepare the DISCO submission package', detail: 'Required: NREA certificate, EgyptERA license, client property title or lease, single-line diagram (SLD), inverter technical spec sheet, panel spec sheet + IEC certs, protection relay settings, contractor company stamp and signature.' },
      { n: 2, action: 'Request a pre-submission meeting with DISCO', detail: 'Many DISCOs require a pre-inspection appointment. Call the technical office directly — not the customer service line. Ask: "What is your current processing time for net-metering applications?"' },
      { n: 3, action: 'Submit the full package at DISCO technical office', detail: 'Get a numbered reference and submission timestamp. Note the name of the receiving engineer — you will follow up with them directly.' },
      { n: 4, action: 'Track progress weekly', detail: 'DISCO may request additional documentation mid-process. Have a scanned copy of all submitted documents ready to re-supply instantly. Delays are common — weekly follow-up is essential.' },
      { n: 5, action: 'Attend DISCO inspection', detail: 'DISCO will send a technical team to inspect the installation. Be on-site. They check: protection relay settings, labelling, SLD match, safe disconnect. Have your NREA certificate on display.' },
      { n: 6, action: 'Collect grid connection approval', detail: 'Approval comes as a written letter. Keep the original. Update the client and project record. This triggers the final commissioning milestone payment.' },
      { n: 7, action: 'Collect final payment', detail: 'DISCO approval = commissioning milestone met. Invoice the client for the final 10% and any remaining balance. Update Project Tracker milestone to Invoiced.' },
    ],
    tools: ['NREA certificate original', 'Single-line diagram (SLD)', 'IEC certificates', 'DISCO technical office contact', 'Project Tracker'],
    successCriteria: ['Full package submitted with reference number', 'DISCO inspection passed', 'Grid connection approval received', 'Final payment invoiced'],
    mistakes: ['Submitting incomplete package — DISCO will reject and restart the clock', 'Not attending DISCO inspection in person', 'Not collecting a timestamped reference on submission'],
  },
  {
    id: 'PB-8',
    title: 'Client Handover & Training',
    role: 'Founder (Engineer)',
    phase: 'Execution',
    duration: '2–3 hours on-site',
    trigger: 'DISCO connection confirmed, system commissioned',
    objective: 'Complete contractual handover obligations, ensure client can operate and monitor the system',
    prereqs: ['DISCO approval obtained', 'System fully operational and tested', 'Handover certificate prepared', 'Warranty documents ready'],
    steps: [
      { n: 1, action: 'Run final performance test', detail: 'Morning inspection: confirm all strings producing expected current. Check inverter display for faults. Measure actual yield vs simulation for the day. Log readings.' },
      { n: 2, action: 'Walk client through the system', detail: 'Physically walk the decision-maker (and facilities manager) through the installation. Explain each component: panels, inverter, combiner box, safety disconnect, monitoring device.' },
      { n: 3, action: 'Demonstrate monitoring system', detail: 'Log in to monitoring app (e.g. SolarEdge, Huawei FusionSolar) with client. Show how to read: daily yield, performance ratio, fault alerts. Set up client email alerts for inverter faults.' },
      { n: 4, action: 'Hand over safety information', detail: 'Required by NREA Article 5: safety labels must be on all equipment. Give client the emergency shutdown procedure in writing. Show location of AC/DC disconnects.' },
      { n: 5, action: 'Sign handover certificate', detail: 'A one-page document signed by client: confirming installation complete, system demonstrated, documentation received, warranty terms accepted. Keep original.' },
      { n: 6, action: 'Hand over warranty documentation', detail: 'Panel warranty (typically 10-year product, 25-year performance from manufacturer). Inverter warranty (5–10 years). Your workmanship warranty (per contract, typically 1–2 years). Contact details for warranty claims.' },
      { n: 7, action: 'Offer post-warranty O&M contract', detail: 'Required by NREA to offer. Typical: annual inspection + cleaning + monitoring for EGP 3,000–8,000/year. Not mandatory that client accepts, but offer in writing.' },
      { n: 8, action: 'Request referral while on-site', detail: '"We\'d love to work with more businesses like yours. If you know of anyone facing the same electricity challenges, an introduction from you goes a long way." Best time to ask is when client is happy.' },
    ],
    tools: ['Monitoring app login credentials', 'Handover certificate form', 'Warranty documents', 'O&M contract offer (written)', 'Safety labels (on equipment)'],
    successCriteria: ['System performing at expected yield', 'Client trained on monitoring app', 'Handover certificate signed', 'Warranty documents handed over', 'O&M offer made in writing', 'Referral requested'],
    mistakes: ['Not getting a signed handover certificate', 'Forgetting to set up client monitoring access', 'Not requesting the referral while on-site — highest probability window'],
  },
];

const PHASES = ['Sales', 'Technical', 'Technical → Sales', 'Commercial', 'Execution', 'Compliance'];
const PHASE_COLORS = { Sales: '#1A6B72', Technical: '#0D2137', 'Technical → Sales': '#6b3fa0', Commercial: '#C8991A', Execution: '#1E7E34', Compliance: '#856404' };

// ── PlaybookCard ───────────────────────────────────────────────────────────────

function PlaybookCard({ pb, expanded, onToggle }) {
  const phaseColor = PHASE_COLORS[pb.phase] || N;

  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', borderLeft: `4px solid ${phaseColor}`, marginBottom: 10, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: N }}>{pb.title}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: phaseColor, background: `${phaseColor}18`, borderRadius: 8, padding: '2px 8px' }}>{pb.phase}</span>
            <span style={{ fontSize: 9, color: '#888' }}>{pb.role}</span>
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>{pb.objective}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>{pb.duration}</span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '0 16px 18px', borderTop: '1px solid #f0f0f0' }}>

          {/* Trigger + prereqs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, margin: '14px 0' }}>
            <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Trigger</div>
              <div style={{ fontSize: 11, color: N }}>{pb.trigger}</div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Pre-Requisites</div>
              {pb.prereqs.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: '#555', padding: '2px 0' }}>✓ {p}</div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Steps</div>
            {pb.steps.map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: phaseColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 3 }}>{s.action}</div>
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.55 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tools + Success + Mistakes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            <div style={{ background: '#f0faf4', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1a7a3f', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Tools & Resources</div>
              {pb.tools.map((t, i) => (
                <div key={i} style={{ fontSize: 11, color: '#555', padding: '2px 0' }}>→ {t}</div>
              ))}
            </div>
            <div style={{ background: '#f0faf4', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1a7a3f', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Success Criteria</div>
              {pb.successCriteria.map((c, i) => (
                <div key={i} style={{ fontSize: 11, color: '#555', padding: '2px 0' }}>✓ {c}</div>
              ))}
            </div>
            <div style={{ background: '#fff5f5', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Common Mistakes</div>
              {pb.mistakes.map((m, i) => (
                <div key={i} style={{ fontSize: 11, color: '#555', padding: '2px 0' }}>✗ {m}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function PlaybooksView() {
  const [view, setView]         = useState('sops');  // 'sops' | 'intel'
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter]     = useState('All');

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const shown = filter === 'All' ? PLAYBOOKS : PLAYBOOKS.filter(p => p.phase === filter);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setView('sops')}
          style={{ padding: '6px 16px', background: view === 'sops' ? N : '#f0f2f5', color: view === 'sops' ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Field SOPs
        </button>
        <button
          onClick={() => setView('intel')}
          style={{ padding: '6px 16px', background: view === 'intel' ? T : '#f0f2f5', color: view === 'intel' ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sales Intelligence
        </button>
      </div>

      {/* ── Sales Intelligence ── */}
      {view === 'intel' && <SalesIntelView />}

      {/* ── Field SOPs ── */}
      {view === 'sops' && (
        <>
          <div style={{ background: '#fff', borderRadius: 6, padding: '12px 16px', border: '1px solid #e0e0e0', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 4 }}>Field Playbooks</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
              Step-by-step guides for every stage of the solar EPC process. Designed to be used on-site, in meetings, and by future employees who need to execute without supervision.
            </div>
          </div>

          {/* Phase filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {['All', ...PHASES].map(p => (
              <button key={p} onClick={() => setFilter(p)}
                style={{ padding: '4px 12px', background: filter === p ? (PHASE_COLORS[p] || N) : '#f0f2f5', color: filter === p ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
          </div>

          {/* Expand all / collapse all */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setExpanded(Object.fromEntries(shown.map(p => [p.id, true])))}
              style={{ padding: '4px 12px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Expand All
            </button>
            <button onClick={() => setExpanded({})}
              style={{ padding: '4px 12px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Collapse All
            </button>
            <span style={{ fontSize: 10, color: '#bbb', alignSelf: 'center' }}>{shown.length} playbooks</span>
          </div>

          {shown.map(pb => (
            <PlaybookCard key={pb.id} pb={pb} expanded={!!expanded[pb.id]} onToggle={() => toggle(pb.id)} />
          ))}
        </>
      )}
    </div>
  );
}
