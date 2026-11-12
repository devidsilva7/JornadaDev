import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  CanvasTexture,
  DoubleSide,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type PerspectiveCamera,
} from "three";
import { DevAvatar, PUNCH_DURATION, type AvatarAction } from "../DevAvatar";
import { NpcFigure } from "./NpcFigure";
import { npcs } from "@/game/people";
import type { AvatarLook } from "@/game/avatar";
import {
  collide,
  corridors,
  courtyard,
  FACADE_COLOR,
  FACADE_Z,
  muretas,
  patioSam,
  MURETA_HEIGHT,
  pillars,
  doorAngle,
  doorFront,
  isInside,
  roomById,
  rooms,
  spawn,
  toWorld,
  walls,
  WALL_H,
  type CollectItem,
  type Mission,
  type Room,
} from "@/game/school";

export type Vec2 = { x: number; z: number };
/** Ações do jogador: run é contínuo; jump/punch são pedidos consumidos no próximo quadro. */
export type Controls = { run: boolean; jump: boolean; punch: boolean };

/* ------------------------------------------------------------------ */
/* Primitivas                                                          */
/* ------------------------------------------------------------------ */

type V3 = [number, number, number];

function B({
  p,
  s,
  c,
  e,
  ei = 0.8,
  r,
}: {
  p: V3;
  s: V3;
  c: string;
  e?: string;
  ei?: number;
  r?: V3;
}) {
  return (
    <mesh position={p} rotation={r ?? [0, 0, 0]}>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={0.75}
        emissive={e ?? "#000000"}
        emissiveIntensity={e ? ei : 0}
      />
    </mesh>
  );
}

/** bg "transparent" = letras soltas em relevo (letreiro metálico da fachada). */
function useTextTexture(lines: string[], bg: string, fg: string, width = 512, height = 256) {
  const key = lines.join("|");
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const relief = bg === "transparent";
    if (!relief) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const parts = key.split("|");
    const size = Math.min(
      height / (parts.length + 0.6),
      (width / Math.max(...parts.map((l) => l.length))) * 1.6,
    );
    ctx.font = `bold ${Math.floor(size)}px sans-serif`;
    parts.forEach((line, i) => {
      const y = (height / (parts.length + 1)) * (i + 1);
      if (relief) {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillText(line, width / 2 + size * 0.06, y + size * 0.08);
      }
      ctx.fillStyle = fg;
      ctx.fillText(line, width / 2, y);
    });
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [key, bg, fg, width, height]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/* ------------------------------------------------------------------ */
/* Identidade visual (guia EEEP Dr. Salomão) e texturas procedurais    */
/* ------------------------------------------------------------------ */

const RED = "#901a1e"; // vermelho vinho institucional
const RED_DARK = "#7a171a";
const TRUSS = "#b3201f"; // treliça metálica vermelha
const PAVER = "#b0b2b5"; // intertravado cinza claro
const MOSAIC = "#d8c8b0"; // mosaico cerâmico bege
const CERAMIC = "#e8e1d5"; // cerâmica industrial dos corredores/refeitório
const METAL = "#2d3138";
const FENCE_GREEN = "#1f4d2b";

type Pattern = "tiles" | "pavers" | "waves" | "mosaic" | "mural" | "fence" | "emblem";

const PATTERN_SIZE: Record<Pattern, [number, number]> = {
  tiles: [128, 128],
  pavers: [128, 128],
  waves: [256, 256],
  mosaic: [128, 128],
  mural: [1024, 448],
  fence: [64, 64],
  emblem: [256, 320],
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function drawPattern(kind: Pattern, ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seeded(kind.length * 97 + 13);
  switch (kind) {
    case "tiles": {
      // placas quadradas cinza ardósia, fosco, com rejunte escuro
      ctx.fillStyle = "#222527";
      ctx.fillRect(0, 0, w, h);
      const tones = ["#35393c", "#383c40", "#313537", "#3a3e42"];
      for (let i = 0; i < 2; i += 1)
        for (let j = 0; j < 2; j += 1) {
          ctx.fillStyle = tones[(i * 2 + j + 1) % 4]!;
          ctx.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fillRect(i * 64 + 2, j * 64 + 2, 60, 3);
        }
      return;
    }
    case "pavers": {
      // piso intertravado em ziguezague (espinha de peixe)
      ctx.fillStyle = PAVER;
      ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 400; k += 1) {
        ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
        ctx.fillRect(rand() * w, rand() * h, 3, 3);
      }
      ctx.strokeStyle = "#8f9195";
      ctx.lineWidth = 2;
      for (let y = 0; y <= h; y += 16) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + ((x / 16) % 2 ? 8 : 0));
        ctx.stroke();
        for (let x = 0; x <= w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 16);
          ctx.stroke();
        }
      }
      return;
    }
    case "waves": {
      // blocos de concreto cinza e vermelho formando desenhos ondulados
      ctx.fillStyle = PAVER;
      ctx.fillRect(0, 0, w, h);
      for (const base of [h * 0.25, h * 0.75]) {
        ctx.fillStyle = RED;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4)
          ctx.lineTo(x, base + Math.sin((x / w) * Math.PI * 2) * 22 - 14);
        for (let x = w; x >= 0; x -= 4)
          ctx.lineTo(x, base + Math.sin((x / w) * Math.PI * 2) * 22 + 14);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      return;
    }
    case "mosaic": {
      ctx.fillStyle = "#b9a98f";
      ctx.fillRect(0, 0, w, h);
      const tones = [MOSAIC, "#cdb99c", "#e2d4bf", "#c9b494"];
      for (let x = 0; x < w; x += 16)
        for (let y = 0; y < h; y += 16) {
          ctx.fillStyle = tones[Math.floor(rand() * 4)]!;
          ctx.fillRect(x + 1, y + 1, 14, 14);
        }
      return;
    }
    case "mural": {
      // parede azul com sol, vegetação e a sigla SAM em letras coloridas
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#2459a6");
      sky.addColorStop(1, "#4b9be0");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fcd34d";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 10;
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(170 + Math.cos(a) * 95, 130 + Math.sin(a) * 95);
        ctx.lineTo(170 + Math.cos(a) * 135, 130 + Math.sin(a) * 135);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(170, 130, 78, 0, Math.PI * 2);
      ctx.fill();
      for (const [color, amp, y0] of [
        ["#2f8f3a", 40, h - 110],
        ["#3fae4a", 28, h - 70],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + Math.sin(x / 70 + amp) * amp * 0.6);
        ctx.lineTo(w, h);
        ctx.fill();
      }
      for (let i = 0; i < 9; i += 1) {
        const x = 40 + i * 120 + rand() * 30;
        ctx.fillStyle = "#1f7a33";
        for (let k = 0; k < 5; k += 1) {
          ctx.beginPath();
          ctx.ellipse(x, h - 60, 12, 48, -0.9 + k * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.font = "bold 230px sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ["S", "A", "M"].forEach((letter, i) => {
        const x = 520 + i * 175;
        const y = 200;
        for (let d = 14; d > 0; d -= 2) {
          ctx.fillStyle = "#1e1b4b";
          ctx.fillText(letter, x + d, y + d);
        }
        ctx.fillStyle = ["#ef4444", "#facc15", "#22c55e"][i]!;
        ctx.fillText(letter, x, y);
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#ffffff";
        ctx.strokeText(letter, x, y);
      });
      return;
    }
    case "fence": {
      // grade de barras verticais (fundo transparente)
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = FENCE_GREEN;
      ctx.fillRect(28, 0, 8, h);
      return;
    }
    case "emblem": {
      // emblema estilizado do Governo do Estado (não é reprodução do brasão oficial)
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(w - 28, 20);
      ctx.lineTo(w - 28, 160);
      ctx.quadraticCurveTo(w / 2, 300, 28, 160);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.moveTo(44, 36);
      ctx.lineTo(w - 44, 36);
      ctx.lineTo(w - 44, 156);
      ctx.quadraticCurveTo(w / 2, 276, 44, 156);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(w / 2, 120, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CEARÁ", w / 2, 210);
      return;
    }
  }
}

const patternCanvases = new Map<Pattern, HTMLCanvasElement>();

function patternCanvas(kind: Pattern) {
  let canvas = patternCanvases.get(kind);
  if (!canvas) {
    const [w, h] = PATTERN_SIZE[kind];
    canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) drawPattern(kind, ctx, w, h);
    patternCanvases.set(kind, canvas);
  }
  return canvas;
}

/** Textura procedural repetida rx × ry vezes na superfície. */
function usePattern(kind: Pattern, rx = 1, ry = 1) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const tex = new CanvasTexture(patternCanvas(kind));
    tex.colorSpace = SRGBColorSpace;
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = 4;
    return tex;
  }, [kind, rx, ry]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/** Piso texturizado: caixa fina com a textura repetida a cada `tile` metros. */
function Floor({
  p,
  s,
  pattern,
  tile = 1,
}: {
  p: V3;
  s: [number, number];
  pattern: Pattern;
  tile?: number;
}) {
  const map = usePattern(pattern, s[0] / tile, s[1] / tile);
  return (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={s} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  );
}

/**
 * Treliça metálica plana (banzo superior, inferior e diagonais) ao longo do eixo x local.
 * Use `r` para girar (Math.PI / 2 = ao longo de z).
 */
