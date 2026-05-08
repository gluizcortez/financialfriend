export function HelpContent() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Como Usar o FinancialFriend</h1>

      <Section title="O que é o FinancialFriend?">
        <p>
          O FinancialFriend é um sistema de gestão financeira pessoal baseado na web. Permite que você
          acompanhe contas mensais, investimentos, FGTS, receitas, metas financeiras e patrimônio
          líquido, tudo de forma centralizada e segura.
        </p>
        <p className="mt-2">
          Você pode acessar de qualquer dispositivo com navegador. Seus dados ficam armazenados de
          forma segura no servidor — não há necessidade de instalar nada.
        </p>
      </Section>

      <Section title="Workspaces">
        <p>
          Workspaces são espaços financeiros independentes. Ao criar sua conta, um workspace
          chamado <strong>&quot;Meu Espaço&quot;</strong> é criado automaticamente para você.
        </p>
        <p className="mt-2">Você pode criar e gerenciar workspaces na página <strong>Workspaces</strong> (menu lateral):</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Crie múltiplos workspaces — ex: &quot;Pessoal&quot;, &quot;Casa&quot;, &quot;Empresa&quot;</li>
          <li>Cada workspace tem seus próprios dados: contas, investimentos, FGTS, receitas e metas</li>
          <li>Renomeie ou exclua workspaces dos quais você é dono</li>
          <li>Convide outras pessoas por e-mail para participar de um workspace</li>
        </ul>
        <p className="mt-2">
          Para trocar de workspace, use o seletor no topo de cada tela ou acesse a página
          <strong> Workspaces</strong> no menu.
        </p>
      </Section>

      <Section title="Convites e Notificações">
        <p>
          Para convidar alguém para um workspace, acesse <strong>Workspaces</strong> no menu lateral,
          escolha o workspace desejado e informe o e-mail da pessoa. O convidado receberá uma
          notificação assim que fizer login.
        </p>
        <p className="mt-2">
          O <strong>sino de notificações</strong> no menu lateral exibe um badge quando há convites
          pendentes. Ao clicar, você pode aceitar ou recusar convites recebidos. Notificações
          são removidas automaticamente após a interação, ou você pode limpá-las todas de uma vez
          usando o ícone de lixeira no painel de notificações.
        </p>
      </Section>

      <Section title="Dashboard">
        <p>
          O dashboard exibe uma visão consolidada das suas finanças. Alterne entre a
          visão <strong>Mensal</strong> e <strong>Anual</strong> usando os botões no topo.
        </p>
        <p className="mt-2">
          Quando você tem dois ou mais workspaces, aparece um filtro de pills no topo do dashboard
          para selecionar quais workspaces incluir nos gráficos e totais. Por padrão, <strong>Todos</strong> os
          workspaces são exibidos juntos.
        </p>
      </Section>

      <Section title="Contas Mensais">
        <p>Na seção <strong>Contas Mensais</strong> você pode:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Criar templates de contas recorrentes (aluguel, streaming, etc.)</li>
          <li>Gerar automaticamente as contas do mês a partir dos templates</li>
          <li>Marcar contas como pagas com um clique</li>
          <li>Adicionar anexos (comprovantes, boletos)</li>
          <li>Navegar por qualquer mês anterior ou futuro</li>
        </ul>
        <p className="mt-2">
          Os dados são separados por workspace — troque o workspace ativo no seletor do topo da tela.
        </p>
      </Section>

      <Section title="Receitas">
        <p>
          Registre todas as suas entradas financeiras por mês. Marque como recorrente para que a
          receita apareça automaticamente nos meses seguintes. Os dados são separados por workspace.
        </p>
      </Section>

      <Section title="Investimentos">
        <p>Controle toda sua carteira de investimentos por workspace:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Registre aportes, resgates e rendimentos</li>
          <li>O saldo é calculado automaticamente a partir das transações</li>
          <li>Veja a evolução do patrimônio ao longo do tempo</li>
          <li>Suporte a renda fixa, ações, fundos, criptomoedas e outros</li>
        </ul>
      </Section>

      <Section title="Metas">
        <p>Configure metas financeiras com:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Periodicidade: mensal, trimestral, semestral ou anual</li>
          <li>Metas manuais (registre contribuições manualmente)</li>
          <li>Metas vinculadas a investimentos (acompanha automaticamente seus aportes)</li>
        </ul>
      </Section>

      <Section title="FGTS">
        <p>
          Registre o saldo do FGTS mês a mês. O valor mais recente de cada workspace é somado
          automaticamente no cálculo do patrimônio total.
        </p>
      </Section>

      <Section title="Patrimônio">
        <p>
          A seção <strong>Patrimônio</strong> consolida todos os seus investimentos e o saldo
          mais recente do FGTS do workspace ativo em uma visão única, exibindo o total acumulado.
        </p>
      </Section>

      <Section title="Configurações">
        <p>Em <strong>Configurações</strong> você pode:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Criar e gerenciar categorias de despesas e investimentos</li>
          <li>Adicionar campos personalizados para suas contas</li>
          <li>Ver os membros do workspace ativo</li>
        </ul>
        <p className="mt-2">
          Para criar, renomear ou excluir workspaces e enviar convites, acesse a
          página <strong>Workspaces</strong> no menu lateral.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}
