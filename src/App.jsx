import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY } from './constants';
import { INIT_TASKS } from './data/tasks';
import { INIT_RISKS } from './data/risks';
import { INIT_KPIS  } from './data/kpis';
import { KPIDash        } from './views/KPIDash';
import { KanbanView     } from './views/KanbanView';
import { TaskTableView  } from './views/TaskTableView';
import { ScheduleView   } from './views/ScheduleView';
import { WBSView        } from './views/WBSView';
import { ComplianceView } from './views/ComplianceView';
import { RiskView       } from './views/RiskView';
import { CharterView    } from './views/CharterView';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard'    },
  { id: 'kanban',     label: 'Kanban'       },
  { id: 'table',      label: 'Task Table'   },
  { id: 'schedule',   label: 'Schedule'     },
  { id: 'wbs',        label: 'WBS'          },
  { id: 'compliance', label: 'Compliance'   },
  { id: 'risks',      label: 'Risk Register'},
  { id: 'charter',    label: 'PMBOK Charter'},
];

const load = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
};

export default function App() {
  const saved = load();
  const [tasks, setTasks] = useState(saved?.tasks ?? INIT_TASKS);
  const [risks, setRisks] = useState(saved?.risks ?? INIT_RISKS);
  const [kpis,  setKpis]  = useState(saved?.kpis  ?? INIT_KPIS);
  const [tab,   setTab]   = useState('dashboard');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, risks, kpis })); } catch {}
  }, [tasks, risks, kpis]);

  const updateTask = useCallback(updated => setTasks(ts => ts.map(t => t.id === updated.id ? updated : t)), []);

  const reset = () => {
    if (window.confirm('Reset ALL data to defaults? This cannot be undone.')) {
      setTasks(INIT_TASKS);
      setRisks(INIT_RISKS);
      setKpis(INIT_KPIS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const done    = tasks.filter(t => t.status === 'Done').length;
  const blocked = tasks.filter(t => t.status === 'Blocked').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', fontSize: 13, color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ background: '#0D2137', color: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#C8991A', letterSpacing: '.3px' }}>☀ Solar EPC Egypt</span>
          <span style={{ fontSize: 11, color: '#aabbcc' }}>Project Management System · Strategy A · EGP 2M · {tasks.length} Tasks</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: '#1E7E34', fontWeight: 700 }}>✓ {done} Done</span>
          {blocked > 0 && <span style={{ color: '#ff9999', fontWeight: 700 }}>⚠ {blocked} Blocked</span>}
          <button onClick={reset} style={{ background: 'transparent', border: '1px solid #C0392B', color: '#ff6b6b', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#0D2137', padding: '0 20px', borderBottom: '2px solid #C8991A', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #C8991A' : '2px solid transparent',
              color: tab === t.id ? '#C8991A' : '#aabbcc',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.3px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginBottom: -2,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px', minHeight: 'calc(100vh - 100px)' }}>
        {tab === 'dashboard'  && <KPIDash        kpis={kpis}  tasks={tasks}  setKpis={setKpis} />}
        {tab === 'kanban'     && <KanbanView      tasks={tasks} onUpdate={updateTask} />}
        {tab === 'table'      && <TaskTableView   tasks={tasks} onUpdate={updateTask} />}
        {tab === 'schedule'   && <ScheduleView    tasks={tasks} />}
        {tab === 'wbs'        && <WBSView         tasks={tasks} onUpdate={updateTask} />}
        {tab === 'compliance' && <ComplianceView  tasks={tasks} onUpdate={updateTask} />}
        {tab === 'risks'      && <RiskView        risks={risks} setRisks={setRisks} />}
        {tab === 'charter'    && <CharterView />}
      </div>
    </div>
  );
}