function Truss({
  p,
  length,
  h = 0.45,
  r = 0,
  c = TRUSS,
}: {
  p: V3;
  length: number;
  h?: number;
  r?: number;
  c?: string;
}) {
  const n = Math.max(2, Math.round(length / 1.6));
  const seg = length / n;
  const diag = Math.hypot(seg, h);
  const tilt = Math.atan2(h, seg);
  return (
    <group position={p} rotation={[0, r, 0]}>
      <B p={[0, h / 2, 0]} s={[length, 0.09, 0.12]} c={c} />
      <B p={[0, -h / 2, 0]} s={[length, 0.07, 0.1]} c={c} />
      {Array.from({ length: n }, (_, i) => (
        <B
          key={i}
          p={[-length / 2 + seg * (i + 0.5), 0, 0]}
          s={[diag, 0.05, 0.06]}
          r={[0, 0, i % 2 ? tilt : -tilt]}
          c={c}
        />
      ))}
    </group>
  );
}

/** Esmaece os filhos quando ficam entre a câmera e o jogador (como as paredes). */
function FadeGroup({
  posRef,
  x0,
  x1,
  z,
  children,
}: {
  posRef: { current: Vec2 };
  x0: number;
  x1: number;
  z: number;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const opacity = useRef(1);
  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const p = posRef.current;
    const blocks = p.z < z + 0.4 && p.z > z - 9 && p.x > x0 - 2.5 && p.x < x1 + 2.5;
    const target = blocks ? 0.18 : 1;
    if (Math.abs(target - opacity.current) < 0.002) return;
    opacity.current += (target - opacity.current) * 0.15;
    group.traverse((obj) => {
      const material = (obj as Mesh).material as Material | Material[] | undefined;
      if (!material || Array.isArray(material)) return;
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }
      material.opacity = opacity.current;
      material.depthWrite = opacity.current > 0.95;
    });
  });
  return <group ref={ref}>{children}</group>;
}

function Sign({
  lines,
  p,
  size,
  bg = "#f8fafc",
  fg = "#14532d",
  glow = false,
  r,
}: {
  lines: string[];
  p: V3;
  size: [number, number];
  bg?: string;
  fg?: string;
  glow?: boolean;
  r?: V3;
}) {
  const tw = size[0] > 4 ? 2048 : 512;
  const map = useTextTexture(lines, bg, fg, tw, Math.round((tw * size[1]) / size[0]));
  if (!map) return null;
  return (
    <mesh position={p} rotation={r ?? [0, 0, 0]}>
      <planeGeometry args={size} />
      {glow ? (
        <meshBasicMaterial map={map} toneMapped={false} />
      ) : bg === "transparent" ? (
        <meshStandardMaterial
          map={map}
          roughness={0.35}
          metalness={0.3}
          transparent
          alphaTest={0.1}
        />
      ) : (
        <meshStandardMaterial map={map} roughness={0.8} />
      )}
    </mesh>
  );
}

const WOOD = "#b7794a";
const DARK = "#334155";

function Chair({ x, z, color, face = 0 }: { x: number; z: number; color: string; face?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, face, 0]}>
      <B p={[0, 0.45, 0]} s={[0.42, 0.05, 0.4]} c={color} />
      <B p={[0, 0.7, 0.19]} s={[0.42, 0.45, 0.05]} c={color} />
      <B p={[0, 0.22, 0]} s={[0.36, 0.44, 0.04]} c={DARK} />
    </group>
  );
}

function Desk({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group>
      <B p={[x, 0.74, z]} s={[0.7, 0.05, 0.5]} c={WOOD} />
      <B p={[x, 0.36, z]} s={[0.6, 0.72, 0.04]} c={DARK} />
      <Chair x={x} z={z + 0.45} color={color} />
    </group>
  );
}

function Board({ room, text }: { room: Room; text: string }) {
  return (
    <group>
      <B p={[0, 1.5, -room.d / 2 + 0.13]} s={[2.9, 1.2, 0.05]} c="#e2e8f0" />
      <Sign lines={[text]} p={[0, 1.5, -room.d / 2 + 0.17]} size={[2.7, 1.05]} fg="#1e293b" />
    </group>
  );
}

function Computer({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <B p={[0, 1.04, 0]} s={[0.5, 0.32, 0.03]} c="#0f172a" e="#3b82f6" ei={0.9} />
      <B p={[0, 0.86, 0.03]} s={[0.05, 0.16, 0.05]} c={DARK} />
      <B p={[0, 0.78, 0.18]} s={[0.4, 0.02, 0.14]} c="#1e293b" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Interiores                                                          */
/* ------------------------------------------------------------------ */

function Interior({ room }: { room: Room }) {
  const { w, d, accent } = room;
  const back = -d / 2;
  switch (room.kind) {
    case "classroom":
    case "lab-lang":
      return (
        <group>
          <Board room={room} text={room.board ?? ""} />
          <B p={[1.4, 0.4, back + 1.3]} s={[1.3, 0.8, 0.6]} c="#92400e" />
          <Chair x={1.4} z={back + 0.75} color={DARK} face={Math.PI} />
          {[-1.5, 0, 1.5].flatMap((x) =>
            [-1, 0.5, 2].map((z) => <Desk key={`${x}:${z}`} x={x} z={z} color={accent} />),
          )}
          {room.kind === "lab-lang" && (
            <group>
              {[-1.5, 0, 1.5].flatMap((x) =>
                [-1, 0.5, 2].map((z) => (
                  <mesh key={`h${x}:${z}`} position={[x, 0.8, z]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.1, 0.02, 6, 12, Math.PI]} />
                    <meshStandardMaterial color="#111827" />
                  </mesh>
                )),
              )}
              <mesh position={[-1.4, 1.05, back + 1.1]}>
                <sphereGeometry args={[0.22, 16, 12]} />
                <meshStandardMaterial color="#2563eb" />
              </mesh>
              <B p={[-1.4, 0.4, back + 1.1]} s={[0.5, 0.8, 0.5]} c={WOOD} />
            </group>
          )}
          <B p={[-w / 2 + 0.12, 1.5, -0.5]} s={[0.04, 0.8, 1.2]} c={accent} />
        </group>
      );
    case "lab-info":
      return (
        <group>
          <Board room={room} text={room.board ?? ""} />
          {[-1.3, 0.5, 2.1].flatMap((z) =>
            [-1.3, 1.3].map((x) => (
              <group key={`${x}:${z}`}>
                <B p={[x, 0.74, z]} s={[2, 0.05, 0.7]} c="#e5e7eb" />
                <B p={[x, 0.36, z]} s={[1.9, 0.72, 0.05]} c={DARK} />
                <Computer x={x - 0.5} z={z - 0.12} />
                <Computer x={x + 0.5} z={z - 0.12} />
                <Chair x={x - 0.5} z={z + 0.55} color={accent} />
                <Chair x={x + 0.5} z={z + 0.55} color={accent} />
              </group>
            )),
          )}
          <B p={[w / 2 - 0.45, 1, back + 0.45]} s={[0.6, 2, 0.6]} c="#111827" />
          <B p={[w / 2 - 0.45, 1.4, back + 0.76]} s={[0.4, 0.05, 0.02]} c="#22c55e" e="#22c55e" />
        </group>
      );
    case "lab-math":
      return (
        <group>
          <Board room={room} text="π  ·  a² + b² = c²  ·  f(x)" />
          {/* mesas de trabalho em grupo */}
          {[
            [-1.2, -1.1],
            [1.2, -1.1],
            [-1.2, 1.4],
            [1.2, 1.4],
          ].map(([x, z]) => (
            <group key={`${x}:${z}`} position={[x!, 0, z!]}>
              <mesh position={[0, 0.74, 0]}>
                <cylinderGeometry args={[0.65, 0.65, 0.05, 24]} />
                <meshStandardMaterial color="#f5f5f4" roughness={0.75} />
              </mesh>
              <B p={[0, 0.37, 0]} s={[0.12, 0.72, 0.12]} c={DARK} />
              {[0, 1, 2, 3].map((i) => {
                const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
                return (
                  <Chair
                    key={i}
                    x={Math.sin(a) * 0.95}
                    z={Math.cos(a) * 0.95}
                    color={accent}
                    face={a}
                  />
                );
              })}
              {/* sólidos geométricos sobre a mesa */}
              <mesh position={[-0.2, 0.86, 0.05]}>
                <boxGeometry args={[0.18, 0.18, 0.18]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
              <mesh position={[0.18, 0.88, -0.1]}>
                <coneGeometry args={[0.12, 0.24, 4]} />
                <meshStandardMaterial color="#a78bfa" />
              </mesh>
              <mesh position={[0.1, 0.85, 0.22]}>
                <sphereGeometry args={[0.09, 14, 10]} />
                <meshStandardMaterial color="#22d3ee" />
              </mesh>
            </group>
          ))}
          {/* estante com jogos e materiais */}
          <B p={[-w / 2 + 0.3, 0.9, 0.2]} s={[0.4, 1.8, 2.4]} c={WOOD} />
          {[0.5, 1.0, 1.5].map((y, i) => (
            <B
              key={y}
              p={[-w / 2 + 0.52, y, 0.2]}
              s={[0.04, 0.28, 2.1]}
              c={["#7c3aed", "#f8fafc", "#a78bfa"][i]!}
            />
          ))}
          {/* cartaz de geometria */}
          <B p={[w / 2 - 0.12, 1.6, -0.6]} s={[0.04, 0.9, 1.3]} c="#f8fafc" />
          <mesh position={[w / 2 - 0.15, 1.6, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
            <ringGeometry args={[0.22, 0.27, 3]} />
            <meshBasicMaterial color="#7c3aed" />
          </mesh>
        </group>
      );
    case "teachers":
      return (
        <group>
          <B p={[0, 0.38, 0]} s={[1.4, 0.76, 3.2]} c={WOOD} />
          {[-1.1, -0.35, 0.4, 1.15].flatMap((z) => [
            <Chair key={`l${z}`} x={-0.95} z={z} color={accent} face={-Math.PI / 2} />,
            <Chair key={`r${z}`} x={0.95} z={z} color={accent} face={Math.PI / 2} />,
          ])}
          <B p={[0, 0.95, back + 0.25]} s={[w - 1.2, 1.9, 0.45]} c="#64748b" />
          {[-2, -1, 0, 1, 2].map((x) => (
            <B key={x} p={[x * 0.9, 0.95, back + 0.48]} s={[0.02, 1.85, 0.01]} c="#1e293b" />
          ))}
          <B p={[2.4, 0.45, 1.8]} s={[0.6, 0.9, 1.2]} c="#e7e5e4" />
          <B p={[2.4, 1.05, 1.6]} s={[0.3, 0.3, 0.3]} c="#111827" />
        </group>
      );
    case "library":
      return <Library room={room} />;
    case "auditorium":
      return <Auditorium room={room} />;
    case "canteen":
      return <Canteen room={room} />;
    case "court":
      return (
        <group>
          {[
            [0, 0.03, -d / 2 + 0.35, w - 0.6, 0.06],
            [0, 0.03, d / 2 - 0.35, w - 0.6, 0.06],
          ].map(([x, y, z, sx, sz]) => (
            <B key={`h${z}`} p={[x!, y!, z!]} s={[sx!, 0.01, sz!]} c="#f8fafc" />
          ))}
          {[-w / 2 + 0.3, 0, w / 2 - 0.3].map((x) => (
            <B key={`v${x}`} p={[x, 0.03, 0]} s={[0.06, 0.01, d - 0.7]} c="#f8fafc" />
          ))}
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.6, 40]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * (w / 2 - 0.45), 0, 0]}>
              <B p={[0, 0.6, -1]} s={[0.08, 1.2, 0.08]} c="#f8fafc" />
              <B p={[0, 0.6, 1]} s={[0.08, 1.2, 0.08]} c="#f8fafc" />
              <B p={[0, 1.2, 0]} s={[0.08, 0.08, 2.08]} c="#f8fafc" />
            </group>
          ))}
          {/* estrutura da cobertura: pilares nos cantos e do lado da arquibancada */}
          {[-w / 2, -w / 4, 0, w / 4, w / 2].map((x) => (
            <B key={`pn${x}`} p={[x, 3.5, -d / 2]} s={[0.3, 7, 0.3]} c={RED} />
          ))}
          {[-w / 2, w / 2].map((x) => (
            <B key={`ps${x}`} p={[x, 3.5, d / 2]} s={[0.3, 7, 0.3]} c={RED} />
          ))}
          <Truss p={[0, 7.2, -d / 2]} length={w + 0.2} h={0.6} />
          {[-w / 2, -w / 4, 0, w / 4, w / 2].map((x) => (
            <Truss key={`bs${x}`} p={[x, 7.2, 0]} length={d + 0.2} h={0.6} r={Math.PI / 2} />
          ))}
          {[0, 1, 2].map((i) => (
            <B
              key={i}
              p={[0, 0.15 + i * 0.15, -d / 2 + 0.9 - i * 0.45]}
              s={[12, 0.3 + i * 0.3, 0.45]}
              c="#64748b"
            />
          ))}
        </group>
      );
  }
}

