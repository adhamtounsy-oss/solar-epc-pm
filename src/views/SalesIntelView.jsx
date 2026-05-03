import { useState } from 'react';

const N = '#0D2137';
const G = '#C8991A';
const T = '#1A6B72';

// ─── Sales Intelligence Data ───────────────────────────────────────────────────
// All tariff figures: EgyptERA official schedule effective 1 September 2024
// FX data: CBE / Trading Economics 2024–2025; forecast DevTech Systems / Capital.com
// Solar resource: Global Solar Atlas; IRENA Egypt Outlook; Springer Egypt Solar Atlas 2023
// Market data: Mordor Intelligence Egypt Solar Market 2025; Climatescope 2025

export const SALES_INTEL = [
  // ── 1. INDUSTRIAL ────────────────────────────────────────────────────────────
  {
    id: 'industrial',
    label: 'Industrial',
    color: '#1A6B72',
    badge: 'Factories · Manufacturing · Textiles · Food Processing · Cold Storage',
    tariff: 'EGP 2.34 / kWh — flat rate, all consumption (LV 380V)',
    typicalSize: '100–500 kWp',
    payback: '4–6 years',
    decisionMaker: 'Owner / CFO / Operations Director',
    angle: 'Lead with production continuity and margin protection — move to payback math second. The emotional hook is operational risk, not cost alone.',
    context: `Egypt's industrial sector pays EGP 2.34/kWh — a flat rate with no off-peak benefit. After a 40–50% tariff hike in August 2024 and further hikes mandated under Egypt's $8 billion IMF agreement through 2025–2026, electricity is becoming a strategic cost risk. The sector accounts for 29% of national electricity consumption, operating largely between 7am–6pm — precisely the window of peak solar generation. Scheduled load shedding of 1–2 hours/day in 2023–2024 directly halted production across Egyptian industrial zones.`,
    keyStats: [
      { label: 'Industrial tariff (EgyptERA, Sept 2024)', value: 'EGP 2.34/kWh' },
      { label: 'Tariff hike, August 2024', value: '+40–50%' },
      { label: 'Next planned increase', value: 'Early 2026, ~+25%' },
      { label: '200 kWp system annual savings', value: '~EGP 750,000/year' },
      { label: 'Payback at 200 kWp', value: '~4–5 years' },
      { label: 'Solar vs diesel (LCOE)', value: 'Solar 70% cheaper' },
      { label: 'Load shedding 2023–2024', value: '1–2 hrs/day (scheduled)' },
      { label: 'Egypt average daily sunshine', value: '9–11 hours' },
    ],
    valueProps: [
      {
        title: 'Lock energy cost for 25 years while tariffs keep rising',
        body: `Egypt has raised electricity tariffs three times since 2022, with August 2024 delivering a 40–50% shock in a single round. The IMF agreement (signed for $8 billion through 2026) requires continued subsidy removal — further hikes are scheduled, not speculative. Solar panels installed today generate electricity for 25 years at a fixed capital cost with zero ongoing fuel expense. Every future tariff increase retroactively improves your ROI without any additional spend. A 200 kWp system saving EGP 750,000/year at today's rate saves proportionally more with each price increase — the asset gets better over time.`,
        stat: 'Solar effective cost: ~EGP 0.9–1.2/kWh over system life vs EGP 2.34/kWh grid (and rising)',
      },
      {
        title: 'Keep production running during grid outages',
        body: `Egypt implemented scheduled load shedding of 1–2 hours daily across industrial zones in 2023–2024 due to declining output at the Zohr gas field — the country's largest gas source. For a factory, each hour of downtime means lost production, spoiled batches, halted machinery, and delayed customer deliveries. A solar-plus-storage system maintains continuous daytime power for critical production lines independently of the grid. The factory next to you that relies 100% on grid supply becomes your competitive disadvantage when outages return — and Egypt's gas supply fundamentals have not structurally changed.`,
        stat: 'Root cause: Zohr gas field output decline (~50% drop in exports 2023). Gas supply constraint is structural, not resolved.',
      },
      {
        title: 'One P&L line that improves as EGP weakens',
        body: `Egyptian manufacturers face a compounding FX squeeze: raw material imports are USD-priced, so every devaluation increases production cost while domestic pricing faces competitive resistance. Solar energy generated on-site is 100% EGP-denominated with zero import content and zero FX exposure. As the pound weakens further — forecast at EGP 52–54/USD by end-2026, compared to ~50/USD today — your solar-generated electricity becomes structurally cheaper in real terms. It is the only input cost in your business that moves in the right direction during a devaluation.`,
        stat: 'EGP: ~10/USD (2016) → ~30/USD (2023) → ~50/USD (2024) → forecast 52–54/USD (end-2026)',
      },
      {
        title: 'Solar peak output matches factory operating hours perfectly',
        body: `Egypt's solar generation peaks between 8am and 5pm — the same window as day-shift industrial operations. Unlike residential installations where much energy is exported unused while the house is empty, industrial systems achieve 85–95% self-consumption: panels directly power machinery, compressors, HVAC, and lighting as they run. Every kWh generated is consumed in real time with near-zero curtailment and maximum bill offset. The load-generation alignment in Egyptian industrial solar is as close to perfect as energy engineering permits.`,
        stat: 'Industrial solar self-consumption: 85–95%. Egypt: 9–11 hours sunshine/day.',
      },
      {
        title: 'Eliminate or eliminate diesel generator costs',
        body: `Most Egyptian factories run diesel generators as backup during outages or as primary supply in areas with unreliable grid access. Diesel-generated electricity costs EGP 3.5–4.7/kWh at current fuel prices — up to double the grid tariff — and diesel availability is subject to import payment pressure and ongoing subsidy reform. A solar-plus-battery system replaces all daytime diesel spend entirely. The LCOE of solar is approximately 70% cheaper than diesel over system life, with no fuel procurement logistics, no engine maintenance, and no emissions.`,
        stat: 'Diesel generator LCOE: 7.2–9.4 USc/kWh (≈EGP 3.6–4.7) vs solar ~2 USc/kWh (≈EGP 0.9–1.0)',
      },
      {
        title: 'Protect export access as EU carbon rules tighten',
        body: `The EU Carbon Border Adjustment Mechanism (CBAM) is in full implementation from 2026. European importers of Egyptian manufactured goods — textiles, chemicals, ceramics, processed food — face carbon tariffs on high-emission supply chains. Solar energy generates I-REC certificates (International Renewable Energy Certificates) that document clean production, protecting market access and enabling wins from European procurement teams with Scope 2 emissions requirements. Early adopters build this credential before it becomes a compliance mandate rather than a competitive edge.`,
        stat: 'Egypt C&I solar: 29% CAGR to 2030 (Mordor Intelligence). Manufacturers are moving ahead of compliance.',
      },
      {
        title: 'Zero fuel dependency for 25 years',
        body: `Egypt's 2023–2024 electricity crisis was caused by a supply-side gas shortage, not a demand management failure. The grid rationed supply to industry because there was not enough gas to run the power plants. Solar has no fuel. Your energy production is completely independent of gas supply dynamics, LNG import economics, fuel subsidy policy, and regional disruptions (including the Suez Canal Houthi situation, which cut Egypt's FX inflows by $800 million/month). Once commissioned, a solar system operates on sunlight for 25 years with no external supply chain.`,
        stat: `Egypt's gas exports dropped ~50% in 2023. Suez Canal revenues fell $800M/month in 2024. FX for fuel imports is constrained.`,
      },
      {
        title: 'Solar inverters protect equipment and eliminate power factor penalties',
        body: `Egypt's industrial grid, particularly in high-load zones, suffers from voltage fluctuations, harmonic distortion, and phase imbalances that damage CNC machines, variable frequency drives (VFDs), PLCs, and precision manufacturing equipment. Grid quality events are a common, underreported cause of premature equipment failure. A solar inverter outputs a clean, stable sine wave and provides passive power conditioning for connected loads. Additionally, EgyptERA's tariff is applied based on a power factor of 0.92 — industrial facilities running below this threshold face escalating penalties: charges nearly double after 3 months of non-compliance, and supply termination is possible after 6 months. Modern solar inverters with reactive power compensation automatically maintain power factor at or above 0.92, eliminating this penalty risk entirely.`,
        stat: 'EgyptERA tariff basis: power factor 0.92. Non-compliance penalty nearly doubles at 3 months; supply can be cut at 6.',
      },
      {
        title: 'Government has stacked four layers of incentives to lower your solar cost — before payback even starts',
        body: `Egyptian law has structured renewable energy investment to be materially cheaper than standard capex from day one. (1) Customs duty: Presidential Decree 419/2018 applies a flat 2% rate on all solar and renewable energy machinery and equipment — compared to standard import tariffs that can reach 10–40% on industrial equipment. (2) Sales tax: capped at 5% on renewable energy equipment, versus up to 10% standard rate. (3) Tax deduction: Investment Law 72/2017 grants a 30% deduction of net taxable profits for the first seven years of a qualifying renewable energy project — directly reducing your effective corporate tax burden for the entire loan repayment period. (4) Financing access: Egypt's banks have capital specifically earmarked for green investments through international programs. CIB has committed over USD 300 million to renewable and climate projects backed by IFC; NBE runs a EUR 100 million EBRD-backed facility for SMEs and corporates; and the Arab African International Bank issued a USD 500 million sustainability bond in 2024 with 75% green allocation. These are not distant instruments — they are available today through your bank relationship manager. The sticker price of your system is not your effective cost once these layers are counted.`,
        stat: 'Investment Law 72/2017: 30% tax deduction × 7 years. Customs: 2% flat on solar equipment. CIB/NBE/AAIB: USD 900M+ green capital available.',
      },
    ],
    objections: [
      {
        q: '"The upfront cost is too high."',
        a: `Reframe as a capital allocation decision. A 200 kWp system costs ~EGP 3–4 million and saves ~EGP 750,000/year at today's tariff. That is a 4–5 year payback on a 25-year asset — an IRR most finance departments approve for any capex project. The comparison is not solar vs zero cost: it is solar vs paying EGP 2.34/kWh every month for the next 25 years. The accumulated cost of inaction over 25 years at current tariffs exceeds EGP 18 million for a 200 kWp-sized load. If the upfront capital is the constraint, we can structure financing that makes the monthly payment lower than your current electricity bill reduction from day one.`,
      },
      {
        q: '"We\'ll wait — maybe prices stabilise or technology improves."',
        a: `Two mechanisms make waiting expensive. First, solar panels are USD-denominated hardware. With EGP forecast at 52–54/USD by end-2026 vs ~50/USD today, waiting means paying more EGP for the same system each year — not less. Second, every month without solar means paying EGP 2.34/kWh that you could have eliminated. A 6-month delay on a 200 kWp system costs ~EGP 375,000 in foregone savings — money that would have partly financed the installation. The IMF agreement makes tariff reductions structurally impossible through the reform period.`,
      },
      {
        q: '"What if we relocate or restructure operations?"',
        a: `Panels are bolted, not bonded. A full uninstall and reinstall at a new facility runs EGP 20,000–40,000 for a 200 kWp system — immaterial against 20+ years of remaining savings. If you sell the building, a property with solar and two decades of free electricity remaining commands a valuation premium. If you downsize, excess generation is exported under net metering. There is no outcome where a solar asset becomes worthless: it relocates, appreciates real estate, or generates net-metering credit.`,
      },
      {
        q: '"I don\'t trust solar contractors in Egypt."',
        a: `This concern is valid — and it is precisely why NREA qualification and EgyptERA licensing exist as a regulatory filter. Our NREA certificate means the Egyptian government has independently verified our technical qualifications, capital adequacy, and engineering credentials. Every panel we install must carry IEC 61215 and IEC 61730 certification — the same international standard required in Germany and the UK. DISCO will not connect or certify any installation that does not meet these standards. The compliance framework is your independent guarantee. We can provide our NREA certificate number for verification today.`,
      },
      {
        q: '"What if panels underperform or break?"',
        a: `Panels carry a 25-year performance warranty from the manufacturer — contractually guaranteeing at least 80% of original output at year 25. This is a global manufacturer obligation (Tier 1 brands: LONGi, JA Solar, JinkoSolar), not a local installer's promise. Inverters carry 5–10 year warranties and are the only wear component. There are zero moving parts in a solar panel. Documented industry average degradation: 0.5% per year — meaning year 25 output is ~87.5% of original. The main maintenance is dust cleaning, which our O&M contract covers on a scheduled basis.`,
      },
      {
        q: '"What if the government changes net-metering rules?"',
        a: `We design against this risk. Our sizing targets 85–95% direct self-consumption — the value of solar does not depend on what EETC credits you for export. The core savings are direct: panels generating during operating hours, powering your machinery in real time, replacing grid consumption. Net-metering credits on surplus are upside, not the base case. Even if net metering were abolished tomorrow, the self-consumption savings remain fully intact and represent the majority of the project economics.`,
      },
      {
        q: '"Egyptian banks are paying 17–20% on savings certificates — why invest in solar instead?"',
        a: `A fair and Egypt-specific question. Three reasons solar competes directly with high-yield CDs. First, CD rates are declining: the CBE has been cutting the policy rate as inflation drops from its 36% peak in 2023 to ~12–15% in 2025 — rates will continue falling. Solar's effective "return" — electricity savings — is inflation-indexed and rises with every tariff hike, permanently. Second, CD interest income is taxable. Corporate holders pay 20% withholding tax; individuals pay income tax on interest. The after-tax CD yield at 17% is closer to 13–14%. Solar savings are tax-free: there is no tax on energy you did not buy. Third, solar is a physical, non-financial asset. It diversifies you away from banking sector risk and currency risk simultaneously. The correct frame is not either/or: a business with surplus capital should hold both financial instruments and real productive assets. Solar is the industrial equivalent of buying your factory building instead of renting — the capital creates permanent savings rather than yielding temporary interest.`,
      },
    ],
  },

  // ── 2. AGRICULTURAL ──────────────────────────────────────────────────────────
  {
    id: 'agricultural',
    label: 'Agricultural',
    color: '#1E7E34',
    badge: 'Farms · Orchards · Poultry · Aquaculture · Desert Reclamation',
    tariff: 'EGP 2.00 / kWh — agriculture/irrigation rate (EgyptERA, LV)',
    typicalSize: '30–150 kWp',
    payback: '2–4 years (vs diesel) / 4–5 years (vs grid)',
    decisionMaker: 'Farm Owner / Agricultural Investor',
    angle: 'Open with diesel cost if they pump with diesel — the savings story is 2–3x stronger than the grid story. Many farmers do not know the national savings number; it is a powerful conversation opener.',
    context: `Egyptian agriculture is highly energy-intensive, dominated by irrigation pumping. Most farms — especially those distant from the national grid — rely on diesel-powered pumps where fuel costs represent 20–40% of operating expenses. Solar-powered irrigation is rapidly becoming the economic default: payback can be as short as 2 years when replacing diesel. Egypt's rural solar resource is among the world's best — Upper Egypt averages 8.0–8.3 peak sun hours per day. The IFC and Agricultural Bank of Egypt have a dedicated financing partnership for solar irrigation, making monthly payments structurable below current diesel spend.`,
    keyStats: [
      { label: 'Agricultural tariff (EgyptERA, Sept 2024)', value: 'EGP 2.00/kWh' },
      { label: 'Diesel vs solar cost saving', value: 'Up to 65% (IRENA)' },
      { label: 'National diesel saving potential', value: 'EGP 14 billion/year' },
      { label: 'Payback replacing diesel pumps', value: '~2–3 years' },
      { label: 'Upper Egypt solar (PSH/day)', value: '8.0–8.3 hours' },
      { label: 'Cairo / Delta solar (PSH/day)', value: '5.5–6.0 hours' },
      { label: 'Financing available', value: 'AgBank + IFC partnership' },
      { label: 'Off-grid option', value: 'Yes — no grid connection needed' },
    ],
    valueProps: [
      {
        title: 'Eliminate up to 65% of diesel pumping cost from day one',
        body: `For farms running diesel irrigation, solar is a direct fuel replacement. IRENA documents a 65% reduction in farm energy costs when switching from diesel to solar-powered irrigation. A typical farm running a 30 kW diesel pump for 8 hours/day burns 20–40 litres of diesel daily. One documented Egyptian farmer spent EGP 270,000 to install two solar stations and saved 80 litres of diesel per day, recovering his entire investment in 2 years. At current diesel prices and the ongoing phase-out of fuel subsidies under the IMF agreement, this savings gap only widens over time.`,
        stat: 'IRENA: solar irrigation reduces farm energy costs up to 65%. National potential: EGP 14 billion/year saved.',
      },
      {
        title: 'Full energy independence for remote fields — no grid needed',
        body: `Many agricultural plots in Upper Egypt, the Western Desert, Sinai, and the new Delta reclamation zones are far from grid infrastructure. Grid connection can cost EGP 50,000–200,000+ depending on distance, transformer requirements, and DISCO backlog, and still does not solve reliability. An off-grid solar system with battery storage or water-tank buffer requires zero grid infrastructure, zero connection fees, and delivers completely autonomous irrigation owned and operated by the farmer. The government has already funded free off-grid solar irrigation installations in Sharqia, Beheira, Kharga, and Dakhla — validating the model at national scale.`,
        stat: 'Government-funded off-grid solar irrigation already deployed in Sharqia, Beheira, and the Western Desert oases.',
      },
      {
        title: 'Upper Egypt\'s solar resource is among the world\'s best',
        body: `Egypt's solar resource is exceptional by any global standard. Upper Egypt receives 8.0–8.3 kWh/m²/day of direct solar radiation — comparable to the Atacama Desert and the Arabian Peninsula's best sites. This means a given system size produces 30–40% more energy in Assiut or Luxor than in Cairo (5.5–6.0 PSH), and dramatically more than Europe (2.5–3.5 PSH). For farmers in Upper Egypt and the desert reclamation zones, the economics of solar are significantly better than the national average — and they are already excellent nationwide.`,
        stat: 'Upper Egypt (Assiut, Luxor, Aswan): 8.0–8.3 PSH/day. Egypt overall: 3,000 sunshine hours/year.',
      },
      {
        title: 'Finance through Agricultural Bank — monthly payments below current diesel bills',
        body: `The International Finance Corporation (IFC) has partnered with the Agricultural Bank of Egypt specifically to provide solar irrigation financing for Egyptian farmers. Loan structures are designed so monthly repayments fall below the current monthly diesel expenditure — meaning the system is cash-flow positive from the first month of installation. You replace a recurring diesel expense with a reducing loan payment, and at the end of the loan term you own an asset generating free energy for 20+ years. There is no capital required upfront in many cases.`,
        stat: 'IFC + Agricultural Bank of Egypt: dedicated solar irrigation financing. Monthly payments below current diesel cost.',
      },
      {
        title: 'Lock in economics now as diesel subsidies continue to fall',
        body: `Egypt's diesel subsidy reform is ongoing as part of the IMF agreement. Diesel prices have increased multiple times since 2022 and will continue rising as subsidies are phased out. Beyond price, diesel availability during FX crises can be constrained when the government faces pressure on fuel import payment. Solar eliminates diesel from your operational risk register entirely. No queuing, no supply shocks, no price surprises from the next budget cycle. Once installed, your pumping cost is fixed and government-independent.`,
        stat: 'Diesel subsidy phase-out: IMF condition through 2026. Fuel prices will continue to increase.',
      },
      {
        title: 'Irrigate more land at zero marginal energy cost',
        body: `With a solar installation in place, the marginal energy cost of irrigating additional land is zero. Existing capacity can be extended — additional dunums, a second growing cycle, a new crop type — without proportionally increasing energy cost. For commercial farms, this changes the expansion economics entirely: additional cultivated area adds revenue without adding fuel overhead. After the payback period, 20+ years of zero-fuel irrigation makes every productive acre structurally more profitable than it was under diesel.`,
        stat: 'After payback: 20+ years of zero-fuel-cost irrigation. Expansion economics change fundamentally.',
      },
      {
        title: 'Smart solar irrigation reduces water use by 28%',
        body: `Modern solar-powered irrigation controllers schedule watering during peak solar production hours, optimise flow rates, and can integrate soil moisture sensors to eliminate over-irrigation. A 2025 study published in Nature found that smart solar irrigation reduced water use by 28% while cutting CO₂ emissions by 0.25 kg/m²/year with a payback period of 5.6 years. In Egypt's water-scarce agricultural context, reducing pumping volume reduces both energy consumption and groundwater depletion — extending the productive life of the well and complying with increasingly strict water-use oversight.`,
        stat: 'Smart solar irrigation: 28% water use reduction (Nature, April 2025).',
      },
      {
        title: 'Poultry and livestock: solar+battery is existential business continuity',
        body: `For poultry farmers, a ventilation failure during Egyptian summer is not a cost event — it is a catastrophic loss event. A 2-hour power cut at 40°C can kill an entire cohort of broilers aged 3–5 weeks, wiping out a full production cycle of feed cost, chick purchase, and 35 days of labour. Egypt is one of Africa's largest poultry producers, with millions of birds in enclosed broiler and layer houses requiring continuous mechanical ventilation. The Egyptian government has recognised this risk directly: it has subsidised solar panel installations on poultry farms in several governorates specifically to protect against outages. A solar-plus-battery system sized to cover ventilation fans for 4+ hours is not about energy savings in this context — it is insurance against a total loss event that takes 6–8 weeks of capital and production time to recover from.`,
        stat: `Egyptian government subsidises solar on poultry farms to protect against power failures. 2-hour cut at 40°C = full flock loss.`,
      },
      {
        title: 'Solar cold storage cuts Egypt\'s 45% post-harvest losses directly',
        body: `Egypt loses an estimated 30–45% of harvested produce to post-harvest spoilage, one of the highest rates regionally, primarily from inadequate cold chain infrastructure at the farm level. Solar-powered on-farm cold storage — 0–4°C for vegetables and fruit, -18°C for meat and fish — directly reduces spoilage losses, enabling better market timing, export-grade quality maintenance, and access to premium buyer channels who require cold chain documentation. A solar-powered 50 m³ cold room uses approximately 5–8 kWp and can pay back through reduced spoilage losses alone — before counting the electricity bill savings. For farms selling to supermarket chains or export buyers, cold chain capability opens higher-value markets that are structurally inaccessible without reliable refrigeration.`,
        stat: `Egypt post-harvest losses: 30–45% without cold chain. Solar cold storage recovers this margin directly.`,
      },
      {
        title: 'IFC, Agricultural Bank, and government subsidies bring solar within reach — often with payments below your current diesel bill',
        body: `Egyptian farmers have access to four distinct channels of government and institutional support for solar installation. (1) Financing: The International Finance Corporation (IFC) has partnered specifically with the Agricultural Bank of Egypt to offer solar irrigation loans structured so that monthly repayments fall below the current monthly diesel expenditure — making the transition cash-flow positive from day one. No upfront capital is required under many of these structures. (2) Free installations: The Egyptian government has directly funded free solar irrigation installations in several governorates — Sharqia, Beheira, and the Western Desert oases of Kharga and Dakhla — validating the model at national scale and demonstrating that the government views solar irrigation as critical infrastructure, not discretionary spending. (3) Customs duty: Presidential Decree 419/2018 applies a flat 2% rate on all imported solar equipment, compared to standard rates of 10–40% on capital equipment. This directly reduces the hardware cost of your system before any other discount. (4) Tax deduction: Investment Law 72/2017 grants a 30% deduction of net taxable profits for the first seven years of qualifying renewable energy projects — applicable to commercial farms and agricultural companies. Between government-funded installations in some cases, subsidised loans in others, and duty reductions on the hardware, the effective cost of a solar irrigation system to an Egyptian farmer is substantially lower than the sticker price suggests.`,
        stat: 'IFC + Agricultural Bank: dedicated solar irrigation loans, payments below diesel costs. Government-funded installations: Sharqia, Beheira, Western Desert. Customs: 2% flat.',
      },
    ],
    objections: [
      {
        q: '"I only need the pump seasonally — solar isn\'t worth it."',
        a: `Seasonal concentration actually strengthens the economics, not weakens them. Egypt's summer irrigation season — when pumping demand is highest — coincides with peak solar production: June–August averages 7.0–7.3 PSH/day. Your system operates at maximum efficiency precisely when you need it most. During off-season, an on-grid system generates electricity credited to your bill under net metering. An off-grid system can run grain dryers, cold storage, or on-farm workshop loads. The seasonal alignment is a feature.`,
      },
      {
        q: '"I already have a grid connection — diesel isn\'t my issue."',
        a: `At EGP 2.00/kWh (agricultural tariff), a 50 kWp solar system generating ~87,500 kWh/year saves approximately EGP 175,000/year on your electricity bill. At an installed cost of ~EGP 750,000, that is a 4.3-year payback — and every future tariff increase shortens it further. Grid-connected farms also still experience load shedding during peak summer demand when irrigation needs are highest. Solar provides both bill savings and pumping continuity during grid events, which is the worst possible time to lose power on a farm.`,
      },
      {
        q: '"Solar panels get covered in dust and stop working."',
        a: `This is a real condition in Egypt and a solved operational problem. Dust soiling reduces output by 5–15% if panels are not cleaned, and is fully recovered with washing. Our O&M contracts for agricultural installations include quarterly or bi-annual cleaning schedules, sized for Egypt's dust environment. We factor typical soiling losses into yield projections conservatively, so the numbers we present already account for this. Dust is managed, not ignored — and it does not reduce panel lifespan.`,
      },
      {
        q: '"What about nights or cloudy days?"',
        a: `Irrigation scheduling is designed around solar production hours. Most Egyptian crops require watering in the morning or afternoon — when solar is generating. A water storage tank (typically already present on farms) provides a 4–8 hour buffer that allows pump operation to be timed to peak solar output while delivering water when the crop needs it. Egypt has fewer than 20 significantly cloudy days per year in most agricultural regions. For fully off-grid sites, battery handles early-morning start-up before solar ramps up. The solution is scheduling, not 24/7 generation.`,
      },
      {
        q: '"I\'ve seen bad installations in the area."',
        a: `Quality variation is real in the Egyptian market, particularly for informal diesel-to-solar conversions done by local electricians without proper engineering. An NREA-certified EPC contractor is required to use IEC 61215- and IEC 61730-certified panels, DISCO-approved inverters, and Engineers' Syndicate-registered engineering staff. These are not self-declarations — they are government-verified requirements. Ask any contractor for their NREA certificate number before engaging. We can provide ours immediately and you can verify it directly with NREA.`,
      },
    ],
  },

  // ── 3. GOVERNMENT ────────────────────────────────────────────────────────────
  {
    id: 'government',
    label: 'Government',
    color: '#0D2137',
    badge: 'Ministries · Governorates · Hospitals · Schools · Utilities · Municipalities',
    tariff: 'EGP 2.27–2.33 / kWh (commercial tiers applied to government facilities)',
    typicalSize: '50–500 kWp',
    payback: '5–7 years',
    decisionMaker: 'Ministry Procurement / Governorate Director / Facilities Head',
    angle: 'Lead with policy alignment — solar serves the 42% renewable target directly. Then show the operating budget reduction. Never open with technology or pricing.',
    context: `Egypt has committed to 42% renewable energy by 2030 and 60% by 2040, allocating EGP 99.9 billion for 48 renewable energy projects in FY 2024/25. Installing solar on government buildings is direct implementation of national policy — not a discretionary budget item. Government facilities pay commercial tariff rates that have increased 40–50% in 2024, creating a budget pressure that solar permanently resolves. Hospitals, schools, water pumping stations, and administrative buildings are prime candidates: they have predictable daytime loads, large flat rooftops, and critical need for power continuity.`,
    keyStats: [
      { label: 'Government renewable target', value: '42% by 2030' },
      { label: 'FY 2024/25 renewable investment', value: 'EGP 99.9 billion' },
      { label: 'NWFE programme solar capacity', value: '3.7 GW mobilised' },
      { label: 'NWFE green investment mobilised', value: '$10.9 billion (2024)' },
      { label: '100 kWp building annual savings', value: '~EGP 370K–400K/year' },
      { label: 'Commercial tariff 1,000+ kWh', value: 'EGP 2.33/kWh' },
      { label: 'Grid connection fee (1–500 kW)', value: 'Waived since March 2024' },
      { label: 'Systems ≤500 kW', value: 'Exempt from licensing' },
    ],
    valueProps: [
      {
        title: 'Direct contribution to Egypt\'s national 42% renewable target',
        body: `Solar on government buildings is not discretionary — it is direct execution of Egypt's energy strategy as stated by the Prime Minister and backed by the NWFE programme. The government has allocated EGP 99.9 billion for 48 renewable projects in FY 2024/25, and the NWFE programme has mobilised $10.9 billion in international investment commitments. An installation on any ministry building, governorate headquarters, hospital, or school adds to the national renewable capacity tally. This is a "yes, and…" alignment with existing directives — not a competing budget priority.`,
        stat: 'Egypt renewable target: 42% by 2030, 60% by 2040. NWFE mobilised $10.9B in commitments (2024).',
      },
      {
        title: 'Reduce the ministry\'s operating budget permanently — for 25 years',
        body: `Government electricity bills are a recurring operational cost that increased 40–50% in 2024 and will increase again under the IMF reform programme. A 100 kWp system on a ministry building generates approximately 160,000 kWh/year, saving EGP 370,000–400,000/year at current commercial tariffs. This saving persists for 25 years with minimal maintenance. In a budget operating under IMF-mandated fiscal consolidation, permanent operating cost reduction is a strategic priority — and solar delivers it with a capital expenditure that pays back in 5–7 years, then runs for free.`,
        stat: '100 kWp → ~160,000 kWh/year → ~EGP 370K–400K/year savings at commercial tariff',
      },
      {
        title: 'Hospitals and schools that stay operational during outages',
        body: `Hospitals cannot afford power cuts. Schools cannot function without lighting and cooling during Egyptian summer examinations. Water pumping stations must run continuously. With scheduled load shedding remaining a feature of Egypt's grid management, government facilities that depend 100% on the grid face operational risk during exactly their most critical hours. A solar-plus-storage system provides daytime generation independence for critical functions — surgical theatres, ICU equipment, exam halls, and municipal water distribution — reducing dependence on the same grid that intermittently fails.`,
        stat: `Egypt grid: 1–2 hours daily load shedding in 2023–2024. Critical facilities need power continuity, not just cost savings.`,
      },
      {
        title: 'Reduce demand pressure on the national grid during peak hours',
        body: `Every kilowatt installed on a government building is a kilowatt not drawn from the national grid during peak daytime demand. Government buildings — ministries, universities, large hospitals — represent concentrated, predictable 9am–5pm loads. Shifting this to on-site solar directly reduces grid stress during the hours when national demand peaks and load shedding historically occurs. Distributed generation on public buildings is one of Egypt's fastest demand-side relief mechanisms, and it delivers permanent results unlike curtailment or rationing.`,
        stat: 'Egypt grid: 81% gas-dependent. Zohr field in structural decline. Distributed solar reduces grid demand directly.',
      },
      {
        title: 'Visible demonstration of Egypt\'s green transition',
        body: `Solar panels on government buildings are visible to citizens, international partners, and media. For a country that hosted COP27 in 2022 and committed to nationally determined contribution targets, government rooftop solar provides tangible domestic implementation evidence. The Ministry of Environment, Ministry of Electricity, and Prime Minister's office have all publicly supported renewable deployment. A solar installation is a press release and a credibility signal to international investors and development finance institutions assessing Egypt's green economy commitments.`,
        stat: `Egypt hosted COP27 (Sharm El-Sheikh, 2022). NDC commitments require demonstrated domestic deployment.`,
      },
      {
        title: 'Full regulatory compliance built in — zero audit risk',
        body: `Government procurement authorities require zero compliance risk from contractors. An NREA-qualified EPC company means all regulatory requirements are met as part of the contract: EgyptERA licensing, IEC 61215/61730 panel certification, DISCO connection approval, NREA quality standards, and bi-annual NREA reporting. Every document required by the Central Audit Authority (Jihaz al-Muhasebet) for energy efficiency projects is maintained and produced by the contractor. The procuring authority's exposure is limited to standard contract oversight.`,
        stat: 'NREA-qualified contractor: government-verified technical capability, capital, and engineering credentials.',
      },
      {
        title: 'Access concessional international green financing',
        body: `Government-sector solar projects qualify for financing from international development institutions — EBRD, African Development Bank, USAID REACT, World Bank Climate Finance — at 0% or concessional interest rates not available to private borrowers. Egypt's NWFE programme has already established the frameworks for accessing this capital. A ministry procuring solar through a compliant EPC contractor can structure the project under these facilities, potentially achieving payback in 2–3 years rather than 5–7 when cost of capital is near zero.`,
        stat: `NWFE programme: mobilised $10.9B in bankable capacity. Concessional green finance available for public sector projects.`,
      },
      {
        title: 'New administrative cities and development zones: solar before the grid is ready',
        body: `Egypt's new cities programme — New Administrative Capital, New Alamein, New Mansoura, New Sohag, and the Meshtoul Kheira Delta project — is constructing government buildings, schools, and hospitals in areas where the national distribution grid is still being built. Egypt's electricity distribution infrastructure itself needs EGP 25 billion in upgrades (USD 492 million), with 47 distribution control centres being modernised and 19 still under construction. The New Administrative Capital has already adopted solar power for its street lighting and public spaces. For government facilities in new or expanding development zones, solar is the practical primary energy source: faster to procure and commission than grid extension, operational from day one, and a permanent on-site asset that continues generating value after the grid eventually arrives.`,
        stat: `NAC already deploying solar for public spaces. Egypt distribution grid needs EGP 25B in upgrades — solar bridges the gap.`,
      },
      {
        title: 'Reliable power retains doctors, teachers, and qualified staff',
        body: `Government hospitals and schools face a chronic challenge retaining qualified medical and educational staff. A hospital where the lights go out during rounds, surgeries, or ICU care creates working conditions that drive experienced doctors and nurses to the private sector or abroad. A school where classrooms overheat without functioning air conditioning during examinations damages teaching quality and teacher retention. Reliable daytime power from solar is a staff welfare investment: it signals that the institution is professionally maintained and safe to work in. This argument resonates directly with ministry officials responsible for healthcare workforce strategy and educational quality metrics.`,
        stat: `Egypt healthcare brain drain: doctors and qualified nurses leaving public hospitals for private sector or abroad. Reliable power is a retention lever.`,
      },
      {
        title: 'Egypt has built the financing infrastructure for government solar — concessional capital is available today',
        body: `Public sector solar in Egypt is not constrained by capital availability — the funding structures already exist. (1) NWFE programme: Egypt's Nexus of Water, Food and Energy initiative, backed by $4 billion in concessional financing from international partners (EU, UK, US, Germany, and multilateral banks), specifically targets renewable energy deployment on public infrastructure. The NWFE framework has mobilised $10.9 billion in total bankable investment commitments as of 2024. (2) Government buildings precedent: 52 buildings in the New Administrative Capital already have 16 MWp of solar installed — proving that government building solar is operational, not theoretical. These installations set the technical standard and procurement template for all subsequent ministry projects. (3) International development finance: The EBRD, African Development Bank (AfDB), and USAID REACT programme all have active facilities targeting Egyptian public sector energy efficiency and renewable projects at concessional or near-zero interest rates. The concessional cost of capital can compress the payback period from 5–7 years to 2–3 years, turning what appears to be a long-horizon capex decision into a near-term budget net positive. (4) Regulatory advantages: Systems ≤500 kW are exempt from licensing requirements, and grid connection fees for systems between 1–500 kW have been waived since March 2024 — eliminating two common cost and process obstacles in government procurement. A ministry or governorate that structures a solar project through an NREA-qualified contractor with NWFE or EBRD financing can achieve both policy compliance and operating budget relief simultaneously.`,
        stat: 'NWFE: $4B concessional financing available. 52 NAC buildings: 16 MWp already installed. Grid connection fees waived ≤500 kW. Licensing exempt ≤500 kW.',
      },
    ],
    objections: [
      {
        q: '"Procurement takes too long — this isn\'t a priority."',
        a: `The entry point is at the specification stage, not procurement approval. We can provide a technical specification document, equipment schedules, performance criteria, and reference installation data at no cost during the pre-procurement phase — enabling the ministry to issue a technically sound tender when funding is allocated. We are not asking for emergency procurement; we are asking to help you prepare the spec sheet so that when the budget is approved, the procurement can move quickly and compliantly with a strong technical foundation.`,
      },
      {
        q: '"There is no capital budget available."',
        a: `Two structures work without upfront capital. First, an Energy Services Agreement (ESA): the system is financed and owned by the contractor, the ministry pays a monthly "energy bill" below the current EETC bill, and ownership transfers to the government at term end. Second, Egypt's NWFE programme and international development finance (EBRD, AfDB, USAID REACT) offer concessional financing specifically for public sector renewable projects at near-zero interest rates. The solar system can generate net savings from month one under either structure — making it budget-neutral or accretive from inception.`,
      },
      {
        q: '"Legal and audit concerns — we need to follow procurement law."',
        a: `Standard government procurement law (Law 182/2018 and implementing regulations) fully applies. We are a registered Egyptian company with NREA qualification, EgyptERA license, and Engineers' Syndicate registration — all documentation required by the Central Audit Authority for energy efficiency projects is maintained and available. Technical specifications we provide can be incorporated directly into any tender document. We have experience working within JCA requirements and can support the procurement team in structuring the technical schedule correctly.`,
      },
      {
        q: '"The building is old — I\'m not sure the roof can hold panels."',
        a: `A structural assessment is part of our standard site survey and is completed before any design commitment. Modern solar mounting adds approximately 12–15 kg/m² to roof loading — within the capacity of most Egyptian reinforced concrete roofs constructed to standard specifications. We work with a structural engineer to confirm this and document it for your facilities records. If the roof has limitations, we can design ground-mount or car park canopy structures that add solar generation without any roof loading at all.`,
      },
    ],
  },

  // ── 4. COMMERCIAL ────────────────────────────────────────────────────────────
  {
    id: 'commercial',
    label: 'Commercial',
    color: '#C8991A',
    badge: 'Hotels · Malls · Office Buildings · Private Hospitals · Private Schools',
    tariff: 'EGP 2.27–2.33 / kWh (600–1,000 kWh tier: 2.27; 1,000+ kWh: 2.33)',
    typicalSize: '50–300 kWp',
    payback: '4–6 years',
    decisionMaker: 'Owner / General Manager / CFO / Facilities Manager',
    angle: 'Hotels and hospitals: lead with operational continuity. Malls and offices: lead with bill reduction and property value. Tailor to who\'s in the room.',
    context: `Large commercial buildings — hotels, malls, private hospitals, schools, and office towers — pay EGP 2.27–2.33/kWh at the top commercial tariff tier, nearly identical to the industrial rate. The payback economics are equally compelling. Commercial buildings have large flat rooftops that are typically idle, operate during peak solar hours (8am–8pm for retail, 24/7 for hospitals), and face the same grid reliability exposure as industrial users. Egypt's C&I solar segment is the fastest-growing in the market: 29% CAGR to 2030.`,
    keyStats: [
      { label: 'Commercial tariff (1,000+ kWh)', value: 'EGP 2.33/kWh' },
      { label: 'Egypt C&I solar CAGR to 2030', value: '29%' },
      { label: '200 kWp system annual savings', value: '~EGP 745,000/year' },
      { label: 'Grid connection fee (1–500 kW)', value: 'Waived since March 2024' },
      { label: 'Roof cooling effect', value: '3–5°C lower surface temp' },
      { label: 'Net metering surplus credited at', value: 'EGP 2.33/kWh (your own rate)' },
      { label: 'Commercial tariff hike, Aug 2024', value: '+~20%' },
      { label: 'Last tariff review planned', value: 'Early 2026' },
    ],
    valueProps: [
      {
        title: 'Your highest consumption tier means your highest savings rate',
        body: `Large commercial users are in the EGP 2.27–2.33/kWh bracket — the maximum tier where every kWh of solar displaces your most expensive electricity. A 200 kWp system on a hotel or mall generates approximately 320,000 kWh/year, saving ~EGP 745,000/year at EGP 2.33/kWh. At an installed cost of EGP 3–4 million, the payback is 4–5 years on a 25-year asset. Commercial solar economics work because the tariff is high, the load is daytime-heavy, and the rooftop is large. All three conditions are met for most large commercial buildings in Egypt.`,
        stat: '200 kWp → ~EGP 745,000/year in savings at EGP 2.33/kWh commercial tier',
      },
      {
        title: 'Hotels and hospitals: stay fully open during grid outages',
        body: `A hotel that loses power during Egyptian summer loses air conditioning, lifts, kitchen, and POS systems. Guests leave and reviews suffer. A hospital without power during an outage is a patient safety emergency. Solar-plus-battery keeps critical systems running — HVAC, lighting, medical equipment, kitchen, reception — independently of the grid during scheduled or unscheduled outages. In a tourist market where guests compare experiences and book on TripAdvisor, power continuity during July and August peak season is a direct revenue protection measure.`,
        stat: `Egypt grid: 1–2 hours daily load shedding in 2023–2024. Tourist zone hotels reported direct revenue and review impact.`,
      },
      {
        title: 'Convert idle rooftop into a 25-year electricity-generating asset',
        body: `Commercial flat rooftops are typically unused space — ventilation pipes, water tanks, and open sky. Solar panels convert this dormant square meterage into an electricity-generating asset that offsets your highest-cost utility spend. There is zero opportunity cost: the roof remains structurally functional, equipment access is maintained, and the installation is fully reversible if circumstances change. Approximately 70–80 m² of rooftop is required per 10 kWp — a 1,000 m² accessible roof supports roughly 120–140 kWp. Most large commercial buildings have far more.`,
        stat: 'Typical commercial roof: 1,000 m² accessible area supports 120–140 kWp. Most large buildings have more.',
      },
      {
        title: 'Solar panels reduce your A/C load as well as powering it',
        body: `Solar panels mounted on a flat commercial rooftop absorb solar radiation that would otherwise heat the building fabric, reducing roof surface temperature by 3–5°C. This passive cooling effect reduces the heat load on the building's air conditioning system, lowering A/C electricity consumption by an additional 5–10% beyond the direct generation savings. For a large hotel or mall with heavy A/C loads running through Egyptian summer, this compound effect — direct generation plus thermal load reduction — is commercially meaningful.`,
        stat: 'Rooftop solar: 3–5°C surface temperature reduction, 5–10% additional A/C load saving.',
      },
      {
        title: 'LEED, ESG ratings, and green certification requirements',
        body: `International hotel chains (Marriott, Hilton, Accor), multinational corporations renting office space, and institutional real estate investors increasingly require ESG documentation and green building credentials. Solar energy with I-REC certificates directly supports LEED certification, Green Building Council ratings, and Scope 2 emissions reporting required by corporate sustainability programmes. For commercial properties seeking international tenants, green certification is transitioning from a competitive differentiator to a baseline requirement. Installing now positions your property ahead of this curve.`,
        stat: 'Egypt C&I solar: 29% CAGR to 2030. Commercial operators are already moving ahead of compliance requirements.',
      },
      {
        title: 'Increase property value and rental income permanently',
        body: `A commercial building with a solar system is an energy-independent asset: it carries 20+ years of below-market electricity built in. This translates to lower service charges for tenants, higher net operating income for the owner, faster lease-up versus comparable buildings, and a higher transaction valuation. In a market where commercial electricity costs have increased 40–50% in one year and are scheduled to rise again, an energy-efficient building is increasingly differentiated. Solar is now disclosed as a feature — not an afterthought — in premium commercial property listings.`,
        stat: 'Lower service charges → higher net rent → higher NOI → higher asset valuation. 25-year effect.',
      },
      {
        title: 'Net metering: the grid credits your surplus at your top rate',
        body: `Under Egypt's net metering scheme, surplus solar generation exported to the grid is credited at your own tariff bracket rate — currently EGP 2.33/kWh for large commercial users. This is not a discounted feed-in rate: it is your own consumption rate. For buildings with weekend or off-hours closures, a slight system oversize generates export credits during those periods that offset weekday peak consumption. Grid connection fees for systems up to 500 kW were waived from March 2024, materially improving the upfront economics.`,
        stat: 'Net metering: surplus credited at EGP 2.33/kWh (own tariff rate). Grid connection fees waived ≤500 kW.',
      },
      {
        title: 'Add EV charging infrastructure — a new revenue stream as Egypt\'s fleet electrifies',
        body: `Egypt's electric vehicle market reached USD 10.2 billion in 2024 and is projected to double to USD 20 billion by 2030, growing at 12% annually. The government is providing tax incentives, import duty waivers, and buyer subsidies to accelerate EV adoption. Today there are only 68 public charging stations nationally — almost all in Cairo and Alexandria — against a planned target of 1,000+. Commercial properties that install solar-powered EV charging stations now are positioned ahead of a infrastructure scarcity that will persist for years. For hotels, EV charging is a guest amenity that generates 5-star differentiation. For malls, it extends dwell time while customers charge. Solar provides the energy at near-zero marginal cost — you charge drivers at commercial rates and pocket the spread.`,
        stat: `Egypt EV market: USD 10.2B (2024) → USD 20B (2030). Only 68 public charging stations nationwide. Infrastructure scarcity = first-mover advantage.`,
      },
      {
        title: 'Protect cold chain and prevent food spoilage liability during outages',
        body: `For commercial kitchens, hotel F&B operations, supermarkets, food courts, and hospital catering, a 2-hour power outage can cause EGP 10,000–50,000 in spoiled perishables — compulsory disposal, re-ordering delays, and potential food safety compliance violations. Egypt's Food Safety Law (Law 1/2017) places liability on food operators who cannot demonstrate unbroken cold chain maintenance. Solar-plus-battery storage sized for refrigeration and cold storage keeps food safety compliance intact during outages and eliminates spoilage losses that recur every time the grid fails. For hotel kitchens and large food service operations, this financial protection can justify the battery investment independently of the electricity savings.`,
        stat: `Egypt Food Safety Law (Law 1/2017): cold chain failure = operator liability. Outage cost: EGP 10K–50K in spoilage per event.`,
      },
      {
        title: 'Four layers of government incentives reduce your effective project cost — and green financing is available through your bank today',
        body: `Commercial solar projects in Egypt benefit from a stacked incentive structure that materially reduces the effective cost before payback begins. (1) Customs duty: Presidential Decree 419/2018 applies a flat 2% import tariff on all solar and renewable energy equipment — versus 10–40% standard rates on commercial capital equipment. (2) Sales tax: capped at 5% on renewable energy hardware, versus up to 10% standard. (3) Profit tax deduction: Investment Law 72/2017 grants a 30% deduction of net taxable profits for the first seven years of a qualifying renewable energy project — materially reducing your corporate tax burden through the entire loan repayment period. (4) Green financing access: The EBRD Global Energy Efficiency Finance (GEFF) programme is active through ALEXBANK and Crédit Agricole Egypt, offering structured financing for commercial renewable projects with a completion incentive grant paid upon verified installation. CIB has committed USD 300M+ to renewable projects backed by IFC. NBE runs a EUR 100M EBRD-backed corporate green facility. These are not future commitments — they are operating programmes accessible through your existing bank relationship. The grid connection fee waiver for systems ≤500 kW (since March 2024) and the licensing exemption for the same size bracket remove two further cost and approval barriers relevant to most commercial rooftop projects. A commercial building owner who structures the project correctly can receive below-market financing, reduce purchase cost through duty and tax advantages, and collect a verified completion grant on top.`,
        stat: 'GEFF through ALEXBANK + Crédit Agricole: completion grant on verified installation. Customs 2% flat. Investment Law 72/2017: 30% × 7yr profit tax deduction.',
      },
    ],
    objections: [
      {
        q: '"We rent the building — the landlord would need to agree."',
        a: `Two structures work for rented properties. First, the landlord installs the system (their capex, their asset) and passes savings to the tenant as reduced service charges — both parties benefit, and the landlord's property value increases. Second, a tenant-owned system on a bolt-mounted, no-penetration frame can move with the tenant if needed, with landlord consent. The conversation with the landlord is simpler than it sounds: a solar system increases the building's value, reduces vacancy risk, and costs the landlord nothing if the tenant bears the capex. We can prepare the economic case for that conversation.`,
      },
      {
        q: '"Our roof is too small or has too much equipment on it."',
        a: `A site survey determines the exact usable area — HVAC units, water tanks, and access paths are excluded. Modern high-efficiency panels (430–450 Wp) require less space per kWp than older equipment. Car park canopies and facade-mounted systems are alternatives when rooftop space is limited. A partial installation on whatever is available still provides meaningful savings on the highest-cost consumption. We do not need the whole roof — we design around what exists.`,
      },
      {
        q: '"Solar panels will affect the aesthetics of the building."',
        a: `Standard commercial mounting on flat rooftops uses low-profile frames that sit 15–20 cm above the surface — typically invisible from street level. There are no penetrations with ballasted (concrete block anchor) mounting systems. For architecturally sensitive buildings or recent roof renovations, ballasted mounting requires no roof penetrations and leaves no trace if removed. For buildings where visibility matters, we design the layout to keep panels behind parapet walls. The appearance concern is a siting and design decision, not a constraint.`,
      },
      {
        q: '"Our consumption is mostly at night — solar won\'t cover it."',
        a: `This applies mainly to hotels and 24-hour operations. The hybrid design works as follows: solar covers daytime consumption — check-in, conference rooms, restaurants, pool, laundry — and exports surplus under net metering. The accumulated credits offset nighttime grid bills on the monthly reconciliation. Even 40–50% daytime self-consumption dramatically reduces total annual electricity cost at EGP 2.33/kWh. Battery storage extends solar coverage into evening hours for the highest-priority loads, such as kitchen and lobby, further reducing the night grid draw.`,
      },
      {
        q: '"We just renovated — we don\'t want to risk the roof."',
        a: `Ballasted mounting systems use concrete block anchors with zero roof penetrations — the industry standard for flat commercial rooftops with new waterproofing membranes. No penetrations means no warranty void risk on your roof membrane. The system can be lifted and removed cleanly if needed. We review your roof specification with your building contractor before any mounting decision and, if needed, work around areas with sensitive membrane or recent waterproofing to respect the renovation investment.`,
      },
      {
        q: '"What about fire safety — solar on the roof adds risk."',
        a: `Fire safety is a legitimate concern that has driven specific regulatory development in Egypt and internationally. Egyptian regulations require smoke detectors at battery locations, IEC 62619 compliance for battery systems, and battery capacity limits (cannot exceed 20% of generation plant capacity). Modern solar installations are equipped with rapid shutdown devices that de-energise all DC conductors within 30 seconds of activation — the standard response for firefighter safety. DC isolators and safety labelling on all disconnect points are mandatory under NREA Article 5 for all commissioned installations. The inverter is the primary electrical component and is the most monitored and protected element in the system. Any compliant NREA installation includes a full electrical safety design reviewed and approved by DISCO before grid connection. We can share our fire safety installation standard documentation on request.`,
      },
    ],
  },

  // ── 5. RESIDENTIAL ───────────────────────────────────────────────────────────
  {
    id: 'residential',
    label: 'Residential',
    color: '#6b3fa0',
    badge: 'Villas · Large Apartments · Compounds · High-Consumption Households',
    tariff: 'EGP 1.95/kWh (351–650 kWh tier) · EGP 2.10/kWh (651–1,000) · EGP 2.23/kWh (1,000+ kWh)',
    typicalSize: '5–20 kWp',
    payback: '3–5 years',
    decisionMaker: 'Homeowner (direct) or Building Manager (compound)',
    angle: 'Lead with the electricity bill pain — it\'s the most immediate and emotional hook. Then pivot to never feeling another hike. Don\'t open with payback tables; open with "your bill has gone up 3 times in 2 years — and it\'s going up again."',
    context: `Egyptian residential users in the upper consumption tiers — villas and large apartments with central A/C, pools, and multiple units — pay EGP 1.95–2.23/kWh. The August 2024 tariff hike was particularly visible at the household level, generating widespread frustration. Target clients are high-consumption households (500+ kWh/month) in New Cairo, Sheikh Zayed, Madinaty, El Gouna, and North Coast compounds where summer bills regularly reach EGP 3,000–8,000/month. Net metering credits surplus at the household's own tariff rate, and Egypt averages 9–11 sunshine hours daily nationwide.`,
    keyStats: [
      { label: 'Residential tariff (1,000+ kWh)', value: 'EGP 2.23/kWh' },
      { label: 'Residential tariff (351–650 kWh)', value: 'EGP 1.95/kWh' },
      { label: 'Aug 2024 tariff hike (higher tiers)', value: '+~16%' },
      { label: '10 kWp monthly savings', value: '~EGP 3,000/month' },
      { label: 'Payback (10 kWp)', value: '~4–5 years' },
      { label: 'Net metering: surplus credited at', value: 'Own tariff rate' },
      { label: 'Egypt sunshine', value: '3,000 hours/year' },
      { label: 'Panel performance warranty', value: '25 years (Tier 1 manufacturers)' },
    ],
    valueProps: [
      {
        title: 'Never feel another electricity tariff hike — for 25 years',
        body: `Egyptian household electricity bills have increased multiple times in the past three years, with August 2024 delivering a 16% hike on upper residential tiers and the previous rounds adding further increases on top. The IMF subsidy reform agreement requires continued price increases through 2025–2026. A rooftop solar system produces electricity for 25 years at a fixed capital cost. Every future tariff hike means your solar saves more — with zero additional spend. Families who installed 2–3 years ago are now saving significantly more than projected because tariffs exceeded the model. They locked in and left others to absorb the increases.`,
        stat: 'Tariff trajectory: multiple increases since 2022. IMF-mandated further increases scheduled through 2026.',
      },
      {
        title: 'A 10 kWp system saves ~EGP 3,000/month on a villa bill',
        body: `A 10 kWp rooftop system in Cairo generates approximately 1,300–1,500 kWh/month across the year — more in summer (1,500–1,700 kWh), less in winter (1,000–1,100 kWh). At EGP 2.23/kWh for a high-consumption household, this translates to EGP 2,900–3,400/month in direct bill savings, or approximately EGP 36,000–40,000/year. At an installed cost of roughly EGP 150,000–180,000 for a residential system, the payback period is 4–5 years. The following 20+ years of free electricity represent EGP 700,000–800,000 in savings at today's rates — more if tariffs rise further.`,
        stat: '10 kWp → ~EGP 36,000–40,000/year savings. Payback ~4–5 years. 20+ years of free electricity remaining.',
      },
      {
        title: 'Your home stays powered and cool during outages',
        body: `Scheduled power cuts affected residential areas across Egypt in 2023–2024 — up to 2+ hours daily during summer peak. For a family with children, this means no A/C during Egyptian summer heat, spoiled refrigerated food, interrupted studies, and disrupted routines. With solar-plus-battery storage sized for the typical 1–2 hour outage window, your home continues to run A/C, refrigerator, lighting, and Wi-Fi entirely independently. The battery system is designed specifically for Egypt's outage profile. This is the feature most families ask about first — and it is fully deliverable.`,
        stat: 'Scheduled 1–2 hour outages in residential areas confirmed in 2023–2024. Battery storage is sized for this window.',
      },
      {
        title: 'Install now before EGP devaluation makes panels more expensive',
        body: `Solar panels are manufactured internationally and priced in USD. With EGP at ~50/USD today and forecasts of 52–54/USD by end-2026, the EGP cost of the same solar system rises with every devaluation. Families who installed in 2020 paid roughly half the EGP price of today's equivalent system. Waiting to install means paying more EGP for the same hardware, while continuing to pay escalating tariffs in the meantime. The combination of USD-priced hardware and EGP-denominated savings means the best time to install is always now rather than later.`,
        stat: 'Panel costs: USD-denominated. EGP/USD: ~50 today → forecast 52–54 by end-2026.',
      },
      {
        title: 'Net metering: the grid becomes your free battery',
        body: `Under Egypt's net metering scheme, electricity you generate but don't immediately use is exported to the EETC grid and credited against your bill at your own tariff rate — currently EGP 2.23/kWh for high-consumption households. During school and work hours when the house is partially empty, your panels run the refrigerator, water heater, and pool pump, and export the rest. At night, you draw from the grid, but your daytime exports offset the cost. There is no waste — the surplus is stored as credits. Your grid connection becomes your free battery.`,
        stat: 'Net metering: surplus credited at own tariff rate (EGP 2.23/kWh). No discounted export — full value returned.',
      },
      {
        title: 'Increase your home\'s sale value and differentiation',
        body: `A villa with a solar system has a quantifiable, verifiable asset: 20+ years of free electricity remaining, documentable by system age and performance data. In Egypt's premium compound market — New Cairo, Sheikh Zayed, Madinaty, El Gouna, North Coast — energy-independent properties are increasingly differentiated, particularly as electricity costs have become a visible monthly household expense. Solar is now disclosed in property listings as a feature, not an afterthought. Buyers in these segments understand the value; sellers with solar have a concrete premium to negotiate from.`,
        stat: 'Energy-independent homes: lower monthly costs → faster sale → premium price. Quantifiable and documentable.',
      },
      {
        title: 'A 25-year manufacturer warranty from a global company — not our word',
        body: `Solar panels carry a 25-year performance warranty from the manufacturer — guaranteeing at least 80% of original output at year 25. This is a contractual obligation from global manufacturers (LONGi, JA Solar, JinkoSolar) with assets, reputations, and operations in dozens of countries. It is not a local installer's verbal promise. Inverters carry 5–10 year warranties and are the only component with a defined service life. There are zero moving parts in a solar panel. The main residential maintenance is cleaning twice a year (EGP 500–1,000 per session). Expected year-25 output: ~87.5% of original.`,
        stat: '25-year performance warranty: ≥80% output at year 25. Tier 1 manufacturers (LONGi, JA Solar, JinkoSolar).',
      },
      {
        title: 'Pool pump, water heater, and A/C run free — your biggest loads are daytime loads',
        body: `High-consumption villas in Egypt are dominated by three loads: air conditioning (40–60% of the summer bill), pool filtration pumps (running 8–10 hours daily), and water heating. All three run during daylight hours — a perfect match for direct solar consumption at zero marginal cost. A pool pump alone (typically 1.5–3 kW running 8–10 hours/day) consumes 12–30 kWh/day, representing EGP 800–2,000/month at EGP 2.23/kWh. A 15–20 kWp system on a large villa can power the pool pump, water heating, and multiple A/C units simultaneously during peak solar production hours — with surplus exported to the grid. The heaviest loads are also the best solar loads: predictable, daytime, and continuous.`,
        stat: 'Pool pump alone: 1.5–3 kW × 8–10 hrs = EGP 800–2,000/month. Solar covers it at zero marginal cost.',
      },
      {
        title: 'Bank financing available now — monthly payments structured to be offset by your bill savings from day one',
        body: `Residential solar does not require large upfront capital in Egypt. Specific financing products exist today. (1) CIB Solar Loan: Commercial International Bank offers a dedicated solar loan up to EGP 350,000 at 18% per year over up to 5 years. For a 10 kWp system costing EGP 150,000–180,000, the monthly loan repayment runs approximately EGP 3,500–4,500 — while the monthly electricity bill saving at EGP 2.23/kWh is approximately EGP 2,900–3,400. As tariffs increase further (scheduled under the IMF agreement), the savings grow while the loan payment stays fixed. By year 3–4, savings materially exceed the payment. From year 5 onward, the system is fully paid off and every month is free. (2) GEFF programme: The EBRD Global Energy Efficiency Finance programme is available to Egyptian households through ALEXBANK and Crédit Agricole Egypt. Eligible homeowners receive a completion grant on verified installation — an upfront subsidy that reduces effective purchase cost without any strings beyond proper documentation. This is an active programme, not a future commitment. (3) Hardware cost reduction: Presidential Decree 419/2018 applies a flat 2% customs duty on solar equipment — vs. 10–20% standard rates. The duty saving is built into the contractor's supply price; you benefit automatically without any administrative action. (4) No hidden approvals: Residential systems ≤500 kW require no operating license, and grid connection fees for these systems have been waived since March 2024. The regulatory path is clean, fast, and no longer carries the costs that historically delayed household installations.`,
        stat: 'CIB Solar Loan: up to EGP 350K, 18%, 5 years. GEFF completion grant via ALEXBANK + Crédit Agricole. No licensing ≤500 kW. Grid connection fee waived.',
      },
    ],
    objections: [
      {
        q: '"EGP 150,000+ is too expensive for us."',
        a: `Let's frame it as an asset purchase, not a utility bill. At EGP 3,000/month saved, EGP 150,000 is recovered in 4 years — and the system then runs for 21 more years, saving a cumulative EGP 756,000+ at today's rates (more if tariffs rise). Compare to a car: EGP 400,000–800,000, depreciates to zero in 10 years, requires ongoing fuel and maintenance. Solar costs EGP 150,000, appreciates in real terms as tariffs rise, and generates savings for 25 years. If upfront capital is the barrier, we can structure monthly payments through a home finance product that is lower than the monthly saving from day one.`,
      },
      {
        q: '"I\'m renting — it\'s not worth installing."',
        a: `For a long-term tenant (3+ years), the economics can still work through a portable ground-mount system (garden or terrace) that moves when you do. For a tenant in negotiation with the landlord, a solar system increases the property value significantly — many landlords are receptive when the economics are explained, because they bear no cost while you get the savings. Alternatively, raise it with your compound or building management: group buys across multiple units dramatically lower per-unit cost and make the conversation with landlord or management straightforward.`,
      },
      {
        q: '"Our compound or building management won\'t allow it."',
        a: `Most compound regulations were written before rooftop solar became mainstream and are silent on it rather than prohibiting it. We have experience presenting to compound technical committees: low-profile mounting profiles, zero penetrations, structural assessments, and the precedent of neighbouring compounds that have approved installations. We can engage the facilities manager directly with technical documentation. In several compounds, the first installation required our direct involvement in the approval process — and then became the standard for all subsequent residents.`,
      },
      {
        q: '"I heard solar systems fail in Egypt\'s heat."',
        a: `This is a common misconception. PV panels perform better in strong irradiation — more energy generated. High temperature does marginally reduce electrical efficiency (approximately -0.35% per °C above 25°C rated conditions), but this is factored into yield projections conservatively. Panels are rated to operate at surface temperatures up to 85°C and have been deployed for decades in Saudi Arabia, UAE, and Australia — hotter environments than Egypt — with documented 25+ year lifespans. High irradiation in Egypt is the reason solar economics are so good here, not a technical risk.`,
      },
      {
        q: '"What if we move?"',
        a: `If you own the property, the solar system is part of the real estate. It adds to the sale value and can be disclosed to buyers. If you move to another property you own, the system can be uninstalled and reinstalled — labor and transport runs approximately EGP 15,000–25,000 for a residential system, which is economically justified if significant savings years remain. If you are selling and the buyer is not interested in solar, the system sells as part of the property at a premium. No scenario results in the solar asset being worthless.`,
      },
      {
        q: '"The government might end net metering."',
        a: `Our residential system design targets maximum self-consumption during occupied hours — the core savings do not depend on net metering at all. An occupied villa in Cairo consumes electricity through the day: pool pump, water heater, refrigerator, EV charger, appliances on standby. A correctly sized system reaches 70–85% direct self-consumption, meaning most generation is used immediately. Net metering is valuable upside for the hours the house is empty — not the foundation of the economics. Even without it, a 10 kWp system on a high-consumption villa still saves EGP 2,000–2,500/month in direct self-consumption.`,
      },
      {
        q: '"Egyptian banks are offering 17–20% on savings certificates — why put money in solar?"',
        a: `A genuinely good question and the most Egypt-specific objection you will encounter. Three points that answer it directly. First, bank rates are falling. The CBE has been cutting the policy rate as inflation dropped from 36% (2023 peak) to ~12–15% (2025). NBE and Banque Misr cut savings certificate rates in May 2025 and will continue as inflation normalises. The 17–20% rates of 2024 will not persist. Solar's savings, by contrast, grow with every tariff increase — they are permanently inflation-indexed. Second, CD interest is taxable — withholding tax applies. Solar savings are tax-free: you are not taxed on electricity you did not buy. The after-tax effective CD yield is meaningfully below face rate. Third, solar and bank savings are not mutually exclusive. They serve different purposes: CDs are liquid financial instruments; solar is a 25-year physical asset that generates a non-financial return independent of banking sector conditions. A villa owner with excess capital should hold both. The question is not "which one" — it is recognising that solar fills a portfolio function no savings certificate can: energy independence that compounds for 25 years.`,
      },
    ],
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────────
const copyToClipboard = (text, setCopied, key) => {
  navigator.clipboard?.writeText(text).then(() => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }).catch(() => {});
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatGrid({ stats, color, copied, setCopied }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 6, margin: '12px 0' }}>
      {stats.map((s, i) => (
        <div
          key={i}
          onClick={() => copyToClipboard(`${s.label}: ${s.value}`, setCopied, `stat-${i}`)}
          title="Click to copy"
          style={{ background: '#f8f9fa', borderRadius: 5, padding: '8px 10px', cursor: 'pointer', border: `1px solid ${copied === `stat-${i}` ? color : '#e8e8e8'}`, transition: 'border-color .2s' }}
        >
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2, lineHeight: 1.3 }}>{s.label}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: copied === `stat-${i}` ? color : N }}>{copied === `stat-${i}` ? 'Copied!' : s.value}</div>
        </div>
      ))}
    </div>
  );
}

