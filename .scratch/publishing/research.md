# Publicação gratuita do Palanque Explosivo

Pesquisa em fontes oficiais consultadas em 2026-10-03. Nenhuma conta acessada e nenhum conteúdo publicado.

## Escolha atual: GitHub Pages

O usuário escolheu GitHub Pages. É adequado ao jogo atual, que consiste em HTML, CSS, módulos JavaScript e assets; `server.mjs` apenas serve arquivos localmente. Pages hospeda esses formatos estáticos. O plano GitHub Free permite Pages em **repositório público**; Pages com repositório privado exige plano compatível pago. [Disponibilidade e funcionamento](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Sites de projeto usam normalmente `https://<usuario>.github.io/<repositorio>/`. Os caminhos de raiz atuais (`/style.css`, `/src/main.js`, `/assets/fonts/...`) devem virar relativos para preservar esse prefixo. Evidência local: `index.html` linhas 9–11 e `style.css` linhas 1–3; resolução relativa ao documento/stylesheet é o ajuste de implementação. [URLs de sites de projeto](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Publicação automatizada recomendada: workflow em `main` e acionamento manual, checks/testes, pacote com somente os arquivos públicos em `dist`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4` com `path: dist`, e `actions/deploy-pages@v4`. Selecionar GitHub Actions como fonte do Pages. O deploy precisa de `pages: write`, `id-token: write`, ambiente `github-pages` e dependência do job que produz o artifact. [Workflow oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [ação de upload e parâmetro path](https://github.com/actions/upload-pages-artifact), [ação de deploy](https://github.com/actions/deploy-pages).

Para obter código e executar checks/build, os READMEs atuais das ações recomendam `actions/checkout@v7` e `actions/setup-node@v7`; a documentação da segunda exemplifica Node 24. Sem dependências instaladas, desativar cache automático (`package-manager-cache: false`) evita trabalho desnecessário. [Checkout](https://github.com/actions/checkout), [Setup Node](https://github.com/actions/setup-node).

## Alternativa: Cloudflare Pages

Seria minha recomendação técnica se o objetivo fosse manter o repositório privado e obter um link independente. Suporta repositórios públicos e privados do GitHub/GitLab e publica automaticamente após pushes. [Integração Git](https://developers.cloudflare.com/pages/get-started/git-integration/).

Requisições a assets estáticos são gratuitas e ilimitadas quando não invocam Functions; a página do produto anuncia bandwidth ilimitada e SSL incluso. Essas afirmações não abrangem computação dinâmica/Functions, que possui quotas próprias. [Assets e Functions](https://developers.cloudflare.com/pages/functions/pricing/), [produto e bandwidth](https://www.cloudflare.com/products/pages/).

No Free são 500 builds por mês, 20.000 arquivos e no máximo 25 MiB por arquivo. [Limites](https://developers.cloudflare.com/pages/platform/limits/). O endereço padrão é `<projeto>.pages.dev`. Há envio direto de pasta/ZIP por painel ou pasta via Wrangler, sem GitHub. Projetos criados como Direct Upload não podem depois ativar integração Git; é necessário novo projeto. [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Complemento: itch.io

Útil para uma página voltada a jogadores e descoberta pela comunidade; esta é uma recomendação, não garantia de audiência. Criar página e enviar conteúdo não exige pagamento. [FAQ oficial](https://itch.io/docs/creators/faq).

O jogo HTML5 pode rodar no navegador dentro da página: enviar ZIP contendo `index.html` e todos os assets. A documentação exige caminhos relativos para carregar arquivos corretamente. Nosso pacote estático com paths relativos também serviria a essa opção. [Upload HTML5](https://itch.io/docs/creators/html5).
