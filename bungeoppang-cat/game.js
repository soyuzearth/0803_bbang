const game = document.getElementById("game");
const shell = document.querySelector(".shell");
const cat = document.getElementById("cat");
const overlay = document.getElementById("overlay");
const scoreForm = document.getElementById("scoreForm");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const playerName = document.getElementById("playerName");
const rankingList = document.getElementById("rankingList");
const titleScreen = document.getElementById("titleScreen");
const titleStartButton = document.getElementById("titleStartButton");
const titleSoundButton = document.getElementById("titleSoundButton");
const stateButton = document.getElementById("stateButton");
const soundButton = document.getElementById("soundButton");
const bestStat = document.getElementById("bestStat");
const livesEl = document.getElementById("lives");
const scoreEl = document.getElementById("score");
const comboStat = document.getElementById("comboStat");
const comboEl = document.getElementById("combo");
const bestEl = document.getElementById("best");
const burst = document.getElementById("burst");

const LABEL_JUMP = "\uC810\uD504";
const LABEL_RESTART = "\uB2E4\uC2DC \uC2DC\uC791";
const LABEL_CUSTARD = "\uC288\uBD95";
const LABEL_HOT = "\uC544\uB728\uB728!";
const LABEL_LIFE = "\uBAA9\uC228 -1";
const LABEL_BAG = "\uBD09\uC9C0 2x!";
const LABEL_REDBEAN = "\uD31F\uBD95";
const LABEL_PUDDLE = "\uBB3C\uC6C5\uB369\uC774!";
const LIFE_FULL = "\uD83D\uDC31";
const LIFE_EMPTY = "\u00B7";
const CAT_RUN_CLASS = "cat-runner";
const CAT_JUMP_CLASS = "cat-jumper";
const RANKING_KEY = "bungeoppang-cat-ranking";
const MAX_AIR_BOOSTS = 2;
const BASE_SPEED_RATIO = 0.22;
const SPEED_ACCEL_RATIO = 0.0048;
const MUSIC_STEP_MS = 210;
const AUDIO_FILES = {
  bgm: ["./assets/audio/bgm.mp3", "./assets/audio/bgm.wav"],
  jump: ["./assets/audio/jump.mp3", "./assets/audio/jump.wav"],
  boost: ["./assets/audio/boost.mp3", "./assets/audio/boost.wav"],
  redbean: ["./assets/audio/redbean.mp3", "./assets/audio/redbean.wav"],
  custard: ["./assets/audio/custard.mp3", "./assets/audio/custard.wav"],
  bag: ["./assets/audio/bag.mp3", "./assets/audio/bag.wav"],
  hurt: ["./assets/audio/hurt.mp3", "./assets/audio/hurt.wav"],
  puddle: ["./assets/audio/puddle.mp3", "./assets/audio/puddle.wav"],
  gameover: ["./assets/audio/gameover.mp3", "./assets/audio/gameover.wav"],
};

const state = {
  mode: "stopped",
  score: 0,
  combo: 1,
  lives: 3,
  best: Number(localStorage.getItem("bungeoppang-cat-best") || 0),
  catY: 0,
  catVelocity: 0,
  airBoosts: 0,
  speed: 0,
  spawnTimer: 0,
  mapX: 0,
  laneX: 0,
  doubleUntil: 0,
  invincibleUntil: 0,
  hitVisualUntil: 0,
  lastJumpInputAt: 0,
  lastTime: 0,
  runFrame: 0,
  items: [],
};

const audio = {
  context: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  timer: 0,
  step: 0,
  elements: {},
  usingElements: false,
  enabled: false,
};

[
  "./assets/cat-run-frame-0.png",
  "./assets/cat-run-frame-1.png",
  "./assets/cat-run-frame-2.png",
  "./assets/cat-run-frame-3.png",
  "./assets/cat-jump-flat.png",
].forEach((src) => {
  const image = new Image();
  image.src = src;
});

bestEl.textContent = state.best;
overlay.hidden = true;
renderRanking();
updateHud();
setCatSprite("run");
updateStateButton();

