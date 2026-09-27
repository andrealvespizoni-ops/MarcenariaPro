import { useState } from 'react';
import jsPDF from 'jspdf';
import {
  DB, fmtBRL, fmtDate, todayISO, addDays, calcOrcamento, converterEmProjeto, gerarPDFOrcamento,
  ORC_STATUS, ITEM_CATS,
} from './db';
import { Empty } from './components';
import { useApp } from './AppContext';

const STATUS_MAP = { Aprovado: 'ok', Recusado: 'bad', Expirado: 'bad', 'Em negociação': 'warn', Enviado: 'info', Rascunho: 'neutral' };

function ItemRow({ item, onChange, onRemove }) {
  return (
    <div className="itemsrow">
      <select value={item.categoria} onChange={(e) => onChange({ ...item, categoria: e.target.value })}>
        {ITEM_CATS.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input type="text" placeholder="Descrição" value={item.descricao || ''} onChange={(e) => onChange({ ...item, descricao: e.target.value })} />
      <input type="number" placeholder="Qtd" value={item.qtd || ''} onChange={(e) => onChange({ ...item, qtd: Number(e.target.value) })} />
      <select value={item.unidade} onChange={(e) => onChange({ ...item, unidade: e.target.value })}>
        <option value="un">un</option><option value="m2">m2</option><option value="m">m</option><option value="kg">kg</option><option value="serv">serv</option>
      </select>
      <input type="number" placeholder="Custo unit." value={item.custoUnit || ''} onChange={(e) => onChange({ ...item, custoUnit: Number(e.target.value) })} />
      <button className="iconbtn" type="button" onClick={onRemove}>✕</button>
    </div>
  );
}

function OrcamentoForm({ orcamento, onSaved }) {
  const { refresh, closeModal, toast } = useApp();
  const o = orcamento
    ? JSON.parse(JSON.stringify(orcamento))
    : { numero: DB.nextNumber('orc'), data: todayISO(), validade: addDays(todayISO(), 15), itens: [], status: 'Rascunho', despesasIndiretasPerc: 0, comissaoPerc: 0 };

  const [f, setF] = useState({
    clienteId: o.clienteId || '', ambiente: o.ambiente || '', data: o.data, validade: o.validade,
    descricao: o.descricao || '', medidas: o.medidas || '', quantidade: o.quantidade || 1,
    itens: o.itens || [],
    despesasIndiretasPerc: o.despesasIndiretasPerc || 0,
    impostosPerc: o.impostosPerc ?? DB.config().impostoPadrao,
    comissaoPerc: o.comissaoPerc || 0,
    margemPerc: o.margemPerc ?? DB.config().margemPadrao,
    precoManual: o.precoManual || '',
    status: o.status,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setNum = (k) => (e) => setF({ ...f, [k]: Number(e.target.value || 0) });

  const calc = calcOrcamento({ ...o, ...f });

  function addItem() { setF({ ...f, itens: [...f.itens, { categoria: 'MDF', descricao: '', qtd: 1, unidade: 'un', custoUnit: 0 }] }); }
  function updItem(i, item) { const itens = f.itens.slice(); itens[i] = item; setF({ ...f, itens }); }
  function rmItem(i) { const itens = f.itens.slice(); itens.splice(i, 1); setF({ ...f, itens }); }

  function save() {
    if (!f.clienteId) { toast('Selecione um cliente'); return; }
    const obj = { ...o, ...f, quantidade: Number(f.quantidade || 1) };
    if (o.id) DB.update('orcamentos', o.id, obj); else DB.insert('orcamentos', obj);
    closeModal(); refresh(); toast('Orçamento salvo');
  }
  function del() { if (confirm('Excluir?')) { DB.remove('orcamentos', o.id); closeModal(); refresh(); } }

  return (
    <>
      <h3>Orçamento #{o.numero}</h3>
      <div className="row">
        <div className="field">
          <label>Cliente</label>
          <select value={f.clienteId} onChange={set('clienteId')}>
            <option value="">Selecione...</option>
            {DB.all('clientes').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="field"><label>Ambiente</label><input type="text" value={f.ambiente} onChange={set('ambiente')} placeholder="Cozinha, quarto..." /></div>
      </div>
      <div className="row">
        <div className="field"><label>Data</label><input type="date" value={f.data} onChange={set('data')} /></div>
        <div className="field"><label>Validade</label><input type="date" value={f.validade} onChange={set('validade')} /></div>
      </div>
      <div className="field"><label>Descrição</label><textarea rows={2} value={f.descricao} onChange={set('descricao')} /></div>
      <div className="row">
        <div className="field"><label>Medidas</label><input type="text" value={f.medidas} onChange={set('medidas')} /></div>
        <div className="field"><label>Quantidade de ambientes</label><input type="number" value={f.quantidade} onChange={set('quantidade')} /></div>
      </div>
      <hr className="divider" />
      <label>Itens do orçamento</label>
      <div>
        {f.itens.length ? f.itens.map((it, i) => (
          <ItemRow key={i} item={it} onChange={(v) => updItem(i, v)} onRemove={() => rmItem(i)} />
        )) : <div className="small">Nenhum item</div>}
      </div>
      <button className="btn sm" type="button" onClick={addItem}>+ Adicionar item</button>
      <hr className="divider" />
      <div className="row">
        <div className="field"><label>Despesas indiretas (%)</label><input type="number" value={f.despesasIndiretasPerc} onChange={setNum('despesasIndiretasPerc')} /></div>
        <div className="field"><label>Impostos (%)</label><input type="number" value={f.impostosPerc} onChange={setNum('impostosPerc')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Comissão (%)</label><input type="number" value={f.comissaoPerc} onChange={setNum('comissaoPerc')} /></div>
        <div className="field"><label>Margem de lucro (%)</label><input type="number" value={f.margemPerc} onChange={setNum('margemPerc')} /></div>
      </div>
      <div className="field"><label>Preço final manual (opcional — sobrepõe o cálculo por margem)</label><input type="number" value={f.precoManual} onChange={set('precoManual')} /></div>
      <div className="calcbox">
        <div className="line"><span>Custo dos materiais/itens</span><span>{fmtBRL(calc.custoMateriais)}</span></div>
        <div className="line"><span>Custo direto</span><span>{fmtBRL(calc.custoDireto)}</span></div>
        <div className="line"><span>Despesas indiretas</span><span>{fmtBRL(calc.despesasIndiretasVal)}</span></div>
        <div className="line"><span>Impostos</span><span>{fmtBRL(calc.impostoVal)}</span></div>
        <div className="line"><span>Comissão</span><span>{fmtBRL(calc.comissaoVal)}</span></div>
        <div className="line"><span>Custo total</span><span>{fmtBRL(calc.custoTotal)}</span></div>
        <div className="line total"><span>Preço de venda</span><span>{fmtBRL(calc.preco)}</span></div>
        <div className="line"><span>Lucro previsto</span><span>{fmtBRL(calc.lucro)} ({calc.margemReal.toFixed(1)}%)</span></div>
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label>Status</label>
        <select value={f.status} onChange={set('status')}>{ORC_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="modal-actions">
        {o.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Orcamentos() {
  const { refresh, openModal, toast } = useApp();
  const orcs = DB.all('orcamentos').slice().sort((a, b) => b.numero - a.numero);

  function del(id) { if (confirm('Excluir orçamento?')) { DB.remove('orcamentos', id); refresh(); } }
  function converter(o) {
    const proj = converterEmProjeto(o);
    if (proj) { toast('Projeto criado com contas a receber e serviço de central!'); refresh(); }
    else toast('Já existe projeto para este orçamento');
  }
  function pdf(o) { gerarPDFOrcamento(o, jsPDF); }

  return (
    <div>
      <div className="toolbar"><button className="btn primary" onClick={() => openModal(<OrcamentoForm />)}>+ Novo Orçamento</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Nº</th><th>Cliente</th><th>Ambiente</th><th>Data</th><th>Preço</th><th>Margem</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {orcs.length ? orcs.map((o) => {
              const cli = DB.get('clientes', o.clienteId);
              const c = calcOrcamento(o);
              const jaVirouProjeto = !!DB.all('projetos').find((p) => p.orcamentoId === o.id);
              return (
                <tr key={o.id}>
                  <td>#{o.numero}</td><td>{cli ? cli.nome : '—'}</td><td>{o.ambiente || '—'}</td><td>{fmtDate(o.data)}</td>
                  <td><b>{fmtBRL(c.preco)}</b></td><td>{c.margemReal.toFixed(1)}%</td>
                  <td><span className={`badge ${STATUS_MAP[o.status] || 'neutral'}`}>{o.status}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn sm" onClick={() => openModal(<OrcamentoForm orcamento={o} />)}>Abrir</button>
                    <button className="btn sm" onClick={() => pdf(o)}>PDF</button>
                    {o.status === 'Aprovado' && !jaVirouProjeto && <button className="btn sm primary" onClick={() => converter(o)}>Virar Projeto</button>}
                    <button className="btn sm danger" onClick={() => del(o.id)}>Excluir</button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={8}><Empty>Nenhum orçamento</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
