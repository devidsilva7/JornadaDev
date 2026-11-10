import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Float, Grid, Html, Sparkles } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Flag,
  Map,
  MapPin,
  PersonStanding,
  RotateCcw,
  X,
} from "lucide-react";
import { CatmullRomCurve3, Vector3 } from "three";
import { DevAvatar, type AvatarKind } from "./DevAvatar";
import type { Player } from "./LoginScreen";

type Direction = "up" | "down" | "left" | "right";
type VectorInput = { x: number; z: number };
type WorldProps = {
  avatar: AvatarKind;
  input: { current: VectorInput };
  visited: number[];
  completed: boolean;
  onCheckpoint: (checkpoint: number) => void;
  onFinish: () => void;
};

const checkpoints = [
  {
    title: "1º Ano — Fundamentos",
    location: "Portal de Entrada",
    question: "O que você espera descobrir e aprender no seu 1º ano no curso de Desenvolvimento de Sistemas?",
    position: [0, 0, 3.8] as [number, number, number],
  },
  {
    title: "2º Ano — Aprofundamento",
    location: "Laboratório de TI",
    question: "No 2º ano a complexidade aumenta. Como você se projeta criando bancos de dados e sistemas reais?",
    position: [7, 0, -2] as [number, number, number],
  },
  {
    title: "3º Ano — O Futuro & Expotec",
    location: "Auditório / Palco da Expotec",
    question: "Chegamos ao 3º ano e à Expotec! Qual é a sua maior expectativa para a sua carreira e futuro no mercado?",
    position: [-5, 0, -8] as [number, number, number],
  },
] as const;

const goalPosition = new Vector3(0, 0, -14);
const trailPoints = [
  new Vector3(0, 0.06, 11),
  new Vector3(0, 0.06, 6),
  new Vector3(0, 0.06, 3.8),
  new Vector3(0, 0.06, 1),
  new Vector3(3.2, 0.06, 0.8),
  new Vector3(7, 0.06, -2),
  new Vector3(7, 0.06, -4.5),
  new Vector3(4, 0.06, -5),
  new Vector3(0, 0.06, -5),
  new Vector3(-3.2, 0.06, -5.8),
  new Vector3(-5, 0.06, -8),
  new Vector3(-5, 0.06, -10),
  new Vector3(-3, 0.06, -12),
  new Vector3(0, 0.06, -14),
];
const trailCurve = new CatmullRomCurve3(trailPoints);

const directionVectors: Record<Direction, VectorInput> = {
  up: { x: 0, z: -1 },
  down: { x: 0, z: 1 },
  left: { x: -1, z: 0 },
  right: { x: 1, z: 0 },
};

const directionIcons = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
} as const;

const directionLabels: Record<Direction, string> = {
  up: "Caminhar para frente",
  down: "Caminhar para trás",
  left: "Caminhar para a esquerda",
  right: "Caminhar para a direita",
};

function CampusBuilding({
  position,
  size,
  label,
  accent,
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  accent: string;
}) {
  const [width, height, depth] = size;
  const windowCount = Math.max(2, Math.floor(width / 1.65));
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#211736" roughness={0.78} />
      </mesh>
      <mesh position={[0, height + 0.08, 0]}>
        <boxGeometry args={[width + 0.28, 0.16, depth + 0.28]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
      </mesh>
      {Array.from({ length: windowCount }, (_, index) => {
        const x = (index - (windowCount - 1) / 2) * (width / windowCount);
        return (
          <mesh key={index} position={[x, height * 0.62, depth / 2 + 0.012]}>
            <boxGeometry args={[0.72, 0.72, 0.035]} />
            <meshStandardMaterial color="#b9a2ff" emissive="#7c3aed" emissiveIntensity={1.4} />
          </mesh>
        );
      })}
      <mesh position={[0, height * 0.28, depth / 2 + 0.02]}>
        <boxGeometry args={[0.8, height * 0.48, 0.07]} />
        <meshStandardMaterial color="#120e24" />
      </mesh>
      <Html position={[0, height + 0.55, depth / 2]} center distanceFactor={17} occlude>
        <span className="whitespace-nowrap rounded-lg border border-violet-300/30 bg-[#120e24]/90 px-2 py-1 font-mono text-[10px] text-violet-100 shadow-[0_0_16px_rgba(124,58,237,0.3)]">
          {label}
        </span>
      </Html>
    </group>
  );
}

