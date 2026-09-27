import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, LEAD_STATUS } from './db';
import { Kpi } from './components';
import { useApp } from './AppContext';

function LeadForm({ lead }) {
  const { refresh, closeModal, toast, openModal } = useApp();
  const l = lead || { status: 'Novo lead', data: todayISO() };
  const [f, setF] = useState({
    clienteId: l.clienteId || '', origem: l.origem || '', data: l.data, valorEstimado: l.valorEstimado || '',
    responsavel: l.responsavel || '', status: l.status, obs: l.obs || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    if (!f.clienteId) { toast('Selecione um cliente'); return; }
    const obj = { ...f, valorEstimado: Number(f.valorEstimado || 0) };
    if (l.id) DB.update('leads', l.id, obj); else DB.insert('leads', obj);
    closeModal(); refresh(); toast('Lead salvo');
  }
  function del() { if (confirm('Excluir lead?')) { DB.remove('leads', l.id); closeModal(); refresh(); } }
  return (
    <>
      <h3>{l.id ? 'Editar' : 'Novo'} Lead</h3>
      <div className="field">
        <label>Cliente</label>
        <select value={f.clienteId} onChange={set('clienteId')}>
          <option value="">Selecione...</option>
          {DB.all('clientes').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="small" style={{ margin: '-8px 0 12px' }}>
        <button className="link-btn" onClick={() => openModal(<div>Cadastre o cliente na página Clientes.</div>)}>+ cadastrar novo cliente na página Clientes</button>
      </div>
      <div className="row">
        <div className="field"><label>Origem</label><input type="text" value={f.origem} onChange={set('origem')} placeholder="Instagram, Indicação..." /></div>
        <div className="field"><label>Data</label><input type="date" value={f.data} onChange={set('data')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Valor estimado</label><input type="number" value={f.valorEstimado} onChange={set('valorEstimado')} /></div>
        <div className="field"><label>Responsável</label><input type="text" value={f.responsavel} onChange={set('responsavel')} /></div>
      </div>
      <div className="field">
        <label>Status</label>
        <select value={f.status} onChange={set('status')}>{LEAD_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions">
        {l.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

export default function Leads() {
  const { openModal } = useApp();
  const leads = DB.all('leads');
  const totalLeads = leads.length;
  const totalOrc = DB.all('orcamentos').length;
  const vendidos = leads.filter((l) => l.status === 'Contrato');
  const conversao = totalLeads ? (vendidos.length / totalLeads) * 100 : 0;
  const ticketMedio = vendidos.length ? vendidos.reduce((s, l) => s + Number(l.valorEstimado || 0), 0) / vendidos.length : 0;
  const totalVendido = vendidos.reduce((s, l) => s + Number(l.valorEstimado || 0), 0);

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Leads" value={totalLeads} /><Kpi label="Orçamentos" value={totalOrc} /><Kpi label="Vendas" value={vendidos.length} />
        <Kpi label="Conversão" value={conversao.toFixed(1) + '%'} /><Kpi label="Ticket médio" value={fmtBRL(ticketMedio)} /><Kpi label="Total vendido" value={fmtBRL(totalVendido)} />
      </div>
      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="btn primary" onClick={() => openModal(<LeadForm />)}>+ Novo Lead</button>
      </div>
      <div className="kanban">
        {LEAD_STATUS.map((st) => (
          <div className="kcol" key={st}>
            <h4>{st} <span className="small">{leads.filter((l) => l.status === st).length}</span></h4>
            {leads.filter((l) => l.status === st).map((l) => {
              const cli = DB.get('clientes', l.clienteId);
              return (
                <div className="kcard" key={l.id} onClick={() => openModal(<LeadForm lead={l} />)}>
                  <b>{cli ? cli.nome : '(sem cliente)'}</b>{fmtBRL(l.valorEstimado)}<br />
                  <span className="small">{l.origem || ''} · {fmtDate(l.data)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
