import { useState, useRef } from 'react';
import {
  DB, fmtBRL, fmtDate, todayISO, calcOrcamento, capitalDeGiro, lucroDemonstrativo, movimentacoes,
  csvEscape, downloadFile,
} from './db';
import { useApp } from './AppContext';

const REPORTS = [
  ['Faturamento', 'faturamento'], ['Lucro & Margem', 'lucro'], ['Vendas & Orçamentos', 'vendas'],
  ['Clientes', 'clientes'], ['Contas a Pagar', 'pagar'], ['Contas a Receber', 'receber'],
  ['Fluxo de Caixa', 'fluxo'], ['Central de Serviços', 'central'], ['Despesas', 'despesas'], ['Capital de Giro', 'giro'],
];

function buildReport(kind, from, to) {
  let rows = [], headers = [], title = '';
  if (kind === 'faturamento') {
    title = 'Faturamento'; headers = ['Projeto', 'Cliente', 'Data', 'Valor'];
    rows = DB.all('projetos').filter((p) => p.dataContratacao >= from && p.dataContratacao <= to)
      .map((p) => ['#' + p.numero, (DB.get('clientes', p.clienteId) || {}).nome || '', fmtDate(p.dataContratacao), fmtBRL(p.valorContratado)]);
  } else if (kind === 'lucro') {
    const d = lucroDemonstrativo(from, to); title = 'Lucro & Margem'; headers = ['Item', 'Valor'];
    rows = [['Faturamento', fmtBRL(d.faturamento)], ['Custos diretos', fmtBRL(d.custosDiretos)], ['Despesas', fmtBRL(d.despesas)],
      ['Impostos', fmtBRL(d.impostos)], ['Pró-labore', fmtBRL(d.proLabore)], ['Resultado', fmtBRL(d.resultado)], ['Margem', d.margem.toFixed(1) + '%']];
  } else if (kind === 'vendas') {
    title = 'Vendas & Orçamentos'; headers = ['Nº', 'Cliente', 'Status', 'Preço'];
    rows = DB.all('orcamentos').filter((o) => o.data >= from && o.data <= to)
      .map((o) => ['#' + o.numero, (DB.get('clientes', o.clienteId) || {}).nome || '', o.status, fmtBRL(calcOrcamento(o).preco)]);
  } else if (kind === 'clientes') {
    title = 'Clientes'; headers = ['Nome', 'Cidade/UF', 'WhatsApp'];
    rows = DB.all('clientes').map((c) => [c.nome, (c.cidade || '') + '/' + (c.estado || ''), c.whatsapp || '']);
  } else if (kind === 'pagar') {
    title = 'Contas a Pagar'; headers = ['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status'];
    rows = DB.all('contasPagar').filter((c) => c.vencimento >= from && c.vencimento <= to)
      .map((c) => [c.despesa || c.fornecedor || '', c.categoria, fmtBRL(c.valor), fmtDate(c.vencimento), c.status]);
  } else if (kind === 'receber') {
    title = 'Contas a Receber'; headers = ['Cliente', 'Parcela', 'Valor', 'Vencimento', 'Status'];
    rows = DB.all('contasReceber').filter((c) => c.vencimento >= from && c.vencimento <= to)
      .map((c) => [(DB.get('clientes', c.clienteId) || {}).nome || '', c.parcela, fmtBRL(c.valor), fmtDate(c.vencimento), c.status]);
  } else if (kind === 'fluxo') {
    title = 'Fluxo de Caixa (movimentações)'; headers = ['Data', 'Tipo', 'Descrição', 'Valor'];
    rows = movimentacoes().filter((m) => m.data >= from && m.data <= to).map((m) => [fmtDate(m.data), m.tipo, m.desc, fmtBRL(m.valor)]);
  } else if (kind === 'central') {
    title = 'Central de Serviços'; headers = ['Projeto', 'Central', 'Envio', 'Valor', 'Status'];
    rows = DB.all('servicosCentral').filter((s) => (s.dataEnvio || '') >= from && (s.dataEnvio || '') <= to)
      .map((s) => [(DB.get('projetos', s.projetoId) || {}).numero || '', (DB.get('centrais', s.centralId) || {}).nome || '', fmtDate(s.dataEnvio), fmtBRL(s.valor), s.status]);
  } else if (kind === 'despesas') {
    title = 'Despesas Fixas'; headers = ['Nome', 'Categoria', 'Valor', 'Recorrência'];
    rows = DB.all('despesasFixas').map((d) => [d.nome, d.categoria, fmtBRL(d.valor), d.recorrencia]);
  } else if (kind === 'giro') {
    const g = capitalDeGiro(); title = 'Capital de Giro'; headers = ['Item', 'Valor'];
    rows = [['Caixa', fmtBRL(g.caixa)], ['A receber', fmtBRL(g.cr)], ['A pagar', fmtBRL(g.cp)], ['Disponível', fmtBRL(g.disponivel)], ['Status', g.status]];
  }
  return { title, headers, rows };
}

export default function Relatorios() {
  const { toast, refresh } = useApp();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const fileRef = useRef(null);

  function run(kind) { setReport({ kind, ...buildReport(kind, from, to) }); }
  function exportCsv() {
    if (!report) return;
    const csv = [report.headers.join(';'), ...report.rows.map((r) => r.map(csvEscape).join(';'))].join('\n');
    downloadFile(report.title.toLowerCase().replace(/\s+/g, '_') + '.csv', '\ufeff' + csv, 'text/csv');
  }
  function exportBackup() { downloadFile('backup_marcenaria_' + todayISO() + '.json', JSON.stringify(DB.raw(), null, 2), 'application/json'); }
  function importBackup(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { DB.replaceAll(JSON.parse(reader.result)); toast('Backup importado com sucesso'); refresh(); }
      catch (err) { toast('Arquivo inválido'); }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <div className="row">
        <div className="field"><label>De</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>Até</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', marginTop: 10 }}>
        {REPORTS.map(([label, kind]) => (
          <button className="card" key={kind} style={{ cursor: 'pointer', textAlign: 'left', borderRadius: 16 }} onClick={() => run(kind)}>
            <b>{label}</b><div className="small" style={{ marginTop: 6 }}>Ver relatório →</div>
          </button>
        ))}
      </div>
      <div className="section-title"><h2>Backup</h2></div>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="small" style={{ marginBottom: 10 }}>Exporte todos os dados do sistema em um arquivo JSON, ou importe um backup salvo anteriormente.</div>
        <div className="row">
          <button className="btn" onClick={exportBackup}>Exportar dados (JSON)</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            Importar dados
            <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} />
          </label>
        </div>
      </div>
      {report && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title"><h2>{report.title}</h2><button className="btn sm" onClick={exportCsv}>Exportar CSV</button></div>
          <div className="tablewrap">
            <table>
              <thead><tr>{report.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {report.rows.length ? report.rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                )) : <tr><td colSpan={report.headers.length}><div className="empty">Sem dados no período</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
