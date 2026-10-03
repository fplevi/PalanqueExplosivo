# Modo história

Especificação aprovada pelo usuário em 2026-10-03. Implementada.

## Regras confirmadas

- O modo atual de quatro participantes passa a se chamar Jogo rápido.
- Modo história: um humano enfrenta computadores em uma sequência de fases.
- Qualquer personagem pode ser escolhido, exceto Lula e Flávio Bolsonaro.
- A penúltima fase reúne o jogador, Lula e Flávio Bolsonaro em 1x1x1.
- Os dois melhores colocados dessa disputa jogam a última fase, o Segundo turno.
- Se o jogador eliminar Flávio e depois Lula, enfrenta Lula no Segundo turno; na ordem inversa, enfrenta Flávio.
- Cada participante tem três vidas por fase; reaparece na mesma arena com proteção breve. A eliminação ocorre ao esgotar as vidas.
- Eliminações simultâneas que deixem uma vaga indefinida levam a desempate entre os empatados, cada um com uma vida.
- Game Over exibe exatamente: "Você falhou em acabar com o ciclo de amor e ódio".
- Na penúltima fase, Game Over oferece Tentar novamente, Assistir e Sair.
- Nas demais fases, Game Over oferece apenas Tentar novamente e Sair.
- Tentar novamente reinicia a fase inteira do zero, numa nova arena, com três vidas para todos, sem bombas, melhorias adquiridas ou eliminações anteriores. Se a derrota ocorrer em desempate, reinicia a fase original com todos os participantes.
- Assistir está disponível somente para as duas últimas fases. Eliminado primeiro na penúltima, o jogador pode acompanhar os bots até o fim e assistir ao Segundo turno entre eles.
- A campanha tem 11 fases: nove duelos contra os demais personagens em ordem sorteada no início, a penúltima fase e o Segundo turno.
- Terminar a penúltima fase em segundo lugar classifica o jogador sem Game Over. Ambos os finalistas começam o Segundo turno com três vidas.
- A dificuldade da IA aumenta ao longo da campanha, com as mesmas regras e atributos para todos e sem poderes exclusivos dos chefões nesta versão.
- O progresso é salvo localmente: fase, personagem escolhido e ordem dos adversários. Ao voltar após sair ou fechar o jogo, a fase atual reinicia com três vidas para todos.
- No Modo história, o fim do cronômetro dá lugar à Morte súbita: blocos caem na arena e matam personagens atingidos, em vez de encerrar a partida empatada.
- Morte súbita se aplica aos dois modos: começa após 150 segundos, com aviso cinco segundos antes. Um bloco indestrutível cai a cada 0,5 segundo em espiral das bordas ao centro, com sinalização da próxima posição.
- Esmagamento tira uma vida e ignora a proteção temporária. Quem tiver vidas reaparece numa célula livre e segura. Sem espaço na arena, ocorre eliminação; eliminações simultâneas que indefinam uma vaga levam ao desempate numa nova arena.
- Jogo rápido mantém uma vida por participante; Modo história tem três vidas por participante e uma vida nos desempates.
- Ao assistir, a penúltima fase termina e a final entre os dois computadores começa automaticamente. O jogador não controla nenhum dos finalistas.

## Verificação

Validação automatizada: 26 testes aprovados e verificação de sintaxe de todos os módulos aprovada.
Revisão de padrões sem achados acionáveis; revisão de especificação encontrou dois casos de borda (espaço de reaparecimento e retomada de espectador), corrigidos e cobertos por regressões.
Verificação no navegador: escolha de modo, chefões bloqueados, fase com três vidas, progresso mantido após recarregar, Game Over com dois botões nas fases comuns e Tentar novamente restaurando ambos os participantes a três vidas e o cronômetro a 02:30. Prévia em preview.png.

- Motor da partida: vidas, proteção, ordem e empates de eliminação, blocos indestrutíveis e fechamento da arena.
- Progressão: nove duelos, ambos os caminhos de chefões, classificação em segundo lugar, desempates, espectadores, derrota e vitória final.
- Persistência: restauração de fase/personagem/ordem/finalistas; dados inválidos ignorados.
- Interface: escolha de modo, chefões bloqueados, botões de resultado e retomada local.

## Fatos do jogo atual

- Há 12 personagens: descontando o escolhido e os dois chefões, existem nove adversários para os duelos iniciais.
- Jogo rápido atualmente reúne um humano e três bots.
- Motor aceita listas personalizadas de participantes, mas não tem vidas ou campanha.

## Comments

- 2026-10-03: usuário aprovou reaparecimento com três vidas para todos e desempate com uma vida. Ajustou os botões de derrota para Tentar novamente/Sair, acrescentando Assistir somente na penúltima fase.
- 2026-10-03: usuário aprovou 11 fases, classificação do segundo colocado, dificuldade crescente e salvamento local. Substituiu a proposta de partida sem limite de tempo por Morte súbita com blocos caindo.
- 2026-10-03: usuário aprovou horário/trajeto/cadência dos blocos, impacto sobre vidas e aplicação aos dois modos. Corrigiu Tentar novamente: sempre reiniciar a fase do zero, sem recuperar o estado da derrota.