function resetGame() {
  hideTitleScreen();
  startAudio();
  state.mode = "playing";
  state.score = 0;
  state.combo = 1;
  state.lives = 3;
  state.catY = 0;
  state.catVelocity = 0;
  state.airBoosts = 0;
  state.speed = getBaseSpeed();
  state.spawnTimer = 0.72;
  state.mapX = 0;
  state.laneX = 0;
  state.doubleUntil = 0;
  state.invincibleUntil = 0;
  state.hitVisualUntil = 0;
  state.lastJumpInputAt = 0;
  state.runFrame = 0;
  state.items.forEach((item) => item.el.remove());
  state.items = [];
  state.lastTime = performance.now();
  setCatSprite("run");
  cat.classList.add("is-running");
  cat.classList.remove("is-hit");
  hideOverlay();
  scoreForm.classList.remove("is-ranking-only");
  updateHud();
  updateStateButton();
  requestAnimationFrame(tick);
}

function jump() {
  if (state.mode === "stopped") {
    resetGame();
    return;
  }

  if (state.mode === "paused") {
    resumeGame();
    return;
  }

  const jumpVelocity = getJumpVelocity();

  if (state.catY < 2) {
    state.catVelocity = jumpVelocity;
    state.airBoosts = 0;
    setCatSprite("jump");
    playSfx("jump");
    return;
  }

  if (state.airBoosts < MAX_AIR_BOOSTS) {
    state.airBoosts += 1;
    state.catVelocity = Math.min(state.catVelocity + jumpVelocity * 0.38, jumpVelocity * 1.46);
    setCatSprite("jump");
    playSfx("boost");
  }
}

function resumeGame() {
  if (state.mode !== "paused") return;
  startAudio();
  state.mode = "playing";
  state.lastTime = performance.now();
  cat.classList.add("is-running");
  hideOverlay();
  scoreForm.classList.remove("is-ranking-only");
  updateStateButton();
  requestAnimationFrame(tick);
}

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  stopMusic();
  cat.classList.remove("is-running");
  updateStateButton();
}

function stopGame() {
  state.mode = "stopped";
  stopMusic();
  state.score = 0;
  state.combo = 1;
  state.lives = 3;
  state.speed = getBaseSpeed();
  state.spawnTimer = 0;
  state.mapX = 0;
  state.laneX = 0;
  state.items.forEach((item) => item.el.remove());
  state.items = [];
  state.catY = 0;
  state.catVelocity = 0;
  state.airBoosts = 0;
  state.invincibleUntil = 0;
  state.hitVisualUntil = 0;
  state.doubleUntil = 0;
  state.lastJumpInputAt = 0;
  state.runFrame = 0;
  cat.style.translate = "0 0";
  cat.classList.remove("is-running", "is-hit");
  setCatSprite("run");
  game.style.setProperty("--map-x", "0px");
  game.style.setProperty("--lane-x", "0px");
  hideOverlay();
  scoreForm.classList.remove("is-ranking-only");
  updateHud();
  updateStateButton();
}

function spawnItem() {
  const roll = Math.random();
  let type = "redbean";
  if (roll > 0.88) type = "puddle";
  else if (roll > 0.78) type = "bag";
  else if (roll > 0.62) type = "bad";
  else if (roll > 0.38) type = "custard";

  const el = document.createElement("div");
  el.className = `item ${type}`;
  el.style.setProperty("--item-bottom", `${getItemBottom(type)}%`);
  game.appendChild(el);

  state.items.push({
    el,
    type,
    x: game.clientWidth + 80,
    collected: false,
  });
}

function getItemBottom(type) {
  if (type === "puddle") return 15;
  if (type === "bad") return 19 + Math.random() * 4;
  if (type === "bag") return Math.random() > 0.45 ? 31 + Math.random() * 8 : 22 + Math.random() * 5;
  return Math.random() > 0.58 ? 31 + Math.random() * 10 : 21 + Math.random() * 6;
}

