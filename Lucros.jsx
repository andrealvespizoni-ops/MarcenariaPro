import { useState } from 'react';
import { DB, fmtBRL, todayISO, lucroDemonstrativo, projetoCusto } from './db';

export default function Lucros() {
  const now = new Date();
  const [range, setRange] = useState('mes');
  let from, to, label;
  if (range === 'mes') { from = now.toISOString().slice(0, 8) + '01'; to = todayISO(); label = 'Mês atual'; }
  else if (range === 'ano') { from = now.getFullYear() + '-01-01'; to = todayISO(); label = 'Ano atual'; }
  else { from = '2000-01-01'; to = todayISO(); label = 'Todo o período'; }
  const d = lucroDemonstrativo(from, to);
  const projs = DB.all('projetos');

  return (
    <div>
      <div className="tabs">
        <div className={`tab ${range === 'mes' ? 'active' : ''}`} onClick={() => setRange('mes')}>Mês</div>
        <div className={`tab ${range === 'ano' ? 'active' : ''}`} onClick={() => setRange('ano')}>Ano</div>
        <div className={`tab ${range === 'tudo' ? 'active' : ''}`} onClick={() => setRange('tudo')}>Tudo</div>
      </div>
      <div className="card" style={{ maxWidth: 520 }}>
        <h3>Demonstrativo simplificado — {label}</h3>
        <div className="calcbox">
          <div className="line"><span>Faturamento</span><span>{fmtBRL(d.faturamento)}</span></div>
          <div className="line"><span>(−) Custos diretos (central + compras)</span><span>{fmtBRL(d.custosDiretos)}</span></div>
          <div className="line"><span>(−) Despesas</span><span>{fmtBRL(d.despesas)}</span></div>
          <div className="line"><span>(−) Impostos (estimado)</span><span>{fmtBRL(d.impostos)}</span></div>
          <div className="line"><span>(−) Pró-labore</span><span>{fmtBRL(d.proLabore)}</span></div>
          <div className="line total"><span>Resultado (lucro)</span><span>{fmtBRL(d.resultado)}</span></div>
        </div>
        <div className="small" style={{ marginTop: 10 }}>Margem líquida: <b>{d.margem.toFixed(1)}%</b></div>
      </div>
      <div className="section-title"><h2>Lucro por projeto</h2></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Projeto</th><th>Cliente</th><th>Contratado</th><th>Custo (central+compras)</th><th>Lucro estimado</th></tr></thead>
          <tbody>
            {projs.length ? projs.map((p) => {
              const custo = projetoCusto(p.id); const cli = DB.get('clientes', p.clienteId);
              return (
                <tr key={p.id}><td>#{p.numero}</td><td>{cli ? cli.nome : '—'}</td><td>{fmtBRL(p.valorContratado)}</td>
                  <td>{fmtBRL(custo)}</td><td><b>{fmtBRL(p.valorContratado - custo)}</b></td></tr>
              );
            }) : <tr><td colSpan={5}><div className="empty">Nenhum projeto</div></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="small" style={{ marginTop: 14 }}>⚠️ O saldo em caixa não deve ser confundido com lucro — parte dele pode ser capital de giro necessário para sustentar a operação.</div>
    </div>
  );
}
