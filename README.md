# Bomber Políticos

Jogo de arena 2D em pixel art para navegador no computador. Escolha um dos 12 personagens e enfrente três bots. Os personagens começam com os mesmos atributos.

## Executar

Com Node.js 20 ou superior:

```sh
npm start
```

Abra http://localhost:4173 no navegador. Não é necessário instalar pacotes.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD ou setas |
| Colocar bomba | Espaço |
| Pausar / continuar | P ou Escape |
| Reiniciar | Nova partida |
| Som | Botão de alto-falante |

As bombas explodem em dois segundos. Explosões seguem em cruz, param em paredes, destroem o primeiro bloco e detonam outras bombas em cadeia. Sua própria explosão também elimina você. Blocos podem revelar melhorias de bombas, alcance e velocidade.

O último sobrevivente vence. O limite de cada partida é de dois minutos e meio; múltiplos sobreviventes ao fim do tempo ou eliminação simultânea de todos resultam em empate. Se eliminado, você pode assistir aos bots ou reiniciar. Sair da aba pausa a partida automaticamente.

## Desenvolvimento

```sh
npm test
npm run check
```

- `src/engine.js`: regras, geração de arena e bots; não depende do navegador.
- `src/art.js`: desenhos originais em pixel art, feitos no Canvas.
- `src/characters.js`: elenco e aparência dos personagens.
- `src/main.js`: controles, seleção, áudio e interface.
- `.scratch/bomber-politicos/spec.md`: escopo desta versão.

O elenco e os partidos seguem a lista solicitada pelo usuário. O jogo é uma criação de humor com gráficos próprios.
