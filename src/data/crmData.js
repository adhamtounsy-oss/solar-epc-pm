export const PIPELINE_STAGES = [
  { id: 'unqualified',           label: 'Unqualified Lead',           prob: 5   },
  { id: 'contacted',             label: 'Contacted',                   prob: 15  },
  { id: 'qualified',             label: 'Qualified',                   prob: 30  },
  { id: 'site_visit_scheduled',  label: 'Site Visit Scheduled',        prob: 45  },
  { id: 'site_visit_completed',  label: 'Site Visit Completed',        prob: 55  },
  { id: 'feasibility_proposed',  label: 'Paid Feasibility Proposed',   prob: 60  },
  { id: 'feasibility_sold',      label: 'Feasibility Study Sold',      prob: 70  },
  { id: 'feasibility_delivered', label: 'Feasibility Delivered',       prob: 75  },
  { id: 'proposal_sent',         label: 'EPC Proposal Sent',           prob: 50  },
  { id: 'negotiation',           label: 'Negotiation',                 prob: 70  },
  { id: 'won',                   label: 'Won',                         prob: 100 },
  { id: 'lost',                  label: 'Lost',                        prob: 0   },
  { id: 'nurture',               label: 'Nurture Later',               prob: 10  },
];

export const SEGMENTS     = ['School', 'Farm', 'Factory', 'Mall / Commercial', 'Government Tender', 'Other'];
export const SOURCE_TYPES = ['Referral', 'Cold Outreach', 'Website', 'Tender Portal', 'LinkedIn', 'Existing Network', 'Other'];
export const PAIN_POINTS  = ['High Bills', 'Power Cuts', 'Diesel Replacement', 'ESG / Sustainability', 'Expansion'];
export const TEMPERATURES = ['Cold', 'Warm', 'Hot'];
export const CRM_TAGS     = ['School','Farm','Factory','Mall','Government Tender','Hot Lead','Warm Lead','Cold Lead','Compliance','High Bill','Power Cuts','Diesel Replacement','Strategic Reference','Financing Needed','Feasibility Candidate'];
export const GOVERNORATES = ['Cairo','Giza','Alexandria','Sharqia','Dakahlia','Gharbia','Beheira','Kafr El Sheikh','Monufia','Qaliubiya','Ismailia','Port Said','Suez','Damietta','Luxor','Aswan','Minya','Beni Suef','Fayoum','Asyut','Sohag','Qena','South Sinai','North Sinai','Red Sea','New Valley','Matrouh','Other'];

export const computeLeadScore = (lead) => {
  let s = 0;
  const bill = parseFloat(lead.monthlyBill) || 0;
  if      (bill > 80000) s += 20;
  else if (bill > 30000) s += 15;
  else if (bill > 10000) s += 10;
  else if (bill > 5000)  s += 5;
  else s += 2;

  const kw = parseFloat(lead.systemSizeKW) || 0;
  if      (kw > 200) s += 15;
  else if (kw > 50)  s += 12;
  else if (kw > 10)  s += 8;
  else if (kw > 0)   s += 3;

  s += ({ 'Diesel Replacement':10,'Power Cuts':8,'High Bills':6,'Expansion':5,'ESG / Sustainability':3 }[lead.painPoint] || 0);
  s += ({ Hot:15, Warm:8, Cold:2 }[lead.temperature] || 2);
  s += ({ 'Factory':10,'Mall / Commercial':9,'Government Tender':8,'Farm':7,'School':6,'Other':4 }[lead.segment] || 4);
  s += ({ 'Referral':10,'Existing Network':9,'Tender Portal':7,'LinkedIn':6,'Cold Outreach':5,'Website':5,'Other':3 }[lead.sourceType] || 3);

  const t = parseInt(lead.touches) || 0;
  if      (t > 5)  s += 10;
  else if (t >= 3) s += 7;
  else if (t >= 1) s += 4;

  if (lead.phone || lead.whatsapp) s += 3;
  if (lead.email) s += 2;
  if (lead.notes && lead.notes.length > 30) s += 5;
  return Math.min(100, s);
};

export const getScoreCategory = (score) => {
  if (score >= 80) return { label:'Priority Lead', color:'#1E7E34', bg:'#e8f5e9' };
  if (score >= 60) return { label:'Good Lead',     color:'#1A6B72', bg:'#e8f8f9' };
  if (score >= 40) return { label:'Nurture',        color:'#856404', bg:'#fff3cd' };
  return               { label:'Low Priority',  color:'#888',    bg:'#f5f5f5' };
};

const d = (offset = 0) => {
  const dt = new Date(); dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
};

