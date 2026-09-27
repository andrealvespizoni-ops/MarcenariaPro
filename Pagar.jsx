import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, monthKey, CP_CATS } from './db';
import { Kpi, Empty } from './components';
import { useApp } from './AppContext';

function PagarForm({ item }) {
  const { refresh, closeModal, toast } = useApp();
  const i = item || { status: 'Pendente', categoria: 'Outros' };
  const [f, setF] = useState({
    despesa: i.despesa || '', categoria: i.categoria, fornecedor: i.fornecedor || '', projetoId: i.projetoId || '',
    valor: i.valor || '', vencimento: i.vencimento || '', status: i.status,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    const obj = { ...f, valor: Number(f.valor || 0), dataPagamento: f.status === 'Pago' ? (i.dataPagamento || todayISO()) : '' };
    if (i.id) DB.update('contasPagar', i.id, obj); else DB.insert('contasPagar', obj);
    closeModal(); refresh(); toast('Salvo');
  }
  function del() { DB.remove('contasPagar', i.id); closeModal(); refresh(); }
  return (
    <>
      <h3>{i.id ? 'Editar' : 'Nova'} Conta a Pagar</h3>
      <div className="row">
        <div className="field"><label>Descrição/Despesa</label><input type="text" value={f.despesa} onChange={set('despesa')} /></div>
        <div className="field"><label>Categoria</label><select value={f.categoria} onChange={set('categoria')}>{CP_CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div className="row">
        <div className="field"><label>Fornecedor</label><input type="text" value={f.fornecedor} onChange={set('fornecedor')} /></div>
        <div className="field"><label>Projeto (opcional)</label>
          <select value={f.projetoId} onChange={set('projetoId')}>
            <option value="">Nenhum</option>
            {DB.all('projetos').map((p) => <option key={p.id} value={p.id}>#{p.numero}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
        <div className="field"><label>Vencimento</label><input type="date" value={f.vencimento} onChange={set('vencimento')} /></div>
      </div>
      <div className="field"><label>Status</label><select value={f.status} onChange={set('status')}><option>Pendente</option><option>Pago</option></select></div>
      <div className="modal-actions">
        {i.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Pagar() {
  const { refresh, openModal, toast } = useApp();
  const items = DB.all('contasPagar').slice().sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  const totalPagar = items.filter((i) => i.status !== 'Pago').reduce((s, i) => s + Number(i.valor || 0), 0);
  const pagoMes = items.filter((i) => i.status === 'Pago' && monthKey(i.dataPagamento) === monthKey(todayISO())).reduce((s, i) => s + Number(i.valor || 0), 0);
  const vencido = items.filter((i) => i.status !== 'Pago' && i.vencimento < todayISO()).reduce((s, i) => s + Number(i.valor || 0), 0);

  function del(id) { DB.remove('contasPagar', id); refresh(); }
  function pagar(id) { DB.update('contasPagar', id, { status: 'Pago', dataPagamento: todayISO() }); refresh(); toast('Pagamento registrado — fluxo de caixa e saldo atualizados'); }

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Total a pagar" value={fmtBRL(totalPagar)} /><Kpi label="Pago no mês" value={fmtBRL(pagoMes)} /><Kpi label="Vencido" value={fmtBRL(vencido)} />
      </div>
      <div className="toolbar" style={{ marginTop: 20 }}><button className="btn primary" onClick={() => openModal(<PagarForm />)}>+ Nova conta</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {items.length ? items.map((i) => {
              let st = i.status; if (st !== 'Pago' && i.vencimento < todayISO()) st = 'Vencido';
              return (
                <tr key={i.id}>
                  <td>{i.despesa || i.fornecedor || '—'}</td><td>{i.categoria}</td><td>{fmtBRL(i.valor)}</td><td>{fmtDate(i.vencimento)}</td>
                  <td><span className={`badge ${st === 'Pago' ? 'ok' : st === 'Vencido' ? 'bad' : 'warn'}`}>{st}</span></td>
                  <td>
                    {i.status !== 'Pago' && <button className="btn sm primary" onClick={() => pagar(i.id)}>Pagar</button>}{' '}
                    <button className="btn sm" onClick={() => openModal(<PagarForm item={i} />)}>Editar</button>{' '}
                    <button className="btn sm danger" onClick={() => del(i.id)}>✕</button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={6}><Empty>Nenhuma conta a pagar</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
