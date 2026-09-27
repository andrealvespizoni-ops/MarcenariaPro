import { useState } from 'react';
import { DB, fmtBRL, todayISO } from '../lib/db';
import { Kpi, Empty } from '../components';
import { useApp } from '../AppContext';

const DESP_CATS = ['Aluguel', 'Energia', 'Internet', 'Contabilidade', 'Sistemas', 'Telefone', 'Marketing', 'Salários', 'Pró-labore', 'Outros'];

function DespesaForm({ despesa }) {
  const { refresh, closeModal, toast } = useApp();
  const i = despesa || { recorrencia: 'Mensal', categoria: 'Outros' };
  const [f, setF] = useState({ nome: i.nome || '', categoria: i.categoria, valor: i.valor || '', diaVencimento: i.diaVencimento || 5, recorrencia: i.recorrencia });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    if (!f.nome.trim()) { toast('Informe o nome'); return; }
    const obj = { ...f, valor: Number(f.valor || 0), diaVencimento: Number(f.diaVencimento || 5) };
    if (i.id) DB.update('despesasFixas', i.id, obj); else DB.insert('despesasFixas', obj);
    closeModal(); refresh(); toast('Salvo');
  }
  function del() { DB.remove('despesasFixas', i.id); closeModal(); refresh(); }
  return (
    <>
      <h3>{i.id ? 'Editar' : 'Nova'} Despesa Fixa</h3>
      <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set('nome')} placeholder="Aluguel, Energia, Internet..." /></div>
      <div className="row">
        <div className="field"><label>Categoria</label><select value={f.categoria} onChange={set('categoria')}>{DESP_CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Dia de vencimento</label><input type="number" min={1} max={31} value={f.diaVencimento} onChange={set('diaVencimento')} /></div>
        <div className="field"><label>Recorrência</label><select value={f.recorrencia} onChange={set('recorrencia')}><option>Mensal</option><option>Anual</option></select></div>
      </div>
      <div className="modal-actions">
        {i.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Despesas() {
  const { refresh, openModal, toast } = useApp();
  const items = DB.all('despesasFixas');
  const total = items.reduce((s, i) => s + Number(i.valor || 0), 0);

  function del(id) { DB.remove('despesasFixas', id); refresh(); }
  function lancar(d) {
    const venc = todayISO().slice(0, 8) + String(d.diaVencimento).padStart(2, '0');
    DB.insert('contasPagar', { despesa: d.nome, categoria: d.categoria, valor: d.valor, vencimento: venc, status: 'Pendente' });
    toast('Lançado em Contas a Pagar');
  }

  return (
    <div>
      <div className="grid kpis"><Kpi label="Total mensal fixo" value={fmtBRL(total)} /><Kpi label="Itens cadastrados" value={items.length} /></div>
      <div className="toolbar" style={{ marginTop: 20 }}><button className="btn primary" onClick={() => openModal(<DespesaForm />)}>+ Nova despesa fixa</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>Categoria</th><th>Valor</th><th>Vencimento (dia)</th><th>Recorrência</th><th>Ações</th></tr></thead>
          <tbody>
            {items.length ? items.map((i) => (
              <tr key={i.id}>
                <td><b>{i.nome}</b></td><td>{i.categoria}</td><td>{fmtBRL(i.valor)}</td><td>Dia {i.diaVencimento}</td><td>{i.recorrencia}</td>
                <td>
                  <button className="btn sm" onClick={() => lancar(i)}>Lançar no mês</button>{' '}
                  <button className="btn sm" onClick={() => openModal(<DespesaForm despesa={i} />)}>Editar</button>{' '}
                  <button className="btn sm danger" onClick={() => del(i.id)}>✕</button>
                </td>
              </tr>
            )) : <tr><td colSpan={6}><Empty>Nenhuma despesa fixa cadastrada</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
