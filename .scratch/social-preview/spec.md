# Preview de compartilhamento e SEO

Status: resolved

## Pedido

Adicionar uma imagem para previews de links e preparar o SEO do jogo publicado.

## Entrega

- Imagem própria de 1200 × 630 com título e sprites reais do jogo, sem progresso pessoal. Composição reproduzível em `previews/social-card.html`, fora do pacote público.
- Open Graph e Twitter Card no HTML inicial, com URL absoluta da imagem, tamanho, formato e texto alternativo.
- Título descritivo, meta description, canonical e JSON-LD VideoGame.
- Uma URL real no sitemap; telas com fragmentos não são páginas diferentes.
- Metadados de indexação no HTML. Um robots.txt dentro do caminho do repositório não controla o rastreamento do domínio, por isso não será criado um arquivo sem efeito.
- Verificar metadados e imagem no pacote, executar checks/testes e conferir os recursos após a publicação.

## Fontes

- [Open Graph](https://ogp.me/): propriedades de compartilhamento e imagem.
- [Google Search Central](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): títulos, descrições, conteúdo e limites de posicionamento.
- [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro): arquivo na raiz do domínio.
- [VideoGame](https://schema.org/VideoGame): vocabulário dos dados estruturados.

Não há garantia de posição nem de indexação. Não solicitar acesso ao Search Console para concluir estes ajustes; eventual verificação da propriedade poderá ser feita separadamente pelo usuário.

## Verificação antes de publicar

Os 45 testes, a verificação de sintaxe, o build e `git diff --check` passaram. Conferidos no HTML inicial canonical, Open Graph, Twitter Card e JSON-LD válido. A imagem JPEG mede 1200 × 630 e pesa 55.740 bytes. O sitemap tem somente a URL canônica; a página de composição não acompanha o artefato. No servidor de verificação, página, imagem e sitemap responderam HTTP 200 com os tipos corretos. O navegador abriu o pacote com os metadados esperados e sem erros de console.

Também foi removido do README o parágrafo de instruções de configuração do GitHub Pages, conforme pedido do usuário.

## Publicação

Publicado em 2026-10-03 no commit `7ba898a`. O workflow `37141366169` terminou com sucesso (build e deploy). O HTML público contém canonical, Open Graph, Twitter Card e VideoGame; o navegador abriu sem erros de console. A imagem pública respondeu HTTP 200 como JPEG e teve o mesmo SHA-256 do arquivo local. O sitemap público também respondeu HTTP 200 com a URL correta.