export const INIT_LEADS = [
  { id:'L-001', orgName:'[SAMPLE] Al-Nour Private School', segment:'School', governorate:'Giza', contactPerson:'[Placeholder]', contactRole:'School Director', phone:'', whatsapp:'', email:'', website:'', sourceType:'Referral', monthlyBill:'18000', systemSizeKW:'40', painPoint:'High Bills', temperature:'Warm', stage:'qualified', nextAction:'Schedule site visit and prepare feasibility deck', lastContacted:d(-5), nextFollowUp:d(2), touches:'3', probability:'30', dealValue:'720000', notes:'[SAMPLE DATA] Mid-size private school. 40kW estimate. Director motivated by bill reduction. Roof space confirmed on main building.', tags:['School','High Bill','Feasibility Candidate'] },
  { id:'L-002', orgName:'[SAMPLE] Heliopolis Language School', segment:'School', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'Board Member', phone:'', whatsapp:'', email:'', website:'', sourceType:'Cold Outreach', monthlyBill:'32000', systemSizeKW:'70', painPoint:'High Bills', temperature:'Cold', stage:'contacted', nextAction:'Send intro deck — follow up by phone in 3 days', lastContacted:d(-12), nextFollowUp:d(-2), touches:'1', probability:'15', dealValue:'1260000', notes:'[SAMPLE DATA] Large private school. High consumption. LinkedIn cold outreach. No response yet. Follow-up overdue.', tags:['School','High Bill','Cold Lead'] },
  { id:'L-003', orgName:'[SAMPLE] Nile Delta Agriculture Co.', segment:'Farm', governorate:'Dakahlia', contactPerson:'[Placeholder]', contactRole:'Farm Owner', phone:'', whatsapp:'', email:'', website:'', sourceType:'Existing Network', monthlyBill:'55000', systemSizeKW:'120', painPoint:'Diesel Replacement', temperature:'Hot', stage:'site_visit_scheduled', nextAction:'Conduct site visit — assess diesel setup and land', lastContacted:d(-2), nextFollowUp:d(3), touches:'5', probability:'55', dealValue:'2160000', notes:'[SAMPLE DATA] Large agricultural operation. Running 3 diesel generators. Owner highly motivated. Owns the land. Site visit scheduled.', tags:['Farm','Diesel Replacement','Hot Lead','Feasibility Candidate'] },
  { id:'L-004', orgName:'[SAMPLE] Upper Egypt Poultry Farm', segment:'Farm', governorate:'Minya', contactPerson:'[Placeholder]', contactRole:'Operations Manager', phone:'', whatsapp:'', email:'', website:'', sourceType:'Referral', monthlyBill:'28000', systemSizeKW:'60', painPoint:'Power Cuts', temperature:'Warm', stage:'qualified', nextAction:'Prepare and present paid feasibility study proposal', lastContacted:d(-3), nextFollowUp:d(5), touches:'4', probability:'45', dealValue:'1080000', notes:'[SAMPLE DATA] Poultry farm with critical power reliability needs. Frequent outages damage production. Owns buildings. Referred by equipment supplier.', tags:['Farm','Power Cuts','Warm Lead','Feasibility Candidate'] },
  { id:'L-005', orgName:'[SAMPLE] Delta Plastics Manufacturing', segment:'Factory', governorate:'Sharqia', contactPerson:'[Placeholder]', contactRole:'CEO', phone:'', whatsapp:'', email:'', website:'', sourceType:'LinkedIn', monthlyBill:'95000', systemSizeKW:'250', painPoint:'High Bills', temperature:'Hot', stage:'feasibility_proposed', nextAction:'Close feasibility sale — collect EGP 3,000 deposit now', lastContacted:d(-1), nextFollowUp:d(1), touches:'7', probability:'65', dealValue:'4500000', notes:'[SAMPLE DATA] Large plastics manufacturer. Very high electricity consumption. CEO engaged via LinkedIn. Large rooftop available. Feasibility proposal submitted — awaiting approval.', tags:['Factory','High Bill','Hot Lead','Feasibility Candidate','Strategic Reference'] },
  { id:'L-006', orgName:'[SAMPLE] Cairo Food Processing Plant', segment:'Factory', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'Technical Director', phone:'', whatsapp:'', email:'', website:'', sourceType:'Referral', monthlyBill:'72000', systemSizeKW:'180', painPoint:'Diesel Replacement', temperature:'Warm', stage:'site_visit_completed', nextAction:'Submit paid feasibility study proposal to technical director', lastContacted:d(-4), nextFollowUp:d(2), touches:'6', probability:'55', dealValue:'3240000', notes:'[SAMPLE DATA] Food processing plant. Site visit complete. Large flat roof suitable for installation. Technical director is influencer — CFO must approve deposit.', tags:['Factory','Diesel Replacement','Warm Lead','Financing Needed','Feasibility Candidate'] },
  { id:'L-007', orgName:'[SAMPLE] New Cairo Community Mall', segment:'Mall / Commercial', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'Property Manager', phone:'', whatsapp:'', email:'', website:'', sourceType:'Cold Outreach', monthlyBill:'120000', systemSizeKW:'350', painPoint:'ESG / Sustainability', temperature:'Warm', stage:'contacted', nextAction:'Book intro meeting with property manager — escalate to asset owner', lastContacted:d(-8), nextFollowUp:d(1), touches:'2', probability:'20', dealValue:'6300000', notes:'[SAMPLE DATA] Mid-size community mall. ESG motivated. Property management company manages asset. Need to reach ownership decision maker. High deal value.', tags:['Mall','High Bill','Warm Lead','Strategic Reference'] },
  { id:'L-008', orgName:'[SAMPLE] Ministry of Education Solar Program', segment:'Government Tender', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'Tender Committee', phone:'', whatsapp:'', email:'', website:'', sourceType:'Tender Portal', monthlyBill:'', systemSizeKW:'500', painPoint:'ESG / Sustainability', temperature:'Cold', stage:'unqualified', nextAction:'Review tender documents — run compliance and go/no-go assessment', lastContacted:d(-15), nextFollowUp:d(0), touches:'0', probability:'10', dealValue:'9000000', notes:'[SAMPLE DATA] Multi-school solar tender. Requires NREA classification. Assess compliance requirements before pursuing.', tags:['Government Tender','Compliance','Cold Lead'] },
  { id:'L-009', orgName:'[SAMPLE] NREA Rooftop PV Aggregation Tender', segment:'Government Tender', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'NREA Procurement', phone:'', whatsapp:'', email:'', website:'', sourceType:'Tender Portal', monthlyBill:'', systemSizeKW:'1000', painPoint:'ESG / Sustainability', temperature:'Cold', stage:'unqualified', nextAction:'Obtain tender docs — compliance check for NREA Silver+ requirement', lastContacted:d(-10), nextFollowUp:d(-3), touches:'0', probability:'8', dealValue:'18000000', notes:'[SAMPLE DATA] Large NREA aggregation tender. Requires NREA Silver+ classification. Assess joint-venture or subcontracting feasibility with larger EPC partner.', tags:['Government Tender','Compliance','Cold Lead','Financing Needed'] },
  { id:'L-010', orgName:'[SAMPLE] Maadi Medical Center', segment:'Other', governorate:'Cairo', contactPerson:'[Placeholder]', contactRole:'Hospital Administrator', phone:'', whatsapp:'', email:'', website:'', sourceType:'Referral', monthlyBill:'45000', systemSizeKW:'100', painPoint:'Power Cuts', temperature:'Hot', stage:'qualified', nextAction:'Schedule site visit — bring engineer for roof and load assessment', lastContacted:d(-1), nextFollowUp:d(2), touches:'4', probability:'50', dealValue:'1800000', notes:'[SAMPLE DATA] Private medical center. Cannot tolerate power outages. Highly motivated. Referral from supplier. Roof ownership confirmed.', tags:['Hot Lead','Power Cuts','Strategic Reference','Feasibility Candidate'] },
];

