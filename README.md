# Marcenaria PRO

App de gestão para marcenaria planejada sem produção própria (produção 100% terceirizada para uma Central de Serviços).
Visual estilo Duolingo, em preto e branco.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (geralmente http://localhost:5173).

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
  lib/db.js        -> camada de dados (localStorage) + cálculos (orçamento, lucro, capital de giro, etc.)
  AppContext.jsx    -> contexto global (modal, toasts, refresh)
  components.jsx    -> componentes reutilizáveis (Kpi, Badge, Empty...)
  charts.jsx        -> wrappers de gráficos (Chart.js)
  App.jsx           -> layout, menu lateral e roteamento
  pages/            -> uma página por módulo (Dashboard, Clientes, Leads, Orçamentos, Projetos,
                        Central de Serviços, Compras, Contas a Receber/Pagar, Fluxo de Caixa,
                        Capital de Giro, Pró-labore, Lucros, Despesas Fixas, Relatórios, Configurações)
```

## Dados

Os dados ficam salvos no `localStorage` do navegador (chave `mkt_data_v1`). Use a página
**Relatórios > Backup** para exportar/importar tudo em um arquivo JSON.

## Migrar para um banco de dados (Supabase/Firebase)

Toda a persistência passa por `src/lib/db.js`, no objeto `DB` (`all`, `get`, `insert`, `update`,
`remove`, `nextNumber`, `config`, `setConfig`, `raw`, `replaceAll`). Para usar Supabase ou Firebase,
basta reimplementar esses métodos mantendo a mesma assinatura — as páginas em `src/pages/` não
precisam mudar.
