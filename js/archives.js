(() => {
  const form = document.querySelector('[data-archive-filters]');
  if (!form) return;
  form.hidden = false;
  const member = form.elements.member, brand = form.elements.brand;
  const cards = [...document.querySelectorAll('[data-session]')];
  const update = () => {
    let count = 0;
    cards.forEach(card => {
      const rows = [...card.querySelectorAll('[data-entry]')];
      rows.forEach(row => {
        row.hidden = !!((member.value && row.dataset.member !== member.value) || (brand.value && row.dataset.brand !== brand.value));
      });
      card.hidden = !rows.some(row => !row.hidden);
      if (!card.hidden) count++;
    });
    document.querySelector('[data-result-count]').textContent = `${count} séance${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}`;
    document.querySelector('[data-empty]').hidden = count !== 0;
  };
  form.addEventListener('change', update);
  const selected = new URLSearchParams(location.search).get('membre');
  if ([...member.options].some(option => option.value === selected)) member.value = selected;
  update();
})();
