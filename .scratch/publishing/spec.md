# Publicação gratuita no GitHub Pages

Status: ready-for-agent

## Pedido

Publicar o jogo no GitHub Pages para os jogadores acessarem diretamente pelo navegador.

## Implementação

- Recursos devem carregar tanto na raiz quanto no caminho de um repositório.
- `npm run build` prepara `dist/` com somente HTML, CSS, módulos do jogo e assets.
- GitHub Actions executa sintaxe, testes e build antes de publicar o artefato no Pages.
- `dist/` fica fora do histórico. O servidor local continua disponível para desenvolvimento.
- Validar o artefato em um caminho com subdiretório, incluindo fontes, seleção e partida.
- Publicar uma instalação nova, sem exportar ou incluir o save pessoal. O progresso permanece somente no armazenamento do navegador de cada jogador.

## Destino proposto

Conta verificada: `fplevi`. Repositório ainda inexistente: `fplevi/BomberPoliticos`.
GitHub Pages gratuito exige repositório público. Publicação externa depende da confirmação da visibilidade e deste destino.

## Verificação

Pacote e workflow preparados. `npm run check`, os 29 testes, `npm run build` e `git diff --check` passaram. O pacote foi aberto em `http://localhost:4173/dist/index.html`: fontes carregadas, seleção e partida funcionando, sem avisos ou erros de console. Evidência em `preview.jpg`.

Falta criar o repositório remoto, enviar os commits, habilitar Pages como GitHub Actions e verificar o endereço público. Nenhum conteúdo foi publicado nesta etapa.

## Revisão após as alterações do jogo

Em 2026-10-03, a versão `a36552e` (Palanque Explosivo) passou na verificação de sintaxe, nos 44 testes e no build. O pacote `dist/` foi conferido no navegador em subdiretório: fontes e novos módulos carregados, seleção de ambos os modos e início do Jogo rápido funcionando, sem erros ou avisos de console. Prévia em `ready-preview.jpg`.

O usuário pediu para aguardar correções nos sprites antes de publicar. Nenhum repositório remoto foi criado e nenhum commit foi enviado. A configuração está pronta; gerar novamente `dist/` e verificar a versão final antes de publicar, somente após o usuário retomar a publicação.

## Progresso pessoal

Conferido: o save é lido e escrito em `localStorage` por `src/main.js`; não existe arquivo de save exportado no pacote `dist/`. O build copia arquivos do projeto e não acessa dados do navegador. O endereço do GitHub Pages terá um armazenamento separado de localhost, portanto o save local não acompanha a publicação. Manter o save local intacto e a função de salvar disponível para cada jogador. A publicação continua aguardando as correções dos sprites.
