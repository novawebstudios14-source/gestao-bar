# Publicação na conta Cloudflare do cliente

Os registros da instalação anterior são fictícios e o proprietário autorizou iniciar com um D1 novo e vazio. A instalação anterior fica intacta até os testes do novo endereço terminarem.

1. Confirme que a conta Cloudflare conectada é a conta do cliente e está no plano Workers Free. Crie um D1 vazio para o Controle do Bar.
2. Aplique `drizzle/0000_*.sql` até `drizzle/0005_*.sql`, em ordem numérica, nesse D1. Confira `PRAGMA foreign_key_check` e a presença das cinco tabelas do app. Não importe dados de teste da instalação antiga.
3. Configure um Worker `workers.dev` com o binding D1 `DB`. Defina `BAR_USER` e `BAR_PASSWORD` como segredos do Worker, fora do GitHub. Não publique o Worker sem autenticação funcionando.
4. Rode `pnpm install --frozen-lockfile && pnpm build` e `node scripts/prepare-cloudflare-deploy.mjs <ID-DO-D1> <NOME-DO-D1> <NOME-DO-WORKER>`. O script altera só `dist/server/wrangler.json`, que é ignorado pelo Git. Publique com `pnpm exec wrangler deploy --config dist/server/wrangler.json` na conta do cliente.
5. Teste acesso negado sem credenciais e com credenciais erradas, página e APIs com credenciais válidas, cadastro e edição, caixas de 12 e 24 com custo unitário, ajustes e vendas, ordem da comanda, promoções, encerramento e pagamento, relatórios diário, semanal e mensal. Faça um novo deploy e confirme a persistência no D1.
6. Meça CPU por requisição, requisições por dia e linhas lidas/escritas pelo D1; compare com os limites vigentes do plano gratuito. Se o Worker exceder limites, apresente a medição e o preço do plano alternativo antes de contratar.
7. Só depois dos testes atualize os links de `index.html` e `docs/index.html` no GitHub Pages. Se falhar, mantenha os links antigos. A instalação anterior não deve ser apagada ou cancelada nesta etapa.
