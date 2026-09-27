import { useState } from 'react';
import { DB, fmtBRL, fmtDate, clienteResumo, calcOrcamento } from './db';
import { Kpi, Empty } from './components';
import { useApp } from './AppContext';

function ClienteForm({ cliente }) {
  const { refresh, closeModal, toast } = useApp();
  const c = cliente || {};
  const [f, setF] = useState({
    nome: c.nome || '', cpfCnpj: c.cpfCnpj || '', whatsapp: c.whatsapp || '', email: c.email || '',
    endereco: c.endereco || '', cidade: c.cidade || '', estado: c.estado || '', obs: c.obs || '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function save() {
    if (!f.nome.trim()) { toast('Informe o nome'); return; }
    const obj = { ...f, nome: f.nome.trim(), estado: f.estado.toUpperCase() };
    if (c.id) DB.update('clientes', c.id, obj); else DB.insert('clientes', obj);
    closeModal(); refresh(); toast('Cliente salvo');
  }
  return (
    <>
      <h3>{c.id ? 'Editar' : 'Novo'} Cliente</h3>
      <div className="field"><label>Nome</label><input type="text" value={f.nome} onChange={set('nome')} /></div>
      <div className="row">
        <div className="field"><label>CPF/CNPJ</label><input type="text" value={f.cpfCnpj} onChange={set('cpfCnpj')} /></div>
        <div className="field"><label>WhatsApp</label><input type="tel" value={f.whatsapp} onChange={set('whatsapp')} /></div>
      </div>
      <div className="field"><label>E-mail</label><input type="email" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label>Endereço</label><input type="text" value={f.endereco} onChange={set('endereco')} /></div>
      <div className="row">
        <div className="field"><label>Cidade</label><input type="text" value={f.cidade} onChange={set('cidade')} /></div>
        <div className="field"><label>Estado</label><input type="text" maxLength={2} style={{ textTransform: 'uppercase' }} value={f.estado} onChange={set('estado')} /></div>
      </div>
      <div className="field"><label>Observações</label><textarea rows={2} value={f.obs} onChange={set('obs')} /></div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={closeModal}>Cancelar</button>
        <button className="btn primary" onClick={save}>Salvar</button>
      </div>
    </>
  );
}

function ClienteView({ cliente }) {
  const { closeModal } = useApp();
  const c = cliente;
  const r = clienteResumo(c.id);
  return (
    <>
      <h3>{c.nome}</h3>
      <div className="small">{c.cpfCnpj || ''} · {c.whatsapp || ''} · {c.email || ''}</div>
      <hr className="divider" />
      <div className="grid kpis">
        <Kpi label="Contratado" value={fmtBRL(r.contratado)} />
        <Kpi label="Recebido" value={fmtBRL(r.recebido)} />
        <Kpi label="Pendente" value={fmtBRL(r.pendente)} />
      </div>
      <h4 style={{ marginTop: 16 }}>Orçamentos</h4>
      {r.orcs.length ? r.orcs.map((o) => (
        <div className="small" key={o.id}>Nº {o.numero} — {o.ambiente || ''} — {fmtBRL(calcOrcamento(o).preco)} — <span className="badge neutral">{o.status}</span></div>
      )) : <div className="small">Nenhum</div>}
      <h4 style={{ marginTop: 16 }}>Projetos</h4>
      {r.projs.length ? r.projs.map((p) => (
        <div className="small" key={p.id}>Nº {p.numero} — {fmtBRL(p.valorContratado)} — <span className="badge neutral">{p.status}</span></div>
      )) : <div className="small">Nenhum</div>}
      <h4 style={{ marginTop: 16 }}>Histórico financeiro</h4>
      {r.cr.length ? r.cr.map((x) => (
        <div className="small" key={x.id}>Parcela {x.parcela} — {fmtBRL(x.valor)} — venc. {fmtDate(x.vencimento)} — <span className={`badge ${x.status === 'Recebido' ? 'ok' : 'warn'}`}>{x.status}</span></div>
      )) : <div className="small">Nenhum</div>}
      <div className="modal-actions"><button className="btn primary" onClick={closeModal}>Fechar</button></div>
    </>
  );
}

export default function Clientes() {
  const { refresh, openModal, toast } = useApp();
  const [search, setSearch] = useState('');
  const items = DB.all('clientes').filter((c) => !search || c.nome.toLowerCase().includes(search.toLowerCase()) || (c.cpfCnpj || '').includes(search));

  function del(id) { if (confirm('Excluir este cliente?')) { DB.remove('clientes', id); refresh(); toast('Cliente excluído'); } }

  return (
    <div>
      <div className="toolbar">
        <input className="searchbar" type="text" placeholder="Pesquisar por nome ou CPF/CNPJ" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn primary" onClick={() => openModal(<ClienteForm />)}>+ Novo Cliente</button>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>WhatsApp</th><th>Cidade/UF</th><th>Ações</th></tr></thead>
          <tbody>
            {items.length ? items.map((c) => (
              <tr key={c.id}>
                <td><b>{c.nome}</b></td><td>{c.cpfCnpj || '—'}</td><td>{c.whatsapp || '—'}</td>
                <td>{c.cidade || '—'}{c.estado ? '/' + c.estado : ''}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm" onClick={() => openModal(<ClienteView cliente={c} />)}>Ver</button>
                  <button className="btn sm" onClick={() => openModal(<ClienteForm cliente={c} />)}>Editar</button>
                  <button className="btn sm danger" onClick={() => del(c.id)}>Excluir</button>
                </td>
              </tr>
            )) : <tr><td colSpan={5}><Empty>Nenhum cliente cadastrado</Empty></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
