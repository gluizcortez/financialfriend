-- Migration 0004: Seed initial release notes for Kortex v1.0.0

INSERT INTO release_notes (version, title, content, published_at, is_latest)
VALUES (
  'v1.0.0',
  'Kortex - Lançamento Inicial',
  E'## Bem-vindo ao Kortex!\n\nO Kortex é a evolução do GFGC para uma plataforma web moderna, segura e colaborativa.\n\n### Novidades desta versão\n\n- **Acesso web**: Use em qualquer navegador, sem instalação\n- **Multi-usuário**: Gabriel e Carol podem acessar os mesmos dados em tempo real\n- **Segurança**: Dados protegidos por Row Level Security no Supabase\n- **Contas Mensais**: Geração automática de recorrências, marcação de pagamento, anexos\n- **Investimentos**: Controle de carteira com histórico de aportes, resgates e rendimentos\n- **FGTS**: Acompanhamento do saldo por workspace e mês\n- **Metas**: Metas manuais e vinculadas a investimentos com gráficos de progresso\n- **Receitas**: Controle de entradas com recorrência automática\n- **Patrimônio**: Visão consolidada de investimentos + FGTS com múltiplas abas\n- **Dashboard**: Gráficos de evolução, distribuição de categorias e alertas de vencimento\n- **Busca global**: Acesse qualquer seção ou dado rapidamente (Cmd+K)\n- **Tema escuro**: Suporte completo a dark mode',
  now(),
  true
);
