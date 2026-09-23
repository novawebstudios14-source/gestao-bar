# Controle do Bar

Sistema de gestão de mesas, comandas, estoque e resultados por período.

O código-fonte do aplicativo está neste repositório. A aplicação usa rotas de servidor e banco D1, portanto o GitHub Pages não executa o sistema completo; a página estática em `docs/` direciona ao aplicativo funcional hospedado separadamente.

Aplicativo: https://controle-bar-estoque.diastolic-lounge6.chatgpt.site

## Desenvolvimento

```sh
pnpm install
pnpm dev
```

A implantação do aplicativo precisa de um ambiente com suporte ao Worker e ao banco D1 configurados em `.openai/hosting.json`. Os dados de demonstração estão no banco de produção e não são exportados para este repositório.
