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

// ── Real leads — verified from public sources (researched April 2026) ──────────
// All bill / kW figures are estimates based on sector benchmarks — verify on site.
// Contact details sourced from company websites and EGX filings only.
export const INIT_LEADS = [

  // ── FACTORIES (5) ──────────────────────────────────────────────────────────

  {
    id:'L-001',
    orgName:'LECICO Egypt S.A.E.',
    segment:'Factory',
    governorate:'Alexandria',
    contactPerson:'Not publicly available',
    contactRole:'VP Operations / Facilities Director',
    phone:'19883',
    whatsapp:'',
    email:'info@lecicoegypt.com',
    website:'https://lecicoegypt.com',
    sourceType:'LinkedIn',
    monthlyBill:'500000',
    systemSizeKW:'500',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Send cold outreach email to info@lecicoegypt.com — subject: electricity cost reduction for LECICO facilities (EGX-listed angle)',
    lastContacted:'',
    nextFollowUp:d(3),
    touches:'0',
    probability:'5',
    dealValue:'6000000',
    notes:'EGX-listed ceramics and sanitaryware manufacturer (ticker: LCSW). 6,000+ employees. Two factory complexes in Alexandria (Khorshid / Borg El Arab). Production: 6.2M sanitaryware pieces/year + 24.8M m² ceramic tiles/year. 24/7 kiln operations = extreme electricity load. 65% of production exported — ESG pressure from EU markets. Large flat rooftops across multiple production buildings. Source: lecicoegypt.com / EGX. Est. bill EGP 300K–700K/month. Phase 1 target: 500 kWp on one production building.',
    tags:['Factory','High Bill','Strategic Reference'],
  },

  {
    id:'L-002',
    orgName:'Oriental Weavers Carpets Co. S.A.E.',
    segment:'Factory',
    governorate:'Sharqia',
    contactPerson:'Not publicly available',
    contactRole:'VP Engineering / Sustainability Director',
    phone:'+20 22 2672121',
    whatsapp:'',
    email:'',
    website:'https://ir.orientalweavers.com',
    sourceType:'LinkedIn',
    monthlyBill:'800000',
    systemSizeKW:'300',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Reach IR team via ir.orientalweavers.com — reference their published sustainability targets in annual report',
    lastContacted:'',
    nextFollowUp:d(4),
    touches:'0',
    probability:'5',
    dealValue:'3600000',
    notes:"World's largest machine-woven carpet manufacturer. EGX-listed (ORWE). ~19,000 employees. 1 million+ m² factory complex in 10th of Ramadan City (Cairo-Ismailia Road). Continuous power loom + yarn dyeing operations = very high electricity load. 65% of production exported — ESG reporting is material. IR site: ir.orientalweavers.com. Phone: +20 22 2672121. Source: orientalweavers.com / EGX. Est. bill EGP 500K–1M/month. Phase 1: target 300 kWp on one production building. Note: very large company — start small and use as anchor reference.",
    tags:['Factory','High Bill','Strategic Reference'],
  },

  {
    id:'L-003',
    orgName:'Ceramica Cleopatra Group',
    segment:'Factory',
    governorate:'Sharqia',
    contactPerson:'Not publicly available',
    contactRole:'VP Manufacturing / Engineering Director',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://www.cleopatraceramics.com',
    sourceType:'Website',
    monthlyBill:'400000',
    systemSizeKW:'400',
    painPoint:'High Bills',
    temperature:'Cold',
    stage:'unqualified',
    nextAction:'Research: find LinkedIn contacts at Cleopatra Group — seek intro through construction/building materials network',
    lastContacted:'',
    nextFollowUp:d(14),
    touches:'0',
    probability:'5',
    dealValue:'4800000',
    notes:"One of Egypt's top 3 ceramics producers. 14,000+ employees across Cleopatra Group. 4 integrated tile factories + 2 sanitaryware factories in 10th of Ramadan City and Suez (Eldorado compound ~1km²). Ceramic kilns = highest specific electricity consumption in Egyptian manufacturing. Private company — chairman Mohammed Abou-El Enein is a prominent public figure. No general contact email or phone found publicly. Approach: website contact form at cleopatraceramics.com or industry network introduction. Source: cleopatraceramics.com / groupcleopatra.com. Challenge: private company, harder entry point than EGX-listed peers.",
    tags:['Factory','High Bill'],
  },

  {
    id:'L-004',
    orgName:'Arabian Food Industries — Domty',
    segment:'Factory',
    governorate:'Giza',
    contactPerson:'Not publicly available',
    contactRole:'CEO / Factory Operations Manager',
    phone:'+20 2 35724924',
    whatsapp:'',
    email:'info@domty.org',
    website:'https://www.domty.org',
    sourceType:'LinkedIn',
    monthlyBill:'120000',
    systemSizeKW:'250',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Email info@domty.org or connect with CEO via LinkedIn — reference EGX IR for structured proposal (ticker: DOMT)',
    lastContacted:'',
    nextFollowUp:d(4),
    touches:'0',
    probability:'5',
    dealValue:'3000000',
    notes:"EGX-listed dairy and food processing company (ticker: DOMT). World's largest white cheese producer (Domty brand). Factory: 6th of October City, District 2, Plot 12. Tel factory: +20 2 38202556. HQ: 32C Murad St, Giza. Tel HQ: +20 2 35724924. Email: info@domty.org. Refrigeration, pasteurization, cheese production, cold storage = high continuous electricity load. 3,500+ employees. Est. bill EGP 80K–200K/month. Source: domty.org / EGX. Outreach angle: cold chain energy reliability + electricity cost reduction — present formal ROI deck aligned to EGX investor relations standards.",
    tags:['Factory','High Bill'],
  },

  {
    id:'L-005',
    orgName:'Delta Sugar Company S.A.E.',
    segment:'Factory',
    governorate:'Kafr El Sheikh',
    contactPerson:'Not publicly available',
    contactRole:'Plant Manager / Engineering Director',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://deltasugar.com',
    sourceType:'Website',
    monthlyBill:'200000',
    systemSizeKW:'300',
    painPoint:'High Bills',
    temperature:'Cold',
    stage:'unqualified',
    nextAction:'Research decision-maker contacts via EGX annual report — plan approach post-campaign season (Feb–Apr window)',
    lastContacted:'',
    nextFollowUp:d(21),
    touches:'0',
    probability:'5',
    dealValue:'3600000',
    notes:"EGX-listed beet sugar processor (ticker: SUGR). Factory in Kafr El Sheikh governorate — flat Nile Delta land, excellent solar resource. Seasonal operations: campaign runs Oct–Feb with extreme electricity load (centrifuges, evaporators, crystallizers). Off-season = large unobstructed rooftop available for solar generation and grid export. No public phone or email found — approach via EGX investor relations or annual report contacts. Source: deltasugar.com / EGX. Best approach window: Feb–Apr (post-campaign, pre-next-season planning). Proposal should address both campaign-season bill reduction and off-season grid export revenue.",
    tags:['Factory','High Bill'],
  },

  // ── FARMS (4) ──────────────────────────────────────────────────────────────

  {
    id:'L-006',
    orgName:'Dina Farms (Qalaa Holdings)',
    segment:'Farm',
    governorate:'Beheira',
    contactPerson:'Not publicly available',
    contactRole:'Farm CEO / VP Agriculture / Energy Manager',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://www.dinafarms.com',
    sourceType:'Website',
    monthlyBill:'150000',
    systemSizeKW:'500',
    painPoint:'Diesel Replacement',
    temperature:'Hot',
    stage:'unqualified',
    nextAction:"Contact via dinafarms.com or approach Qalaa Holdings IR (EGX-listed: CCAP) — frame as sustainability + diesel cost reduction for Africa's largest dairy farm",
    lastContacted:'',
    nextFollowUp:d(2),
    touches:'0',
    probability:'5',
    dealValue:'6000000',
    notes:"Africa's largest private dairy farm. Subsidiary of Qalaa Holdings S.A.E. (EGX-listed: CCAP). Location: Km 80, Cairo-Alexandria Desert Road — extreme solar irradiance, flat terrain, zero shading. Scale: 10,000+ acres, 17,194 cattle, 8,529 milking cows; ~70% of Egypt fresh milk market. High electricity and diesel load: 3× daily milking parlors, refrigeration tanks, feed processing, irrigation pumps, worker accommodation. No direct public phone or email — approach via dinafarms.com contact form or Qalaa Holdings IR. Source: dinafarms.com / qalaaholdings.com. Top priority: desert road location + massive diesel displacement + ESG reporting pressure via EGX-listed parent.",
    tags:['Farm','Diesel Replacement','Hot Lead','Strategic Reference'],
  },

  {
    id:'L-007',
    orgName:'Al-Watania Poultry Egypt',
    segment:'Farm',
    governorate:'Giza',
    contactPerson:'Not publicly available',
    contactRole:'Egypt Country Manager / Farm Operations Director',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://alwatania.sa',
    sourceType:'LinkedIn',
    monthlyBill:'100000',
    systemSizeKW:'300',
    painPoint:'Diesel Replacement',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Find Egypt Country Manager via LinkedIn (search: Al-Watania Poultry Egypt) — corporate email domain @alwatania-egy.com',
    lastContacted:'',
    nextFollowUp:d(5),
    touches:'0',
    probability:'5',
    dealValue:'3600000',
    notes:"Saudi-owned fully integrated poultry complex operating in Egypt since Oct 2010. One of the largest integrated poultry operations in the Middle East. HQ address (Egypt): Zone A, B102, Giza (12577). Corporate email domain: @alwatania-egy.com (sourced from public ZoomInfo profiles). Parent: Al-Watania Poultry Saudi Arabia (alwatania.sa). Operations: grandparents → hatcheries → broilers → slaughter → processing. Farm ventilation, broiler house lighting, refrigeration, feed processing = significant electricity and diesel load. Farm sites in agricultural governorates with ample land. Source: LinkedIn / alwatania.sa. Contact: find Egypt Country Manager via LinkedIn or send formal letter to Giza HQ.",
    tags:['Farm','Diesel Replacement','Warm Lead'],
  },

  {
    id:'L-008',
    orgName:'Wadi Group / Wadi Food Industries',
    segment:'Farm',
    governorate:'Giza',
    contactPerson:'Tony S. Freiji (Executive Chairman — AmCham member)',
    contactRole:'Executive Chairman / Operations Director',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://www.wadigroup.com',
    sourceType:'Website',
    monthlyBill:'80000',
    systemSizeKW:'200',
    painPoint:'Diesel Replacement',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Reach Executive Chairman via AmCham Egypt member network or wadigroup.com contact — reference farm at Km 54 and group energy costs',
    lastContacted:'',
    nextFollowUp:d(6),
    touches:'0',
    probability:'5',
    dealValue:'2400000',
    notes:"Egyptian family-owned agro-industrial conglomerate (12 companies). HQ: Capital Business Park, Sheikh Zayed, Giza. Farm at Km 54, Cairo-Alexandria Desert Road — same desert corridor as Dina Farms, excellent solar resource. Operations: olive oil pressing (largest in Egypt, top 5 globally), pickles, vinegar, fava beans, poultry, feed mill. Executive Chairman Tony S. Freiji is a publicly listed AmCham Egypt member — reachable through business community. 3,500+ employees. Source: wadigroup.com / wadi-food.com. Opportunity: 12-company group = potential for multiple solar sites under one agreement. Start with Km 54 farm (easy solar case — desert road, diesel dependent).",
    tags:['Farm','Diesel Replacement','Warm Lead'],
  },

  {
    id:'L-009',
    orgName:'Cairo Poultry Group — Farm Division',
    segment:'Farm',
    governorate:'Beheira',
    contactPerson:'Not publicly available',
    contactRole:'Farm Operations Director / VP Agriculture',
    phone:'+20 2 35714124',
    whatsapp:'',
    email:'',
    website:'https://cpg.com.eg',
    sourceType:'Website',
    monthlyBill:'60000',
    systemSizeKW:'150',
    painPoint:'Power Cuts',
    temperature:'Cold',
    stage:'unqualified',
    nextAction:'Contact CPG via cpg.com.eg or corporate HQ +20 2 35714124 — request connection to farm division (Nobaria/Sadat City sites)',
    lastContacted:'',
    nextFollowUp:d(14),
    touches:'0',
    probability:'5',
    dealValue:'1800000',
    notes:"EGX-listed integrated poultry company (ticker: POUL). Farm sites: Nobaria (Beheira), Sadat City (Monufia), Regwa (Giza). Farm sites are distinct solar targets from the processing plant. Broiler house ventilation, hatchery HVAC, cold storage, feed mill = significant electricity load; power outages are costly for livestock. HQ phone: +20 2 35714124. IR contact (public from EGX filings): haitham.shaarawy@cpg.com.eg. Subsidiary of Kuwait Food Co. (Americana) — international ESG standards apply. Source: cpg.com.eg / EGX. Approach: formal corporate channel first — EGX-listed parent makes proposal credible. Farm sites not directly contactable without corporate intro.",
    tags:['Farm','Power Cuts','Cold Lead'],
  },

  // ── SCHOOLS (6) ────────────────────────────────────────────────────────────

  {
    id:'L-010',
    orgName:'CIRA Education / Futures International Schools',
    segment:'School',
    governorate:'Cairo',
    contactPerson:'Not publicly available',
    contactRole:'CEO (CIRA) / Head of Facilities & Operations',
    phone:'',
    whatsapp:'',
    email:'',
    website:'https://cira.com.eg',
    sourceType:'LinkedIn',
    monthlyBill:'250000',
    systemSizeKW:'300',
    painPoint:'High Bills',
    temperature:'Hot',
    stage:'unqualified',
    nextAction:'Approach CIRA CEO or IR team via cira.com.eg — propose 3-campus pilot with full financial model (ROI, payback, EGP/kWh savings)',
    lastContacted:'',
    nextFollowUp:d(2),
    touches:'0',
    probability:'5',
    dealValue:'3600000',
    notes:"EGX-listed education company (ticker: CIRA). Operates 13+ Futures International School campuses across Greater Cairo + 5 others — 35,000+ K-12 students total. Aggregate energy bill across 13 campuses = very large combined opportunity. Management is investor-facing — responds to financial ROI analysis. Strategy: propose 3-campus pilot (300 kWp) with option to roll out across all sites. Single commercial agreement covers many buildings. Source: cira.com.eg / futuresnet.net / EGX. Approach: contact CIRA Head of Operations or IR with formal energy-cost reduction deck referencing per-student OPEX savings.",
    tags:['School','High Bill','Hot Lead','Strategic Reference'],
  },

  {
    id:'L-011',
    orgName:'El-Alsson British & American International Schools',
    segment:'School',
    governorate:'Giza',
    contactPerson:'Not publicly available',
    contactRole:'School Director / Business Director',
    phone:'+20 106 14 23 444',
    whatsapp:'',
    email:'',
    website:'https://www.alsson.com',
    sourceType:'Website',
    monthlyBill:'100000',
    systemSizeKW:'250',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Call +20 106 14 23 444 — identify Business Manager — schedule meeting with Business Director',
    lastContacted:'',
    nextFollowUp:d(5),
    touches:'0',
    probability:'5',
    dealValue:'3000000',
    notes:"Established 1982. Main campus: 14 feddan (~58,800 m²) at New Giza, Km 22 Cairo-Alexandria Road. Second campus: Saqqara (elalsson.edu.eg). British + American + IB curriculum. Among the largest school campuses in Egypt. Km 22 location = excellent solar resource (desert-proximate, minimal air pollution, flat terrain). Two campuses = multi-site deal potential. Affluent parent base, very high fees. Phone: +20 106 14 23 444. Source: alsson.com. Outreach angle: large campus energy cost reduction — calculate per-student annual savings as a board-level metric. Governors expect high standards; professional presentation required.",
    tags:['School','High Bill','Warm Lead'],
  },

  {
    id:'L-012',
    orgName:'Hayah International Academy',
    segment:'School',
    governorate:'Cairo',
    contactPerson:'Not publicly available',
    contactRole:'Principal / Business Manager',
    phone:'+20 2 2537 3000',
    whatsapp:'',
    email:'info@hayahacademy.com',
    website:'https://hayahacademy.com',
    sourceType:'Website',
    monthlyBill:'90000',
    systemSizeKW:'250',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Email info@hayahacademy.com — request meeting with Business Manager — reference IB sustainability mandate and electricity cost reduction',
    lastContacted:'',
    nextFollowUp:d(5),
    touches:'0',
    probability:'5',
    dealValue:'3000000',
    notes:"IB World School (PYP authorized, MYP candidate, IBDP). Main campus: 55,000 m² in New Cairo (South of Police Academy, 5th District). Second campus: Sheikh Zayed. Two campuses = multi-site potential. IB accreditation = institutional commitment to environmental sustainability (IB mandates environmental education). High-fee school with strong financial capacity. Phone: +20 2 2537 3000. Email: info@hayahacademy.com. Source: hayahacademy.com. Outreach angle: IB sustainability values + electricity cost reduction + campus energy self-sufficiency. Strong pitch: solar aligns with IB identity and reduces operating costs simultaneously.",
    tags:['School','High Bill','Warm Lead','Feasibility Candidate'],
  },

  {
    id:'L-013',
    orgName:'ISC Choueifat Cairo — SABIS Network',
    segment:'School',
    governorate:'Cairo',
    contactPerson:'Not publicly available',
    contactRole:'School Director / SABIS Regional Operations',
    phone:'+20 2 2758 0001',
    whatsapp:'',
    email:'isccairo@sabis.net',
    website:'https://isccairo.sabis.net',
    sourceType:'Website',
    monthlyBill:'70000',
    systemSizeKW:'100',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Email isccairo@sabis.net or call +20 2 2758 0001 — request meeting with School Director on energy cost reduction',
    lastContacted:'',
    nextFollowUp:d(6),
    touches:'0',
    probability:'5',
    dealValue:'1200000',
    notes:"SABIS Network school in Heliopolis, Cairo. 2,055 students from 27 nationalities. Grades KG1–12. Phone: +20 2 2758 0001. Email: isccairo@sabis.net. Second Egypt campus: ISC 6th of October City, Dreamland (isc6october.sabis.net) — two-campus deal potential. SABIS is a global school network with structured procurement — may be open to a network-wide energy agreement. Operational efficiency is core to SABIS culture — solar cost reduction aligns perfectly. Source: isccairo.sabis.net. Outreach angle: two-campus combined savings + SABIS-wide pilot narrative. Note: decisions may require SABIS regional approval — present ROI in USD and EGP.",
    tags:['School','High Bill','Warm Lead'],
  },

  {
    id:'L-014',
    orgName:'Modern English School Cairo (MES)',
    segment:'School',
    governorate:'Cairo',
    contactPerson:'Not publicly available',
    contactRole:'Head Teacher / Business Manager / Finance Director',
    phone:'+20 22 6189600',
    whatsapp:'',
    email:'mescairo@mescairo.com',
    website:'https://www.mescairo.com',
    sourceType:'Website',
    monthlyBill:'85000',
    systemSizeKW:'120',
    painPoint:'High Bills',
    temperature:'Warm',
    stage:'unqualified',
    nextAction:'Email mescairo@mescairo.com to request meeting with Business Manager — reference New Cairo campus energy cost reduction',
    lastContacted:'',
    nextFollowUp:d(5),
    touches:'0',
    probability:'5',
    dealValue:'1440000',
    notes:"Established private school in New Cairo. 32,500 m² campus. ~2,200 students. British + IB + American Diploma curriculum. Phone: +20 22 6189600. Email: mescairo@mescairo.com. Located in 5th District, New Cairo — strong solar irradiance, high AC load in summer. School load profile (8am–3pm) aligns almost perfectly with solar generation — strong self-consumption case. High annual fees (EGP 200K–380K/student) = strong financial capacity. Source: mescairo.com. Outreach angle: calculate annual EGP savings per student as a governor-level metric. Good feasibility study candidate — manageable 120 kWp system, clear roof available.",
    tags:['School','High Bill','Warm Lead','Feasibility Candidate'],
  },

  {
    id:'L-015',
    orgName:'Misr Language Schools',
    segment:'School',
    governorate:'Giza',
    contactPerson:'Not publicly available',
    contactRole:'School Director / Administrative Board',
    phone:'+20 2 3376 0170',
    whatsapp:'',
    email:'',
    website:'https://mls-egypt.org',
    sourceType:'Website',
    monthlyBill:'75000',
    systemSizeKW:'80',
    painPoint:'High Bills',
    temperature:'Cold',
    stage:'unqualified',
    nextAction:'Call +20 2 3376 0170 — speak with administrative office to identify who handles facilities and utilities decisions',
    lastContacted:'',
    nextFollowUp:d(21),
    touches:'0',
    probability:'5',
    dealValue:'960000',
    notes:"Private school network on Faiyum Desert Road, Al Haram, Giza. 5 campuses; multiple curriculum streams: French, American, British, National. Giza Haram location = proximity to desert, excellent solar irradiance, minimal air pollution. 5 campuses offer multi-site expansion — start with main campus pilot (estimated 80 kWp). Phone: +20 2 3376 0170. No general email found publicly. Source: mls-egypt.org. Note: older school with potentially older infrastructure — bill reduction argument is strongest entry. Cold lead — begin with a phone call to the administrative office to identify the facilities or finance decision-maker before sending any materials.",
    tags:['School','High Bill','Cold Lead'],
  },
];

