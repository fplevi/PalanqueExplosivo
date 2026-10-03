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

## Destino proposto

Conta verificada: `fplevi`. Repositório ainda inexistente: `fplevi/BomberPoliticos`.
GitHub Pages gratuito exige repositório público. Publicação externa depende da confirmação da visibilidade e deste destino.

## Verificação

Pacote e workflow preparados. `npm run check`, os 29 testes, `npm run build` e `git diff --check` passaram. O pacote foi aberto em `http://localhost:4173/dist/index.html`: fontes carregadas, seleção e partida funcionando, sem avisos ou erros de console. Evidência em `preview.jpg`.

Falta criar o repositório remoto, enviar os commits, habilitar Pages como GitHub Actions e verificar o endereço público. Nenhum conteúdo foi publicado nesta etapa.
