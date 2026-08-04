import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const root = process.cwd();
const out = path.join(root, "nyangbung-canva-deck.pptx");
const sitCat = path.join(root, "public", "cat-sit.png");
const jumpCat = path.join(root, "public", "cat-jump.png");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Codex";
pptx.subject = "냥붕비 개발 과정";
pptx.title = "냥붕비 개발 과정";
pptx.company = "OpenAI";
pptx.lang = "ko-KR";
pptx.theme = {
  headFontFace: "Malgun Gothic",
  bodyFontFace: "Malgun Gothic",
  lang: "ko-KR",
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

const C = {
  brown: "4A2819",
  dark: "3A2014",
  cream: "FFF7DC",
  gold: "FFD04D",
  orange: "FF8A00",
  red: "C75A3E",
  sky: "A9D0C9",
  wood: "8B4F2E",
  white: "FFFFFF",
};

function addBg(slide) {
  slide.background = { color: C.sky };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.9, fill: { color: C.red }, line: { color: C.red } });
  for (let i = 0; i < 8; i += 1) {
    slide.addShape(pptx.ShapeType.rect, {
      x: i * 1.67,
      y: 0.9,
      w: 0.84,
      h: 0.48,
      fill: { color: i % 2 === 0 ? "FFE7AD" : C.red },
      line: { color: i % 2 === 0 ? "FFE7AD" : C.red },
    });
  }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.35, w: 13.333, h: 2.15, fill: { color: C.wood }, line: { color: C.wood } });
}

function title(slide, text, x = 0.7, y = 0.65, w = 6.2) {
  slide.addText(text, {
    x, y, w, h: 1.45,
    fontFace: "Malgun Gothic",
    fontSize: 42,
    bold: true,
    color: C.cream,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    shadow: { type: "outer", color: C.brown, opacity: 0.55, blur: 1, angle: 45, distance: 3 },
  });
}

function panel(slide, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.16,
    fill: { color: C.cream },
    line: { color: C.brown, width: 2.5 },
    shadow: { type: "outer", color: "000000", opacity: 0.18, blur: 1, angle: 45, distance: 2 },
  });
}

function bullets(slide, items, x, y, w, size = 20) {
  slide.addText(items.map((text) => ({ text, options: { bullet: { type: "bullet" } } })), {
    x, y, w, h: 3.6,
    fontFace: "Malgun Gothic",
    fontSize: size,
    bold: true,
    color: C.dark,
    breakLine: true,
    fit: "shrink",
    paraSpaceAfterPt: 12,
    margin: 0.08,
  });
}

function footer(slide, n) {
  slide.addText(`냥붕비 개발 과정  |  ${n}/8`, {
    x: 0.65, y: 7.05, w: 12, h: 0.22,
    fontSize: 9,
    bold: true,
    color: "FFE8AE",
    margin: 0,
  });
}

function addCat(slide, kind, x, y, w, rotate = 0) {
  slide.addImage({ path: kind === "jump" ? jumpCat : sitCat, x, y, w, rotate });
}

let s = pptx.addSlide();
addBg(s);
s.addText("Mobile Game MVP", { x: 0.8, y: 1.25, w: 2.5, h: 0.35, fontSize: 16, bold: true, color: C.dark, fill: { color: C.gold }, line: { color: C.brown, width: 1.5 }, margin: 0.05, align: "center" });
s.addText("냥붕비\n개발 과정", { x: 0.8, y: 1.7, w: 5.1, h: 2.0, fontSize: 50, bold: true, color: C.cream, margin: 0, breakLine: false, fit: "shrink", shadow: { type: "outer", color: C.brown, opacity: 0.8, blur: 1, angle: 45, distance: 3 } });
s.addText("붕어빵 주문 게임이 고양이 점프 캐치 게임으로 발전한 흐름", { x: 0.85, y: 4.05, w: 5.8, h: 0.7, fontSize: 21, bold: true, color: C.cream, fit: "shrink", margin: 0 });
addCat(s, "jump", 6.15, 1.05, 5.6, -8);
footer(s, 1);

s = pptx.addSlide();
addBg(s); title(s, "초기 PRD");
panel(s, 0.75, 1.75, 6.0, 3.7);
bullets(s, ["한 손가락으로 가능한 모바일 타이밍 게임", "주문, 붕어빵 선택, 굽기 판정", "최고 점수 중심의 반복 플레이"], 1.05, 2.15, 5.3);
panel(s, 7.45, 1.25, 4.1, 5.45);
s.addText("점수 0", { x: 7.85, y: 1.65, w: 1.5, h: 0.45, fontSize: 18, bold: true, color: C.dark });
s.addText("주문: 팥 2개", { x: 8.0, y: 2.45, w: 3.0, h: 0.55, fontSize: 22, bold: true, color: C.dark, align: "center" });
addCat(s, "sit", 8.25, 3.2, 2.65);
footer(s, 2);

