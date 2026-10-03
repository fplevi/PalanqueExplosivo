# Bomber Políticos

Jogo de arena 2D em pixel art para navegador no computador. O fluxo tem três telas: Início, seleção de personagens e partida. Escolha um dos 12 personagens e enfrente três bots. Os personagens começam com os mesmos atributos.

## Executar

Com Node.js 20 ou superior:

```sh
npm start
```

Abra http://localhost:4173 no navegador. Não é necessário instalar pacotes.

## Controles

Na tela de Início, clique em **Iniciar jogo** ou pressione Enter. Na seleção, clique em um personagem ou use as setas; confirme com **Jogar com personagem** ou Enter. Escape volta ao Início. Durante a partida, **Personagens** retorna à seleção e encerra a partida atual.

| Ação | Controle |
| --- | --- |
| Mover | WASD ou setas |
| Colocar bomba | Espaço |
| Pausar / continuar | P ou Escape |
| Reiniciar após o resultado | Jogar novamente |
| Som | Botão de alto-falante |

As bombas explodem em dois segundos. Explosões seguem em cruz, param em paredes, destroem o primeiro bloco e detonam outras bombas em cadeia. Sua própria explosão também elimina você. Blocos podem revelar melhorias de bombas, alcance e velocidade.

O último sobrevivente vence. O limite de cada partida é de dois minutos e meio; múltiplos sobreviventes ao fim do tempo ou eliminação simultânea de todos resultam em empate. Se eliminado, você pode assistir aos bots ou voltar aos personagens para começar outra partida. Sair da aba pausa a partida automaticamente.

## Desenvolvimento

```sh
npm test
npm run check
```

- `src/engine.js`: regras, geração de arena e bots; não depende do navegador.
- `src/art.js`: desenhos originais em pixel art, feitos no Canvas.
- `src/characters.js`: elenco e aparência dos personagens.
- `src/main.js`: controles, seleção, áudio e interface.
- `src/title-art.js`: cena original em pixel art para a tela de Início.
- `DESIGN.md`: direção visual, composição das três telas e origem da skill de design.
- `assets/fonts/`: fontes locais Press Start 2P e Chakra Petch, com licenças OFL.
- `.scratch/bomber-politicos/spec.md`: escopo desta versão.

O elenco e os partidos seguem a lista solicitada pelo usuário. O jogo é uma criação de humor com gráficos próprios.
