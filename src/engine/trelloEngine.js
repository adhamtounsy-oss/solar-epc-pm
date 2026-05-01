// ─── TRELLO EXECUTION ENGINE ──────────────────────────────────────────────────
// The brain (fosEngine) produces decisions → this layer converts them to Trello
// cards. It also syncs completed cards back to update CRM + system state.
//
// Architecture:
//   fosEngine output → generateTasks() → task queue
//   task queue + user click → pushToTrello()
//   Trello webhook/poll → syncCompletedTasks() → CRM + state updates

const TRELLO_BASE = 'https://api.trello.com/1';

// ── Task type definitions ─────────────────────────────────────────────────────

export const TASK_TYPES = {
  SALES:      { label:'Sales',      color:'#1E7E34', trelloColor:'green'  },
  TECHNICAL:  { label:'Technical',  color:'#1A6B72', trelloColor:'sky'    },
  COMPLIANCE: { label:'Compliance', color:'#856404', trelloColor:'orange' },
  EXECUTION:  { label:'Execution',  color:'#5C2D91', trelloColor:'purple' },
  HIRING:     { label:'Hiring',     color:'#C0392B', trelloColor:'red'    },
};

export const LIST_TARGETS = {
  'this-week':   { label:'This Week',   priority: 1 },
  'in-progress': { label:'In Progress', priority: 0 },
  'backlog':     { label:'Backlog',     priority: 2 },
};

// ── Task schema factory ────────────────────────────────────────────────────────

const task = (id, title, desc, type, priority, listTarget, dueInDays, source, sourceRef, onComplete = {}) => ({
  id,
  title,
  description: desc,
  type,
  priority,
  listTarget,   // 'this-week' | 'in-progress' | 'backlog'
  dueInDays,
  source,       // 'crm' | 'decision' | 'hiring' | 'compliance'
  sourceRef,    // lead.id | decision.id | etc.
  onComplete,   // { crmLeadId, crmNextStage, fosStateUpdate }
  pushed:       false,
  trelloCardId: null,
  completed:    false,
  createdAt:    Date.now(),
});

// ── Next CRM stage map ────────────────────────────────────────────────────────

const NEXT_STAGE = {
  site_visit_scheduled:  'site_visit_completed',
  site_visit_completed:  'feasibility_proposed',
  feasibility_proposed:  'feasibility_sold',
  feasibility_sold:      'feasibility_delivered',
  feasibility_delivered: 'proposal_sent',
  proposal_sent:         'negotiation',
  negotiation:           'won',
};

// ── TASK GENERATION ────────────────────────────────────────────────────────────
// Takes fosEngine output + raw leads → returns array of pending tasks
// Only generates tasks that don't already exist in the pushed queue

