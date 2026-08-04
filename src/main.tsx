import React from "react";
import ReactDOM from "react-dom/client";
import { Pause, RotateCcw } from "lucide-react";
import { useGameStore } from "./store/gameStore";
import type { Bread } from "./systems/data";
import "./styles.css";

function Bungeoppang({ bread }: { bread: Bread }) {
  return (
    <div className={`bread ${bread.id}`} style={{ "--fill": bread.fillColor } as React.CSSProperties}>
      <span className="bread-eye" />
      <span className="bread-gill one" />
      <span className="bread-gill two" />
      <span className="bread-gill three" />
      <span className="bread-mouth" />
      <span className="bread-fill" />
    </div>
  );
}

function Cat({ isJumping, isHappy }: { isJumping: boolean; isHappy: boolean }) {
  const src = isJumping ? "/cat-jump.png" : "/cat-sit.png";

  return (
    <img
      className={`cat-image ${isJumping ? "jump" : "sit"} ${isHappy ? "happy" : ""}`}
      src={src}
      alt="고양이"
      draggable={false}
    />
  );
}

function App() {
  const {
    activeBread,
    combo,
    eatenCount,
    gameState,
    highScore,
    isJumping,
    lastResult,
    lives,
    order,
    orderIndex,
    score,
    jump,
    restart,
  } = useGameStore();

  const expectedBread = order[orderIndex];
  const remainingOrders = Math.max(0, order.length - orderIndex);

  const handlePlayAction = (event: React.PointerEvent<HTMLElement>) => {
    if (event.target instanceof HTMLButtonElement) return;
    jump();
  };

  return (
    <main className="app" onPointerDown={handlePlayAction}>
      <section className={`game-shell ${lastResult === "bad" ? "shake" : ""}`} aria-label="냥붕비 게임">
        <header className="hud">
          <div className="score-card">
            <span>점수</span>
            <strong>{score}</strong>
          </div>
          <div className="combo-card">
            <span>COMBO</span>
            <strong>{combo}</strong>
            {combo >= 10 ? <em>x2</em> : null}
          </div>
          <button className="pause-button" type="button" aria-label="일시정지">
            <Pause size={30} fill="currentColor" />
          </button>
        </header>

        <section className="order-panel" aria-label="주문">
          <div className="speech">
            <span>주문</span>
            <div className="order-list">
              {order.map((bread, index) => (
                <React.Fragment key={`${bread.id}-${index}`}>
                  <div className={`order-chip ${index < orderIndex ? "done" : ""} ${index === orderIndex ? "next" : ""}`}>
                    <Bungeoppang bread={bread} />
                    {bread.shortName}
                  </div>
                  {index < order.length - 1 ? <b className="order-arrow">&gt;</b> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="playfield" aria-label="플레이 영역">
          <div className="shop-backdrop">
            <div className="awning" />
            <div className="window left" />
            <div className="window right" />
            <div className="poster">오늘의<br />붕어빵</div>
            <span />
            <span />
            <span />
          </div>

          <Cat isJumping={isJumping} isHappy={lastResult === "good"} />

          <div className="bread-lane" style={{ "--x": `${activeBread.x}%` } as React.CSSProperties}>
            <Bungeoppang bread={activeBread.bread} />
            <span>{activeBread.bread.shortName}</span>
          </div>
          <div className="bread-ghost ghost-one">
            <Bungeoppang bread={order[(orderIndex + 1) % order.length]} />
          </div>
          <div className="bread-ghost ghost-two">
            <Bungeoppang bread={order[(orderIndex + 2) % order.length]} />
          </div>
          <div className="speed-lines" />

          {lastResult === "good" ? <div className="result-pop good">좋아 +{Math.max(1, combo)}</div> : null}
          {lastResult === "bad" ? <div className="result-pop bad">순서가 달라!</div> : null}
          {gameState !== "playing" ? (
            <div className="start-panel">
              <h1>냥붕비</h1>
              <p>{gameState === "ready" ? "주문 순서대로 날아오는 붕어빵을 잡아요" : `${eatenCount}개를 잡았어요`}</p>
              <button className="primary" onClick={gameState === "ready" ? jump : restart} type="button">
                {gameState === "gameover" ? <RotateCcw size={20} /> : null}
                {gameState === "ready" ? "시작" : "다시 하기"}
              </button>
            </div>
          ) : null}
        </section>

        <footer className="status-row">
          <div className="bottom-card hearts-card">
            <span>목숨</span>
            <div className="hearts" aria-label={`남은 목숨 ${lives}`}>
              {Array.from({ length: 3 }).map((_, index) => (
                <span className={index < lives ? "alive" : ""} key={index}>
                  heart
                </span>
              ))}
            </div>
          </div>
          <div className="progress-track">
            <div style={{ width: `${Math.min(100, (score % 20) * 5)}%` }} />
            <span />
          </div>
          <div className="bottom-card target">
            <span>남은 주문</span>
            <strong>{remainingOrders}/{order.length}</strong>
            <small>{expectedBread.shortName}</small>
          </div>
        </footer>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
