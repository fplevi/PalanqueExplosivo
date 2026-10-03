# Modo história

Rascunho em definição com o usuário; ainda não liberado para implementação.

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
- Tentar novamente recupera as três vidas do jogador e retoma o estado imediatamente anterior à eliminação, conforme proposta aceita na entrevista.
- Assistir está disponível somente para as duas últimas fases. Eliminado primeiro na penúltima, o jogador pode acompanhar os bots até o fim e assistir ao Segundo turno entre eles.
- A campanha tem 11 fases: nove duelos contra os demais personagens em ordem sorteada no início, a penúltima fase e o Segundo turno.
- Terminar a penúltima fase em segundo lugar classifica o jogador sem Game Over. Ambos os finalistas começam o Segundo turno com três vidas.
- A dificuldade da IA aumenta ao longo da campanha, com as mesmas regras e atributos para todos e sem poderes exclusivos dos chefões nesta versão.
- O progresso é salvo localmente: fase, personagem escolhido e ordem dos adversários. Ao voltar após sair ou fechar o jogo, a fase atual reinicia com três vidas para todos.
- No Modo história, o fim do cronômetro dá lugar à Morte súbita: blocos caem na arena e matam personagens atingidos, em vez de encerrar a partida empatada.

## Decisões pendentes

- Início, frequência e trajeto dos blocos na Morte súbita.
- Impacto do esmagamento sobre vidas, reaparecimento e Tentar novamente quando a arena estiver tomada.
- Aplicação da Morte súbita também ao Jogo rápido.

## Fatos do jogo atual

- Há 12 personagens: descontando o escolhido e os dois chefões, existem nove adversários para os duelos iniciais.
- Jogo rápido atualmente reúne um humano e três bots.
- Motor aceita listas personalizadas de participantes, mas não tem vidas ou campanha.

## Comments

- 2026-10-03: usuário aprovou reaparecimento com três vidas para todos e desempate com uma vida. Ajustou os botões de derrota para Tentar novamente/Sair, acrescentando Assistir somente na penúltima fase.
- 2026-10-03: usuário aprovou 11 fases, classificação do segundo colocado, dificuldade crescente e salvamento local. Substituiu a proposta de partida sem limite de tempo por Morte súbita com blocos caindo.
