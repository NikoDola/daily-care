/* Native details works without JavaScript. These are keyboard conveniences. */
document.querySelectorAll('.mobile-menu').forEach(menu => {
  const trigger = menu.querySelector('summary');
  trigger.setAttribute('aria-expanded', String(menu.open));
  menu.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(menu.open)));
  document.addEventListener('click', event => { if (menu.open && !menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) { menu.open = false; trigger.focus(); }
  });
});
