# Modal Como jogar responsiva

Adequar a modal à tela do usuário para evitar rolagem nas dimensões usuais de desktop e celular, preservando a legibilidade e o acesso ao botão Entendi.

## Design

Manter a paleta existente: painel azul `#343d59`, fundo `#25314d`, texto claro, destaque dourado e bordas `#64718b`. Manter as fontes atuais: título pixel e corpo legível. Organizar o conteúdo em abas Controles, Arena e Modos, com texto alinhado à esquerda e duas colunas em telas largas. Compactar espaçamentos em telas baixas, sem ocultar instruções.

## Implementação

Abas acessíveis com navegação por setas, Home e End; ao abrir, exibir Controles. Preservar os sprites compartilhados e a pausa da partida. Manter rolagem como fallback para telas excepcionalmente pequenas ou texto ampliado.

## Validação

51 testes passaram; checagem de sintaxe, build e `git diff --check` concluídos. Verificação em Chrome local nas dimensões 1280×720, 390×844, 320×568, 844×390, 667×375 e 375×667: nenhuma das três abas apresentou rolagem horizontal ou vertical, e Entendi ficou visível em todas. Navegação por teclado, fechamento e reabertura conferidos, sem erros de JavaScript. Screenshots de desktop e celular inspecionados.
