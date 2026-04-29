export const LABEL_COLORS = {
  'Critical Path': '#C0392B',
  'Revenue':       '#1E7E34',
  'Cash Flow':     '#D4770A',
  'Risk':          '#5C2D91',
  'Compliance':    '#1A6B72',
  'Setup':         '#555555',
  'Optional':      '#888888',
};

export const STATUS_COLORS = {
  'Todo':        '#555',
  'In Progress': '#1A6B72',
  'Done':        '#1E7E34',
  'Blocked':     '#C0392B',
};

export const WBS_META = {
  'WBS-1': 'Legal & Corporate',
  'WBS-2': 'Market Entry',
  'WBS-3': 'Sales & Acquisition',
  'WBS-4': 'Technical Capability',
  'WBS-5': 'Financial Control',
  'WBS-6': 'Project Execution',
  'WBS-7': 'Auxiliary Revenue',
  'NREA':  'NREA Compliance',
};

export const KANBAN_COLS = [
  { id: 'backlog',   label: 'Backlog' },
  { id: 'w1-2',     label: 'Week 1–2' },
  { id: 'w3-4',     label: 'Week 3–4' },
  { id: 'month2',   label: 'Month 2' },
  { id: 'month3',   label: 'Month 3' },
  { id: 'execution',label: 'Execution' },
  { id: 'done',     label: 'Completed' },
];

export const ALL_LABELS  = Object.keys(LABEL_COLORS);
export const ALL_STATUS  = ['Todo', 'In Progress', 'Done', 'Blocked'];
export const ALL_WBS     = Object.keys(WBS_META);

export const STORAGE_KEY = 'solar_epc_pm_v1';
