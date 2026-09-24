# Controle do Bar — instruções para agentes

Este repositório contém somente a estrutura visual do painel, com dados fictícios. Não há API, banco de dados, autenticação nem implantação de produção. Não apresente a prévia como sistema operacional nem reintroduza infraestrutura sem um pedido explícito.

## Fluxo de trabalho

- Para uma alteração de escopo significativo, definir comportamento e limites antes de editar. Para pequenos ajustes visuais, manter a descrição curta.
- Para telas, navegação, responsividade e acessibilidade, consultar `frontend-ui-engineering`.
- Se um fluxo falhar, investigar a causa antes de corrigir (`systematic-debugging`).
- Antes de entregar mudanças, revisar o código (`code-review-and-quality`) e conferir as afirmações com evidência recente (`verification-before-completion`).
- As habilidades ficam em `.agents/skills/` e são carregadas conforme a tarefa. Não executar etapas, testes ou publicação sem relação com a mudança solicitada.

## Projeto

- Aplicação: Next.js e React; a saída é estática (`output: "export"`).
- Interface principal: `app/page.tsx`; estilos: `app/bar.css` e `app/globals.css`; componentes usados: `components/ui/`.
- Executar `npm install` e `npm run build` para verificar mudanças que afetem a compilação.
- Não inserir dados de clientes, chaves, tokens ou senhas no repositório. Dados exibidos são apenas exemplos.

As habilidades de `systematic-debugging` e `verification-before-completion` vêm do projeto mantido [obra/superpowers](https://github.com/obra/superpowers). As demais vêm de [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills). Licenças e atribuições estão em `.agents/LICENSE-*`.
