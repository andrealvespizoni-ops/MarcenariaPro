/**
 * Camada de dados (services/DB) — separada da interface.
 * Hoje usa localStorage. Para migrar para Supabase/Firebase no futuro,
 * reimplemente estes mesmos métodos (all/get/insert/update/remove/...)
 * mantendo a mesma assinatura — o restante do app não precisa mudar.
 */

const KEY = 'mkt_data_v1';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const fmtBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR');
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const monthKey = (iso) => (iso ? iso.slice(0, 7) : '');
export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const last6Months = () => {
  const keys = [], labels = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    keys.push(dt.toISOString().slice(0, 7));
    labels.push(dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
  }
  return { keys, labels };
};
export const csvEscape = (s) => {
  s = String(s ?? '');
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};
export function downloadFile(filename, data, mime) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function seedDefault() {
  return {
    clientes: [], leads: [], orcamentos: [], projetos: [], centrais: [], servicosCentral: [],
    compras: [], contasReceber: [], contasPagar: [], proLabore: [], despesasFixas: [],
    distribuicoes: [], seq: { orc: 1, proj: 1 },
    config: {
      nomeMarcenaria: 'Minha Marcenaria', cnpj: '', telefone: '', whatsapp: '', email: '',
      endereco: '', impostoPadrao: 8, margemPadrao: 30, comissaoPadrao: 0, proLaborePadrao: 0,
      capitalGiroMinimo: 5000,
    },
  };
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
}

let data = load() || seedDefault();
function persist() { localStorage.setItem(KEY, JSON.stringify(data)); }
persist();

export const DB = {
  all(col) { return data[col] || []; },
  get(col, id) { return (data[col] || []).find((x) => x.id === id); },
  insert(col, obj) {
    obj.id = obj.id || uid();
    obj.createdAt = obj.createdAt || new Date().toISOString();
    data[col].push(obj); persist(); return obj;
  },
  update(col, id, patch) {
    const it = (data[col] || []).find((x) => x.id === id);
    if (it) { Object.assign(it, patch); persist(); }
    return it;
  },
  remove(col, id) { data[col] = (data[col] || []).filter((x) => x.id !== id); persist(); },
  nextNumber(kind) { const n = data.seq[kind]++; persist(); return n; },
  config() { return data.config; },
  setConfig(patch) { Object.assign(data.config, patch); persist(); },
  raw() { return data; },
  replaceAll(obj) { data = obj; persist(); },
};

/* ---------- Cálculos de domínio ---------- */
export function calcOrcamento(orc) {
  const itens = orc.itens || [];
  const custoMateriais = itens.reduce((s, i) => s + (Number(i.qtd) || 0) * (Number(i.custoUnit) || 0), 0);
  const custoDireto = custoMateriais;
  const cfg = DB.config();
  const impostoPerc = orc.impostosPerc ?? cfg.impostoPadrao ?? 0;
  const comissaoPerc = orc.comissaoPerc ?? cfg.comissaoPadrao ?? 0;
  const despIndPerc = orc.despesasIndiretasPerc ?? 0;
  const margemPerc = orc.margemPerc ?? cfg.margemPadrao ?? 0;

  let preco;
  if (orc.precoManual != null && orc.precoManual !== '') {
    preco = Number(orc.precoManual);
  } else {
    const totalPerc = (Number(despIndPerc) + Number(impostoPerc) + Number(comissaoPerc) + Number(margemPerc)) / 100;
    preco = totalPerc < 1 ? custoDireto / (1 - totalPerc) : custoDireto * 1.3;
  }
  const despesasIndiretasVal = preco * (despIndPerc / 100);
  const impostoVal = preco * (impostoPerc / 100);
  const comissaoVal = preco * (comissaoPerc / 100);
  const custoTotal = custoDireto + despesasIndiretasVal + impostoVal + comissaoVal;
  const lucro = preco - custoTotal;
  const margemReal = preco > 0 ? (lucro / preco) * 100 : 0;
  return { custoMateriais, custoDireto, despesasIndiretasVal, impostoVal, comissaoVal, custoTotal, preco, lucro, margemReal };
}

export function clienteResumo(clienteId) {
  const orcs = DB.all('orcamentos').filter((o) => o.clienteId === clienteId);
  const projs = DB.all('projetos').filter((p) => p.clienteId === clienteId);
  const contratado = projs.reduce((s, p) => s + (Number(p.valorContratado) || 0), 0);
  const cr = DB.all('contasReceber').filter((c) => c.clienteId === clienteId);
  const recebido = cr.filter((c) => c.status === 'Recebido').reduce((s, c) => s + Number(c.valor || 0), 0);
  const pendente = cr.filter((c) => c.status !== 'Recebido').reduce((s, c) => s + Number(c.valor || 0), 0);
  return { orcs, projs, contratado, recebido, pendente, cr };
}

