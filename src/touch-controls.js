// Each finger owns its command; releasing the bomb never releases movement.
export function bindTouchControls(root, { canPlay, startDirection, endDirection, placeBomb }) {
  const active = new Map();
  const captured = new Map();
  const buttons = [...root.querySelectorAll('.touch-button')];

  function release(pointerId) {
    const button = active.get(pointerId);
    if (!button) return;
    active.delete(pointerId);
    endDirection(pointerId);
    if (![...active.values()].includes(button)) button.classList.remove('is-held');
    const cap = captured.get(pointerId);
    if (cap) {
      captured.delete(pointerId);
      try {
        if (cap.hasPointerCapture(pointerId)) cap.releasePointerCapture(pointerId);
      } catch {}
    }
  }

  function clear() {
    for (const pointerId of [...active.keys()]) release(pointerId);
  }

  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !canPlay()) return;
      event.preventDefault();
      try {
        button.setPointerCapture(event.pointerId);
        captured.set(event.pointerId, button);
      } catch {}
      active.set(event.pointerId, button);
      button.classList.add('is-held');
      if (button.dataset.direction) startDirection(event.pointerId, button.dataset.direction);
      else placeBomb();
    });

    button.addEventListener('pointermove', event => {
      if (!active.has(event.pointerId) || !button.dataset.direction) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const newButton = target?.closest?.('.touch-pad .touch-button');
      const current = active.get(event.pointerId);
      if (newButton && newButton !== current && newButton.dataset.direction) {
        if (current && ![...active.entries()].some(([k, v]) => k !== event.pointerId && v === current)) {
          current.classList.remove('is-held');
        }
        active.set(event.pointerId, newButton);
        newButton.classList.add('is-held');
        startDirection(event.pointerId, newButton.dataset.direction);
      }
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