function tick(now) {
  if (state.mode !== "playing") return;

  const dt = Math.min((now - state.lastTime) / 1000, 0.032);
  state.lastTime = now;
  state.speed += getSpeedAcceleration() * dt;
  state.mapX = (state.mapX - state.speed * dt * 0.22) % 1672;
  state.laneX = (state.laneX - state.speed * dt * 0.86) % 260;
  game.style.setProperty("--map-x", `${state.mapX}px`);
  game.style.setProperty("--lane-x", `${state.laneX}px`);
  state.spawnTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnItem();
    state.spawnTimer = Math.max(0.82, 1.5 - getSpeedRatio() * 0.95 + Math.random() * 0.55);
  }

  state.catVelocity -= getGravity() * dt;
  state.catY = Math.max(0, state.catY + state.catVelocity * dt);
  if (state.catY === 0 && state.catVelocity < 0) {
    state.catVelocity = 0;
    state.airBoosts = 0;
    setCatSprite("run");
  }

  if (state.hitVisualUntil && now > state.hitVisualUntil) {
    state.hitVisualUntil = 0;
    cat.classList.remove("is-hit");
  }

  if (state.invincibleUntil && now > state.invincibleUntil) {
    state.invincibleUntil = 0;
  }

  if (state.doubleUntil && now > state.doubleUntil) {
    state.doubleUntil = 0;
    updateHud();
  }

  cat.style.translate = `0 ${-state.catY}px`;
  updateCatRunFrame(now);
  updateItems(now, dt);
  requestAnimationFrame(tick);
}

function updateCatRunFrame(now) {
  if (!cat.classList.contains(CAT_RUN_CLASS) || !cat.classList.contains("is-running")) return;
  const frame = Math.floor(now / 120) % 4;
  if (frame === state.runFrame) return;
  state.runFrame = frame;
  cat.dataset.runFrame = String(frame);
}

function updateItems(now, dt) {
  const gameBounds = game.getBoundingClientRect();
  const catBounds = cat.getBoundingClientRect();
  const catRect = insetRect(toLocalRect(catBounds, gameBounds), 0.2);

  for (const item of state.items) {
    item.x -= state.speed * dt;
    item.el.style.transform = `translateX(${item.x}px)`;
    const itemRect = insetRect(toLocalRect(item.el.getBoundingClientRect(), gameBounds), 0.14);

    if (!item.collected && overlaps(catRect, itemRect)) {
      item.collected = true;
      handleHit(item, now);
    }
  }

  state.items = state.items.filter((item) => {
    const alive = item.x > -120 && !item.collected;
    if (!alive) item.el.remove();
    return alive;
  });
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function getGameHeight() {
  return Math.max(game.clientHeight || 0, 360);
}

function getGameWidth() {
  return Math.max(game.clientWidth || 0, 640);
}

function getBaseSpeed() {
  return getGameWidth() * BASE_SPEED_RATIO;
}

function getSpeedAcceleration() {
  return getGameWidth() * SPEED_ACCEL_RATIO;
}

function getSpeedRatio() {
  return state.speed / getGameWidth();
}

function getJumpVelocity() {
  return getGameHeight() * 1.18;
}

function getGravity() {
  return getGameHeight() * 3.05;
}

function startAudio() {
  if (startElementAudio()) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();
  audio.enabled = true;
  updateSoundButton();
  startMusic();
}

function startElementAudio() {
  const bgm = getAudioElement("bgm");
  if (!bgm) return false;

  audio.usingElements = true;
  audio.enabled = true;
  bgm.loop = true;
  bgm.muted = false;
  bgm.volume = 0.42;
  bgm.play().catch(() => {
    audio.enabled = false;
    updateSoundButton();
  });
  updateSoundButton();
  return true;
}

function getAudioElement(name) {
  if (audio.elements[name]) return audio.elements[name];
  if (!AUDIO_FILES[name]) return null;
  const element = document.createElement("audio");
  element.src = getPreferredAudioSource(name);
  element.preload = "auto";
  element.playsInline = true;
  audio.elements[name] = element;
  return element;
}

function getPreferredAudioSource(name) {
  const sources = AUDIO_FILES[name];
  if (!Array.isArray(sources)) return sources;
  const probe = document.createElement("audio");
  return probe.canPlayType && probe.canPlayType("audio/mpeg") ? sources[0] : sources[1];
}

function getAudioContext() {
  if (audio.context) return audio.context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  audio.context = new AudioContext();
  audio.master = audio.context.createGain();
  audio.musicGain = audio.context.createGain();
  audio.sfxGain = audio.context.createGain();
  audio.master.gain.value = 0.72;
  audio.musicGain.gain.value = 0.18;
  audio.sfxGain.gain.value = 0.46;
  audio.musicGain.connect(audio.master);
  audio.sfxGain.connect(audio.master);
  audio.master.connect(audio.context.destination);
  return audio.context;
}

function startMusic() {
  if (audio.timer || !audio.context) return;
  audio.step = 0;
  playMusicStep();
  audio.timer = window.setInterval(playMusicStep, MUSIC_STEP_MS);
}

function stopMusic() {
  const bgm = audio.elements.bgm;
  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }
  updateSoundButton();

  if (!audio.timer) return;
  window.clearInterval(audio.timer);
  audio.timer = 0;
}

