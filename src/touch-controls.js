// Each finger owns its command; releasing the bomb never releases movement.
export function bindTouchControls(root, { canPlay, startDirection, endDirection, placeBomb }) {
  const active = new Map();
  const buttons = [...root.querySelectorAll('button')];

  function release(pointerId) {
    const button = active.get(pointerId);
    if (!button) return;
    active.delete(pointerId);
    endDirection(pointerId);
    if (![...active.values()].includes(button)) button.classList.remove('is-held');
    if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
  }

  function clear() {
    for (const pointerId of [...active.keys()]) release(pointerId);
  }

  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !canPlay()) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      active.set(event.pointerId, button);
      button.classList.add('is-held');
      if (button.dataset.direction) startDirection(event.pointerId, button.dataset.direction);
      else placeBomb();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => release(event.pointerId));
    }
    button.addEventListener('contextmenu', event => event.preventDefault());
    // Assistive technology and keyboard activation generate a click without a pointer.
    button.addEventListener('click', event => {
      if (event.detail !== 0 || !canPlay()) return;
      if (button.dataset.direction) {
        startDirection('activation', button.dataset.direction);
        endDirection('activation');
      } else placeBomb();
    });
  }

  return {
    clear,
    refresh() {
      const enabled = canPlay();
      if (!enabled) clear();
      for (const button of buttons) button.disabled = !enabled;
    },
  };
}