export const generateTasks = (engineState, leads, pushedTasks = []) => {
  const tasks  = [];
  const pushed = new Set(pushedTasks.map(t => t.id));

  const add = (t) => { if (!pushed.has(t.id)) tasks.push(t); };

  const { day, crm, compliance, hiring, primaryDecision, mode } = engineState;

  // ── 1. CRM-driven tasks (per lead stage) ──────────────────────────────────

  for (const lead of leads) {
    const name  = lead.orgName || lead.id;
    const value = lead.dealValue ? ` (EGP ${Number(lead.dealValue).toLocaleString()})` : '';
    const kw    = lead.systemSizeKW ? ` · ${lead.systemSizeKW}kW` : '';

    if (lead.stage === 'site_visit_scheduled') {
      add(task(
        `crm-visit-${lead.id}`,
        `Site visit — ${name}`,
        `Conduct qualifying site visit.\nSystem: ${lead.systemSizeKW || '?'}kW${value}.\nBring: meter, photos, load data request, roof assessment form.\nGoal: confirm system size, shading, roof access, decision maker present.`,
        'SALES', 'high', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'site_visit_completed' }
      ));
    }

    if (lead.stage === 'site_visit_completed') {
      add(task(
        `crm-propose-fs-${lead.id}`,
        `Propose paid feasibility study — ${name}`,
        `Site visit done. Follow up within 48h.\nPropose feasibility study: EGP 3,000–5,000.\nPosition as credit against EPC contract.\nCollect payment before analysis starts.`,
        'SALES', 'high', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_proposed' }
      ));
    }

    if (lead.stage === 'feasibility_sold') {
      add(task(
        `crm-deliver-fs-${lead.id}`,
        `Deliver feasibility study — ${name}`,
        `Feasibility deposit received. Deliver within 14 days.\nSystem: ${lead.systemSizeKW || '?'}kW${value}.\nInclude: PVsyst simulation, yield estimate, payback period, FX clause notice.\nDeliver IN PERSON — not by email. Push EPC proposal in same meeting.`,
        'TECHNICAL', 'critical', 'in-progress', 14, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'feasibility_delivered' }
      ));
    }

    if (lead.stage === 'feasibility_delivered') {
      add(task(
        `crm-proposal-${lead.id}`,
        `Send EPC proposal — ${name}`,
        `Feasibility delivered. Send EPC proposal within 48h.\nDeal value: ${value}.\nMust include:\n• FX escalation clause\n• 30% deposit requirement\n• BOM with IEC-certified equipment\n• Performance guarantee`,
        'SALES', 'critical', 'this-week', 2, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'proposal_sent' }
      ));
    }

    if (lead.stage === 'proposal_sent') {
      add(task(
        `crm-followup-prop-${lead.id}`,
        `Follow up on EPC proposal — ${name}`,
        `Proposal sent. Follow up 2×/week.\nStrategy: in-person meeting to present irradiance model.\nObjection: address technical concerns with engineer present.\nDeadline: if no response in 10 days, invoke 48h FX validity notice.`,
        'SALES', 'high', 'this-week', 5, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'negotiation' }
      ));
    }

    if (lead.stage === 'negotiation') {
      add(task(
        `crm-close-${lead.id}`,
        `Close contract — ${name}${value}`,
        `Active negotiation.\nBook in-person meeting this week.\nBring: signed contract template, deposit invoice, FX clause explanation.\nFloor: 30% deposit (25% absolute minimum for deals >EGP 1.5M).\nWalk away if deposit refused.`,
        'SALES', 'critical', 'this-week', 3, 'crm', lead.id,
        { crmLeadId: lead.id, crmNextStage: 'won' }
      ));
    }

    if (lead.stage === 'won') {
      // Won generates multiple execution tasks
      add(task(
        `exec-deposit-${lead.id}`,
        `Collect 30% deposit — ${name}`,
        `Contract signed. Confirm deposit cleared before ANY equipment order.\nDo not proceed to procurement without cleared funds.\nIssue deposit invoice immediately.`,
        'EXECUTION', 'critical', 'in-progress', 2, 'crm', lead.id,
        { fosStateUpdate: { depositCollected: true } }
      ));
      add(task(
        `exec-disco-${lead.id}`,
        `Submit DISCO net-metering application — ${name}`,
        `Submit DISCO application same day deposit clears.\nGet reference number — track in CRM notes.\nRequires: system spec sheet, site plan, NREA certificate copy.`,
        'COMPLIANCE', 'critical', 'this-week', 1, 'crm', lead.id,
        { fosStateUpdate: { discoSubmitted: true } }
      ));
      add(task(
        `exec-procure-${lead.id}`,
        `Place equipment order — ${name}`,
        `Only after deposit cleared.\nLead times: panels 3–4 weeks, inverters 2–3 weeks, BOS 1–2 weeks.\nCollect IEC certificates with every order.\nLock panel price within 72h of contract signature.`,
        'EXECUTION', 'critical', 'backlog', 3, 'crm', lead.id,
        {}
      ));
    }

    // Overdue follow-ups regardless of stage
    if (lead.nextFollowUp && lead.nextFollowUp < new Date().toISOString().split('T')[0] &&
        !['won','lost','nurture'].includes(lead.stage)) {
      const id = `crm-overdue-${lead.id}`;
      if (!pushed.has(id)) {
        add(task(
          id,
          `Follow up — ${name} [OVERDUE]`,
          `Follow-up is overdue.\nNext action: ${lead.nextAction || 'contact lead'}.\nStage: ${lead.stage.replace(/_/g,' ')}.`,
          'SALES', 'high', 'this-week', 0, 'crm', lead.id,
          {}
        ));
      }
    }
  }

  // ── 2. Compliance-driven tasks ─────────────────────────────────────────────

  const compItems = compliance?.items || [];

  for (const item of compItems) {
    if (item.status === 'done') continue;

    if (item.id === 'C-BANK' && item.status !== 'done') {
      add(task(
        'comp-bank', 'Open corporate bank account (CIB or NBE Business)',
        'Required for client deposits and payments.\nBring: commercial register, articles of incorporation, 2 signatories.\nRequest: current account + overdraft facility EGP 200K–300K.',
        'COMPLIANCE', 'critical', 'this-week', 3, 'compliance', 'C-BANK',
        { fosStateUpdate: { bankAccountOpen: true } }
      ));
    }

    if (item.id === 'C-ENG' && item.status !== 'done') {
      add(task(
        'comp-eng-hire', 'Post senior engineer job — Wuzzuf + LinkedIn + Engineers Syndicate',
        `Post simultaneously on all 3 platforms today.\nRequirements: Grade B, Syndicate registered, PVsyst experience, grid-tie commissioning.\nSalary range: EGP 18,000–22,000/month.\nAsk for: CV + Syndicate card number + references.`,
        'HIRING', 'critical', 'this-week', 1, 'compliance', 'C-ENG',
        { fosStateUpdate: { engineerHired: false } } // update manually when hired
      ));
    }

    if (item.id === 'C-NREA' && item.status !== 'done') {
      add(task(
        'comp-nrea', 'Submit NREA Bronze qualification dossier',
        'Required for all DISCO connections. No certificate = no revenue.\nFee: EGP 5,000 (Bronze) + EGP 5,000 review.\nDocuments: commercial register, capital proof, engineer CV (Syndicate), equipment specs.\nSubmit paper + electronic to NREA Technical Affairs.',
        'COMPLIANCE', item.status === 'critical' ? 'critical' : 'high', 'this-week', 7, 'compliance', 'C-NREA',
        { fosStateUpdate: { nreaSubmitted: true } }
      ));
    }

    if (item.id === 'C-FX' && item.status !== 'done') {
      add(task(
        'comp-fx', 'Configure USD/EGP rate alert on XE.com',
        'Set ±5% monthly trigger → SMS to founder phone.\nAlso configure in banking app.\nRequired before sending any EPC proposal.',
        'COMPLIANCE', 'medium', 'this-week', 1, 'compliance', 'C-FX',
        { fosStateUpdate: { fxAlertActive: true } }
      ));
    }
  }

  // ── 3. Hiring-driven tasks ─────────────────────────────────────────────────

  for (const h of (hiring || [])) {
    if (!h.hire) continue;
    if (h.role.includes('Engineer') && h.urgency !== 'low') {
      const id = `hire-eng-${h.urgency}`;
      add(task(
        id,
        `Start hiring: ${h.role}`,
        `${h.reason}\n\nConditions: ${h.condition || 'See hiring panel.'}\n\nNext step: Post job ads today, shortlist in 48h, interview within 7 days.`,
        'HIRING', h.urgency === 'critical' ? 'critical' : 'high', 'this-week', 3, 'hiring', h.role,
        {}
      ));
    }
    if (h.role.includes('Technician') && h.urgency !== 'low') {
      add(task(
        'hire-tech', `Start hiring: ${h.role}`,
        `${h.reason}\n\nMust be DISCO-registered or under a registered subcontractor.`,
        'HIRING', 'high', 'backlog', 14, 'hiring', h.role,
        {}
      ));
    }
  }

  // ── 4. Decision-driven tasks ──────────────────────────────────────────────

  const decision = primaryDecision;
  if (decision && decision.urgency !== 'low') {
    const decId = `decision-${decision.id}`;
    if (!pushed.has(decId)) {
      const decTypeMap = {
        'HIRING':     'HIRING',
        'STRATEGY':   'SALES',
        'COMPLIANCE': 'COMPLIANCE',
        'CASH':       'EXECUTION',
        'COMMERCIAL': 'SALES',
        'SURVIVAL':   'EXECUTION',
      };
      add(task(
        decId,
        `DECISION: ${decision.question}`,
        `Urgency: ${decision.urgency.toUpperCase()}\n\nOption A: ${decision.options[0]?.label || ''}\n${decision.options[0]?.detail || ''}\n\nOption B: ${decision.options[1]?.label || ''}\n${decision.options[1]?.detail || ''}`,
        decTypeMap[decision.category] || 'EXECUTION',
        decision.urgency === 'critical' ? 'critical' : 'high',
        'this-week', 1, 'decision', decision.id,
        {}
      ));
    }
  }

  // Sort: in-progress critical first, then this-week critical, then by priority
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const listOrder = { 'in-progress': 0, 'this-week': 1, 'backlog': 2 };
  tasks.sort((a, b) => {
    const la = listOrder[a.listTarget] ?? 3;
    const lb = listOrder[b.listTarget] ?? 3;
    if (la !== lb) return la - lb;
    return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
  });

  return tasks;
};

