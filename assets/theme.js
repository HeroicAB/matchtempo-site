// Light/dark: follows the device until the visitor picks one with the footer button. The choice is kept in localStorage.
(function () {
  var root = document.documentElement, key = 'mt-theme';
  function saved() { try { var v = localStorage.getItem(key); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; } }
  function current() { return root.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
  var s = saved(); if (s) root.dataset.theme = s;
  document.addEventListener('DOMContentLoaded', function () {
    var footer = document.querySelector('footer'); if (!footer) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'theme-toggle';
    function label() { b.textContent = current() === 'dark' ? 'Light mode' : 'Dark mode'; }
    b.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(key, next); } catch (e) {}
      label();
    });
    label(); footer.appendChild(b);
  });
})();
