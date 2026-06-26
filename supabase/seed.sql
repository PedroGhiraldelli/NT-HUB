-- ============================================================
-- NT Automação Hub — Seed de desenvolvimento
-- ============================================================
-- ATENÇÃO: Este seed insere registros em public.profiles com UUIDs fictícios.
-- Os usuários correspondentes em auth.users DEVEM ser criados primeiro via:
--   1. Tela de admin do sistema (/admin/users/new), OU
--   2. Supabase Dashboard → Authentication → Users → "Invite user"
-- Os UUIDs abaixo são exemplos — substitua pelos IDs reais gerados pelo Supabase Auth.
-- ============================================================

-- Usuários de exemplo (substitua os UUIDs pelos reais do auth.users)
INSERT INTO public.profiles (id, full_name, email, role, company, managed_company, active)
VALUES
  -- Admin principal
  ('00000000-0000-0000-0000-000000000001',
   'Pedro Ghiraldelli',
   'pedro@novatrindade.com.br',
   'admin',
   'Nova Trindade SSC',
   NULL,
   true),

  -- Director da Brasbuilding
  ('00000000-0000-0000-0000-000000000002',
   'Carlos Mendes',
   'diretor.brasbuilding@novatrindade.com.br',
   'director',
   'Nova Trindade SSC',
   'Brasbuilding',
   true),

  -- Colaborador da Brasbuilding
  ('00000000-0000-0000-0000-000000000003',
   'Ana Paula Ribeiro',
   'ana.ribeiro@brasbuilding.com.br',
   'collaborator',
   'Brasbuilding',
   NULL,
   true),

  -- Colaborador da Safe Conversão Digital
  ('00000000-0000-0000-0000-000000000004',
   'Marcos Souza',
   'marcos.souza@safe.com.br',
   'collaborator',
   'Safe Conversão Digital',
   NULL,
   true)
ON CONFLICT (id) DO NOTHING;

-- Inicializar sequências para 2026
INSERT INTO public.request_sequences (year, last_number) VALUES (2026, 0) ON CONFLICT DO NOTHING;
INSERT INTO public.article_sequences (year, last_number) VALUES (2026, 0) ON CONFLICT DO NOTHING;

-- ============================================================
-- Chamados de exemplo
-- ============================================================

-- Chamado 1: Novo (Brasbuilding)
INSERT INTO public.automation_requests (
  request_number, title, company,
  submitter_id, submitter_name, submitter_email,
  task_description, frequency, time_per_execution, people_count,
  only_m365, systems_involved, requires_external_login, has_captcha,
  data_sources, data_destinations,
  business_justification, business_rules,
  status
) VALUES (
  'NT-2026-001',
  'Baixar extratos bancários e consolidar em planilha',
  'Brasbuilding',
  '00000000-0000-0000-0000-000000000003',
  'Ana Paula Ribeiro',
  'ana.ribeiro@brasbuilding.com.br',
  'Acesso o portal do Banco Bradesco, navego até Extratos, seleciono o período do dia anterior, faço download do arquivo OFX, abro no Excel, copio os lançamentos e colo na planilha de controle financeiro do SharePoint.',
  'Diariamente',
  '15–30 min',
  2,
  'no',
  'Portal Bradesco Internet Banking, Microsoft Excel, SharePoint',
  'yes',
  'no',
  ARRAY['Portal web', 'Planilha Excel'],
  ARRAY['SharePoint', 'Planilha Excel'],
  'Se não for feito no dia, o fechamento financeiro da semana atrasa e o CFO não tem visibilidade do saldo consolidado.',
  'Rodar apenas em dias úteis. Verificar se o saldo final do dia bate com o saldo do sistema ERP antes de salvar.',
  'new'
);

-- Chamado 2: Em Análise (Brasbuilding)
INSERT INTO public.automation_requests (
  request_number, title, company,
  submitter_id, submitter_name, submitter_email,
  task_description, frequency, time_per_execution, people_count,
  only_m365, systems_involved, requires_external_login, has_captcha,
  data_sources, data_destinations,
  business_justification, business_rules,
  status, analyst_notes
) VALUES (
  'NT-2026-002',
  'Emissão de NF-e para clientes recorrentes',
  'Brasbuilding',
  '00000000-0000-0000-0000-000000000003',
  'Ana Paula Ribeiro',
  'ana.ribeiro@brasbuilding.com.br',
  'Acesso o sistema TOTVS Protheus, entro no módulo Faturamento, busco os pedidos aprovados do dia, verifico os dados cadastrais de cada cliente, preencho os campos da NF-e (CFOP, CST, valor, alíquota ICMS) e transmito via SEFAZ.',
  'Diariamente',
  '30–60 min',
  1,
  'no',
  'TOTVS Protheus, SEFAZ-SP (portal NF-e)',
  'yes',
  'yes',
  ARRAY['Sistema interno', 'Portal web'],
  ARRAY['Sistema interno', 'E-mail'],
  'A emissão manual consome 1h/dia e já causou erros de CFOP que geraram multas. A automatização reduziria o risco fiscal.',
  'Validar CNPJ ativo antes de emitir. Se valor > R$ 50.000, aguardar aprovação do gerente no e-mail antes de transmitir.',
  'analyzing',
  'Complexidade alta pelo CAPTCHA do portal SEFAZ. Avaliar uso de automação assistida ou OCR. Solicitar acesso de teste ao ambiente SEFAZ homologação.'
);

