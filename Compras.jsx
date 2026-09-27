import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, ITEM_CATS } from '../lib/db';
import { Empty } from '../components';
import { useApp } from '../AppContext';

const COMPRA_CATS = ITEM_CATS.filter((x) => !['Central de serviços', 'Frete', 'Montagem', 'Instalação'].includes(x)).concat(['Materiais diversos']);

function CompraForm({ compra }) {
  const { refresh, closeModal, toast } = useApp();
  const c = compra || { data: todayISO(), status: 'A pagar', categoria: 'MDF' };
  const [f, setF] = useState({
    fornecedor: c.fornecedor || '', projetoId: c.projetoId || '', categoria: c.categoria, produto: c.produto || '',
    quantidade: c.quantidade || 1, valor: c.valor || '', data: c.data, vencimento: c.vencimento || '',
    formaPagamento: c.formaPagamento || '', status: c.status,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    const obj = { ...f, quantidade: Number(f.quantidade || 1), valor: Number(f.valor || 0) };
    if (c.id) DB.update('compras', c.id, obj); else DB.insert('compras', obj);
    closeModal(); refresh(); toast('Compra salva');
  }
  function del() { DB.remove('compras', c.id); closeModal(); refresh(); }
  return (
    <>
      <h3>{c.id ? 'Editar' : 'Nova'} Compra</h3>
      <div className="row">
        <div className="field"><label>Fornecedor</label><input type="text" value={f.fornecedor} onChange={set('fornecedor')} /></div>
        <div className="field"><label>Projeto</label>
          <select value={f.projetoId} onChange={set('projetoId')}>
            <option value="">Nenhum</option>
            {DB.all('projetos').map((p) => <option key={p.id} value={p.id}>#{p.numero}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Categoria</label><select value={f.categoria} onChange={set('categoria')}>{COMPRA_CATS.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Produto</label><input type="text" value={f.produto} onChange={set('produto')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Quantidade</label><input type="number" value={f.quantidade} onChange={set('quantidade')} /></div>
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Data</label><input type="date" value={f.data} onChange={set('data')} /></div>
        <div className="field"><label>Vencimento</label><input type="date" value={f.vencimento} onChange={set('vencimento')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Forma de pagamento</label><input type="text" value={f.formaPagamento} onChange={set('formaPagamento')} /></div>
        <div className="field"><label>Status</label><select value={f.status} onChange={set('status')}><option>A pagar</option><option>Pago</option></select></div>
      </div>
      <div className="modal-actions">
        {c.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Compras() {
  const { refresh, openModal } = useApp();
  const compras = DB.all('compras').slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  function del(id) { DB.remove('compras', id); refresh(); }
  return (
    <div>
      <div className="toolbar"><button className="btn primary" onClick={() => openModal(<CompraForm />)}>+ Nova Compra</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Fornecedor</th><th>Projeto</th><th>Categoria</th><th>Produto</th><th>Qtd</th><th>Valor</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {compras.length ? compras.map((c) => {
              const p = DB.get('projetos', c.projetoId);
              return (
                <tr key={c.id}>
                  <td>{c.fornecedor}</td><td>{p ? '#' + p.numero : '—'}</td><td>{c.categoria}</td><td>{c.produto}</td>
                  <td>{c.quantidade}</td><td>{fmtBRL(c.valor)}</td><td>{fmtDate(c.data)}</td>
                  <td><span className={`badge ${c.status === 'Pago' ? 'ok' : 'warn'}`}>{c.status}</span></td>
                  <td><button className="btn sm" onClick={() => openModal(<CompraForm compra={c} />)}>Editar</button> <button className="btn sm danger" onClick={() => del(c.id)}>✕</button></td>
                </tr>
              );
            }) : <tr><td colSpan={9}><Empty>Nenhuma compra registrada</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