function VPCard({ vp, idx, color, expanded, onToggle, copied, setCopied }) {
  return (
    <div style={{ border: `1px solid ${expanded ? color : '#e8e8e8'}`, borderLeft: `4px solid ${color}`, borderRadius: 6, marginBottom: 8, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', gap: 12, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', alignItems: 'flex-start' }}
      >
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>
          {idx + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: N, lineHeight: 1.4 }}>{vp.title}</div>
          {!expanded && <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{vp.stat}</div>}
        </div>
        <span style={{ fontSize: 10, color: '#ccc', flexShrink: 0, paddingTop: 3 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 12, color: '#444', lineHeight: 1.65, margin: '12px 0 10px' }}>{vp.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: `${color}12`, borderLeft: `3px solid ${color}`, padding: '6px 10px', borderRadius: '0 4px 4px 0', flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 11, color, fontWeight: 700 }}>{vp.stat}</span>
            </div>
            <button
              onClick={() => copyToClipboard(`${vp.title}\n\n${vp.body}\n\nKey stat: ${vp.stat}`, setCopied, `vp-${idx}`)}
              style={{ padding: '5px 12px', background: copied === `vp-${idx}` ? color : '#f0f0f0', color: copied === `vp-${idx}` ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {copied === `vp-${idx}` ? 'Copied' : 'Copy script'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectionCard({ obj, idx, color, expanded, onToggle, copied, setCopied }) {
  return (
    <div style={{ border: `1px solid ${expanded ? '#C0392B' : '#e8e8e8'}`, borderLeft: '4px solid #C0392B', borderRadius: 6, marginBottom: 8, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={onToggle}
        style={{ width: '100%', display: 'flex', gap: 12, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', alignItems: 'flex-start' }}
      >
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#C0392B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>
          !
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#C0392B', lineHeight: 1.4 }}>{obj.q}</div>
        </div>
        <span style={{ fontSize: 10, color: '#ccc', flexShrink: 0, paddingTop: 3 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 12, color: '#444', lineHeight: 1.65, margin: '12px 0 10px' }}>{obj.a}</p>
          <button
            onClick={() => copyToClipboard(obj.a, setCopied, `obj-${idx}`)}
            style={{ padding: '5px 12px', background: copied === `obj-${idx}` ? '#C0392B' : '#f0f0f0', color: copied === `obj-${idx}` ? '#fff' : '#555', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied === `obj-${idx}` ? 'Copied' : 'Copy response'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export function SalesIntelView() {
  const [activeSeg, setActiveSeg] = useState('industrial');
  const [expandedVP, setExpandedVP] = useState({});
  const [expandedObj, setExpandedObj] = useState({});
  const [copied, setCopied] = useState(null);
  const [vpFilter, setVpFilter] = useState('all');

  const seg = SALES_INTEL.find(s => s.id === activeSeg);
  if (!seg) return null;

  const toggleVP  = i => setExpandedVP(e  => ({ ...e, [i]: !e[i] }));
  const toggleObj = i => setExpandedObj(e => ({ ...e, [i]: !e[i] }));

  const expandAllVP  = () => setExpandedVP(Object.fromEntries(seg.valueProps.map((_,i) => [i, true])));
  const collapseAllVP = () => setExpandedVP({});
  const expandAllObj  = () => setExpandedObj(Object.fromEntries(seg.objections.map((_,i) => [i, true])));
  const collapseAllObj = () => setExpandedObj({});

  const changeSegment = (id) => {
    setActiveSeg(id);
    setExpandedVP({});
    setExpandedObj({});
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 6, padding: '12px 16px', border: '1px solid #e0e0e0', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: N, marginBottom: 4 }}>Sales Intelligence</div>
        <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>
          Egypt-specific value propositions and objection responses, grounded in current tariff data, market conditions, and geopolitical context. All figures sourced from EgyptERA, IMF, IRENA, and Mordor Intelligence. Click any stat to copy it for use in a conversation.
        </div>
      </div>

      {/* Segment tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {SALES_INTEL.map(s => (
          <button
            key={s.id}
            onClick={() => changeSegment(s.id)}
            style={{ padding: '6px 14px', background: activeSeg === s.id ? s.color : '#f0f2f5', color: activeSeg === s.id ? '#fff' : '#555', border: activeSeg === s.id ? 'none' : '1px solid #e0e0e0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Segment header strip */}
      <div style={{ background: seg.color, borderRadius: 8, padding: '14px 16px', marginBottom: 12, color: '#fff' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '.3px', marginBottom: 4 }}>{seg.label}</div>
            <div style={{ fontSize: 10, opacity: .8, marginBottom: 8 }}>{seg.badge}</div>
            <div style={{ fontSize: 11, opacity: .9 }}>{seg.tariff}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Typical Size', val: seg.typicalSize },
              { label: 'Payback', val: seg.payback },
              { label: 'Decision Maker', val: seg.decisionMaker },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 9, opacity: .7, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opening angle coach card */}
      <div style={{ background: '#fffbeb', border: '1px solid #f0d060', borderLeft: `4px solid ${G}`, borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: G, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Opening Angle</div>
        <div style={{ fontSize: 12, color: '#5a4200', lineHeight: 1.55 }}>{seg.angle}</div>
      </div>

      {/* Context */}
      <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '12px 14px', marginBottom: 12, border: '1px solid #e8e8e8' }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Market Context</div>
        <p style={{ fontSize: 12, color: '#444', lineHeight: 1.65, margin: 0 }}>{seg.context}</p>
      </div>

      {/* Key stats */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Key Numbers — Click Any to Copy</div>
        <StatGrid stats={seg.keyStats} color={seg.color} copied={copied} setCopied={setCopied} />
      </div>

      {/* Value Propositions */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: N }}>Value Propositions</span>
            <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>{seg.valueProps.length} arguments</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={expandAllVP}  style={{ padding: '3px 10px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Expand All</button>
            <button onClick={collapseAllVP} style={{ padding: '3px 10px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Collapse All</button>
          </div>
        </div>
        {seg.valueProps.map((vp, i) => (
          <VPCard key={i} vp={vp} idx={i} color={seg.color} expanded={!!expandedVP[i]} onToggle={() => toggleVP(i)} copied={copied} setCopied={setCopied} />
        ))}
      </div>

      {/* Objection Handling */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, color: N }}>Objection Handling</span>
            <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>{seg.objections.length} common objections</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={expandAllObj}  style={{ padding: '3px 10px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Expand All</button>
            <button onClick={collapseAllObj} style={{ padding: '3px 10px', background: '#f0f2f5', color: '#555', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Collapse All</button>
          </div>
        </div>
        {seg.objections.map((obj, i) => (
          <ObjectionCard key={i} obj={obj} idx={i} color={seg.color} expanded={!!expandedObj[i]} onToggle={() => toggleObj(i)} copied={copied} setCopied={setCopied} />
        ))}
      </div>

      {/* Data sources footer */}
      <div style={{ marginTop: 20, padding: '10px 14px', background: '#f8f9fa', borderRadius: 6, border: '1px solid #e8e8e8' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Data Sources</div>
        <div style={{ fontSize: 10, color: '#aaa', lineHeight: 1.6 }}>
          Tariffs: EgyptERA official schedule, effective 1 September 2024 · Market growth: Mordor Intelligence Egypt Solar Market Report 2025 · Solar resource: IRENA Egypt Outlook; Global Solar Atlas · FX: CBE / Trading Economics; DevTech Systems forecast · Diesel LCOE: ResearchGate comparative analysis · Agricultural savings: IRENA; IFC · Subsidy reform: IMF Article IV / Stand-By Arrangement 2024 · Load shedding: MEES; DailyNewsEgypt 2023–2024 · Gas supply: S&P Global; Energy Intelligence
        </div>
      </div>
    </div>
  );
}