s = pptx.addSlide();
addBg(s); title(s, "게임 구조 변화");
panel(s, 0.75, 1.55, 7.0, 4.2);
["게이지 타이밍 방식으로 MVP 구현", "회전식 붕어빵 기계 아이디어 반영", "고양이가 붕어빵을 잡는 액션 게임으로 전환"].forEach((t, i) => {
  s.addShape(pptx.ShapeType.ellipse, { x: 1.1, y: 2 + i * 1.05, w: 0.55, h: 0.55, fill: { color: C.orange }, line: { color: C.brown, width: 1.5 } });
  s.addText(String(i + 1), { x: 1.1, y: 2.1 + i * 1.05, w: 0.55, h: 0.2, fontSize: 16, bold: true, color: C.dark, align: "center", margin: 0 });
  s.addText(t, { x: 1.9, y: 1.94 + i * 1.05, w: 5.3, h: 0.5, fontSize: 22, bold: true, color: C.dark, margin: 0 });
});
addCat(s, "sit", 8.35, 1.78, 3.4);
footer(s, 3);

s = pptx.addSlide();
addBg(s); title(s, "현재 플레이 루프");
panel(s, 0.75, 1.6, 5.7, 4.2);
bullets(s, ["말풍선에 주문 순서 표시", "붕어빵이 오른쪽에서 왼쪽으로 이동", "화면 터치 시 고양이가 점프", "순서가 맞으면 점수와 콤보 증가"], 1.05, 2.0, 5.0, 19);
addCat(s, "jump", 6.55, 1.35, 5.4, -9);
footer(s, 4);

s = pptx.addSlide();
addBg(s); title(s, "CSS 캐릭터에서 PNG 캐릭터로", 0.7, 0.65, 8);
panel(s, 0.75, 1.65, 6.1, 4.1);
bullets(s, ["Before: CSS 도형으로 빠르게 테스트", "After: 투명 PNG 스프라이트로 품질 개선", "Idle: 앉아있는 고양이", "Jump: 별도 액션 이미지"], 1.05, 2.05, 5.45, 19);
addCat(s, "sit", 7.5, 1.55, 2.35);
addCat(s, "jump", 9.1, 3.05, 3.3, -8);
footer(s, 5);

s = pptx.addSlide();
addBg(s); title(s, "구현 포인트");
panel(s, 0.75, 1.55, 5.8, 4.2);
bullets(s, ["Zustand로 게임 상태 관리", "requestAnimationFrame 기반 이동 처리", "주문 배열과 현재 인덱스로 순서 판정", "점프 상태에 따라 고양이 이미지 교체"], 1.05, 1.95, 5.05, 18);
panel(s, 7.1, 1.55, 4.5, 4.2);
s.addText("이미지 파일", { x: 7.5, y: 1.95, w: 3.4, h: 0.45, fontSize: 26, bold: true, color: C.dark, margin: 0 });
s.addText("cat-sit.png\n대기 상태\n\ncat-jump.png\n점프 상태", { x: 7.55, y: 2.65, w: 3.2, h: 2.2, fontSize: 20, bold: true, color: C.dark, margin: 0.05, breakLine: false });
footer(s, 6);

s = pptx.addSlide();
addBg(s); title(s, "다음 작업");
panel(s, 0.75, 1.55, 6.0, 4.15);
bullets(s, ["붕어빵 이미지도 PNG 스프라이트화", "주문 UI와 하단 HUD 디자인 정리", "점프 타이밍과 난이도 밸런싱", "사운드와 성공/실패 연출 추가"], 1.05, 1.95, 5.25, 19);
addCat(s, "jump", 6.8, 1.45, 5.2, -8);
footer(s, 7);

s = pptx.addSlide();
addBg(s);
s.addText("Current Direction", { x: 0.8, y: 1.25, w: 2.7, h: 0.35, fontSize: 16, bold: true, color: C.dark, fill: { color: C.gold }, line: { color: C.brown, width: 1.5 }, margin: 0.05, align: "center" });
s.addText("기능 먼저,\n그림은 점진 개선", { x: 0.8, y: 1.75, w: 5.8, h: 1.95, fontSize: 44, bold: true, color: C.cream, margin: 0, fit: "shrink", shadow: { type: "outer", color: C.brown, opacity: 0.8, blur: 1, angle: 45, distance: 3 } });
s.addText("플레이 루프를 먼저 단단히 만들고, 캐릭터와 붕어빵 에셋을 차례로 교체합니다.", { x: 0.85, y: 4.15, w: 5.7, h: 0.8, fontSize: 20, bold: true, color: C.cream, fit: "shrink", margin: 0 });
addCat(s, "sit", 7.6, 1.35, 3.6);
footer(s, 8);

await pptx.writeFile({ fileName: out });
console.log(out);
