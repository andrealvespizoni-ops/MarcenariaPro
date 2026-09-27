import { useState } from 'react';
import { DB } from './db';
import { useApp } from './AppContext';

export default function ConfigPage() {
  const { toast, refresh } = useApp();
  const cfg = DB.config();
  const [f, setF] = useState({
    nomeMarcenaria: cfg.nomeMarcenaria || '', cnpj: cfg.cnpj || '', telefone: cfg.telefone || '', whatsapp: cfg.whatsapp || '',
    email: cfg.email || '', endereco: cfg.endereco || '', impostoPadrao: cfg.impostoPadrao || 0, margemPadrao: cfg.margemPadrao || 0,
    proLaborePadrao: cfg.proLaborePadrao || 0, capitalGiroMinimo: cfg.capitalGiroMinimo || 0,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function save() {
    DB.setConfig({
      ...f, impostoPadrao: Number(f.impostoPadrao || 0), margemPadrao: Number(f.margemPadrao || 0),
      proLaborePadrao: Number(f.proLaborePadrao || 0), capitalGiroMinimo: Number(f.capitalGiroMinimo || 0),
    });
    refresh(); toast('Configurações salvas');
  }

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="field"><label>Nome da marcenaria</label><input type="text" value={f.nomeMarcenaria} onChange={set('nomeMarcenaria')} /></div>
      <div className="row">
        <div className="field"><label>CNPJ</label><input type="text" value={f.cnpj} onChange={set('cnpj')} /></div>
        <div className="field"><label>Telefone</label><input type="tel" value={f.telefone} onChange={set('telefone')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>WhatsApp</label><input type="tel" value={f.whatsapp} onChange={set('whatsapp')} /></div>
        <div className="field"><label>E-mail</label><input type="email" value={f.email} onChange={set('email')} /></div>
      </div>
      <div className="field"><label>Endereço</label><input type="text" value={f.endereco} onChange={set('endereco')} /></div>
      <hr className="divider" />
      <div className="row">
        <div className="field"><label>% Impostos padrão</label><input type="number" value={f.impostoPadrao} onChange={set('impostoPadrao')} /></div>
        <div className="field"><label>% Margem padrão</label><input type="number" value={f.margemPadrao} onChange={set('margemPadrao')} /></div>
      </div>
      <div className="row">
        <div className="field"><label>Pró-labore padrão</label><input type="number" value={f.proLaborePadrao} onChange={set('proLaborePadrao')} /></div>
        <div className="field"><label>Capital de giro mínimo</label><input type="number" value={f.capitalGiroMinimo} onChange={set('capitalGiroMinimo')} /></div>
      </div>
      <button className="btn primary" onClick={save}>Salvar configurações</button>
    </div>
  );
}
