const SECTIONS = [
  { title: '1. Project Charter', rows: [
    ['Project Name',       'Solar EPC Egypt — Market Entry & First Commissioning'],
    ['Project Sponsor',    'Founder / Owner'],
    ['Project Manager',    'Founder (Phase 1 — Days 0–90); Senior Engineer leads Phase 2 execution (Days 90–175)'],
    ['Selected Strategy',  'Strategy A — Full EPC, own license and team. Starting capital: EGP 2,000,000. Recommended sequence for lower capital: C → B → A (bootstrap, prove market access, then scale).'],
    ['Objective',          'Launch a profitable solar EPC business in Egypt. First feasibility revenue by Day 50. First signed EPC contract by Day 120. First commissioned project by Day 175. Positive EBITDA by Month 24.'],
    ['Budget',             'EGP 400K OpEx buffer (first 6 months) + EGP 1,600K working capital reserve. Do not deploy WC reserve until first deposit is collected (Day 90–130).'],
    ['Timeline',           'Phase 1 (D0–D90): Foundation — legal, team, pipeline, feasibility revenue. Phase 2 (D90–D175): Execution — contract, procurement, installation. Phase 3 (D175–D240): Close and repeat.'],
    ['Success Criteria',   'First commissioning ≤ Day 175. Positive EBITDA by Month 24. ≥2 EPC contracts signed Y1. NREA certificate obtained. EgyptERA license filed.'],
    ['Failure Condition',  'No signed EPC contract by Day 180 → invoke Month 6 gate: freeze all discretionary spend, strategy pivot review within 5 days.'],
  ]},
  { title: '2. Scope Management', rows: [
    ['In Scope',           'Solar PV feasibility studies, EPC contracts, equipment procurement, installation, commissioning, O&M services for C&I clients in Egypt (≥40kW systems).'],
    ['Out of Scope',       'Residential <10kW, utility-scale >10MW, wind energy, overseas projects.'],
    ['WBS Deliverables',   'WBS-1: Legal incorporation + licenses. WBS-2: 50-prospect pipeline. WBS-3: 3 proposals + 2 contracts. WBS-4: Engineer + design tools + supplier list. WBS-5: Accounting + WC model + overdraft. WBS-6: First commissioned project. WBS-7: Feasibility + O&M revenue streams. NREA: Compliance certificate + reporting.'],
  ]},
  { title: '3. Schedule', rows: [
    ['Phase 1: Days 1–30',   'Register company, hire lawyer, hire engineer, build prospect list, configure FX alert, sign Month 6 gate document.'],
    ['Phase 1: Days 30–60',  'Engineer operational, first site visits, supplier qualification, test procurement order, feasibility studies sold.'],
    ['Phase 1: Days 60–90',  'Feasibility reports delivered, EPC proposals submitted, contract negotiations begun, EgyptERA + NREA applications submitted.'],
    ['Phase 2: Days 90–130', 'First contract signed, deposit collected, equipment ordered.'],
    ['Phase 2: Days 130–175','Equipment delivered, civil works, electrical installation, commissioning, client acceptance.'],
    ['Phase 3: Days 175–240','Final invoice issued (60-day payment clock), O&M contract signed, second project initiated.'],
    ['Critical Milestones',  'Engineer hired: D30. First paid study: D35–70. First EPC contract: D75–120. First deposit cleared: D90–130. First commissioning: D175. Final payment: D235.'],
  ]},
  { title: '4. Cost Management', rows: [
    ['Y1 Revenue (realistic)', 'EGP 2,484,900 (gross from 2 projects at negotiated prices)'],
    ['Y1 EBITDA (realistic)',  '–EGP 771,400 (Strategy A). Cash floor Month 7: EGP 83K (breach risk — overdraft required).'],
    ['Y2 EBITDA',              'EGP 600K (5–6 projects)'],
    ['Y3 EBITDA',              'EGP 2,500K (10–12 projects)'],
    ['Gross Margin',           '11.5% after price negotiation (not 23% clean model). Negotiated actuals: EGP 23,250/kW (–10.6%) and EGP 22,316/kW (–14.2%) on Y1 pilot projects.'],
    ['Price Floor',            'EGP 23,000/kW. Do not accept below this. Quoted price: EGP 27,000/kW minimum.'],
    ['Deposit Policy',         '30–40% at signing. Never negotiate below 25%. Walk away if refused in Strategy A/B.'],
    ['Non-Negotiables',        '(1) FX escalation clause in every contract. (2) ≥30% deposit at signing. (3) Never hold inventory. (4) Month 6 gate. (5) Written commission agreement before any client introduction (Strategy C).'],
  ]},
  { title: '5. Quality Management (IEC Standards)', rows: [
    ['Panel Standards',    'IEC 61215 (module design) + IEC 61730 (module safety). Certificates required from all suppliers before first use. Non-certified = DISCO rejection.'],
    ['Inverter Standards', 'Safety certificate required per NREA Article 5. Preferred: Growatt, Sungrow, Huawei.'],
    ['Design Quality',     'Design standards document (T-3) used as mandatory checklist on every project. 4-phase installation sign-off by engineer. Commissioning yield test ≥90% of PVsyst model.'],
    ['Contract Quality',   '9 mandatory clauses per L-4: FX clause, deposit, payment schedule, O&M option, warranty pass-through, DISCO responsibility, scope of work, delay protocol, CRCICA dispute resolution.'],
  ]},
  { title: '6. Resource Plan', rows: [
    ['Founder',                   'Lead: all sales, legal, financial, client relations. Days 0–240.'],
    ['Senior Engineer (Grade B)', 'Lead: technical design (PVsyst), supplier qualification, site supervision, commissioning, DISCO application. Start: Day 30. EgyptERA Grade B + Engineers Syndicate member.'],
    ['Corporate Lawyer',          'Draft: EPC contract, O&M agreement, feasibility agreement. Start: Day 1. Budget: EGP 8K–15K for 3 docs. Do not DIY contracts.'],
    ['Installation Subcontractors (×2)', 'Prequalified by Day 60. DISCO-registered, insured. 30% mobilization / 70% on phase completion.'],
    ['O&M Technician',            'Hire when portfolio ≥200kW under O&M. Approx Month 16–18. EGP 8K–12K/month.'],
  ]},
  { title: '7. Risk Plan', rows: [
    ['Top 5 Risks',       '(1) Engineer not hired by D30. (2) No contract by D180. (3) Month 7 cash gap. (4) FX movement >10%. (5) NREA certificate not obtained.'],
    ['Risk Response',     'See Risk Register tab for full mitigation. Critical controls: Month 6 gate (F-6), FX alert (F-3), overdraft facility (F-4), NREA dossier (C-6), IEC certs at supplier qualification (C-2, C-3).'],
    ['Walk-Away Triggers','(1) Client refuses FX clause. (2) Client refuses ≥25% deposit. (3) No signed contract by Day 180. (4) Equipment delivery without prior deposit clearance.'],
  ]},
  { title: '8. Procurement Plan', rows: [
    ['Equipment Sources',  'Jinko / LONGi / Canadian Solar panels. Growatt / Sungrow / Huawei inverters. Import via Egypt agent. Lead time: 21–35 days from China. HS codes: chapter 85.'],
    ['Procurement Rule',   'Never place order before deposit is cleared. Never hold inventory. Test procurement order (T-6) before first major order to validate customs agent and HS codes.'],
    ['Supplier Terms',     '30% deposit on PO. 70% balance on delivery after inspection. Delivery date confirmed in writing. Do not accept partial delivery.'],
  ]},
  { title: '9. Stakeholder Plan', rows: [
    ['Clients',       'C&I accounts ≥40kW. Obour / Badr / 6th October industrial zones. Owner or plant manager as decision-maker — not procurement dept. Qualify: monthly electricity bill >EGP 15K.'],
    ['Regulators',    'NREA (qualification certificate), EgyptERA (contractor license), DISCO (net-metering connection). All three active before first commissioning.'],
    ['Suppliers',     '3 panel + 3 inverter suppliers qualified by Day 45. Prequalified customs agent for import. IEC certs on file for all.'],
    ['Referral Sources','5 MEP consultants / accountants / bank managers identified by Day 21 (M-4). Informal commission EGP 5K–10K per closed deal.'],
    ['Lenders',       'CI Capital Leasing, GB Leasing. Referral agreement target: ≥1% of financed amount. Sign by Day 120 (A-4).'],
  ]},
  { title: '10. Governance', rows: [
    ['PM Authority',        'Full authority over task sequencing and resource scheduling within approved budget.'],
    ['Founder Approval',    'Required for: any single spend >EGP 5,000; deviation from min price floor (EGP 23K/kW); any contract without FX escalation clause.'],
    ['Weekly Review',       'Update WC model, review cash position, update Kanban board, check critical path task status. Every Monday.'],
    ['Monthly Review',      'Pipeline conversion rate, supplier price check (FX impact), compliance status, NREA/EgyptERA application progress.'],
    ['Month 6 Gate (D180)', 'If no signed EPC contract: (1) freeze hires, (2) cancel non-essential subscriptions, (3) strategy review meeting within 5 days, (4) prepare pivot/exit scenario.'],
  ]},
];

const card = { background: '#fff', borderRadius: 6, padding: 20, marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.08)' };

export const CharterView = () => (
  <div>
    <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#856404' }}>
      PMBOK-compliant Project Management Plan for Solar EPC Egypt. All numbers from calibrated simulation (not clean model). Strategy A (EGP 2M capital). If capital is EGP 400K–1.7M, use Strategy C1 or B as starting strategy.
    </div>

    {SECTIONS.map(({ title, rows }) => (
      <div key={title} style={card}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1A6B72', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #e0e4ea', paddingBottom: 8, marginBottom: 12 }}>{title}</h3>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #f5f5f5', gap: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', minWidth: 180, flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: 12, color: '#1a1a1a', lineHeight: 1.5 }}>{v}</span>
          </div>
        ))}
      </div>
    ))}
  </div>
);