export function projetoCusto(projetoId) {
  const servicos = DB.all('servicosCentral').filter((s) => s.projetoId === projetoId).reduce((s, x) => s + Number(x.valor || 0), 0);
  const compras = DB.all('compras').filter((c) => c.projetoId === projetoId).reduce((s, x) => s + Number(x.valor || 0), 0);
  return servicos + compras;
}

export function saldoCaixa() {
  const entradas = DB.all('contasReceber').filter((c) => c.status === 'Recebido').reduce((s, c) => s + Number(c.valor || 0), 0);
  const saidasCP = DB.all('contasPagar').filter((c) => c.status === 'Pago').reduce((s, c) => s + Number(c.valor || 0), 0);
  const saidasPL = DB.all('proLabore').reduce((s, c) => s + Number(c.valor || 0), 0);
  const saidasDist = DB.all('distribuicoes').reduce((s, c) => s + Number(c.valor || 0), 0);
  return entradas - saidasCP - saidasPL - saidasDist;
}

export function capitalDeGiro() {
  const cr = DB.all('contasReceber').filter((c) => c.status !== 'Recebido').reduce((s, c) => s + Number(c.valor || 0), 0);
  const cp = DB.all('contasPagar').filter((c) => c.status !== 'Pago').reduce((s, c) => s + Number(c.valor || 0), 0);
  const caixa = saldoCaixa();
  const disponivel = caixa + cr - cp;
  const minimo = Number(DB.config().capitalGiroMinimo || 0);
  let status = 'SEGURO';
  if (disponivel < minimo) status = 'CRÍTICO';
  else if (disponivel < minimo * 1.3) status = 'ATENÇÃO';
  return { caixa, cr, cp, disponivel, minimo, status };
}

export function faturamentoPeriodo(fromISO, toISO) {
  return DB.all('projetos')
    .filter((p) => p.dataContratacao >= fromISO && p.dataContratacao <= toISO)
    .reduce((s, p) => s + Number(p.valorContratado || 0), 0);
}

export function lucroDemonstrativo(fromISO, toISO) {
  const faturamento = faturamentoPeriodo(fromISO, toISO);
  const custosDiretos =
    DB.all('servicosCentral').filter((s) => s.dataEnvio >= fromISO && s.dataEnvio <= toISO).reduce((s, x) => s + Number(x.valor || 0), 0) +
    DB.all('compras').filter((c) => c.data >= fromISO && c.data <= toISO).reduce((s, x) => s + Number(x.valor || 0), 0);
  const despesas = DB.all('contasPagar')
    .filter((c) => c.vencimento >= fromISO && c.vencimento <= toISO && c.categoria !== 'Central de serviços' && c.categoria !== 'Material')
    .reduce((s, x) => s + Number(x.valor || 0), 0);
  const impostos = faturamento * (Number(DB.config().impostoPadrao || 0) / 100);
  const proLabore = DB.all('proLabore').filter((p) => p.dataPagamento >= fromISO && p.dataPagamento <= toISO).reduce((s, x) => s + Number(x.valor || 0), 0);
  const resultado = faturamento - custosDiretos - despesas - impostos - proLabore;
  const margem = faturamento > 0 ? (resultado / faturamento) * 100 : 0;
  return { faturamento, custosDiretos, despesas, impostos, proLabore, resultado, margem };
}

export function movimentacoes() {
  const list = [];
  DB.all('contasReceber').filter((c) => c.status === 'Recebido').forEach((c) => {
    const cli = DB.get('clientes', c.clienteId);
    list.push({ data: c.dataRecebimento, tipo: 'Entrada', desc: `Recebimento — ${cli ? cli.nome : ''} (${c.parcela})`, valor: c.valor });
  });
  DB.all('contasPagar').filter((c) => c.status === 'Pago').forEach((c) => {
    list.push({ data: c.dataPagamento, tipo: 'Saída', desc: c.despesa || c.categoria, valor: c.valor });
  });
  DB.all('proLabore').forEach((p) => {
    list.push({ data: p.dataPagamento, tipo: 'Saída', desc: 'Pró-labore — ' + (p.responsavel || ''), valor: p.valor });
  });
  return list.filter((x) => x.data).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 25);
}

