/* ==========================================================================
   nav.js — the navigation is written once, in nav.html, and injected here.
   Every page contains only an empty placeholder plus this script, so a link
   that changes in nav.html changes on all four pages at the same time.
   ========================================================================== */
(function () {
  'use strict';

  var holder = document.getElementById('site-nav');
  if (!holder) {
    return;
  }

  var here = window.location.pathname.split('/').pop() || 'index.html';

  fetch('nav.html', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.text();
    })
    .then(function (fragment) {
      holder.innerHTML = fragment;
      holder.querySelectorAll('a').forEach(function (link) {
        if (link.getAttribute('href') === here) {
          link.classList.add('is-current');
          link.setAttribute('aria-current', 'page');
        }
      });
    })
    .catch(function (error) {
      /* If the fragment cannot be fetched (for example when the page is
         opened straight from disk) the site still needs to be navigable. */
      holder.innerHTML =
        '<nav class="site-nav" aria-label="Main"><ul>' +
        '<li><a href="index.html">Home</a></li>' +
        '<li><a href="quotes.html">Quotes</a></li>' +
        '<li><a href="project.html">Project ideas</a></li>' +
        '<li><a href="machine.html">Machine</a></li>' +
        '</ul></nav>';
      holder.querySelectorAll('a').forEach(function (link) {
        if (link.getAttribute('href') === here) {
          link.classList.add('is-current');
          link.setAttribute('aria-current', 'page');
        }
      });
      if (window.console) {
        console.warn('nav.js: could not load nav.html (' + error.message + ')');
      }
    });
})();
