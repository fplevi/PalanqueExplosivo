# Modo história

Especificação aprovada pelo usuário em 2026-10-03. Implementada.

## Regras confirmadas

- O modo atual de quatro participantes passa a se chamar Jogo rápido.
- Modo história: um humano enfrenta computadores em uma sequência de fases.
- Qualquer personagem pode ser escolhido, exceto Lula e Flávio Bolsonaro.
- A penúltima fase reúne o jogador, Lula e Flávio Bolsonaro em 1x1x1.
- Os dois melhores colocados dessa disputa jogam a última fase, o Segundo turno.
- Se o jogador eliminar Flávio e depois Lula, enfrenta Lula no Segundo turno; na ordem inversa, enfrenta Flávio.
- O jogador tem três vidas por fase e reaparece na mesma arena com proteção breve. Cada computador tem uma vida até a penúltima fase, inclusive Lula e Flávio. No Segundo turno, ambos os finalistas têm três vidas, inclusive numa final entre computadores. A eliminação ocorre ao esgotar as vidas.
- Eliminações simultâneas que deixem uma vaga indefinida levam a desempate entre os empatados, cada um com uma vida.
- Game Over exibe exatamente: "Você falhou em acabar com o ciclo de amor e ódio".
- Na penúltima fase, Game Over oferece Tentar novamente, Assistir e Sair.
- Nas demais fases, Game Over oferece apenas Tentar novamente e Sair.
- Tentar novamente reinicia a fase inteira do zero, numa nova arena, com as vidas originais da fase (jogador: três; computadores: uma antes da final, três na final), sem bombas, melhorias adquiridas ou eliminações anteriores. Se a derrota ocorrer em desempate, reinicia a fase original com todos os participantes.
- Assistir está disponível somente para as duas últimas fases. Eliminado primeiro na penúltima, o jogador pode acompanhar os bots até o fim e assistir ao Segundo turno entre eles.
- A campanha tem cinco fases: três disputas com um jogador e três computadores, a penúltima fase 1x1x1 e o Segundo turno 1x1. Os nove adversários comuns são sorteados no início e agrupados de três em três, sem repetições.
- Nas três primeiras fases, a eliminação do jogador apresenta Game Over imediatamente, sem opção de assistir aos computadores restantes.
- Terminar a penúltima fase em segundo lugar classifica o jogador sem Game Over. Os finalistas começam o Segundo turno com três vidas cada.
- A dificuldade da IA aumenta ao longo da campanha, com as mesmas regras e atributos para todos e sem poderes exclusivos dos chefões nesta versão.
- O progresso é salvo localmente: fase, personagem escolhido, ordem dos adversários e finalistas. Ao voltar após sair ou fechar o jogo, a fase atual reinicia com suas vidas originais. Salvamentos antigos são adaptados de 11 para cinco fases, preservando ordem, personagem e finalistas; cada três duelos antigos correspondem a uma fase nova.
- No Modo história, o fim do cronômetro dá lugar à Morte súbita: blocos caem na arena e matam personagens atingidos, em vez de encerrar a partida empatada.
- Morte súbita se aplica aos dois modos: começa após 150 segundos, com aviso cinco segundos antes. Um bloco indestrutível cai a cada 0,5 segundo em espiral das bordas ao centro, com sinalização da próxima posição.
- Esmagamento tira uma vida e ignora a proteção temporária. Quem tiver vidas reaparece numa célula livre e segura. Sem espaço na arena, ocorre eliminação; eliminações simultâneas que indefinam uma vaga levam ao desempate numa nova arena.
- Jogo rápido mantém uma vida por participante; Modo história tem três vidas para o jogador e uma por computador até a penúltima fase. Na final, ambos têm três vidas. Nos desempates, todos têm uma vida.
- Ao assistir, a penúltima fase termina e a final entre os dois computadores começa automaticamente. O jogador não controla nenhum dos finalistas.

## Verificação

Validação automatizada anterior: 26 testes aprovados e verificação de sintaxe de todos os módulos aprovada. A redução para cinco fases inclui testes de agrupamento, vidas assimétricas e migração de salvamentos.
Após a redução: 32 testes aprovados, incluindo migração de campanhas antigas, quatro participantes nas fases iniciais, Game Over imediato nas fases iniciais, três vidas para ambos os finalistas e uma vida nos desempates. Sintaxe verificada. No navegador, um salvamento antigo foi retomado como fase 1/5, com o jogador em três vidas e os três computadores em uma vida cada.
Revisão de padrões sem achados acionáveis; revisão de especificação encontrou dois casos de borda (espaço de reaparecimento e retomada de espectador), corrigidos e cobertos por regressões.
Verificação no navegador: escolha de modo, chefões bloqueados, fase com três vidas, progresso mantido após recarregar, Game Over com dois botões nas fases comuns e Tentar novamente restaurando ambos os participantes a três vidas e o cronômetro a 02:30. Prévia em preview.png.

- Motor da partida: vidas, proteção, ordem e empates de eliminação, blocos indestrutíveis e fechamento da arena.
- Progressão: três disputas com quatro participantes, ambos os caminhos de chefões, classificação em segundo lugar, desempates, espectadores, derrota e vitória final.
- Persistência: restauração de fase/personagem/ordem/finalistas; dados inválidos ignorados.
- Interface: escolha de modo, chefões bloqueados, botões de resultado e retomada local.

## Fatos do jogo atual

- Há 12 personagens: descontando o escolhido e os dois chefões, existem nove adversários para as três disputas iniciais.
- Jogo rápido atualmente reúne um humano e três bots.
- Motor aceita listas personalizadas de participantes e vidas individuais; a campanha organiza as fases.

## Comments

- 2026-10-03: usuário aprovou reaparecimento com três vidas para todos e desempate com uma vida. Ajustou os botões de derrota para Tentar novamente/Sair, acrescentando Assistir somente na penúltima fase.
- 2026-10-03: usuário aprovou 11 fases, classificação do segundo colocado, dificuldade crescente e salvamento local. Substituiu a proposta de partida sem limite de tempo por Morte súbita com blocos caindo.
- 2026-10-03: revisão solicitada pelo usuário reduz a campanha para cinco fases: três disputas com quatro participantes, mantendo as duas últimas. Computadores passam a ter uma vida e o jogador mantém três vidas por fase.
- 2026-10-03: ajuste da etapa final solicitado pelo usuário: no Segundo turno, jogador e computador têm três vidas cada, aumentando a dificuldade da final.
- 2026-10-03: usuário aprovou horário/trajeto/cadência dos blocos, impacto sobre vidas e aplicação aos dois modos. Corrigiu Tentar novamente: sempre reiniciar a fase do zero, sem recuperar o estado da derrota.
