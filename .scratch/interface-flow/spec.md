# Fluxo e identidade visual do jogo

Status: ready-for-agent

Implementação: concluída e verificada. Evidências em `verification.md`.

## Pedido

Separar o jogo em três etapas: Início, seleção de personagens e partida. Aplicar uma skill de designer para melhorar o layout e reduzir a aparência genérica de interface gerada por IA.

## Comportamento

- Ao abrir o site, somente a tela de Início é exibida, com título, arte e botão Iniciar jogo.
- Iniciar jogo abre seleção; os 12 personagens permanecem disponíveis. Um retrato maior mostra a escolha atual e um botão confirma o início da partida.
- Seleção funciona por clique e setas; Enter confirma e Escape volta ao Início.
- A partida usa uma tela própria com arena, participantes, tempo, melhorias e pausa.
- Trocar personagem retorna à seleção, preserva a escolha e encerra a simulação anterior. O resultado oferece jogar novamente ou trocar de personagem.
- A navegação do navegador funciona com as telas; links diretos para partida sem uma partida ativa abrem seleção.
- Manual e controles de som permanecem acessíveis nas três etapas. Não há progressão da contagem ou partida durante o manual.
- As regras, atributos e bots da versão anterior são preservados.

## Visual

Seguir `DESIGN.md`: console azul, tipografia pixelada local, cena própria em pixel art, seleção de arcade e HUD compacto. Validar telas em desktop e largura reduzida.

## Validação

Os testes do motor e a verificação de sintaxe devem passar. Verificar no navegador: início → seleção → partida, seleção por teclado, voltar, pausa, manual durante contagem, troca de personagem, navegação e ausência de erros de console.
