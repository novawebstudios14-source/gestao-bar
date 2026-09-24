# Publicação na conta Cloudflare do cliente

Os registros da instalação anterior são fictícios e o proprietário autorizou iniciar com um D1 novo e vazio. A instalação anterior fica intacta até os testes do novo endereço terminarem.

1. Na conta Cloudflare do cliente, conecte o repositório GitHub e use `main` como branch de produção, `pnpm run build` como comando de build e `npx wrangler deploy` como comando de deploy. Não é necessário copiar ID, arquivo ou token para o repositório.
2. Durante o build na Cloudflare, o script localiza ou cria `gestao-bar-d1`, aplica `drizzle/cloudflare-fresh.sql` em um D1 vazio e substitui o binding `DB` pelo ID real no artefato `dist/server/wrangler.json`. Os dados fictícios antigos não são importados. O Worker deve se chamar `gestao-bar`, conforme o projeto criado no painel.
3. Após o primeiro deploy, defina `BAR_USER` e `BAR_PASSWORD` como segredos em **Workers & Pages → gestao-bar → Settings → Variables and Secrets**, fora do GitHub. Enquanto `BAR_PASSWORD` não existir, o aplicativo responde 503 e não abre o painel.
5. Teste acesso negado sem credenciais e com credenciais erradas, página e APIs com credenciais válidas, cadastro e edição, caixas de 12 e 24 com custo unitário, ajustes e vendas, ordem da comanda, promoções, encerramento e pagamento, relatórios diário, semanal e mensal. Faça um novo deploy e confirme a persistência no D1.
6. Meça CPU por requisição, requisições por dia e linhas lidas/escritas pelo D1; compare com os limites vigentes do plano gratuito. Se o Worker exceder limites, apresente a medição e o preço do plano alternativo antes de contratar.
7. Só depois dos testes atualize os links de `index.html` e `docs/index.html` no GitHub Pages. Se falhar, mantenha os links antigos. A instalação anterior não deve ser apagada ou cancelada nesta etapa.
