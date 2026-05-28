# SGTR Agricultor

Aplicacao React do agricultor com o fluxo atual do sistema e um novo bloco de boletim publico por municipio.

## Boletim do produtor

O app agora exibe um painel de boletim simples que consome apenas o boletim publico publicado pelo SGTR GOES-R Ambiental.

Fluxo:

1. Selecione um municipio.
2. Clique em `Ver boletim`.
3. O app consulta `GET /api/agricultor/bulletin`.
4. A rota local faz proxy para o backend do SGTR GOES-R Ambiental.

O boletim exibido mostra somente:

- municipio
- data de geracao
- validade
- texto para agricultor
- nivel de risco
- recomendacao

Nao exibe texto tecnico.

## Variavel opcional

```bash
REACT_APP_GOES_AMBIENTAL_BASE_URL=https://sgtr-goes-ambiental.vercel.app
```

## Scripts

```bash
npm start
npm test
npm run build
```

