/* Peptides Decoded — minimal runtime behavior */
(function () {
  'use strict';

  // Defer non-critical enhancements until after interactive
  if ('requestIdleCallback' in window) {
    requestIdleCallback(init);
  } else {
    window.addEventListener('load', init);
  }

  function init() {
    // Future: newsletter validation, search, etc.
  }
})();
