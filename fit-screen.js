(() => {
  const app = document.querySelector('#app');
  const safeArea = document.createElement('div');
  safeArea.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.append(safeArea);
  function fit() {
    const viewport = window.visualViewport;
    const inset = getComputedStyle(safeArea);
    const left = parseFloat(inset.paddingLeft) || 0, top = parseFloat(inset.paddingTop) || 0;
    const width = Math.min(window.innerWidth, viewport?.width || window.innerWidth) - left - (parseFloat(inset.paddingRight) || 0);
    const height = Math.min(window.innerHeight, viewport?.height || window.innerHeight) - top - (parseFloat(inset.paddingBottom) || 0);
    const scale = Math.min(width / 390, height / 844);
    app.style.setProperty('--fit-scale', String(scale));
    app.style.left = `${left + (width - 390 * scale) / 2}px`;
    app.style.top = `${top + (height - 844 * scale) / 2}px`;
    document.documentElement.style.setProperty('--fit-scale', String(scale));
    document.documentElement.style.setProperty('--fit-left', app.style.left);
    document.documentElement.style.setProperty('--fit-top', app.style.top);
  }
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', () => { fit(); window.dispatchEvent(new Event('resize')); });
  fit();
})();
