import { create } from "zustand";
import { Bread, BREADS, getAvailableBreads, getLevel, getOrderLength } from "../systems/data";

type GameState = "ready" | "playing" | "gameover";

type FlyingBread = {
  bread: Bread;
  id: number;
  x: number;
};

type GameStore = {
  activeBread: FlyingBread;
  combo: number;
  eatenCount: number;
  gameState: GameState;
  highScore: number;
  isJumping: boolean;
  lastResult: "good" | "bad" | null;
  level: number;
  lives: number;
  order: Bread[];
  orderIndex: number;
  score: number;
  speed: number;
  start: () => void;
  jump: () => void;
  tick: (deltaMs: number) => void;
  restart: () => void;
};

const CAT_X = 18;
const HIT_MIN = 9;
const HIT_MAX = 28;
const STORAGE_KEY = "nyangbung-high-score";

let rafId = 0;
let lastFrame = 0;
let nextBreadId = 1;
let jumpTimer = 0;
let resultTimer = 0;

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeOrder(level: number) {
  const breads = getAvailableBreads(level);
  return Array.from({ length: getOrderLength(level) }, () => randomItem(breads));
}

function makeFlyingBread(level: number): FlyingBread {
  return {
    bread: randomItem(getAvailableBreads(level)),
    id: nextBreadId++,
    x: 104,
  };
}

function getStoredHighScore() {
  const value = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function saveHighScore(score: number) {
  localStorage.setItem(STORAGE_KEY, String(score));
}

function startLoop(get: () => GameStore) {
  cancelAnimationFrame(rafId);
  lastFrame = performance.now();

  const loop = (time: number) => {
    const deltaMs = Math.min(40, time - lastFrame);
    lastFrame = time;
    get().tick(deltaMs);

    if (get().gameState === "playing") {
      rafId = requestAnimationFrame(loop);
    }
  };

  rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  cancelAnimationFrame(rafId);
  window.clearTimeout(jumpTimer);
  window.clearTimeout(resultTimer);
}

const initialLevel = 1;

export const useGameStore = create<GameStore>((set, get) => ({
  activeBread: makeFlyingBread(initialLevel),
  combo: 0,
  eatenCount: 0,
  gameState: "ready",
  highScore: getStoredHighScore(),
  isJumping: false,
  lastResult: null,
  level: initialLevel,
  lives: 3,
  order: makeOrder(initialLevel),
  orderIndex: 0,
  score: 0,
  speed: 18,
  start: () => {
    const state = get();
    if (state.gameState === "playing") return;

    stopLoop();
    set({
      activeBread: makeFlyingBread(initialLevel),
      combo: 0,
      eatenCount: 0,
      gameState: "playing",
      isJumping: false,
      lastResult: null,
      level: initialLevel,
      lives: 3,
      order: makeOrder(initialLevel),
      orderIndex: 0,
      score: 0,
      speed: 18,
    });
    startLoop(get);
  },
  jump: () => {
    const state = get();

    if (state.gameState === "ready") {
      get().start();
      return;
    }

    if (state.gameState === "gameover") {
      get().restart();
      return;
    }

    set({ isJumping: true });
    window.clearTimeout(jumpTimer);
    jumpTimer = window.setTimeout(() => set({ isJumping: false }), 360);

    if (state.activeBread.x < HIT_MIN || state.activeBread.x > HIT_MAX) return;

    const expected = state.order[state.orderIndex];
    const isCorrect = state.activeBread.bread.id === expected.id;

    if (!isCorrect) {
      const lives = state.lives - 1;
      const highScore = Math.max(state.highScore, state.score);
      saveHighScore(highScore);

      set({
        activeBread: makeFlyingBread(state.level),
        combo: 0,
        gameState: lives <= 0 ? "gameover" : "playing",
        highScore,
        lastResult: "bad",
        lives,
        order: lives <= 0 ? state.order : makeOrder(state.level),
        orderIndex: 0,
      });

      if (lives <= 0) stopLoop();
      window.clearTimeout(resultTimer);
      resultTimer = window.setTimeout(() => set({ lastResult: null }), 480);
      return;
    }

    const nextOrderIndex = state.orderIndex + 1;
    const combo = state.combo + 1;
    const score = state.score + Math.max(1, combo);
    const level = getLevel(score);
    const orderDone = nextOrderIndex >= state.order.length;
    const highScore = Math.max(state.highScore, score);
    saveHighScore(highScore);

    set({
      activeBread: makeFlyingBread(level),
      combo,
      eatenCount: state.eatenCount + 1,
      highScore,
      lastResult: "good",
      level,
      order: orderDone ? makeOrder(level) : state.order,
      orderIndex: orderDone ? 0 : nextOrderIndex,
      score,
      speed: 18 + level * 4 + Math.min(16, Math.floor(score / 5)),
    });

    window.clearTimeout(resultTimer);
    resultTimer = window.setTimeout(() => set({ lastResult: null }), 420);
  },
  tick: (deltaMs) => {
    const state = get();
    const x = state.activeBread.x - (state.speed * deltaMs) / 1000;

    if (x < -14) {
      set({ activeBread: makeFlyingBread(state.level) });
      return;
    }

    set({ activeBread: { ...state.activeBread, x } });
  },
  restart: () => {
    get().start();
  },
}));

export { BREADS };
