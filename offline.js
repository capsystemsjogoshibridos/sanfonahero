(() => {
  'use strict';
  const calibrationKey = 'sanfona-calibration-v1';
  window.SanfonaCalibrationStore = {
    load() { try { return JSON.parse(localStorage.getItem(calibrationKey)); } catch { return null; } },
    save(value) { try { localStorage.setItem(calibrationKey, JSON.stringify(value)); } catch {} },
    clear() { try { localStorage.removeItem(calibrationKey); } catch {} }
  };
  const status = document.querySelector('#offline-status');
  const panel = document.querySelector('#offline-panel');
  const retry = document.querySelector('#offline-retry');
  const update = document.querySelector('#offline-update');
  let registration;
  let installPrompt;
  const setStatus = text => { status.textContent = text; };
  document.querySelector('#offline-open').onclick = () => { panel.hidden = false; verify(); };
  document.querySelector('#offline-close').onclick = () => { panel.hidden = true; };
  document.querySelector('#offline-install').onclick = async () => {
    if (installPrompt) { await installPrompt.prompt(); installPrompt = null; }
    else document.querySelector('#offline-help').textContent = 'No iPhone: Safari → Compartilhar → Adicionar à Tela de Início. Depois abra pelo ícone, com internet, e aguarde “Pronto para jogar offline”.';
  };
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
  update.onclick = () => {
    if (!registration?.waiting) return;
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
    registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
  };
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && registration.waiting) {
        update.hidden = false;
        setStatus('Atualização baixada. Toque em Atualizar jogo quando terminar a partida.');
      }
      if (worker.state === 'activated') verify();
      if (worker.state === 'redundant') setStatus('Não foi possível salvar todos os arquivos. Conecte-se e toque em Tentar novamente.');
    });
  }
  async function verify() {
    update.hidden = !registration?.waiting;
    const worker = navigator.serviceWorker?.controller;
    if (!worker) return;
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); setStatus('Não foi possível verificar o modo offline. Tente novamente com internet.'); }, 8000);
    channel.port1.onmessage = ({data}) => {
      clearTimeout(timer); channel.port1.close();
      update.hidden = !registration?.waiting;
      setStatus(data.ready ? 'Pronto para jogar offline — músicas e arquivos salvos neste aparelho.' : 'Arquivos offline incompletos. Conecte-se e toque em Tentar novamente.');
    };
    worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2]);
  }
  async function prepare() {
    if (!window.isSecureContext || !('serviceWorker' in navigator) || location.protocol === 'file:') {
      setStatus('Abra esta versão por HTTPS ou localhost. Abrir o arquivo HTML diretamente não instala o modo offline.');
      return;
    }
    setStatus('Preparando os arquivos offline… mantenha a internet ligada.');
    try {
      registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      watch(registration.installing);
      registration.addEventListener('updatefound', () => watch(registration.installing));
      update.hidden = !registration.waiting;
      if (registration.active && !registration.installing) verify();
    } catch { setStatus('Não foi possível preparar o modo offline. Confira a conexão e tente novamente.'); }
  }
  navigator.serviceWorker?.addEventListener('message', ({data}) => {
    if (data.type === 'OFFLINE_PROGRESS') setStatus(`Salvando no aparelho: ${Math.round(data.completed / data.total * 100)}%. Mantenha esta página aberta.`);
    if (data.type === 'OFFLINE_READY') verify();
    if (data.type === 'OFFLINE_ERROR') setStatus('Download incompleto. Confira a internet e o espaço disponível; depois tente novamente.');
  });
  navigator.serviceWorker?.addEventListener('controllerchange', verify);
  retry.onclick = async () => {
    // Reinstall the same version when the browser evicted some cached files.
    if (registration && navigator.onLine && !registration.installing && !registration.waiting) {
      await registration.unregister();
    }
    await prepare();
  };
  window.addEventListener('sanfona:result', event => {
    try {
      const key = 'sanfona-best:' + event.detail.song;
      const best = Math.max(Number(localStorage.getItem(key)) || 0, event.detail.score);
      localStorage.setItem(key, String(best));
      document.querySelector('#offline-record').textContent = `Recorde neste aparelho: ${best.toLocaleString('pt-BR')} pontos (${event.detail.title}).`;
    } catch { document.querySelector('#offline-record').textContent = 'O navegador não permitiu salvar o recorde. Você pode continuar jogando.'; }
  });
  prepare();
})();