export const INIT_TENDERS = [
  { id:'T-001', name:'[SAMPLE] Ministry of Education Rooftop Solar Phase 1', authority:'Ministry of Education / NREA', sector:'Education', location:'Multiple Governorates', sourceUrl:'', publicationDate:d(-20), deadline:d(25), bidBond:'EGP 500,000 bid bond required', technicalReqs:'NREA Bronze or higher; IEC-certified components; licensed engineer on file; minimum 2 completed projects', siteVisitRequired:true, submissionStatus:'Reviewing', recommendation:'No-Go', complianceNotes:'NREA classification not yet achieved. Must complete ashtratat compliance tasks first. Re-assess in 60 days.', requiredDocs:'Commercial registry, NREA certificate, bid bond bank letter, technical specs, company profile, engineer CVs', nextAction:'Complete NREA Bronze classification first — then re-assess tender' },
];

export const INIT_RESEARCH = [
  { id:'R-001', targetSegment:'Factory', searchQuery:'Private factories 10th of Ramadan industrial zone Cairo-Suez corridor', sourceWebsite:'Yellow Pages Egypt / LinkedIn', orgFound:'', contactFound:'', verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false, notes:'[SAMPLE] Research queue for factory segment — focus on large industrial zones' },
  { id:'R-002', targetSegment:'School', searchQuery:'Private schools Cairo Giza large campus high electricity consumption', sourceWebsite:'LinkedIn / Google Maps', orgFound:'', contactFound:'', verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false, notes:'[SAMPLE] Target private schools with 500+ student capacity and large roofs' },
];

export const CSV_TEMPLATE_HEADERS = ['Lead ID','Organization Name','Segment','Governorate','Contact Person','Role','Phone','WhatsApp','Email','Website','Source Type','Monthly Bill EGP','System Size kW','Pain Point','Temperature','Pipeline Stage','Next Action','Last Contacted','Next Follow-Up','Touches','Probability %','Deal Value EGP','Notes'];
