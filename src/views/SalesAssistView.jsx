import { useState, useCallback } from 'react';
import { SALES_INTEL } from './SalesIntelView';

// ── Design tokens (match CRMView) ─────────────────────────────────────────────
const N = '#0D2137'; const G = '#C8991A'; const T = '#1A6B72';
const R = '#C0392B'; const GR = '#1E7E34'; const AM = '#856404';
const BTN = { padding:'7px 14px', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', letterSpacing:'.3px' };
const INP = { border:'1px solid #dde1e7', borderRadius:4, padding:'7px 10px', fontSize:13, color:'#1a1a1a', fontFamily:'inherit', boxSizing:'border-box', width:'100%' };
const CARD = { background:'#fff', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.1)' };

const LS_LEADS = 'crm_leads_v3';
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const todayStr = () => new Date().toISOString().split('T')[0];

// ── Segment → SalesIntel id ───────────────────────────────────────────────────
const SEGMENT_MAP = {
  'Factory':            'industrial',
  'Farm':               'agricultural',
  'School':             'commercial',
  'Mall / Commercial':  'commercial',
  'Government Tender':  'government',
  'Other':              'commercial',
};

// ── CRM segment tariff (EgyptERA Sept 2024) ───────────────────────────────────
const SEGMENT_TARIFF = {
  'Factory': 2.34, 'Farm': 2.00,
  'School': 2.33, 'Mall / Commercial': 2.33,
  'Government Tender': 2.34, 'Other': 2.34,
};

// ── Pain point → keyword fragments to match/highlight value prop titles ───────
const PAIN_HIGHLIGHT = {
  'High Bills':          ['tariff','cost','25 year','energy cost','lock'],
  'Power Cuts':          ['grid outage','running during','continuity','outage','backup','shedding'],
  'Diesel Replacement':  ['diesel','fuel'],
  'ESG / Sustainability':['carbon','EU','CBAM','export access'],
  'Expansion':           ['expand','marginal','more land','zero marginal'],
};

// ── Feasibility fee by system kWp ─────────────────────────────────────────────
const feasFee = (kWp) => {
  const k = parseFloat(kWp) || 0;
  if (k > 0 && k <= 100) return 'EGP 3,500';
  if (k > 100 && k <= 300) return 'EGP 6,000';
  if (k > 300) return 'EGP 9,000–12,000';
  return 'EGP 3,500–12,000 (depends on system size)';
};

// ── Bill math ─────────────────────────────────────────────────────────────────
const billMath = (lead) => {
  const bill    = parseFloat(lead.monthlyBill) || 0;
  const tariff  = SEGMENT_TARIFF[lead.segment] || 2.34;
  const kWh     = bill > 0 ? Math.round(bill / tariff) : 0;
  const annualBill = bill * 12;
  const annualSavingEstimate = bill > 0 ? Math.round(annualBill * 0.25) : 0;
  return { bill, tariff, kWh, annualBill, annualSavingEstimate };
};

// ── Personalize Arabic WA template by segment ─────────────────────────────────
const buildWAArabic = (lead) => {
  const name = lead.contactPerson || 'الأستاذ';
  const org  = lead.orgName || 'منشأتكم';
  const { bill, annualBill } = billMath(lead);
  const billLine = bill > 0
    ? `شايف إن فاتورتكم الشهرية في ${org} بتوصل حوالي EGP ${bill.toLocaleString()} — وده معناه تكلفة كهرباء سنوية فوق EGP ${annualBill.toLocaleString()}.`
    : `تعريفة الكهرباء اتغيرت كتير — ومع الزيادات المتوقعة تحت اتفاقية الـ IMF، الطاقة بقت تكلفة استراتيجية.`;

  const segLines = {
    'Factory':           `بعمل دراسات جدوى دقيقة بالأرقام الحقيقية للمصانع — مش تقديرات المورّد. لو حابب أعرف هل الشمسية تنفع لـ ${org} فعلاً، أنا ٢٠ دقيقة وبخبّرك.`,
    'Farm':              `بعمل دراسات جدوى للطاقة الشمسية للمزارع — بفرق واضح لو شغّالين بديزل. لو حابب أعرف هل الأرقام بتنفع لـ ${org}، أنا ٢٠ دقيقة وبخبّرك.`,
    'School':            `بعمل دراسات جدوى للطاقة الشمسية للمدارس والجامعات — التشغيل النهاري بيخلي الأرقام تتفع جداً. لو حابب نشوف الجدوى لـ ${org}، أنا ٢٠ دقيقة وبخبّرك.`,
    'Mall / Commercial': `بعمل دراسات جدوى للطاقة الشمسية للمنشآت التجارية. لو حابب أعرف هل الأرقام تنفع لـ ${org}، أنا ٢٠ دقيقة وبخبّرك.`,
    'Government Tender': `بتابع المناقصات الحكومية للطاقة الشمسية وبعمل تحليل جدوى للمنشآت الحكومية. لو في اهتمام، أنا ٢٠ دقيقة وبخبّرك.`,
    'Other':             `بعمل دراسات جدوى دقيقة للطاقة الشمسية. لو حابب أعرف هل الأرقام تنفع لـ ${org}، أنا ٢٠ دقيقة وبخبّرك.`,
  };

  return `أهلاً ${name}، أنا [اسمك] — بشتغل في تحليل الجدوى الاقتصادية لأنظمة الطاقة الشمسية.\n\n${billLine}\n\n${segLines[lead.segment] || segLines['Other']}`;
};

const buildWAEnglish = (lead) => {
  const name = lead.contactPerson || 'there';
  const org  = lead.orgName || 'your facility';
  const { bill, annualBill } = billMath(lead);
  const billLine = bill > 0
    ? `I can see ${org}'s monthly electricity bill is around EGP ${bill.toLocaleString()} — that's over EGP ${annualBill.toLocaleString()}/year.`
    : `Industrial tariffs hit EGP 2.34/kWh in September 2024, with further hikes planned under Egypt's IMF agreement.`;

  const segLines = {
    'Factory':           `I do independent solar feasibility analysis for factories — not vendor estimates. Would you have 20 minutes to walk me through ${org}'s energy setup?`,
    'Farm':              `I do solar feasibility analysis for agricultural operations — strong case especially vs diesel. Would you have 20 minutes to walk through ${org}'s energy setup?`,
    'School':            `I do solar feasibility for schools and universities — daytime operations mean the economics work very well. Would you have 20 minutes for ${org}?`,
    'Mall / Commercial': `I do independent solar feasibility for commercial facilities. Would you have 20 minutes to explore whether the numbers work for ${org}?`,
    'Government Tender': `I work with government facilities on solar feasibility studies and tender preparation. Worth a 20-minute call?`,
    'Other':             `I do independent solar feasibility analysis — not vendor quotes. Would you have 20 minutes to explore whether the numbers work for ${org}?`,
  };

  return `Hi ${name}, I'm [Your Name] — I do solar energy feasibility analysis in Egypt.\n\n${billLine}\n\n${segLines[lead.segment] || segLines['Other']}`;
};

const buildEmail = (lead) => {
  const name = lead.contactPerson || 'السيد/ة';
  const org  = lead.orgName || 'منشأتكم';
  const { bill, annualBill } = billMath(lead);
  const billLine = bill > 0
    ? `بناءً على فاتورتكم الشهرية المقدرة بحوالي EGP ${bill.toLocaleString()} (EGP ${annualBill.toLocaleString()}/سنة)`
    : `بعد التغيير الأخير في التعريفة (٢٫٣٤ جنيه/كيلوواط للصناعي — سبتمبر ٢٠٢٤)`;

  return `أهلاً ${name}،\n\nأنا [اسمك]، متخصص في تحليل الجدوى الاقتصادية لأنظمة الطاقة الشمسية في مصر.\n\n${billLine}، كتير من المنشآت بتسأل نفس السؤال: هل الشمسية تنفع فعلاً؟\n\nالإجابة بتختلف من منشأة للتانية. عشان كده بدل ما أديك رقم عشوائي، بعمل دراسة جدوى دقيقة بناءً على بياناتك الفعلية لـ ${org}.\n\nلو مهتم بمعرفة الأرقام الحقيقية، يسعدني نتكلم ٢٠ دقيقة على الهاتف.\n\nمع احترامي،\n[اسمك] | [الهاتف]`;
};

const buildPhoneOpener = (lead) => {
  const name = lead.contactPerson || '[الاسم]';
  const org  = lead.orgName || 'شركتكم';
  return `"أهلاً ${name}، معك [اسمك]، بشتغل في تحليل جدوى الطاقة الشمسية. أتمنى ما باعدتش عليك — عندي سؤال واحد بس: فاتورة الكهرباء في ${org} شهرياً بتكون قد إيه تقريباً؟"\n\n[انتظر الإجابة]\n\nلو ≥ EGP 30,000: "تمام — ده النوع اللي الشمسية ممكن تعمل فيه فرق كبير. أنا مش بحاول أبيعلك حاجة، بعمل تحليل مستقل. ممكن نتكلم ١٥ دقيقة تاني يوم؟"\n\nلو < EGP 15,000: "تمام، بصراحة الأرقام مش بتنفع كتير لأقل من كده. مش عايز أضيع وقتك."`;
};

const buildFollowUp = (lead, day) => {
  const name = lead.contactPerson || 'الأستاذ';
  const org  = lead.orgName || 'منشأتكم';
  const { bill } = billMath(lead);

  if (day === 2) return `أهلاً ${name}، كنت بعتلك رسالة امبارح. مش لازم تقرر حاجة دلوقتي — بس لو عايز تعرف إيه التوفير المتوقع الفعلي لـ ${org}، أنا متاح.`;
  if (day === 5) {
    const valueNote = bill > 0
      ? `فاتورتكم الشهرية حوالي EGP ${bill.toLocaleString()} — دراسة الجدوى ممكن تقولك إيه التوفير الحقيقي بدل تقديرات المورّدين.`
      : `دراسة الجدوى بتقولك الأرقام الحقيقية — مش تقديرات المورّدين.`;
    return `أهلاً ${name}، ${valueNote}\n\nالدراسة بـ EGP 3,500 وبتحميك من قرار بملايين. عندك ١٥ دقيقة الأسبوع ده؟`;
  }
  return `أهلاً ${name}، هبعتلك آخر رسالة عشان مش عايز أضيع وقتك.\n\nلو التوقيت مش مناسب دلوقتي — مش مشكلة على الإطلاق. بس لو الكهرباء أو الديزل لسه بيمثل تكلفة كبيرة على ${org}، أنا هنا لما تكون جاهز.`;
};

// ── Copy hook ─────────────────────────────────────────────────────────────────
const useCopy = () => {
  const [copied, setCopied] = useState(null);
  const copy = useCallback((text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }, []);
  return [copied, copy];
};

// ── CopyBtn ───────────────────────────────────────────────────────────────────
const CopyBtn = ({ text, id, copied, onCopy, label = 'Copy', small }) => (
  <button
    onClick={() => onCopy(text, id)}
    style={{ ...BTN,
      background: copied === id ? GR : '#f0f2f5',
      color: copied === id ? '#fff' : N,
      padding: small ? '4px 10px' : '6px 14px',
      fontSize: small ? 10 : 12,
      transition: 'all .15s',
      minWidth: 60,
    }}>
    {copied === id ? '✓ Copied' : label}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Outreach
// ─────────────────────────────────────────────────────────────────────────────
const OutreachSection = ({ lead, live }) => {
  const [copied, copy] = useCopy();
  const fs = live ? 14 : 13;

  const templates = [
    { id:'wa_ar',    icon:'💬', label:'WhatsApp Arabic',   lang:'AR', text: buildWAArabic(lead),    note:'Primary channel — use this first' },
    { id:'wa_en',    icon:'💬', label:'WhatsApp English',  lang:'EN', text: buildWAEnglish(lead),   note:'For bilingual contacts' },
    { id:'email',    icon:'📧', label:'Email',             lang:'AR', text: buildEmail(lead),       note:'Attach company profile PDF' },
    { id:'phone',    icon:'📞', label:'Phone Opener',      lang:'AR', text: buildPhoneOpener(lead), note:'Script — not a copy-paste, read it' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#fff8e1', border:`1px solid ${G}`, borderRadius:6, padding:'10px 14px', fontSize:12, color:AM, fontWeight:600 }}>
        Personalized to: <strong>{lead.orgName}</strong> · {lead.contactPerson || 'contact not set'} · {lead.segment} · {lead.governorate}
        {lead.monthlyBill ? ` · EGP ${parseFloat(lead.monthlyBill).toLocaleString()}/mo bill` : ' · bill not set (add to lead for personalized numbers)'}
      </div>
      {templates.map(t => (
        <div key={t.id} style={{ ...CARD, padding:0, overflow:'hidden' }}>
          <div style={{ background:'#f8f9fa', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee' }}>
            <div>
              <span style={{ fontSize:fs, fontWeight:800, color:N }}>{t.icon} {t.label}</span>
              <span style={{ fontSize:10, color:'#888', marginLeft:10 }}>{t.note}</span>
            </div>
            <CopyBtn text={t.text} id={t.id} copied={copied} onCopy={copy} />
          </div>
          <pre style={{ margin:0, padding:'14px 16px', fontSize:fs, lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'inherit', color:'#333', direction: t.lang==='AR' ? 'rtl' : 'ltr' }}>
            {t.text}
          </pre>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Discovery Call
// ─────────────────────────────────────────────────────────────────────────────
const DiscoveryCallSection = ({ lead, onUpdateLead, live }) => {
  const existing  = lead.stageData?.contacted          || {};
  const existingQ = lead.stageData?.qualified           || {};
  const existingSV = lead.stageData?.site_visit_scheduled || {};
  const fs = live ? 15 : 13;
  const headFs = live ? 16 : 14;

  const [form, setForm] = useState({
    contactDate:         existing.contactDate         || todayStr(),
    channel:             existing.channel             || 'Call',
    decisionMakerName:   existing.decisionMakerName   || '',
    decisionMakerRole:   existing.decisionMakerRole   || '',
    billHeard:           existing.billHeard            || (lead.monthlyBill || ''),
    kWhEstimate:         existing.kWhEstimate          || '',
    hasDiesel:           existing.hasDiesel            !== undefined ? existing.hasDiesel : (existingQ.existingDiesel || false),
    operatingHours:      existing.operatingHours       || '',
    ownsBuilding:        existing.ownsBuilding         !== undefined ? existing.ownsBuilding : false,
    needsSummary:        existing.needsSummary         || '',
    budgetIndication:    existing.budgetIndication     || 'Unknown',
    timeline:            existing.timeline             || 'Unclear',
    utilityBillCollected:existing.utilityBillCollected !== undefined ? existing.utilityBillCollected : false,
    roughSizeKwp:        existing.roughSizeKwp         || (lead.systemSizeKW || ''),
    objections:          existingQ.objections          || '',
    nextCommitment:      existing.nextCommitment       || '',
    // Site visit fields
    siteVisitScheduled:  Object.keys(existingSV).length > 0,
    svMoveStage:         false,
    svDate:              existingSV.scheduledDate      || '',
    svTime:              existingSV.scheduledTime      || '',
    svAddress:           existingSV.siteAddress        || '',
    svContactName:       existingSV.onSiteContactName  || '',
    svContactPhone:      existingSV.onSiteContactPhone || '',
    svAccessNotes:       existingSV.accessNotes        || '',
  });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const qualVote = () => {
    const bill = parseFloat(form.billHeard) || 0;
    let score = 0;
    if (bill >= 30000) score += 3;
    else if (bill >= 15000) score += 1;
    if (form.ownsBuilding) score += 2;
    if (form.decisionMakerName) score += 2;
    if (form.hasDiesel) score += 2;
    if (score >= 6) return { label:'PURSUE', color: GR, bg:'#e8f5e9' };
    if (score >= 3) return { label:'HOLD — QUALIFY FURTHER', color: AM, bg:'#fff3cd' };
    return { label:'DROP', color: R, bg:'#fdecea' };
  };

  const saveToLead = () => {
    const svData = form.siteVisitScheduled ? {
      scheduledDate:      form.svDate,
      scheduledTime:      form.svTime,
      siteAddress:        form.svAddress,
      onSiteContactName:  form.svContactName,
      onSiteContactPhone: form.svContactPhone,
      accessNotes:        form.svAccessNotes,
    } : (lead.stageData?.site_visit_scheduled || {});

    const updated = {
      ...lead,
      ...(form.siteVisitScheduled && form.svMoveStage ? {
        stage: 'site_visit_scheduled',
        stageEnteredDate: todayStr(),
        probability: '45',
      } : {}),
      stageData: {
        ...lead.stageData,
        contacted: {
          ...(lead.stageData?.contacted || {}),
          contactDate:          form.contactDate,
          channel:              form.channel,
          decisionMakerName:    form.decisionMakerName,
          decisionMakerRole:    form.decisionMakerRole,
          billHeard:            form.billHeard,
          kWhEstimate:          form.kWhEstimate,
          hasDiesel:            form.hasDiesel,
          operatingHours:       form.operatingHours,
          ownsBuilding:         form.ownsBuilding,
          needsSummary:         form.needsSummary,
          budgetIndication:     form.budgetIndication,
          timeline:             form.timeline,
          utilityBillCollected: form.utilityBillCollected,
          roughSizeKwp:         form.roughSizeKwp,
          nextCommitment:       form.nextCommitment,
        },
        qualified: {
          ...(lead.stageData?.qualified || {}),
          existingDiesel:          form.hasDiesel,
          objections:              form.objections,
          monthlyBillConfirmedEGP: form.billHeard,
          // Stamp qualifiedDate when moving forward so velocity metrics and
          // dossier completion register this lead as having been qualified.
          ...(form.siteVisitScheduled && form.svMoveStage && !lead.stageData?.qualified?.qualifiedDate
            ? { qualifiedDate: todayStr() }
            : {}),
        },
        site_visit_scheduled: svData,
      },
    };
    onUpdateLead(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const vote = qualVote();
  const scriptColor = '#f0f7ff';
  const scriptBorder = '#c0d8f0';

  const ScriptBlock = ({ text }) => (
    <div style={{ background: scriptColor, border:`1px solid ${scriptBorder}`, borderRadius:6, padding:'10px 14px', fontSize:fs, lineHeight:1.7, color:'#333', fontStyle:'italic', direction:'rtl' }}>
      {text}
    </div>
  );

  const Field = ({ label, children, half }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:4, flex: half ? '0 0 calc(50% - 6px)' : '1 1 100%' }}>
      <label style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'.5px', color:'#888' }}>{label}</label>
      {children}
    </div>
  );

  const Check = ({ label, k }) => (
    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:fs, cursor:'pointer', fontWeight:600 }}>
      <input type="checkbox" checked={!!form[k]} onChange={e => set(k, e.target.checked)}
        style={{ width:16, height:16, cursor:'pointer' }} />
      {label}
    </label>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Meta */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <Field label="Date" half><input type="date" value={form.contactDate} onChange={e=>set('contactDate',e.target.value)} style={{ ...INP, fontSize:fs }} /></Field>
        <Field label="Channel" half>
          <select value={form.channel} onChange={e=>set('channel',e.target.value)} style={{ ...INP, fontSize:fs }}>
            {['Call','WhatsApp','Meeting','Email'].map(c=><option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      {/* Phase 1: Opening */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Phase 1 — Opening Script</div>
        <ScriptBlock text={`"شكراً على وقتك. هخلي الموضوع قصير — أنا محتاج أفهم وضعكم الأول قبل ما أحكيلك عن أي حاجة. هل مناسب؟"`} />
      </div>

      {/* Phase 2: Electricity */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Phase 2 — Electricity Situation</div>
        <ScriptBlock text={`"فاتورة الكهرباء شهرياً بتكون قد إيه تقريباً؟" / "بتستخدموا مولد ديزل؟ بتشغّلوه قد إيه؟"`} />
        <div style={{ height:12 }} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Field label="Monthly Bill Heard (EGP)" half>
            <input type="number" value={form.billHeard} onChange={e=>set('billHeard',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="e.g. 45000" />
          </Field>
          <Field label="Estimated kWh/month" half>
            <input type="number" value={form.kWhEstimate} onChange={e=>set('kWhEstimate',e.target.value)}
              style={{ ...INP, fontSize:fs }}
              placeholder={form.billHeard ? `≈ ${Math.round(parseFloat(form.billHeard||0)/(SEGMENT_TARIFF[lead.segment]||2.34))} kWh` : 'auto from bill'} />
          </Field>
        </div>
        <div style={{ height:10 }} />
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <Check label="Diesel generator present" k="hasDiesel" />
          <Check label="Utility bill collected / promised" k="utilityBillCollected" />
        </div>
        {form.billHeard && parseFloat(form.billHeard) >= 15000 && (
          <div style={{ marginTop:8, background:'#e8f5e9', border:`1px solid ${GR}`, borderRadius:4, padding:'6px 12px', fontSize:12, color:GR, fontWeight:700 }}>
            Bill qualifies. Annual spend: EGP {(parseFloat(form.billHeard)*12).toLocaleString()}.
            {form.hasDiesel ? ' + diesel costs on top.' : ''}
          </div>
        )}
        {form.billHeard && parseFloat(form.billHeard) < 15000 && parseFloat(form.billHeard) > 0 && (
          <div style={{ marginTop:8, background:'#fdecea', border:`1px solid ${R}`, borderRadius:4, padding:'6px 12px', fontSize:12, color:R, fontWeight:700 }}>
            Bill below EGP 15K — numbers unlikely to justify investment. Consider dropping unless diesel is significant.
          </div>
        )}
      </div>

      {/* Phase 3: Facility */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Phase 3 — Facility Profile</div>
        <ScriptBlock text={`"المنشأة شغّالة النهارده ولا بالليل أكتر؟" / "بتملكوا المبنى؟"`} />
        <div style={{ height:12 }} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Field label="Operating Hours" half>
            <input type="text" value={form.operatingHours} onChange={e=>set('operatingHours',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="e.g. 7am–5pm, 24hrs" />
          </Field>
          <Field label="Rough System Size (kWp)" half>
            <input type="number" value={form.roughSizeKwp} onChange={e=>set('roughSizeKwp',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="estimate" />
          </Field>
        </div>
        <div style={{ height:10 }} />
        <Check label="Owns building / long-term lease (>5yr)" k="ownsBuilding" />
      </div>

      {/* Phase 4: Authority */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Phase 4 — Authority</div>
        <ScriptBlock text={`"انت اللي هتاخد القرار ده ولا في ناس تانية لازم تكون موجودة؟"`} />
        <div style={{ height:12 }} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Field label="Decision Maker Name" half>
            <input type="text" value={form.decisionMakerName} onChange={e=>set('decisionMakerName',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="Name heard on call" />
          </Field>
          <Field label="Role / Title" half>
            <input type="text" value={form.decisionMakerRole} onChange={e=>set('decisionMakerRole',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="Owner / CFO / etc" />
          </Field>
        </div>
      </div>

      {/* Phase 5: Budget */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Phase 5 — Budget & Timeline</div>
        <ScriptBlock text={`"منظومة بحجمكم بتتكلف حوالي EGP 1.5–2.5 مليون. ده رقم قريب من اللي بتفكروا فيه؟" / "إيه اللي خلاكم تفكروا فيها دلوقتي؟"`} />
        <div style={{ height:12 }} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Field label="Budget Indication" half>
            <select value={form.budgetIndication} onChange={e=>set('budgetIndication',e.target.value)} style={{ ...INP, fontSize:fs }}>
              {['Unknown','< EGP 500K','EGP 500K–1M','EGP 1M–3M','EGP 3M+'].map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Client Timeline" half>
            <select value={form.timeline} onChange={e=>set('timeline',e.target.value)} style={{ ...INP, fontSize:fs }}>
              {['Unclear','Urgent (< 3 months)','3–6 months','6–12 months','1 year+'].map(o=><option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Needs + Objections */}
      <div>
        <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Notes</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Field label="Needs / Pain Summary">
            <textarea value={form.needsSummary} onChange={e=>set('needsSummary',e.target.value)}
              rows={3} style={{ ...INP, resize:'vertical', fontSize:fs }} placeholder="What did they say about their pain?" />
          </Field>
          <Field label="Objections Raised">
            <textarea value={form.objections} onChange={e=>set('objections',e.target.value)}
              rows={2} style={{ ...INP, resize:'vertical', fontSize:fs }} placeholder="e.g. cost too high, wants free quote first" />
          </Field>
          <Field label="Next Commitment Made">
            <input type="text" value={form.nextCommitment} onChange={e=>set('nextCommitment',e.target.value)}
              style={{ ...INP, fontSize:fs }} placeholder="e.g. send bills by Thursday, call back Monday" />
          </Field>
        </div>
      </div>

      {/* Qualification Verdict */}
      <div style={{ background: vote.bg, border:`1px solid ${vote.color}`, borderRadius:8, padding:'14px 18px' }}>
        <div style={{ fontSize:11, fontWeight:900, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Qualification Verdict</div>
        <div style={{ fontSize:22, fontWeight:900, color: vote.color }}>{vote.label}</div>
        <div style={{ fontSize:12, color:'#555', marginTop:6, lineHeight:1.5 }}>
          {vote.label === 'PURSUE' && 'Strong signal. Move to transition script — offer the feasibility study now.'}
          {vote.label.startsWith('HOLD') && 'Some signals missing. Ask about building ownership or get bills first before offering the study.'}
          {vote.label === 'DROP' && 'Bill too low or wrong fit. Close the call gracefully — do not pitch.'}
        </div>
      </div>

      {/* Transition Script */}
      {vote.label === 'PURSUE' && (
        <div>
          <div style={{ fontSize:headFs, fontWeight:900, color:N, marginBottom:8 }}>Transition — Offer the Feasibility Study</div>
          <ScriptBlock text={`"بناءً على اللي اتكلمنا فيه، ده بيبان مناسب. الحقيقة مش قادر أقولك الـ ROI الحقيقي من غير ما أشوف فواتيرك وأعمل الحسابات صح.\n\nاللي بقترحه دراسة جدوى — بـ EGP ${feasFee(form.roughSizeKwp || lead.systemSizeKW)} لمنشأة بحجمكم، جاهزة في ٥–٧ أيام، وبتديك موديل مالي حقيقي مبني على بياناتكم.\n\nولو الأرقام اتنفعت ومشينا مع بعض، الـ fee دي بتتخصم كاملاً.\n\nممكن أبعتلك ورقة واحدة بتوضح إيه اللي بيتشمل فيها؟"`} />
        </div>
      )}

      {/* Site Visit Scheduled */}
      <div style={{ border:`2px solid ${form.siteVisitScheduled ? GR : '#dde1e7'}`, borderRadius:8, overflow:'hidden', transition:'border-color .15s' }}>
        {/* Checkbox trigger row */}
        <label style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', cursor:'pointer', background: form.siteVisitScheduled ? '#e8f5e9' : '#f8f9fa', userSelect:'none' }}>
          <input
            type="checkbox"
            checked={!!form.siteVisitScheduled}
            onChange={e => set('siteVisitScheduled', e.target.checked)}
            style={{ width:20, height:20, cursor:'pointer', accentColor: GR }}
          />
          <div>
            <div style={{ fontSize: live ? 16 : 14, fontWeight:900, color: form.siteVisitScheduled ? GR : N }}>
              📅 Site visit scheduled during this call
            </div>
            <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
              Tick this if they agreed to a visit — expands booking fields that save to the Site Visit dossier stage
            </div>
          </div>
          {form.siteVisitScheduled && (
            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:900, background:GR, color:'#fff', borderRadius:3, padding:'3px 8px' }}>VISIT BOOKED</span>
          )}
        </label>

        {/* Expanded fields */}
        {form.siteVisitScheduled && (
          <div style={{ padding:'16px 18px', borderTop:`1px solid ${GR}44`, display:'flex', flexDirection:'column', gap:14 }}>

            {/* Date + Time */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Field label="Visit Date" half>
                <input type="date" value={form.svDate} onChange={e=>set('svDate',e.target.value)}
                  style={{ ...INP, fontSize:fs, borderColor: !form.svDate ? R : '#dde1e7' }} />
              </Field>
              <Field label="Visit Time" half>
                <input type="time" value={form.svTime} onChange={e=>set('svTime',e.target.value)}
                  style={{ ...INP, fontSize:fs }} />
              </Field>
            </div>

            {/* Address */}
            <Field label="Site Address">
              <input type="text" value={form.svAddress} onChange={e=>set('svAddress',e.target.value)}
                style={{ ...INP, fontSize:fs }} placeholder="Full address, building name, landmark" />
            </Field>

            {/* On-site contact */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <Field label="On-Site Contact Name" half>
                <input type="text" value={form.svContactName} onChange={e=>set('svContactName',e.target.value)}
                  style={{ ...INP, fontSize:fs }} placeholder={form.decisionMakerName || 'Name'} />
              </Field>
              <Field label="On-Site Contact Phone" half>
                <input type="tel" value={form.svContactPhone} onChange={e=>set('svContactPhone',e.target.value)}
                  style={{ ...INP, fontSize:fs }} placeholder="01X XXXX XXXX" />
              </Field>
            </div>

            {/* Access notes */}
            <Field label="Access Instructions / Notes">
              <textarea value={form.svAccessNotes} onChange={e=>set('svAccessNotes',e.target.value)}
                rows={2} style={{ ...INP, resize:'vertical', fontSize:fs }}
                placeholder="Gate code, security procedure, ask for [name], park at..." />
            </Field>

            {/* Stage move toggle */}
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', background:'#f0f7ff', borderRadius:6, padding:'10px 14px', border:'1px solid #c0d8f0' }}>
              <input
                type="checkbox"
                checked={!!form.svMoveStage}
                onChange={e => set('svMoveStage', e.target.checked)}
                style={{ width:16, height:16, cursor:'pointer', accentColor: T }}
              />
              <div>
                <div style={{ fontSize:fs, fontWeight:700, color:T }}>Move lead stage to "Site Visit Scheduled"</div>
                <div style={{ fontSize:11, color:'#888' }}>
                  Pipeline → Site Visit Scheduled · Probability → 45%
                  {!lead.stageData?.qualified?.qualifiedDate && ' · Stamps Qualified date (today) so velocity metrics are accurate'}
                </div>
              </div>
            </label>

            {!form.svDate && (
              <div style={{ fontSize:11, color:R, fontWeight:700 }}>⚠ Visit date is required — fill it before saving.</div>
            )}
          </div>
        )}
      </div>

      {/* Save button */}
      <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:8, borderTop:'1px solid #eee' }}>
        <button onClick={saveToLead} style={{ ...BTN, background: saved ? GR : N, color:'#fff', padding:'10px 24px', fontSize:13 }}>
          {saved ? '✓ Saved to Dossier' : 'Save to Lead Dossier'}
        </button>
        <span style={{ fontSize:11, color:'#aaa' }}>
          Writes to: Contacted · Qualified
          {form.siteVisitScheduled ? ' · Site Visit Scheduled' : ''}
          {form.siteVisitScheduled && form.svMoveStage ? ' · stage moved' : ''}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Value Props
// ─────────────────────────────────────────────────────────────────────────────
const ValuePropsSection = ({ lead, intel, live }) => {
  const [copied, copy] = useCopy();
  const [expanded, setExpanded] = useState(null);
  const fs = live ? 14 : 13;

  if (!intel) return <div style={{ color:'#aaa', fontSize:fs }}>No intel data for this segment.</div>;

  const painKws = PAIN_HIGHLIGHT[lead.painPoint] || [];
  const isHighlighted = (title) => painKws.some(kw => title.toLowerCase().includes(kw.toLowerCase()));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Segment Context */}
      <div style={{ ...CARD, padding:'14px 18px', borderLeft:`4px solid ${intel.color || T}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, flexWrap:'wrap', gap:8 }}>
          <div>
            <span style={{ fontSize:16, fontWeight:900, color:N }}>{intel.label} Segment</span>
            <span style={{ fontSize:11, color:'#888', marginLeft:10 }}>{intel.badge}</span>
            {lead.segment === 'School' && (
              <span style={{ marginLeft:8, fontSize:10, background:'#fff3cd', color:AM, padding:'2px 6px', borderRadius:3, fontWeight:700 }}>Commercial tariff data shown (nearest match)</span>
            )}
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:11 }}>
            <span><strong>Tariff:</strong> {intel.tariff}</span>
            <span><strong>Typical size:</strong> {intel.typicalSize}</span>
            <span><strong>Payback:</strong> {intel.payback}</span>
          </div>
        </div>
        <div style={{ fontSize:fs, lineHeight:1.7, color:'#444', marginBottom:10 }}>{intel.context}</div>
        <div style={{ background:'#fff8e1', border:`1px solid ${G}`, borderRadius:4, padding:'8px 12px', fontSize:12, fontWeight:700, color:AM }}>
          Opening angle: {intel.angle}
        </div>
      </div>

      {/* Key Stats */}
      <div>
        <div style={{ fontSize:13, fontWeight:900, color:N, marginBottom:8 }}>Key Stats (click to copy)</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {intel.keyStats?.map((s, i) => (
            <button key={i} onClick={() => copy(`${s.label}: ${s.value}`, `stat-${i}`)}
              style={{ ...BTN, background: copied===`stat-${i}` ? GR : '#f0f2f5', color: copied===`stat-${i}` ? '#fff' : N, padding:'6px 12px', fontSize:11 }}>
              {copied===`stat-${i}` ? '✓' : ''} {s.label}: <strong>{s.value}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* Value Props */}
      <div>
        <div style={{ fontSize:13, fontWeight:900, color:N, marginBottom:8 }}>
          Value Propositions
          {lead.painPoint && <span style={{ marginLeft:8, fontSize:11, background:`${G}22`, color:AM, padding:'2px 8px', borderRadius:3 }}>
            {lead.painPoint}-matched prop highlighted
          </span>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {intel.valueProps?.map((vp, i) => {
            const highlighted = isHighlighted(vp.title);
            const isOpen = expanded === i;
            return (
              <div key={i} style={{ ...CARD, border: highlighted ? `2px solid ${G}` : '1px solid #eee', padding:0, overflow:'hidden' }}>
                <div
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{ padding:'12px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, background: highlighted ? '#fffdf0' : '#fff' }}>
                  <div style={{ flex:1 }}>
                    {highlighted && (
                      <div style={{ fontSize:9, fontWeight:900, color:G, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>
                        Recommended for {lead.painPoint}
                      </div>
                    )}
                    <div style={{ fontSize:fs, fontWeight:800, color:N, lineHeight:1.4 }}>{vp.title}</div>
                    <div style={{ fontSize:11, color:T, marginTop:4, fontWeight:700 }}>{vp.stat}</div>
                  </div>
                  <span style={{ color:'#bbb', fontSize:16, flexShrink:0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding:'0 16px 14px', borderTop:'1px solid #eee' }}>
                    <div style={{ fontSize:fs, lineHeight:1.75, color:'#444', marginBottom:12, marginTop:12 }}>{vp.body}</div>
                    <CopyBtn text={`${vp.title}\n\n${vp.body}\n\nKey stat: ${vp.stat}`} id={`vp-${i}`} copied={copied} onCopy={copy} label="Copy Script" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Objections
// ─────────────────────────────────────────────────────────────────────────────
const ObjectionsSection = ({ intel, live }) => {
  const [copied, copy] = useCopy();
  const [expanded, setExpanded] = useState(null);
  const fs = live ? 14 : 13;

  if (!intel?.objections?.length) return <div style={{ color:'#aaa' }}>No objection data for this segment.</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>
        {intel.objections.length} objection responses for {intel.label} segment. Expand to read + copy.
      </div>
      {intel.objections.map((obj, i) => {
        const isOpen = expanded === i;
        return (
          <div key={i} style={{ ...CARD, border:'1px solid #eee', padding:0, overflow:'hidden' }}>
            <div onClick={() => setExpanded(isOpen ? null : i)}
              style={{ padding:'12px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8f9fa' }}>
              <div style={{ fontSize:fs, fontWeight:800, color:R }}>{obj.q}</div>
              <span style={{ color:'#bbb', fontSize:16 }}>{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div style={{ padding:'12px 16px', borderTop:'1px solid #eee' }}>
                <div style={{ fontSize:fs, lineHeight:1.75, color:'#333', marginBottom:12 }}>{obj.a}</div>
                <CopyBtn text={`Q: ${obj.q}\n\nA: ${obj.a}`} id={`obj-${i}`} copied={copied} onCopy={copy} label="Copy Response" />
              </div>
            )}
          </div>
        );
      })}

      {/* Universal trust objection */}
      <div style={{ ...CARD, border:'1px solid #ddd', padding:0, overflow:'hidden', marginTop:8 }}>
        <div style={{ background:'#f0f2f5', padding:'10px 16px', fontSize:12, fontWeight:900, color:N }}>Universal: "Have you done this before?"</div>
        <div style={{ padding:'12px 16px' }}>
          <div style={{ fontSize:fs, lineHeight:1.75, color:'#333', marginBottom:10 }}>
            Option A: "Honestly, we're early stage — we don't have 20 completed projects to show you. What we do have is a rigorous process: independent analysis, structured assumptions, and no equipment bias. The feasibility study I'm proposing protects you whether you hire us or someone else."
          </div>
          <div style={{ fontSize:fs, lineHeight:1.75, color:'#333', marginBottom:12 }}>
            Option B (redirect to process): "I'll be transparent — we're building our first client base. What I can show you is the methodology. If the analysis is rigorous, you'll see it in the work. Want to look at a sample?"
          </div>
          <CopyBtn text={`"Have you done this before?" Response:\n\nOption A: Honestly, we're early stage — we don't have 20 completed projects to show you. What we do have is a rigorous process: independent analysis, structured assumptions, and no equipment bias. The feasibility study I'm proposing protects you whether you hire us or someone else.\n\nOption B: I'll be transparent — we're building our first client base. What I can show you is the methodology. If the analysis is rigorous, you'll see it in the work. Want to look at a sample?`} id="trust_obj" copied={copied} onCopy={copy} label="Copy Both Options" />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Follow-Ups
// ─────────────────────────────────────────────────────────────────────────────
const FollowUpSection = ({ lead, live }) => {
  const [copied, copy] = useCopy();
  const fs = live ? 14 : 13;

  const items = [
    { id:'d2',  day:'Day 2', note:'After first contact / no response. Casual, zero pressure.', text: buildFollowUp(lead, 2) },
    { id:'d5',  day:'Day 5', note:'After cold lead or post-call no commitment. Restate value differently.', text: buildFollowUp(lead, 5) },
    { id:'d10', day:'Day 10', note:'Final follow-up. Close the loop gracefully.', text: buildFollowUp(lead, 10) },
    { id:'post', day:'Post-Call (same day)', note:'Send immediately after a positive call. Attach company profile + feasibility offer doc.',
      text: `أهلاً ${lead.contactPerson || '[الاسم]'}، شكراً على وقتك النهارده.\n\nزي ما اتكلمنا، بعتلك:\n١. ملف تعريفي عن الشركة\n٢. تفاصيل دراسة الجدوى — ${feasFee(lead.systemSizeKW)} لمنشأة بحجمكم\n\nلما تبعتلي الفواتير، هبدأ التحليل وهيجهز في ٥–٧ أيام عمل.\n\nأي سؤال أنا موجود.` },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:12, color:'#888' }}>All messages personalized to {lead.orgName}. Copy and send via WhatsApp.</div>
      {items.map(it => (
        <div key={it.id} style={{ ...CARD, padding:0, overflow:'hidden' }}>
          <div style={{ background:'#f8f9fa', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee' }}>
            <div>
              <span style={{ fontSize:fs, fontWeight:800, color:N }}>{it.day}</span>
              <span style={{ fontSize:11, color:'#888', marginLeft:10 }}>{it.note}</span>
            </div>
            <CopyBtn text={it.text} id={it.id} copied={copied} onCopy={copy} />
          </div>
          <pre style={{ margin:0, padding:'12px 16px', fontSize:fs, lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'inherit', color:'#333', direction:'rtl' }}>
            {it.text}
          </pre>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION: Key Docs
// ─────────────────────────────────────────────────────────────────────────────
const KeyDocsSection = ({ lead }) => {
  const [invMilestone, setInvMilestone] = useState(0);

  const feeStr  = feasFee(lead.systemSizeKW);
  const sv      = lead.stageData?.site_visit_completed || {};
  const ps      = lead.stageData?.proposal_sent || {};
  const fd      = lead.stageData?.feasibility_delivered || {};
  const svAppt  = lead.stageData?.site_visit_scheduled || {};
  const fp      = lead.stageData?.feasibility_proposed || {};
  const fsold   = lead.stageData?.feasibility_sold || {};
  const wonD    = lead.stageData?.won || {};
  const qual    = lead.stageData?.qualified || {};

  // WATTIQ brand tokens
  const WQ = {
    oxide:'#0F1410', slate:'#2A322C', volt:'#D4FF3D', bone:'#EFEEE9', ink:'#0A0D0B', muted:'#6E7771',
    fonts:`'IBM Plex Sans','Segoe UI',Arial,sans-serif`,
    mono:`'IBM Plex Mono','Courier New',monospace`,
    gf:`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">`,
  };

  const docHeader = (title, rightHtml) => `
    <div style="background:${WQ.oxide};padding:26px 36px 20px;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:3px;">
          <span style="font-family:${WQ.fonts};font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">WATTIQ</span>
          <span style="font-family:'IBM Plex Sans Arabic',sans-serif;font-size:15px;font-weight:500;color:${WQ.volt};">واتيك</span>
        </div>
        <div style="font-family:${WQ.mono};font-size:9px;color:${WQ.muted};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:14px;">SYSTEMS · EPC · O&amp;M</div>
        <div style="background:${WQ.volt};display:inline-block;padding:2px 0;margin-bottom:4px;width:28px;"></div>
        <div style="font-family:${WQ.fonts};font-size:17px;font-weight:600;color:#fff;margin-top:5px;">${title}</div>
      </div>
      <div style="text-align:right;">${rightHtml}</div>
    </div>`;

  const openDoc = (html) => {
    const w = window.open('', '_blank', 'width=920,height=780');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  // ── Shared CSS + wrapper for new docs ──────────────────────────────────────
  const kWpNum    = parseFloat(lead.systemSizeKW) || parseFloat(lead.stageData?.contacted?.roughSizeKwp) || 0;
  const feeNumEGP = kWpNum > 0 && kWpNum <= 100 ? 3500 : kWpNum > 100 && kWpNum <= 300 ? 6000 : kWpNum > 300 ? 9000 : 3500;

  const MS_DEF = {
    '30/30/30/10': [{p:30,l:'Contract signature &amp; mobilisation advance'},{p:30,l:'Equipment delivery to site'},{p:30,l:'Mechanical &amp; electrical completion'},{p:10,l:'Grid connection, commissioning &amp; handover'}],
    '40/40/20':   [{p:40,l:'Contract signature &amp; mobilisation advance'},{p:40,l:'Equipment delivery to site'},{p:20,l:'Commissioning &amp; handover'}],
    '50/50':      [{p:50,l:'Contract signature &amp; mobilisation advance'},{p:50,l:'Commissioning &amp; handover'}],
  };
  const DEFAULT_MS = [{p:20,l:'Contract signature &amp; mobilisation advance'},{p:30,l:'Equipment delivery to site'},{p:30,l:'Mechanical &amp; electrical completion'},{p:15,l:'Grid connection &amp; commissioning'},{p:5,l:'Retention (12-month defects period)'}];
  const getMilestones = () => MS_DEF[ps.paymentTerms] || DEFAULT_MS;

  const chk = (label) => `<tr><td style="padding:7px 12px;border-bottom:1px solid #eeeee6;font-size:12.5px;">${label}</td><td style="width:50px;padding:7px 12px;border-bottom:1px solid #eeeee6;text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>`;

  const bCss = (x = '') => `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${WQ.fonts};background:${WQ.bone};color:${WQ.ink};font-size:13px;line-height:1.65}.page{background:#fff;max-width:760px;margin:0 auto;min-height:100vh}h2{font-size:9.5px;font-family:${WQ.mono};letter-spacing:0.14em;text-transform:uppercase;color:${WQ.muted};margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #e0e0d8}p{margin-bottom:9px;color:#2a2a22}ul,ol{padding-left:18px;margin-bottom:9px}li{margin-bottom:4px;color:#2a2a22}table{width:100%;border-collapse:collapse;margin-bottom:10px}td,th{padding:8px 12px;border-bottom:1px solid #eeeee6;font-size:12.5px}th{font-family:${WQ.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};font-weight:500;background:#faf9f4;border-bottom:2px solid ${WQ.oxide}}.volt-bar{height:3px;background:${WQ.volt}}.bp{padding:22px 36px 30px}.cl{background:#fafaf7;border:1px solid #ddddd5;padding:10px 15px;margin:7px 0;font-size:12px;color:#3a3a30}.cl strong{color:${WQ.oxide}}.meta{font-family:${WQ.mono};font-size:9.5px;color:${WQ.muted};letter-spacing:0.1em;text-transform:uppercase}.ft{background:${WQ.oxide};padding:13px 36px;display:flex;justify-content:space-between;align-items:center}.ft .r{color:#fff;font-size:12px;font-weight:500;text-align:right}.sig{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:26px;padding-top:16px;border-top:1px solid #ddddd5}.sig-line{border-bottom:1px solid #888;height:28px;margin-bottom:5px}.sig-lbl{font-size:10.5px;color:${WQ.muted}}.tr-total td{font-weight:700;background:#f4f4ee}@media print{.page{max-width:none}body{background:#fff}}${x}</style>`;

  const wrapDoc = (title, rh, body, x = '') =>
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WATTIQ — ${title}</title>${WQ.gf}${bCss(x)}</head><body><div class="page">${docHeader(title, rh)}<div class="volt-bar"></div><div class="bp">${body}</div><div class="ft"><div><span class="meta">WATTIQ Systems · EPC · O&amp;M</span><br><span class="meta">14 Sherif St · Downtown Cairo · wattiq.eg</span></div><div class="r">[Your Name] · [Phone/WhatsApp]<br>[email]@wattiq.eg</div></div></div></body></html>`;

  // ── 1. Company Profile ──────────────────────────────────────────────────────
  const printCompanyProfile = () => {
    const today = todayStr();
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WATTIQ — Company Profile</title>${WQ.gf}
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${WQ.fonts};background:${WQ.bone};color:${WQ.ink};font-size:13.5px;line-height:1.65}.page{background:#fff;max-width:760px;margin:0 auto;min-height:100vh}h2{font-size:9.5px;font-family:${WQ.mono};letter-spacing:0.14em;text-transform:uppercase;color:${WQ.muted};margin:26px 0 9px;padding-bottom:5px;border-bottom:1px solid #e0e0d8}p{margin-bottom:10px;color:#2a2a22}ul{padding-left:18px;margin-bottom:10px}li{margin-bottom:5px;color:#2a2a22}table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{padding:9px 12px;border-bottom:1px solid #eeeee6;font-size:13px}th{font-family:${WQ.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};font-weight:500;background:#faf9f4;border-bottom:2px solid ${WQ.oxide}}.volt-bar{height:3px;background:${WQ.volt}}.bp{padding:26px 36px 36px}.two{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:14px}.tag{display:inline-block;background:${WQ.oxide};color:${WQ.volt};font-family:${WQ.mono};font-size:8px;letter-spacing:0.12em;text-transform:uppercase;padding:2px 7px;margin-bottom:3px}.meta{font-family:${WQ.mono};font-size:9.5px;color:${WQ.muted};letter-spacing:0.1em;text-transform:uppercase}.ft{background:${WQ.oxide};padding:14px 36px;display:flex;justify-content:space-between;align-items:center}.ft .r{color:#fff;font-size:12px;font-weight:500;text-align:right}@media print{.page{max-width:none}body{background:#fff}}</style></head>
<body><div class="page">
${docHeader('Company Profile',`<div class="meta" style="margin-bottom:3px;">Cairo · Egypt · est. 2024</div><div style="color:rgba(255,255,255,.5);font-size:12px;margin-top:4px;">Engineered solar infrastructure.</div><div class="meta" style="margin-top:9px;">${today}</div>`)}
<div class="volt-bar"></div><div class="bp">
<h2>What We Do</h2>
<p>WATTIQ delivers utility-scale and commercial solar plants across Egypt — from feasibility studies and grid-connection design through procurement, EPC execution, and long-term O&amp;M. Engineering-led, independent of any equipment supplier, with transparent assumptions in every engagement.</p>
<h2>Segments We Serve</h2>
<div class="two">
<div><div class="tag">Industrial</div><p style="margin-top:7px;font-size:13px;">Factories and manufacturing (50 kWp – 5 MWp). Load-shift at EGP 2.34/kWh industrial tariff.</p></div>
<div><div class="tag">Agricultural</div><p style="margin-top:7px;font-size:13px;">Irrigation, cold stores, agri-processing. Diesel displacement; EGP 2.00/kWh tariff.</p></div>
<div><div class="tag">Commercial &amp; Institutional</div><p style="margin-top:7px;font-size:13px;">Malls, schools, universities, offices. Strong daytime-load match; EGP 2.33/kWh tariff.</p></div>
<div><div class="tag">Government &amp; Utility</div><p style="margin-top:7px;font-size:13px;">NREA and governorate tenders. Qualified EPC contractor under Egyptian construction law.</p></div>
</div>
<h2>Engagement Process</h2>
<table><thead><tr><th>#</th><th>Stage</th><th>Deliverable</th><th>Cost</th></tr></thead><tbody>
<tr><td><strong>01</strong></td><td>Bill Audit &amp; Scoping</td><td>Load profile, tariff category, indicative system size</td><td>No charge</td></tr>
<tr><td><strong>02</strong></td><td>Site Visit</td><td>Roof/ground assessment, shading, grid connection, go/no-go verdict</td><td>No charge</td></tr>
<tr><td><strong>03</strong></td><td>Feasibility Study</td><td>PVsyst sizing, 25-year financial model, assumptions register, recommendation</td><td>EGP 3,500 – 12,000</td></tr>
<tr><td><strong>04</strong></td><td>EPC Proposal</td><td>Fixed-price proposal with FX clause, milestones, warranty. Honest no-go if numbers don't justify.</td><td>Included</td></tr>
<tr><td><strong>05</strong></td><td>EPC Execution</td><td>Design, procurement, installation, commissioning, grid connection</td><td>Per contract</td></tr>
<tr><td><strong>06</strong></td><td>O&amp;M</td><td>Monitoring, preventive maintenance, inverter fault response — 25-year horizon</td><td>Per agreement</td></tr>
</tbody></table>
<h2>Why the Tariff Window Matters Now</h2>
<p>Egypt's electricity tariffs reached <strong>EGP 2.34/kWh</strong> for industrial consumers (EgyptERA, September 2024), up from EGP 0.80/kWh in 2016. Under the ongoing IMF adjustment programme, further phased increases are expected through 2026–2027. Solar locked in today hedges 70–85% of electricity consumption cost for 25 years.</p>
<h2>Our Commitments</h2>
<ul>
<li><strong>Engineering-first:</strong> We recommend a no-go when the numbers do not support it.</li>
<li><strong>Independent:</strong> Not tied to any panel manufacturer, inverter brand, or EPC subcontractor.</li>
<li><strong>Transparent assumptions:</strong> Every study states its irradiance source, degradation assumption, and sensitivity range.</li>
<li><strong>Fixed scope, fixed price:</strong> Proposals priced at contract value — no contingency hidden in the fee.</li>
</ul>
</div>
<div class="ft"><div><span class="meta">WATTIQ Systems · EPC · O&amp;M</span><br><span class="meta">14 Sherif St · Downtown Cairo</span></div><div class="r">[Your Name] · [Phone/WhatsApp]<br>[email]@wattiq.eg · wattiq.eg</div></div>
</div></body></html>`;
    openDoc(html);
  };

  // ── 2. Feasibility Study Offer ──────────────────────────────────────────────
  const printFeasOffer = () => {
    const today    = todayStr();
    const validDt  = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    const kWpEst   = lead.systemSizeKW || lead.stageData?.contacted?.roughSizeKwp || '';
    const feeApply = kWpEst ? feeStr : 'EGP 3,500 – 12,000';
    const rows = [
      { r:'Up to 100 kWp', f:'EGP 3,500', m: !kWpEst || parseFloat(kWpEst)<=100 },
      { r:'100 – 300 kWp',  f:'EGP 6,000', m: parseFloat(kWpEst)>100 && parseFloat(kWpEst)<=300 },
      { r:'300 kWp +', f:'EGP 9,000 – 12,000', m: parseFloat(kWpEst)>300 },
    ];
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WATTIQ — Feasibility Study Offer</title>${WQ.gf}
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${WQ.fonts};background:${WQ.bone};color:${WQ.ink};font-size:13.5px;line-height:1.65}.page{background:#fff;max-width:760px;margin:0 auto;min-height:100vh}h2{font-size:9.5px;font-family:${WQ.mono};letter-spacing:0.14em;text-transform:uppercase;color:${WQ.muted};margin:24px 0 8px;padding-bottom:5px;border-bottom:1px solid #e0e0d8}p{margin-bottom:10px;color:#2a2a22}ol,ul{padding-left:20px;margin-bottom:10px}li{margin-bottom:4px;color:#2a2a22}table{width:100%;border-collapse:collapse;margin-bottom:10px}td,th{padding:8px 12px;border-bottom:1px solid #eeeee6;font-size:13px}th{font-family:${WQ.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};font-weight:500;background:#faf9f4;border-bottom:2px solid ${WQ.oxide}}.volt-bar{height:3px;background:${WQ.volt}}.bp{padding:24px 36px 32px}.hl{background:#f7f9ee;border-left:3px solid ${WQ.volt};padding:11px 15px;margin:10px 0;font-size:13px}.cl{background:#fafaf7;border:1px solid #ddddd5;padding:11px 15px;margin:7px 0;font-size:12.5px;color:#3a3a30}.cl strong{color:${WQ.oxide}}.meta{font-family:${WQ.mono};font-size:9.5px;color:${WQ.muted};letter-spacing:0.1em;text-transform:uppercase}.ft{background:${WQ.oxide};padding:14px 36px;display:flex;justify-content:space-between;align-items:center}.ft .r{color:#fff;font-size:12px;font-weight:500;text-align:right}.sig{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:28px;padding-top:18px;border-top:1px solid #ddddd5}.sig-line{border-bottom:1px solid #888;height:30px;margin-bottom:5px}.sig-lbl{font-size:11px;color:${WQ.muted}}@media print{.page{max-width:none}body{background:#fff}}</style></head>
<body><div class="page">
${docHeader('Feasibility Study Offer',`<div class="meta" style="margin-bottom:3px;">Prepared for</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div>${lead.contactPerson?`<div style="color:rgba(255,255,255,.5);font-size:12px;">Attn: ${lead.contactPerson}${lead.contactRole?' · '+lead.contactRole:''}</div>`:''}<div class="meta" style="margin-top:9px;">Issued ${today} · Valid until ${validDt}</div>`)}
<div class="volt-bar"></div><div class="bp">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
<span class="meta">Ref · WATTIQ-FS-${today.replace(/-/g,'')}-${lead.id||'001'}</span>
${kWpEst?`<span style="background:${WQ.oxide};color:${WQ.volt};font-family:${WQ.mono};font-size:10px;letter-spacing:0.1em;padding:3px 9px;">EST. ${kWpEst} kWp · ${feeStr}</span>`:''}
</div>
<h2>What Is Included</h2>
<ol>
<li><strong>Energy Audit Summary</strong> — bill analysis, tariff category, load profile reconstruction</li>
<li><strong>Site Data Integration</strong> — GPS irradiance (PVGIS / Meteonorm), shading analysis from site visit findings</li>
<li><strong>System Sizing</strong> — PVsyst-modelled kWp, module count, inverter selection, specific yield (kWh/kWp)</li>
<li><strong>25-Year Financial Model</strong> — Year-by-year savings (EGP), simple payback, NPV, IRR, sensitivity table (±15% tariff, ±10% yield)</li>
<li><strong>Assumptions Register</strong> — every assumption cited: irradiance source, degradation rate (0.5%/yr), availability, PR target, tariff escalation scenario</li>
<li><strong>Recommendation</strong> — explicit go / no-go with rationale and indicative EPC cost range</li>
</ol>
<h2>Scope Exclusions</h2>
<ul>
<li>Structural engineering opinion on roof load capacity</li>
<li>Grid connection design or protection relay studies</li>
<li>Net metering registration with DISCO or EgyptERA</li>
<li>Permit applications (NREA, building, municipality)</li>
<li>Detailed equipment BOQ or procurement specifications</li>
</ul>
<h2>Study Fee</h2>
<table><thead><tr><th>System Size</th><th>Study Fee (EGP)</th><th></th></tr></thead><tbody>
${rows.map(r=>`<tr${r.m&&kWpEst?' style="background:#f7f9ee;"':''}><td>${r.r}</td><td><strong>${r.f}</strong></td><td>${r.m&&kWpEst?`<span style="font-family:${WQ.mono};font-size:8px;letter-spacing:0.12em;background:${WQ.oxide};color:${WQ.volt};padding:2px 7px;">APPLIES</span>`:''}</td></tr>`).join('')}
</tbody></table>
<div class="hl">The study fee is credited in full against WATTIQ's advisory fee if the client proceeds to an EPC engagement. If not, the fee funds a rigorous independent assessment — protecting a significantly larger capital decision from an unvalidated vendor estimate.</div>
<h2>Delivery &amp; Payment</h2>
<table><thead><tr><th>Item</th><th>Detail</th></tr></thead><tbody>
<tr><td>Format</td><td>PDF report, 14–20 pages, WATTIQ letterhead</td></tr>
<tr><td>Timeline</td><td>5–7 working days from receipt of 3 months' utility bills and site visit completion</td></tr>
<tr><td>Payment</td><td>50% upfront (study commencement); 50% on report delivery</td></tr>
<tr><td>Revisions</td><td>One round of clarification questions included; additional revisions at EGP 500/hour</td></tr>
</tbody></table>
<h2>Service Terms</h2>
<div class="cl"><strong>Data Confidentiality:</strong> All information provided by the client (utility bills, load data, business information) will be used solely for this engagement and will not be disclosed to any third party without written consent.</div>
<div class="cl"><strong>IP Ownership:</strong> Upon receipt of full payment, the feasibility report and all supporting models become the exclusive property of the client. WATTIQ retains the right to cite aggregate project metrics (system size, yield) in anonymised portfolio references only.</div>
<div class="cl"><strong>Limitation of Liability:</strong> The feasibility study is an advisory document based on client-provided data and publicly available irradiance records. It does not constitute a performance guarantee. WATTIQ's liability is limited to the study fee paid. Actual system performance will vary depending on installed equipment, workmanship, and operating conditions.</div>
<div class="cl"><strong>Refund Policy:</strong> The upfront payment is non-refundable once site analysis work has commenced. The balance is due upon delivery regardless of the recommendation outcome (go or no-go).</div>
<div class="cl"><strong>Validity:</strong> This offer is valid until <strong>${validDt}</strong>. Pricing may be revised after this date.</div>
<div class="cl"><strong>Governing Law:</strong> This agreement is governed by the laws of the Arab Republic of Egypt. Any dispute shall be referred to the competent courts of Cairo.</div>
<h2>How to Start</h2>
<ol>
<li>Confirm acceptance in writing (WhatsApp, email, or signature below)</li>
<li>Transfer 50% upfront fee to WATTIQ bank account (details on invoice)</li>
<li>Provide 3–6 months of utility bills (photo or PDF)</li>
<li>Confirm site visit date if not already conducted</li>
<li>Receive your report within 5–7 working days</li>
</ol>
<div class="sig">
<div><div class="meta" style="margin-bottom:7px;">Accepted by client</div><div class="sig-line"></div><div class="sig-lbl">Name &amp; title · Date</div></div>
<div><div class="meta" style="margin-bottom:7px;">Authorised — WATTIQ</div><div class="sig-line"></div><div class="sig-lbl">[Name] · Commercial Director · Date</div></div>
</div>
</div>
<div class="ft"><div><span class="meta">WATTIQ Systems · EPC · O&amp;M</span><br><span class="meta">14 Sherif St · Downtown Cairo · wattiq.eg</span></div><div class="r">[Your Name] · [Phone/WhatsApp]<br>[email]@wattiq.eg</div></div>
</div></body></html>`;
    openDoc(html);
  };

  // ── 3. Site Visit Technical Report ─────────────────────────────────────────
  const printSiteVisitReport = () => {
    const today = todayStr();
    const shadingColor = { None:'#1E7E34', Low:'#1E7E34', Medium:'#856404', High:'#C0392B' }[sv.shadingRisk] || '#555';
    let verdict = 'FURTHER INVESTIGATION REQUIRED'; let verdictColor = '#856404';
    if (sv.shadingRisk === 'High') { verdict = 'NO-GO — SHADING NOT VIABLE'; verdictColor = '#C0392B'; }
    else if (sv.shadingRisk && sv.shadingRisk !== 'High' && sv.recommendedSizeKwp > 0) { verdict = 'GO — TECHNICAL FEASIBILITY CONFIRMED'; verdictColor = '#1E7E34'; }
    const refDate = (sv.visitDate || svAppt.scheduledDate || today).replace(/-/g,'');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WATTIQ — Site Visit Report</title>${WQ.gf}
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${WQ.fonts};background:${WQ.bone};color:${WQ.ink};font-size:13px;line-height:1.6}.page{background:#fff;max-width:760px;margin:0 auto;min-height:100vh}h2{font-size:9.5px;font-family:${WQ.mono};letter-spacing:0.14em;text-transform:uppercase;color:${WQ.muted};margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #e0e0d8}table{width:100%;border-collapse:collapse;margin-bottom:10px}td,th{padding:8px 12px;border-bottom:1px solid #eeeee6;font-size:12.5px}td:first-child{font-family:${WQ.mono};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${WQ.muted};width:190px}th{font-family:${WQ.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};font-weight:500;background:#faf9f4;border-bottom:2px solid ${WQ.oxide}}.volt-bar{height:3px;background:${WQ.volt}}.bp{padding:22px 36px 30px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.kpi{background:#faf9f4;border:1px solid #e8e8e0;padding:9px 12px;text-align:center}.kv{font-size:19px;font-weight:700;color:${WQ.oxide}}.kl{font-family:${WQ.mono};font-size:8px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};margin-top:2px}.verd{border:2px solid;padding:14px 18px;margin:16px 0;text-align:center}.meta{font-family:${WQ.mono};font-size:9.5px;color:${WQ.muted};letter-spacing:0.1em;text-transform:uppercase}.note{min-height:52px;border:1px solid #e0e0d8;padding:10px 13px;font-size:12.5px}.disc{margin-top:14px;padding:9px 13px;background:#faf9f4;border-left:2px solid ${WQ.volt};font-size:11.5px;color:${WQ.muted}}.sig{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:26px;padding-top:16px;border-top:1px solid #ddddd5}.sig-line{border-bottom:1px solid #888;height:28px;margin-bottom:5px}.sig-lbl{font-size:10.5px;color:${WQ.muted}}.ft{background:${WQ.oxide};padding:13px 36px;display:flex;justify-content:space-between;align-items:center}.ft .r{color:#fff;font-size:12px;font-weight:500;text-align:right}@media print{.page{max-width:none}body{background:#fff}}</style></head>
<body><div class="page">
${docHeader('Site Visit Technical Report',`<div class="meta" style="margin-bottom:3px;">Client</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div>${lead.contactPerson?`<div style="color:rgba(255,255,255,.5);font-size:12px;">Attn: ${lead.contactPerson}</div>`:''}<div class="meta" style="margin-top:9px;">Ref · WATTIQ-SV-${refDate}-${lead.id||'001'}</div>`)}
<div class="volt-bar"></div><div class="bp">
<h2>Visit Details</h2>
<table><tbody>
<tr><td>Visit Date</td><td>${sv.visitDate||svAppt.scheduledDate||'—'}</td></tr>
<tr><td>Site Address</td><td>${svAppt.siteAddress||lead.address||'—'}</td></tr>
<tr><td>GPS Coordinates</td><td>${sv.gpsCoords||'—'}</td></tr>
<tr><td>On-site Contact</td><td>${sv.facilitiesContactName||svAppt.onSiteContactName||'—'}${(sv.facilitiesContactPhone||svAppt.onSiteContactPhone)?' · '+(sv.facilitiesContactPhone||svAppt.onSiteContactPhone):''}</td></tr>
<tr><td>Photos Taken</td><td>${sv.photoCount?sv.photoCount+' photos':'—'}</td></tr>
<tr><td>WATTIQ Engineer</td><td>[Engineer Name]</td></tr>
<tr><td>Report Issued</td><td>${today}</td></tr>
</tbody></table>
<h2>Physical Site Assessment</h2>
<table><tbody>
<tr><td>Roof / Mount Type</td><td>${sv.roofType||'—'}</td></tr>
<tr><td>Total Roof Area</td><td>${sv.totalRoofAreaM2?sv.totalRoofAreaM2+' m²':'—'}</td></tr>
<tr><td>Usable Area</td><td>${sv.usableAreaM2?sv.usableAreaM2+' m²':'—'}</td></tr>
<tr><td>Azimuth</td><td>${sv.azimuthDeg!=null&&sv.azimuthDeg!==''?sv.azimuthDeg+'° (0° = True North)':'—'}</td></tr>
<tr><td>Tilt</td><td>${sv.tiltDeg!=null&&sv.tiltDeg!==''?sv.tiltDeg+'°':'—'}</td></tr>
<tr><td>Shading Risk</td><td><strong style="color:${shadingColor}">${sv.shadingRisk||'—'}</strong></td></tr>
${sv.shadingNotes?`<tr><td>Shading Notes</td><td>${sv.shadingNotes}</td></tr>`:''}
</tbody></table>
<h2>Electrical Infrastructure</h2>
<table><tbody>
<tr><td>Grid Phase</td><td>${sv.gridPhaseConfirmed||'—'}</td></tr>
<tr><td>Main Breaker</td><td>${sv.mainBreakerAmps?sv.mainBreakerAmps+' A':'—'}</td></tr>
<tr><td>DB Panel Brand</td><td>${sv.dbPanelBrand||'—'}</td></tr>
<tr><td>DISCO</td><td>${sv.disco||'—'}</td></tr>
<tr><td>Feeder Voltage</td><td>${sv.feederVoltage||'—'}</td></tr>
<tr><td>Net Metering Eligible</td><td>${sv.netMeteringEligible===true?'YES':sv.netMeteringEligible===false?'NO':'—'}</td></tr>
${sv.netMeteringNotes?`<tr><td>Net Metering Notes</td><td>${sv.netMeteringNotes}</td></tr>`:''}
<tr><td>Avg Monthly Consumption</td><td>${sv.avgMonthlyKwh?Number(sv.avgMonthlyKwh).toLocaleString()+' kWh/month':'—'}</td></tr>
<tr><td>Peak Demand</td><td>${sv.peakDemandKva?sv.peakDemandKva+' kVA':'—'}</td></tr>
<tr><td>Operating Profile</td><td>${sv.operatingProfile||'—'}</td></tr>
</tbody></table>
${sv.recommendedSizeKwp?`<h2>System Recommendation</h2><div class="kpis">
<div class="kpi"><div class="kv">${sv.recommendedSizeKwp}</div><div class="kl">kWp Recommended</div></div>
<div class="kpi"><div class="kv">${sv.estimatedPanelCount||'—'}</div><div class="kl">Panels (est.)</div></div>
<div class="kpi"><div class="kv">${sv.estimatedAnnualYieldKwh?(Number(sv.estimatedAnnualYieldKwh)/1000).toFixed(0)+'k':'—'}</div><div class="kl">kWh/year yield</div></div>
<div class="kpi"><div class="kv">${sv.roughPaybackYears?sv.roughPaybackYears+'yr':'—'}</div><div class="kl">Rough payback</div></div>
</div>${sv.estimatedAnnualSavingsEGP?`<p style="font-size:13px;margin-bottom:10px;">Estimated annual savings: <strong>EGP ${Number(sv.estimatedAnnualSavingsEGP).toLocaleString()}</strong> at current tariff. Final figures subject to feasibility study.</p>`:''}`:'' }
<h2>Verdict</h2>
<div class="verd" style="border-color:${verdictColor};"><div style="font-family:${WQ.mono};font-size:12px;font-weight:600;color:${verdictColor};letter-spacing:0.1em;">${verdict}</div>${sv.recommendedSizeKwp?`<div style="margin-top:5px;font-size:12px;color:#555;">Recommended system: ${sv.recommendedSizeKwp} kWp · Site technically suitable for solar installation.</div>`:''}</div>
<h2>Notes &amp; Constraints</h2>
<div class="note" style="color:${sv.shadingNotes||sv.netMeteringNotes?WQ.ink:WQ.muted};">
${sv.shadingNotes?`<p><strong>Shading:</strong> ${sv.shadingNotes}</p>`:''}
${sv.netMeteringNotes?`<p><strong>Net Metering:</strong> ${sv.netMeteringNotes}</p>`:''}
${!sv.shadingNotes&&!sv.netMeteringNotes?'<span style="font-style:italic;">No constraints noted during visit.</span>':''}
</div>
<div class="sig">
<div><div class="meta" style="margin-bottom:6px;">Client acknowledgment</div><div class="sig-line"></div><div class="sig-lbl">${svAppt.onSiteContactName||lead.contactPerson||'Name'} · Date</div></div>
<div><div class="meta" style="margin-bottom:6px;">Prepared by — WATTIQ Engineering</div><div class="sig-line"></div><div class="sig-lbl">[Engineer Name] · Site Engineer · Date</div></div>
</div>
<div class="disc"><span class="meta">Disclaimer: </span>This site visit report is a preliminary technical assessment based on visual inspection and client-provided data. WATTIQ assumes no liability for structural conditions not visible during the visit. Full technical designs are produced at feasibility and EPC stages only.</div>
</div>
<div class="ft"><div><span class="meta">WATTIQ Systems · EPC · O&amp;M</span><br><span class="meta">14 Sherif St · Downtown Cairo · wattiq.eg</span></div><div class="r">[Engineer Name] · [Phone]<br>[email]@wattiq.eg</div></div>
</div></body></html>`;
    openDoc(html);
  };

  // ── 4. EPC Proposal ─────────────────────────────────────────────────────────
  const printEPCProposal = () => {
    const issueDate   = ps.sentDate || todayStr();
    const validDt     = ps.validUntil || new Date(Date.now()+30*24*60*60*1000).toISOString().split('T')[0];
    const ref         = ps.proposalRef || `WATTIQ-EPC-${issueDate.replace(/-/g,'')}-${lead.id||'001'}`;
    const cv          = ps.contractValueEGP ? Number(ps.contractValueEGP) : 0;
    const finalSize   = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW || '';
    const panelBrand  = ps.panelBrand || fd.panelBrandModel || '';
    const invBrand    = ps.inverterBrand || fd.inverterBrandModel || '';
    const twks        = ps.timelineWeeks || '';
    const pmDef = {
      '30/30/30/10':[{p:30,l:'Contract signature &amp; mobilisation advance'},{p:30,l:'Equipment delivery to site'},{p:30,l:'Mechanical &amp; electrical completion'},{p:10,l:'Grid connection, commissioning &amp; handover'}],
      '40/40/20':  [{p:40,l:'Contract signature &amp; mobilisation advance'},{p:40,l:'Equipment delivery to site'},{p:20,l:'Commissioning &amp; handover'}],
      '50/50':     [{p:50,l:'Contract signature &amp; mobilisation advance'},{p:50,l:'Commissioning &amp; handover'}],
    };
    const ms = pmDef[ps.paymentTerms] || [{p:20,l:'Contract signature &amp; mobilisation advance'},{p:30,l:'Equipment delivery to site'},{p:30,l:'Mechanical &amp; electrical completion'},{p:15,l:'Grid connection &amp; commissioning'},{p:5,l:'Retention (12-month defects period)'}];
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>WATTIQ — EPC Proposal ${ref}</title>${WQ.gf}
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:${WQ.fonts};background:${WQ.bone};color:${WQ.ink};font-size:13px;line-height:1.65}.page{background:#fff;max-width:760px;margin:0 auto;min-height:100vh}h2{font-size:9.5px;font-family:${WQ.mono};letter-spacing:0.14em;text-transform:uppercase;color:${WQ.muted};margin:24px 0 8px;padding-bottom:5px;border-bottom:1px solid #e0e0d8}p{margin-bottom:9px;color:#2a2a22}ul,ol{padding-left:18px;margin-bottom:9px}li{margin-bottom:4px;color:#2a2a22}table{width:100%;border-collapse:collapse;margin-bottom:10px}td,th{padding:8px 12px;border-bottom:1px solid #eeeee6;font-size:12.5px}th{font-family:${WQ.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};font-weight:500;background:#faf9f4;border-bottom:2px solid ${WQ.oxide}}.volt-bar{height:3px;background:${WQ.volt}}.bp{padding:22px 36px 30px}.fx{background:#fff8e6;border-left:3px solid ${WQ.volt};padding:12px 16px;margin:10px 0;font-size:13px}.cl{background:#fafaf7;border:1px solid #ddddd5;padding:10px 15px;margin:7px 0;font-size:12px;color:#3a3a30}.cl strong{color:${WQ.oxide}}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}.kpi{background:#faf9f4;border:1px solid #e8e8e0;padding:9px 12px;text-align:center}.kv{font-size:18px;font-weight:700;color:${WQ.oxide}}.kl{font-family:${WQ.mono};font-size:8px;letter-spacing:0.12em;text-transform:uppercase;color:${WQ.muted};margin-top:2px}.tr-total td{font-weight:700;background:#f4f4ee;font-size:13px}.meta{font-family:${WQ.mono};font-size:9.5px;color:${WQ.muted};letter-spacing:0.1em;text-transform:uppercase}.sig{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:28px;padding-top:18px;border-top:2px solid ${WQ.oxide}}.sig-line{border-bottom:1px solid #888;height:28px;margin-bottom:5px}.sig-line2{border-bottom:1px solid #888;height:22px;margin-bottom:5px;margin-top:8px}.sig-lbl{font-size:10.5px;color:${WQ.muted}}.ft{background:${WQ.oxide};padding:13px 36px;display:flex;justify-content:space-between;align-items:center}.ft .r{color:#fff;font-size:12px;font-weight:500;text-align:right}@media print{.page{max-width:none}body{background:#fff}}</style></head>
<body><div class="page">
${docHeader('EPC Proposal',`<div class="meta" style="margin-bottom:3px;">Prepared for</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div>${lead.contactPerson?`<div style="color:rgba(255,255,255,.5);font-size:12px;">Attn: ${lead.contactPerson}${lead.contactRole?' · '+lead.contactRole:''}</div>`:''}<div class="meta" style="margin-top:9px;">Ref · ${ref}</div><div class="meta">Issued ${issueDate} · Valid until ${validDt}</div>`)}
<div class="volt-bar"></div><div class="bp">
<h2>Project Overview</h2>
<div class="kpis">
<div class="kpi"><div class="kv">${finalSize||'—'}</div><div class="kl">kWp DC</div></div>
<div class="kpi"><div class="kv">${cv>0?'EGP '+(cv/1e6).toFixed(2)+'M':'—'}</div><div class="kl">Contract Value</div></div>
<div class="kpi"><div class="kv">${twks?twks+' wks':'—'}</div><div class="kl">Timeline</div></div>
</div>
<table><tbody>
<tr><td class="meta">Client</td><td>${lead.orgName}</td></tr>
<tr><td class="meta">Site</td><td>${svAppt.siteAddress||lead.governorate||'—'}</td></tr>
<tr><td class="meta">System Size</td><td>${finalSize?finalSize+' kWp DC':'—'}</td></tr>
<tr><td class="meta">Panel Spec</td><td>${panelBrand||'—'} · ${ps.warrantyYearsPanels?ps.warrantyYearsPanels+'-yr warranty':'—'}</td></tr>
<tr><td class="meta">Inverter Spec</td><td>${invBrand||'—'} · ${ps.warrantyYearsInverter?ps.warrantyYearsInverter+'-yr warranty':'—'}</td></tr>
${fd.annualYieldKwh?`<tr><td class="meta">Annual Yield</td><td>${Number(fd.annualYieldKwh).toLocaleString()} kWh/yr (P90, PVsyst)</td></tr>`:''}
${fd.performanceRatioPct?`<tr><td class="meta">Performance Ratio</td><td>${fd.performanceRatioPct}%</td></tr>`:''}
${fd.simplePaybackYears?`<tr><td class="meta">Payback (feasibility)</td><td>${fd.simplePaybackYears} years</td></tr>`:''}
</tbody></table>
<h2>Payment Milestones</h2>
<table><thead><tr><th>#</th><th>Milestone</th><th>%</th><th>Amount (EGP)</th></tr></thead><tbody>
${ms.map((m,i)=>`<tr><td><strong>${String(i+1).padStart(2,'0')}</strong></td><td>${m.l}</td><td>${m.p}%</td><td>${cv>0?Math.round(cv*m.p/100).toLocaleString():'—'}</td></tr>`).join('')}
<tr class="tr-total"><td></td><td>Total Contract Value</td><td>100%</td><td>${cv>0?cv.toLocaleString():'—'}</td></tr>
</tbody></table>
<h2>Foreign Exchange (FX) Clause</h2>
<div class="fx">
<strong>Equipment Component (USD-referenced):</strong> Solar modules, inverters, racking, and other imported equipment are priced by reference to the USD/EGP rate published by the National Bank of Egypt (NBE) on the proposal date (<strong>${issueDate}</strong>). Should the NBE selling rate at the time of contract execution vary by more than <strong>five percent (5%)</strong> from the rate applicable on this date, WATTIQ reserves the right to revise the equipment-component line of the contract price accordingly, with a supporting NBE rate certificate provided to the client.<br><br>
<strong>Works Component (EGP-fixed):</strong> Civil works, electrical installation, commissioning, and all local labour are denominated in Egyptian Pounds and are not subject to FX adjustment. The works component represents approximately 25–35% of total contract value.<br><br>
<strong>Import Duties:</strong> In the event that Egyptian customs duties or import surcharges are introduced or materially increased on solar equipment after the proposal date, such costs will be passed through at actual invoiced cost with 30 days' written notice to the client.
</div>
<h2>Scope — Inclusions</h2>
<ul>
<li>Detailed engineering design: single-line diagram, string layout, protection scheme, as-built drawings</li>
<li>Equipment procurement and delivery to site (panels, inverters, racking, AC/DC cabling, monitoring system)</li>
<li>Mechanical installation: racking, module mounting, structure</li>
<li>Electrical installation: DC wiring, AC connection, earthing, surge protection, metering</li>
<li>Commissioning and performance verification test (PVT protocol)</li>
<li>Grid connection support: DISCO technical submission package (single-line, protection settings)</li>
<li>Client facilities team training: 2-hour handover session</li>
<li>24-month workmanship warranty from commercial operation date (COD)</li>
</ul>
<h2>Scope — Exclusions</h2>
<ul>
<li>Structural reinforcement of roof or mounting structure beyond standard solar loading</li>
<li>Civil works for access roads, security fencing, or perimeter lighting</li>
<li>DISCO upgrade costs (transformer, feeder reinforcement) if required for grid connection</li>
<li>Net metering registration fees and government permit applications</li>
<li>Import customs duties (see FX Clause above)</li>
<li>Battery energy storage (BESS) — available as separate scope item on request</li>
<li>O&amp;M services post-warranty — available under separate WATTIQ O&amp;M agreement</li>
</ul>
<h2>Warranty &amp; Performance</h2>
<div class="cl"><strong>Workmanship Warranty:</strong> 24 months from COD. WATTIQ will remedy any defects in installation workmanship at no cost to the client within this period. Response time: 48 hours for critical faults, 5 working days for non-critical.</div>
<div class="cl"><strong>Equipment Warranty (pass-through):</strong> WATTIQ assigns the full benefit of manufacturer warranties to the client: typically 10–12 years product warranty and 25-year linear performance guarantee on panels; ${ps.warrantyYearsInverter||'5–10'} years on inverters. Full documentation provided at handover.</div>
<div class="cl"><strong>Performance Guarantee:</strong> System design is based on P90 annual yield as modelled in PVsyst. WATTIQ warrants that the installed system will achieve no less than 90% of the modelled P90 yield in Year 1, subject to operating conditions consistent with the feasibility study assumptions.</div>
<h2>Project Timeline</h2>
<table><thead><tr><th>Week</th><th>Activity</th></tr></thead><tbody>
<tr><td>Week 1</td><td>Contract execution · deposit clearance · engineering kick-off</td></tr>
<tr><td>Weeks 2–3</td><td>Detailed design finalisation · DISCO submission package</td></tr>
<tr><td>Weeks 3–5</td><td>Equipment procurement &amp; logistics to site</td></tr>
<tr><td>Weeks 5–${twks?Math.max(parseInt(twks)-2,6):8}</td><td>Mechanical &amp; electrical installation</td></tr>
<tr><td>Week ${twks||10}</td><td>Commissioning · performance test · DISCO energisation · client handover</td></tr>
</tbody></table>
${twks?`<p style="font-size:12px;color:${WQ.muted};">Total: ${twks} weeks from deposit clearance. DISCO approval lead time and import logistics are outside WATTIQ's control and may extend this timeline.</p>`:''}
<h2>Contract Terms</h2>
<div class="cl"><strong>Governing Law:</strong> This proposal, and any contract arising from it, is governed by the laws of the Arab Republic of Egypt.</div>
<div class="cl"><strong>Dispute Resolution:</strong> Any dispute not resolved within 30 days of written notice shall be referred to the Cairo Regional Centre for International Commercial Arbitration (CRCICA), with proceedings in Arabic or English at the parties' election.</div>
<div class="cl"><strong>Escalation (Delayed Commencement):</strong> If the client fails to issue a notice to proceed within 60 days of contract execution, WATTIQ reserves the right to apply a works-component price escalation consistent with the official Egyptian CPI for the intervening period, with 14 days' written notice.</div>
<div class="cl"><strong>Force Majeure:</strong> Neither party shall be liable for delays caused by events beyond reasonable control, including currency controls, import restrictions, DISCO or utility authority delays, and force majeure events as defined under Egyptian Civil Code (Art. 215–216).</div>
<div class="cl"><strong>Proposal Validity:</strong> This proposal is valid until <strong>${validDt}</strong>. After this date, pricing is subject to revision.</div>
<div class="cl"><strong>Confidentiality:</strong> This proposal is submitted in confidence to ${lead.orgName} and may not be disclosed to third parties or used for competitive tender comparison without WATTIQ's written consent.</div>
<div class="sig">
<div><div class="meta" style="margin-bottom:6px;">Accepted by client — ${lead.orgName}</div><div class="sig-line"></div><div class="sig-line2"></div><div class="sig-lbl">Authorised signatory · Title · Date</div></div>
<div><div class="meta" style="margin-bottom:6px;">Authorised — WATTIQ Systems</div><div class="sig-line"></div><div class="sig-line2"></div><div class="sig-lbl">[Director Name] · Managing Director · Date</div></div>
</div>
</div>
<div class="ft"><div><span class="meta">WATTIQ Systems · EPC · O&amp;M · wattiq.eg</span><br><span class="meta">${ref}</span></div><div class="r">[Your Name] · [Phone/WhatsApp]<br>[email]@wattiq.eg</div></div>
</div></body></html>`;
    openDoc(html);
  };

  // ── 5. NDA ─────────────────────────────────────────────────────────────────
  const printNDA = () => {
    const today = todayStr();
    const expiry = new Date(Date.now() + 2*365*24*60*60*1000).toISOString().split('T')[0];
    const ref = `WATTIQ-NDA-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const body = `<div style="text-align:center;margin-bottom:18px;"><div class="meta" style="margin-bottom:4px;">Ref · ${ref}</div><div style="font-size:17px;font-weight:700;color:${WQ.oxide};">Non-Disclosure Agreement</div><div style="font-size:12px;color:${WQ.muted};margin-top:4px;">Mutual · 2-year term</div></div>
<p>This Non-Disclosure Agreement (<strong>"Agreement"</strong>) is entered into on <strong>${today}</strong> between:</p>
<div class="cl"><strong>Party A (WATTIQ):</strong> [GAFI-registered entity name] · 14 Sherif St, Downtown Cairo, Egypt</div>
<div class="cl"><strong>Party B (Client):</strong> ${lead.orgName}${lead.contactPerson?' · '+lead.contactPerson:''} · ${lead.governorate||'[Address]'}</div>
<h2>1. Purpose</h2>
<p>The Parties intend to explore a potential solar EPC engagement and may exchange confidential information including energy data, financial models, feasibility findings, and commercial strategies.</p>
<h2>2. Confidential Information</h2>
<p>Any information disclosed by a Party that is marked confidential or would reasonably be understood as such: utility bills, load profiles, financial models, feasibility study findings, proposal pricing, technical specifications, and business plans.</p>
<h2>3. Obligations</h2>
<ul>
<li>Use Confidential Information solely for the Purpose above.</li>
<li>Restrict disclosure to personnel with a need to know, bound by equivalent obligations.</li>
<li>Protect with at least the same care used for the Party's own confidential information, and no less than reasonable care.</li>
<li>Promptly notify the other Party of any unauthorised disclosure.</li>
</ul>
<h2>4. Exclusions</h2>
<p>Obligations do not apply to information that: (a) is or becomes publicly known without breach; (b) was rightfully known before disclosure; (c) is received lawfully from a third party without restriction; or (d) is required by law or court order, with prompt prior written notice where permitted.</p>
<h2>5. Term &amp; Survival</h2>
<p>This Agreement is effective from <strong>${today}</strong> and expires on <strong>${expiry}</strong>. Obligations survive termination for a further two (2) years.</p>
<h2>6. Return of Information</h2>
<p>Upon written request, the receiving Party shall promptly return or destroy all Confidential Information and certify such destruction in writing.</p>
<h2>7. Governing Law &amp; Disputes</h2>
<p>Governed by the laws of the Arab Republic of Egypt. Disputes not resolved amicably within 14 days shall be referred to CRCICA arbitration.</p>
<div class="sig"><div><div class="meta" style="margin-bottom:6px;">Signed — ${lead.orgName}</div><div class="sig-line"></div><div class="sig-lbl">${lead.contactPerson||'Authorised Signatory'} · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Signed — WATTIQ Systems</div><div class="sig-line"></div><div class="sig-lbl">[Director Name] · Managing Director · Date</div></div></div>`;
    openDoc(wrapDoc('Non-Disclosure Agreement', `<div class="meta" style="margin-bottom:3px;">Mutual NDA</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">${today}</div>`, body));
  };

  // ── 6. Pre-Visit Site Inspection Checklist ──────────────────────────────────
  const printPreVisitChecklist = () => {
    const today = todayStr();
    const ref = `WATTIQ-CKL-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const visitDate = svAppt.scheduledDate || '—';
    const siteAddr  = svAppt.siteAddress || lead.address || '—';
    const contact   = svAppt.onSiteContactName || lead.contactPerson || '—';
    const phone     = svAppt.onSiteContactPhone || '—';
    const body = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
<div><div class="meta" style="margin-bottom:3px;">Visit Date</div><div style="font-size:14px;font-weight:600;">${visitDate}${svAppt.scheduledTime?' · '+svAppt.scheduledTime:''}</div></div>
<div><div class="meta" style="margin-bottom:3px;">Site</div><div style="font-size:13px;">${siteAddr}</div></div>
<div><div class="meta" style="margin-bottom:3px;">On-site Contact</div><div style="font-size:13px;">${contact} · ${phone}</div></div>
<div><div class="meta" style="margin-bottom:3px;">Access Notes</div><div style="font-size:13px;">${svAppt.accessNotes||'—'}</div></div>
</div>
<h2>A — Before Leaving Office</h2>
<table><thead><tr><th>Item</th><th style="width:50px;text-align:center;">✓</th></tr></thead><tbody>
${chk('Lead dossier reviewed — discovery call notes read')}
${chk('3 months utility bills downloaded and reviewed')}
${chk('Google Maps aerial view screenshotted for roof area estimate')}
${chk('Camera / phone charged; spare battery if available')}
${chk('Compass / azimuth app installed on phone')}
${chk('Laser tape measure packed')}
${chk('Site visit report form open / this checklist printed')}
${chk('Confirmation WhatsApp sent to on-site contact')}
</tbody></table>
<h2>B — On-Site: Physical Assessment</h2>
<table><thead><tr><th>Item</th><th style="width:50px;text-align:center;">✓</th></tr></thead><tbody>
${chk('Roof type identified (flat concrete / pitched / IBR / ground mount)')}
${chk('Total roof area estimated (tape / pace / laser)')}
${chk('Usable area estimated (obstacles: tanks, A/C units, parapets deducted)')}
${chk('Roof condition assessed (cracks, waterproofing, structural concern)')}
${chk('Azimuth measured (° from True North)')}
${chk('Tilt measured or estimated')}
${chk('Shading survey: nearest obstructions noted (buildings, trees, masts)')}
${chk('GPS coordinates recorded (phone GPS or Google Maps pin)')}
${chk('Photos: 360° roof, south elevation, shading sources, DB, meter, access')}
</tbody></table>
<h2>C — On-Site: Electrical Assessment</h2>
<table><thead><tr><th>Item</th><th style="width:50px;text-align:center;">✓</th></tr></thead><tbody>
${chk('DB located and inspected; brand and rating noted')}
${chk('Main breaker amperage confirmed')}
${chk('Phase confirmed: single-phase / 3-phase')}
${chk('Spare ways in DB assessed')}
${chk('Meter type: import-only or bidirectional')}
${chk('DISCO name confirmed (Cairo / Delta / Upper Egypt / etc.)')}
${chk('Feeder voltage confirmed (380 V / 11 kV / 33 kV)')}
${chk('Net metering eligibility assessed — DISCO current policy')}
${chk('Average monthly consumption noted from utility bills')}
${chk('Peak demand (kVA) noted if visible on bill')}
${chk('Diesel generator: present? Capacity (kVA) and daily usage hours?')}
</tbody></table>
<h2>D — Before Leaving Site</h2>
<table><thead><tr><th>Item</th><th style="width:50px;text-align:center;">✓</th></tr></thead><tbody>
${chk('WATTIQ business card given to on-site contact')}
${chk('Verbal summary of findings shared with client')}
${chk('Next step stated: feasibility study offer follows within 24 hours')}
${chk('Photo count confirmed (minimum 15 photos)')}
</tbody></table>
<div style="margin-top:14px;padding:10px 14px;background:#f7f9ee;border-left:3px solid ${WQ.volt};font-size:12px;">
<strong>Engineer:</strong> __________________________ &nbsp;|&nbsp; <strong>Time in:</strong> ________ &nbsp;|&nbsp; <strong>Time out:</strong> ________ &nbsp;|&nbsp; <strong>Ref:</strong> ${ref}
</div>`;
    openDoc(wrapDoc('Pre-Visit Site Inspection Checklist', `<div class="meta" style="margin-bottom:3px;">Site Visit Prep</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div style="color:rgba(255,255,255,.5);font-size:12px;">${siteAddr}</div><div class="meta" style="margin-top:9px;">Ref · ${ref}</div>`, body));
  };

  // ── 7. Feasibility Fee Invoice ──────────────────────────────────────────────
  const printFeasInvoice = () => {
    const today    = todayStr();
    const dueDate  = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
    const ref      = `WATTIQ-INV-FS-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const half     = Math.round(feeNumEGP / 2);
    const halfVat  = Math.round(half * 0.14);
    const halfTot  = half + halfVat;
    const body = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
<div><div class="meta" style="margin-bottom:4px;">Invoice to</div>
<div style="font-size:14px;font-weight:600;color:${WQ.oxide};">${lead.orgName}</div>
${lead.contactPerson?`<div style="font-size:12px;color:${WQ.muted};">${lead.contactPerson}${lead.contactRole?' · '+lead.contactRole:''}</div>`:''}
<div style="font-size:12px;color:${WQ.muted};">${lead.governorate||''}</div></div>
<div style="text-align:right;"><div class="meta" style="margin-bottom:3px;">Invoice Ref</div>
<div style="font-family:${WQ.mono};font-size:13px;font-weight:600;">${ref}</div>
<div style="font-size:12px;color:${WQ.muted};margin-top:4px;">Issued: ${today} · Due: ${dueDate}</div></div>
</div>
<h2>Services</h2>
<table><thead><tr><th>Description</th><th style="text-align:right;width:160px;">Amount (EGP)</th></tr></thead><tbody>
<tr><td>Solar Feasibility Study — ${lead.orgName}${kWpNum?' · est. '+kWpNum+' kWp':''}<br><span style="font-size:11px;color:${WQ.muted};">Instalment 1 of 2 — 50% upfront (study commencement)</span></td><td style="text-align:right;">${half.toLocaleString()}</td></tr>
<tr><td style="font-size:11.5px;color:${WQ.muted};">VAT 14% — Egyptian VAT Law No. 67/2016</td><td style="text-align:right;font-size:11.5px;">${halfVat.toLocaleString()}</td></tr>
<tr class="tr-total"><td>Total Due — Instalment 1</td><td style="text-align:right;">EGP ${halfTot.toLocaleString()}</td></tr>
</tbody></table>
<div class="cl"><strong>Instalment 2 of 2 (50% on report delivery):</strong> EGP ${halfTot.toLocaleString()} — invoice issued upon report delivery.</div>
<h2>Payment Instructions</h2>
<table><tbody>
<tr><td class="meta" style="width:150px;">Account Name</td><td>[GAFI-registered entity name]</td></tr>
<tr><td class="meta">Bank</td><td>[Bank Name] — [Branch]</td></tr>
<tr><td class="meta">IBAN</td><td>[IBAN]</td></tr>
<tr><td class="meta">Reference</td><td>${ref}</td></tr>
<tr><td class="meta">Methods</td><td>Bank transfer · Instapay · Cash (on receipt)</td></tr>
</tbody></table>
<h2>Notes</h2>
<ul>
<li>Study commences within 1 working day of payment confirmation and receipt of 3 months' utility bills.</li>
<li>Full fee (both instalments) credited against WATTIQ advisory fee if EPC engagement proceeds.</li>
<li>Tax registration number: [TRN] — VAT invoice per Law No. 67/2016.</li>
</ul>
<div class="sig"><div><div class="meta" style="margin-bottom:6px;">Received by client</div><div class="sig-line"></div><div class="sig-lbl">Name · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Issued by WATTIQ</div><div class="sig-line"></div><div class="sig-lbl">[Name] · [Role] · Date</div></div></div>`;
    openDoc(wrapDoc('Feasibility Study Invoice', `<div class="meta" style="margin-bottom:3px;">Invoice</div><div style="color:#fff;font-size:14px;font-weight:600;">${ref}</div><div style="color:rgba(255,255,255,.5);font-size:12px;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">Due ${dueDate}</div>`, body));
  };

  // ── 8. Feasibility Deposit Receipt ─────────────────────────────────────────
  const printDepositReceipt = () => {
    const today    = todayStr();
    const ref      = `WATTIQ-RCP-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const depAmt   = fsold.depositCollectedEGP ? Number(fsold.depositCollectedEGP) : 0;
    const method   = fsold.paymentMethod || '—';
    const txRef    = fsold.receiptRef || '—';
    const recDate  = fsold.depositDate || today;
    const body = `<div style="text-align:center;margin-bottom:18px;padding:16px;background:#f7f9ee;border:2px solid ${WQ.volt};">
<div class="meta" style="margin-bottom:6px;">Official Payment Receipt</div>
<div style="font-size:28px;font-weight:700;color:${WQ.oxide};">${depAmt>0?'EGP '+depAmt.toLocaleString():'EGP ___________'}</div>
<div style="font-size:13px;color:${WQ.muted};margin-top:4px;">Feasibility Study Deposit — Instalment 1 of 2</div>
</div>
<h2>Receipt Details</h2>
<table><tbody>
<tr><td class="meta" style="width:190px;">Receipt Reference</td><td><strong style="font-family:${WQ.mono};">${ref}</strong></td></tr>
<tr><td class="meta">Date Received</td><td>${recDate}</td></tr>
<tr><td class="meta">Received From</td><td>${lead.orgName}${lead.contactPerson?' · '+lead.contactPerson:''}</td></tr>
<tr><td class="meta">Amount Received</td><td><strong>${depAmt>0?'EGP '+depAmt.toLocaleString():'EGP ___________'}</strong></td></tr>
<tr><td class="meta">Payment Method</td><td>${method}</td></tr>
<tr><td class="meta">Transaction / Ref</td><td>${txRef}</td></tr>
<tr><td class="meta">Received By</td><td>[WATTIQ Staff Name]</td></tr>
</tbody></table>
<h2>For</h2>
<table><tbody>
<tr><td class="meta" style="width:190px;">Service</td><td>Solar Feasibility Study — ${lead.orgName}</td></tr>
<tr><td class="meta">Invoice Reference</td><td>WATTIQ-INV-FS-${today.replace(/-/g,'')}-${lead.id||'001'}</td></tr>
<tr><td class="meta">Instalment</td><td>1 of 2 (50% upfront)</td></tr>
<tr><td class="meta">Balance Due</td><td>50% on report delivery — invoice to follow</td></tr>
</tbody></table>
<h2>Notes</h2>
<ul>
<li>Study commences within 1 working day of this payment and receipt of 3 months' utility bills.</li>
<li>Full fee credited against WATTIQ advisory fee if an EPC engagement proceeds.</li>
<li>This receipt is not a tax invoice. VAT invoice (Law No. 67/2016) issued separately.</li>
</ul>
<div class="sig"><div><div class="meta" style="margin-bottom:6px;">Received by WATTIQ</div><div class="sig-line"></div><div class="sig-lbl">[Name] · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Acknowledged — Client</div><div class="sig-line"></div><div class="sig-lbl">${lead.contactPerson||'Name'} · Date</div></div></div>`;
    openDoc(wrapDoc('Feasibility Study Deposit Receipt', `<div class="meta" style="margin-bottom:3px;">Payment Receipt</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">${ref}</div>`, body));
  };

  // ── 9. Feasibility Study Executive Summary ──────────────────────────────────
  const printFeasSummary = () => {
    const today   = todayStr();
    const ref     = `WATTIQ-FS-RPT-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const kWp     = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW || '';
    const tariff  = SEGMENT_TARIFF[lead.segment] || 2.34;
    const baseYld = fd.annualYieldKwh ? Number(fd.annualYieldKwh) : (kWp ? parseFloat(kWp) * 1540 : 0);
    const payback = fd.simplePaybackYears || '—';
    const npv     = fd.npvEGP ? Number(fd.npvEGP) : 0;
    const rec     = fd.recommendation || null;
    const recColor = rec === 'GO' ? '#1E7E34' : rec === 'NO-GO' ? '#C0392B' : '#856404';

    const projRows = (() => {
      if (!baseYld) return [];
      const out = [];
      let cum = 0;
      for (let yr = 1; yr <= 25; yr++) {
        const yld = Math.round(baseYld * Math.pow(0.995, yr - 1));
        const tar = tariff * Math.pow(1.05, yr - 1);
        const sav = Math.round(yld * tar);
        cum += sav;
        if ([1,5,10,15,20,25].includes(yr)) out.push({ yr, yld, tar: tar.toFixed(3), sav, cum });
      }
      return out;
    })();

    const body = `<div style="display:flex;justify-content:space-between;margin-bottom:16px;">
<div><div class="meta" style="margin-bottom:3px;">Prepared for</div>
<div style="font-size:16px;font-weight:700;color:${WQ.oxide};">${lead.orgName}</div>
${lead.contactPerson?`<div style="font-size:12px;color:${WQ.muted};">${lead.contactPerson}</div>`:''}
</div>
<div style="text-align:right;"><div class="meta" style="margin-bottom:3px;">Ref · ${ref}</div>
<div style="font-size:11px;color:${WQ.muted};">Issued: ${today} · Engineer: [Name]</div></div>
</div>
${rec?`<div style="border:2px solid ${recColor};padding:14px 18px;text-align:center;margin-bottom:16px;"><div style="font-family:${WQ.mono};font-size:13px;font-weight:700;color:${recColor};letter-spacing:0.08em;">${rec==='GO'?'✓ GO — SOLAR INVESTMENT RECOMMENDED':rec==='NO-GO'?'✗ NO-GO — INVESTMENT NOT RECOMMENDED AT THIS TIME':'FURTHER INVESTIGATION REQUIRED'}</div>${fd.recommendationNote?`<div style="font-size:12px;color:#555;margin-top:5px;">${fd.recommendationNote}</div>`:''}</div>`:''}
<h2>System Parameters</h2>
<table><tbody>
<tr><td class="meta" style="width:200px;">System Size</td><td>${kWp?kWp+' kWp DC':'—'}</td></tr>
<tr><td class="meta">Annual Yield (P90)</td><td>${baseYld>0?Math.round(baseYld).toLocaleString()+' kWh/yr':'—'}</td></tr>
<tr><td class="meta">Performance Ratio</td><td>${fd.performanceRatioPct?fd.performanceRatioPct+'%':'—'}</td></tr>
<tr><td class="meta">Degradation Rate</td><td>0.5 %/year (Tier-1 linear guarantee)</td></tr>
<tr><td class="meta">Base Tariff</td><td>EGP ${tariff}/kWh — ${lead.segment} · EgyptERA Sept 2024</td></tr>
<tr><td class="meta">Tariff Escalation</td><td>5.0 %/year (IMF adjustment scenario)</td></tr>
<tr><td class="meta">Irradiance Source</td><td>${fd.irradianceSource||'PVGIS-5 (NASA SSE)'}</td></tr>
<tr><td class="meta">Simple Payback</td><td>${payback!=='—'?payback+' years':payback}</td></tr>
<tr><td class="meta">NPV (25 yr, 10% disc.)</td><td>${npv>0?'EGP '+npv.toLocaleString():'—'}</td></tr>
<tr><td class="meta">IRR (25 yr)</td><td>${fd.irrPct?fd.irrPct+'%':'—'}</td></tr>
<tr><td class="meta">Indicative EPC Cost</td><td>${fd.epcCostRangeEGP||'—'}</td></tr>
</tbody></table>
${projRows.length?`<h2>25-Year Financial Projection</h2>
<table><thead><tr><th>Year</th><th>Yield (kWh)</th><th>Tariff (EGP/kWh)</th><th>Annual Savings (EGP)</th><th>Cumulative (EGP)</th></tr></thead><tbody>
${projRows.map(r=>`<tr><td><strong>${r.yr}</strong></td><td>${r.yld.toLocaleString()}</td><td>${r.tar}</td><td>${r.sav.toLocaleString()}</td><td><strong>${r.cum.toLocaleString()}</strong></td></tr>`).join('')}
</tbody></table>
<p style="font-size:11px;color:${WQ.muted};">Assumptions: 0.5%/yr degradation · 5.0%/yr tariff escalation · no battery · grid-connected only.</p>`:''}
<h2>Key Assumptions</h2>
<ul>
<li>Irradiance: ${fd.irradianceSource||'PVGIS-5 (NASA SSE)'} — site GPS coordinates</li>
<li>Module degradation: 0.5%/year · System availability: 98%</li>
<li>Tariff escalation: 5.0%/year (IMF-programme trajectory; ±15% sensitivity tested)</li>
<li>Discount rate (NPV): 10% · No battery storage; grid-connected only</li>
</ul>
${fd.sensitivityNote?`<div class="cl"><strong>Sensitivity:</strong> ${fd.sensitivityNote}</div>`:''}
<div class="sig"><div><div class="meta" style="margin-bottom:6px;">Client Acknowledgment</div><div class="sig-line"></div><div class="sig-lbl">${lead.contactPerson||'Authorised Representative'} · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Prepared by WATTIQ</div><div class="sig-line"></div><div class="sig-lbl">[Engineer Name] · [Role] · Date</div></div></div>`;
    openDoc(wrapDoc('Feasibility Study — Executive Summary', `<div class="meta" style="margin-bottom:3px;">Feasibility Study</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div style="color:rgba(255,255,255,.5);font-size:12px;">${kWp?kWp+' kWp':''}</div><div class="meta" style="margin-top:9px;">Ref · ${ref}</div>`, body));
  };

  // ── 10. EPC Letter of Agreement ─────────────────────────────────────────────
  const printLetterOfAgreement = () => {
    const today = todayStr();
    const ref   = `WATTIQ-LOA-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const cv    = ps.contractValueEGP ? Number(ps.contractValueEGP) : 0;
    const fSize = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW || '—';
    const twks  = ps.timelineWeeks || '[__]';
    const body = `<p>This Letter of Agreement (<strong>"Letter"</strong>) is entered into on <strong>${today}</strong> between:</p>
<div class="cl"><strong>Contractor:</strong> WATTIQ Systems — [GAFI-registered entity name] · 14 Sherif St, Downtown Cairo, Egypt</div>
<div class="cl"><strong>Client:</strong> ${lead.orgName}${lead.contactPerson?' · '+lead.contactPerson:''} · ${lead.governorate||'[Address]'}</div>
<p style="margin-top:10px;">The Parties agree to proceed with an EPC engagement on the following principal terms. This Letter is binding. A full EPC contract may supplement these terms.</p>
<h2>1. Scope</h2>
<p>Design, supply, installation, commissioning, and grid-connection support of a <strong>${fSize} kWp</strong> solar PV system at <strong>${svAppt.siteAddress||lead.governorate||'[Site Address]'}</strong>, as specified in Proposal Ref <strong>${ps.proposalRef||'[Proposal Ref]'}</strong>.</p>
<h2>2. Contract Value &amp; FX Clause</h2>
<table><tbody>
<tr><td class="meta" style="width:200px;">Total Contract Value</td><td><strong>${cv>0?'EGP '+cv.toLocaleString():'EGP [_________]'}</strong></td></tr>
<tr><td class="meta">Payment Structure</td><td>${ps.paymentTerms||'[Per proposal]'}</td></tr>
<tr><td class="meta">FX Clause</td><td>Equipment component USD-referenced (NBE rate on proposal date); works component EGP-fixed. See Proposal for full clause.</td></tr>
</tbody></table>
<h2>3. Timeline</h2>
<p>WATTIQ will achieve COD within <strong>${twks} calendar weeks</strong> from deposit clearance, subject to force majeure, DISCO approval lead times, and import logistics.</p>
<h2>4. Payment Milestones</h2>
<p>Per milestone schedule in Proposal Ref ${ps.proposalRef||'[Ref]'}. WATTIQ may suspend works if any payment is delayed more than 14 calendar days from its milestone trigger.</p>
<h2>5. Warranties</h2>
<ul>
<li>Workmanship: 24 months from COD</li>
<li>Equipment: manufacturer warranties assigned to client at handover</li>
<li>Performance: Year-1 actual yield ≥ 90% of P90 PVsyst modelled output</li>
</ul>
<h2>6. Governing Law &amp; Force Majeure</h2>
<p>Governed by Egyptian law. Disputes to CRCICA if not resolved within 30 days. Force majeure per Egyptian Civil Code Art. 215–216.</p>
<div class="sig" style="border-top:2px solid ${WQ.oxide};"><div><div class="meta" style="margin-bottom:6px;">Agreed — ${lead.orgName}</div><div class="sig-line"></div><div class="sig-line" style="margin-top:8px;border-bottom:1px solid #888;height:22px;margin-bottom:5px;"></div><div class="sig-lbl">Authorised signatory · Title · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Agreed — WATTIQ Systems</div><div class="sig-line"></div><div class="sig-line" style="margin-top:8px;border-bottom:1px solid #888;height:22px;margin-bottom:5px;"></div><div class="sig-lbl">[Director Name] · Managing Director · Date</div></div></div>`;
    openDoc(wrapDoc('EPC Letter of Agreement', `<div class="meta" style="margin-bottom:3px;">Letter of Agreement</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">${today}</div>`, body));
  };

  // ── 11. Milestone Invoice ────────────────────────────────────────────────────
  const printMilestoneInvoice = () => {
    const today      = todayStr();
    const milestones = getMilestones();
    const mi         = milestones[invMilestone] || milestones[0];
    const cv         = ps.contractValueEGP ? Number(ps.contractValueEGP) : 0;
    const invAmt     = cv > 0 ? Math.round(cv * mi.p / 100) : 0;
    const vatAmt     = Math.round(invAmt * 0.14);
    const ref        = `WATTIQ-INV-EPC-${today.replace(/-/g,'')}-M${invMilestone+1}-${lead.id||'001'}`;
    const dueDate    = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
    const msRows     = milestones.map((m, i) => {
      const bg  = i === invMilestone ? 'background:#f7f9ee;' : '';
      const tag = i === invMilestone
        ? `<span style="font-family:${WQ.mono};font-size:8px;background:${WQ.oxide};color:${WQ.volt};padding:2px 7px;">THIS INVOICE</span>`
        : i < invMilestone ? '<span style="font-size:11px;color:#888;">✓ Prev.</span>' : '';
      return `<tr style="${bg}"><td><strong>${i+1}</strong></td><td>${m.l}</td><td>${m.p}%</td><td>${cv>0?Math.round(cv*m.p/100).toLocaleString():'—'}</td><td>${tag}</td></tr>`;
    }).join('');
    const body = `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
<div><div class="meta" style="margin-bottom:4px;">Invoice to</div>
<div style="font-size:14px;font-weight:600;color:${WQ.oxide};">${lead.orgName}</div>
${lead.contactPerson?`<div style="font-size:12px;color:${WQ.muted};">${lead.contactPerson}${lead.contactRole?' · '+lead.contactRole:''}</div>`:''}
</div>
<div style="text-align:right;"><div class="meta" style="margin-bottom:3px;">Invoice Ref</div>
<div style="font-family:${WQ.mono};font-size:13px;font-weight:600;">${ref}</div>
<div style="font-size:12px;color:${WQ.muted};margin-top:4px;">Issued: ${today} · Due: ${dueDate}</div></div>
</div>
<div style="background:${WQ.oxide};color:#fff;padding:10px 16px;margin-bottom:14px;display:flex;align-items:center;gap:14px;">
<span style="font-family:${WQ.mono};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:${WQ.volt};">Milestone ${invMilestone+1} of ${milestones.length}</span>
<span style="font-size:14px;font-weight:600;">${mi.l}</span>
</div>
<h2>Invoice Breakdown</h2>
<table><thead><tr><th>Description</th><th style="text-align:right;width:160px;">Amount (EGP)</th></tr></thead><tbody>
<tr><td>EPC Contract — Milestone ${invMilestone+1}: ${mi.l}<br><span style="font-size:11px;color:${WQ.muted};">Contract Ref: ${ps.proposalRef||'WATTIQ-EPC-[Ref]'} · ${mi.p}% of contract value</span></td><td style="text-align:right;">${invAmt>0?invAmt.toLocaleString():'___________'}</td></tr>
<tr><td style="font-size:11.5px;color:${WQ.muted};">VAT 14%</td><td style="text-align:right;font-size:11.5px;">${invAmt>0?vatAmt.toLocaleString():'___________'}</td></tr>
<tr class="tr-total"><td>Total Due</td><td style="text-align:right;">EGP ${invAmt>0?(invAmt+vatAmt).toLocaleString():'___________'}</td></tr>
</tbody></table>
<h2>All Milestones</h2>
<table><thead><tr><th>#</th><th>Milestone</th><th>%</th><th>Amount (EGP)</th><th></th></tr></thead><tbody>
${msRows}
<tr class="tr-total"><td></td><td>Total Contract Value</td><td>100%</td><td>${cv>0?cv.toLocaleString():'—'}</td><td></td></tr>
</tbody></table>
<h2>Payment Instructions</h2>
<table><tbody>
<tr><td class="meta" style="width:150px;">Account Name</td><td>[GAFI-registered entity name]</td></tr>
<tr><td class="meta">Bank / Branch</td><td>[Bank Name] — [Branch]</td></tr>
<tr><td class="meta">IBAN</td><td>[IBAN]</td></tr>
<tr><td class="meta">Reference</td><td>${ref}</td></tr>
</tbody></table>
<div class="sig"><div><div class="meta" style="margin-bottom:6px;">Received by client</div><div class="sig-line"></div><div class="sig-lbl">Name · Date</div></div><div><div class="meta" style="margin-bottom:6px;">Issued by WATTIQ</div><div class="sig-line"></div><div class="sig-lbl">[Name] · [Role] · Date</div></div></div>`;
    openDoc(wrapDoc(`EPC Milestone Invoice — ${lead.orgName}`, `<div class="meta" style="margin-bottom:3px;">Milestone Invoice ${invMilestone+1} / ${milestones.length}</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">${ref}</div>`, body));
  };

  // ── 12. Engineer Kick-off Brief ─────────────────────────────────────────────
  const printKickoffBrief = () => {
    const today  = todayStr();
    const ref    = `WATTIQ-KOB-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const fSize  = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW || '—';
    const cv     = ps.contractValueEGP ? Number(ps.contractValueEGP) : 0;
    const msRows = getMilestones().map((m, i) =>
      `<tr><td><strong>${i+1}</strong></td><td>${m.l}</td><td>${m.p}%</td><td>Issue payment certificate to accounts</td></tr>`
    ).join('');
    const body = `<div style="background:${WQ.oxide};color:${WQ.volt};padding:8px 14px;margin-bottom:14px;font-family:${WQ.mono};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;">INTERNAL DOCUMENT — NOT FOR CLIENT DISTRIBUTION</div>
<h2>Project Summary</h2>
<table><tbody>
<tr><td class="meta" style="width:180px;">Client</td><td>${lead.orgName}</td></tr>
<tr><td class="meta">Contact</td><td>${lead.contactPerson||'—'}${lead.contactPhone?' · '+lead.contactPhone:''}</td></tr>
<tr><td class="meta">Site</td><td>${svAppt.siteAddress||lead.governorate||'—'}</td></tr>
<tr><td class="meta">DISCO</td><td>${sv.disco||'—'}</td></tr>
<tr><td class="meta">Contract Value</td><td>${cv>0?'EGP '+cv.toLocaleString():'—'}</td></tr>
<tr><td class="meta">Contract Ref</td><td>${ps.proposalRef||'—'}</td></tr>
<tr><td class="meta">Timeline</td><td>${ps.timelineWeeks?ps.timelineWeeks+' weeks from deposit':'—'}</td></tr>
</tbody></table>
<h2>System Specifications</h2>
<table><tbody>
<tr><td class="meta" style="width:180px;">System Size</td><td>${fSize?fSize+' kWp DC':'—'}</td></tr>
<tr><td class="meta">Annual Yield (P90)</td><td>${fd.annualYieldKwh?Number(fd.annualYieldKwh).toLocaleString()+' kWh/yr':'—'}</td></tr>
<tr><td class="meta">Panel Spec</td><td>${ps.panelBrand||fd.panelBrandModel||'—'}${ps.warrantyYearsPanels?' · '+ps.warrantyYearsPanels+'-yr warranty':''}</td></tr>
<tr><td class="meta">Inverter Spec</td><td>${ps.inverterBrand||fd.inverterBrandModel||'—'}${ps.warrantyYearsInverter?' · '+ps.warrantyYearsInverter+'-yr warranty':''}</td></tr>
<tr><td class="meta">Roof / Mount</td><td>${sv.roofType||'—'}</td></tr>
<tr><td class="meta">Usable Area</td><td>${sv.usableAreaM2?sv.usableAreaM2+' m²':'—'}</td></tr>
<tr><td class="meta">Azimuth / Tilt</td><td>${sv.azimuthDeg!=null&&sv.azimuthDeg!==''?sv.azimuthDeg+'°':''} ${sv.tiltDeg!=null&&sv.tiltDeg!==''?'/ '+sv.tiltDeg+'°':''}${!sv.azimuthDeg&&!sv.tiltDeg?'—':''}</td></tr>
<tr><td class="meta">Grid Phase</td><td>${sv.gridPhaseConfirmed||'—'}</td></tr>
<tr><td class="meta">Net Metering</td><td>${sv.netMeteringEligible===true?'Eligible':sv.netMeteringEligible===false?'Not eligible':'—'}</td></tr>
</tbody></table>
<h2>Kick-off Checklist</h2>
<table><thead><tr><th>Item</th><th style="width:50px;text-align:center;">✓</th></tr></thead><tbody>
${chk('Engineering package issued to site team (SLD, layout, cable schedule)')}
${chk('Equipment PO confirmed; delivery date communicated to site')}
${chk('DISCO submission package prepared (SLD + protection settings)')}
${chk('HSE briefing scheduled for Day 1 on site')}
${chk('Site access confirmed with client facilities contact')}
${chk('Scaffolding / access equipment arranged if required')}
${chk('Material delivery window confirmed with site security')}
${chk('Progress reporting schedule agreed: weekly photo report to client')}
</tbody></table>
<h2>Client Contacts</h2>
<table><tbody>
<tr><td class="meta" style="width:180px;">Decision Maker</td><td>${lead.contactPerson||'—'}${lead.contactRole?' · '+lead.contactRole:''}</td></tr>
<tr><td class="meta">On-site Contact</td><td>${svAppt.onSiteContactName||'—'}${svAppt.onSiteContactPhone?' · '+svAppt.onSiteContactPhone:''}</td></tr>
<tr><td class="meta">WATTIQ Account Mgr</td><td>[Your Name] · [Phone]</td></tr>
</tbody></table>
${wonD.engineerBrief?`<h2>Project Notes</h2><div class="cl">${wonD.engineerBrief}</div>`:''}
<h2>Milestone Trigger Schedule</h2>
<table><thead><tr><th>#</th><th>Milestone</th><th>%</th><th>Trigger Action</th></tr></thead><tbody>${msRows}</tbody></table>`;
    openDoc(wrapDoc('Engineer Kick-off Brief', `<div class="meta" style="margin-bottom:3px;">Kick-off Brief — Internal</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div class="meta" style="margin-top:9px;">Ref · ${ref}</div>`, body));
  };

  // ── 13. HSE Site Briefing ────────────────────────────────────────────────────
  const printHSEBriefing = () => {
    const today    = todayStr();
    const ref      = `WATTIQ-HSE-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const siteAddr = svAppt.siteAddress || lead.governorate || '—';
    const body = `<div style="background:${WQ.oxide};color:${WQ.volt};padding:8px 14px;margin-bottom:14px;font-family:${WQ.mono};font-size:9px;letter-spacing:0.1em;text-transform:uppercase;">MANDATORY — Briefing must be completed before any site work commences</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
<div><div class="meta" style="margin-bottom:3px;">Site</div><div style="font-size:13px;font-weight:600;">${siteAddr}</div></div>
<div><div class="meta" style="margin-bottom:3px;">Briefing Date</div><div style="font-size:13px;font-weight:600;">${today}</div></div>
<div><div class="meta" style="margin-bottom:3px;">Site Supervisor</div><div style="font-size:13px;">[Name]</div></div>
<div><div class="meta" style="margin-bottom:3px;">WATTIQ PM</div><div style="font-size:13px;">[Name]</div></div>
</div>
<h2>1. Hazard Register — Solar PV Installation</h2>
<table><thead><tr><th>Hazard</th><th>Severity</th><th>Control Measure</th></tr></thead><tbody>
<tr><td>Working at height (roof)</td><td style="font-weight:700;color:#C0392B;">HIGH</td><td>Full harness, anchor points, edge barriers; no roof work in wind > 35 km/h</td></tr>
<tr><td>Electrical shock — DC live panels</td><td style="font-weight:700;color:#C0392B;">HIGH</td><td>Panels covered during installation; insulated tools; no live-circuit work without LOTO</td></tr>
<tr><td>Electrical shock — AC switchboard</td><td style="font-weight:700;color:#C0392B;">HIGH</td><td>Lockout/Tagout (LOTO) before any AC work; licensed electrician only</td></tr>
<tr><td>Manual handling (panel 20–25 kg)</td><td style="font-weight:700;color:#856404;">MEDIUM</td><td>Two-person lift; mechanical assist for > 10 panels; back support available</td></tr>
<tr><td>Falling objects</td><td style="font-weight:700;color:#856404;">MEDIUM</td><td>Hard hats mandatory below roof work; exclusion zone marked on ground</td></tr>
<tr><td>Heat stress (outdoor summer)</td><td style="font-weight:700;color:#856404;">MEDIUM</td><td>Water on site; 15-min break/hr at > 35 °C; no roof work 12:00–14:00 in summer</td></tr>
<tr><td>Cable trip hazards</td><td style="font-weight:700;color:#3a3a30;">LOW</td><td>Cable trunking; temporary tape markers; tidy site end of each day</td></tr>
<tr><td>Dust / debris (cutting, drilling)</td><td style="font-weight:700;color:#3a3a30;">LOW</td><td>Dust masks when grinding or drilling concrete; eye protection</td></tr>
</tbody></table>
<h2>2. Mandatory PPE</h2>
<table><thead><tr><th>Task</th><th>Required PPE</th></tr></thead><tbody>
<tr><td>All site work</td><td>Safety boots (steel toe), high-vis vest, hard hat</td></tr>
<tr><td>Roof / height work</td><td>+ Full harness with lanyard, anchored; no PPE = no roof access</td></tr>
<tr><td>Electrical work</td><td>+ Insulated gloves (class 00 min.), safety glasses</td></tr>
<tr><td>Drilling / grinding</td><td>+ FFP2 dust mask, eye protection</td></tr>
</tbody></table>
<h2>3. Emergency Procedures</h2>
<table><tbody>
<tr><td class="meta" style="width:170px;">Emergency Contact</td><td>[Site Supervisor] · [Phone]</td></tr>
<tr><td class="meta">Nearest Hospital</td><td>[Hospital Name, Address]</td></tr>
<tr><td class="meta">Fire Extinguisher</td><td>CO₂ type — location noted on arrival. Electrical fires: CO₂ only, never water.</td></tr>
<tr><td class="meta">First Aid Kit</td><td>On site — location stated by supervisor during briefing</td></tr>
<tr><td class="meta">Incident Procedure</td><td>Stop work · call supervisor · call emergency services if severe · document same day</td></tr>
</tbody></table>
<h2>4. Site Rules</h2>
<ul>
<li>No alcohol or controlled substances on site at any time.</li>
<li>No smoking within 10 m of equipment or cable trays.</li>
<li>All incidents — however minor — reported to site supervisor before end of shift.</li>
<li>Visitors must sign in and be escorted; no unaccompanied access to roof or DB areas.</li>
<li>Site cleared and all materials secured before leaving at end of each day.</li>
</ul>
<h2>5. Crew Sign-In — I confirm I have attended and understood this briefing</h2>
<table><thead><tr><th>#</th><th>Full Name</th><th>Role / Trade</th><th>Signature</th><th>Date</th></tr></thead><tbody>
${[1,2,3,4,5,6,7,8].map(i=>`<tr><td>${i}</td><td style="min-width:130px;"></td><td></td><td></td><td></td></tr>`).join('')}
</tbody></table>
<div style="margin-top:14px;padding:10px 14px;background:#f7f9ee;border-left:3px solid ${WQ.volt};font-size:12px;">
<strong>Site Supervisor:</strong> __________________________ &nbsp;|&nbsp; <strong>Signature:</strong> __________________________ &nbsp;|&nbsp; <strong>Date:</strong> ____________ &nbsp;|&nbsp; <strong>Ref:</strong> ${ref}
</div>`;
    openDoc(wrapDoc('HSE Site Briefing', `<div class="meta" style="margin-bottom:3px;">Health, Safety &amp; Environment</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div style="color:rgba(255,255,255,.5);font-size:12px;">${siteAddr}</div><div class="meta" style="margin-top:9px;">Ref · ${ref}</div>`, body));
  };

  // ── 14. Handover Certificate ────────────────────────────────────────────────
  const printHandoverCertificate = () => {
    const today    = todayStr();
    const ref      = `WATTIQ-HO-${today.replace(/-/g,'')}-${lead.id||'001'}`;
    const fSize    = fd.finalSizeKwp || sv.recommendedSizeKwp || lead.systemSizeKW || '—';
    const codDate  = wonD.codDate || '[COD Date]';
    const warEnd   = wonD.codDate ? new Date(new Date(wonD.codDate).getTime() + 2*365*24*60*60*1000).toISOString().split('T')[0] : '[COD + 24 months]';
    const body = `<div style="text-align:center;margin-bottom:18px;padding:14px;border:2px solid ${WQ.volt};background:#f7f9ee;">
<div class="meta" style="margin-bottom:4px;">Project Completion &amp; Handover</div>
<div style="font-size:20px;font-weight:700;color:${WQ.oxide};">Solar PV System Handover Certificate</div>
<div style="font-size:13px;color:${WQ.muted};margin-top:4px;">Issued at Commercial Operation Date (COD)</div>
</div>
<h2>Project Details</h2>
<table><tbody>
<tr><td class="meta" style="width:200px;">Client</td><td>${lead.orgName}</td></tr>
<tr><td class="meta">Site Address</td><td>${svAppt.siteAddress||lead.governorate||'—'}</td></tr>
<tr><td class="meta">System Size</td><td>${fSize?fSize+' kWp DC':'—'}</td></tr>
<tr><td class="meta">Panel Specification</td><td>${ps.panelBrand||fd.panelBrandModel||'—'}</td></tr>
<tr><td class="meta">Inverter Specification</td><td>${ps.inverterBrand||fd.inverterBrandModel||'—'}</td></tr>
<tr><td class="meta">Contract Reference</td><td>${ps.proposalRef||'—'}</td></tr>
<tr><td class="meta">Commercial Operation Date</td><td>${codDate}</td></tr>
<tr><td class="meta">Handover Date</td><td>${today}</td></tr>
</tbody></table>
<h2>Commissioning Results</h2>
<table><tbody>
<tr><td class="meta" style="width:200px;">Performance Test (PVT)</td><td>${wonD.pvtResult||'Passed — results attached'}</td></tr>
<tr><td class="meta">Year-1 Modelled Yield</td><td>${fd.annualYieldKwh?Number(fd.annualYieldKwh).toLocaleString()+' kWh':'—'}</td></tr>
<tr><td class="meta">Meter Reading at COD</td><td>${wonD.commissioningKwh||'—'} kWh</td></tr>
<tr><td class="meta">DISCO Energisation Date</td><td>${wonD.discoEnergisationDate||'[Date]'}</td></tr>
<tr><td class="meta">Monitoring Platform</td><td>${wonD.monitoringPlatform||'[Platform / Portal URL]'}</td></tr>
</tbody></table>
<h2>Documentation Handed Over</h2>
<table><thead><tr><th>Document</th><th>Format</th><th style="width:70px;text-align:center;">Rcvd</th></tr></thead><tbody>
<tr><td>As-built drawings (SLD, layout, cable schedule)</td><td>PDF + DWG</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>Equipment datasheets and warranty certificates</td><td>PDF</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>PVsyst simulation report</td><td>PDF</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>Performance verification test (PVT) report</td><td>PDF</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>DISCO approval letter and net metering confirmation</td><td>Original + copy</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>Monitoring platform login credentials</td><td>Printed + emailed</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
<tr><td>O&amp;M manual and client training record</td><td>PDF</td><td style="text-align:center;"><div style="width:18px;height:18px;border:2px solid #aaa;display:inline-block;border-radius:2px;"></div></td></tr>
</tbody></table>
<h2>Snag List</h2>
<table><thead><tr><th>#</th><th>Item</th><th>Responsible</th><th>Due Date</th><th>Status</th></tr></thead><tbody>
<tr><td>1</td><td style="min-width:160px;"></td><td>WATTIQ</td><td></td><td></td></tr>
<tr><td>2</td><td></td><td>WATTIQ</td><td></td><td></td></tr>
<tr><td>3</td><td></td><td>WATTIQ</td><td></td><td></td></tr>
<tr><td colspan="5" style="font-size:11px;color:${WQ.muted};font-style:italic;">All snag items closed before final retention release.</td></tr>
</tbody></table>
<h2>Warranty Summary</h2>
<div class="cl"><strong>Workmanship Warranty:</strong> 24 months from COD (${codDate} to ${warEnd}). 48 h response for critical faults, 5 working days for non-critical.</div>
<div class="cl"><strong>Equipment Warranty:</strong> Manufacturer warranties (panels, inverters, racking, monitoring) assigned in full to client — full documentation in handover pack.</div>
<div class="cl"><strong>Performance Guarantee:</strong> Year-1 actual yield ≥ 90% of P90 PVsyst modelled output. WATTIQ to review monitoring data at 12 months from COD.</div>
<h2>Declaration</h2>
<p>The Client acknowledges receipt of the solar PV system as described, confirms commissioning activities are complete to their satisfaction (subject to the snag list above), and accepts the system for operation from the date below.</p>
<div class="sig" style="border-top:2px solid ${WQ.oxide};"><div><div class="meta" style="margin-bottom:6px;">Accepted by — ${lead.orgName}</div><div class="sig-line"></div><div class="sig-line" style="margin-top:8px;border-bottom:1px solid #888;height:22px;margin-bottom:5px;"></div><div class="sig-lbl">Authorised signatory · Title · Date</div></div><div><div class="meta" style="margin-bottom:6px;">On behalf of WATTIQ Systems</div><div class="sig-line"></div><div class="sig-line" style="margin-top:8px;border-bottom:1px solid #888;height:22px;margin-bottom:5px;"></div><div class="sig-lbl">[Director Name] · Managing Director · Date</div></div></div>`;
    openDoc(wrapDoc('Handover Certificate', `<div class="meta" style="margin-bottom:3px;">Handover Certificate</div><div style="color:#fff;font-size:14px;font-weight:600;">${lead.orgName}</div><div style="color:rgba(255,255,255,.5);font-size:12px;">${fSize?fSize+' kWp':''}</div><div class="meta" style="margin-top:9px;">COD · ${codDate}</div>`, body));
  };

  const GH = ({ label }) => (
    <div style={{ fontFamily:"'IBM Plex Mono','Courier New',monospace", fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'#888', paddingBottom:5, borderBottom:'2px solid #0F1410', marginTop:4 }}>
      {label}
    </div>
  );

  const DC = ({ title, sub, desc, onPrint }) => (
    <div style={{ ...CARD, padding:0, overflow:'hidden' }}>
      <div style={{ background:'#0F1410', color:'#fff', padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, letterSpacing:'.2px' }}>{title}</div>
          <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginTop:2 }}>{sub}</div>
        </div>
        <button onClick={onPrint} style={{ ...BTN, background:'#D4FF3D', color:'#0F1410', fontSize:11, flexShrink:0 }}>Open / Print</button>
      </div>
      <div style={{ padding:'9px 16px', fontSize:11.5, color:'#666', lineHeight:1.5 }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      <GH label="Business Development" />
      <DC title="WATTIQ — Company Profile" sub="Send immediately after first contact · 1 page A4"
        desc="Segments: Industrial · Agricultural · Commercial · Government — 6-step engagement process. Voice: precise, independent, no eco-clichés."
        onPrint={printCompanyProfile} />
      <DC title="Non-Disclosure Agreement" sub="Mutual · 2-year term · CRCICA governing law"
        desc="Personalised to client. Egypt-law NDA protecting utility bills, financial models, feasibility data, and proposal pricing in both directions."
        onPrint={printNDA} />
      <DC title="Feasibility Study Offer"
        sub={`${lead.orgName} · ${lead.systemSizeKW ? lead.systemSizeKW+' kWp est.' : 'size TBD'} · ${feeStr} · service terms included`}
        desc="Confidentiality · IP ownership · limitation of liability · refund policy · governing law · 30-day validity · signature blocks"
        onPrint={printFeasOffer} />

      <GH label="Site Visit" />
      <DC title="Pre-Visit Site Inspection Checklist"
        sub={svAppt.scheduledDate ? `${svAppt.scheduledDate}${svAppt.scheduledTime?' · '+svAppt.scheduledTime:''} · ${svAppt.siteAddress||lead.governorate||'—'}` : 'Fill site_visit_scheduled dossier to pre-populate'}
        desc="4-section checklist: office prep · physical assessment · electrical assessment · before leaving site. Includes checkbox column for print."
        onPrint={printPreVisitChecklist} />
      <DC title="Site Visit Technical Report"
        sub={Object.keys(sv).length > 0 ? `${sv.visitDate||svAppt.scheduledDate||'Date TBC'} · ${sv.recommendedSizeKwp?sv.recommendedSizeKwp+' kWp rec.':'Size TBC'} · Shading: ${sv.shadingRisk||'—'}` : 'Fill site_visit_completed dossier to populate · outputs blank form if empty'}
        desc={
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
            {[['Roof',sv.roofType],['Usable',sv.usableAreaM2?sv.usableAreaM2+'m²':null],['Shading',sv.shadingRisk],['DISCO',sv.disco],['Net Met.',sv.netMeteringEligible===true?'Eligible':sv.netMeteringEligible===false?'No':null],['Rec.kWp',sv.recommendedSizeKwp?sv.recommendedSizeKwp+' kWp':null]].map(([l,v])=>(
              <div key={l}><span style={{ color:'#bbb' }}>{l}: </span><strong style={{ color:v?'#0F1410':'#ccc' }}>{v||'—'}</strong></div>
            ))}
          </div>
        }
        onPrint={printSiteVisitReport} />

      <GH label="Feasibility" />
      <DC title="Feasibility Study Invoice — Instalment 1"
        sub={`${lead.orgName} · EGP ${Math.round(feeNumEGP/2).toLocaleString()} + 14% VAT · 50% upfront`}
        desc="VAT-compliant invoice (Law No. 67/2016) · payment instructions · Instalment 2 reminder note"
        onPrint={printFeasInvoice} />
      <DC title="Feasibility Study Deposit Receipt"
        sub={fsold.depositCollectedEGP ? `EGP ${Number(fsold.depositCollectedEGP).toLocaleString()} received · ${fsold.paymentMethod||'—'}` : 'Fill feasibility_sold dossier to populate'}
        desc="Official receipt for 50% deposit. Not a tax invoice — references the VAT invoice issued separately."
        onPrint={printDepositReceipt} />
      <DC title="Feasibility Study — Executive Summary"
        sub={fd.finalSizeKwp||sv.recommendedSizeKwp ? `${fd.finalSizeKwp||sv.recommendedSizeKwp} kWp · ${fd.simplePaybackYears?fd.simplePaybackYears+'yr payback':'payback TBC'} · ${fd.recommendation||'Rec. TBC'}` : 'Fill feasibility_delivered dossier · auto-generates 25-yr projection'}
        desc="System parameters · 25-year financial projection (0.5%/yr degradation × 5%/yr tariff escalation) · Go/No-Go recommendation · assumptions register"
        onPrint={printFeasSummary} />

      <GH label="Contract & Commercial" />
      <DC title="EPC Proposal"
        sub={ps.contractValueEGP ? `EGP ${Number(ps.contractValueEGP).toLocaleString()} · ${ps.paymentTerms||'Milestones'} · valid ${ps.validUntil||'30 days'}` : 'Fill EPC Proposal dossier to populate · outputs template if empty'}
        desc="FX clause (USD/EGP 5% threshold) · payment milestones · scope inclusions/exclusions · P90 performance guarantee · warranty pass-through · CRCICA arbitration · force majeure"
        onPrint={printEPCProposal} />
      <DC title="EPC Letter of Agreement"
        sub={ps.contractValueEGP ? `EGP ${Number(ps.contractValueEGP).toLocaleString()} · ${ps.timelineWeeks?ps.timelineWeeks+' wks':'timeline TBC'}` : 'Simplified binding agreement — fill proposal_sent dossier'}
        desc="Binding commercial document covering scope, contract value, FX clause reference, timeline, warranty, and CRCICA governing law. Two signature blocks."
        onPrint={printLetterOfAgreement} />
      <div style={{ ...CARD, padding:0, overflow:'hidden' }}>
        <div style={{ background:'#0F1410', color:'#fff', padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:'.2px' }}>EPC Milestone Invoice</div>
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)', marginTop:2 }}>
              {ps.contractValueEGP
                ? `EGP ${Math.round(Number(ps.contractValueEGP) * getMilestones()[invMilestone]?.p / 100).toLocaleString()} · Milestone ${invMilestone+1} of ${getMilestones().length}`
                : 'Fill proposal_sent dossier for amounts'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <select value={invMilestone} onChange={e => setInvMilestone(Number(e.target.value))}
              style={{ ...INP, width:'auto', fontSize:11, padding:'5px 8px' }}>
              {getMilestones().map((m, i) => (
                <option key={i} value={i}>MS {i+1}: {m.l.replace(/&amp;/g,'&').substring(0,28)}{m.l.length>28?'…':''}</option>
              ))}
            </select>
            <button onClick={printMilestoneInvoice} style={{ ...BTN, background:'#D4FF3D', color:'#0F1410', fontSize:11 }}>Open / Print</button>
          </div>
        </div>
        <div style={{ padding:'9px 16px', fontSize:11.5, color:'#666', lineHeight:1.5 }}>
          VAT-inclusive invoice · milestone highlighted in payment schedule table · all milestones listed for client reference
        </div>
      </div>

      <GH label="Execution & Close-out" />
      <DC title="Engineer Kick-off Brief"
        sub={`${lead.orgName} · ${fd.finalSizeKwp||sv.recommendedSizeKwp||lead.systemSizeKW||'—'} kWp · Internal`}
        desc="System specs, client contacts, kick-off checklist, milestone trigger schedule. Internal use only — not for client distribution."
        onPrint={printKickoffBrief} />
      <DC title="HSE Site Briefing"
        sub={`${svAppt.siteAddress||lead.governorate||'—'} · Mandatory Day-1 briefing`}
        desc="Hazard register (8 risks) · PPE requirements · emergency procedures · site rules · crew sign-in sheet with 8 rows."
        onPrint={printHSEBriefing} />
      <DC title="Handover Certificate"
        sub={wonD.codDate ? `COD: ${wonD.codDate} · Warranty to ${new Date(new Date(wonD.codDate).getTime()+2*365*24*60*60*1000).toISOString().split('T')[0]}` : 'Fill won dossier with COD date to populate · outputs template if empty'}
        desc="Commissioning results · documentation checklist (7 items) · snag list · 3-clause warranty summary · declaration with dual signature blocks."
        onPrint={printHandoverCertificate} />

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function SalesAssistModal({ lead, leads, onUpdateLead, onClose }) {
  const [section, setSection] = useState('outreach');
  const [mode, setMode]       = useState('prep');

  const intelId = SEGMENT_MAP[lead.segment] || 'commercial';
  const intel   = SALES_INTEL.find(s => s.id === intelId) || null;
  const live    = mode === 'live';

  const SECTIONS = [
    { id:'outreach',   label:'📤 Outreach',        hint:'Templates' },
    { id:'discovery',  label:'📞 Discovery Call',   hint:'Script + notes' },
    { id:'valueprops', label:'💡 Value Props',       hint:'Segment intel' },
    { id:'objections', label:'🛡 Objections',        hint:'Responses' },
    { id:'followups',  label:'📅 Follow-Ups',        hint:'Day 2/5/10' },
    { id:'docs',       label:'📄 Key Docs',          hint:'Print-ready' },
  ];

  const tempColor = { Hot:R, Warm:'#D4770A', Cold:'#555' }[lead.temperature] || '#555';
  const stageLabel = lead.stage?.replace(/_/g,' ') || '';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000, display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ background:N, color:'#fff', padding:'12px 20px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:18, fontWeight:900, color:G }}>{lead.orgName}</span>
            {lead.contactPerson && <span style={{ fontSize:13, color:'rgba(255,255,255,.6)' }}>{lead.contactPerson}{lead.contactRole ? ` · ${lead.contactRole}` : ''}</span>}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:5, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:800, background:T, color:'#fff', padding:'2px 8px', borderRadius:3 }}>{lead.segment}</span>
            <span style={{ fontSize:10, fontWeight:800, background: tempColor, color:'#fff', padding:'2px 8px', borderRadius:3 }}>{lead.temperature}</span>
            <span style={{ fontSize:10, fontWeight:700, background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', padding:'2px 8px', borderRadius:3 }}>{stageLabel}</span>
            {lead.monthlyBill && <span style={{ fontSize:11, color:G, fontWeight:700 }}>EGP {parseFloat(lead.monthlyBill).toLocaleString()}/mo</span>}
            {lead.systemSizeKW && <span style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>{lead.systemSizeKW} kWp</span>}
            {lead.painPoint && <span style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Pain: {lead.painPoint}</span>}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Mode toggle */}
          <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,.2)' }}>
            {[
              { id:'prep', label:'PREP' },
              { id:'live', label:'LIVE CALL' },
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); if(m.id==='live') setSection('discovery'); }}
                style={{ ...BTN, borderRadius:0, background: mode===m.id ? G : 'transparent', color: mode===m.id ? '#fff' : 'rgba(255,255,255,.5)', padding:'6px 14px', fontSize:11, letterSpacing:'.5px' }}>
                {m.label}
              </button>
            ))}
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,.1)', border:'none', color:'rgba(255,255,255,.7)', borderRadius:4, width:32, height:32, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:300 }}>
            ×
          </button>
        </div>
      </div>

      {live && (
        <div style={{ background:`${R}`, color:'#fff', padding:'5px 20px', fontSize:11, fontWeight:900, letterSpacing:'.5px', textAlign:'center', flexShrink:0 }}>
          LIVE CALL MODE — Larger text · Discovery Call pre-selected · Notes save to dossier
        </div>
      )}

      {/* Section tabs */}
      <div style={{ background:'#fff', borderBottom:'2px solid #e0e0e0', display:'flex', gap:0, flexShrink:0, overflowX:'auto' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            style={{ padding: live ? '12px 18px' : '9px 16px', background:'transparent', border:'none',
              borderBottom: section===s.id ? `2px solid ${G}` : '2px solid transparent',
              color: section===s.id ? G : '#888', fontSize: live ? 13 : 12,
              fontWeight:700, cursor:'pointer', fontFamily:'inherit', textTransform:'uppercase',
              letterSpacing:'.3px', marginBottom:-2, transition:'color .12s', whiteSpace:'nowrap' }}>
            {s.label}
            {!live && <span style={{ display:'block', fontSize:9, fontWeight:400, color:'#bbb', textTransform:'none', letterSpacing:0 }}>{s.hint}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding: live ? '24px 28px' : '20px 24px', background:'#f0f2f5' }}>
        {section === 'outreach'   && <OutreachSection   lead={lead} live={live} />}
        {section === 'discovery'  && <DiscoveryCallSection lead={lead} onUpdateLead={onUpdateLead} live={live} />}
        {section === 'valueprops' && <ValuePropsSection lead={lead} intel={intel} live={live} />}
        {section === 'objections' && <ObjectionsSection intel={intel} live={live} />}
        {section === 'followups'  && <FollowUpSection   lead={lead} live={live} />}
        {section === 'docs'       && <KeyDocsSection    lead={lead} />}
      </div>
    </div>
  );
}