-- Chamado 3: Aprovado (Safe Conversão Digital)
INSERT INTO public.automation_requests (
  request_number, title, company,
  submitter_id, submitter_name, submitter_email,
  task_description, frequency, time_per_execution, people_count,
  only_m365, systems_involved, requires_external_login, has_captcha,
  data_sources, data_destinations,
  business_justification, business_rules,
  status, analyst_notes
) VALUES (
  'NT-2026-003',
  'Relatório semanal de leads do CRM para Excel',
  'Safe Conversão Digital',
  '00000000-0000-0000-0000-000000000004',
  'Marcos Souza',
  'marcos.souza@safe.com.br',
  'Acesso o HubSpot, filtro os leads da semana por status (MQL, SQL, Proposta), exporto para CSV, abro no Excel, aplico formatação de cores por status e envio por e-mail para o time de vendas.',
  'Semanalmente',
  '5–15 min',
  1,
  'no',
  'HubSpot CRM, Microsoft Excel, Outlook',
  'no',
  'no',
  ARRAY['Sistema interno', 'Portal web'],
  ARRAY['Planilha Excel', 'E-mail'],
  'O time de vendas precisa do relatório toda segunda-feira às 8h. Quando esquecemos, a reunião de pipeline atrasa.',
  'Executar toda segunda-feira às 07:30. Enviar para: vendas@safe.com.br e diretoria@safe.com.br',
  'approved',
  'Processo simples, sem CAPTCHA e 100% em ferramentas com API. HubSpot tem API nativa. Previsto para n8n com integração HubSpot → Excel Online → Outlook. Estimativa: 4h desenvolvimento.'
);

-- ============================================================
-- Artigos de exemplo
-- ============================================================

INSERT INTO public.knowledge_articles (
  article_number, title, company, category, tags, content,
  author_id, author_name, status
) VALUES (
  'KB-2026-001',
  'Como emitir Certidão Negativa de Débitos (CND) Federal',
  'Nova Trindade SSC',
  'fiscal',
  ARRAY['CND', 'Receita Federal', 'certidão', 'fiscal'],
  E'## Objetivo\n\nEste documento descreve o processo para emitir a Certidão Negativa de Débitos (CND) junto à Receita Federal do Brasil.\n\n## Quando emitir\n\nA CND é solicitada em situações como:\n- Licitações e contratos públicos\n- Operações de crédito bancário\n- Transferência de imóveis\n- Auditorias internas\n\n## Passo a passo\n\n**1. Acesse o portal**\nAcesse o site da Receita Federal: https://www.receita.fazenda.gov.br\n\n**2. Localize a opção de certidão**\nNo menu principal, clique em *Certidões e Situação Fiscal* → *Certidão de Débitos*.\n\n**3. Informe o CNPJ**\nDigite o CNPJ da empresa sem pontuação e clique em *Emitir*.\n\n**4. Verifique o resultado**\n- Se **Negativa**: baixe o PDF imediatamente. Válido por 180 dias.\n- Se **Positiva com Efeitos de Negativa**: verifique os parcelamentos vigentes.\n- Se **Positiva**: contacte o departamento fiscal para regularização.\n\n**5. Arquive o documento**\nSalve no SharePoint em: `Fiscal > Certidões > [Empresa] > [Ano]`\n\n## Regras importantes\n\n- A CND tem validade de **180 dias** a partir da emissão.\n- O sistema da Receita pode ficar instável em dias de vencimento de impostos (todo dia 20 e último dia útil do mês).\n- Em caso de divergência, abrir protocolo no e-CAC antes de escalar para advogado tributário.\n\n## Contato interno\n\nDúvidas: setor.fiscal@novatrindade.com.br',
  '00000000-0000-0000-0000-000000000001',
  'Pedro Ghiraldelli',
  'published'
),
(
  'KB-2026-002',
  'Processo de conciliação bancária mensal',
  'Nova Trindade SSC',
  'accounting',
  ARRAY['conciliação', 'bancária', 'contábil', 'fechamento'],
  E'## Objetivo\n\nPadronizar o processo de conciliação bancária mensal para todas as empresas do grupo Nova Trindade.\n\n## Prazo\n\nA conciliação deve ser finalizada até o **5º dia útil** do mês seguinte.\n\n## Pré-requisitos\n\n- Acesso ao sistema contábil (TOTVS Protheus)\n- Extrato bancário completo do período (formato OFX ou PDF)\n- Planilha de conciliação do SharePoint\n\n## Passo a passo\n\n**1. Baixe os extratos bancários**\n\nAcesse o internet banking de cada banco e baixe os extratos do mês em formato OFX:\n- Bradesco: Portal PJ → Extratos → Formato OFX\n- Itaú: Portal Empresas → Extratos → Exportar\n\n**2. Importe no TOTVS**\n\nNo Protheus, acesse *Financeiro → Bancos → Importar Extrato*. Selecione o arquivo OFX e confirme os lançamentos.\n\n**3. Identifique as diferenças**\n\nCompare o saldo do extrato com o saldo contábil. As diferenças comuns são:\n- Cheques emitidos não compensados\n- Tarifas bancárias não lançadas\n- Depósitos em trânsito\n\n**4. Efetue os ajustes**\n\nPara cada diferença identificada, registre o ajuste no Protheus com o histórico descritivo e o centro de custo correto.\n\n**5. Documente e aprove**\n\nPreencha a planilha de conciliação no SharePoint (`Contábil > Conciliação Bancária > [Empresa] > [Mês-Ano]`) e envie para aprovação do supervisor contábil.\n\n## Regras de negócio\n\n- Diferenças acima de **R$ 500,00** devem ser reportadas ao gestor imediatamente.\n- Nunca estornar lançamentos sem aprovação por e-mail do supervisor.\n- Manter os arquivos OFX arquivados por no mínimo 5 anos (Lei 9.430/96).\n\n## Dúvidas\n\nContate a equipe de contabilidade: contabilidade@novatrindade.com.br',
  '00000000-0000-0000-0000-000000000001',
  'Pedro Ghiraldelli',
  'published'
);