function playMusicStep() {
  if (!audio.context || !audio.musicGain) return;
  const now = audio.context.currentTime;
  const melody = [659, 784, 880, 784, 659, 587, 523, 587, 659, 784, 988, 880, 784, 659, 587, 523];
  const bass = [196, 196, 247, 247, 220, 220, 262, 262];
  const step = audio.step;

  if (step % 2 === 0) {
    playTone(melody[step % melody.length], now, 0.18, "triangle", audio.musicGain, 0.18);
  }

  if (step % 4 === 0) {
    playTone(bass[Math.floor(step / 4) % bass.length], now, 0.34, "sine", audio.musicGain, 0.16);
  }

  if (step % 4 === 2) {
    playNoise(now, 0.035, audio.musicGain, 0.035, 1400);
  }

  audio.step = (step + 1) % 32;
}

function playSfx(name) {
  if (playElementSfx(name)) return;
  const context = getAudioContext();
  if (!context || !audio.sfxGain) return;
  const now = context.currentTime;

  if (name === "jump") {
    playSlide(330, 560, now, 0.12, "sine", 0.16);
  } else if (name === "boost") {
    playSlide(450, 720, now, 0.1, "triangle", 0.13);
  } else if (name === "redbean") {
    playTone(880, now, 0.08, "triangle", audio.sfxGain, 0.2);
    playTone(1320, now + 0.045, 0.09, "triangle", audio.sfxGain, 0.14);
  } else if (name === "custard") {
    playTone(988, now, 0.08, "triangle", audio.sfxGain, 0.18);
    playTone(1319, now + 0.055, 0.1, "triangle", audio.sfxGain, 0.16);
    playTone(1760, now + 0.11, 0.12, "triangle", audio.sfxGain, 0.12);
  } else if (name === "bag") {
    [784, 988, 1175, 1568].forEach((freq, index) => {
      playTone(freq, now + index * 0.045, 0.11, "triangle", audio.sfxGain, 0.14);
    });
  } else if (name === "puddle") {
    playSlide(260, 120, now, 0.22, "sawtooth", 0.09);
    playNoise(now, 0.12, audio.sfxGain, 0.08, 650);
  } else if (name === "hurt") {
    playSlide(180, 95, now, 0.2, "square", 0.09);
  } else if (name === "gameover") {
    [392, 330, 262, 196].forEach((freq, index) => {
      playTone(freq, now + index * 0.12, 0.16, "sine", audio.sfxGain, 0.13);
    });
  }
}

function playElementSfx(name) {
  if (!audio.enabled && name !== "jump") return false;
  const source = getAudioElement(name);
  if (!source) return false;
  const sound = source.cloneNode();
  sound.muted = false;
  sound.volume = name === "hurt" || name === "puddle" ? 0.5 : 0.68;
  sound.play().catch(() => {
    audio.enabled = false;
    updateSoundButton();
  });
  return true;
}

function toggleSound() {
  if (audio.enabled) {
    audio.enabled = false;
    stopMusic();
    updateSoundButton();
    return;
  }

  startAudio();
  playElementSfx("jump");
  updateSoundButton();
}

function updateSoundButton() {
  if (!soundButton) return;
  soundButton.textContent = audio.enabled ? "SOUND ON" : "SOUND";
  soundButton.dataset.enabled = audio.enabled ? "true" : "false";
  if (!titleSoundButton) return;
  titleSoundButton.textContent = audio.enabled ? "SOUND ON" : "SOUND";
  titleSoundButton.dataset.enabled = audio.enabled ? "true" : "false";
}