function CheckpointPortal({ position, index, location }: { position: [number, number, number]; index: number; location: string }) {
  const ring = useRef<import("three").Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.28;
  });
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <circleGeometry args={[1.65, 48]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.12} />
      </mesh>
      <mesh ref={ring} position={[0, 1.5, 0]}>
        <torusGeometry args={[1.05, 0.075, 12, 48]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#9333ea" emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[0, 1.55, -0.02]}>
        <torusGeometry args={[0.78, 0.018, 8, 48]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#9333ea" intensity={3} distance={5} />
      <Html position={[0, 3, 0]} center distanceFactor={13}>
        <div className="whitespace-nowrap rounded-xl border border-violet-300/40 bg-[#120e24]/90 px-3 py-1.5 text-center shadow-[0_0_24px_rgba(124,58,237,0.35)]">
          <span className="block font-mono text-[9px] uppercase tracking-widest text-violet-300">Checkpoint 0{index + 1}</span>
          <span className="block text-xs font-semibold text-white">{location}</span>
        </div>
      </Html>
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 1.5, 7]} />
        <meshStandardMaterial color="#53396e" />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <coneGeometry args={[0.88, 1.9, 8]} />
        <meshStandardMaterial color="#342550" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.85, 0]} scale={0.98}>
        <coneGeometry args={[0.9, 1.85, 8]} />
        <meshStandardMaterial color="#7c3aed" wireframe transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

