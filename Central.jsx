import { useState } from 'react';
import { DB, fmtBRL, fmtDate, todayISO, monthKey, CENTRAL_STATUS } from '../lib/db';
import { Kpi, Empty } from '../components';
import { useApp } from '../AppContext';

function ServicoForm({ servico }) {
  const { refresh, closeModal, toast } = useApp();
  const s = servico || { status: 'Aguardando envio', pago: false };
  const [f, setF] = useState({
    projetoId: s.projetoId || '', centralId: s.centralId || '', dataEnvio: s.dataEnvio || '', prazo: s.prazo || '',
    dataPrevista: s.dataPrevista || '', dataRecebimento: s.dataRecebimento || '', valor: s.valor || '',
    formaPagamento: s.formaPagamento || '', status: s.status, pago: !!s.pago, obs: s.obs || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    const obj = { ...f, valor: Number(f.valor || 0) };
    if (s.id) DB.update('servicosCentral', s.id, obj); else DB.insert('servicosCentral', obj);
    closeModal(); refresh(); toast('Serviço salvo');
  }
  function del() { DB.remove('servicosCentral', s.id); closeModal(); refresh(); }
  return (
    <>
      <h3>{s.id ? 'Editar' : 'Novo'} Serviço da Central</h3>
      <div className="row">
        <div className="field"><label>Projeto</label>
          <select value={f.projetoId} onChange={set('projetoId')}>
            <option value="">Selecione...</option>
            {DB.all('projetos').map((p) => <option key={p.id} value={p.id}>#{p.numero}</option>)}
          </select>
        </div>
        <div className="field"><label>Central</label>
          <select value={f.centralId} onChange={set('centralId')}>
            <option value="">Selecione...</option>
            {DB.all('centrais').map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Data de envio</label><input type="date" value={f.dataEnvio} onChange={set('dataEnvio')} /></div>
        <div className="field"><label>Prazo (dias)</label><input type="number" value={f.prazo} onChange={set('prazo')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Data prevista</label><input type="date" value={f.dataPrevista} onChange={set('dataPrevista')} /></div>
        <div className="field"><label>Data de recebimento</label><input type="date" value={f.dataRecebimento} onChange={set('dataRecebimento')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Valor</label><input type="number" value={f.valor} onChange={set('valor')} /></div>
        <div className="field"><label>Forma de pagamento</label><input type="text" value={f.formaPagamento} onChange={set('formaPagamento')} /></div>
      </div>
      <div className="field"><label>Status</label><select value={f.status} onChange={set('status')}>{CENTRAL_STATUS.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div className="field"><label><input type="checkbox" style={{ width: 'auto' }} checked={f.pago} onChange={(e) => setF({ ...f, pago: e.target.checked })} /> Pago?</label></div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions">
        {s.id && <button className="btn danger" onClick={del}>Excluir</button>}
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

function CentralForm({ central }) {
  const { refresh, closeModal, toast } = useApp();
  const c = central || {};
  const [f, setF] = useState({ nome: c.nome || '', cnpj: c.cnpj || '', telefone: c.telefone || '', contato: c.contato || '', endereco: c.endereco || '', obs: c.obs || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    if (!f.nome.trim()) { toast('Informe o nome'); return; }
    const obj = { ...f, nome: f.nome.trim() };
    if (c.id) DB.update('centrais', c.id, obj); else DB.insert('centrais', obj);
    closeModal(); refresh(); toast('Central salva');
  }
  return (
    <>
      <h3>{c.id ? 'Editar' : 'Nova'} Central de Serviços</h3>
      <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set('nome')} /></div>
      <div className="row">
        <div className="field"><label>CNPJ</label><input type="text" value={f.cnpj} onChange={set('cnpj')} /></div>
        <div className="field"><label>Telefone</label><input type="tel" value={f.telefone} onChange={set('telefone')} /></div>
      </div>
      <div className="field"><label>Contato</label><input type="text" value={f.contato} onChange={set('contato')} /></div>
      <div className="field"><label>Endereço</label><input type="text" value={f.endereco} onChange={set('endereco')} /></div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions"><button className="btn ghost" onClick={closeModal}>Cancelar</button><button className="btn primary" onClick={save}>Salvar</button></div>
    </>
  );
}

export default function Central() {
  const { refresh, openModal } = useApp();
  const [tab, setTab] = useState('servicos');
  const servs = DB.all('servicosCentral');
  const mesAtual = servs.filter((s) => monthKey(s.dataEnvio) === monthKey(todayISO())).reduce((s, x) => s + Number(x.valor || 0), 0);
  const anoAtual = servs.filter((s) => (s.dataEnvio || '').slice(0, 4) === todayISO().slice(0, 4)).reduce((s, x) => s + Number(x.valor || 0), 0);
  const media = servs.length ? servs.reduce((s, x) => s + Number(x.valor || 0), 0) / servs.length : 0;
  const emProducao = servs.filter((s) => s.status === 'Em produção').length;
  const atrasados = servs.filter((s) => s.dataPrevista && s.dataPrevista < todayISO() && !['Recebido', 'Finalizado'].includes(s.status)).length;
  const retrabalhos = servs.filter((s) => s.status === 'Retrabalho').length;

  function delServ(id) { if (confirm('Excluir?')) { DB.remove('servicosCentral', id); refresh(); } }
  function delCen(id) { DB.remove('centrais', id); refresh(); }

  return (
    <div>
      <div className="grid kpis">
        <Kpi label="Gasto no mês" value={fmtBRL(mesAtual)} /><Kpi label="Gasto no ano" value={fmtBRL(anoAtual)} /><Kpi label="Média por projeto" value={fmtBRL(media)} />
        <Kpi label="Em produção" value={emProducao} /><Kpi label="Atrasados" value={atrasados} /><Kpi label="Retrabalhos" value={retrabalhos} />
      </div>
      <div className="tabs" style={{ marginTop: 20 }}>
        <div className={`tab ${tab === 'servicos' ? 'active' : ''}`} onClick={() => setTab('servicos')}>Serviços</div>
        <div className={`tab ${tab === 'centrais' ? 'active' : ''}`} onClick={() => setTab('centrais')}>Centrais Cadastradas</div>
      </div>
      {tab === 'servicos' ? (
        <>
          <div className="toolbar"><button className="btn primary" onClick={() => openModal(<ServicoForm />)}>+ Novo Serviço</button></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Projeto</th><th>Central</th><th>Envio</th><th>Previsto</th><th>Valor</th><th>Status</th><th>Pago</th><th>Ações</th></tr></thead>
              <tbody>
                {servs.length ? servs.map((s) => {
                  const proj = DB.get('projetos', s.projetoId); const cen = DB.get('centrais', s.centralId);
                  const atrasado = s.dataPrevista && s.dataPrevista < todayISO() && !['Recebido', 'Finalizado'].includes(s.status);
                  return (
                    <tr key={s.id}>
                      <td>{proj ? '#' + proj.numero : '—'}</td><td>{cen ? cen.nome : '—'}</td><td>{fmtDate(s.dataEnvio)}</td>
                      <td>{atrasado ? <span className="badge bad">{fmtDate(s.dataPrevista)}</span> : fmtDate(s.dataPrevista)}</td>
                      <td>{fmtBRL(s.valor)}</td><td><span className="badge neutral">{s.status}</span></td><td>{s.pago ? '✅' : '—'}</td>
                      <td><button className="btn sm" onClick={() => openModal(<ServicoForm servico={s} />)}>Editar</button> <button className="btn sm danger" onClick={() => delServ(s.id)}>✕</button></td>
                    </tr>
                  );
                }) : <tr><td colSpan={8}><Empty>Nenhum serviço registrado</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="toolbar"><button className="btn primary" onClick={() => openModal(<CentralForm />)}>+ Nova Central</button></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>Contato</th><th>Ações</th></tr></thead>
              <tbody>
                {DB.all('centrais').length ? DB.all('centrais').map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b></td><td>{c.cnpj || '—'}</td><td>{c.telefone || '—'}</td><td>{c.contato || '—'}</td>
                    <td><button className="btn sm" onClick={() => openModal(<CentralForm central={c} />)}>Editar</button> <button className="btn sm danger" onClick={() => delCen(c.id)}>✕</button></td>
                  </tr>
                )) : <tr><td colSpan={5}><Empty>Nenhuma central cadastrada</Empty></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
