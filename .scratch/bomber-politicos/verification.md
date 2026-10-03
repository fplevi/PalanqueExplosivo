# Verificação da primeira versão

## Validação

- `npm test`: 9 testes passaram.
- `npm run check`: módulos JavaScript e servidor passaram na verificação de sintaxe.
- Navegador: todos os 12 personagens foram selecionados, com nome e partido atualizados.
- Navegador: início, contagem, bomba pelo espaço, movimento por teclado, pausa, continuação e manual verificados.
- Console do navegador: nenhum aviso ou erro durante os fluxos verificados.
- Revisão independente: 30 partidas completas com sementes distintas; bots colocaram bombas, abriram caminhos, coletaram melhorias e terminaram em vitória ou empate por tempo.

## Standards

Comparação da revisão inicial: `git diff e803276...e1a71d8`.

Nenhuma violação material dos padrões documentados em `AGENTS.md` e `docs/agents/domain.md`. Nenhum ADR existente foi contrariado.

Problema funcional identificado: abrir as instruções durante a contagem permitia o início da partida atrás do manual. Corrigido em `src/main.js`: a contagem avança apenas quando o diálogo está fechado.

Observação de manutenção: a duração das chamas aparecia em múltiplos lugares do motor. Corrigida com a constante compartilhada `FLAME_DURATION`, usada nas explosões, revelação de itens e previsão dos bots.

Observação de manutenção: as dimensões fixas da arena aparecem também na apresentação e posições iniciais. A primeira versão tem uma única arena de 15 × 13, conforme a especificação; parametrizar outros tamanhos fica para uma versão que ofereça esse recurso.

Resumo: zero violações documentadas, um problema funcional corrigido, uma observação de manutenção corrigida e uma observação de manutenção aceita no escopo atual.

## Spec

Fonte: `.scratch/bomber-politicos/spec.md`.

A revisão encontrou o mesmo problema de instruções abertas durante a contagem. Corrigido para preservar a interação e a pausa previstas no escopo.

Nenhum outro requisito ausente ou expansão indesejada de escopo foi encontrado. Os nove testes passaram; trinta partidas simuladas comprovaram comportamento dos bots e encerramento das partidas.

Resumo: um problema encontrado e corrigido; nenhum requisito pendente da primeira versão.
