// ── Document tracker: types, phases, status, scaffold ─────────────────────────
// Shared by ProjectTracker and CRMView. Lives here to avoid circular imports.

export const DOC_TYPES = [
  // Pre-contract
  { id:'feasibility_report',    label:'Feasibility Study Report',     phase:'pre_contract',  icon:'📊', critical:false },
  { id:'pvsyst_report',         label:'PVsyst Simulation Report',     phase:'pre_contract',  icon:'☀',  critical:false },
  { id:'single_line_diagram',   label:'Single Line Diagram',          phase:'pre_contract',  icon:'⚡', critical:false },
  { id:'epc_contract',          label:'EPC Contract (signed)',        phase:'pre_contract',  icon:'📝', critical:true  },
  { id:'deposit_invoice',       label:'Deposit Invoice',              phase:'pre_contract',  icon:'💰', critical:true  },
  // Regulatory
  { id:'nrea_certificate',      label:'NREA Certificate',             phase:'regulatory',    icon:'🏛', critical:true  },
  { id:'disco_application',     label:'DISCO Application',            phase:'regulatory',    icon:'🔌', critical:true  },
  { id:'net_metering_approval', label:'Net Metering Approval',        phase:'regulatory',    icon:'✅', critical:true  },
  // Procurement
  { id:'panel_po',              label:'Panel Purchase Order',         phase:'procurement',   icon:'📋', critical:false },
  { id:'inverter_po',           label:'Inverter Purchase Order',      phase:'procurement',   icon:'📋', critical:false },
  { id:'bos_po',                label:'BOS / Mounting PO',            phase:'procurement',   icon:'📋', critical:false },
  { id:'panel_iec',             label:'Panel IEC Certificate',        phase:'procurement',   icon:'🏅', critical:true  },
  { id:'inverter_iec',          label:'Inverter IEC Certificate',     phase:'procurement',   icon:'🏅', critical:true  },
  { id:'material_spec',         label:'Material Specification Sheet', phase:'procurement',   icon:'📄', critical:false },
  // Execution
  { id:'installation_photos',   label:'Installation Photo Log',       phase:'execution',     icon:'📸', critical:false },
  // Commissioning
  { id:'commissioning_report',  label:'Commissioning Test Report',    phase:'commissioning', icon:'🔧', critical:true  },
  { id:'handover_certificate',  label:'Client Handover Certificate',  phase:'commissioning', icon:'🤝', critical:true  },
  { id:'warranty_doc',          label:'Warranty Certificate',         phase:'commissioning', icon:'🛡', critical:false },
  { id:'as_built_drawing',      label:'As-Built Drawing',             phase:'commissioning', icon:'📐', critical:false },
  // Other
  { id:'other',                 label:'Other Document',               phase:'other',         icon:'📎', critical:false },
];

export const DOC_PHASES = [
  { id:'pre_contract',  label:'Pre-Contract',  color:'#0D2137' },
  { id:'regulatory',    label:'Regulatory',    color:'#856404' },
  { id:'procurement',   label:'Procurement',   color:'#1A6B72' },
  { id:'execution',     label:'Execution',     color:'#5C2D91' },
  { id:'commissioning', label:'Commissioning', color:'#1a7a3f' },
  { id:'other',         label:'Other',         color:'#888'    },
];

export const DOC_STATUS = {
  pending:   { label:'Pending',   color:'#888',    bg:'#f5f5f5', next:'collected' },
  collected: { label:'Collected', color:'#1A6B72', bg:'#e8f8f9', next:'submitted' },
  submitted: { label:'Submitted', color:'#b8860b', bg:'#fffbee', next:'signed'    },
  signed:    { label:'Signed',    color:'#1a7a3f', bg:'#f0faf4', next:'received'  },
  received:  { label:'Received',  color:'#1a7a3f', bg:'#f0faf4', next:'pending'   },
};

// Build a starter document registry from a won lead's stageData.
// uidFn is passed in so this module has no dependency on either view's uid impl.
export const scaffoldDocuments = (lead, uidFn) => {
  const sd  = lead.stageData || {};
  const sv  = sd.site_visit_completed    || {};
  const fd  = sd.feasibility_delivered   || {};
  const won = sd.won                     || {};

  const docs = [];
  const add  = (typeId, overrides = {}) => {
    const def = DOC_TYPES.find(d => d.id === typeId);
    if (!def) return;
    docs.push({
      id:       uidFn(),
      type:     typeId,
      name:     overrides.name  || def.label,
      date:     '',
      status:   'pending',
      url:      '',
      notes:    overrides.notes || '',
      critical: def.critical,
    });
  };

  // Pre-contract — always scaffold these
  if (fd.finalSizeKwp || fd.simplePaybackYears) add('feasibility_report');
  if (fd.finalSizeKwp)                           add('pvsyst_report');
  if (fd.finalSizeKwp || fd.panelBrandModel)     add('single_line_diagram');
  add('epc_contract', won.contractRef ? { name:`EPC Contract — ${won.contractRef}` } : {});
  add('deposit_invoice');

  // Regulatory
  add('nrea_certificate', { notes:'Required for DISCO application. Keep a certified copy on file.' });
  if (sv.disco || sv.netMeteringEligible !== false) {
    add('disco_application', sv.disco ? { notes:`DISCO: ${sv.disco}` } : {});
    add('net_metering_approval');
  }

  // Procurement — pre-fill supplier/equipment name from feasibility dossier
  add('panel_po',    fd.panelBrandModel    ? { name:`Panel PO — ${fd.panelBrandModel}`       } : {});
  add('inverter_po', fd.inverterBrandModel ? { name:`Inverter PO — ${fd.inverterBrandModel}` } : {});
  add('bos_po');
  add('panel_iec',    { notes: fd.panelBrandModel    || '' });
  add('inverter_iec', { notes: fd.inverterBrandModel || '' });
  add('material_spec');

  // Execution + commissioning
  add('installation_photos');
  add('commissioning_report');
  add('handover_certificate');
  add('warranty_doc');
  add('as_built_drawing');

  return docs;
};
