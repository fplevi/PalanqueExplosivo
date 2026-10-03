# Bomber Políticos — primeira versão

Status: ready-for-agent

## Autorização e escopo

O usuário autorizou seguir todas as recomendações sem novas perguntas. Plataforma: navegador no computador. Partidas: uma pessoa contra três bots. Todos os 12 nomes do brief são personagens selecionáveis com atributos iniciais iguais.

## Experiência

- Interface em português, com seleção visual dos 12 personagens, instruções e botão para iniciar.
- Arena 2D própria em pixel art, inspirada na referência fornecida, com 15 × 13 células, paredes permanentes e blocos destrutíveis.
- Quatro participantes nos cantos, com saídas inicialmente livres. Três adversários distintos são escolhidos do elenco.
- Setas ou WASD movem; espaço coloca bomba; P ou Escape pausa; botão permite silenciar; nova partida e troca de personagem ao terminar.
- Contagem regressiva de três segundos. Partida de até 150 segundos: último sobrevivente vence; sem sobreviventes ou vários sobreviventes ao fim do tempo resulta em empate. O jogador eliminado pode assistir aos bots ou reiniciar.
- Bombas explodem após dois segundos, em cruz, com alcance inicial de duas células. Paredes interrompem a explosão; o primeiro bloco destrutível também interrompe e é destruído. Outras bombas atingidas detonam em cadeia.
- Participante pode sair da própria bomba recém-colocada, mas não atravessar outras bombas nem retornar àquela célula enquanto ocupada.
- Blocos podem revelar melhorias: capacidade de bombas, alcance e velocidade, com limites para preservar a jogabilidade.
- Bots coletam melhorias, abrem caminhos com bombas e procuram escapar de explosões; operam sob as mesmas regras dos humanos.
- Caricaturas originais em pixel art; identificação de nome e partido conforme a lista do usuário. O elenco é a seleção solicitada, sem alegação de validação eleitoral.
- Sons sintetizados de bomba, melhoria e resultado, com silêncio opcional. Nenhum recurso externo é necessário para executar o jogo.

## Arquitetura e validação recomendadas

- JavaScript em módulos, HTML e CSS, Canvas para a arena e sprites. Sem dependências em runtime.
- Motor de regras separado da interface, observado por entradas de movimento/bomba e snapshots da partida.
- Testes comportamentais nessa interface pública: barreiras, explosões, cadeia, eliminação simultânea, melhorias e pausa. A autorização para seguir recomendações inclui esta escolha de teste.
- Servidor local em Node; `npm start` executa o jogo e `npm test` valida as regras.
- Verificação no navegador da seleção, início, controles, pausa e reinício, além da apresentação visual.

## Critérios de conclusão

Uma partida completa é jogável no navegador, os 12 personagens podem ser selecionados, os bots agem, as regras acima funcionam, os testes passam e o projeto inclui instruções para executar.
