export function Kpi({ label, value, tag }) {
  return (
    <div className="card kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}

export function Badge({ status, map }) {
  const cls = (map && map[status]) || 'neutral';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function Empty({ children }) {
  return <div className="empty">{children || 'Nenhum item encontrado'}</div>;
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Row({ children }) {
  return <div className="row">{children}</div>;
}
