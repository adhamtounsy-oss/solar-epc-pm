import { LABEL_COLORS, STATUS_COLORS } from '../constants';

export const Badge = ({ label }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 10,
      fontSize: 10,
      fontWeight: 700,
      color: '#fff',
      background: LABEL_COLORS[label] || '#888',
      whiteSpace: 'nowrap',
      margin: 1,
    }}
  >
    {label}
  </span>
);

export const StatusBadge = ({ status }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      color: '#fff',
      background: STATUS_COLORS[status] || '#555',
    }}
  >
    {status}
  </span>
);

export const Btn = ({ children, onClick, variant = 'primary', size = '', style = {} }) => {
  const base = {
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: size === 'sm' ? 11 : 13,
    fontWeight: 600,
    borderRadius: 4,
    border: 'none',
    padding: size === 'sm' ? '3px 8px' : '6px 14px',
    transition: 'opacity .15s',
    ...style,
  };
  const variants = {
    primary: { background: '#1A6B72', color: '#fff' },
    danger:  { background: '#C0392B', color: '#fff' },
    ghost:   { background: 'transparent', border: '1px solid #ccc', color: '#555' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {children}
    </button>
  );
};
