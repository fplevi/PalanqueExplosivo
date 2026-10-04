# Sprites de itens na modal Como jogar

Substituir os três ícones da seção de habilidades da modal Como jogar pelos mesmos sprites dos itens coletáveis da arena: mais bombas, mais alcance e mais velocidade.

## Implementação

Compartilhar o desenho dos itens em `drawItemSprite`, usado pela arena e pelos três canvases da modal, mantendo cores, bordas e símbolos iguais. Os canvases são decorativos; os rótulos continuam disponíveis para leitores de tela.

## Validação

51 testes passaram; checagem de sintaxe, build e `git diff --check` concluídos. No navegador, os três canvases da modal têm 22 × 22 pixels e conteúdo idêntico ao renderizador compartilhado da arena. A captura de tela do preview falhou.
