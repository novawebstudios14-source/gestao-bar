# Controle do Bar

Sistema de mesas, comandas, vendas, estoque, entradas e ajustes. A opção **Ver demonstração** mostra dados fictícios isolados; **Dados reais** lê e grava no Supabase. Os dados reais começam vazios. As datas da demonstração acompanham o dia em que a página é aberta.

O banco é configurado por `supabase/schema.sql`. O projeto Supabase usa acesso anônimo de leitura e escrita, conforme decisão explícita do proprietário: **qualquer pessoa com o link e a chave pública poderá ler e alterar os dados**. Não use dados sensíveis. Para restringir acesso, substitua as políticas RLS por autenticação antes de entregar a terceiros.

Para visualizar localmente, instale as dependências com `npm install` e execute `npm run dev`. Para conferir a compilação, use `npm run build`. A publicação na Vercel ocorre a partir deste repositório conectado.