// ── Tenders: not a priority in current phase ───────────────────────────────────
export const INIT_TENDERS = [];

// ── Research queue: next prospecting targets ────────────────────────────────────
export const INIT_RESEARCH = [
  {
    id:'R-001',
    targetSegment:'Factory',
    searchQuery:'Food processing, pharmaceuticals, plastics factories — 10th of Ramadan City and Obour City industrial zones',
    sourceWebsite:'LinkedIn / Yellow Pages Egypt / 10thramadan-city.com',
    orgFound:'', contactFound:'',
    verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false,
    notes:'Phase 2 factory research — after first outreach to LECICO and Oriental Weavers. Focus on medium-sized operations (50–200 employees) that are approachable by a startup EPC.',
  },
  {
    id:'R-002',
    targetSegment:'Farm',
    searchQuery:'Large private farms with diesel generators — Minya, Beni Suef, Fayoum (new agricultural land, off-grid heavy diesel)',
    sourceWebsite:'LinkedIn / Egypt Agriculture Chamber / Google Maps satellite imagery',
    orgFound:'', contactFound:'',
    verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false,
    notes:'Phase 2 farm research — Upper Egypt new land farms. Date palm and vegetable farms on reclaimed desert land are entirely diesel dependent. High urgency pain point. Identify farm managers and agricultural engineers via LinkedIn.',
  },
  {
    id:'R-003',
    targetSegment:'School',
    searchQuery:'Private international schools New Cairo and Sheikh Zayed — 500+ students — not yet in CRM',
    sourceWebsite:'Ministry of Education Egypt private schools database / Google Maps / InternationalSchoolsDatabase.com',
    orgFound:'', contactFound:'',
    verificationStatus:'Pending', assignedTo:'Founder', importToCRM:false,
    notes:'Phase 2 school research — after initial outreach to current 6 school leads. Target remaining large-campus private schools in New Cairo and Sheikh Zayed. Focus on schools with IB or British curriculum (strongest ESG + sustainability alignment).',
  },
];

export const CSV_TEMPLATE_HEADERS = ['Lead ID','Organization Name','Segment','Governorate','Contact Person','Role','Phone','WhatsApp','Email','Website','Source Type','Monthly Bill EGP','System Size kW','Pain Point','Temperature','Pipeline Stage','Next Action','Last Contacted','Next Follow-Up','Touches','Probability %','Deal Value EGP','Notes'];
