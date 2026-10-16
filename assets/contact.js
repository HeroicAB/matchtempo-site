// Builds the support email link in the browser, so the address isn't in the page's HTML
// for simple scrapers to collect. Without JavaScript, the readable "support at matchtempo dot app" stays.
(function () {
  var links = document.querySelectorAll('a.email');
  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    var address = a.getAttribute('data-user') + '@' + a.getAttribute('data-host').split(' ').join('.');
    a.href = 'mailto:' + address;
    a.textContent = address;
  }
})();