const BOOK_COLORS = ["#1d4ed8", "#b91c1c", "#15803d", "#a16207", "#7c3aed"];

function BookShelf({ p, s, r = 0 }: { p: V3; s: V3; r?: number }) {
  const [len, h, depth] = s;
  const levels = Math.max(2, Math.floor(h / 0.42));
  return (
    <group position={p} rotation={[0, r, 0]}>
      <B p={[0, h / 2, 0]} s={[len, h, depth]} c="#6b3f1d" />
      {Array.from({ length: levels }, (_, i) => (
        <B
          key={i}
          p={[0, 0.22 + i * (h / levels), 0]}
          s={[len - 0.1, h / levels - 0.12, depth + 0.02]}
          c={BOOK_COLORS[(i + Math.round(p[0] * 3)) % BOOK_COLORS.length]!}
        />
      ))}
    </group>
  );
}

/** Mezanino da biblioteca: piso superior a 1,30 m, guarda-corpo duplo h = 1,10 m. */
const MEZZ_Y = 1.3;
const RAIL_H = 1.1;

function Library({ room }: { room: Room }) {
  const { w, d, accent } = room;
  const back = -d / 2;
  const front = back + 1.1; // borda do mezanino
  const stairX = w / 2 - 0.6;
  const steps = 7;
  const run = 0.29;
  const stairLen = steps * run;
  const stairTilt = Math.atan2(MEZZ_Y, stairLen);
  return (
    <group>
      {/* ---- piso inferior ---- */}
      {/* estantes verticais em fileiras paralelas */}
      {[-w / 2 + 0.6, -w / 2 + 1.8].map((x) => (
        <BookShelf key={x} p={[x, 0, -0.9]} s={[3, 1.9, 0.4]} r={Math.PI / 2} />
      ))}
      <BookShelf p={[1.85, 0, front + 0.45]} s={[1, 1, 0.35]} />
      {/* mesas quadradas de estudo em grupo (4 lugares) */}
      {[
        [-0.5, -0.8],
        [1.3, -0.8],
        [-0.5, 1.1],
        [1.3, 1.1],
      ].map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x!, 0, z!]}>
          <B p={[0, 0.74, 0]} s={[0.9, 0.05, 0.9]} c={WOOD} />
          <B p={[0, 0.36, 0]} s={[0.1, 0.72, 0.1]} c={METAL} />
          <Chair x={0} z={0.62} color={accent} />
          <Chair x={0} z={-0.62} color={accent} face={Math.PI} />
          <Chair x={0.62} z={0} color={accent} face={Math.PI / 2} />
          <Chair x={-0.62} z={0} color={accent} face={-Math.PI / 2} />
        </group>
      ))}
      {/* balcão de atendimento em "L" */}
      <B p={[-w / 2 + 0.95, 0.5, d / 2 - 1.5]} s={[1.6, 1, 0.55]} c={RED_DARK} />
      <B p={[-w / 2 + 1.5, 0.5, d / 2 - 0.95]} s={[0.55, 1, 1.1]} c={RED_DARK} />
      <group position={[0, 0.25, 0]}>
        <Computer x={-w / 2 + 0.8} z={d / 2 - 1.55} />
      </group>
      <Chair x={-w / 2 + 0.8} z={d / 2 - 0.9} color={DARK} face={Math.PI} />

      {/* ---- mezanino (piso superior) ---- */}
      <BookShelf p={[0, 0, back + 0.3]} s={[w - 0.4, 1.15, 0.4]} />
      {[-w / 2 + 0.3, -1.2, 1.2, w / 2 - 1.1].map((x) => (
        <B key={x} p={[x, MEZZ_Y / 2, front - 0.06]} s={[0.1, MEZZ_Y, 0.1]} c={METAL} />
      ))}
      <B p={[0, MEZZ_Y - 0.06, back + 0.55]} s={[w - 0.2, 0.12, 1.1]} c="#a8a29e" />
      <B p={[-0.5, MEZZ_Y - 0.2, front]} s={[w - 1.2, 0.28, 0.04]} c={accent} />
      {/* guarda-corpo duplo (corrimão a 1,10 m + barra intermediária) */}
      {[RAIL_H, RAIL_H / 2].map((h) => (
        <B key={h} p={[-0.5, MEZZ_Y + h, front]} s={[w - 1.2, 0.05, 0.05]} c={METAL} />
      ))}
      {Array.from({ length: 9 }, (_, i) => -w / 2 + 0.15 + i * ((w - 1.2) / 8)).map((x) => (
        <B key={x} p={[x, MEZZ_Y + RAIL_H / 2, front]} s={[0.04, RAIL_H, 0.04]} c={METAL} />
      ))}
      {/* cabines individuais de estudo com computador */}
      <group position={[0, MEZZ_Y, 0]}>
        {Array.from({ length: 6 }, (_, i) => -w / 2 + 0.75 + i * 1.3).map((x) => (
          <group key={x}>
            <B p={[x, 0.74, back + 0.32]} s={[1.15, 0.05, 0.5]} c={WOOD} />
            <B p={[x - 0.6, 0.95, back + 0.35]} s={[0.04, 0.9, 0.6]} c="#d6d3d1" />
            <Computer x={x} z={back + 0.3} />
            <Chair x={x} z={back + 0.85} color={accent} />
          </group>
        ))}
      </group>
      {/* escada metálica */}
      {Array.from({ length: steps }, (_, i) => (
        <B
          key={i}
          p={[stairX, ((i + 1) * MEZZ_Y) / steps - 0.02, front + stairLen - (i + 0.5) * run]}
          s={[0.9, 0.05, run]}
          c="#9ca3af"
        />
      ))}
      {[-0.47, 0.47].map((dx) => (
        <group key={dx}>
          <B
            p={[stairX + dx, MEZZ_Y / 2, front + stairLen / 2]}
            s={[0.05, 0.14, Math.hypot(stairLen, MEZZ_Y)]}
            r={[stairTilt, 0, 0]}
            c={METAL}
          />
          {[RAIL_H, RAIL_H / 2].map((h) => (
            <B
              key={h}
              p={[stairX + dx, MEZZ_Y / 2 + h, front + stairLen / 2]}
              s={[0.04, 0.04, Math.hypot(stairLen, MEZZ_Y)]}
              r={[stairTilt, 0, 0]}
              c={METAL}
            />
          ))}
        </group>
      ))}
      <Sign
        lines={["SILÊNCIO · Leia mais!"]}
        p={[-1.5, MEZZ_Y - 0.2, front + 0.03]}
        size={[2.2, 0.26]}
        bg={accent}
        fg="#ffffff"
      />
    </group>
  );
}