function CampusScene({ avatar, input, visited, completed, onCheckpoint, onFinish }: WorldProps) {
  const player = useRef<import("three").Group>(null);
  const position = useRef(new Vector3(0, 0, 11));
  const heading = useRef(new Vector3(0, 0, -1));
  const nextCameraPosition = useRef(new Vector3());
  const target = useRef(new Vector3());
  const triggered = useRef(new Set<number>());
  const finishTriggered = useRef(false);
  const [moving, setMoving] = useState(false);

  useFrame(({ camera }, delta) => {
    const rawInput = input.current;
    const length = Math.hypot(rawInput.x, rawInput.z);
    const isMoving = length > 0;
    if (isMoving && !completed) {
      const directionX = rawInput.x / length;
      const directionZ = rawInput.z / length;
      heading.current.set(directionX, 0, directionZ);
      position.current.x = Math.max(-13, Math.min(13, position.current.x + directionX * delta * 4.1));
      position.current.z = Math.max(-16, Math.min(13, position.current.z + directionZ * delta * 4.1));
    }

    if (moving !== isMoving) setMoving(isMoving);
    if (player.current) {
      player.current.position.copy(position.current);
      player.current.rotation.y = Math.atan2(heading.current.x, heading.current.z);
    }

    if (!completed) {
      checkpoints.forEach((checkpoint, index) => {
        if (visited.includes(index) || triggered.current.has(index)) return;
        const dx = position.current.x - checkpoint.position[0];
        const dz = position.current.z - checkpoint.position[2];
        if (Math.hypot(dx, dz) < 1.65) {
          triggered.current.add(index);
          onCheckpoint(index);
        }
      });

      if (!finishTriggered.current && visited.length === checkpoints.length && position.current.distanceTo(goalPosition) < 1.7) {
        finishTriggered.current = true;
        onFinish();
      }
    }

    nextCameraPosition.current
      .set(
        position.current.x - heading.current.x * 5.2,
        position.current.y + 3.15,
        position.current.z - heading.current.z * 5.2,
      );
    target.current.set(position.current.x, 1.15, position.current.z);
    camera.position.lerp(nextCameraPosition.current, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(target.current);
  });

  return (
    <>
      <color attach="background" args={["#0f0b1e"]} />
      <fog attach="fog" args={["#0f0b1e", 27, 62]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#c4b5fd", "#171024", 1.2]} />
      <directionalLight position={[5, 12, 8]} intensity={2.3} color="#f4efff" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 5, 1]} intensity={16} distance={26} color="#7c3aed" />
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <boxGeometry args={[42, 0.3, 48]} />
        <meshStandardMaterial color="#171126" roughness={0.94} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[42, 48]}
        cellSize={1}
        cellThickness={0.35}
        cellColor="#49336e"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#6342a1"
        fadeDistance={38}
        fadeStrength={1.4}
        infiniteGrid={false}
      />

      {trailPoints.slice(0, -1).map((point, index) => {
        const next = trailPoints[index + 1]!;
        const dx = next.x - point.x;
        const dz = next.z - point.z;
        const distance = Math.hypot(dx, dz);
        return (
          <mesh
            key={index}
            position={[(point.x + next.x) / 2, 0.018, (point.z + next.z) / 2]}
            rotation={[0, Math.atan2(dx, dz), 0]}
            receiveShadow
          >
            <boxGeometry args={[1.6, 0.08, distance + 0.25]} />
            <meshStandardMaterial color="#30204b" emissive="#4c1d95" emissiveIntensity={0.42} roughness={0.72} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.09, 0]}>
        <tubeGeometry args={[trailCurve, 240, 0.055, 8, false]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#9333ea" emissiveIntensity={2.8} />
      </mesh>
      <mesh position={[0.12, 0.075, 0]}>
        <tubeGeometry args={[trailCurve, 240, 0.018, 6, false]} />
        <meshBasicMaterial color="white" />
      </mesh>

      <CampusBuilding position={[-10, 0, -0.5]} size={[5.2, 3.7, 4.2]} label="EEEP · BLOCO A" accent="#7c3aed" />
      <CampusBuilding position={[9.5, 0, 1]} size={[5.7, 3.7, 4.5]} label="LABORATÓRIO DE TI" accent="#9333ea" />
      <CampusBuilding position={[-9, 0, -9]} size={[6.3, 4.2, 5]} label="AUDITÓRIO · EXPOTEC" accent="#8b5cf6" />
      <CampusBuilding position={[8.5, 0, -11.5]} size={[5.5, 3.5, 4.5]} label="ESPAÇO DE PROJETOS" accent="#6d28d9" />

      <group position={[0, 0, 7]}>
        <mesh position={[-2, 1.7, 0]} castShadow>
          <boxGeometry args={[0.38, 3.4, 0.45]} />
          <meshStandardMaterial color="#e9ddff" emissive="#7c3aed" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[2, 1.7, 0]} castShadow>
          <boxGeometry args={[0.38, 3.4, 0.45]} />
          <meshStandardMaterial color="#e9ddff" emissive="#7c3aed" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 3.34, 0]} castShadow>
          <boxGeometry args={[4.38, 0.38, 0.55]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#9333ea" emissiveIntensity={1.1} />
        </mesh>
        <Html position={[0, 3.85, 0]} center distanceFactor={15}>
          <span className="whitespace-nowrap rounded-lg border border-violet-200/40 bg-[#120e24]/90 px-3 py-1 font-mono text-[10px] tracking-widest text-white">BEM-VINDO À EEEP</span>
        </Html>
      </group>

      {checkpoints.map((checkpoint, index) => (
        <CheckpointPortal key={checkpoint.title} position={checkpoint.position} index={index} location={checkpoint.location} />
      ))}
      <group position={[0, 0, -14]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
          <meshStandardMaterial color="#e9ddff" emissive="#9333ea" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.38, 0.72, 0]}>
          <boxGeometry args={[0.7, 0.34, 0.05]} />
          <meshStandardMaterial color="#9333ea" emissive="#7c3aed" emissiveIntensity={1.3} />
        </mesh>
        <pointLight position={[0, 1, 0]} intensity={5} distance={5} color="#c4b5fd" />
        <Html position={[0, 1.65, 0]} center distanceFactor={14}>
          <span className="whitespace-nowrap rounded-lg border border-violet-200/40 bg-[#120e24]/90 px-3 py-1 font-mono text-[10px] tracking-widest text-white">CHEGADA · SEU FUTURO</span>
        </Html>
      </group>

      {[
        [-14, 0, 7], [14, 0, 7], [-13, 0, -2], [13, 0, -4],
        [-13, 0, -13], [13, 0, -14], [-7, 0, 4], [10, 0, -7],
      ].map((position, index) => (
        <Tree key={index} position={position as [number, number, number]} scale={index % 2 === 0 ? 1 : 0.82} />
      ))}

      <group ref={player}>
        <Float speed={moving ? 0 : 1.6} floatIntensity={moving ? 0 : 0.025} rotationIntensity={0}>
          <DevAvatar kind={avatar} moving={moving} />
        </Float>
        <pointLight position={[0, 1.1, 0]} color="#9333ea" intensity={0.75} distance={2.8} />
      </group>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.48} scale={7} blur={2.6} far={5} />
      <Sparkles count={completed ? 170 : 48} scale={[24, 8, 28]} size={completed ? 4 : 2} speed={completed ? 2 : 0.3} color="#c4b5fd" />
      {completed && <Sparkles count={180} scale={[18, 12, 18]} size={5} speed={3} color="#ffffff" />}
    </>
  );
}

