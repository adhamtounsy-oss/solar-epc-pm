// Bill-of-Materials templates for standard Egypt residential/commercial PV systems
// Each item maps 1:1 to ProjectTracker procurement row shape

const item = (category, description, qty, unitEGP) => ({
  category, supplier: '', description, qty, unitEGP,
  quotedPriceEGP: String(qty * unitEGP),
  orderConfirmNumber: '', expectedDeliveryDate: '', iecCertStatus: 'pending',
});

export const BOM_TEMPLATES = [
  {
    id: 'bom_50',
    name: '50 kWp — Commercial Flat Roof',
    kWp: 50,
    items: [
      item('panels',    '400W Mono PERC Panel × 125 units',           125, 2800),
      item('inverters', '50 kW 3-Phase String Inverter',               1,  85000),
      item('mounting',  'Aluminium Ballast Rail System (50 kWp)',       1,  32000),
      item('dc',        'DC Cabling, Connectors & Combiner Box',        1,  12000),
      item('ac',        'AC Cable, Breakers & Protection Set',          1,  9000),
      item('other',     'Monitoring System & Remote Gateway',           1,  6000),
    ],
  },
  {
    id: 'bom_100',
    name: '100 kWp — Industrial / Large Commercial',
    kWp: 100,
    items: [
      item('panels',    '400W Mono PERC Panel × 250 units',            250, 2700),
      item('inverters', '100 kW 3-Phase String Inverter (or 2×50 kW)', 1,   160000),
      item('mounting',  'Aluminium Rail System (100 kWp)',              1,   60000),
      item('dc',        'DC Cabling, MC4 Connectors & String Boxes',   1,   20000),
      item('ac',        'AC Panel, Busbars & Protection',               1,   16000),
      item('other',     'Monitoring, Lightning Arrestors, Earthing',    1,   10000),
    ],
  },
  {
    id: 'bom_200',
    name: '200 kWp — Factory / Large Roof',
    kWp: 200,
    items: [
      item('panels',    '400W Mono PERC Panel × 500 units',            500, 2600),
      item('inverters', '200 kW 3-Phase Central Inverter (or 4×50)',   1,   310000),
      item('mounting',  'Aluminium Rail System (200 kWp)',              1,   110000),
      item('dc',        'DC Cabling, Combiner Boxes & Fuses',          1,   35000),
      item('ac',        'MDB, AC Cables & Protection',                  1,   28000),
      item('other',     'SCADA/Monitoring, Earthing, Lightning',        1,   18000),
    ],
  },
  {
    id: 'bom_500',
    name: '500 kWp — Utility / Ground Mount',
    kWp: 500,
    items: [
      item('panels',    '550W Mono Bifacial Panel × 910 units',        910, 3000),
      item('inverters', '500 kW Central Inverter (2×250 kW)',          1,   720000),
      item('mounting',  'Ground-Mount Galvanised Steel Structure',      1,   280000),
      item('dc',        'DC Trunk Cables, Junction Boxes & Fuses',     1,   80000),
      item('ac',        'MV Transformer, Switchgear & MDB',            1,   200000),
      item('other',     'SCADA, Meteorological Station, Earthing Grid', 1,  45000),
    ],
  },
];
