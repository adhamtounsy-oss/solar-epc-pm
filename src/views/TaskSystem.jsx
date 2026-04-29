import { useState } from 'react';
import { INIT_FOS_TASKS } from '../data/fosData';

const LS_KEY = 'solar_tasks_v2';
const load = () => { try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {} return null; };
const save = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };

const TYPE_COLOR = {
  revenue:    { color:'#1E7E34', bg:'#e8f5e9', label:'REVENUE' },
  critical:   { color:'#C0392B', bg:'#fff5f5', label:'CRITICAL' },
  compliance: { color:'#8E44AD', bg:'#f5eef8', label:'COMPLIANCE' },
  admin:      { color:'#555',    bg:'#f0f0f0', label:'ADMIN' },
};

const BUCKET_CONFIG = {
  active:   { label:'Active',   limit:5,  color:'#C8991A', sub:'Max 5 — executing now' },
  pipeline: { label:'Pipeline', limit:99, color:'#1A6B72', sub:'Queued for next sprint' },
  backlog:  { label:'Backlog',  limit:99, color:'#555',    sub:'Not yet actionable' },
};

export const TaskSystem = () => {
  const [tasks, setTasks] = useState(() => load() ?? INIT_FOS_TASKS);
  const [newTask, setNewTask] = useState('');
  const [addBucket, setAddBucket] = useState('active');
  const [addType, setAddType] = useState('revenue');

  const mut = (fn) => setTasks(prev => { const next = fn(prev); save(next); return next; });

  const toggleDone = (id) => mut(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const moveTo     = (id, bucket) => mut(ts => ts.map(t => t.id === id ? { ...t, bucket, done: false } : t));
  const remove     = (id) => mut(ts => ts.filter(t => t.id !== id));
  const reset      = () => { if (window.confirm('Reset task list to defaults?')) { mut(() => INIT_FOS_TASKS); } };

  const addNew = () => {
    if (!newTask.trim()) return;
    const id = `U-${Date.now()}`;
    mut(ts => [...ts, { id, name: newTask.trim(), type: addType, bucket: addBucket, done: false, dueDay: null }]);
    setNewTask('');
  };

  const buckets = ['active', 'pipeline', 'backlog'];

  return (
    <div style={{ maxWidth:1280, margin:'0 auto' }}>

      {/* Add task */}
      <div style={{ background:'#fff', borderRadius:8, padding:16, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.08)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:'1 1 240px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>New Task</div>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNew()}
            placeholder="Describe the task…"
            style={{ width:'100%', padding:'8px 10px', border:'1px solid #d0d5dd', borderRadius:4, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Type</div>
          <select value={addType} onChange={e => setAddType(e.target.value)}
            style={{ padding:'8px 10px', border:'1px solid #d0d5dd', borderRadius:4, fontSize:12, fontFamily:'inherit', color:'#1a1a1a' }}>
            {Object.entries(TYPE_COLOR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Bucket</div>
          <select value={addBucket} onChange={e => setAddBucket(e.target.value)}
            style={{ padding:'8px 10px', border:'1px solid #d0d5dd', borderRadius:4, fontSize:12, fontFamily:'inherit', color:'#1a1a1a' }}>
            {buckets.map(b => <option key={b} value={b}>{BUCKET_CONFIG[b].label}</option>)}
          </select>
        </div>
        <button onClick={addNew}
          style={{ padding:'8px 20px', background:'#0D2137', color:'#fff', border:'none', borderRadius:4, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Add Task
        </button>
        <button onClick={reset}
          style={{ padding:'8px 14px', background:'transparent', color:'#C0392B', border:'1px solid #C0392B', borderRadius:4, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
          Reset
        </button>
      </div>

      {/* 3-column board */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
        {buckets.map(bucket => {
          const bc = BUCKET_CONFIG[bucket];
          const bucketTasks = tasks.filter(t => t.bucket === bucket);
          const done = bucketTasks.filter(t => t.done).length;
          const overLimit = bucket === 'active' && bucketTasks.filter(t => !t.done).length > bc.limit;

          return (
            <div key={bucket} style={{ background:'#fff', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,.08)', overflow:'hidden' }}>
              {/* Column header */}
              <div style={{ background: bc.color, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:900, color:'#fff', letterSpacing:'.5px' }}>{bc.label.toUpperCase()}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.65)', marginTop:1 }}>{bc.sub}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{bucketTasks.length}</span>
                  {bucket === 'active' && (
                    <div style={{ fontSize:10, color: overLimit ? '#ffcccc' : 'rgba(255,255,255,.55)' }}>
                      {overLimit ? `⚠ OVER LIMIT` : `max ${bc.limit}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Over-limit warning */}
              {overLimit && (
                <div style={{ background:'#fff5f5', padding:'8px 12px', fontSize:11, color:'#C0392B', fontWeight:700, borderBottom:'1px solid #ffcccc' }}>
                  ⚠ Active tasks exceed max 5 — move lower-priority tasks to Pipeline
                </div>
              )}

              {/* Progress bar */}
              {bucketTasks.length > 0 && (
                <div style={{ padding:'8px 16px 0', fontSize:10, color:'#888' }}>
                  {done}/{bucketTasks.length} done
                  <div style={{ background:'#e8ecf0', borderRadius:3, height:4, marginTop:4, overflow:'hidden' }}>
                    <div style={{ width:`${done / bucketTasks.length * 100}%`, height:'100%', background: bc.color, transition:'width .3s' }} />
                  </div>
                </div>
              )}

              {/* Tasks */}
              <div style={{ padding:'8px 0' }}>
                {bucketTasks.length === 0 ? (
                  <div style={{ padding:'20px 16px', fontSize:12, color:'#bbb', fontStyle:'italic', textAlign:'center' }}>
                    {bucket === 'active' ? 'Add tasks from Pipeline to start executing' : 'Empty'}
                  </div>
                ) : bucketTasks.map(task => {
                  const tc = TYPE_COLOR[task.type] ?? TYPE_COLOR.admin;
                  const moveOptions = buckets.filter(b => b !== bucket);
                  return (
                    <div key={task.id} style={{ padding:'10px 14px', borderBottom:'1px solid #f5f5f5', opacity: task.done ? 0.5 : 1 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <input type="checkbox" checked={task.done} onChange={() => toggleDone(task.id)}
                          style={{ accentColor: bc.color, width:14, height:14, cursor:'pointer', marginTop:2, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', gap:5, marginBottom:4, flexWrap:'wrap' }}>
                            <span style={{ fontSize:9, fontWeight:900, color: tc.color, background: tc.bg, borderRadius:3, padding:'1px 6px', letterSpacing:'.5px' }}>{tc.label}</span>
                            {task.dueDay && <span style={{ fontSize:9, color:'#aaa' }}>Day {task.dueDay}</span>}
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#0D2137', lineHeight:1.45, textDecoration: task.done ? 'line-through' : 'none', wordBreak:'break-word' }}>
                            {task.name}
                          </div>
                        </div>
                      </div>
                      {/* Move + remove controls */}
                      <div style={{ display:'flex', gap:6, marginTop:8, paddingLeft:24 }}>
                        {moveOptions.map(b => (
                          <button key={b} onClick={() => moveTo(task.id, b)}
                            style={{ fontSize:10, padding:'2px 8px', background:'#f0f2f5', color:'#555', border:'1px solid #e0e3e8', borderRadius:3, cursor:'pointer', fontFamily:'inherit' }}>
                            → {BUCKET_CONFIG[b].label}
                          </button>
                        ))}
                        <button onClick={() => remove(task.id)}
                          style={{ fontSize:10, padding:'2px 8px', background:'#fff5f5', color:'#C0392B', border:'1px solid #ffcccc', borderRadius:3, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
