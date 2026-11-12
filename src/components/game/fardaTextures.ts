/**
 * Texturas das fardas, desenhadas em canvas e aplicadas como um "mapa UV"
 * que envolve o tronco inteiro do boneco (frente, laterais e costas).
 *
 * Layout do canvas (W = 2048, H = 512), igual ao UV de um CylinderGeometry
 * com thetaStart = -PI:
 *   x = 0        → centro das costas
 *   x = W/4      → lateral direita do aluno
 *   x = W/2      → centro da frente
 *   x = 3W/4     → lateral esquerda do aluno
 *   x = W        → centro das costas (emenda)
 * y = 0 é a altura dos ombros e y = H é a barra da camisa.
 *
 * Frente e costas são pintadas em canvases de 1024 × 512 e coladas no lugar.
 * Na frente, a direita de quem olha (x > 512) é o lado ESQUERDO do aluno.
 */
import { CanvasTexture, SRGBColorSpace } from "three";

export type FardaId = "eeep" | "ds";

const W = 2048;
/** ~1110 px por metro nos dois eixos (o molde vai de y = 1,25 m até 0,45 m). */
const H = 896;
/** Deslocamento para os elementos da barra (desenhados para uma altura de 512). */
const HEM = H - 512;
const HALF = 1024;

type Ctx = CanvasRenderingContext2D;

function canvas(width: number, height: number) {
  if (typeof document === "undefined") return null;
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  const ctx = el.getContext("2d");
  return ctx ? { el, ctx } : null;
}

/* ------------------------------------------------------------------ */
/* Farda padrão EEEP (Governo do Ceará)                               */
/* ------------------------------------------------------------------ */

const GREEN_DARK = "#14532d";
const GREEN = "#15803d";
const GREEN_LIGHT = "#4ade80";
const YELLOW = "#facc15";
const ORANGE = "#f97316";

