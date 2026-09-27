import { useState } from 'react';
import { DB, fmtBRL, capitalDeGiro } from './db';
import { Kpi } from './components';
import { useApp } from './AppContext';

export default function Giro() {
  const { refresh, toast } = useApp();
  const g = capitalDeGiro();
  const [min, setMin] = useState(g.minimo);

  function save() { DB.setConfig({ capitalGiroMinimo: Number(min || 0) }); refresh(); toast('Capital de giro mínimo atualizado'); }
  const badgeCls = g.status === 'SEGURO' ? 'ok' : g.status === 'ATENÇÃO' ? 'warn' : 'bad';

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Caixa disponível" value={fmtBRL(g.caixa)} />
        <Kpi label="Contas a receber" value={fmtBRL(g.cr)} />
        <Kpi label="Contas a pagar" value={fmtBRL(g.cp)} />
        <Kpi label="Capital de giro disponível" value={fmtBRL(g.disponivel)} tag={g.status} />
      </div>
      <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
        <h3>Capital de giro mínimo desejado</h3>
        <div className="field"><input type="number" value={min} onChange={(e) => setMin(e.target.value)} /></div>
        <button className="btn primary" onClick={save}>Salvar</button>
        <hr className="divider" />
        <div className="small">
          Cálculo: Caixa ({fmtBRL(g.caixa)}) + Recebíveis ({fmtBRL(g.cr)}) − Compromissos de curto prazo ({fmtBRL(g.cp)}) = <b>{fmtBRL(g.disponivel)}</b>
        </div>
        <div style={{ marginTop: 12 }}><span className={`badge ${badgeCls}`}>{g.status}</span></div>
        <div className="small" style={{ marginTop: 10 }}>⚠️ O sistema não retira dinheiro automaticamente da empresa quando o capital de giro está abaixo do mínimo.</div>
      </div>
    </div>
  );
}
