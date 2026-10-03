# Bomber Políticos

Jogo de arena 2D em pixel art para navegador no computador. Escolha entre **Jogo rápido**, com um jogador contra três computadores, e **Modo história**, com 11 fases inspiradas em disputas eleitorais. Os personagens começam com os mesmos atributos.

## Executar

Com Node.js 20 ou superior:

```sh
npm start
```

Abra http://localhost:4173 no navegador. Não é necessário instalar pacotes.

## Publicar no GitHub Pages

O jogo funciona como site estático, inclusive dentro do caminho de um repositório. `npm run build` gera `dist/` com HTML, CSS, módulos e assets; o servidor de desenvolvimento, testes e documentos ficam fora do pacote.

No repositório GitHub, selecione **Settings → Pages → Source → GitHub Actions**. O workflow `.github/workflows/pages.yml` verifica a sintaxe, executa os testes e publica o jogo a cada push em `main`. Também pode ser iniciado manualmente na aba Actions. Para usar GitHub Pages com GitHub Free, o repositório precisa ser público.

O endereço de um repositório chamado `BomberPoliticos` na conta `fplevi` será `https://fplevi.github.io/BomberPoliticos/` após a publicação. O progresso do Modo história é salvo no navegador e no endereço utilizado; o progresso de localhost não é transferido para o site publicado.

## Controles

Na tela de Início, escolha **Jogo rápido** ou **Modo história**; Enter inicia a seleção do Jogo rápido. Na seleção, clique em um personagem ou use as setas; confirme com **Jogar com personagem** ou Enter. Escape volta ao Início. Durante o Jogo rápido, **Personagens** retorna à seleção. No Modo história, **Sair** volta ao Início e mantém o progresso salvo neste navegador.

| Ação | Controle |
| --- | --- |
| Mover | WASD ou setas |
| Colocar bomba | Espaço |
| Pausar / continuar | P ou Escape |
| Reiniciar após o resultado | Jogar novamente |
| Som | Botão de alto-falante |

As bombas explodem em dois segundos. Explosões seguem em cruz, param em paredes, destroem o primeiro bloco e detonam outras bombas em cadeia. Sua própria explosão também elimina você. Blocos podem revelar melhorias de bombas, alcance e velocidade.

O último sobrevivente vence. Após dois minutos e meio, começa a **Morte súbita**, anunciada cinco segundos antes: blocos indestrutíveis caem a cada meio segundo, em espiral das bordas ao centro. A próxima célula atingida fica sinalizada. Os blocos esmagam personagens e bloqueiam permanentemente o caminho. No Jogo rápido, todos têm uma vida e uma eliminação simultânea de todos resulta em empate. Sair da aba pausa a partida automaticamente.

## Modo história

Escolha qualquer personagem, exceto Lula e Flávio Bolsonaro, e enfrente os nove demais em duelos sorteados. A dificuldade dos computadores aumenta ao longo da campanha. Todos têm três vidas por fase, com reaparecimento e dois segundos de proteção após perder uma vida. A proteção não evita esmagamento.

A fase 10, o **Primeiro turno**, reúne o jogador, Lula e Flávio. Os dois melhores colocados avançam à fase 11, o **Segundo turno**, com três vidas novas. Eliminar Flávio primeiro leva à final contra Lula; eliminar Lula primeiro leva à final contra Flávio. Terminar em segundo também classifica o jogador. Empates que indefinam uma vaga são resolvidos numa nova arena, com uma vida por participante.

Ao falhar, aparece **GAME OVER**, com a mensagem **Você falhou em acabar com o ciclo de amor e ódio**. **Tentar novamente** reinicia a fase inteira do zero com três vidas para todos; **Sair** volta ao início. Terminar em terceiro no Primeiro turno também oferece **Assistir**, para acompanhar o restante da disputa e, automaticamente, o Segundo turno entre os dois computadores.

O progresso é salvo localmente: personagem, ordem dos adversários, fase e finalistas. **Retomar história** começa a fase atual do zero. Iniciar uma nova campanha substitui o progresso anterior. Se o navegador bloquear o armazenamento, a tela de início informa que o progresso só estará disponível enquanto o jogo permanecer aberto.

## Desenvolvimento

```sh
npm test
npm run check
```

- `src/engine.js`: regras, geração de arena e bots; não depende do navegador.
- `src/art.js`: desenhos originais em pixel art, feitos no Canvas.
- `src/characters.js`: elenco e aparência dos personagens.
- `src/main.js`: controles, seleção, áudio e interface.
- `src/story.js`: progressão da campanha, classificação, desempates e salvamento.
- `src/title-art.js`: cena original em pixel art para a tela de Início.
- `DESIGN.md`: direção visual, composição das três telas e origem da skill de design.
- `assets/fonts/`: fontes locais Press Start 2P e Chakra Petch, com licenças OFL.
- `.scratch/bomber-politicos/spec.md`: escopo desta versão.
- `.scratch/story-mode/spec.md`: regras aprovadas do Modo história e da Morte súbita.

O elenco e os partidos seguem a lista solicitada pelo usuário. O jogo é uma criação de humor com gráficos próprios.
