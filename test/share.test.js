import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html contains share button on home screen and pixel art toast in upper corner', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  // Verify share button in home menu
  assert.ok(html.includes('id="share-button"'), 'O botão de compartilhar deve estar presente em index.html');
  assert.ok(html.includes('class="arcade-button share-button"'), 'O botão deve usar as classes arcade-button e share-button');
  assert.ok(html.includes('Compartilhar'), 'O botão deve conter o rótulo Compartilhar');
  assert.ok(html.includes('class="pixel-share-icon"'), 'O botão deve conter o ícone pixel art de compartilhamento');

  // Verify pixel art toast container
  assert.ok(html.includes('id="toast"'), 'O elemento de toast deve estar presente');
  assert.ok(html.includes('class="pixel-toast"'), 'O toast deve conter a classe pixel-toast');
  assert.ok(html.includes('role="status"'), 'O toast deve ter role="status" para acessibilidade');
  assert.ok(html.includes('aria-live="polite"'), 'O toast deve ter aria-live="polite"');
  assert.ok(html.includes('Link copiado!'), 'O toast deve exibir a mensagem Link copiado!');
  assert.ok(html.includes('Área de transferência'), 'O toast deve indicar a área de transferência');
});

test('style.css defines styling for share button and pixel-art toast', () => {
  const css = fs.readFileSync('style.css', 'utf8');

  assert.ok(css.includes('.home-menu .share-button'), 'CSS deve definir estilo do botão de compartilhar');
  assert.ok(css.includes('.pixel-toast'), 'CSS deve definir classe .pixel-toast');
  assert.ok(css.includes('top:20px;right:20px;') || css.includes('top: 20px; right: 20px;'), 'Toast deve ser posicionado no canto superior direito');
  assert.ok(css.includes('toast-in'), 'Toast deve ter animação de entrada');
});
