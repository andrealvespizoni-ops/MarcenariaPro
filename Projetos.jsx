import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, projetoCusto, PROJ_ETAPAS } from '../lib/db';
import { Empty } from '../components';
import { useApp } from '../AppContext';

function pctEtapa(et) { const i = PROJ_ETAPAS.indexOf(et); return Math.round(((i + 1) / PROJ_ETAPAS.length) * 100); }

function ProjetoForm({ projeto }) {
  const { refresh, closeModal, toast } = useApp();
  const p = projeto;
  const [f, setF] = useState({ valorContratado: p.valorContratado, prazo: p.prazo || '', etapa: p.etapa, status: p.status, obs: p.obs || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    DB.update('projetos', p.id, { ...f, valorContratado: Number(f.valorContratado) });
    closeModal(); refresh(); toast('Projeto atualizado');
  }
  return (
    <>
      <h3>Projeto #{p.numero}</h3>
      <div className="row">
        <div className="field"><label>Valor contratado</label><input type="number" value={f.valorContratado} onChange={set('valorContratado')} /></div>
        <div className="field"><label>Prazo</label><input type="date" value={f.prazo} onChange={set('prazo')} /></div>
      </div>
      <div className="field">
        <label>Etapa</label>
        <select value={f.etapa} onChange={set('etapa')}>{PROJ_ETAPAS.map((e) => <option key={e}>{e}</option>)}</select>
      </div>
      <div className="field">
        <label>Status</label>
        <select value={f.status} onChange={set('status')}>
          <option>Em andamento</option><option>Pausado</option><option>Finalizado</option>
        </select>
      </div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions"><button className="btn ghost" onClick={closeModal}>Fechar</button><button className="btn primary" onClick={save}>Salvar</button></div>
    </>
  );
}

export default function Projetos() {
  const { openModal } = useApp();
  const projs = DB.all('projetos').slice().sort((a, b) => b.numero - a.numero);

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
      {projs.length ? projs.map((p) => {
        const cli = DB.get('clientes', p.clienteId);
        const custo = projetoCusto(p.id);
        const lucro = p.valorContratado - custo;
        const atrasado = p.prazo && p.prazo < todayISO() && p.status !== 'Finalizado';
        return (
          <div className="card" key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>Projeto #{p.numero}</b>
              {atrasado ? <span className="badge bad">Atrasado</span> : <span className="badge neutral">{p.status}</span>}
            </div>
            <div className="small" style={{ margin: '6px 0' }}>{cli ? cli.nome : '—'} · prazo {fmtDate(p.prazo)}</div>
            <div className="progressbar"><div style={{ width: pctEtapa(p.etapa) + '%' }} /></div>
            <div className="small" style={{ marginTop: 6 }}>{p.etapa} ({pctEtapa(p.etapa)}%)</div>
            <hr className="divider" />
            <div className="small">Contratado: <b>{fmtBRL(p.valorContratado)}</b></div>
            <div className="small">Custo até agora: <b>{fmtBRL(custo)}</b></div>
            <div className="small">Lucro estimado: <b>{fmtBRL(lucro)}</b></div>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="btn sm" onClick={() => openModal(<ProjetoForm projeto={p} />)}>Gerenciar</button>
            </div>
          </div>
        );
      }) : <Empty>Nenhum projeto ainda. Aprove um orçamento para criar o primeiro.</Empty>}
    </div>
  );
}
