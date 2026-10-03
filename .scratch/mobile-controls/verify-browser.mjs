import { chromium } from 'file:///C:/Users/fplev/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4186/#inicio');
  await page.locator('#begin-button').click();
  await page.locator('#start-button').click();
  const right = page.locator('[data-direction="arrowright"]');
  assert.equal(await right.isVisible(), true);
  assert.equal(await right.isDisabled(), true, 'Contagem não aceita comandos');
  await page.waitForFunction(() => !document.querySelector('#touch-bomb').disabled);

  // Observe the human's gold marker in the actual canvas, without game-state hooks.
  const marker = () => page.locator('#arena').evaluate(canvas => {
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 225 && data[i + 2] === 152)
        return { x: (i / 4) % canvas.width, y: Math.floor(i / 4 / canvas.width) };
    }
    return null;
  });
  const center = async locator => { const b = await locator.boundingBox(); return { x: b.x+b.width/2, y: b.y+b.height/2 }; };
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  const initial = await marker();
  const r = { ...await center(right), id: 1 };
  const b = { ...await center(page.locator('#touch-bomb')), id: 2 };
  await touch('touchStart', [r]);
  await page.waitForTimeout(240);
  const moved = await marker();
  assert.ok(moved.x > initial.x, 'Segurar direita move o personagem');
  await touch('touchStart', [r,b]);
  await touch('touchEnd', [b]);
  assert.equal(await right.evaluate(el => el.classList.contains('is-held')), true, 'Soltar bomba mantém direção');
  await page.waitForTimeout(220);
  await touch('touchCancel', []);
  await page.waitForTimeout(220);
  const stopped = await marker();
  await page.waitForTimeout(220);
  assert.deepEqual(await marker(), stopped, 'Cancelar toque encerra movimento');
  assert.equal(await page.locator('.is-held').count(), 0);
  await touch('touchStart', [{...await center(page.locator('[data-direction="arrowleft"]')), id:5}]);
  await page.waitForTimeout(240);
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  // A bomb has a distinctive pale highlight; it must be visible after walking away.
  assert.equal(await page.locator('#arena').evaluate(canvas => {
    const { data } = canvas.getContext('2d').getImageData(32, 32, 128, 32);
    for(let i=0;i<data.length;i+=4) if(data[i]===169 && data[i+1]===190 && data[i+2]===194) return true;
    return false;
  }), true, 'Segundo dedo coloca bomba enquanto anda');
  await page.locator('#pause-button').click();
  await page.waitForTimeout(60);
  assert.equal(await right.isDisabled(), true);
  await page.locator('#overlay-button').click();
  await page.waitForTimeout(60);
  assert.equal(await right.isDisabled(), false);
  // A fresh match leaves open floor for release/cancellation checks.
  await page.locator('#game-back').click();
  await page.locator('#start-button').click();
  await page.waitForFunction(() => !document.querySelector('#touch-bomb').disabled);
  const down = page.locator('[data-direction="arrowdown"]');
  const d = { ...await center(down), id: 3 };
  await touch('touchStart', [d]);
  await touch('touchEnd', []);
  await page.waitForTimeout(250);
  const released = await marker();
  await page.waitForTimeout(250);
  assert.deepEqual(await marker(), released, 'Soltar seta para em vez de continuar pela passagem');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(220);
  assert.ok((await marker()).y < released.y, 'Teclado continua funcional');
  await touch('touchStart', [{...await center(down), id:4}]);
  await page.locator('#pause-button').click();
  await touch('touchEnd', []);
  await page.locator('#overlay-button').click();
  await page.waitForTimeout(250);
  const resumed = await marker();
  await page.waitForTimeout(250);
  assert.deepEqual(await marker(), resumed, 'Pausa limpa direção mantida');
  await page.locator('#pause-button').click();

  for (const [width,height] of [[390,844],[320,568],[844,390],[667,375],[740,360],[1024,768],[768,1024],[568,320]]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const rect = el => { const r=el.getBoundingClientRect(); return {tag: el.className, left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}; };
      return { arena:rect(document.querySelector('#arena')), controls:[...document.querySelectorAll('.touch-button')].map(rect), scroll:document.documentElement.scrollWidth, width:innerWidth,height:innerHeight };
    });
    console.log(`Evaluated ${width}x${height} layout:`, JSON.stringify(layout));
    assert.ok(layout.scroll <= width, `Sem scroll horizontal: ${width}x${height} (scroll=${layout.scroll})`);
    for (const control of layout.controls) {
      const a=layout.arena,c=control;
      assert.ok(c.right<=a.left || c.left>=a.right || c.bottom<=a.top || c.top>=a.bottom, `Controle fora da arena: ${width}x${height} ${c.tag}`);
      assert.ok(c.width>=48 && c.height>=48, `Alvo 48px: ${width}x${height} ${JSON.stringify(c)}`);
      assert.ok(c.bottom<=height && c.top>=0, `Controle cabe na altura: ${width}x${height}: ${JSON.stringify(c)}`);
      assert.ok(c.right<=width && c.left>=0, `Controle cabe na largura: ${width}x${height}: ${JSON.stringify(c)}`);
    }
    assert.ok(layout.arena.top>=0 && layout.arena.bottom<=height,`Arena inteira visível: ${width}x${height} ${JSON.stringify(layout.arena)}`);
    await page.screenshot({path:`.scratch/mobile-controls/${width}x${height}.png`});
  }
  const desktop = await browser.newPage({viewport:{width:1280,height:900},hasTouch:false});
  await desktop.goto('http://localhost:4186/#inicio');
  await desktop.locator('#begin-button').click();
  await desktop.locator('#start-button').click();
  assert.equal(await desktop.locator('#touch-bomb').isVisible(),false,'Desktop sem toque mantém interface de teclado');
  assert.deepEqual(errors,[]);
  console.log('PASS: todos os testes de touch, teclado, rotação e viewports completados com sucesso!');
} finally { await browser.close(); }