/** Poltronas instanciadas (assento + encosto) em fileiras. */
function SeatRows({ seats, color }: { seats: V3[]; color: string }) {
  const cushions = useRef<InstancedMesh>(null);
  const backs = useRef<InstancedMesh>(null);
  useEffect(() => {
    const dummy = new Object3D();
    seats.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + 0.42, z);
      dummy.updateMatrix();
      cushions.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, y + 0.72, z + 0.22);
      dummy.updateMatrix();
      backs.current?.setMatrixAt(i, dummy.matrix);
    });
    if (cushions.current) cushions.current.instanceMatrix.needsUpdate = true;
    if (backs.current) backs.current.instanceMatrix.needsUpdate = true;
  }, [seats]);
  return (
    <group>
      <instancedMesh ref={cushions} args={[undefined, undefined, seats.length]}>
        <boxGeometry args={[0.5, 0.14, 0.46]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={backs} args={[undefined, undefined, seats.length]}>
        <boxGeometry args={[0.5, 0.55, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

/** Plateia em rampa de 8,33 %, poltronas pretas no centro e corredores laterais. */
const AUDIENCE_SLOPE = 0.0833;

function Auditorium({ room }: { room: Room }) {
  const { w, d } = room;
  const back = -d / 2;
  const stageH = 0.5;
  const stageD = 2.4;
  const rows = useMemo(() => Array.from({ length: 6 }, (_, i) => -1.4 + i * 0.85), []);
  const seats = useMemo<V3[]>(
    () =>
      rows.flatMap((z) => {
        const y = (z - rows[0]!) * AUDIENCE_SLOPE;
        // fileiras duplas: pares de poltronas lado a lado
        return Array.from({ length: 12 }, (_, i) => {
          const x = -3.3 + i * 0.6 + (i % 2 ? -0.03 : 0.03);
          return [x, y, z] as V3;
        });
      }),
    [rows],
  );
  const rampLen = stageH / AUDIENCE_SLOPE;
  const rampX = w / 2 - 0.75;
  const rampTilt = Math.atan2(stageH, rampLen);
  return (
    <group>
      {/* palco elevado com cortinas */}
      <B p={[0, stageH / 2, back + stageD / 2]} s={[9, stageH, stageD]} c="#4a2c18" />
      <B p={[0, stageH - 0.02, back + stageD]} s={[9, 0.06, 0.06]} c="#111827" />
      <Sign
        lines={["EXPOTEC", "EEEP Dr. Salomão Alves de Moura"]}
        p={[0, 1.65, back + 0.13]}
        size={[5, 1.4]}
        bg="#1e1b4b"
        fg="#e9d5ff"
        glow
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          {[0, 1, 2, 3].map((k) => (
            <B
              key={k}
              p={[side * (3.2 + k * 0.32), stageH + 1, back + 0.3 + (k % 2) * 0.06]}
              s={[0.3, 2, 0.1]}
              c={k % 2 ? "#7f1d1d" : "#6b0f1a"}
            />
          ))}
        </group>
      ))}
      <B p={[0, 2.45, back + 0.3]} s={[9, 0.3, 0.14]} c="#6b0f1a" />
      <B p={[2.5, stageH + 0.5, back + 1.4]} s={[0.6, 1, 0.45]} c={WOOD} />
      {/* rampa lateral de acesso ao palco (8,33 %) */}
      <B
        p={[rampX, stageH / 2 - 0.03, back + stageD + rampLen / 2]}
        s={[1, 0.08, Math.hypot(rampLen, stageH)]}
        r={[rampTilt, 0, 0]}
        c="#78716c"
      />
      <B
        p={[rampX - 0.5, stageH / 2 + 0.9, back + stageD + rampLen / 2]}
        s={[0.05, 0.05, Math.hypot(rampLen, stageH)]}
        r={[rampTilt, 0, 0]}
        c={RED}
      />
      {/* degraus da plateia (piso em rampa) */}
      {rows.slice(1).map((z) => {
        const h = (z - rows[0]!) * AUDIENCE_SLOPE;
        return <B key={z} p={[0, h / 2, z + 0.1]} s={[7.6, h, 0.85]} c="#3f3a36" />;
      })}
      <SeatRows seats={seats} color="#111111" />
      {[-4.8, 4.8].map((x) => (
        <B key={x} p={[x, 0.9, back + 0.6]} s={[0.5, 1.3, 0.5]} c="#111827" />
      ))}
    </group>
  );
}

/** Refeitório: mesas compridas com bancos integrados, zona de circulação e lavatório. */
function Canteen({ room }: { room: Room }) {
  const { w, d, accent } = room;
  const back = -d / 2;
  return (
    <group>
      <B p={[0, 0.5, back + 0.8]} s={[6, 1, 0.7]} c="#d6d3d1" />
      <B p={[0, 1.02, back + 0.8]} s={[6.1, 0.05, 0.8]} c="#94a3b8" />
      {[-2.2, -1.1, 0, 1.1, 2.2].map((x, i) => (
        <mesh key={x} position={[x, 1.1, back + 0.8]}>
          <cylinderGeometry args={[0.28, 0.24, 0.14, 16]} />
          <meshStandardMaterial
            color={["#fbbf24", "#78350f", "#16a34a", "#f97316", "#fef3c7"][i]!}
          />
        </mesh>
      ))}
      <Sign
        lines={["CARDÁPIO DO DIA", "Baião de dois · Frango", "Salada · Suco de caju"]}
        p={[0, 2, back + 0.12]}
        size={[3.4, 1.1]}
        bg="#1c1917"
        fg="#fde68a"
      />
      {/* mesas compridas em colunas e fileiras */}
      {[-2.1, 2.1].flatMap((x) =>
        [-1.6, 0.45, 2.5].map((z) => (
          <group key={`${x}:${z}`} position={[x, 0, z]}>
            <B p={[0, 0.74, 0]} s={[2.4, 0.05, 0.75]} c="#f8fafc" />
            <B p={[0, 0.37, 0]} s={[2.2, 0.06, 0.06]} c={METAL} />
            {[-1, 1].map((sx) => (
              <B key={sx} p={[sx * 1.05, 0.37, 0]} s={[0.06, 0.74, 1.4]} c={METAL} />
            ))}
            {[-0.6, 0.6].map((bz) => (
              <B key={bz} p={[0, 0.45, bz]} s={[2.4, 0.06, 0.3]} c={accent} />
            ))}
            {/* calha de iluminação pendente */}
            <B p={[0, 2.45, 0]} s={[2, 0.03, 0.05]} c="#e5e7eb" e="#fffbeb" ei={0.9} />
          </group>
        )),
      )}
      {/* zona de circulação marcada no piso */}
      {[-0.75, 0.75].map((x) => (
        <B key={x} p={[x, 0.03, 0.6]} s={[0.07, 0.01, 6.4]} c="#facc15" />
      ))}
      <B p={[0, 0.03, back + 1.4]} s={[w - 0.6, 0.01, 0.07]} c="#facc15" />
      <Sign
        lines={["CIRCULAÇÃO"]}
        p={[0, 0.035, 0.6]}
        size={[1.8, 0.4]}
        r={[-Math.PI / 2, 0, Math.PI / 2]}
        bg={CERAMIC}
        fg="#a16207"
      />
      {/* lavatório na entrada */}
      <group position={[w / 2 - 0.4, 0, d / 2 - 1.1]}>
        <B p={[0, 0.42, 0]} s={[0.55, 0.84, 1.6]} c="#f1f5f9" />
        <B p={[0, 0.86, 0]} s={[0.6, 0.04, 1.65]} c="#cbd5e1" />
        {[-0.5, 0, 0.5].map((z) => (
          <group key={z}>
            <B p={[0.02, 0.87, z]} s={[0.35, 0.02, 0.35]} c="#94a3b8" />
            <B p={[0.2, 1.02, z]} s={[0.05, 0.22, 0.05]} c="#64748b" />
          </group>
        ))}
        <B p={[0.25, 1.6, 0]} s={[0.03, 0.6, 1.4]} c="#bfdbfe" e="#dbeafe" ei={0.2} />
      </group>
    </group>
  );
}

const RoomBlock = memo(function RoomBlock({ room }: { room: Room }) {
  const angle = doorAngle[room.door];
  return (
    <group position={[room.x, 0, room.z]} rotation={[0, angle, 0]}>
      <B p={[0, 0.012, 0]} s={[room.w, 0.02, room.d]} c={room.floor} />
      {room.walls !== false && (
        <B p={[0, 0.016, room.d / 2 + 0.6]} s={[1.6, 0.02, 0.9]} c={room.accent} />
      )}
      <Interior room={room} />
      {room.walls !== false && (
        <Sign
          lines={[room.board ?? room.name]}
          p={[0, WALL_H - 0.25, room.d / 2 + 0.115]}
          size={[1.7, 0.36]}
          bg={room.accent}
          fg="#ffffff"
        />
      )}
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Paredes (ficam transparentes quando tapam a visão)                  */
/* ------------------------------------------------------------------ */

function Walls({ posRef }: { posRef: { current: Vec2 } }) {
  const materials = useRef<(MeshStandardMaterial | null)[]>([]);
  // placas de 60 cm na fachada
  const maps = useMemo(
    () =>
      walls.map((wall) => {
        if (!wall.tex || typeof document === "undefined") return null;
        const tex = new CanvasTexture(patternCanvas("tiles"));
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        tex.repeat.set(Math.max(wall.sx, wall.sz) / 1.2, WALL_H / 1.2);
        return tex;
      }),
    [],
  );
  useEffect(() => () => maps.forEach((tex) => tex?.dispose()), [maps]);
  useFrame(() => {
    const p = posRef.current;
    walls.forEach((wall, i) => {
      const material = materials.current[i];
      if (!material) return;
      const blocks =
        wall.axis === "x" &&
        wall.z > p.z - 0.4 &&
        wall.z < p.z + 9 &&
        p.x > wall.x - wall.sx / 2 - 2.5 &&
        p.x < wall.x + wall.sx / 2 + 2.5;
      const target = blocks ? 0.18 : 1;
      material.opacity += (target - material.opacity) * 0.15;
      material.depthWrite = material.opacity > 0.95;
    });
  });
  return (
    <group>
      {walls.map((wall, i) => (
        <mesh key={i} position={[wall.x, WALL_H / 2, wall.z]}>
          <boxGeometry args={[wall.sx, WALL_H, wall.sz]} />
          <meshStandardMaterial
            ref={(m) => {
              materials.current[i] = m;
            }}
            color={maps[i] ? "#ffffff" : wall.color}
            map={maps[i] ?? null}
            roughness={0.85}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Exterior                                                            */
/* ------------------------------------------------------------------ */

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1.8, 7]} />
        <meshStandardMaterial color="#7c4a26" />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#3f8f3a" flatShading />
      </mesh>
      <mesh position={[0.45, 1.9, 0.2]}>
        <icosahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#4ea64a" flatShading />
      </mesh>
    </group>
  );
}

function Bench({ x, z, r = 0 }: { x: number; z: number; r?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <B p={[0, 0.42, 0]} s={[1.6, 0.06, 0.45]} c={WOOD} />
      <B p={[-0.65, 0.2, 0]} s={[0.08, 0.4, 0.4]} c={DARK} />
      <B p={[0.65, 0.2, 0]} s={[0.08, 0.4, 0.4]} c={DARK} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Corredores e jardim                                                 */
/* ------------------------------------------------------------------ */

/** Vaso cerâmico (vermelho ou amarelo, como no pátio da escola). */
function Pot({
  x,
  z,
  c = "#16a34a",
  pot = "#c2410c",
}: {
  x: number;
  z: number;
  c?: string;
  pot?: string;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.28, 0.2, 0.5, 12]} />
        <meshStandardMaterial color={pot} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={c} flatShading />
      </mesh>
    </group>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2, 0]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.12, 0.2, 4, 8]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.8 + 0.15, 3.9, Math.cos(a) * 0.8]}
            rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]}
            scale={[0.35, 1, 1.6]}
          >
            <sphereGeometry args={[0.55, 6, 4]} />
            <meshStandardMaterial color="#3f9b3a" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

/** Palmeira-leque pequena. */
function FanPalm({ x, z, y = 0, s = 1 }: { x: number; z: number; y?: number; s?: number }) {
  return (
    <group position={[x, y, z]} scale={s} rotation={[0, (x * 7 + z * 3) % Math.PI, 0]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 1.2, 7]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = -1.2 + (i / 8) * 2.4;
        return (
          <group key={i} position={[0, 1.15, 0]} rotation={[0.35 + (i % 2) * 0.25, 0, a]}>
            <mesh position={[0, 0.45, 0]} scale={[0.32, 1, 0.08]}>
              <sphereGeometry args={[0.45, 6, 4]} />
              <meshStandardMaterial color={i % 2 ? "#2f8f3a" : "#3fae4a"} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Shrub({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.35, 0]} scale={[1.2, 0.8, 1]}>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#2f7d32" flatShading />
      </mesh>
      <mesh position={[0.3, 0.3, 0.15]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#4ea64a" flatShading />
      </mesh>
    </group>
  );
}

/** Caminho curvo de pedras irregulares claras (instanciado). */
function StonePath({ from, to, width = 2.4 }: { from: Vec2; to: Vec2; width?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const stones = useMemo(() => {
    const rand = seeded(42);
    const list: { x: number; z: number; r: number; s: number; t: number }[] = [];
    const len = Math.hypot(to.x - from.x, to.z - from.z);
    const rows = Math.round(len / 0.5);
    for (let i = 0; i <= rows; i += 1) {
      const t = i / rows;
      // curva em "S" entre o portão e a entrada
      const cx = from.x + (to.x - from.x) * t + Math.sin(t * Math.PI * 2) * 1.6;
      const cz = from.z + (to.z - from.z) * t;
      for (let k = 0; k < 4; k += 1) {
        list.push({
          x: cx + (k - 1.5) * (width / 4) + (rand() - 0.5) * 0.15,
          z: cz + (rand() - 0.5) * 0.15,
          r: rand() * Math.PI,
          s: 0.8 + rand() * 0.45,
          t: rand(),
        });
      }
    }
    return list;
  }, [from.x, from.z, to.x, to.z, width]);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    stones.forEach((stone, i) => {
      dummy.position.set(stone.x, 0.03, stone.z);
      dummy.rotation.set(0, stone.r, 0);
      dummy.scale.set(stone.s, 1, stone.s * 0.85);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [stones]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, stones.length]}>
      <cylinderGeometry args={[0.27, 0.29, 0.06, 7]} />
      <meshStandardMaterial color="#e4ded3" roughness={0.95} />
    </instancedMesh>
  );
}

function PingPongTable({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <B p={[0, 0.76, 0]} s={[1.525, 0.04, 2.74]} c="#1e4f8a" />
      <B p={[0, 0.785, 0]} s={[0.02, 0.005, 2.74]} c="#f8fafc" />
      <B p={[0, 0.86, 0]} s={[1.7, 0.15, 0.02]} c="#e5e7eb" />
      {[-0.6, 0.6].flatMap((dx) =>
        [-1.1, 1.1].map((dz) => (
          <B key={`${dx}:${dz}`} p={[dx, 0.37, dz]} s={[0.05, 0.74, 0.05]} c={METAL} />
        )),
      )}
    </group>
  );
}

/** Pátio coberto principal (área SAM): treliça vermelha, mural, rampa e pingue-pongue. */
const PatioSam = memo(function PatioSam() {
  const { x0, x1, z0, z1 } = patioSam;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const mural = usePattern("mural");
  const landing = 1.2;
  const rise = 0.45;
  const rampLen = rise / 0.0833;
  const rampZ = z1 - 0.65;
  const rampCx = x0 + landing + rampLen / 2;
  const tilt = Math.atan2(rise, rampLen);
  const roofY = 4.2;
  return (
    <group>
      <Floor p={[cx, 0.014, cz]} s={[x1 - x0, z1 - z0]} pattern="waves" tile={2} />
      {/* mural artístico na parede azul */}
      {mural && (
        <mesh position={[x0 + 0.01, 1.3, cz]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[z1 - z0 - 0.2, 2.4]} />
          <meshStandardMaterial map={mural} roughness={0.8} />
        </mesh>
      )}
      {/* rampa de acessibilidade (8,33 %) com lateral vinho e peitoril */}
      <B p={[x0 + landing / 2, rise / 2, rampZ]} s={[landing, rise, 0.95]} c="#c9c6c0" />
      <B p={[x0 + landing / 2, rise / 2, rampZ - 0.48]} s={[landing, rise, 0.02]} c={RED} />
      <B
        p={[rampCx, rise / 2 - 0.04, rampZ]}
        s={[Math.hypot(rampLen, rise), 0.1, 0.95]}
        r={[0, 0, -tilt]}
        c="#c9c6c0"
      />
      <B
        p={[rampCx, rise / 2 - 0.15, rampZ - 0.48]}
        s={[Math.hypot(rampLen, rise), 0.3, 0.03]}
        r={[0, 0, -tilt]}
        c={RED}
      />
      {[0.9, 0.45].map((h) => (
        <B
          key={h}
          p={[rampCx, rise / 2 + h, rampZ - 0.46]}
          s={[Math.hypot(rampLen, rise), 0.05, 0.05]}
          r={[0, 0, -tilt]}
          c={RED}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => x0 + landing + (rampLen * (i + 0.5)) / 6).map((x) => (
        <B
          key={x}
          p={[x, rise - ((x - x0 - landing) / rampLen) * rise + 0.45, rampZ - 0.46]}
          s={[0.04, 0.9, 0.04]}
          c={RED}
        />
      ))}
      <PingPongTable x={-7.7} z={14.3} />
      <PingPongTable x={-5} z={14.3} />
      {/* pé-direito alto com treliças metálicas vermelhas */}
      {[x0 + 0.1, x1 - 0.1].flatMap((x) =>
        [z0 + 0.15, z1 - 0.25].map((z) => (
          <B key={`${x}:${z}`} p={[x, roofY / 2, z]} s={[0.3, roofY, 0.3]} c={RED} />
        )),
      )}
      {[z0 + 0.15, z0 + 2, z0 + 3.9, z1 - 0.25].map((z) => (
        <Truss key={z} p={[cx, roofY, z]} length={x1 - x0} h={0.6} />
      ))}
      {[x0 + 0.1, cx, x1 - 0.1].map((x) => (
        <B key={x} p={[x, roofY + 0.32, cz]} s={[0.1, 0.1, z1 - z0]} c={TRUSS} />
      ))}
    </group>
  );
});

/** Fachada principal: faixa alta em placas cinza ardósia, letreiro metálico e emblema. */
function Facade({ posRef }: { posRef: { current: Vec2 } }) {
  const x0 = patioSam.x0;
  const x1 = 9;
  const bandH = 1.6;
  const band = usePattern("tiles", (x1 - x0) / 1.2, bandH / 1.2);
  const emblem = usePattern("emblem");
  const z = FACADE_Z;
  return (
    <group>
      <FadeGroup posRef={posRef} x0={x0} x1={x1} z={z}>
        <mesh position={[(x0 + x1) / 2, WALL_H + bandH / 2, z]}>
          <boxGeometry args={[x1 - x0, bandH, 0.3]} />
          <meshStandardMaterial map={band} roughness={0.85} />
        </mesh>
        <Sign
          lines={["ESCOLA ESTADUAL DE EDUCAÇÃO PROFISSIONAL", "DR. SALOMÃO ALVES DE MOURA"]}
          p={[0, WALL_H + bandH / 2, z + 0.16]}
          size={[11, 1.35]}
          bg="transparent"
          fg="#e5e7eb"
        />
      </FadeGroup>
      {/* pilares da entrada */}
      {[-3.25, 3.25].map((x) => (
        <B key={x} p={[x, WALL_H / 2, z]} s={[0.4, WALL_H, 0.4]} c={FACADE_COLOR} />
      ))}
      {/* emblema do Governo do Estado ao lado da entrada */}
      {emblem && (
        <mesh position={[-4.3, 1.55, z + 0.12]}>
          <planeGeometry args={[0.8, 1]} />
          <meshStandardMaterial map={emblem} transparent alphaTest={0.1} />
        </mesh>
      )}
      <Sign
        lines={["GOVERNO DO ESTADO", "DO CEARÁ"]}
        p={[-4.3, 0.78, z + 0.12]}
        size={[1.4, 0.42]}
        bg="transparent"
        fg="#e5e7eb"
      />
      <Sign
        lines={["PORTARIA · ENTRADA"]}
        p={[0, 2.35, z + 0.05]}
        size={[2.6, 0.4]}
        bg={RED}
        fg="#f8fafc"
      />
      <B p={[0, 2.35, z]} s={[6.1, 0.4, 0.08]} c={RED_DARK} />
    </group>
  );
}

/** Grade metálica verde-escura (barras verticais com textura de recorte). */
function Fence({ x0, x1, z, h = 2 }: { x0: number; x1: number; z: number; h?: number }) {
  const len = x1 - x0;
  const bars = usePattern("fence", len / 0.14, 1);
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, h / 2 + 0.3, z]}>
        <planeGeometry args={[len, h]} />
        <meshStandardMaterial map={bars} transparent alphaTest={0.5} side={DoubleSide} />
      </mesh>
      <B p={[(x0 + x1) / 2, 0.15, z]} s={[len, 0.3, 0.25]} c="#d6d3d1" />
      {[h * 0.15, h - 0.05].map((y) => (
        <B key={y} p={[(x0 + x1) / 2, y + 0.3, z]} s={[len, 0.05, 0.05]} c={FENCE_GREEN} />
      ))}
      {Array.from({ length: Math.floor(len / 2.5) + 1 }, (_, i) => x0 + i * 2.5).map((x) => (
        <B key={x} p={[x, h / 2 + 0.3, z]} s={[0.1, h, 0.1]} c={FENCE_GREEN} />
      ))}
    </group>
  );
}

const FLOWER_COLORS = ["#f43f5e", "#facc15", "#f97316", "#e879f9", "#ffffff", "#60a5fa"];

function FlowerBed({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const flowers = useMemo(() => {
    const list: [number, number, string][] = [];
    let seed = Math.abs(Math.round(x * 31 + z * 17)) + 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 14; i += 1) {
      list.push([
        (rand() - 0.5) * (w - 0.4),
        (rand() - 0.5) * (d - 0.4),
        FLOWER_COLORS[i % FLOWER_COLORS.length]!,
      ]);
    }
    return list;
  }, [x, z, w, d]);
  return (
    <group position={[x, 0, z]}>
      <B p={[0, 0.08, 0]} s={[w + 0.2, 0.16, d + 0.2]} c={RED_DARK} />
      <B p={[0, 0.17, 0]} s={[w, 0.04, d]} c="#5b3a1e" />
      {flowers.map(([fx, fz, c], i) => (
        <group key={i} position={[fx, 0, fz]}>
          <B p={[0, 0.3, 0]} s={[0.04, 0.26, 0.04]} c="#15803d" />
          <mesh position={[0, 0.45, 0]}>
            <sphereGeometry args={[0.11, 8, 6]} />
            <meshStandardMaterial color={c} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const Corridors = memo(function Corridors() {
  const extraPillars = useMemo(() => {
    const list: [number, number][] = [...pillars];
    for (const m of muretas) {
      const len = m.axis === "x" ? m.sx : m.sz;
      const n = Math.floor(len / 3.5);
      for (let i = 1; i < n; i += 1) {
        const t = -len / 2 + (len / n) * i;
        list.push(m.axis === "x" ? [m.x + t, m.z] : [m.x, m.z + t]);
      }
    }
    return list;
  }, []);
  return (
    <group>
      {corridors.map((c, i) => (
        <group key={i}>
          <B
            p={[(c.x0 + c.x1) / 2, 0.008, (c.z0 + c.z1) / 2]}
            s={[c.x1 - c.x0, 0.02, c.z1 - c.z0]}
            c={CERAMIC}
          />
        </group>
      ))}
      {/* peitoris vermelho-vinho com capa de concreto */}
      {muretas.map((m, i) => (
        <group key={i}>
          <B p={[m.x, MURETA_HEIGHT / 2, m.z]} s={[m.sx, MURETA_HEIGHT, m.sz]} c={m.color} />
          <B
            p={[m.x, MURETA_HEIGHT + 0.03, m.z]}
            s={[m.sx + 0.06, 0.06, m.sz + 0.06]}
            c="#d8d2c8"
          />
        </group>
      ))}
      {/* pilares estruturais robustos */}
      {extraPillars.map(([x, z], i) => (
        <B key={i} p={[x, 1.55, z]} s={[0.34, 3.1, 0.34]} c={RED} />
      ))}
      {/* treliças metálicas vermelhas da cobertura dos corredores */}
      <Truss p={[0, 3.2, 9.5]} length={22.3} h={0.35} />
      <Truss p={[0, 3.2, -12]} length={22.3} h={0.35} />
      <Truss p={[-11, 3.2, -1.25]} length={21.8} h={0.35} r={Math.PI / 2} />
      <Truss p={[11, 3.2, -1.25]} length={21.8} h={0.35} r={Math.PI / 2} />
      {[
        [-12.3, 10.8],
        [12.3, 10.8],
        [-12.3, -13.3],
        [12.3, -13.3],
        [-2.4, 13],
        [2.4, 13],
        [-11.6, 4],
        [-11.6, -7.5],
        [11.6, 4],
        [11.6, -7.5],
        [-9.5, -13.6],
        [9.5, -13.6],
      ].map(([x, z], i) => (
        <Pot
          key={i}
          x={x!}
          z={z!}
          c={i % 3 === 0 ? "#22c55e" : i % 3 === 1 ? "#15803d" : "#4d7c0f"}
          pot={i % 2 ? "#eab308" : "#b91c1c"}
        />
      ))}
    </group>
  );
});

const Garden = memo(function Garden() {
  const cx = (courtyard.x0 + courtyard.x1) / 2;
  const cz = (courtyard.z0 + courtyard.z1) / 2;
  return (
    <group>
      {/* pátio central descoberto: intertravado cinza em ziguezague */}
      <Floor
        p={[cx, 0.012, cz]}
        s={[courtyard.x1 - courtyard.x0, courtyard.z1 - courtyard.z0]}
        pattern="pavers"
      />
      {/* faixas de mosaico cerâmico bege */}
      <Floor p={[0, 0.018, cz]} s={[2.8, courtyard.z1 - courtyard.z0]} pattern="mosaic" />
      <Floor p={[cx, 0.02, -1.6]} s={[courtyard.x1 - courtyard.x0, 2]} pattern="mosaic" />
      <Floor p={[-7, 0.018, -6.5]} s={[2, 11]} pattern="mosaic" />
      <Floor p={[7, 0.018, -6.5]} s={[2, 11]} pattern="mosaic" />
      {/* praça central: área de vivência com canteiro central */}
      <mesh position={[0, 0.03, -1.6]}>
        <cylinderGeometry args={[3.3, 3.3, 0.04, 40]} />
        <meshStandardMaterial color={MOSAIC} />
      </mesh>
      <mesh position={[0, 0.2, -1.6]}>
        <cylinderGeometry args={[1.1, 1.15, 0.4, 24]} />
        <meshStandardMaterial color={RED_DARK} />
      </mesh>
      <mesh position={[0, 0.41, -1.6]}>
        <cylinderGeometry args={[0.98, 0.98, 0.04, 24]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.55, 0.65, -1.6 + Math.cos(a) * 0.55]}
            scale={[1, 0.8, 1]}
          >
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color={i % 2 ? "#2f7d32" : "#3f9b3a"} flatShading />
          </mesh>
        );
      })}
      <FanPalm x={0} z={-1.6} y={0.4} s={0.9} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <Pot
            key={i}
            x={Math.sin(a) * 1.75}
            z={-1.6 + Math.cos(a) * 1.75}
            pot={i % 2 ? "#eab308" : "#b91c1c"}
            c={i % 2 ? "#15803d" : "#22c55e"}
          />
        );
      })}
      <Sign
        lines={["ÁREA DE VIVÊNCIA"]}
        p={[0, 0.06, 0.95]}
        size={[2.8, 0.5]}
        r={[-Math.PI / 2, 0, 0]}
        bg={MOSAIC}
        fg={RED}
      />
      {[
        [-4, 4, 4.6, 3.4],
        [4, 4, 4.6, 3.4],
        [-4, -7.5, 4.6, 3],
        [4, -7.5, 4.6, 3],
      ].map(([x, z, w, d]) => (
        <FlowerBed key={`${x}:${z}`} x={x!} z={z!} w={w!} d={d!} />
      ))}
      {[
        [-9, 6.8],
        [9, 6.8],
        [-9.2, -9.8],
        [9.2, -9.8],
      ].map(([x, z]) => (
        <Tree key={`${x}:${z}`} x={x!} z={z!} s={0.95} />
      ))}
      <Palm x={-4.2} z={1.2} />
      <Palm x={4.2} z={-4.4} />
      {[
        [-2.4, 1.6, 0],
        [2.4, 1.6, 0],
        [-2.4, -4.8, Math.PI],
        [2.4, -4.8, Math.PI],
        [-9.5, -1.6, Math.PI / 2],
        [9.5, -1.6, -Math.PI / 2],
      ].map(([x, z, r]) => (
        <Bench key={`${x}:${z}`} x={x!} z={z!} r={r!} />
      ))}
    </group>
  );
});

