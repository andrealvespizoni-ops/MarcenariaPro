import { useState } from 'react';
import { DB } from './db';
import { AppProvider, useApp } from './AppContext';

import Dashboard from './Dashboard';
import Clientes from './Clientes';
import Leads from './Leads';
import Orcamentos from './Orcamentos';
import Projetos from './Projetos';
import Central from './Central';
import Compras from './Compras';
import Receber from './Receber';
import Pagar from './Pagar';
import Fluxo from './Fluxo';
import Giro from './Giro';
import Prolabore from './Prolabore';
import Lucros from './Lucros';
import Despesas from './Despesas';
import Relatorios from './Relatorios';
import ConfigPage from './ConfigPage';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', sub: 'Visão geral do negócio', C: Dashboard },
  { id: 'clientes', label: 'Clientes', icon: '👤', sub: 'Cadastro e histórico de clientes', C: Clientes },
  { id: 'leads', label: 'Leads / Vendas', icon: '📈', sub: 'Funil de vendas (CRM)', C: Leads },
  { id: 'orcamentos', label: 'Orçamentos', icon: '📝', sub: 'Monte e calcule orçamentos', C: Orcamentos },
  { id: 'projetos', label: 'Projetos', icon: '📦', sub: 'Acompanhamento da produção terceirizada', C: Projetos },
  { id: 'central', label: 'Central de Serviços', icon: '🏭', sub: 'Gestão da produção terceirizada', C: Central },
  { id: 'compras', label: 'Compras', icon: '🛒', sub: 'Materiais e insumos', C: Compras },
  { id: 'receber', label: 'Contas a Receber', icon: '💰', sub: 'Parcelas a receber dos clientes', C: Receber },
  { id: 'pagar', label: 'Contas a Pagar', icon: '🧾', sub: 'Obrigações da marcenaria', C: Pagar },
  { id: 'fluxo', label: 'Fluxo de Caixa', icon: '💵', sub: 'Entradas x saídas', C: Fluxo },
  { id: 'giro', label: 'Capital de Giro', icon: '⚖️', sub: 'Saúde financeira de curto prazo', C: Giro },
  { id: 'prolabore', label: 'Pró-labore', icon: '🧑‍💼', sub: 'Retirada dos sócios (não é lucro)', C: Prolabore },
  { id: 'lucros', label: 'Lucros', icon: '📊', sub: 'Demonstrativo de resultado', C: Lucros },
  { id: 'despesas', label: 'Despesas Fixas', icon: '📌', sub: 'Custos recorrentes', C: Despesas },
  { id: 'relatorios', label: 'Relatórios', icon: '📑', sub: 'Análises e exportações', C: Relatorios },
  { id: 'config', label: 'Configurações', icon: '⚙️', sub: 'Dados da marcenaria e parâmetros', C: ConfigPage },
];

function Shell() {
  const { tick } = useApp();
  const [route, setRoute] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = NAV.find((n) => n.id === route);
  const Page = active.C;

  function toggleTheme() {
    const root = document.documentElement;
    const cur = root.getAttribute('data-theme');
    root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className="app">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="logo">🪚</div>
          <div className="name">{DB.config().nomeMarcenaria || 'Marcenaria PRO'}</div>
        </div>
        <nav>
          {NAV.map((n) => (
            <div
              key={n.id}
              className={`navitem ${route === n.id ? 'active' : ''}`}
              onClick={() => { setRoute(n.id); setMobileOpen(false); }}
            >
              <span className="ic">{n.icon}</span><span className="navlabel">{n.label}</span>
            </div>
          ))}
        </nav>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>⟨⟩</button>
      </aside>
      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="iconbtn menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
            <div>
              <h1>{active.label}</h1>
              <div className="sub">{active.sub}</div>
            </div>
          </div>
          <button className="iconbtn" onClick={toggleTheme} title="Alternar tema">🌓</button>
        </div>
        <div className="content" key={route + '-' + tick}>
          <Page />
        </div>
        <div className="footprint">Marcenaria PRO · dados salvos neste dispositivo (localStorage)</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
