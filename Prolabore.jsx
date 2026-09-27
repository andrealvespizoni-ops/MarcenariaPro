import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, monthKey } from '../lib/db';
import { Kpi, Empty } from '../components';
import { useApp } from '../AppContext';

function ProLaboreForm() {
  const { refresh, closeModal, toast } = useApp();
  const [f, setF] = useState({ responsavel: '', valor: DB.config().proLaborePadrao || '', dataPagamento: todayISO(), obs: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    DB.insert('proLabore', { ...f, valor: Number(f.valor || 0) });
    closeModal(); refresh(); toast('Pró-labore lançado no fluxo de caixa');
  }
  return (
    <>
      <h3>Lançar Pró-labore</h3>
      <div className="row">
        <div className="field"><label>Responsável</label><input type="text" value={f.responsavel} onChange={set('responsavel')} /></div>
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="field"><label>Data de pagamento</label><input type="date" value={f.dataPagamento} onChange={set('dataPagamento')} /></div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions"><button className="btn ghost" onClick={closeModal}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></div>
    </>
  );
}

function DistForm() {
  const { refresh, closeModal, toast } = useApp();
  const [f, setF] = useState({ tipo: 'Distribuição de lucro', responsavel: '', valor: '', data: todayISO() });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    DB.insert('distribuicoes', { ...f, valor: Number(f.valor || 0) });
    closeModal(); refresh(); toast('Lançado');
  }
  return (
    <>
      <h3>Lançar Distribuição / Retirada</h3>
      <div className="field"><label>Tipo</label><select value={f.tipo} onChange={set('tipo')}><option>Distribuição de lucro</option><option>Retirada pessoal</option></select></div>
      <div className="row">
        <div className="field"><label>Responsável</label><input type="text" value={f.responsavel} onChange={set('responsavel')} /></div>
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
      </div>
      <div className="field"><label>Data</label><input type="date" value={f.data} onChange={set('data')} /></div>
      <div className="modal-actions"><button className="btn ghost" onClick={closeModal}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></div>
    </>
  );
}

export default function Prolabore() {
  const { refresh, openModal } = useApp();
  const items = DB.all('proLabore').slice().sort((a, b) => (b.dataPagamento || '').localeCompare(a.dataPagamento || ''));
  const dist = DB.all('distribuicoes').slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  const totalMes = items.filter((i) => monthKey(i.dataPagamento) === monthKey(todayISO())).reduce((s, i) => s + Number(i.valor || 0), 0);

  function delPL(id) { DB.remove('proLabore', id); refresh(); }
  function delDist(id) { DB.remove('distribuicoes', id); refresh(); }

  return (
    <div>
      <div className="alertbox warn"><span>ℹ️</span><div><b>Importante:</b> pró-labore e distribuição de lucro são retiradas separadas — nenhuma das duas é tratada como lucro da empresa.</div></div>
      <div className="grid kpis">
        <Kpi label="Pró-labore no mês" value={fmtBRL(totalMes)} />
        <Kpi label="Total distribuído (histórico)" value={fmtBRL(dist.reduce((s, d) => s + Number(d.valor || 0), 0))} />
      </div>
      <div className="section-title"><h2>Pró-labore</h2><button className="btn primary sm" onClick={() => openModal(<ProLaboreForm />)}>+ Lançar</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Responsável</th><th>Valor</th><th>Data de pagamento</th><th>Obs.</th><th>Ações</th></tr></thead>
          <tbody>
            {items.length ? items.map((i) => (
              <tr key={i.id}><td>{i.responsavel || '—'}</td><td>{fmtBRL(i.valor)}</td><td>{fmtDate(i.dataPagamento)}</td><td>{i.obs || ''}</td>
                <td><button className="btn sm danger" onClick={() => delPL(i.id)}>✕</button></td></tr>
            )) : <tr><td colSpan={5}><Empty>Nenhum lançamento</Empty></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="section-title"><h2>Distribuição de lucro / retiradas pessoais</h2><button className="btn primary sm" onClick={() => openModal(<DistForm />)}>+ Lançar</button></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Tipo</th><th>Responsável</th><th>Valor</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            {dist.length ? dist.map((d) => (
              <tr key={d.id}><td>{d.tipo}</td><td>{d.responsavel || '—'}</td><td>{fmtBRL(d.valor)}</td><td>{fmtDate(d.data)}</td>
                <td><button className="btn sm danger" onClick={() => delDist(d.id)}>✕</button></td></tr>
            )) : <tr><td colSpan={5}><Empty>Nenhum lançamento</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