const FRONT_GARDEN: [number, number, "palm" | "shrub"][] = [
  [-4.6, 19.3, "shrub"],
  [-6.2, 19.4, "palm"],
  [-8, 19.3, "shrub"],
  [-9.6, 19.5, "palm"],
  [4.2, 19.3, "shrub"],
  [5.8, 19.4, "palm"],
  [7.6, 19.3, "shrub"],
  [-3.4, 22, "shrub"],
  [3.6, 21, "palm"],
  [-4.2, 25.5, "palm"],
  [-2.4, 26.6, "shrub"],
  [-2.8, 27.8, "shrub"],
  [6.5, 15, "palm"],
];

const Grounds = memo(function Grounds({ posRef }: { posRef: { current: Vec2 } }) {
  return (
    <group>
      <B p={[0, -0.06, -6]} s={[64, 0.1, 88]} c="#8cbf5f" />
      {/* caminhos externos */}
      <StonePath from={{ x: 0, z: 28.8 }} to={{ x: 0, z: 18.3 }} />
      <Floor p={[7, 0.005, -20.25]} s={[2, 12.5]} pattern="pavers" />
      <Floor p={[-7, 0.005, -20.25]} s={[2, 12.5]} pattern="pavers" />
      {/* jardim frontal tropical */}
      {FRONT_GARDEN.map(([x, z, kind]) =>
        kind === "palm" ? (
          <FanPalm key={`${x}:${z}`} x={x} z={z} />
        ) : (
          <Shrub key={`${x}:${z}`} x={x} z={z} s={1.1} />
        ),
      )}
      <FlowerBed x={6.2} z={15} w={4.2} d={3.4} />
      <Corridors />
      <Garden />
      <PatioSam />
      <Facade posRef={posRef} />
      {/* árvores externas */}
      {[
        [-21, 22],
        [21, 22],
        [-21, 12],
        [21, 12],
        [-22, -20],
        [22, -20],
        [-20, -38],
        [20, -38],
        [-14, 24],
        [14, 24],
      ].map(([x, z]) => (
        <Tree key={`o${x}:${z}`} x={x!} z={z!} s={1.2} />
      ))}
      {/* muro */}
      <B p={[-13.25, 0.6, 29]} s={[21.5, 1.2, 0.25]} c="#e7e5e4" />
      {/* grade metálica verde-escura na lateral direita */}
      <Fence x0={2.9} x1={24} z={29} />
      <B p={[0, 0.6, -41]} s={[48, 1.2, 0.25]} c="#e7e5e4" />
      <B p={[-24, 0.6, -6]} s={[0.25, 1.2, 70]} c="#e7e5e4" />
      <B p={[24, 0.6, -6]} s={[0.25, 1.2, 70]} c="#e7e5e4" />
      {/* portão de entrada */}
      <B p={[-2.6, 1.8, 29]} s={[0.5, 3.6, 0.5]} c={FACADE_COLOR} />
      <B p={[2.6, 1.8, 29]} s={[0.5, 3.6, 0.5]} c={FACADE_COLOR} />
      <B p={[0, 3.8, 29]} s={[5.8, 0.9, 0.3]} c={FACADE_COLOR} />
      <Sign
        lines={["EEEP DR. SALOMÃO ALVES DE MOURA", "ARACOIABA · CE"]}
        p={[0, 3.8, 29.16]}
        size={[5.6, 0.8]}
        bg={FACADE_COLOR}
        fg="#e5e7eb"
      />
      {/* mastros */}
      {[
        [4.5, "#16a34a", "#facc15"],
        [5.5, "#15803d", "#f8fafc"],
      ].map(([x, a, b]) => (
        <group key={String(x)} position={[x as number, 0, 25]}>
          <B p={[0, 2.5, 0]} s={[0.08, 5, 0.08]} c="#cbd5e1" />
          <B p={[0.4, 4.5, 0]} s={[0.8, 0.5, 0.02]} c={a as string} />
          <B p={[0.4, 4.5, 0.015]} s={[0.35, 0.22, 0.01]} c={b as string} r={[0, 0, Math.PI / 4]} />
        </group>
      ))}
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* Trilha, marcadores e itens                                          */
/* ------------------------------------------------------------------ */

function Marker({ room, state }: { room: Room; state: "next" | "todo" | "done" }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.6;
    ref.current.position.y =
      (room.walls === false ? 4 : 3.3) + Math.sin(clock.elapsedTime * 2.5) * 0.12;
  });
  const [x, z] = room.walls === false ? [room.x, room.z] : toWorld(room, 0, room.d / 2 + 0.3);
  const color = state === "done" ? "#22c55e" : state === "next" ? "#facc15" : "#a78bfa";
  return (
    <group position={[x, 0, z]}>
      <group ref={ref}>
        <mesh scale={state === "next" ? 1.5 : 1}>
          {state === "done" ? (
            <sphereGeometry args={[0.18, 12, 10]} />
          ) : (
            <octahedronGeometry args={[0.25]} />
          )}
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      </group>
      {state === "next" && room.walls !== false && (
        <mesh
          position={[
            ...(() => {
              const [fx, fz] = doorFront(room, 1.1);
              return [fx - x, 0.04, fz - z] as V3;
            })(),
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.55, 0.75, 32]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}

function ItemMesh({ item }: { item: CollectItem }) {
  switch (item) {
    case "document":
      return <B p={[0, 0, 0]} s={[0.3, 0.02, 0.4]} c="#f8fafc" e="#fde68a" ei={0.6} />;
    case "book":
    case "diary":
      return (
        <group>
          <B
            p={[0, 0, 0]}
            s={[0.3, 0.4, 0.08]}
            c={item === "book" ? "#7c3aed" : "#b91c1c"}
            e="#fde68a"
            ei={0.4}
          />
          <B p={[0.01, 0, 0]} s={[0.27, 0.37, 0.085]} c="#f8fafc" />
        </group>
      );
    case "ram":
      return (
        <group>
          <B p={[0, 0, 0]} s={[0.5, 0.14, 0.03]} c="#15803d" e="#22c55e" ei={0.4} />
          {[-0.15, 0, 0.15].map((x) => (
            <B key={x} p={[x, 0.01, 0.02]} s={[0.1, 0.08, 0.02]} c="#111827" />
          ))}
        </group>
      );
    case "ball":
      return (
        <mesh>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.3} />
        </mesh>
      );
    case "cable":
      return (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.035, 8, 20]} />
            <meshStandardMaterial color="#2563eb" emissive="#3b82f6" emissiveIntensity={0.4} />
          </mesh>
          <B p={[0.2, 0, 0]} s={[0.08, 0.06, 0.1]} c="#e5e7eb" e="#fde68a" ei={0.3} />
        </group>
      );
  }
}

function Collectible({ x, z, item }: { x: number; z: number; item: CollectItem }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 1.8;
    ref.current.position.y = 1.15 + Math.sin(clock.elapsedTime * 3) * 0.1;
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={ref}>
        <ItemMesh item={item} />
      </group>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.5, 28]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.3, 0.45, 1.2, 16, 1, true]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Jogador                                                             */
/* ------------------------------------------------------------------ */

export type CollectTarget = { missionId: string; x: number; z: number };

function Player({
  avatar,
  input,
  controls,
  posRef,
  paused,
  nextRoomId,
  goal,
  collectTargets,
  onRoomChange,
  onCollect,
}: {
  avatar: AvatarLook;
  input: { current: Vec2 };
  controls: { current: Controls };
  posRef: { current: Vec2 };
  paused: boolean;
  nextRoomId: string | null;
  goal: Vec2 | null;
  collectTargets: CollectTarget[];
  onRoomChange: (roomId: string | null) => void;
  onCollect: (missionId: string) => void;
}) {
  const body = useRef<Group>(null);
  const arrow = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const heading = useRef(Math.PI);
  const room = useRef<string | null>(null);
  const collected = useRef(new Set<string>());
  const cameraGoal = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const [moving, setMoving] = useState(false);

  // atalho só de desenvolvimento para testes: window.__eeep.tp(x, z)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __eeep?: { tp: (x: number, z: number) => void } };
    w.__eeep = {
      tp: (x, z) => {
        posRef.current.x = x;
        posRef.current.z = z;
      },
    };
    return () => {
      delete w.__eeep;
    };
  }, [posRef]);
  const action = useRef<AvatarAction>({
    running: false,
    airborne: false,
    punchAt: -1,
    punchSide: -1,
  });
  const height = useRef(0);
  const velocityY = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const pos = posRef.current;
    const { x: ix, z: iz } = input.current;
    const magnitude = Math.min(1, Math.hypot(ix, iz));
    const isMoving = !paused && magnitude > 0.08;
    const now = state.clock.elapsedTime;
    const ctl = controls.current;

    // pulo
    if (ctl.jump) {
      ctl.jump = false;
      if (!paused && height.current === 0) velocityY.current = 5.4;
    }
    if (height.current > 0 || velocityY.current > 0) {
      velocityY.current -= 15 * delta;
      height.current = Math.max(0, height.current + velocityY.current * delta);
      if (height.current === 0) velocityY.current = 0;
    }
    // soco (alterna as mãos)
    if (ctl.punch) {
      ctl.punch = false;
      if (!paused && now - action.current.punchAt > PUNCH_DURATION * 0.75) {
        action.current.punchAt = now;
        action.current.punchSide = action.current.punchSide === 1 ? -1 : 1;
      }
    }
    action.current.running = ctl.run;
    action.current.airborne = height.current > 0;

    if (isMoving) {
      const speed = (ctl.run ? 7.6 : 4.6) * magnitude;
      pos.x += (ix / Math.hypot(ix, iz)) * speed * delta;
      pos.z += (iz / Math.hypot(ix, iz)) * speed * delta;
      collide(pos);
      const target = Math.atan2(ix, iz);
      let diff = target - heading.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading.current += diff * Math.min(1, delta * 12);
    }
    if (isMoving !== moving) setMoving(isMoving);

    if (body.current) {
      body.current.position.set(pos.x, height.current, pos.z);
      body.current.rotation.y = heading.current;
    }
    if (shadow.current) shadow.current.position.set(pos.x, 0.02, pos.z);

    const current = rooms.find((r) => isInside(r, pos.x, pos.z))?.id ?? null;
    if (current !== room.current) {
      room.current = current;
      onRoomChange(current);
    }

    for (const target of collectTargets) {
      if (collected.current.has(target.missionId)) continue;
      if (Math.hypot(pos.x - target.x, pos.z - target.z) < 0.85) {
        collected.current.add(target.missionId);
        onCollect(target.missionId);
      }
    }

    if (arrow.current) {
      const next = nextRoomId ? roomById[nextRoomId] : undefined;
      const target: [number, number] | null =
        next && current !== nextRoomId
          ? next.walls === false
            ? [next.x, next.z]
            : doorFront(next, 0.5)
          : !next && goal
            ? [goal.x, goal.z]
            : null;
      arrow.current.visible = Boolean(target);
      if (target) {
        arrow.current.position.set(pos.x, 0.06, pos.z);
        arrow.current.rotation.y = Math.atan2(target[0] - pos.x, target[1] - pos.z);
      }
    }

    // celular em pé: ângulo maior e câmera mais afastada para ver mais da escola
    const aspect = state.size.width / Math.max(1, state.size.height);
    const portrait = aspect < 0.75;
    const camera = state.camera as PerspectiveCamera;
    const fov = portrait ? 68 : aspect < 1.2 ? 58 : 50;
    if (Math.abs(camera.fov - fov) > 0.1) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const k = portrait ? 1.2 : aspect < 1.2 ? 1.1 : 1;
    cameraGoal.current.set(pos.x, 10 * k, pos.z + 7.2 * k);
    state.camera.position.lerp(cameraGoal.current, 1 - Math.exp(-delta * 4));
    lookAt.current.set(pos.x, 0.8, pos.z - 0.6);
    state.camera.lookAt(lookAt.current);
  });

  return (
    <group>
      <group ref={body} position={[spawn[0], 0, spawn[1]]}>
        <DevAvatar look={avatar} moving={moving} action={action} />
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <group ref={arrow}>
        <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.22, 0.45, 3]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Alvo no chão (portaria)                                             */