export const LEAD_STATUS = ['Novo lead', 'Contato', 'Visita/Medição', 'Orçamento', 'Negociação', 'Aprovado', 'Contrato'];
export const ORC_STATUS = ['Rascunho', 'Enviado', 'Em negociação', 'Aprovado', 'Recusado', 'Expirado'];
export const ITEM_CATS = ['MDF', 'Ferragens', 'Vidros', 'LED', 'Perfis', 'Acessórios', 'Central de serviços', 'Frete', 'Montagem', 'Instalação', 'Outros'];
export const PROJ_ETAPAS = ['Projeto', 'Aprovação', 'Compra', 'Envio para central', 'Produção terceirizada', 'Recebimento', 'Conferência', 'Montagem', 'Instalação', 'Entrega', 'Finalizado'];
export const CENTRAL_STATUS = ['Aguardando envio', 'Enviado', 'Em produção', 'Pronto', 'Recebido', 'Conferência', 'Problema', 'Retrabalho', 'Finalizado'];
export const CP_CATS = ['Material', 'Central de serviços', 'Frete', 'Montagem', 'Instalação', 'Aluguel', 'Energia', 'Internet', 'Contabilidade', 'Impostos', 'Marketing', 'Ferramentas', 'Manutenção', 'Pró-labore', 'Outros'];

export function converterEmProjeto(o) {
  if (!o) return null;
  if (DB.all('projetos').find((p) => p.orcamentoId === o.id)) return null;
  const c = calcOrcamento(o);
  const numero = DB.nextNumber('proj');
  const proj = DB.insert('projetos', {
    numero, orcamentoId: o.id, clienteId: o.clienteId, valorContratado: c.preco,
    dataContratacao: todayISO(), prazo: addDays(todayISO(), 45), status: 'Em andamento', etapa: 'Aprovação', obs: '',
  });
  const partes = [
    { p: 'Entrada', perc: 0.4, venc: todayISO() },
    { p: '2ª parcela', perc: 0.3, venc: addDays(todayISO(), 20) },
    { p: '3ª parcela', perc: 0.3, venc: addDays(todayISO(), 40) },
  ];
  partes.forEach((pt) => DB.insert('contasReceber', {
    clienteId: o.clienteId, projetoId: proj.id, parcela: pt.p,
    valor: Math.round(c.preco * pt.perc * 100) / 100, vencimento: pt.venc, status: 'Pendente',
  }));
  const itemCentral = (o.itens || []).find((i) => i.categoria === 'Central de serviços');
  if (itemCentral) {
    DB.insert('servicosCentral', {
      projetoId: proj.id, centralId: '', dataEnvio: '', prazo: '', dataPrevista: addDays(todayISO(), 20), dataRecebimento: '',
      valor: itemCentral.qtd * itemCentral.custoUnit, status: 'Aguardando envio', formaPagamento: '', pago: false,
      obs: 'Gerado automaticamente do orçamento',
    });
  }
  return proj;
}

export function gerarPDFOrcamento(o, jsPDFCtor) {
  const cli = DB.get('clientes', o.clienteId);
  const cfg = DB.config();
  const c = calcOrcamento(o);
  const doc = new jsPDFCtor();
  let y = 18;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(cfg.nomeMarcenaria || 'Marcenaria', 14, y); y += 7;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${cfg.cnpj || ''}  ${cfg.telefone || ''}  ${cfg.email || ''}`, 14, y); y += 10;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(`ORÇAMENTO #${o.numero}`, 14, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Cliente: ${cli ? cli.nome : '—'}`, 14, y); y += 6;
  doc.text(`Data: ${fmtDate(o.data)}    Validade: ${fmtDate(o.validade)}`, 14, y); y += 6;
  doc.text(`Ambiente: ${o.ambiente || '—'}`, 14, y); y += 6;
  if (o.medidas) { doc.text(`Medidas: ${o.medidas}`, 14, y); y += 6; }
  if (o.descricao) { const lines = doc.splitTextToSize(`Descrição: ${o.descricao}`, 180); doc.text(lines, 14, y); y += lines.length * 6; }
  y += 4;
  doc.setFont('helvetica', 'bold'); doc.text('Itens', 14, y); y += 6;
  doc.setFont('helvetica', 'normal');
  (o.itens || []).forEach((it) => {
    doc.text(`${it.categoria} — ${it.descricao || ''}  ${it.qtd} ${it.unidade}`, 14, y);
    doc.text(fmtBRL(it.qtd * it.custoUnit), 180, y, { align: 'right' });
    y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
  });
  y += 4; doc.setDrawColor(0); doc.line(14, y, 196, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('VALOR TOTAL', 14, y); doc.text(fmtBRL(c.preco), 196, y, { align: 'right' }); y += 10;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`Condições: conforme negociado. Este orçamento é válido até ${fmtDate(o.validade)}.`, 14, y);
  doc.save(`orcamento_${o.numero}.pdf`);
}
