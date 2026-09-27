import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, monthKey } from './db';
import { Kpi, Empty } from './components';
import { useApp } from './AppContext';

function ReceberForm({ item }) {
  const { refresh, closeModal, toast } = useApp();
  const i = item || { status: 'Pendente' };
  const [f, setF] = useState({
    clienteId: i.clienteId || '', projetoId: i.projetoId || '', parcela: i.parcela || '',
    valor: i.valor || '', vencimento: i.vencimento || '', status: i.status,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    if (!f.clienteId) { toast('Selecione um cliente'); return; }
    const obj = { ...f, valor: Number(f.valor || 0), dataRecebimento: f.status === 'Recebido' ? (i.dataRecebimento || todayISO()) : (i.dataRecebimento || '') };
    if (i.id) DB.update('contasReceber', i.id, obj); else DB.insert('contasReceber', obj);
    closeModal(); refresh(); toast('Salvo');
  }
  function del() { DB.remove('contasReceber', i.id); closeModal(); refresh(); }
  return (
    <>
      <h3>{i.id ? 'Editar' : 'Nova'} Conta a Receber</h3>
      <div className="row">
        <div className="field"><label>Cliente</label>
          <select value={f.clienteId} onChange={set('clienteId')}>
            <option value="">Selecione...</option>
            {DB.all('clientes').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="field"><label>Projeto</label>
          <select value={f.projetoId} onChange={set('projetoId')}>
            <option value="">Nenhum</option>
            {DB.all('projetos').map((p) => <option key={p.id} value={p.id}>#{p.numero}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Parcela</label><input type="text" value={f.parcela} onChange={set('parcela')} placeholder="Entrada, 2ª parcela..." /></div>
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Vencimento</label><input type="date" value={f.vencimento} onChange={set('vencimento')} /></div>
        <div className="field"><label>Status</label><select value={f.status} onChange={set('status')}><option>Pendente</option><option>Recebido</option><option>Parcial</option></select></div>
      </div>
      <div className="modal-actions">
        {i.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Receber() {
  const { refresh, openModal, toast } = useApp();
  const items = DB.all('contasReceber').slice().sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  const totalReceber = items.filter((i) => i.status !== 'Recebido').reduce((s, i) => s + Number(i.valor || 0), 0);
  const recebidoMes = items.filter((i) => i.status === 'Recebido' && monthKey(i.dataRecebimento) === monthKey(todayISO())).reduce((s, i) => s + Number(i.valor || 0), 0);
  const vencido = items.filter((i) => i.status !== 'Recebido' && i.vencimento < todayISO()).reduce((s, i) => s + Number(i.valor || 0), 0);
  const prox7 = items.filter((i) => i.status !== 'Recebido' && i.vencimento >= todayISO() && i.vencimento <= addD(todayISO(), 7)).length;

  function addD(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function del(id) { DB.remove('contasReceber', id); refresh(); }
  function receber(id) { DB.update('contasReceber', id, { status: 'Recebido', dataRecebimento: todayISO() }); refresh(); toast('Recebimento registrado — fluxo de caixa e saldo atualizados'); }

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Total a receber" value={fmtBRL(totalReceber)} /><Kpi label="Recebido no mês" value={fmtBRL(recebidoMes)} />
        <Kpi label="Vencido" value={fmtBRL(vencido)} /><Kpi label="Próx. 7 dias" value={prox7} />
      </div>
      <div className="toolbar" style={{ marginTop: 20 }}><button className="btn primary" onClick={() => openModal(<ReceberForm />)}>+ Nova parcela</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Cliente</th><th>Projeto</th><th>Parcela</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {items.length ? items.map((i) => {
              const cli = DB.get('clientes', i.clienteId); const p = DB.get('projetos', i.projetoId);
              let st = i.status; if (st !== 'Recebido' && i.vencimento < todayISO()) st = 'Vencido';
              return (
                <tr key={i.id}>
                  <td>{cli ? cli.nome : '—'}</td><td>{p ? '#' + p.numero : '—'}</td><td>{i.parcela}</td>
                  <td>{fmtBRL(i.valor)}</td><td>{fmtDate(i.vencimento)}</td>
                  <td><span className={`badge ${st === 'Recebido' ? 'ok' : st === 'Vencido' ? 'bad' : 'warn'}`}>{st}</span></td>
                  <td>
                    {i.status !== 'Recebido' && <button className="btn sm primary" onClick={() => receber(i.id)}>Receber</button>}{' '}
                    <button className="btn sm" onClick={() => openModal(<ReceberForm item={i} />)}>Editar</button>{' '}
                    <button className="btn sm danger" onClick={() => del(i.id)}>✕</button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan={7}><Empty>Nenhuma conta a receber</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