export function TrailGameScreen({
  player,
  avatar,
  onExit,
}: {
  player: Player;
  avatar: AvatarKind;
  onExit: () => void;
}) {
  const input = useRef<VectorInput>({ x: 0, z: 0 });
  const [activeCheckpoint, setActiveCheckpoint] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [expectations, setExpectations] = useState<Record<number, string>>({});
  const [visited, setVisited] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const stop = useCallback(() => {
    input.current = { x: 0, z: 0 };
  }, []);

  const move = useCallback((direction: Direction) => {
    if (activeCheckpoint !== null || completed) return;
    input.current = directionVectors[direction];
  }, [activeCheckpoint, completed]);

  const arriveAtCheckpoint = useCallback((checkpoint: number) => {
    stop();
    setVisited((current) => current.includes(checkpoint) ? current : [...current, checkpoint]);
    setActiveCheckpoint(checkpoint);
    setDraft("");
  }, [stop]);

  useEffect(() => {
    const keys = new Set<string>();
    const updateMovement = () => {
      if (activeCheckpoint !== null || completed) {
        stop();
        return;
      }
      input.current = {
        x: Number(keys.has("ArrowRight") || keys.has("d")) - Number(keys.has("ArrowLeft") || keys.has("a")),
        z: Number(keys.has("ArrowDown") || keys.has("s")) - Number(keys.has("ArrowUp") || keys.has("w")),
      };
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)) return;
      event.preventDefault();
      keys.add(key);
      updateMovement();
    };
    const keyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      keys.delete(key);
      updateMovement();
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", stop);
      stop();
    };
  }, [activeCheckpoint, completed, stop]);

  const saveExpectation = () => {
    if (activeCheckpoint === null || !draft.trim()) return;
    setExpectations((current) => ({ ...current, [activeCheckpoint]: draft.trim() }));
    setActiveCheckpoint(null);
    setDraft("");
  };

  return (
    <main className="relative h-[100dvh] min-h-[520px] overflow-hidden bg-[#0f0b1e] text-white">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 3.2, 16], fov: 47, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        className="absolute inset-0"
        fallback={<WebGLFallback />}
      >
        <Suspense fallback={<Html center><span role="status" className="rounded-lg bg-[#120e24]/90 px-3 py-2 text-sm text-violet-100">Carregando a escola 3D...</span></Html>}>
          <CampusScene
            avatar={avatar}
            input={input}
            visited={visited}
            completed={completed}
            onCheckpoint={arriveAtCheckpoint}
            onFinish={() => {
              stop();
              setCompleted(true);
            }}
          />
        </Suspense>
      </Canvas>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-[#0f0b1e]/95 via-[#0f0b1e]/75 to-transparent px-4 pb-8 pt-4 sm:px-7">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/15 text-violet-100">
            <PersonStanding className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display font-bold">{player.nome}</p>
            <p className="truncate text-xs text-white/55">{avatar === "boy" ? "Garoto Dev" : "Garota Dev"} <span aria-hidden="true">·</span> {player.local}</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#120e24]/80 px-3 py-2 text-xs text-white/70 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-violet-300" />
            EEEP Dr. Salomão Alves de Moura
          </div>
          <button
            type="button"
            onClick={() => setShowRoadmap(true)}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#120e24]/85 px-3 py-2 text-sm transition hover:border-violet-300/50"
          >
            <Map className="h-4 w-4 text-violet-200" /><span className="hidden sm:inline">Jornada</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              onExit();
            }}
            aria-label="Voltar à identificação"
            className="rounded-xl border border-white/15 bg-[#120e24]/85 p-2 transition hover:border-violet-300/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!completed && activeCheckpoint === null && (
        <div className="pointer-events-none absolute left-4 top-[84px] z-10 rounded-2xl border border-white/10 bg-[#120e24]/75 px-3 py-2 backdrop-blur-md sm:left-7">
          <p className="font-mono text-[10px] uppercase tracking-widest text-violet-300">Trilha das Expectativas</p>
          <p className="mt-1 text-xs text-white/75">Siga o caminho roxo até os portais de cada ano.</p>
        </div>
      )}

      <div className="absolute bottom-5 left-5 z-10 hidden rounded-xl border border-white/10 bg-[#120e24]/75 px-3 py-2 text-xs text-white/65 backdrop-blur md:block">
        Mover: <kbd className="rounded border border-white/15 px-1.5 py-0.5">W</kbd>{" "}
        <kbd className="rounded border border-white/15 px-1.5 py-0.5">A</kbd>{" "}
        <kbd className="rounded border border-white/15 px-1.5 py-0.5">S</kbd>{" "}
        <kbd className="rounded border border-white/15 px-1.5 py-0.5">D</kbd> ou setas
      </div>

      <div
        className="absolute bottom-5 right-5 z-10 grid grid-cols-3 gap-2 select-none touch-none sm:bottom-7 sm:right-7"
        aria-label="Controles direcionais"
      >
        <span />
        <DirectionButton direction="up" onPress={move} onRelease={stop} disabled={completed || activeCheckpoint !== null} />
        <span />
        <DirectionButton direction="left" onPress={move} onRelease={stop} disabled={completed || activeCheckpoint !== null} />
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#120e24]/70 text-violet-200/80 backdrop-blur">
          <PersonStanding className="h-5 w-5" />
        </div>
        <DirectionButton direction="right" onPress={move} onRelease={stop} disabled={completed || activeCheckpoint !== null} />
        <span />
        <DirectionButton direction="down" onPress={move} onRelease={stop} disabled={completed || activeCheckpoint !== null} />
        <span />
      </div>

      <AnimatePresence>
        {activeCheckpoint !== null && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#0f0b1e]/75 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkpoint-title"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="my-auto w-full max-w-xl rounded-3xl border border-violet-300/25 bg-[#171126] p-6 shadow-[0_0_60px_rgba(124,58,237,0.24)] sm:p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/15 text-violet-200">
                <MapPin className="h-6 w-6" />
              </div>
              <p className="mt-5 font-mono text-xs uppercase tracking-widest text-violet-300">Checkpoint alcançado · {checkpoints[activeCheckpoint]?.location}</p>
              <h2 id="checkpoint-title" className="mt-1 font-display text-2xl font-bold">{checkpoints[activeCheckpoint]?.title}</h2>
              <p className="mt-3 leading-relaxed text-white/80">{checkpoints[activeCheckpoint]?.question}</p>
              <label htmlFor="expectation-answer" className="mt-5 block text-sm font-medium">Sua expectativa</label>
              <textarea
                id="expectation-answer"
                autoFocus
                rows={4}
                maxLength={1000}
                value={draft}
                onChange={(event) => setDraft(event.currentTarget.value)}
                placeholder="Escreva aqui o que você espera para essa etapa..."
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#0f0b1e] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30"
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-white/45">{draft.length}/1000</span>
                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={saveExpectation}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Salvar e continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completed && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#0f0b1e]/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              aria-labelledby="future-map-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="my-auto w-full max-w-2xl rounded-3xl border border-violet-300/25 bg-[#171126]/95 p-6 shadow-[0_0_80px_rgba(124,58,237,0.3)] sm:p-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.15 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-[0_0_32px_rgba(147,51,234,0.48)]"
                >
                  <Flag className="h-7 w-7" />
                </motion.div>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-violet-300">Você chegou ao seu futuro</p>
                <h2 id="future-map-title" className="mt-1 font-display text-3xl font-bold">Meu Mapa do Futuro na EEEP</h2>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-display font-bold">{player.nome}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 text-violet-300" />{player.local}</p>
              </div>

              <ol className="relative mt-5 space-y-3 before:absolute before:bottom-4 before:left-3.5 before:top-4 before:w-px before:bg-violet-400/30">
                {checkpoints.map((checkpoint, index) => (
                  <li key={checkpoint.title} className="relative flex gap-3">
                    <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-300/40 bg-[#171126] font-mono text-xs text-violet-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
                      <p className="font-display text-sm font-semibold">{checkpoint.title}</p>
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/60">{expectations[index] ?? "Sem expectativa registrada."}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoadmap(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold transition hover:border-violet-300/50"
                >
                  <Map className="h-4 w-4" /> Ver mapa da jornada
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    onExit();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.25)] transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" /> Reiniciar Jornada
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRoadmap && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-[#0f0b1e]/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRoadmap(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="roadmap-title"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-6 shadow-[0_0_48px_rgba(124,58,237,0.2)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-violet-300">A Trilha das Expectativas</p>
                  <h2 id="roadmap-title" className="mt-1 font-display text-2xl font-bold">Mapa da jornada</h2>
                </div>
                <button type="button" aria-label="Fechar mapa da jornada" onClick={() => setShowRoadmap(false)} className="rounded-lg border border-white/10 p-2 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-5 space-y-3">
                {checkpoints.map((checkpoint, index) => (
                  <li key={checkpoint.title} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="flex items-center gap-2 font-semibold"><span className="font-mono text-violet-300">0{index + 1}</span>{checkpoint.title}</p>
                    <p className="mt-1 text-xs text-white/40">{checkpoint.location}</p>
                    {expectations[index] ? (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/65">{expectations[index]}</p>
                    ) : (
                      <p className="mt-2 text-sm italic text-white/40">Ainda não visitado</p>
                    )}
                  </li>
                ))}
              </ol>
              {completed && <p className="mt-4 flex items-center gap-2 text-sm text-violet-200"><Check className="h-4 w-4" /> Trilha concluída por {player.nome}.</p>}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sr-only" aria-live="polite">
        {activeCheckpoint !== null ? `Checkpoint: ${checkpoints[activeCheckpoint]?.title}` : completed ? "Jornada concluída." : "Explore a EEEP usando as teclas WASD, as setas ou os controles na tela."}
      </div>
    </main>
  );
}

function WebGLFallback() {
  return (
    <div role="alert" className="flex h-full items-center justify-center bg-[#0f0b1e] px-6 text-center text-white">
      Seu navegador não oferece suporte a WebGL. Tente abrir a jornada em um navegador atualizado.
    </div>
  );
}

function DirectionButton({
  direction,
  onPress,
  onRelease,
  disabled,
}: {
  direction: Direction;
  onPress: (direction: Direction) => void;
  onRelease: () => void;
  disabled: boolean;
}) {
  const Icon = directionIcons[direction];
  return (
    <button
      type="button"
      aria-label={directionLabels[direction]}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress(direction);
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onLostPointerCapture={onRelease}
      onContextMenu={(event) => event.preventDefault()}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-[#120e24]/85 text-violet-100 shadow-lg backdrop-blur transition active:scale-95 active:border-violet-300 disabled:cursor-not-allowed disabled:opacity-35"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
