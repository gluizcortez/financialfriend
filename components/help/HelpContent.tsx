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
          Você pode acessar o FinancialFriend de qualquer dispositivo com navegador. Seus dados ficam
          armazenados de forma segura no servidor — não há necessidade de instalar nada.
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
      </Section>

      <Section title="Investimentos">
        <p>Controle toda sua carteira de investimentos:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Registre aportes, resgates e rendimentos</li>
          <li>O saldo é calculado automaticamente</li>
          <li>Veja a evolução do patrimônio ao longo do tempo</li>
          <li>Suporte a renda fixa, ações, fundos, criptomoedas e outros</li>
        </ul>
      </Section>

      <Section title="FGTS">
        <p>
          Registre o saldo do FGTS mês a mês por workspace. O valor mais recente é usado no
          cálculo do patrimônio total.
        </p>
      </Section>

      <Section title="Metas">
        <p>Configure metas financeiras com:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
          <li>Periodicidade: mensal, trimestral, semestral ou anual</li>
          <li>Metas manuais (registre contribuições manualmente)</li>
          <li>Metas vinculadas a investimentos (acompanha automaticamente seus aportes)</li>
        </ul>
      </Section>

      <Section title="Receitas">
        <p>
          Registre todas as suas entradas financeiras por mês. Marque como recorrente para que a
          receita apareça automaticamente nos meses seguintes.
        </p>
      </Section>

      <Section title="Patrimônio">
        <p>
          A seção <strong>Patrimônio</strong> consolida seus investimentos e FGTS em uma visão
          única. Crie múltiplas abas para organizar diferentes perspectivas (ex: curto prazo, longo
          prazo).
        </p>
      </Section>

      <Section title="Workspaces">
        <p>
          Workspaces organizam seus dados por contexto. Por exemplo, você pode ter um workspace
          &quot;Pessoal&quot; e outro &quot;Empresa&quot; para contas separadas.
          Vá em <strong>Configurações</strong> para criar e gerenciar workspaces.
        </p>
      </Section>

      <Section title="Compartilhamento">
        <p>
          Seu espaço financeiro pode ser compartilhado com outras pessoas. Entre em contato pelo
          e-mail de suporte para receber um convite de acesso ao mesmo household.
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
