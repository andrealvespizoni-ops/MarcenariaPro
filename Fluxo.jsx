import { DB, fmtBRL, fmtDate, todayISO, addDays, saldoCaixa, movimentacoes } from '../lib/db';
import { Kpi } from '../components';
import { LineChart } from '../charts';

export default function Fluxo() {
  const cr = DB.all('contasReceber'), cp = DB.all('contasPagar');
  function periodoDados(dias) {
    const from = todayISO(); const to = addDays(from, dias);
    const entPrev = cr.filter((c) => c.status !== 'Recebido' && c.vencimento >= from && c.vencimento <= to).reduce((s, c) => s + Number(c.valor || 0), 0);
    const saiPrev = cp.filter((c) => c.status !== 'Pago' && c.vencimento >= from && c.vencimento <= to).reduce((s, c) => s + Number(c.valor || 0), 0);
    return { entPrev, saiPrev };
  }
  const saldo = saldoCaixa();
  const p7 = periodoDados(7), p30 = periodoDados(30), p60 = periodoDados(60), p90 = periodoDados(90);

  const labels = []; const data = []; let acc = saldo;
  for (let d = 0; d <= 30; d++) {
    const dt = addDays(todayISO(), d);
    const ent = cr.filter((c) => c.status !== 'Recebido' && c.vencimento === dt).reduce((s, c) => s + Number(c.valor || 0), 0);
    const sai = cp.filter((c) => c.status !== 'Pago' && c.vencimento === dt).reduce((s, c) => s + Number(c.valor || 0), 0);
    acc += ent - sai;
    labels.push(new Date(dt + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    data.push(acc);
  }
  const movs = movimentacoes();

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Saldo atual" value={fmtBRL(saldo)} />
        <Kpi label="Entradas previstas (30d)" value={fmtBRL(p30.entPrev)} />
        <Kpi label="Saídas previstas (30d)" value={fmtBRL(p30.saiPrev)} />
        <Kpi label="Saldo projetado (30d)" value={fmtBRL(saldo + p30.entPrev - p30.saiPrev)} />
      </div>
      <div className="section-title"><h2>Projeção</h2></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Período</th><th>Entradas previstas</th><th>Saídas previstas</th><th>Saldo projetado</th></tr></thead>
          <tbody>
            <tr><td>Próximos 7 dias</td><td>{fmtBRL(p7.entPrev)}</td><td>{fmtBRL(p7.saiPrev)}</td><td><b>{fmtBRL(saldo + p7.entPrev - p7.saiPrev)}</b></td></tr>
            <tr><td>Próximos 30 dias</td><td>{fmtBRL(p30.entPrev)}</td><td>{fmtBRL(p30.saiPrev)}</td><td><b>{fmtBRL(saldo + p30.entPrev - p30.saiPrev)}</b></td></tr>
            <tr><td>Próximos 60 dias</td><td>{fmtBRL(p60.entPrev)}</td><td>{fmtBRL(p60.saiPrev)}</td><td><b>{fmtBRL(saldo + p60.entPrev - p60.saiPrev)}</b></td></tr>
            <tr><td>Próximos 90 dias</td><td>{fmtBRL(p90.entPrev)}</td><td>{fmtBRL(p90.saiPrev)}</td><td><b>{fmtBRL(saldo + p90.entPrev - p90.saiPrev)}</b></td></tr>
          </tbody>
        </table>
      </div>
      <div className="section-title"><h2>Gráfico de projeção (diário, 30 dias)</h2></div>
      <div className="chartbox"><LineChart labels={labels} series={[{ label: 'Saldo projetado', data }]} /></div>
      <div className="section-title"><h2>Movimentações recentes</h2></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr></thead>
          <tbody>
            {movs.length ? movs.map((m, i) => (
              <tr key={i}><td>{fmtDate(m.data)}</td><td><span className={`badge ${m.tipo === 'Entrada' ? 'ok' : 'bad'}`}>{m.tipo}</span></td><td>{m.desc}</td><td>{fmtBRL(m.valor)}</td></tr>
            )) : <tr><td colSpan={4}><div className="empty">Nenhuma movimentação</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