/* ------------------------------------------------------------------ */

function GoalRing({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
  });
  return (
    <mesh ref={ref} position={[x, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.1, 1.45, 40]} />
      <meshBasicMaterial color="#facc15" transparent opacity={0.85} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Cena                                                                */
/* ------------------------------------------------------------------ */

export function SchoolScene({
  avatar,
  input,
  controls,
  posRef,
  paused,
  done,
  nextRoomId,
  goal,
  currentRoom,
  trail,
  onRoomChange,
  onCollect,
}: {
  avatar: AvatarLook;
  input: { current: Vec2 };
  controls: { current: Controls };
  posRef: { current: Vec2 };
  paused: boolean;
  done: Record<string, unknown>;
  nextRoomId: string | null;
  /** ponto para onde a seta aponta quando não há sala da trilha (ex.: portaria) */
  goal: Vec2 | null;
  currentRoom: string | null;
  /** missões da rota escolhida */
  trail: Mission[];
  onRoomChange: (roomId: string | null) => void;
  onCollect: (missionId: string) => void;
}) {
  const collectTargets = useMemo<CollectTarget[]>(
    () =>
      trail.flatMap((mission) => {
        if (mission.type !== "collect" || done[mission.id]) return [];
        const room = roomById[mission.room]!;
        const [x, z] = toWorld(room, mission.at[0], mission.at[1]);
        return [{ missionId: mission.id, x, z }];
      }),
    [done, trail],
  );

  return (
    <>
      {/* sol forte do interior do Ceará: luz direcional intensa e ambiente suave */}
      <color attach="background" args={["#9fd3ff"]} />
      <fog attach="fog" args={["#cde7ff", 32, 80]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#e0f2fe", "#8a7a5c", 0.95]} />
      <directionalLight position={[14, 26, 10]} intensity={2.5} color="#fff1cf" />

      <Grounds posRef={posRef} />
      {rooms.map((room) => (
        <RoomBlock key={room.id} room={room} />
      ))}
      <Walls posRef={posRef} />

      {trail.map((mission) => {
        const room = roomById[mission.room]!;
        const state = done[mission.id] ? "done" : nextRoomId === room.id ? "next" : "todo";
        return <Marker key={`${mission.id}-${state}`} room={room} state={state} />;
      })}
      {collectTargets.map((target) => {
        const mission = trail.find((m) => m.id === target.missionId);
        if (!mission || mission.type !== "collect") return null;
        return <Collectible key={target.missionId} x={target.x} z={target.z} item={mission.item} />;
      })}

      {rooms.map((room) => {
        const [x, z] =
          room.walls === false
            ? [room.x, room.z - room.d / 2 + 1]
            : toWorld(room, 0, room.d / 2 + 0.2);
        return (
          <Html
            key={`label-${room.id}`}
            position={[x, room.walls === false ? 4.6 : 3.9, z]}
            center
            distanceFactor={11}
            zIndexRange={[5, 0]}
          >
            <span className="pointer-events-none whitespace-nowrap rounded-md bg-[#120e24]/85 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              {room.name}
            </span>
          </Html>
        );
      })}

      {npcs.map((npc) => {
        const room = roomById[npc.room];
        if (!room) return null;
        const [x, z] = toWorld(room, npc.at[0], npc.at[1]);
        return (
          <group
            key={npc.id}
            position={[x, 0, z]}
            rotation={[0, doorAngle[room.door] + npc.face, 0]}
          >
            <NpcFigure
              look={npc.look}
              seated={npc.seated}
              label={currentRoom === npc.room ? npc.name : undefined}
              sublabel={npc.role === "Aluno(a)" ? undefined : npc.role}
            />
          </group>
        );
      })}
      {goal && <GoalRing x={goal.x} z={goal.z} />}

      <Player
        avatar={avatar}
        input={input}
        controls={controls}
        posRef={posRef}
        paused={paused}
        nextRoomId={nextRoomId}
        goal={goal}
        collectTargets={collectTargets}
        onRoomChange={onRoomChange}
        onCollect={onCollect}
      />
    </>
  );
}

export function SceneFallback({ children }: { children: ReactNode }) {
  return (
    <Html center>
      <span role="status" className="rounded-lg bg-[#120e24]/90 px-3 py-2 text-sm text-violet-100">
        {children}
      </span>
    </Html>
  );
}
