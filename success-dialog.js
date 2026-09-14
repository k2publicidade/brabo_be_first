(() => {
  'use strict';
  const dialog = document.getElementById('success');
  const back = document.getElementById('success-back');
  const title = document.getElementById('success-title');
  const form = document.getElementById('signup-form');
  const page = [...document.querySelectorAll('main, nav, footer, .skip-link')];
  let previousInert = [];

  function open() {
    if (dialog.classList.contains('is-visible')) return;
    previousInert = page.map(element => element.inert);
    page.forEach(element => { element.inert = true; });
    dialog.classList.add('is-visible');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    title.focus({ preventScroll: true });
  }

  function returnToSite() {
    if (!dialog.classList.contains('is-visible')) return;
    page.forEach((element, index) => { element.inert = previousInert[index]; });
    document.body.classList.remove('is-locked');
    // Move focus out before hiding the dialog from assistive technology.
    document.querySelector('.brand').focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    dialog.classList.remove('is-visible');
    dialog.setAttribute('aria-hidden', 'true');
    if (form) {
      const button = form.querySelector('.submit');
      const label = form.querySelector('.submit__label');
      form.reset();
      button.disabled = false;
      button.classList.remove('is-loading', 'is-success', 'is-error');
      label.textContent = 'Accept the invitation';
      document.getElementById('form-status').textContent = '';
    }
  }

  document.addEventListener('brabo:signup-success', open);
  back.addEventListener('click', returnToSite);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      returnToSite();
    } else if (event.key === 'Tab') {
      // The return button is the only interactive control in this dialog.
      event.preventDefault();
      back.focus();
    }
  });
})();
