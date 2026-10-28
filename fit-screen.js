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
    const landscape = width > height;
    const scale = landscape ? Math.min(width / 900, height / 500) : Math.min(width / 390, height / 844);
    document.documentElement.classList.toggle('landscape', landscape);
    document.documentElement.style.setProperty('--stage-width', `${width / scale}px`);
    document.documentElement.style.setProperty('--stage-height', `${height / scale}px`);
    app.style.setProperty('--fit-scale', String(scale));
    app.style.left = `${left}px`;
    app.style.top = `${top}px`;
    document.documentElement.style.setProperty('--fit-scale', String(scale));
    document.documentElement.style.setProperty('--fit-left', app.style.left);
    document.documentElement.style.setProperty('--fit-top', app.style.top);
  }
  window.addEventListener('resize', fit);
  window.visualViewport?.addEventListener('resize', () => { fit(); window.dispatchEvent(new Event('resize')); });
  fit();
})();
