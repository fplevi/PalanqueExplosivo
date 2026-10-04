# Chute de bombas

## Pedido

Adicionar uma habilidade rara de chute, encontrada ao destruir blocos. Cada personagem pode ter a habilidade uma vez na partida. O total de itens gerados não pode exceder o número de participantes iniciais, sem garantir que esse total apareça.

O chute impulsiona uma bomba ao contato com o personagem. A bomba desliza em linha reta e para ao encontrar bloco, outra bomba ou personagem. O sprite deve seguir o estilo pixel art do jogo, inspirado na referência fornecida.

## Regras confirmadas

- Célula de parada: última livre antes do obstáculo, sem sobreposição.
- Coleta repetida: quem já possui a habilidade não consome outro item de chute.
- Raridade: 2% por bloco destruído, limitada pelo número de participantes iniciais. Itens já coletados ou destruídos continuam contando no limite de geração da partida.
- Duração no Modo história: manter após perder vida e remover ao iniciar/reiniciar a fase.
- Acionamento: chute automático ao tentar andar contra qualquer bomba, a 8 células por segundo; pavio continua contando e a bomba parada pode ser chutada novamente.
- Limite: uma habilidade por personagem, até quatro itens gerados em uma partida com quatro participantes; até dois em uma final 1x1.
- Humanos e computadores usam a mesma habilidade. Bombas em movimento continuam sujeitas a explosões em cadeia, pausa e morte súbita.

## Integração visual

Criar um sprite de chute com bota e bomba, inspirado na referência, no renderizador compartilhado pela arena e pela modal Como jogar. Mostrar no HUD quando o personagem possui chute. Explicar na modal a raridade e o contato automático.

## Fatos do código

Bombas ainda não têm movimento. Jogadores podem compartilhar células, mas bloqueiam a passagem da bomba no comportamento solicitado. Bots filtram movimentos contra bombas antes de tentar andar, exigindo integração própria para usar o chute. As melhorias atuais persistem após perder uma vida e são reiniciadas junto com a fase.

## Validação proposta

Testar pela API pública de `Match`: construção com arena/itens/RNG controlados, `move`, `placeBomb`, `update`, `pause`, `snapshot` e `takeEvents`. Revisar alterações contra `4a34377c91562b77125ee4e269c10b47cc08d313`. Pontos de teste e base de revisão confirmados pelo usuário.

## Validação

70 testes passaram, incluindo 19 cenários novos do chute; sintaxe, build e `git diff --check` concluídos. Sprite ampliado inspecionado no navegador. As quatro abas da modal foram verificadas em 320×568, 390×844, 667×375, 844×390 e 1280×720: sem rolagem e com Entendi visível.
