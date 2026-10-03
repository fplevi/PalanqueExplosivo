# Direção visual — Bomber Políticos

## Referência e intenção

Um jogo de cartucho de 16 bits, com tela de título, seleção e partida como etapas distintas. A arena clássica e os sprites existentes são o conteúdo principal. O layout deve parecer uma interface de jogo desde o primeiro instante.

Skill aplicada: [frontend-design, Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design), instalada localmente em `.agents/skills/frontend-design/`.

## Tokens

| Papel | Cor |
| --- | --- |
| Fundo azul de console | `#252b46` |
| Superfície de painel | `#343d5b` |
| Texto de fósforo claro | `#f4eddc` |
| Ação principal e cursor | `#f6c46c` |
| Relevo coral | `#f57962` |
| Texto secundário | `#b3bfd2` |

- Título e elementos de jogo: Press Start 2P, pixelada, carregada localmente.
- Navegação, nomes e instruções: Chakra Petch regular e bold, carregada localmente.
- Texto corrido entre 16 e 18 px; títulos de seção entre 24 e 32 px; o logotipo da tela inicial tem escala própria.
- Bordas em degrau e relevos de dois a quatro pixels reforçam o cartucho. Retratos e arena usam renderização pixelada.

## Composição

Início: título central, ilustração própria da arena com personagens e uma ação para entrar na seleção.

```text
marca              Início / Personagens / Partida       som / ajuda
                          Bomber Políticos
                     [cena em pixel art]
                         [Iniciar jogo]
```

Seleção: um retrato grande à esquerda, elenco à direita e confirmação explícita do personagem antes da partida.

```text
Voltar                   Escolha seu personagem
[retrato grande]           [ 4 × 3 retratos selecionáveis ]
nome e partido             todos começam com atributos iguais
                           [Jogar com personagem]
```

Partida: arena central, quatro participantes e HUD compacto. Pausa, resultado e troca de personagem ficam no contexto da partida.

```text
Trocar personagem             Praça da Disputa          Pausar
                         [quatro participantes]
                             [arena central]
                         [tempo / bombas / alcance]
```

## Revisão do plano antes de implementar

O desenho anterior usava fundo creme, palavra em terracota, chamada de marketing e uma página longa com arena e catálogo juntos. Esses elementos foram substituídos por um fluxo de jogo. A grade uniforme permanece apenas onde tem significado: seleção de personagens de um arcade.

O elemento de identidade é o conjunto título + cena em pixel art. A navegação usa texto simples e os números só representam as três etapas reais. A partida ocupa uma tela própria e privilegia a área jogável. Não há novas mecânicas nesta mudança.

## Interação e qualidade

- Navegação por botões e teclado; voltar permite revisar a escolha.
- Foco visível, regiões ocultas fora da árvore de acessibilidade e anúncio das mudanças de tela.
- Contagem e partida param quando as instruções estão abertas; sair da partida encerra sua simulação.
- Movimento reduzido respeitado; tipografia, sprites e licenças incluídos no projeto.
- Verificação por screenshots das três telas e teste do fluxo completo no navegador.