// ── TRELLO API LAYER ──────────────────────────────────────────────────────────

const trelloReq = async (method, path, body, config) => {
  const sep = path.includes('?') ? '&' : '?';
  const url  = `${TRELLO_BASE}${path}${sep}key=${config.apiKey}&token=${config.apiToken}`;
  const opts  = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Trello ${method} ${path} → ${res.status}: ${txt.slice(0,100)}`);
  }
  return res.json();
};

export const trelloGetBoardLists = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/lists`, null, config);

export const trelloGetBoardLabels = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/labels`, null, config);

export const trelloGetBoardCards = (config) =>
  trelloReq('GET', `/boards/${config.boardId}/cards?filter=all&fields=id,name,desc,idList,labels,dueComplete,closed`, null, config);

export const trelloCreateLabel = (config, name, color) =>
  trelloReq('POST', `/boards/${config.boardId}/labels`, { name, color }, config);

export const trelloCreateCard = (config, { title, description, listId, labelIds, dueInDays }) => {
  const due = dueInDays != null
    ? new Date(Date.now() + dueInDays * 86400000).toISOString()
    : undefined;
  return trelloReq('POST', '/cards', {
    name: title, desc: description,
    idList: listId, idLabels: labelIds || [],
    due: due || null, pos: 'top',
  }, config);
};

// ── BOARD SETUP ───────────────────────────────────────────────────────────────
// Ensure required labels exist; return label-name → id map

export const ensureLabels = async (config) => {
  const existing = await trelloGetBoardLabels(config);
  const map = {};
  for (const l of existing) {
    if (l.name) map[l.name.toUpperCase()] = l.id;
  }
  const needed = Object.keys(TASK_TYPES);
  for (const typeName of needed) {
    if (!map[typeName]) {
      const created = await trelloCreateLabel(config, typeName, TASK_TYPES[typeName].trelloColor);
      map[typeName] = created.id;
    }
  }
  return map;
};

// ── PUSH TASK TO TRELLO ───────────────────────────────────────────────────────

export const pushTask = async (config, task, listMapping, labelMapping) => {
  const listId   = listMapping[task.listTarget];
  const labelId  = labelMapping[task.type];
  if (!listId) throw new Error(`No list mapped for target "${task.listTarget}"`);
  const card = await trelloCreateCard(config, {
    title:       task.title,
    description: task.description,
    listId,
    labelIds:    labelId ? [labelId] : [],
    dueInDays:   task.dueInDays,
  });
  return card.id;
};

// ── SYNC COMPLETED CARDS ──────────────────────────────────────────────────────
// Returns array of completed card IDs from Trello

export const syncCompletedCards = async (config) => {
  const cards = await trelloGetBoardCards(config);
  return cards
    .filter(c => c.dueComplete || c.closed)
    .map(c => c.id);
};

// ── VALIDATE CONNECTION ────────────────────────────────────────────────────────

export const validateTrelloConnection = async (config) => {
  if (!config.apiKey || !config.apiToken || !config.boardId) {
    return { ok: false, error: 'Missing API key, token, or board ID.' };
  }
  try {
    const lists = await trelloGetBoardLists(config);
    return { ok: true, lists };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// ── localStorage helpers for pushed task queue ─────────────────────────────────

const LS_KEY = 'trello_task_queue_v1';

export const loadTaskQueue = () => {
  try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
  return [];
};

export const saveTaskQueue = (queue) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(queue)); } catch {}
};

export const markTaskPushed = (queue, taskId, cardId) =>
  queue.map(t => t.id === taskId ? { ...t, pushed: true, trelloCardId: cardId } : t);

export const markTaskCompleted = (queue, cardId) =>
  queue.map(t => t.trelloCardId === cardId ? { ...t, completed: true } : t);

// ── Clipboard fallback (when Trello not configured) ────────────────────────────

export const taskToClipboard = (task) => {
  const text =
    `## ${task.title}\n\n` +
    `Type: ${task.type} | Priority: ${task.priority.toUpperCase()} | List: ${LIST_TARGETS[task.listTarget]?.label}\n\n` +
    task.description;
  navigator.clipboard?.writeText(text).catch(() => {});
};
