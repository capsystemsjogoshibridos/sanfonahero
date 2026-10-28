(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const app = $("#app");
  const music = $("#music");
  const screens = $$(".screen");
  const songCard = $("#song-card");
  const previewIcon = $("#preview-icon");
  const modal = $("#modal");
  const sdk = window.GameSDK || null;
  const sounds = {
    defeat: $("#sfx-defeat"),
    title: $("#sfx-title"),
    victory: $("#sfx-victory")
  };
  const preloadedAudio = [];

  // Picos de energia extraídos da faixa durante a produção. Eles ficam
  // embutidos para que a versão publicada funcione totalmente offline.
  const CRISTOVAO_BEATS = [2.48,4.16,4.96,5.76,6.56,7.6,8.72,9.52,10.16,11.36,12,13.28,14.48,16.16,17.04,18.24,19.44,20.72,21.36,22,23.28,24.48,26.56,27.44,28.24,28.96,30.72,32,33.28,34.48,35.44,36.16,37.44,38.24,39.52,40.72,42,43.28,44.16,45.12,45.76,47.44,48.24,49.52,50.96,51.92,52.8,53.76,54.48,56.24,56.96,57.92,58.72,59.52,60.48,62,63.12,64.48,66.4,68.24,68.88,69.52,70.72,72,73.28,74.48,75.92,76.96,78.24,79.52,80.72,81.36,82,82.8,83.68,84.48,85.76,86.48,87.44,88.56,90,90.72,92.16,93.12,94.48,95.76,96.96,98.24,99.52,100.72,102.24,103.12,104.72,106.32,107.6,108.24,109.52,110.72,112,113.2,114.48,115.92,116.96,118.4,119.44,120.72,121.52,122.48,123.52,124.16,124.96,125.76,126.96,128.24,129.52,130.72,132,132.88,133.92,135.44,136.4,137.04,138.24,138.88,139.76,140.72,142,143.28,144.48,145.76,146.96,148.08,148.72,150.72,152,152.64,153.28,154.48,155.76,157.12,158.24,160,160.72,162,163.2,164.96,165.76,167.44,168.24,169.52,170.72,172.48,173.68,174.96,175.76,176.96,178.24,179.52,180.4,181.44,182.48,183.2,184.48,185.44,186.4,187.44,188.24,189.52,190.4,191.36,192.16,192.88,193.84,194.48,195.76,196.96,198.24,199.68,200.72,201.36,202.64,203.28,204.24,205.76,206.72,207.44,208.24,209.52,210.16,211.2,212,213.28,214.48,215.12,215.76,216.4,217.92,218.72,219.92,220.72,221.36,222.64,223.52,224.96,225.76,226.96,228.24,229.92,230.72,232,233.28,234.72,235.76,236.96,237.6,238.24,239.52,240.72,242,243.28,244.48,246.24,246.96,248.24,250.72,251.84,253.2,254.48,255.76,256.96,258.24,259.52];

  const CABRA_BEATS = [2.57,3.51,4.6,6.37,7.08,7.68,8.33,9.08,9.76,10.47,11.39,12.6,14.22,15.65,16.37,17.09,17.8,18.53,19.22,19.94,20.65,21.37,22.08,23.15,23.86,24.58,25.65,26.37,27.08,27.8,28.51,29.23,29.94,30.53,31.19,31.93,33.15,33.87,34.58,35.48,36.73,38.01,38.88,39.58,40.2,41.01,42.08,42.99,44.22,45.29,46.02,46.73,47.62,48.33,49.58,50.3,51.01,52.09,53.15,54.42,55.3,56.2,57.08,57.79,59.05,59.75,60.65,61.73,62.44,63.15,64.22,64.94,66.01,67.08,67.8,68.51,69.23,70.29,71.01,71.72,72.79,73.5,74.22,74.93,76.01,77.09,78.34,79.07,79.95,81.01,81.72,82.43,83.15,83.86,85.29,86.01,86.72,87.8,89.58,90.3,91.01,91.72,92.62,93.5,94.22,95.3,96.01,96.73,97.44,98.15,98.87,99.57,100.25,100.89,101.72,102.99,104.22,105.3,106.02,106.73,107.62,108.33,109.58,110.3,111.01,112.44,113.15,114.42,115.11,116.18,117.09,117.79,119.04,119.75,120.65,121.55,122.79,124.22,124.94,126.01,126.72,127.43,128.51,129.22,130.29,131.01,132.44,133.15,134.22,134.93,135.65,136.36,137.08,138.51,139.22,139.94,140.84,141.56,142.79,143.39,144.59,145.65,146.72,147.43,148.86,150.29,151.01,152.07,152.98,153.72,155.13,155.85,156.73,158.15,158.87,159.58,160.3,160.92,161.72,162.43,164.04,164.65,166.02,166.72,167.99,168.86,169.58,170.29,171.01,171.73,172.79,173.86,174.58,175.3,176.01,176.73,177.79,178.51,179.22,180.14,181.37,182.44,183.15,184.22,185.29,186.01,186.72,187.43,189.22,190.12,191.37,192.97,194.22,195.65,196.73,197.44,198.15,198.87,199.58,200.47,201.55,202.25,202.98,203.86,204.58,205.47,206.9,208.16,209.58,210.29,211.9,212.54,213.39,214.58,215.31,216.2,217.96,219.02,220.17,220.8,221.77,222.81,223.66,224.64,226.19,227.43,228.15,228.86,229.58,230.29,231.01,231.72,232.44,233.15,233.87,234.58,235.3,236.05,236.73,237.43,238.14,238.85];

  const FORROZEAR_BEATS = [2.01,2.6,3.51,4.11,5,5.94,6.54,7.53,8.75,9.5,10.05,11.42,11.96,12.69,13.46,14.56,15.32,16.06,16.81,17.57,18.33,19.25,20.75,21.5,22.25,22.82,24.03,25.25,26.42,27.5,28.46,29.75,30.5,31.25,31.85,33.02,33.69,34.46,35,36.03,37.1,38.2,38.98,40.78,41.39,42.5,43.29,44,44.6,45.5,46.07,46.63,47.57,48.78,49.53,50.28,50.93,52.06,52.81,53.39,54.03,54.54,55.08,55.66,56.19,56.94,57.87,58.82,60.02,60.78,61.29,61.81,62.56,63.52,64.06,64.81,65.57,66.31,67.06,67.82,68.57,69.16,69.78,70.82,72.03,72.78,74.03,74.57,75.33,76.05,76.63,77.28,78.13,78.78,80,80.57,81.13,82.08,83.42,84.03,84.54,85.34,85.92,86.56,87.5,88.27,89,89.77,90.31,91.27,91.84,92.38,93.5,94.06,95.27,95.94,97.26,98.01,98.57,99.32,100.28,101.57,103.1,103.81,104.57,105.51,106.47,107.03,107.56,108.53,109.07,109.81,110.57,111.32,112.06,113.06,113.57,114.31,114.91,116.28,116.79,117.54,118.09,118.63,119.56,120.5,121.07,121.99,122.75,123.32,124.53,125.21,125.75,127.26,127.81,128.57,129.17,129.92,130.66,131.27,132.13,132.7,133.48,134.05,135.32,136.06,136.85,137.89,138.72,140.28,140.94,141.53,142.27,143.01,143.56,144.52,145.29,145.81,146.38,147.87,148.81,149.41,150.03,150.53,151.27,151.82,152.57,153.54,154.07,154.82,155.57,156.54,157.07,158.05,158.57,159.32,159.93,161.28,162.03,162.88,163.65,164.28,165.02,166.09,166.85,167.41,167.97,168.66,170.28,170.93,171.91,172.53,173.24,173.76,174.73,175.3,176.04,176.78,177.32,178.26,178.84,179.55,180.32,181.08,181.63,182.6,183.67,185,185.56,186.31,186.91,187.53,188.78,189.5,190.08,190.83,191.56,192.86,194.01,194.56,195.17,195.78,196.82,197.41,198.5,199.81,200.58,201.54,202.07,203.25,203.79,204.53,205.29,205.81,206.41,207.84,208.44,209.03,209.75,210.51,211.46,212,212.75,213.5,214.41,215.27,215.89,216.5,217.06,217.81,218.41,219.5,220.26,221.6,222.35,223.25,223.83,224.77,225.88,227.18,227.78,228.51,229.53,230.38,231.32,232.1,232.84,234.03,234.78,235.43,236.25,236.76,237.31,238.49,239,239.79,240.7,241.25,241.97,242.57,243.13,244.12,244.81,246.03,246.54,247.29,248.01,248.57,249.31,249.88,250.45,251.04,251.77,252.33,253.53,254.04,254.57,255.32,255.88,256.81,257.57,258.54,259.25,259.82,260.42,261.02,261.54,262.06,263.03,263.75,264.53,265.07,265.81,266.4,266.93,267.71,268.29,269.28,270.5,271.09,272.28,273.03,273.67,274.43,275.29,275.94,276.5,277.09,278.28,278.93,279.5,280.05,281,281.58,282.44,283.36,283.96];

  const SONGS = [
    { id: "cristovao", title: "Sanfona de Cristóvão", description: "Forró encantado • CAP Systems", src: "musicas/safona_cristovao.m4a?v=0.4.5", label: "SH", theme: "sertao", difficulty: "ARRETADA", peppers: 3, beats: CRISTOVAO_BEATS, fallTime: 2.55, scoreMultiplier: 1 },
    { id: "cabra", title: "O Cabra do Celular", description: "Forró de salão • Celular na roda", src: "musicas/cabra_celular.m4a?v=0.4.5", label: "CC", theme: "celular", difficulty: "ACOCHADA", peppers: 4, beats: CABRA_BEATS, fallTime: 2.45, scoreMultiplier: 1.15 },
    { id: "forrozear", title: "Aprendendo a Forrozear", description: "Baile coreografado • Passo ligeiro", src: "musicas/aprendendo_forrozear.m4a?v=0.4.5", label: "AF", theme: "baile", difficulty: "INVOCADA", peppers: 5, beats: FORROZEAR_BEATS, fallTime: 2.35, scoreMultiplier: 1.3 }
  ];

  const GESTURES = [
    { id: "open", name: "Toda aberta", symbol: "↔", frame: "assets/frames/sanfona_totalmente_aberta.png?v=0.4.5", left: [.14, .72], right: [.86, .72], xTolerance: .11, yTolerance: .09 },
    { id: "closed", name: "Toda fechada", symbol: "→←", frame: "assets/frames/sanfona_totalmente_fechada.png?v=0.4.5", left: [.38, .72], right: [.62, .72], xTolerance: .095, yTolerance: .09 },
    { id: "right", name: "Abre direita", symbol: "→→", frame: "assets/frames/sanfona_aberta_direita.png?v=0.4.5", left: [.38, .72], right: [.86, .72], xTolerance: .105, yTolerance: .09 },
    { id: "left", name: "Abre esquerda", symbol: "←←", frame: "assets/frames/sanfona_aberta_esquerda.png?v=0.4.5", left: [.14, .72], right: [.62, .72], xTolerance: .105, yTolerance: .09 },
    { id: "up", name: "Tudo pra cima", symbol: "↑ ↑", frame: "assets/frames/sanfona_tudo_cima.png?v=0.4.5", left: [.32, .57], right: [.68, .57], xTolerance: .115, yTolerance: .085 },
    { id: "down", name: "Tudo pra baixo", symbol: "↓ ↓", frame: "assets/frames/sanfona_tudo_baixo.png?v=0.4.5", left: [.32, .88], right: [.68, .88], xTolerance: .115, yTolerance: .085 },
    { id: "curve-right", name: "Curva direita", symbol: "↓ ↑", frame: "assets/frames/sanfona_curva_direita.png?v=0.4.5", left: [.27, .82], right: [.73, .64], xTolerance: .17, yTolerance: .14 },
    { id: "curve-left", name: "Curva esquerda", symbol: "↑ ↓", frame: "assets/frames/sanfona_curva_esquerda.png?v=0.4.5", left: [.27, .64], right: [.73, .82], xTolerance: .17, yTolerance: .14 }
  ];

  const FEEDBACK_EXPRESSIONS = {
    hit: [
      "Arretado", "Massa", "Gente fina", "Desenrolado", "Acochado", "Estribado", "Ajeitado",
      "Amigo de fé", "Prestativo", "Joia", "Firmeza", "Ligeiro", "Danado de bom",
      "Pedaço de mau caminho", "Gataria", "Sabido", "Doce de coco", "Precioso", "Coração de ouro",
      "Pau pra toda obra", "Elegante", "Parceiro", "Arrumado", "Invocado", "Supimpa", "Nota dez"
    ],
    miss: [
      "Valha-me Deus!", "Vixe Maria!", "Sacre de cruz!", "O rebuliço!", "Eita gota serena!",
      "Ave Maria de três horas!", "Quase que o coração para!", "Cruzes!", "Que assombração!",
      "Subiu um calafrio!", "Chama o padre!", "Misericórdia!", "Sai, satanás!",
      "Quase que eu caio para trás!", "Que desmantelo!", "Me deu um revertério!", "Tô passado!",
      "Que agonia!", "Isso é o cão chupando manga!", "Cruz credo!", "Arre égua!",
      "Fiquei com as pernas bambas!", "Que susto da moléstia!", "Caiu o queixo!", "Minha nossa senhora!"
    ]
  };

  const feedbackDecks = { hit: [], miss: [] };
  const lastFeedback = { hit: "", miss: "" };

  const state = {
    screen: "loading-screen",
    tutorialStep: 0,
    previewTimer: null,
    notes: [],
    running: false,
    paused: false,
    raf: 0,
    score: 0,
    confirmedScore: 0,
    pendingScore: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    sessionActive: false,
    ending: false,
    sessionGeneration: 0,
    scoreQueue: Promise.resolve(),
    musicGain: 1,
    effectsGain: 1,
    muted: false,
    selectedSong: 0,
    positions: { left: { x: .32, y: .73 }, right: { x: .68, y: .73 } },
    pointers: { left: null, right: null },
    lastTime: 0,
    reactionSequence: 0,
    studioTimer: 0,
    studioFinished: false
  };

  let controlMode = 'touch';
  let calibrationRun = 0;
  let calibrationStep = 0;
  const calibrationOrder = ['closed', 'open', 'right', 'left', 'up', 'down', 'curve-right', 'curve-left'];
  const camera = new window.SanfonaCamera({
    onFrame: () => {
      const tracked = camera.tracked;
      const name = GESTURES.find(g => g.id === camera.pose())?.name;
      $('#camera-tracking').textContent = tracked
        ? `IDs 0 e 1 encontrados • detector na ${camera.detectorMode === 'página' ? 'página' : 'execução em segundo plano'} • ${camera.processingMs} ms • abertura ${Math.round(camera.opening() * 100)}%${name ? ` • ${name}` : ''}`
        : 'Mostre os dois marcadores inteiros, com boa luz e sem cobrir as bordas.';
      if (controlMode === 'camera') {
        const positions = camera.positions();
        if (positions) { state.positions = positions; layoutAccordion(); }
        $('#camera-game-status').textContent = tracked ? (name || 'Ajuste a pose') : 'Procurando os dois marcadores…';

      }
    },
    onError: message => {
      calibrationRun++;
      $('#camera-message').textContent = message;
      $('#camera-calibrate').disabled = true;
      $('#camera-ready').hidden = true;
      $('#camera-retry').hidden = false;
      if (state.running) $('#camera-game-status').textContent = message;
    }
  });

  function setControlMode(mode) {
    controlMode = mode;
    $('#touch-mode').setAttribute('aria-pressed', String(mode === 'touch'));
    $('#camera-mode').setAttribute('aria-pressed', String(mode === 'camera'));
    $('#game-screen').classList.toggle('camera-control', mode === 'camera');
    $('#camera-game-status').hidden = mode !== 'camera';
    $('#recalibrate-button').hidden = mode !== 'camera';
    $('#control-status').textContent = mode === 'touch' ? 'Controle com os dedos na tela' : 'Câmera selecionada • calibre antes de jogar';
    if (mode === 'touch') { calibrationRun++; camera.stop(); }
  }

  async function openCameraSetup() {
    calibrationRun++;
    if (state.running || state.sessionActive) await endGame('Calibrar novamente', 'Prepare a sanfona para uma nova partida.', false, false);
    resetGameState();
    modal.hidden = true;
    setControlMode('camera');
    showScreen('camera-screen');
    calibrationStep = 0;
    $('#camera-calibrate').disabled = true;
    $('#camera-calibrate').textContent = 'Iniciar calibração automática';
    $('#camera-ready').hidden = true;
    $('#camera-retry').hidden = true;
    $('#camera-message').textContent = 'Permita a câmera. O vídeo fica neste aparelho; nada é gravado ou enviado.';
    $('#camera-instruction').textContent = 'Mostre os dois marcadores';
    $('#camera-step').textContent = 'PREPARAÇÃO';
    $('#camera-pose-image').removeAttribute('src');
    try {
      if (await camera.start()) {
        $('#camera-calibrate').disabled = false;
        $('#camera-message').textContent = 'Ao iniciar, você terá 5 segundos para cada pose. Depois, fique firme por 1 segundo. As oito etapas avançam sozinhas.';
      }
    } catch (error) {
      $('#camera-message').textContent = error.message;
      $('#camera-retry').hidden = false;
    }
  }

  async function calibrateCamera() {
    const run = ++calibrationRun;
    if (camera.calibrated) { camera.templates = {}; calibrationStep = 0; }
    $('#camera-calibrate').disabled = true;
    $('#camera-ready').hidden = true;
    while (calibrationStep < calibrationOrder.length && run === calibrationRun && camera.active) {
      const id = calibrationOrder[calibrationStep];
      const gesture = GESTURES.find(g => g.id === id);
      $('#camera-pose-image').src = gesture.frame;
      $('#camera-step').textContent = `POSE ${calibrationStep + 1} DE 8`;
      $('#camera-instruction').textContent = gesture.name;
      for (let seconds = 5; seconds > 0; seconds--) {
        $('#camera-message').textContent = `Faça a pose da imagem. Captura em ${seconds}…`;
        await delay(1000);
        if (run !== calibrationRun) return;
      }
      camera.history = [];
      $('#camera-message').textContent = 'Segure firme! Lendo a pose…';
      await delay(1200);
      if (run !== calibrationRun) return;
      try { camera.capture(id); }
      catch (error) {
        $('#camera-message').textContent = error.message;
        $('#camera-calibrate').textContent = 'Tentar esta pose novamente';
        $('#camera-calibrate').disabled = false;
        return;
      }
      calibrationStep++;
    }
    if (run !== calibrationRun) return;
    $('#camera-instruction').textContent = 'Calibração concluída!';
    $('#camera-message').textContent = 'Teste os movimentos e confira o nome reconhecido acima. Mantenha o celular e o corpo na mesma posição. Se mudar a distância, calibre novamente.';
    $('#camera-ready').hidden = false;
    $('#camera-calibrate').textContent = 'Refazer as oito poses';
    $('#camera-calibrate').disabled = false;
    $('#control-status').textContent = 'Câmera calibrada • sanfona real';
  }

  let accordion3d = null;
  let layoutMetrics = null;
  let layoutRequest = 0;
  try {
    accordion3d = new window.Accordion3D($("#accordion-3d"), app, $("#accordion-zone"));
  } catch {
    $("#pose-readout").textContent = "WebGL indisponível";
  }

  function stopSound(sound) {
    if (!sound) return;
    sound.pause();
    try { sound.currentTime = 0; } catch {}
  }

  function playSound(name, volume = 1) {
    const sound = sounds[name];
    if (!sound) return;
    stopSound(sound);
    sound.loop = false;
    sound.muted = state.muted;
    sound.volume = Math.max(0, Math.min(1, volume * state.effectsGain));
    const playback = sound.play();
    if (playback) playback.catch(() => {});
  }

  function stopAllSounds() {
    Object.values(sounds).forEach(stopSound);
  }

  function showScreen(id) {
    const previousScreen = state.screen;
    stopPreview();
    if (previousScreen === "title-screen" && id !== "title-screen") stopSound(sounds.title);
    screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
    state.screen = id;
    layoutMetrics = null;
    accordion3d?.setActive(id === 'game-screen' && !state.paused);
    if (id === 'title-screen' && controlMode === 'camera') { calibrationRun++; camera.stop(); }
    if (id === "title-screen" && previousScreen !== id) playSound("title", .88);
  }

  function setLoadingProgress(completed, total, label) {
    const percent = Math.round(completed / total * 100);
    $("#loading-progress").style.width = `${percent}%`;
    $("#loading-percent").textContent = `${percent}%`;
    $("#loading-status").textContent = label;
    $(".loading-track").setAttribute("aria-valuenow", String(percent));
  }

  function preloadImage(src) {
    return new Promise((resolve) => {
      const image = new Image();
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        image.onload = null;
        image.onerror = null;
        resolve();
      };
      image.onload = finish;
      image.onerror = finish;
      image.src = src;
      if (image.complete) finish();
    });
  }

  function preloadAudioFile(src) {
    return new Promise((resolve) => {
      const audio = new Audio();
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        audio.removeEventListener("canplaythrough", finish);
        audio.removeEventListener("error", finish);
        resolve();
      };
      const timeout = setTimeout(finish, 15000);
      audio.preload = "auto";
      audio.loop = false;
      audio.addEventListener("canplaythrough", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      preloadedAudio.push(audio);
      audio.src = src;
      audio.load();
    });
  }

  async function preloadGame() {
    const imageAssets = [
      "assets/cap-systems-logo.png?v=0.4.5",
      "assets/sertao-magico.png?v=0.4.5",
      "assets/cabra-celular.png?v=0.4.5",
      "assets/aprendendo-forrozear.png?v=0.4.5",
      ...GESTURES.map((gesture) => gesture.frame)
    ];
    const audioAssets = [
      ...SONGS.map((song) => song.src),
      "sons/derrota.m4a?v=0.4.5",
      "sons/tile_screen.m4a?v=0.4.5",
      "sons/vitoria.m4a?v=0.4.5"
    ];
    const total = imageAssets.length + audioAssets.length;
    let completed = 0;
    const loaded = (label) => {
      completed += 1;
      setLoadingProgress(completed, total, label);
    };
    await Promise.all([
      ...imageAssets.map((src) => preloadImage(src).then(() => loaded("Montando o cenário"))),
      ...audioAssets.map((src) => preloadAudioFile(src).then(() => loaded("Afinando a sanfona")))
    ]);
    setLoadingProgress(total, total, "Tudo pronto para o forró!");
    await delay(280);
    showStudioSplash();
  }

  function showStudioSplash() {
    showScreen("studio-screen");
    clearTimeout(state.studioTimer);
    state.studioTimer = setTimeout(enterTitleScreen, 3000);
  }

  function enterTitleScreen() {
    if (state.studioFinished) return;
    state.studioFinished = true;
    clearTimeout(state.studioTimer);
    showScreen("title-screen");
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function stopPreview() {
    clearTimeout(state.previewTimer);
    state.previewTimer = null;
    songCard.classList.remove("playing");
    previewIcon.textContent = "▶";
    if (!state.running) music.pause();
  }

  function selectedSong() {
    return SONGS[state.selectedSong];
  }

  function updateSongSelection(index) {
    stopPreview();
    state.selectedSong = (index + SONGS.length) % SONGS.length;
    const song = selectedSong();
    music.src = song.src;
    music.load();
    $("#track-number").textContent = `FAIXA ${String(state.selectedSong + 1).padStart(2, "0")}`;
    $("#song-title").textContent = song.title;
    $("#song-description").textContent = song.description;
    $("#record-label").textContent = song.label;
    $("#difficulty-label").textContent = song.difficulty;
    $("#pepper-meter").setAttribute("aria-label", `Dificuldade: ${song.difficulty.toLowerCase()}, ${song.peppers} de cinco`);
    $$("#pepper-meter b").forEach((pepper, pepperIndex) => pepper.classList.toggle("off", pepperIndex >= song.peppers));
    $$("#song-dots i").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === state.selectedSong));
    $("#song-dots").setAttribute("aria-label", `Faixa ${state.selectedSong + 1} de ${SONGS.length}`);
    songCard.setAttribute("aria-label", `Ouvir prévia de ${song.title}`);
    $("#select-screen").dataset.theme = song.theme;
    $("#game-screen").dataset.theme = song.theme;
  }

  function togglePreview() {
    if (!music.paused) {
      stopPreview();
      return;
    }
    music.currentTime = Math.min(4, Math.max(0, music.duration - 10 || 4));
    music.volume = .82 * state.musicGain;
    music.play().then(() => {
      songCard.classList.add("playing");
      previewIcon.textContent = "Ⅱ";
      state.previewTimer = setTimeout(stopPreview, 9000);
    }).catch(() => {
      previewIcon.textContent = "!";
    });
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function buildNotes(beats) {
    const random = seededRandom(Date.now());
    let previous = -1;
    return beats.map((time, index) => {
      let gestureIndex = Math.floor(random() * GESTURES.length);
      if (gestureIndex === previous) gestureIndex = (gestureIndex + 1 + Math.floor(random() * 6)) % GESTURES.length;
      previous = gestureIndex;
      return { id: index, time, gesture: GESTURES[gestureIndex], judged: false, hit: false, element: null, poseSince: null, startPositions: null };
    });
  }

  async function startGame(resetState = true) {
    if (controlMode === 'camera' && (!camera.active || !camera.calibrated)) { await openCameraSetup(); return; }
    stopPreview();
    stopAllSounds();
    const song = selectedSong();
    $("#game-screen").dataset.theme = song.theme;
    showScreen("game-screen");
    if (resetState) resetGameState();
    const sessionGeneration = state.sessionGeneration;
    layoutAccordion();
    accordion3d?.setActive(true);
    $("#countdown").classList.remove("hidden");
    const count = $("#countdown strong");
    const label = $("#countdown span");
    label.textContent = "Afinando a sanfona...";
    count.textContent = "♫";
    try {
      if (sdk) await sdk.startSession();
      if (sessionGeneration !== state.sessionGeneration) return;
      state.sessionActive = true;
    } catch {
      if (sessionGeneration !== state.sessionGeneration) return;
      showSessionError();
      return;
    }
    label.textContent = "Prepare as mãos!";
    for (const value of [3, 2, 1]) {
      count.textContent = value;
      vibrate(30);
      await delay(650);
      if (sessionGeneration !== state.sessionGeneration) return;
    }
    count.textContent = "BORA!";
    count.style.fontSize = "66px";
    await delay(450);
    if (sessionGeneration !== state.sessionGeneration) return;
    $("#countdown").classList.add("hidden");
    count.style.fontSize = "";

    state.notes = buildNotes(song.beats);
    state.running = true;
    state.paused = false;
    music.currentTime = 0;
    music.volume = state.musicGain;
    try {
      await music.play();
      if (sessionGeneration !== state.sessionGeneration) {
        music.pause();
        return;
      }
      state.raf = requestAnimationFrame(gameLoop);
    } catch (error) {
      if (sessionGeneration !== state.sessionGeneration) return;
      endGame("Áudio bloqueado", "Toque em continuar para liberar o som.", false, false);
    }
  }

  function resetGameState() {
    state.sessionGeneration += 1;
    cancelAnimationFrame(state.raf);
    music.pause();
    try { music.currentTime = 0; } catch {}
    state.running = false;
    state.paused = false;
    state.score = 0;
    state.confirmedScore = 0;
    state.pendingScore = 0;
    $("#score").textContent = "000000";
    $("#modal-score strong").textContent = "0";
    state.combo = 0;
    state.maxCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.sessionActive = false;
    state.ending = false;
    state.scoreQueue = Promise.resolve();
    state.notes = [];
    state.positions.left = { x: .32, y: .73 };
    state.positions.right = { x: .68, y: .73 };
    state.pointers.left = null;
    state.pointers.right = null;
    $("#left-grip").classList.remove("held");
    $("#right-grip").classList.remove("held");
    $("#note-lane").replaceChildren();
    $("#reaction-fx").replaceChildren();
    $("#game-screen").classList.remove("reaction-hit", "reaction-miss");
    updateHud();
  }

  function gameLoop() {
    if (!state.running || state.paused) return;
    const now = music.currentTime;
    const judgmentTime = now - (controlMode === 'camera' ? camera.latency / 1000 : 0);
    const fallTime = selectedSong().fallTime;
    const lane = $("#note-lane");
    const laneHeight = lane.clientHeight;

    for (const note of state.notes) {
      const timeToHit = note.time - now;
      if (!note.judged && !note.element && timeToHit <= fallTime && timeToHit > -.5) {
        note.startPositions = {
          left: { ...state.positions.left },
          right: { ...state.positions.right }
        };
        note.element = createNote(note);
        lane.append(note.element);
      }
      if (!note.element) continue;

      const progress = 1 - timeToHit / fallTime;
      const y = progress * (laneHeight * .73) - 90;
      const scale = .68 + Math.max(0, progress) * .32;
      note.element.style.transform = `translateY(${y}px) scale(${scale})`;

      if (!note.judged && judgmentTime >= note.time - .5 && judgmentTime <= note.time + .4) {
        const match = evaluateGesture(note.gesture, note.startPositions);
        if (match.valid) {
          note.poseSince ??= judgmentTime;
          const stableFor = judgmentTime - note.poseSince;
          const stabilityRequired = note.gesture.id.startsWith("curve-") ? .02 : .03;
          if (judgmentTime >= note.time - .34 && stableFor >= stabilityRequired) registerHit(note, Math.abs(judgmentTime - note.time));
        } else {
          note.poseSince = null;
        }
      }
      if (!note.judged && judgmentTime > note.time + .4) registerMiss(note);
      if (note.judged && judgmentTime > note.time + .65) {
        note.element.remove();
        note.element = null;
      }
    }

    if (!music.ended && state.running) state.raf = requestAnimationFrame(gameLoop);
  }

  function createNote(note) {
    const element = document.createElement("div");
    element.className = "game-note";
    element.innerHTML = `<div><img class="note-frame" src="${note.gesture.frame}" alt="" /><b>${note.gesture.name}</b></div>`;
    return element;
  }

  function evaluateGesture(gesture, startPositions = null, requireMovement = true) {
    if (controlMode === 'camera') {
      const valid = camera.matches(gesture.id);
      return { valid, leftScore: camera.score(gesture.id), rightScore: camera.score(gesture.id), signature: valid, activeHands: camera.tracked, correctDirection: true };
    }
    const l = state.positions.left;
    const r = state.positions.right;
    // Uma superelipse cria uma zona ampla, com cantos arredondados. Assim o
    // dedo não precisa coincidir com um ponto exato para a pose ser aceita.
    const handScore = (position, target) => {
      const normalizedX = Math.abs(position.x - target[0]) / gesture.xTolerance;
      const normalizedY = Math.abs(position.y - target[1]) / gesture.yTolerance;
      return Math.pow(normalizedX ** 4 + normalizedY ** 4, .25);
    };
    const leftScore = handScore(l, gesture.left);
    const rightScore = handScore(r, gesture.right);

    const gap = r.x - l.x;
    const verticalDifference = r.y - l.y;
    let signature = false;
    switch (gesture.id) {
      case "open": signature = gap > .56 && Math.abs(verticalDifference) < .12; break;
      case "closed": signature = gap > .12 && gap < .36 && Math.abs(verticalDifference) < .12; break;
      case "right": signature = l.x > .27 && r.x > .73 && gap > .34 && Math.abs(verticalDifference) < .12; break;
      case "left": signature = l.x < .27 && r.x > .48 && r.x < .74 && gap > .34 && Math.abs(verticalDifference) < .12; break;
      case "up": signature = l.y < .68 && r.y < .68 && Math.abs(verticalDifference) < .12; break;
      case "down": signature = l.y > .77 && r.y > .77 && Math.abs(verticalDifference) < .12; break;
      case "curve-right": signature = l.y > .735 && r.y < .725 && l.y - r.y > .055; break;
      case "curve-left": signature = l.y < .725 && r.y > .735 && r.y - l.y > .055; break;
    }

    const activeHands = navigator.maxTouchPoints === 0 || (state.pointers.left !== null && state.pointers.right !== null);
    let correctDirection = true;
    const isCurve = gesture.id.startsWith("curve-");
    if (requireMovement && startPositions && !isCurve) {
      const directionMatches = (side, target) => {
        const start = startPositions[side];
        const current = state.positions[side];
        const desiredX = target[0] - start.x;
        const desiredY = target[1] - start.y;
        const actualX = current.x - start.x;
        const actualY = current.y - start.y;
        const desiredLength = Math.hypot(desiredX, desiredY);
        const actualLength = Math.hypot(actualX, actualY);
        if (desiredLength < .035) return true;
        if (actualLength < .016) return false;
        return (desiredX * actualX + desiredY * actualY) / (desiredLength * actualLength) > .32;
      };
      correctDirection = directionMatches("left", gesture.left) && directionMatches("right", gesture.right);
    }

    return {
      valid: leftScore <= 1 && rightScore <= 1 && signature && activeHands && correctDirection,
      leftScore,
      rightScore,
      signature,
      activeHands,
      correctDirection
    };
  }

  function identifyPose() {
    if (controlMode === 'camera') {
      const id = camera.pose();
      const gesture = GESTURES.find(item => item.id === id);
      return gesture ? { gesture, score: camera.score(id), activeHands: camera.tracked } : null;
    }
    let best = null;
    for (const gesture of GESTURES) {
      const result = evaluateGesture(gesture, null, false);
      const score = Math.max(result.leftScore, result.rightScore);
      const priority = gesture.id.startsWith("curve-") ? 1 : 0;
      if (result.signature && score <= 1 && (!best || priority > best.priority || (priority === best.priority && score < best.score))) {
        best = { gesture, score, priority, activeHands: result.activeHands };
      }
    }
    return best && best.score <= 1.18 ? best : null;
  }

  function registerHit(note, timing) {
    note.judged = true;
    note.hit = true;
    const perfect = timing < .08;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.hits += 1;
    state.misses = Math.max(0, state.misses - 1);
    awardScore(Math.round(((perfect ? 1000 : 650) + Math.min(1500, state.combo * 35)) * selectedSong().scoreMultiplier));
    note.element.style.opacity = "0";
    note.element.style.filter = "brightness(1.8)";
    showFeedback(nextFeedback("hit"), "positive");
    vibrate(perfect ? [25, 25, 35] : 35);
    pulseMagic();
    triggerStageReaction("positive", perfect ? 1.25 : 1);
    updateHud();
  }

  function awardScore(points) {
    state.score += points;
    updateHud();
    if (!sdk || !state.sessionActive) return;
    state.pendingScore += points;
    const sessionGeneration = state.sessionGeneration;
    state.scoreQueue = state.scoreQueue.then(async () => {
      if (sessionGeneration !== state.sessionGeneration || !state.sessionActive) return;
      try {
        const response = await sdk.addScore(points);
        if (sessionGeneration !== state.sessionGeneration) return;
        state.pendingScore -= points;
        if (response && Number.isFinite(response.accumulatedScore)) {
          state.confirmedScore = response.accumulatedScore;
        } else {
          state.confirmedScore += points;
        }
        state.score = state.confirmedScore + state.pendingScore;
        updateHud();
      } catch {
        if (sessionGeneration !== state.sessionGeneration) return;
        state.pendingScore -= points;
        state.score = state.confirmedScore + state.pendingScore;
        updateHud();
      }
    });
  }

  function registerMiss(note) {
    note.judged = true;
    state.combo = 0;
    state.misses += 1;
    note.element.style.opacity = ".18";
    note.element.style.filter = "grayscale(1)";
    showFeedback(nextFeedback("miss"), "negative");
    triggerStageReaction("negative", 1);
    vibrate(90);
    updateHud();
    if (state.misses >= 10) endGame("O fole cansou!", "Foram 10 erros seguidos. Pegue o compasso e tente mais uma vez.", false);
  }

  function pulseMagic() {
    accordion3d?.pulse();
    $("#accordion-zone").animate([
      { filter: "brightness(1)" },
      { filter: "brightness(1.35)" },
      { filter: "brightness(1)" }
    ], { duration: 430, easing: "ease-out" });
  }

  function nextFeedback(type) {
    if (feedbackDecks[type].length === 0) {
      feedbackDecks[type] = [...FEEDBACK_EXPRESSIONS[type]];
      for (let index = feedbackDecks[type].length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [feedbackDecks[type][index], feedbackDecks[type][swapIndex]] = [feedbackDecks[type][swapIndex], feedbackDecks[type][index]];
      }
      if (feedbackDecks[type].at(-1) === lastFeedback[type] && feedbackDecks[type].length > 1) {
        const lastIndex = feedbackDecks[type].length - 1;
        [feedbackDecks[type][0], feedbackDecks[type][lastIndex]] = [feedbackDecks[type][lastIndex], feedbackDecks[type][0]];
      }
    }
    const expression = feedbackDecks[type].pop();
    lastFeedback[type] = expression;
    return expression;
  }

  function triggerStageReaction(tone, intensity = 1) {
    const gameScreen = $("#game-screen");
    const layer = $("#reaction-fx");
    const reactionClass = tone === "positive" ? "reaction-hit" : "reaction-miss";
    state.reactionSequence += 1;
    const sequence = state.reactionSequence;
    gameScreen.classList.remove("reaction-hit", "reaction-miss");
    void gameScreen.offsetWidth;
    gameScreen.classList.add(reactionClass);
    layer.replaceChildren();

    const positive = tone === "positive";
    const count = Math.round((positive ? 8 + Math.min(state.combo, 4) : 8) * intensity);
    const positiveColors = ["#ffd75f", "#ff8a2a", "#26c9bc", "#ff4e78", "#fff0b8"];
    const negativeSymbols = ["♪", "♫", "♩"];
    for (let index = 0; index < count; index++) {
      const particle = document.createElement("i");
      const angle = Math.PI * 2 * index / count + (Math.random() - .5) * .5;
      const distance = (positive ? 115 : 80) + Math.random() * (positive ? 180 : 125);
      const deltaX = Math.cos(angle) * distance;
      const deltaY = Math.sin(angle) * distance - (positive ? 65 : 10);
      particle.className = "reaction-particle";
      particle.style.setProperty("--dx", `${deltaX.toFixed(1)}px`);
      particle.style.setProperty("--dy", `${deltaY.toFixed(1)}px`);
      particle.style.setProperty("--turn", `${Math.round((Math.random() - .5) * 560)}deg`);
      particle.style.setProperty("--delay", `${(index % 5) * 18}ms`);

      if (positive) {
        const isFlag = index % 3 === 0;
        particle.classList.add(isFlag ? "hit-flag" : "hit-star");
        particle.style.setProperty("--particle-color", positiveColors[index % positiveColors.length]);
        if (!isFlag) particle.textContent = index % 2 === 0 ? "★" : "✦";
      } else {
        const isShard = index % 3 === 0;
        particle.classList.add(isShard ? "miss-shard" : "miss-note");
        if (!isShard) particle.textContent = negativeSymbols[index % negativeSymbols.length];
      }
      layer.append(particle);
    }

    setTimeout(() => {
      if (sequence !== state.reactionSequence) return;
      gameScreen.classList.remove(reactionClass);
      layer.replaceChildren();
    }, 980);
  }

  function showFeedback(text, tone) {
    const feedback = $("#feedback");
    feedback.textContent = text;
    feedback.classList.remove("pop", "positive", "negative");
    void feedback.offsetWidth;
    feedback.classList.add("pop", tone);
  }

  function updateHud() {
    $("#score").textContent = String(state.score).padStart(6, "0");
    const combo = $("#combo");
    combo.querySelector("strong").textContent = state.combo;
    combo.classList.toggle("visible", state.combo >= 2);
    const pips = $("#danger-pips");
    pips.replaceChildren(...Array.from({ length: 10 }, (_, index) => {
      const pip = document.createElement("i");
      if (index < state.misses) pip.className = "on";
      return pip;
    }));
    pips.setAttribute("aria-label", `${state.misses} erros consecutivos de 10`);
  }

  async function endGame(title, copy, won, playOutcome = true) {
    if (state.ending) return;
    const sessionGeneration = state.sessionGeneration;
    state.ending = true;
    accordion3d?.setActive(false);
    state.running = false;
    state.paused = false;
    cancelAnimationFrame(state.raf);
    music.pause();
    if (playOutcome) {
      stopAllSounds();
      playSound(won ? "victory" : "defeat");
    }
    if (sdk && state.sessionActive) {
      try {
        await state.scoreQueue;
        if (sessionGeneration !== state.sessionGeneration) return;
        const response = await sdk.finishSession([
          { label: "Acertos", value: state.hits },
          { label: "Maior arrastão", value: state.maxCombo },
          { label: "Música", value: selectedSong().title }
        ]);
        if (sessionGeneration !== state.sessionGeneration) return;
        if (response && Number.isFinite(response.score)) state.score = response.score;
      } catch (error) {
        console.warn('Não foi possível confirmar o resultado na plataforma:', error.message);
        copy = 'A plataforma não confirmou o resultado. A pontuação desta partida pode não ter sido salva.';
      }
      if (sessionGeneration !== state.sessionGeneration) return;
      state.sessionActive = false;
    }
    $("#modal-kicker").textContent = won ? "SHOW COMPLETO" : "FIM DO SHOW";
    $("#modal-title").textContent = title;
    $("#modal-copy").textContent = copy;
    $("#modal-score").hidden = false;
    $("#modal-score strong").textContent = state.score.toLocaleString("pt-BR");
    window.dispatchEvent(new CustomEvent("sanfona:result", { detail: { score: state.score, song: selectedSong().id, title: selectedSong().title } }));
    $("#resume-button").hidden = true;
    $("#restart-button").hidden = false;
    modal.hidden = false;
  }

  function showSessionError() {
    $("#countdown").classList.add("hidden");
    $("#modal-kicker").textContent = "SEM CONEXÃO COM A PLATAFORMA";
    $("#modal-title").textContent = "Não deu para começar";
    $("#modal-copy").textContent = "A sessão não foi confirmada. Volte à seleção e tente novamente.";
    $("#modal-score").hidden = true;
    $("#resume-button").hidden = true;
    $("#restart-button").hidden = true;
    modal.hidden = false;
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = true;
    accordion3d?.setActive(false);
    music.pause();
    cancelAnimationFrame(state.raf);
    $("#modal-kicker").textContent = "PAUSA";
    $("#modal-title").textContent = "Fole descansando";
    $("#modal-copy").textContent = "Respire fundo e volte no compasso.";
    $("#modal-score").hidden = true;
    $("#resume-button").hidden = false;
    $("#restart-button").hidden = true;
    modal.hidden = false;
  }

  function resumeGame() {
    if (controlMode === 'camera' && (!camera.calibrated || !camera.tracked)) {
      $('#modal-copy').textContent = camera.active ? 'Mostre os dois marcadores antes de continuar.' : 'A câmera está desligada. Use Recalibrar câmera.';
      return;
    }
    modal.hidden = true;
    if (!state.running) return;
    state.paused = false;
    music.play().then(() => { if (state.running && !state.paused) state.raf = requestAnimationFrame(gameLoop); }).catch(() => { pauseGame(); $('#modal-copy').textContent = 'Não foi possível retomar o áudio. Toque em Continuar novamente.'; });
    accordion3d?.setActive(true);
  }

  function restartGame() {
    if (controlMode === 'camera' && (!camera.active || !camera.calibrated)) { void openCameraSetup(); return; }
    resetGameState();
    modal.hidden = true;
    stopAllSounds();
    void startGame(false);
  }

  async function quitGame() {
    $('#quit-button').disabled = true;
    if (state.sessionActive && !state.ending) await endGame('Partida encerrada', '', false, false);
    state.sessionGeneration++;
    state.sessionActive = false;
    calibrationRun++;
    camera.stop();
    state.running = false;
    state.paused = false;
    cancelAnimationFrame(state.raf);
    music.pause();
    stopAllSounds();
    modal.hidden = true;
    showScreen("select-screen");
    if (controlMode === 'camera') $('#control-status').textContent = 'Câmera desligada • toque em Bora para calibrar novamente';
    $('#quit-button').disabled = false;
  }

  function layoutAccordion() {
    if (layoutRequest) return;
    layoutRequest = requestAnimationFrame(() => { layoutRequest = 0; renderAccordionLayout(); });
  }

  function renderAccordionLayout() {
    if (state.screen !== 'game-screen') return;
    if (!layoutMetrics) {
      layoutMetrics = { rect: app.getBoundingClientRect(), zoneRect: $('#accordion-zone').getBoundingClientRect() };
      accordion3d?.resize();
    }
    const { rect, zoneRect } = layoutMetrics;
    const left = $("#left-grip");
    const right = $("#right-grip");
    if (!rect.width || !rect.height || !zoneRect.width || !zoneRect.height) return;
    const zoneTopRatio = (zoneRect.top - rect.top) / rect.height;
    const zoneHeightRatio = zoneRect.height / rect.height;
    const local = (position) => ({ x: position.x * rect.width, y: ((position.y - zoneTopRatio) / zoneHeightRatio) * zoneRect.height });
    const lp = local(state.positions.left);
    const rp = local(state.positions.right);
    left.style.left = `${lp.x}px`; left.style.top = `${lp.y}px`;
    right.style.left = `${rp.x}px`; right.style.top = `${rp.y}px`;
    accordion3d?.update(state.positions.left, state.positions.right);

    const pose = identifyPose();
    const readout = $("#pose-readout");
    if (pose && pose.activeHands) {
      readout.textContent = pose.gesture.name;
      readout.classList.add("locked");
    } else if (controlMode === 'camera') {
      readout.textContent = camera.tracked ? 'Ajuste a pose' : 'Mostre os marcadores';
      readout.classList.remove('locked');
    } else if (navigator.maxTouchPoints > 0 && (state.pointers.left === null || state.pointers.right === null)) {
      readout.textContent = "Segure os dois lados";
      readout.classList.remove("locked");
    } else {
      readout.textContent = "Ajuste a posição";
      readout.classList.remove("locked");
    }
  }

  function bindGrip(side) {
    const grip = $(`#${side}-grip`);
    grip.addEventListener("pointerdown", (event) => {
      if (controlMode === 'camera') return;
      if (event.button > 0) return;
      event.preventDefault();
      state.pointers[side] = event.pointerId;
      grip.classList.add("held");
      grip.setPointerCapture(event.pointerId);
      updateGrip(side, event.clientX, event.clientY);
    });
    grip.addEventListener("pointermove", (event) => {
      if (state.pointers[side] === event.pointerId) updateGrip(side, event.clientX, event.clientY);
    });
    const release = (event) => {
      if (state.pointers[side] === event.pointerId) {
        state.pointers[side] = null;
        grip.classList.remove("held");
        layoutAccordion();
      }
    };
    grip.addEventListener("pointerup", release);
    grip.addEventListener("pointercancel", release);
  }

  function updateGrip(side, clientX, clientY) {
    const rect = app.getBoundingClientRect();
    const x = Math.max(.08, Math.min(.92, (clientX - rect.left) / rect.width));
    const y = Math.max(.56, Math.min(.91, (clientY - rect.top) / rect.height));
    state.positions[side] = { x, y };
    layoutAccordion();
  }

  function updateTutorial(step) {
    state.tutorialStep = Math.max(0, Math.min(3, step));
    $$(".tutorial-page").forEach((page, i) => page.classList.toggle("active", i === state.tutorialStep));
    $$("#tutorial-dots i").forEach((dot, i) => dot.classList.toggle("active", i === state.tutorialStep));
    $("#tutorial-step-count").textContent = `${state.tutorialStep + 1}/4`;
    $("#tutorial-next").innerHTML = state.tutorialStep === 3 ? "Vamos sanfonar! <span>›</span>" : "Próximo <span>›</span>";
  }

  function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  $("#play-button").addEventListener("click", () => showScreen("select-screen"));
  $('#touch-mode').addEventListener('click', () => setControlMode('touch'));
  $('#camera-mode').addEventListener('click', () => { void openCameraSetup(); });
  $('#camera-calibrate').addEventListener('click', () => { void calibrateCamera(); });
  $('#camera-retry').addEventListener('click', () => { void openCameraSetup(); });
  $('#camera-ready').addEventListener('click', () => { if (camera.calibrated) showScreen('select-screen'); });
  $('#camera-back').addEventListener('click', () => { setControlMode('touch'); showScreen('select-screen'); });
  $('#recalibrate-button').addEventListener('click', () => { void openCameraSetup(); });
  $('#camera-latency').addEventListener('input', event => {
    camera.latency = Number(event.target.value);
    $('#camera-latency-value').textContent = `${camera.latency} ms`;
  });
  window.addEventListener('pagehide', () => { calibrationRun++; camera.stop(); });
  $("#studio-skip").addEventListener("click", enterTitleScreen);
  $("#tutorial-button").addEventListener("click", () => { updateTutorial(0); showScreen("tutorial-screen"); });
  $$(".back-title").forEach((button) => button.addEventListener("click", () => showScreen("title-screen")));
  songCard.addEventListener("click", togglePreview);
  $("#previous-song").addEventListener("click", () => updateSongSelection(state.selectedSong - 1));
  $("#next-song").addEventListener("click", () => updateSongSelection(state.selectedSong + 1));
  $("#start-button").addEventListener("click", () => { void startGame(); });
  $("#pause-button").addEventListener("click", pauseGame);
  $("#resume-button").addEventListener("click", resumeGame);
  $("#restart-button").addEventListener("click", restartGame);
  $("#quit-button").addEventListener("click", quitGame);
  $("#tutorial-next").addEventListener("click", () => {
    if (state.tutorialStep < 3) updateTutorial(state.tutorialStep + 1);
    else showScreen("select-screen");
  });
  music.addEventListener("ended", () => {
    if (state.running) endGame("Mandou bem demais!", `Você dominou ${selectedSong().title}. O salão inteiro ouviu seu show!`, true);
  });
  window.addEventListener('resize', () => { layoutMetrics = null; layoutAccordion(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.running && !state.paused) pauseGame(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'camera-screen') {
      calibrationRun++;
      $('#camera-calibrate').disabled = !camera.active;
      $('#camera-calibrate').textContent = 'Continuar calibração';
      $('#camera-message').textContent = 'Calibração interrompida. Volte à posição e continue quando estiver pronto.';
    }
  });
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  if (sdk) {
    sdk.requireOrientation("portrait");
    sdk.onPause(() => { if (state.running && !state.paused) pauseGame(); });
    sdk.onResume(() => { if (state.running && state.paused) resumeGame(); });
    sdk.onMuteChange((muted) => {
      state.muted = muted;
      music.muted = muted;
      Object.values(sounds).forEach((sound) => { sound.muted = muted; });
    });
    sdk.onVolumeChange((volume) => {
      state.musicGain = (volume.master / 100) * (volume.music / 100);
      state.effectsGain = (volume.master / 100) * ((volume.effects ?? volume.music) / 100);
      music.volume = Math.max(0, Math.min(1, state.musicGain));
      Object.values(sounds).forEach((sound) => {
        sound.volume = Math.max(0, Math.min(1, state.effectsGain));
      });
    });
    sdk.onRestart(restartGame);
  }

  bindGrip("left");
  bindGrip("right");
  updateSongSelection(0);
  updateHud();
  layoutAccordion();
  preloadGame();
})();
