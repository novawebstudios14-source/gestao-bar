# Controle do Bar

Sistema de gestão de mesas, comandas, estoque e resultados por período.

## Hospedagem

O GitHub Pages publica somente a [página de acesso](https://novawebstudios14-source.github.io/gestao-bar/). O painel usa rotas Next.js e D1 na implantação Cloudflare. Até a validação do novo endereço, o painel existente continua na [instalação anterior](https://controle-bar-estoque.diastolic-lounge6.chatgpt.site).

### Cloudflare Workers + D1

Para a conta Cloudflare do cliente, conecte este repositório ao Workers Builds. O build `pnpm run build` cria ou reutiliza o D1 `gestao-bar-d1`, aplica o esquema vazio e configura o ID real no artefato antes de `npx wrangler deploy`. Consulte [o procedimento de ativação e testes](docs/cloudflare-migration.md). Os dados anteriores são fictícios e não serão importados. O painel só abre após configurar `BAR_PASSWORD` como segredo do Worker.

### Railway (alternativa não ativada)

Para ativar no Railway:

1. Crie um projeto e implante este repositório (`main`).
2. Anexe um volume persistente ao serviço, montado em `/data`.
3. Configure `DATABASE_PATH=/data/bar.sqlite`, `BAR_USER=bar` e uma senha forte em `BAR_PASSWORD`.
4. Gere um domínio público e confira `/api/health`. O painel e as APIs exigem autenticação HTTP Basic.
5. Migre os dados do D1 antigo para o novo banco antes de usar o novo endereço em produção. Os dados de operação **não** estão neste repositório e o banco novo começa vazio.
6. Atualize os links da página de acesso em `index.html` e `docs/index.html` para o novo endereço após verificar a migração.

A conta Railway precisa oferecer capacidade para um novo projeto, serviço e volume. O projeto usa Node.js 22 ou superior. `pnpm build:railway` compila; `pnpm start:railway` inicia o servidor.

## Desenvolvimento

A hospedagem anterior usa Cloudflare D1 e permanece independente do banco Railway. Para executar a versão Railway localmente, configure `DATABASE_PATH` para um arquivo SQLite local e `BAR_PASSWORD` antes de iniciar o servidor Next.js.
