import {
  DB, fmtBRL, todayISO, addDays, monthKey, last6Months,
  faturamentoPeriodo, lucroDemonstrativo, capitalDeGiro, saldoCaixa,
} from '../lib/db';
import { Kpi } from '../components';
import { LineChart, BarChart, PieChart } from '../charts';

export default function Dashboard() {
  const now = new Date();
  const monthFrom = now.toISOString().slice(0, 8) + '01';
  const monthTo = todayISO();
  const yearFrom = now.getFullYear() + '-01-01';
  const yearTo = todayISO();

  const fatMes = faturamentoPeriodo(monthFrom, monthTo);
  const fatAno = faturamentoPeriodo(yearFrom, yearTo);
  const orcs = DB.all('orcamentos');
  const orcAberto = orcs.filter((o) => ['Rascunho', 'Enviado', 'Em negociação'].includes(o.status)).length;
  const orcAprovado = orcs.filter((o) => o.status === 'Aprovado').length;
  const conversao = orcs.length ? (orcAprovado / orcs.length) * 100 : 0;
  const cr = DB.all('contasReceber').filter((c) => c.status !== 'Recebido').reduce((s, c) => s + Number(c.valor || 0), 0);
  const cp = DB.all('contasPagar').filter((c) => c.status !== 'Pago').reduce((s, c) => s + Number(c.valor || 0), 0);
  const saldo = saldoCaixa();
  const dem = lucroDemonstrativo(monthFrom, monthTo);
  const giro = capitalDeGiro();
  const plMes = DB.all('proLabore').filter((p) => monthKey(p.dataPagamento) === monthKey(todayISO())).reduce((s, p) => s + Number(p.valor || 0), 0);
  const centralGasto = DB.all('servicosCentral').reduce((s, x) => s + Number(x.valor || 0), 0);

  const hoje = todayISO();
  const cpVenc = DB.all('contasPagar').filter((c) => c.status !== 'Pago' && c.vencimento < hoje);
  const cpVence7 = DB.all('contasPagar').filter((c) => c.status !== 'Pago' && c.vencimento >= hoje && c.vencimento <= addDays(hoje, 7));
  const crVenc = DB.all('contasReceber').filter((c) => c.status !== 'Recebido' && c.vencimento < hoje);
  const projAtraso = DB.all('projetos').filter((p) => p.prazo && p.prazo < hoje && p.status !== 'Finalizado');
  const servAtraso = DB.all('servicosCentral').filter((s) => s.dataPrevista && s.dataPrevista < hoje && !['Recebido', 'Finalizado'].includes(s.status));

  const alerts = [];
  if (cpVenc.length) alerts.push({ t: 'bad', m: `${cpVenc.length} conta(s) a pagar vencida(s)` });
  if (cpVence7.length) alerts.push({ t: 'warn', m: `${cpVence7.length} conta(s) a pagar vencendo em 7 dias` });
  if (crVenc.length) alerts.push({ t: 'bad', m: `${crVenc.length} cliente(s) inadimplente(s) (parcela vencida)` });
  if (projAtraso.length) alerts.push({ t: 'warn', m: `${projAtraso.length} projeto(s) atrasado(s)` });
  if (servAtraso.length) alerts.push({ t: 'warn', m: `${servAtraso.length} serviço(s) da central atrasado(s)` });
  if (giro.status !== 'SEGURO') alerts.push({ t: giro.status === 'CRÍTICO' ? 'bad' : 'warn', m: `Capital de giro em nível ${giro.status}` });

  const months = last6Months();
  const fatSeries = [{ label: 'Faturamento', data: months.keys.map((k) => faturamentoPeriodo(k + '-01', k + '-31')) }];
  const fluxoSeries = [
    { label: 'Entradas', data: months.keys.map((k) => DB.all('contasReceber').filter((c) => c.status === 'Recebido' && monthKey(c.dataRecebimento) === k).reduce((s, c) => s + Number(c.valor || 0), 0)) },
    { label: 'Saídas', data: months.keys.map((k) => DB.all('contasPagar').filter((c) => c.status === 'Pago' && monthKey(c.dataPagamento) === k).reduce((s, c) => s + Number(c.valor || 0), 0)) },
  ];
  const lucroSeries = [{ label: 'Lucro', data: months.keys.map((k) => lucroDemonstrativo(k + '-01', k + '-31').resultado) }];
  const catMap = {};
  DB.all('contasPagar').forEach((c) => { catMap[c.categoria] = (catMap[c.categoria] || 0) + Number(c.valor || 0); });

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Faturamento do mês" value={fmtBRL(fatMes)} />
        <Kpi label="Faturamento do ano" value={fmtBRL(fatAno)} />
        <Kpi label="Orçamentos em aberto" value={orcAberto} />
        <Kpi label="Orçamentos aprovados" value={orcAprovado} />
        <Kpi label="Taxa de conversão" value={conversao.toFixed(1) + '%'} />
        <Kpi label="Contas a receber" value={fmtBRL(cr)} />
        <Kpi label="Contas a pagar" value={fmtBRL(cp)} />
        <Kpi label="Saldo atual (caixa)" value={fmtBRL(saldo)} />
        <Kpi label="Lucro estimado (mês)" value={fmtBRL(dem.resultado)} />
        <Kpi label="Margem média (mês)" value={dem.margem.toFixed(1) + '%'} />
        <Kpi label="Capital de giro" value={fmtBRL(giro.disponivel)} tag={giro.status} />
        <Kpi label="Pró-labore do mês" value={fmtBRL(plMes)} />
        <Kpi label="Gasto total c/ central" value={fmtBRL(centralGasto)} />
      </div>

      <div className="section-title"><h2>Alertas</h2></div>
      <div>
        {alerts.length
          ? alerts.map((a, i) => (
            <div className={`alertbox ${a.t === 'warn' ? 'warn' : ''}`} key={i}>
              <span>⚠️</span><div><b>{a.m}</b></div>
            </div>
          ))
          : <div className="empty">Sem alertas no momento 🎉</div>}
      </div>

      <div className="section-title"><h2>Gráficos</h2></div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="chartbox"><b>Faturamento mensal</b><LineChart labels={months.labels} series={fatSeries} /></div>
        <div className="chartbox"><b>Entradas x Saídas</b><BarChart labels={months.labels} series={fluxoSeries} /></div>
        <div className="chartbox"><b>Lucro mensal</b><LineChart labels={months.labels} series={lucroSeries} /></div>
        <div className="chartbox"><b>Custos por categoria</b><PieChart labels={Object.keys(catMap)} values={Object.values(catMap)} /></div>
      </div>
    </div>
  );
}
