# Controle do Bar

Sistema de mesas, comandas, vendas, estoque, entradas e ajustes. A opção **Ver demonstração** mostra dados fictícios isolados; **Dados reais** lê e grava no Supabase. Os dados reais começam vazios. As datas da demonstração acompanham o dia em que a página é aberta.

O faturamento, o custo das vendas e o lucro bruto só incluem comandas com pagamento confirmado, no dia da confirmação (horário de São Paulo). Pedidos em aberto aparecem no histórico como pendentes, sem entrar nesses totais. Compras e ajustes continuam contabilizados pela data do respectivo lançamento.

O banco é configurado por `supabase/schema.sql`. O projeto Supabase usa acesso anônimo de leitura e escrita, conforme decisão explícita do proprietário: **qualquer pessoa com o link e a chave pública poderá ler e alterar os dados**. Não use dados sensíveis. Para restringir acesso, substitua as políticas RLS por autenticação antes de entregar a terceiros.

Para visualizar localmente, instale as dependências com `npm install` e execute `npm run dev`. Para conferir a compilação, use `npm run build`. A publicação na Vercel ocorre a partir deste repositório conectado.
