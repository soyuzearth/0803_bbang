const game = document.getElementById("game");
const shell = document.querySelector(".shell");
const cat = document.getElementById("cat");
const overlay = document.getElementById("overlay");
const scoreForm = document.getElementById("scoreForm");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const playerName = document.getElementById("playerName");
const rankingList = document.getElementById("rankingList");
const stateButton = document.getElementById("stateButton");
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

const state = {
  mode: "stopped",
  score: 0,
  combo: 1,
  lives: 3,
  best: Number(localStorage.getItem("bungeoppang-cat-best") || 0),
  catY: 0,
  catVelocity: 0,
  speed: 250,
  spawnTimer: 0,
  mapX: 0,
  laneX: 0,
  doubleUntil: 0,
  invincibleUntil: 0,
  hitVisualUntil: 0,
  lastTime: 0,
  runFrame: 0,
  items: [],
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
  state.mode = "playing";
  state.score = 0;
  state.combo = 1;
  state.lives = 3;
  state.catY = 0;
  state.catVelocity = 0;
  state.speed = 250;
  state.spawnTimer = 0.72;
  state.mapX = 0;
  state.laneX = 0;
  state.doubleUntil = 0;
  state.invincibleUntil = 0;
  state.hitVisualUntil = 0;
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

  if (state.catY < 2) {
    state.catVelocity = 650;
    setCatSprite("jump");
  }
}

function resumeGame() {
  if (state.mode !== "paused") return;
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
  cat.classList.remove("is-running");
  updateStateButton();
}

function stopGame() {
  state.mode = "stopped";
  state.score = 0;
  state.combo = 1;
  state.lives = 3;
  state.speed = 250;
  state.spawnTimer = 0;
  state.mapX = 0;
  state.laneX = 0;
  state.items.forEach((item) => item.el.remove());
  state.items = [];
  state.catY = 0;
  state.catVelocity = 0;
  state.invincibleUntil = 0;
  state.hitVisualUntil = 0;
  state.doubleUntil = 0;
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
  state.speed += dt * 5.5;
  state.mapX = (state.mapX - state.speed * dt * 0.22) % 1672;
  state.laneX = (state.laneX - state.speed * dt * 0.86) % 260;
  game.style.setProperty("--map-x", `${state.mapX}px`);
  game.style.setProperty("--lane-x", `${state.laneX}px`);
  state.spawnTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnItem();
    state.spawnTimer = Math.max(0.82, 1.48 - state.speed / 520 + Math.random() * 0.55);
  }

  state.catVelocity -= 1680 * dt;
  state.catY = Math.max(0, state.catY + state.catVelocity * dt);
  if (state.catY === 0 && state.catVelocity < 0) {
    state.catVelocity = 0;
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
    showFloat(`${LABEL_CUSTARD} x${getScoreMultiplier(now)}!`, "combo");
    showBurst(`${LABEL_CUSTARD} x${getScoreMultiplier(now)}!`, "combo");
    pulseCombo();
    pulseGame("good");
  } else {
    showFloat(`${LABEL_REDBEAN} +${points}`, "score");
    pulseGame("score");
  }

  updateHud();
}

function loseLife(now, type = "bad") {
  if (state.invincibleUntil && now < state.invincibleUntil) return;

  state.lives -= 1;
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
bestStat.addEventListener("click", showRankingPanel);
game.addEventListener("pointerdown", (event) => {
  if (!overlay.hidden && event.target.closest(".panel")) return;
  jump();
});
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;

  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
});