/** Brasão do Ceará estilizado (escudo verde, losango amarelo e círculo). */
function cearaCrest(ctx: Ctx, cx: number, cy: number, size: number) {
  const w = size;
  const h = size * 1.15;
  ctx.save();
  ctx.translate(cx, cy);
  // escudo
  ctx.fillStyle = GREEN;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2, h * 0.1);
  ctx.quadraticCurveTo(w / 2, h * 0.42, 0, h / 2);
  ctx.quadraticCurveTo(-w / 2, h * 0.42, -w / 2, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = size * 0.06;
  ctx.stroke();
  // losango
  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.36);
  ctx.lineTo(w * 0.36, -h * 0.02);
  ctx.lineTo(0, h * 0.32);
  ctx.lineTo(-w * 0.36, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  // círculo central
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -h * 0.02, size * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1d4ed8";
  ctx.beginPath();
  ctx.arc(0, -h * 0.02, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  // estrela
  ctx.fillStyle = "#ffffff";
  star(ctx, 0, -h * 0.02, size * 0.07, size * 0.03);
  ctx.restore();
}

function star(ctx: Ctx, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

/** Faixa curvada que "sobe" da barra (y0 na esquerda até y1 na direita). */
function band(
  ctx: Ctx,
  x0: number,
  x1: number,
  yLeft: number,
  yRight: number,
  thickness: number,
  color: string,
  bulge = 60,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0, yLeft);
  ctx.bezierCurveTo(
    x0 + (x1 - x0) * 0.35,
    yLeft + bulge,
    x0 + (x1 - x0) * 0.65,
    yRight + bulge,
    x1,
    yRight,
  );
  ctx.lineTo(x1, yRight + thickness);
  ctx.bezierCurveTo(
    x0 + (x1 - x0) * 0.65,
    yRight + bulge + thickness,
    x0 + (x1 - x0) * 0.35,
    yLeft + bulge + thickness,
    x0,
    yLeft + thickness,
  );
  ctx.closePath();
  ctx.fill();
}

function eeepFront(ctx: Ctx) {
  // logo no peito esquerdo do aluno (direita de quem olha)
  ctx.save();
  ctx.translate(0, 120);
  const cx = 640;
  cearaCrest(ctx, cx - 58, 110, 80);
  ctx.textAlign = "left";
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "bold 40px sans-serif";
  ctx.fillText("CEARÁ", cx - 6, 98);
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("GOVERNO DO ESTADO", cx - 6, 122);
  ctx.fillStyle = GREEN;
  ctx.fillRect(cx - 6, 131, 182, 3);
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("SECRETARIA DA EDUCAÇÃO", cx - 6, 152);
  ctx.restore();
  ctx.save();
  ctx.translate(0, HEM);

  // grafismo inferior: faixas curvadas verde-escuro, verde-claro e amarelo/laranja,
  // subindo pelo lado direito do aluno (esquerda de quem olha)
  const layers: [left: number, right: number, color: string][] = [
    [212, 400, ORANGE],
    [228, 408, YELLOW],
    [258, 418, "#f8fafc"],
    [272, 424, GREEN_LIGHT],
    [318, 446, GREEN],
    [356, 466, GREEN_DARK],
  ];
  for (const [left, right, color] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, left);
    ctx.bezierCurveTo(HALF * 0.3, left + 30, HALF * 0.55, right + 40, HALF, right);
    ctx.lineTo(HALF, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function eeepBack(ctx: Ctx) {
  // brasão centralizado na altura dos ombros
  cearaCrest(ctx, HALF / 2, 175, 110);
  ctx.textAlign = "center";
  ctx.fillStyle = GREEN_DARK;
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("GOVERNO DO ESTADO DO CEARÁ", HALF / 2, 290);
  ctx.save();
  ctx.translate(0, HEM);

  // grafismo ondulado verde cobrindo a barra traseira
  for (const [y, color, amp] of [
    [390, GREEN_LIGHT, 18],
    [420, GREEN, 22],
    [452, GREEN_DARK, 18],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= HALF; x += 16) {
      ctx.lineTo(x, y + Math.sin((x / HALF) * Math.PI * 4) * amp);
    }
    ctx.lineTo(HALF, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Farda técnica de Desenvolvimento de Sistemas                       */
/* ------------------------------------------------------------------ */

const PURPLE = "#6d28d9";
const WHITE = "#ffffff";

/** Ícone do curso: rede/circuito com cadeado e engrenagem. */
function dsIcon(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = s * 0.05;
  ctx.lineCap = "round";
  // círculo externo
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  // nós da rede
  const nodes: [number, number][] = [
    [-0.32, -0.22],
    [0.32, -0.22],
    [-0.32, 0.26],
    [0.32, 0.26],
  ];
  for (const [x, y] of nodes) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x * s, y * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x * s, y * s, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }
  // cadeado no centro
  ctx.fillStyle = PURPLE;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.fillRect(-s * 0.1, -s * 0.02, s * 0.2, s * 0.15);
  ctx.beginPath();
  ctx.arc(0, -s * 0.02, s * 0.065, Math.PI, 0);
  ctx.stroke();
  // engrenagem no canto
  const gx = s * 0.42;
  const gy = -s * 0.42;
  ctx.fillStyle = WHITE;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.fillRect(
      gx + Math.cos(a) * s * 0.12 - s * 0.03,
      gy + Math.sin(a) * s * 0.12 - s * 0.03,
      s * 0.06,
      s * 0.06,
    );
  }
  ctx.beginPath();
  ctx.arc(gx, gy, s * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PURPLE;
  ctx.beginPath();
  ctx.arc(gx, gy, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Xícara de café em linhas brancas (símbolo clássico do Java), com </>. */
function coffeeCup(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = s * 0.045;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // copo
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.1);
  ctx.lineTo(-s * 0.32, s * 0.38);
  ctx.quadraticCurveTo(0, s * 0.5, s * 0.32, s * 0.38);
  ctx.lineTo(s * 0.4, -s * 0.1);
  ctx.closePath();
  ctx.stroke();
  // alça
  ctx.beginPath();
  ctx.ellipse(s * 0.47, s * 0.1, s * 0.13, s * 0.15, 0, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // pires
  ctx.beginPath();
  ctx.ellipse(0, s * 0.5, s * 0.58, s * 0.09, 0, 0, Math.PI);
  ctx.stroke();
  // vapor
  for (const x of [-0.16, 0.04, 0.24]) {
    ctx.beginPath();
    ctx.moveTo(x * s, -s * 0.18);
    ctx.bezierCurveTo((x - 0.12) * s, -s * 0.32, (x + 0.12) * s, -s * 0.42, x * s, -s * 0.58);
    ctx.stroke();
  }
  // </>
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.round(s * 0.22)}px monospace`;
  ctx.fillText("</>", 0, s * 0.22);
  ctx.restore();
}

function dsFront(ctx: Ctx) {
  // logo do curso no peito esquerdo do aluno (direita de quem olha)
  const cx = 630;
  dsIcon(ctx, cx - 50, 228, 96);
  ctx.textAlign = "left";
  ctx.fillStyle = WHITE;
  ctx.font = "bold 19px sans-serif";
  ctx.fillText("Téc.", cx + 6, 204);
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Desenvolvimento", cx + 6, 231);
  ctx.fillText("de Sistemas", cx + 6, 258);

  // xícara de café / código no lado direito do aluno, parte de baixo
  coffeeCup(ctx, 380, HEM + 330, 170);
}

/** Trilhas de placa de circuito (linhas com curvas a 45° e pads redondos). */
function circuitTraces(ctx: Ctx, top: number) {
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const lanes = 14;
  for (let i = 0; i < lanes; i++) {
    const x = 40 + (i * (HALF - 80)) / (lanes - 1);
    const rise = 30 + ((i * 53) % 90);
    const dir = i % 2 === 0 ? 1 : -1;
    const y0 = H;
    const y1 = top + rise + 40;
    const y2 = top + rise;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.lineTo(x + dir * 34, y2);
    ctx.lineTo(x + dir * 34, y2 - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + dir * 34, y2 - 26, 8, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(x, y1 + 30, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // barramento horizontal
  ctx.beginPath();
  ctx.moveTo(0, H - 30);
  ctx.lineTo(HALF, H - 30);
  ctx.stroke();
}

function dsBack(ctx: Ctx) {
  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("Escola Estadual de Educação Profissional", HALF / 2, 170);
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Dr. Salomão Alves de Moura", HALF / 2, 220);
  circuitTraces(ctx, HEM + 230);
}

/* ------------------------------------------------------------------ */

const PAINTERS: Record<FardaId, { base: string; front: (c: Ctx) => void; back: (c: Ctx) => void }> =
  {
    eeep: { base: "#f8fafc", front: eeepFront, back: eeepBack },
    ds: { base: PURPLE, front: dsFront, back: dsBack },
  };

export const FARDA_BASE: Record<FardaId, string> = { eeep: "#f8fafc", ds: PURPLE };

/** Gera a textura completa (frente + costas) da farda. */
export function makeFardaTexture(id: FardaId) {
  const painter = PAINTERS[id];
  const full = canvas(W, H);
  const front = canvas(HALF, H);
  const back = canvas(HALF, H);
  if (!full || !front || !back) return null;

  for (const part of [front, back]) {
    part.ctx.fillStyle = painter.base;
    part.ctx.fillRect(0, 0, HALF, H);
  }
  painter.front(front.ctx);
  painter.back(back.ctx);

  full.ctx.fillStyle = painter.base;
  full.ctx.fillRect(0, 0, W, H);
  // frente no meio
  full.ctx.drawImage(front.el, W / 4, 0);
  // costas divididas na emenda: metade esquerda (de quem olha por trás) vai para x = 3W/4
  full.ctx.drawImage(back.el, 0, 0, HALF / 2, H, (3 * W) / 4, 0, HALF / 2, H);
  full.ctx.drawImage(back.el, HALF / 2, 0, HALF / 2, H, 0, 0, HALF / 2, H);

  const texture = new CanvasTexture(full.el);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
