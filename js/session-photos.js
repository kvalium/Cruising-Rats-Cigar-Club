// Keep ordinary image links usable without JavaScript.
(() => {
  const links = [...document.querySelectorAll('[data-session-photo]')];
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'session-photo-viewer';
  dialog.setAttribute('aria-label', 'Photos de la séance');
  dialog.innerHTML = '<div class="photo-controls"><button type="button" data-prev aria-label="Photo précédente">←</button><span aria-live="polite"></span><button type="button" data-next aria-label="Photo suivante">→</button><button type="button" data-close>Fermer</button></div><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.append(dialog);
  let current = 0;
  const show = index => {
    current = (index + links.length) % links.length;
    const link = links[current];
    const image = dialog.querySelector('img');
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    dialog.querySelector('figcaption').textContent = link.closest('figure').querySelector('figcaption')?.textContent || '';
    dialog.querySelector('[aria-live]').textContent = `${current + 1} / ${links.length}`;
    dialog.querySelector('[data-prev]').disabled = links.length < 2;
    dialog.querySelector('[data-next]').disabled = links.length < 2;
  };
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    show(index);
    dialog.showModal();
  }));
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.querySelector('[data-prev]').onclick = () => show(current - 1);
  dialog.querySelector('[data-next]').onclick = () => show(current + 1);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.querySelector('img').removeAttribute('src');
    links[current].focus();
  });
})();
