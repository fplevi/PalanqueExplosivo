# Verificação do fluxo e visual

Data: 2026-10-03

Implementação concluída: Início → Personagens → Partida, seguindo a direção registrada em `DESIGN.md` e a skill frontend-design da Anthropic.

## Verificação no navegador

- Início mostra título, cena original em pixel art e entrada para seleção. Enter também abre seleção.
- A seleção mantém os 12 personagens, retrato ampliado e confirmação explícita. ArrowRight selecionou Clariana Barão; Enter iniciou uma partida com ela.
- Escape retorna ao Início. A escolha permanece ao retornar à seleção na mesma sessão.
- A partida tem arena, quatro participantes, relógio, atributos e pausa. Movimento, bomba e pausa por teclado foram exercitados.
- O manual preserva a pausa existente. A ação Continuar retoma a partida.
- Ao abrir o manual durante a contagem, o número 3 e o relógio 02:30 permaneceram iguais entre duas observações separadas por mais de dez segundos.
- Personagens encerra a partida e mantém a escolha. Voltar no navegador abre seleção; avançar para uma partida encerrada continua na seleção.
- A arena cabe em 1280 × 720: documento com 720 px de altura, arena de aproximadamente 476 × 413 px. A tela de Início também foi conferida na janela existente de 826 × 884 sem excesso horizontal.
- Nenhum aviso ou erro de console capturado na aba de verificação.

## Verificação automatizada

- `npm test`: 9 testes aprovados, sem falhas.
- `npm run check`: sintaxe de todos os módulos aprovada.
- `git diff --check`: nenhuma falha de whitespace.

## Prévias

- `inicio.jpg`: tela de Início.
- `personagens.jpg`: seleção com Clariana Barão.
- `partida.jpg`: arena durante a partida.

As verificações ocorreram em uma aba temporária. A aba do usuário não foi recarregada.
