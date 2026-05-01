import { useState, useEffect, useCallback } from 'react';
import {
  generateTasks, pushTask, ensureLabels, validateTrelloConnection,
  syncCompletedCards, trelloGetBoardLists, trelloGetBoardCards, trelloGetBoardUrl,
  deduplicateBoardCards, migrateBoardLists, backfillAssigneeLabels,
  loadTaskQueue, saveTaskQueue, markTaskPushed, markTaskCompleted,
  taskToClipboard, TASK_TYPES, LIST_TARGETS, ROLE_LABELS, getTaskAssignees,
} from '../engine/trelloEngine';

// ── Storage ────────────────────────────────────────────────────────────────────
const LS_CFG = 'trello_config_v1';
const loadCfg = () => { try { const s = localStorage.getItem(LS_CFG); if (s) return JSON.parse(s); } catch {} return null; };
const saveCfg = (c) => { try { localStorage.setItem(LS_CFG, JSON.stringify(c)); } catch {} };

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = { navy:'#0D2137', gold:'#C8991A', teal:'#1A6B72', red:'#C0392B', green:'#1E7E34', amber:'#856404' };
const INP = { border:'1px solid #dde1e7', borderRadius:4, padding:'7px 10px', fontSize:12, fontFamily:'inherit', color:C.navy, width:'100%', boxSizing:'border-box' };
const BTN = (bg, color='#fff') => ({ padding:'7px 14px', background:bg, color, border:'none', borderRadius:4, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.3px', whiteSpace:'nowrap' });

const PRIORITY_COLOR = { critical:C.red, high:C.amber, medium:C.teal, low:'#aaa' };
const PRIORITY_BG    = { critical:'#fff5f5', high:'#fff3cd', medium:'#e8f8f9', low:'#f5f5f5' };

const Tag = ({ label, color, bg }) => (
  <span style={{ fontSize:9, fontWeight:900, letterSpacing:'.7px', textTransform:'uppercase',
    color, background:bg||'#f5f5f5', borderRadius:3, padding:'2px 6px', whiteSpace:'nowrap' }}>
    {label}
  </span>
);

// ── Setup Form ─────────────────────────────────────────────────────────────────
const SetupForm = ({ onConfigured }) => {
  const [apiKey, setApiKey]   = useState('');
  const [token, setToken]     = useState('');
  const [boardId, setBoardId] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError]     = useState('');

  const test = async () => {
    if (!apiKey || !token || !boardId) { setError('All three fields are required.'); return; }
    setTesting(true); setError('');
    const result = await validateTrelloConnection({ apiKey, apiToken: token, boardId });
    setTesting(false);
    if (result.ok) {
      const cfg = { apiKey, apiToken: token, boardId, lists: result.lists, listMapping: {}, labelMapping: {} };
      saveCfg(cfg);
      onConfigured(cfg);
    } else {
      setError(result.error || 'Connection failed. Check your credentials and board ID.');
    }
  };

  return (
    <div style={{ background:'#fff', borderRadius:8, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.09)', border:`1px solid #dde1e7` }}>
      <div style={{ fontSize:12, fontWeight:900, color:C.navy, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4 }}>
        Connect Trello Board
      </div>
      <div style={{ fontSize:11, color:'#888', marginBottom:16, lineHeight:1.5 }}>
        Trello is the execution layer. Decisions become cards. Tasks drive action.
      </div>

      <div style={{ background:'#f8f9fa', borderRadius:6, padding:'10px 14px', marginBottom:16, fontSize:11, color:'#555', lineHeight:1.7 }}>
        <b>Setup (2 minutes):</b><br/>
        1. Get your API Key → <code style={{background:'#eee',padding:'1px 4px',borderRadius:2}}>trello.com/app-key</code><br/>
        2. Click "Token" on that page to generate a token<br/>
        3. Get Board ID from your board URL: <code style={{background:'#eee',padding:'1px 4px',borderRadius:2}}>trello.com/b/<b>BOARD_ID</b>/name</code>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
        {[
          { label:'API Key', val:apiKey, set:setApiKey, ph:'abcdef1234...' },
          { label:'API Token', val:token, set:setToken, ph:'0123456789abcdef...' },
          { label:'Board ID', val:boardId, set:setBoardId, ph:'abc123XY' },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{label}</div>
            <input style={INP} value={val} onChange={e=>set(e.target.value)} placeholder={ph} />
          </div>
        ))}
      </div>

      {error && (
        <div style={{ fontSize:11, color:C.red, background:'#fff5f5', borderRadius:4, padding:'8px 10px', marginBottom:10, lineHeight:1.4 }}>
          {error}
        </div>
      )}

      <button onClick={test} disabled={testing} style={{ ...BTN(C.navy), opacity: testing ? .6 : 1 }}>
        {testing ? 'Testing connection...' : 'Connect Trello Board'}
      </button>
    </div>
  );
};

// ── List Mapper ────────────────────────────────────────────────────────────────
const ListMapper = ({ config, onSave }) => {
  const [mapping, setMapping] = useState(config.listMapping || {});
  const lists = config.lists || [];

  const setMap = (target, listId) => setMapping(p => ({ ...p, [target]: listId }));
  const allMapped = Object.keys(LIST_TARGETS).every(k => mapping[k]);

  return (
    <div style={{ background:'#fff', borderRadius:8, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.09)', border:`1px solid ${C.gold}` }}>
      <div style={{ fontSize:12, fontWeight:900, color:C.navy, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4 }}>
        Map Trello Lists
      </div>
      <div style={{ fontSize:11, color:'#888', marginBottom:14 }}>
        Tell the system which Trello list maps to each task destination.
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10, marginBottom:14 }}>
        {Object.entries(LIST_TARGETS).map(([key, { label }]) => (
          <div key={key}>
            <div style={{ fontSize:10, fontWeight:700, color:C.navy, marginBottom:4 }}>{label}</div>
            <select style={INP} value={mapping[key]||''} onChange={e=>setMap(key,e.target.value)}>
              <option value=''>— select list —</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button onClick={() => onSave(mapping)} disabled={!allMapped}
        style={{ ...BTN(allMapped ? C.teal : '#ccc'), opacity: allMapped ? 1 : .6 }}>
        Save List Mapping
      </button>
    </div>
  );
};

// ── Ad-hoc Task Form ───────────────────────────────────────────────────────────
const EMPTY_FORM = { title:'', type:'SALES', priority:'high', listTarget:'this-week', dueInDays:'', description:'' };

const AdHocTaskForm = ({ onSubmit }) => {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState(EMPTY_FORM);
  const [busy, setBusy]   = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    await onSubmit({ ...form, dueInDays: form.dueInDays === '' ? null : Number(form.dueInDays) });
    setForm(EMPTY_FORM);
    setOpen(false);
    setBusy(false);
  };

  return (
    <div style={{ marginBottom:12 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ ...BTN(open ? '#e8f0fe' : C.navy, open ? C.navy : '#fff'), fontSize:11, padding:'6px 14px', border: open ? `1px solid ${C.navy}` : 'none' }}>
        {open ? '✕ Cancel' : '＋ Add Task'}
      </button>

      {open && (
        <div style={{ background:'#fff', border:`1px solid #dde1e7`, borderRadius:8,
          padding:16, marginTop:8, boxShadow:'0 2px 8px rgba(0,0,0,.07)' }}>

          {/* Title */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Title</div>
            <input style={INP} placeholder="e.g. Call supplier about panel pricing"
              value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>

          {/* Row: type / priority / list / due */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
            {[
              { label:'Type', key:'type', opts: Object.keys(TASK_TYPES).map(k => ({ v:k, l:TASK_TYPES[k].label })) },
              { label:'Priority', key:'priority', opts:[{v:'critical',l:'Critical'},{v:'high',l:'High'},{v:'medium',l:'Medium'},{v:'low',l:'Low'}] },
              { label:'List', key:'listTarget', opts: Object.entries(LIST_TARGETS).map(([k,v])=>({v:k,l:v.label})) },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{label}</div>
                <select style={INP} value={form[key]} onChange={e => set(key, e.target.value)}>
                  {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Due (days)</div>
              <input style={INP} type="number" min="0" placeholder="—"
                value={form.dueInDays} onChange={e => set('dueInDays', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Description (optional)</div>
            <textarea style={{ ...INP, resize:'vertical', minHeight:56 }} placeholder="Context, next steps, notes…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <button onClick={submit} disabled={busy || !form.title.trim()}
            style={{ ...BTN(form.title.trim() ? C.teal : '#ccc'), opacity: form.title.trim() ? 1 : .6 }}>
            {busy ? 'Pushing…' : '⬆ Push to Trello'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Task Card ──────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onPush, onCopy, onComplete, pushing, trelloReady }) => {
  const [expanded, setExpanded] = useState(false);
  const tc  = TASK_TYPES[task.type];
  const pc  = PRIORITY_COLOR[task.priority];
  const pb  = PRIORITY_BG[task.priority];
  const lt  = LIST_TARGETS[task.listTarget];
  const pri = ROLE_LABELS[task.assignees?.primary];
  const sec = ROLE_LABELS[task.assignees?.secondary];

  return (
    <div style={{ background:'#fff', borderRadius:6, border:`1px solid #eee`,
      borderLeft:`4px solid ${tc?.color||C.navy}`,
      opacity: task.completed ? .45 : 1 }}>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:5 }}>
              <Tag label={task.type} color={tc?.color||C.navy} bg={tc?.color+'22'} />
              <Tag label={task.priority.toUpperCase()} color={pc} bg={pb} />
              <Tag label={`→ ${lt?.label||task.listTarget}`} color='#888' bg='#f5f5f5' />
              {task.dueInDays != null && (
                <Tag label={task.dueInDays === 0 ? 'TODAY' : `${task.dueInDays}d`}
                  color={task.dueInDays <= 1 ? C.red : '#888'}
                  bg={task.dueInDays <= 1 ? '#fff5f5' : '#f5f5f5'} />
              )}
            </div>
            {(pri || sec) && (
              <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:5 }}>
                {pri && <Tag label={`👤 ${pri.label}`} color={pri.color} bg={pri.color+'18'} />}
                {sec && <Tag label={`👥 ${sec.label}`} color={sec.color} bg={sec.color+'12'} />}
              </div>
            )}
            <div style={{ fontSize:12, fontWeight:700, color: task.completed ? '#888' : C.navy,
              lineHeight:1.35, textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </div>
          </div>
          <button onClick={()=>setExpanded(v=>!v)}
            style={{ background:'none', border:'none', color:'#aaa', fontSize:16, cursor:'pointer', flexShrink:0, padding:'0 4px' }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop:8, fontSize:11, color:'#555', lineHeight:1.6,
            background:'#f8f9fa', borderRadius:4, padding:'8px 10px', whiteSpace:'pre-wrap' }}>
            {task.description}
          </div>
        )}

        {!task.completed && (
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            {task.pushed ? (
              <>
                <span style={{ fontSize:10, color:C.green, fontWeight:700 }}>✓ In Trello</span>
                <button onClick={()=>onComplete(task)}
                  style={{ ...BTN(C.green), fontSize:10, padding:'4px 10px' }}>
                  Mark Done
                </button>
              </>
            ) : trelloReady ? (
              <button onClick={()=>onPush(task)} disabled={pushing === task.id}
                style={{ ...BTN(pushing === task.id ? '#aaa' : C.navy), fontSize:10, padding:'4px 12px' }}>
                {pushing === task.id ? 'Pushing...' : '⬆ Push to Trello'}
              </button>
            ) : (
              <button onClick={()=>onCopy(task)}
                style={{ ...BTN('#f5f5f5', C.navy), fontSize:10, padding:'4px 10px', border:'1px solid #ddd' }}>
                Copy to clipboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Feedback Loop Panel ────────────────────────────────────────────────────────
const FeedbackPanel = ({ completedTasks, onUpdateCRM, leads }) => {
  const pending = completedTasks.filter(t => t.onComplete?.crmNextStage && !t.feedbackApplied);
  if (pending.length === 0) return null;

  return (
    <div style={{ background:'#e8f5e9', borderRadius:8, border:`1px solid #a3d9a5`, padding:'12px 14px' }}>
      <div style={{ fontSize:11, fontWeight:900, color:C.green, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>
        Trello → CRM Feedback
      </div>
      {pending.map(t => {
        const lead = leads?.find(l => l.id === t.onComplete.crmLeadId);
        if (!lead) return null;
        return (
          <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'6px 0', borderBottom:'1px solid #c3e6cb', gap:12 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{lead.orgName}</div>
              <div style={{ fontSize:11, color:'#555' }}>
                Move to: <b>{t.onComplete.crmNextStage?.replace(/_/g,' ')}</b>
              </div>
            </div>
            <button onClick={() => onUpdateCRM(t, lead)}
              style={{ ...BTN(C.green), fontSize:10, padding:'4px 12px', flexShrink:0 }}>
              Apply to CRM
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── MAIN TRELLO PANEL ──────────────────────────────────────────────────────────
export const TrelloPanel = ({ engineState, leads, onCRMUpdate }) => {
  const [config, setConfig]       = useState(() => loadCfg());
  const [taskQueue, setTaskQueue] = useState(() => loadTaskQueue());
  const [pushing, setPushing]     = useState(null);   // task.id currently being pushed
  const [syncing, setSyncing]     = useState(false);
  const [labelMap, setLabelMap]   = useState({ typeMap:{}, roleMap:{} });
  const [syncMsg, setSyncMsg]     = useState('');
  const [copied, setCopied]       = useState(null);
  const [filter, setFilter]       = useState('pending'); // 'pending' | 'pushed' | 'all'
  const [lastSynced, setLastSynced]   = useState(null);
  const [boardUrl, setBoardUrl]       = useState(null);
  const [deduping, setDeduping]       = useState(false);
  const [migrating, setMigrating]     = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const trelloReady = !!(
    config?.apiKey && config?.apiToken && config?.boardId &&
    Object.keys(config?.listMapping || {}).length >= Object.keys(LIST_TARGETS).length
  );

  // Generate pending tasks from current engine state
  const pendingTasks = engineState
    ? generateTasks(engineState, leads, taskQueue.filter(t => t.pushed))
    : [];

  // Merge pending with queue (tasks already pushed)
  // Backfill assignees on tasks loaded from localStorage (created before this feature)
  const withAssignees = (t) => t.assignees ? t : { ...t, assignees: getTaskAssignees(t) };

  const allTasks = [
    ...pendingTasks.map(withAssignees),
    ...taskQueue.filter(t => t.pushed && !pendingTasks.find(p => p.id === t.id)).map(withAssignees),
  ];

  const visibleTasks = allTasks.filter(t => {
    if (filter === 'pending') return !t.pushed && !t.completed;
    if (filter === 'pushed')  return t.pushed && !t.completed;
    return !t.completed;
  });

  const pushAll = async () => {
    const batch = pendingTasks.filter(pt => !pt.pushed);
    if (!batch.length) return;
    let lm = labelMap;
    if (Object.keys(lm.typeMap).length === 0) {
      lm = await ensureLabels(config);
      setLabelMap(lm);
    }
    // Fetch board cards once for the whole batch — dedup check reuses this
    let boardCards = null;
    try { boardCards = await trelloGetBoardCards(config); } catch { /* fall through to per-task fetch */ }
    for (const t of batch) {
      await handlePush(t, lm, boardCards);
    }
  };

  const handlePush = useCallback(async (task, existingLabelMap, boardCards) => {
    if (!trelloReady) { taskToClipboard(task); return; }
    setPushing(task.id);
    try {
      let lm = existingLabelMap ?? labelMap;
      if (Object.keys(lm.typeMap ?? {}).length === 0) {
        lm = await ensureLabels(config);
        setLabelMap(lm);
      }
      const cardId = await pushTask(config, task, config.listMapping, lm, boardCards ?? null);
      const next = [...taskQueue.filter(t => t.id !== task.id), { ...task, pushed: true, trelloCardId: cardId }];
      setTaskQueue(next);
      saveTaskQueue(next);
    } catch (e) {
      setSyncMsg(`Push failed: ${e.message}`);
    } finally {
      setPushing(null);
    }
  }, [config, taskQueue, labelMap, trelloReady]);

  const handleCopy = (task) => {
    taskToClipboard(task);
    setCopied(task.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSync = async () => {
    if (!trelloReady) return;
    setSyncing(true); setSyncMsg('');
    try {
      const completedCardIds = await syncCompletedCards(config);
      let updated = taskQueue;
      let count = 0;
      for (const cardId of completedCardIds) {
        const t = updated.find(t => t.trelloCardId === cardId && !t.completed);
        if (t) { updated = markTaskCompleted(updated, cardId); count++; }
      }
      setTaskQueue(updated);
      saveTaskQueue(updated);
      setLastSynced(Date.now());
      setSyncMsg(count > 0 ? `${count} task${count>1?'s':''} marked completed from Trello.` : 'No new completions.');
    } catch (e) {
      setSyncMsg(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Auto-sync every 2 minutes while the tab is visible
  useEffect(() => {
    if (!trelloReady) return;
    const tick = () => { if (!document.hidden) handleSync(); };
    const id = setInterval(tick, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [trelloReady, handleSync]);

  // Fetch board URL once when Trello becomes ready
  useEffect(() => {
    if (!trelloReady || boardUrl) return;
    trelloGetBoardUrl(config).then(b => setBoardUrl(b.shortUrl)).catch(() => {});
  }, [trelloReady, config, boardUrl]);

  const handleDedup = async () => {
    if (!trelloReady) return;
    setDeduping(true); setSyncMsg('');
    try {
      const count = await deduplicateBoardCards(config);
      setSyncMsg(count > 0 ? `Archived ${count} duplicate card${count > 1 ? 's' : ''}.` : 'No duplicates found.');
    } catch (e) {
      setSyncMsg(`Dedup failed: ${e.message}`);
    } finally {
      setDeduping(false);
    }
  };

  const handleMigrateLists = async () => {
    if (!trelloReady) return;
    setMigrating(true); setSyncMsg('');
    try {
      const { lists } = await migrateBoardLists(config);
      const updated = { ...config, lists };
      setConfig(updated);
      saveCfg(updated);
      setSyncMsg('Board lists renamed successfully.');
    } catch (e) {
      setSyncMsg(`Rename failed: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleAdHocSubmit = async (form) => {
    if (!trelloReady) return;
    const newTask = {
      id:          `adhoc-${Date.now()}`,
      title:       form.title.trim(),
      description: form.description.trim(),
      type:        form.type,
      priority:    form.priority,
      listTarget:  form.listTarget,
      dueInDays:   form.dueInDays,
      source:      'adhoc',
      sourceRef:   null,
      onComplete:  {},
      pushed:      false,
      trelloCardId:null,
      completed:   false,
      createdAt:   Date.now(),
    };
    newTask.assignees = getTaskAssignees(newTask);
    await handlePush(newTask);
  };

  const handleBackfill = async () => {
    if (!trelloReady) return;
    setBackfilling(true); setSyncMsg('');
    try {
      const count = await backfillAssigneeLabels(config);
      setSyncMsg(`Role labels applied to ${count} card${count !== 1 ? 's' : ''}.`);
    } catch (e) {
      setSyncMsg(`Backfill failed: ${e.message}`);
    } finally {
      setBackfilling(false);
    }
  };

  const handleApplyFeedback = (completedTask, lead) => {
    if (completedTask.onComplete?.crmNextStage) {
      onCRMUpdate(lead.id, completedTask.onComplete.crmNextStage);
    }
    const next = taskQueue.map(t =>
      t.id === completedTask.id ? { ...t, feedbackApplied: true } : t
    );
    setTaskQueue(next);
    saveTaskQueue(next);
  };

  const handleComplete = (task) => {
    const next = taskQueue.map(t => t.id === task.id ? { ...t, completed: true } : t);
    setTaskQueue(next);
    saveTaskQueue(next);
  };

  const handleConfigured = async (cfg) => {
    setConfig(cfg);
  };

  const handleListMappingSave = (mapping) => {
    const updated = { ...config, listMapping: mapping };
    setConfig(updated);
    saveCfg(updated);
  };

  const completedWithFeedback = taskQueue.filter(t => t.completed && t.onComplete?.crmNextStage && !t.feedbackApplied);

  const needsListMapping = config && (!config.listMapping || Object.keys(config.listMapping).length < Object.keys(LIST_TARGETS).length);
  const pendingCount   = pendingTasks.filter(t => !t.pushed).length;
  const pushedCount    = taskQueue.filter(t => t.pushed && !t.completed).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'1.2px', color:C.navy, marginBottom:2 }}>
            Trello Execution Layer
          </div>
          <div style={{ fontSize:11, color:'#888' }}>
            {trelloReady
              ? <>
                  Board connected · {pendingCount} tasks pending push · {pushedCount} in Trello
                  {boardUrl && (
                    <a href={boardUrl} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft:8, color:'#C8991A', textDecoration:'none', fontWeight:700 }}>
                      ↗ Open Board
                    </a>
                  )}
                </>
              : 'Not connected — connect Trello to push tasks'}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {trelloReady && (
            <>
              <button onClick={handleSync} disabled={syncing}
                style={{ ...BTN('#f5f5f5', C.navy), border:'1px solid #ddd', fontSize:10, padding:'5px 12px' }}>
                {syncing ? 'Syncing...' : lastSynced
                  ? `↻ Synced ${Math.round((Date.now() - lastSynced) / 60000) || '<1'} min ago`
                  : '↻ Sync from Trello'}
              </button>
              <button onClick={handleDedup} disabled={deduping}
                style={{ ...BTN('#f5f5f5', '#c0392b'), border:'1px solid #ddd', fontSize:10, padding:'5px 12px' }}>
                {deduping ? 'Cleaning...' : '⊘ Clean Duplicates'}
              </button>
              <button onClick={handleMigrateLists} disabled={migrating}
                style={{ ...BTN('#f5f5f5', '#5C2D91'), border:'1px solid #ddd', fontSize:10, padding:'5px 12px' }}>
                {migrating ? 'Renaming...' : '✎ Rename Lists'}
              </button>
              <button onClick={handleBackfill} disabled={backfilling}
                style={{ ...BTN('#f5f5f5', '#1A6B72'), border:'1px solid #ddd', fontSize:10, padding:'5px 12px' }}>
                {backfilling ? 'Applying...' : '⬛ Apply Role Labels'}
              </button>
              {pendingCount > 0 && (
                <button onClick={pushAll}
                  style={{ ...BTN(C.navy), fontSize:10, padding:'5px 12px' }}>
                  ⬆ Push All ({pendingCount})
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status message */}
      {syncMsg && (
        <div style={{ fontSize:11, color:C.teal, background:'#e8f8f9', borderRadius:4,
          padding:'6px 10px', marginBottom:10 }}>
          {syncMsg}
        </div>
      )}

      {/* Setup flow */}
      {!config && <SetupForm onConfigured={handleConfigured} />}
      {config && needsListMapping && <ListMapper config={config} onSave={handleListMappingSave} />}

      {/* Feedback loop */}
      {completedWithFeedback.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <FeedbackPanel completedTasks={completedWithFeedback} onUpdateCRM={handleApplyFeedback} leads={leads} />
        </div>
      )}

      {/* Ad-hoc task creator */}
      {trelloReady && <AdHocTaskForm onSubmit={handleAdHocSubmit} />}

      {/* Task list */}
      {(config) && (
        <>
          {/* Filter tabs */}
          <div style={{ display:'flex', gap:2, marginBottom:10 }}>
            {[
              { key:'pending', label:`Pending (${pendingTasks.filter(t=>!t.pushed).length})` },
              { key:'pushed',  label:`In Trello (${pushedCount})` },
              { key:'all',     label:'All' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding:'5px 12px', background: filter===f.key ? C.navy : '#f5f5f5',
                  color: filter===f.key ? '#fff' : '#555', border:'none', borderRadius:4,
                  fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                {f.label}
              </button>
            ))}
          </div>

          {visibleTasks.length === 0 ? (
            <div style={{ fontSize:12, color:'#aaa', textAlign:'center', padding:'16px 0',
              fontStyle:'italic' }}>
              {filter === 'pending' ? 'No pending tasks — all pushed to Trello or no tasks generated.' : 'No tasks in this view.'}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {visibleTasks.map(t => (
                <TaskCard key={t.id} task={t}
                  onPush={handlePush} onCopy={handleCopy}
                  onComplete={handleComplete} pushing={pushing}
                  trelloReady={trelloReady}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