function playTone(freq, start, duration, type, destination, volume) {
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playSlide(from, to, start, duration, type, volume) {
  const osc = audio.context.createOscillator();
  const gain = audio.context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.sfxGain);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNoise(start, duration, destination, volume, filterFreq) {
  const sampleRate = audio.context.sampleRate;
  const buffer = audio.context.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(start);
  source.stop(start + duration);
}

function toLocalRect(rect, parentRect) {
  return {
    x: rect.left - parentRect.left,
    y: rect.top - parentRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function insetRect(rect, amount) {
  const insetX = rect.width * amount;
  const insetY = rect.height * amount;
  return {
    x: rect.x + insetX,
    y: rect.y + insetY,
    width: rect.width - insetX * 2,
    height: rect.height - insetY * 2,
  };
}

function handleHit(item, now) {
  if (item.type === "bad" || item.type === "puddle") {
    loseLife(now, item.type);
    return;
  }

  if (item.type === "bag") {
    state.doubleUntil = now + 8000;
    playSfx("bag");
    showFloat(LABEL_BAG, "bonus");
    showBurst(LABEL_BAG, "combo");
    pulseCombo();
    pulseGame("good");
    updateHud();
    return;
  }

  const multiplier = getScoreMultiplier(now);
  const points = (item.type === "custard" ? 30 : 10) * multiplier;
  state.score += points;

  if (item.type === "custard") {
    state.combo += 1;
    playSfx("custard");
    showFloat(`${LABEL_CUSTARD} x${getScoreMultiplier(now)}!`, "combo");
    showBurst(`${LABEL_CUSTARD} x${getScoreMultiplier(now)}!`, "combo");
    pulseCombo();
    pulseGame("good");
  } else {
    playSfx("redbean");
    showFloat(`${LABEL_REDBEAN} +${points}`, "score");
    pulseGame("score");
  }

  updateHud();
}

function loseLife(now, type = "bad") {
  if (state.invincibleUntil && now < state.invincibleUntil) return;

  state.lives -= 1;
  playSfx(type === "puddle" ? "puddle" : "hurt");
  state.combo = 1;
  state.invincibleUntil = now + 1200;
  state.hitVisualUntil = now + 260;
  cat.classList.add("is-hit");
  showFloat(type === "puddle" ? LABEL_PUDDLE : LABEL_HOT, "danger");
  showBurst(type === "puddle" ? LABEL_PUDDLE : LABEL_LIFE, "danger");
  pulseGame("danger");
  updateHud();

  if (state.lives <= 0) {
    endGame();
  }
}

function showFloat(text, kind = "score") {
  const el = document.createElement("div");
  el.className = `float-text ${kind}`;
  el.textContent = text;
  game.appendChild(el);
  setTimeout(() => el.remove(), 760);
}

function showBurst(text, kind) {
  burst.textContent = text;
  burst.className = `burst ${kind} is-visible`;
  window.setTimeout(() => {
    burst.classList.remove("is-visible");
  }, 620);
}

function pulseCombo() {
  comboStat.classList.remove("is-combo-pulse");
  void comboStat.offsetWidth;
  comboStat.classList.add("is-combo-pulse");
}

function pulseGame(kind) {
  game.classList.remove("feedback-good", "feedback-score", "feedback-danger");
  void game.offsetWidth;
  game.classList.add(`feedback-${kind}`);
  window.setTimeout(() => {
    game.classList.remove(`feedback-${kind}`);
  }, 360);
}

function endGame() {
  state.mode = "stopped";
  stopMusic();
  playSfx("gameover");
  cat.classList.remove("is-running");
  cat.classList.remove("is-hit");
  state.best = Math.max(state.best, state.score);
  localStorage.setItem("bungeoppang-cat-best", String(state.best));
  updateHud();
  updateStateButton();
  scoreForm.classList.remove("is-ranking-only");
  overlayTitle.textContent = "\uB7AD\uD0B9 \uB4F1\uB85D";
  overlayText.textContent = `${LABEL_HOT} ${state.score}`;
  playerName.value = localStorage.getItem("bungeoppang-cat-last-name") || "";
  renderRanking();
  showOverlay();
  setTimeout(() => playerName.focus(), 0);
}

function updateStateButton() {
  if (state.mode === "playing") {
    stateButton.textContent = "PAUSE";
    stateButton.dataset.mode = "playing";
  } else if (state.mode === "paused") {
    stateButton.textContent = "STOP";
    stateButton.dataset.mode = "paused";
  } else {
    stateButton.textContent = "PLAY";
    stateButton.dataset.mode = "stopped";
  }
}

function toggleStateButton() {
  if (state.mode === "playing") {
    pauseGame();
  } else if (state.mode === "paused") {
    stopGame();
  } else {
    resetGame();
  }
}

function showRankingPanel() {
  if (state.mode === "playing") pauseGame();
  scoreForm.classList.add("is-ranking-only");
  overlayTitle.textContent = "\uB7AD\uD0B9";
  overlayText.textContent = "\uCD5C\uACE0 \uC810\uC218";
  renderRanking();
  showOverlay();
}

function showOverlay() {
  overlay.hidden = false;
  shell.classList.add("has-overlay");
}

function hideOverlay() {
  overlay.hidden = true;
  shell.classList.remove("has-overlay");
}

function hideTitleScreen() {
  if (!titleScreen) return;
  titleScreen.classList.add("is-hidden");
}

function setCatSprite(name) {
  cat.classList.toggle(CAT_RUN_CLASS, name !== "jump");
  cat.classList.toggle(CAT_JUMP_CLASS, name === "jump");
  cat.dataset.sprite = name;
  if (name === "jump") {
    delete cat.dataset.runFrame;
  } else if (!cat.dataset.runFrame) {
    cat.dataset.runFrame = "0";
  }
}

function updateHud() {
  livesEl.textContent = LIFE_FULL.repeat(Math.max(state.lives, 0)) + LIFE_EMPTY.repeat(Math.max(3 - state.lives, 0));
  scoreEl.textContent = state.score;
  comboEl.textContent = `x${getScoreMultiplier(performance.now())}`;
  bestEl.textContent = state.best;
}

function getScoreMultiplier(now) {
  const bagMultiplier = state.doubleUntil && now < state.doubleUntil ? 2 : 1;
  return state.combo * bagMultiplier;
}

function getRanking() {
  try {
    const ranking = JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
    return Array.isArray(ranking) ? ranking : [];
  } catch {
    return [];
  }
}

function saveRanking(name, score) {
  const cleanName = name.trim().slice(0, 10) || "CAT";
  const ranking = getRanking();
  ranking.push({ name: cleanName, score, date: Date.now() });
  ranking.sort((a, b) => b.score - a.score || a.date - b.date);
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 5)));
  localStorage.setItem("bungeoppang-cat-last-name", cleanName);
  renderRanking();
}

function renderRanking() {
  const ranking = getRanking();
  rankingList.innerHTML = "";

  if (ranking.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "---";
    rankingList.appendChild(empty);
    return;
  }

  ranking.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.name} ${entry.score}`;
    rankingList.appendChild(item);
  });
}

scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveRanking(playerName.value, state.score);
  hideOverlay();
  scoreForm.classList.remove("is-ranking-only");
});

stateButton.addEventListener("click", toggleStateButton);
if (soundButton) soundButton.addEventListener("click", toggleSound);
if (titleStartButton) titleStartButton.addEventListener("click", resetGame);
if (titleSoundButton) titleSoundButton.addEventListener("click", toggleSound);
bestStat.addEventListener("click", showRankingPanel);
game.addEventListener("pointerdown", handleGamePress);
game.addEventListener("click", handleGamePress);

function handleGamePress(event) {
  if (!overlay.hidden && event.target.closest(".panel")) return;
  const now = performance.now();
  if (now - state.lastJumpInputAt < 90) return;
  state.lastJumpInputAt = now;
  jump();
}

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;

  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    const now = performance.now();
    if (now - state.lastJumpInputAt < 90) return;
    state.lastJumpInputAt = now;
    jump();
  }
});
