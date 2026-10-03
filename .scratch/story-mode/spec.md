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

## Decisões pendentes

- Quantidade e ordem dos duelos anteriores aos chefões.
- Tratamento do jogador que termina a penúltima fase em segundo lugar: classificação versus Game Over.
- Limite de tempo no Modo história (o motor atual encerra em empate após 150 segundos).
- Progressão de dificuldade e diferenças dos chefões.
- Persistência da campanha ao sair ou fechar a página.

## Fatos do jogo atual

- Há 12 personagens: descontando o escolhido e os dois chefões, existem nove adversários para os duelos iniciais.
- Jogo rápido atualmente reúne um humano e três bots.
- Motor aceita listas personalizadas de participantes, mas não tem vidas ou campanha.

## Comments

- 2026-10-03: usuário aprovou reaparecimento com três vidas para todos e desempate com uma vida. Ajustou os botões de derrota para Tentar novamente/Sair, acrescentando Assistir somente na penúltima fase.
