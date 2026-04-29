// ─── PROJECT QUALITY GATES (IEC + NREA Article 5 compliant) ─────────────────
// Three-stage quality control: Pre-Install → Mid-Install → Commissioning

export const QUALITY_GATE_DEFS = {
  preInstall: {
    label: 'Pre-Installation Gates',
    subtitle: 'Must ALL pass before any civil or electrical work begins',
    failAction: 'STOP project. Do not mobilize subcontractor until all pre-install gates are cleared.',
    items: [
      { id: 'QG-01', label: 'IEC 61215 certificate on file for ALL panel models', category: 'IEC Compliance', blocking: true },
      { id: 'QG-02', label: 'IEC 61730 certificate on file for ALL panel models', category: 'IEC Compliance', blocking: true },
      { id: 'QG-03', label: 'Inverter safety certificate on file for selected model', category: 'IEC Compliance', blocking: true },
      { id: 'QG-04', label: 'DISCO net-metering application submitted (reference number obtained)', category: 'Regulatory', blocking: true },
      { id: 'QG-05', label: 'BOM signed off by engineer (model numbers, quantities, specs)', category: 'Design', blocking: true },
      { id: 'QG-06', label: 'Site inspection report completed (roof/land, shading, tilt, cable runs)', category: 'Site', blocking: true },
      { id: 'QG-07', label: 'Subcontractor framework agreement signed (scope + payment terms)', category: 'Procurement', blocking: true },
      { id: 'QG-08', label: 'Design standards checklist signed by engineer (T-3 doc applied)', category: 'Design', blocking: true },
      { id: 'QG-09', label: 'Client deposit ≥30% cleared in company bank account', category: 'Financial', blocking: true },
      { id: 'QG-10', label: 'EPC contract signed with all 9 mandatory clauses present', category: 'Legal', blocking: true },
      { id: 'QG-11', label: 'Safety signs and PPE prepared for site (NREA Article 5)', category: 'Safety', blocking: false },
    ],
  },
  midInstall: {
    label: 'Mid-Installation Gates',
    subtitle: 'Engineer sign-off required at each phase before proceeding',
    failAction: 'STOP that phase. Engineer must diagnose and resolve before next phase begins. No phase skipping.',
    items: [
      { id: 'QG-12', label: 'Phase 1 sign-off: Mounting structure complete, torque-checked, vertical/horizontal', category: 'Installation', blocking: true },
      { id: 'QG-13', label: 'Phase 2 sign-off: DC cabling complete, correct polarity, labelled', category: 'Installation', blocking: true },
      { id: 'QG-14', label: 'Phase 3 sign-off: Inverter installed, grounded, string connections verified', category: 'Installation', blocking: true },
      { id: 'QG-15', label: 'Phase 4 sign-off: AC panel connection, MCB/protection devices installed and tested', category: 'Installation', blocking: true },
      { id: 'QG-16', label: 'Daily photo log maintained with no gaps (date-stamped)', category: 'Documentation', blocking: false },
      { id: 'QG-17', label: 'Safety labels installed on all DC/AC equipment (NREA Article 5)', category: 'NREA', blocking: true },
      { id: 'QG-18', label: 'Civil works: no trenching near live cables without permit confirmed', category: 'Safety', blocking: true },
    ],
  },
  commissioning: {
    label: 'Commissioning Gates',
    subtitle: 'Must ALL pass before client acceptance is signed',
    failAction: 'STOP commissioning. Do not request client acceptance. Engineer to diagnose and rework. Yield <90% = do not commission.',
    items: [
      { id: 'QG-19', label: 'System yield ≥90% of PVsyst modelled output (irradiance-corrected)', category: 'Performance', blocking: true },
      { id: 'QG-20', label: 'All DC overcurrent protection devices tested and documented', category: 'Safety', blocking: true },
      { id: 'QG-21', label: 'All AC overcurrent and earth-fault protection tested and documented', category: 'Safety', blocking: true },
      { id: 'QG-22', label: 'Surge protection devices (SPD) installed and verified', category: 'Safety', blocking: true },
      { id: 'QG-23', label: 'DISCO inspection completed and connection approved (where required)', category: 'Regulatory', blocking: true },
      { id: 'QG-24', label: 'Client training on system operation completed and documented', category: 'NREA', blocking: true },
      { id: 'QG-25', label: 'Emergency procedure walkthrough completed with client', category: 'NREA', blocking: true },
      { id: 'QG-26', label: 'All equipment manuals and warranty documents handed to client', category: 'Handover', blocking: false },
      { id: 'QG-27', label: 'Commissioning report signed by engineer', category: 'Documentation', blocking: true },
      { id: 'QG-28', label: 'Client acceptance certificate signed (safety snags resolved)', category: 'Handover', blocking: true },
      { id: 'QG-29', label: 'O&M contract signed at commissioning meeting before leaving site', category: 'Revenue', blocking: false },
      { id: 'QG-30', label: 'Final invoice issued same day as acceptance certificate', category: 'Revenue', blocking: false },
    ],
  },
};

// Initial state — all unchecked
export const INIT_QUALITY_GATES = Object.fromEntries(
  Object.values(QUALITY_GATE_DEFS)
    .flatMap(stage => stage.items)
    .map(item => [item.id, false])
);
