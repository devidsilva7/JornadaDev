import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronsUp,
  BookOpen,
  Flag,
  GraduationCap,
  FlaskConical,
  Hand,
  School,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Shirt,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { SceneFallback, SchoolScene, type Controls, type Vec2 } from "./SchoolWorld";
import { ActionButton, Joystick } from "./Controls";
import { GuidePortrait } from "./GuidePortrait";
import { CourseQuiz } from "./CourseQuiz";
import { hasPlayed, playerKey } from "@/game/ranking";
import type { Player } from "../LoginScreen";
import { describeLook, fardaOptions, type AvatarLook } from "@/game/avatar";
import {
  COURSE_ROOMS,
  courseContent,
  labInfo,
  corridors,
  courtyard,
  atPortaria,
  toWorld,
  missionByRoom,
  missions,
  portaria,
  roomById,
  rooms,
  spawn,
  worldSize,
  XP_FIRST_TRY_BONUS,
  XP_PER_MISSION,
  type Mission,
  type Route,
} from "@/game/school";
import { guide, npcs } from "@/game/people";

type Done = Record<string, { xp: number; answer?: string; skipped?: boolean }>;

/** Texto da opção para pular a pergunta de expectativa. */
const SKIP_TEXT = "Prefiro não responder";
const isSkip = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .trim() === "prefiro nao responder";
type Toast = { title: string; text: string; xp: number };

export function SchoolGameScreen({
  player,
  avatar,
  onExit,
}: {
  player: Player;
  avatar: AvatarLook;
  onExit: () => void;
}) {
  const input = useRef<Vec2>({ x: 0, z: 0 });
  const controls = useRef<Controls>({ run: false, jump: false, punch: false });
  const posRef = useRef<Vec2>({ x: spawn[0], z: spawn[1] });

  const [done, setDone] = useState<Done>({});
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [openMission, setOpenMission] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<{ wrong: number[]; solved: boolean }>({
    wrong: [],
    solved: false,
  });
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [runToggle, setRunToggle] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState<Vec2>({ x: spawn[0], z: spawn[1] });
  const [look, setLook] = useState<AvatarLook>(avatar);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPortaria, setShowPortaria] = useState(false);
  const [teleporting, setTeleporting] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  /** Este jogador (pelo WhatsApp) já concluiu o quiz? Então não pode refazer. */
  const [quizDone, setQuizDone] = useState(() => hasPlayed(playerKey(player.contato)));
  const [route, setRoute] = useState<Route | null>(null);

  /* Rota "curso": só as salas de DS. Rota "escola": a trilha completa. */
  const trail = useMemo(
    () =>
      route === "curso"
        ? missions.filter((m) => (COURSE_ROOMS as readonly string[]).includes(m.room))
        : missions,
    [route],
  );
  const routeRef = useRef(route);
  routeRef.current = route;
  const trailRef = useRef(trail);
  trailRef.current = trail;

  /* 1. No portão: só uma mensagem de boas-vindas */
  useEffect(() => {
    const id = window.setTimeout(() => setShowWelcome(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  /* 2. Ao chegar na placa PORTARIA · ENTRADA: escola ou curso? */
  useEffect(() => {
    if (route || showWelcome || showPortaria) return;
    const id = window.setInterval(() => {
      const { x, z } = posRef.current;
      if (atPortaria(x, z)) setShowPortaria(true);
    }, 150);
    return () => window.clearInterval(id);
  }, [route, showWelcome, showPortaria]);

  /* 3. Rota do curso: o jogador é levado direto para as salas de DS */
  /** Leva o boneco para dentro de uma sala (corredor entre as carteiras), com fade. */
  const teleportTo = useCallback((roomId: string, label: string) => {
    const room = roomById[roomId];
    if (!room) return;
    input.current = { x: 0, z: 0 };
    setTeleporting(label);
    window.setTimeout(() => {
      const [x, z] = toWorld(room, 0.75, room.d / 2 - 0.7);
      posRef.current.x = x;
      posRef.current.z = z;
    }, 450);
    window.setTimeout(() => setTeleporting(null), 1100);
  }, []);

  const chooseRoute = (choice: Route) => {
    setShowPortaria(false);
    setRoute(choice);
    if (choice === "curso") teleportTo(COURSE_ROOMS[0], "Indo para a sala do 1º ano de DS...");
  };

  /* Laboratórios: só exploração. Ao entrar, abre o modal que apresenta o espaço. */
  const [openLab, setOpenLab] = useState<string | null>(null);
  useEffect(() => {
    if (!currentRoom || !labInfo[currentRoom]) return;
    input.current = { x: 0, z: 0 };
    setOpenLab(currentRoom);
  }, [currentRoom]);
  const activeLab = openLab ? labInfo[openLab] : undefined;

  const paused =
    openLab !== null ||
    openMission !== null ||
    showMap ||
    showFinal ||
    showWelcome ||
    showPortaria ||
    showQuiz ||
    teleporting !== null;
  const nextMission = route ? trail.find((mission) => !done[mission.id]) : undefined;
  const nextRoomId = nextMission?.room ?? null;
  const roomMission =
    currentRoom && trail.some((m) => m.room === currentRoom)
      ? missionByRoom[currentRoom]
      : undefined;
  const totalXp = useMemo(
    () => Object.values(done).reduce((sum, item) => sum + item.xp, 0),
    [done],
  );
  const roomPeople = currentRoom ? npcs.filter((npc) => npc.room === currentRoom) : [];
  const doneCount = trail.filter((m) => done[m.id]).length;

  const stop = useCallback(() => {
    input.current = { x: 0, z: 0 };
  }, []);

  const complete = useCallback(
    (mission: Mission, xp: number, text: string, answer?: string, skipped = false) => {
      setDone((current) => {
        if (current[mission.id]) return current;
        const entry = { xp, ...(answer ? { answer } : {}), ...(skipped ? { skipped } : {}) };
        const next = { ...current, [mission.id]: entry };
        const list = trailRef.current;
        // a rota da escola termina no Mapa do Futuro (a do curso abre o quiz em finishReflection)
        if (
          routeRef.current === "escola" &&
          list.every((m) => next[m.id]) &&
          list.some((m) => !current[m.id])
        ) {
          window.setTimeout(() => setShowFinal(true), 1600);
        }
        return next;
      });
      setToast({ title: mission.title, text, xp });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const onCollect = useCallback(
    (missionId: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (mission?.type === "collect") complete(mission, XP_PER_MISSION, mission.success);
    },
    [complete],
  );

  const onRoomChange = useCallback((roomId: string | null) => setCurrentRoom(roomId), []);

  const startMission = useCallback(
    (mission: Mission) => {
      stop();
      setQuiz({ wrong: [], solved: false });
      setDraft("");
      setOpenMission(mission.id);
    },
    [stop],
  );

  /**
   * Conclui a pergunta de expectativa de uma sala de DS (respondida ou pulada).
   * Na rota do curso o boneco pula sozinho para a próxima sala e, depois do 3º ano,
   * o quiz abre na hora.
   */
  const finishReflection = (mission: Mission, answer: string | null) => {
    const skipped = answer === null;
    complete(
      mission,
      XP_PER_MISSION,
      skipped ? "Tudo bem! Seguimos em frente." : "Sua expectativa foi guardada no Mapa do Futuro.",
      answer ?? undefined,
      skipped,
    );
    setOpenMission(null);
    if (route !== "curso") return;
    const index = (COURSE_ROOMS as readonly string[]).indexOf(mission.room);
    const nextRoom = COURSE_ROOMS[index + 1];
    if (nextRoom) {
      teleportTo(nextRoom, `Indo para a sala do ${index + 2}º ano de DS...`);
    } else {
      setToast(null);
      setShowQuiz(true);
    }
  };

  /* Nas salas de DS a pergunta de expectativa aparece assim que o jogador entra */
  const doneRef = useRef(done);
  doneRef.current = done;
  useEffect(() => {
    const mission = currentRoom ? missionByRoom[currentRoom] : undefined;
    if (!routeRef.current) return;
    if (!mission || mission.type !== "reflection" || doneRef.current[mission.id]) return;
    const id = window.setTimeout(() => startMission(mission), 350);
    return () => window.clearTimeout(id);
  }, [currentRoom, startMission]);

  /* teclado */
  useEffect(() => {
    const keys = new Set<string>();
    const sync = () => {
      if (paused) {
        stop();
        return;
      }
      input.current = {
        x:
          Number(keys.has("arrowright") || keys.has("d")) -
          Number(keys.has("arrowleft") || keys.has("a")),
        z:
          Number(keys.has("arrowdown") || keys.has("s")) -
          Number(keys.has("arrowup") || keys.has("w")),
      };
    };
    const typing = (event: KeyboardEvent) =>
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
    const down = (event: KeyboardEvent) => {
      if (typing(event)) return;
      const key = event.key.toLowerCase();
      if (key === "shift") controls.current.run = true;
      if (key === " ") {
        event.preventDefault();
        controls.current.jump = true;
      }
      if (key === "f" || key === "j") controls.current.punch = true;
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        keys.add(key);
        sync();
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "shift") controls.current.run = runToggle;
      keys.delete(key);
      sync();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", stop);
    };
  }, [paused, runToggle, stop]);

  useEffect(() => {
    controls.current.run = runToggle;
  }, [runToggle]);

  useEffect(() => {
    if (paused) stop();
  }, [paused, stop]);

  const activeMission = openMission ? missions.find((m) => m.id === openMission) : undefined;

  return (
    <main className="relative h-[100dvh] min-h-[480px] overflow-hidden bg-[#bfe3ff] text-white">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [spawn[0], 12, spawn[1] + 9], fov: 50, near: 0.1, far: 140 }}
        gl={{ antialias: true }}
        className="absolute inset-0"
        fallback={<WebGLFallback />}
      >
        <Suspense fallback={<SceneFallback>Carregando a EEEP...</SceneFallback>}>
          <SchoolScene
            avatar={look}
            input={input}
            controls={controls}
            posRef={posRef}
            paused={paused}
            done={done}
            nextRoomId={nextRoomId}
            goal={route ? null : portaria}
            currentRoom={currentRoom}
            trail={route ? trail : []}
            onRoomChange={onRoomChange}
            onCollect={onCollect}
          />
        </Suspense>
      </Canvas>

      {/* ---------------- HUD ---------------- */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 bg-gradient-to-b from-[#0f0b1e]/85 to-transparent px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold">{player.nome}</p>
          <p className="truncate text-[11px] text-white/70">{describeLook(look)}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold">
            <span className="flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[#1c1206]">
              <Star className="h-3 w-3 fill-current" /> {totalXp} XP
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {route === "curso" ? "Salas de DS" : "Missões"} {doneCount}/{trail.length}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-expanded={showWardrobe}
            onClick={() => setShowWardrobe((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#120e24]/80 px-3 py-2 text-sm font-semibold"
          >
            <Shirt className="h-4 w-4" /> Farda
          </button>
          {showWardrobe && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-white/15 bg-[#171126]/95 p-2 shadow-2xl backdrop-blur">
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Trocar farda
              </p>
              {fardaOptions.map((option) => {
                const active = look.outfit === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      const next = { ...look, outfit: option.id };
                      setLook(next);
                      setShowWardrobe(false);
                      try {
                        window.localStorage.setItem("jornada-eeep:avatar", JSON.stringify(next));
                      } catch {
                        /* armazenamento indisponível */
                      }
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm ${
                      active ? "bg-violet-500/25" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border-2 border-white/40"
                      style={{ backgroundColor: option.swatch }}
                    />
                    <span className="flex-1 font-semibold">{option.name}</span>
                    {active && <Check className="h-4 w-4 text-violet-200" />}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setMapSnapshot({ ...posRef.current });
              setShowMap(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#120e24]/80 px-3 py-2 text-sm font-semibold"
          >
            <MapIcon className="h-4 w-4" /> Mapa
          </button>
          <button
            type="button"
            aria-label="Sair do jogo"
            onClick={() => {
              stop();
              onExit();
            }}
            className="rounded-xl border border-white/20 bg-[#120e24]/80 p-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Objetivo / missão do local */}
      <div className="pointer-events-none absolute inset-x-3 top-[5.5rem] z-10 flex justify-center">
        {currentRoom && labInfo[currentRoom] ? (
          <button
            type="button"
            onClick={() => {
              stop();
              setOpenLab(currentRoom);
            }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-violet-600/90 px-3 py-1.5 text-xs font-bold"
          >
            <FlaskConical className="h-3.5 w-3.5" /> {roomById[currentRoom]?.name} · Exploração ·
            ver informações
          </button>
        ) : roomMission && !done[roomMission.id] ? (
          <motion.div
            key={roomMission.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-amber-300/50 bg-[#120e24]/90 p-3 shadow-xl backdrop-blur"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
              {roomById[roomMission.room]?.name} · Missão
            </p>
            <p className="font-display font-bold">{roomMission.title}</p>
            <p className="mt-0.5 text-xs text-white/75">{roomMission.intro}</p>
            {roomPeople.length > 0 && (
              <p className="mt-1.5 text-[11px] text-white/60">
                Na sala: {roomPeople.map((npc) => npc.name).join(", ")}
              </p>
            )}
            {roomMission.type === "collect" ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                <Sparkles className="h-3.5 w-3.5" /> Encontre: {roomMission.itemName} (o objeto
                brilhante)
              </p>
            ) : (
              <button
                type="button"
                onClick={() => startMission(roomMission)}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-2.5 text-sm font-bold text-[#1c1206]"
              >
                Começar missão
              </button>
            )}
          </motion.div>
        ) : roomMission && done[roomMission.id] ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-bold">
            <Check className="h-3.5 w-3.5" /> {roomById[roomMission.room]?.name}: missão concluída
          </div>
        ) : !route && !showWelcome ? (
          <div className="flex max-w-full items-center gap-1.5 rounded-full bg-[#120e24]/80 px-3 py-1.5 text-xs backdrop-blur">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate">
              Siga a seta até a <b>PORTARIA · ENTRADA</b>
            </span>
          </div>
        ) : nextMission ? (
          <div className="flex max-w-full items-center gap-1.5 rounded-full bg-[#120e24]/80 px-3 py-1.5 text-xs backdrop-blur">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate">
              Próxima: <b>{roomById[nextMission.room]?.name}</b> · siga a seta amarela
            </span>
          </div>
        ) : null}
      </div>

      {/* Toast de missão concluída */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-none absolute inset-x-4 top-1/3 z-20 mx-auto max-w-sm rounded-2xl border border-emerald-300/60 bg-emerald-600/95 p-4 text-center shadow-2xl"
            role="status"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">
              Missão concluída!
            </p>
            <p className="font-display text-lg font-bold">{toast.title}</p>
            <p className="mt-1 text-sm text-emerald-50">{toast.text}</p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-0.5 text-sm font-bold text-[#1c1206]">
              <Star className="h-3.5 w-3.5 fill-current" /> +{toast.xp} XP
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-10">
        <Joystick input={input} disabled={paused} />
      </div>
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-10 h-40 w-44">
        <div className="absolute bottom-0 right-0">
          <ActionButton
            label="Soco"
            big
            disabled={paused}
            onPress={() => (controls.current.punch = true)}
          >
            <Hand className="h-6 w-6" />
          </ActionButton>
        </div>
        <div className="absolute bottom-2 left-0">
          <ActionButton
            label="Pular"
            disabled={paused}
            onPress={() => (controls.current.jump = true)}
          >
            <ChevronsUp className="h-5 w-5" />
          </ActionButton>
        </div>
        <div className="absolute right-3 top-0">
          <ActionButton
            label={runToggle ? "Correr" : "Andar"}
            active={runToggle}
            disabled={paused}
            onPress={() => setRunToggle((value) => !value)}
          >
            <Zap className="h-5 w-5" />
          </ActionButton>
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-[#120e24]/70 px-3 py-1.5 text-xs text-white/80 md:block">
        WASD/setas: andar · Shift: correr · Espaço: pular · F: soco
      </p>

      {/* ---------------- Modal de missão ---------------- */}
      <AnimatePresence>
        {activeMission && activeMission.type !== "collect" && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center bg-[#0f0b1e]/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="mission-title"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                    {roomById[activeMission.room]?.name}
                  </p>
                  <h2 id="mission-title" className="font-display text-xl font-bold">
                    {activeMission.title}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Fechar missão"
                  onClick={() => setOpenMission(null)}
                  className="rounded-lg border border-white/10 p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {activeMission.type === "reflection" && courseContent[activeMission.room] && (
                <div className="mt-3 rounded-2xl border border-violet-300/20 bg-violet-500/10 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-200">
                    <BookOpen className="h-3.5 w-3.5" /> O que você aprende no{" "}
                    {courseContent[activeMission.room]!.year}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {courseContent[activeMission.room]!.topics.map((topic) => (
                      <li key={topic.name} className="text-sm">
                        <b className="text-white">{topic.name}</b>
                        <span className="block text-white/70">{topic.text}</span>
                      </li>
                    ))}
                  </ul>
                  {courseContent[activeMission.room]!.highlight && (
                    <div className="mt-3 rounded-xl border border-amber-300/50 bg-amber-400/10 p-3 text-sm">
                      <p className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-current" /> Destaque:{" "}
                        {courseContent[activeMission.room]!.highlight!.name}
                      </p>
                      <p className="mt-1 text-white/80">
                        {courseContent[activeMission.room]!.highlight!.text}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeMission.type === "reflection" ? (
                <p className="mt-3 font-semibold text-white/90">{activeMission.question}</p>
              ) : (
                <p className="mt-3 text-white/85">{activeMission.question}</p>
              )}

              {activeMission.type === "quiz" && (
                <div className="mt-4 space-y-2">
                  {activeMission.options.map((option, index) => {
                    const isWrong = quiz.wrong.includes(index);
                    const isRight = quiz.solved && index === activeMission.answer;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={quiz.solved || isWrong}
                        onClick={() => {
                          if (index === activeMission.answer)
                            setQuiz((q) => ({ ...q, solved: true }));
                          else setQuiz((q) => ({ ...q, wrong: [...q.wrong, index] }));
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          isRight
                            ? "border-emerald-300 bg-emerald-500/25"
                            : isWrong
                              ? "border-rose-400/60 bg-rose-500/15 text-white/50 line-through"
                              : "border-white/15 bg-white/[0.05] active:scale-[0.99]"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                  {quiz.wrong.length > 0 && !quiz.solved && (
                    <p className="text-sm text-rose-300">Não é essa. Tente de novo!</p>
                  )}
                  {quiz.solved && (
                    <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 p-3 text-sm">
                      <p className="font-bold text-emerald-300">Resposta certa!</p>
                      <p className="mt-1 text-white/80">{activeMission.explanation}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const xp =
                            XP_PER_MISSION + (quiz.wrong.length === 0 ? XP_FIRST_TRY_BONUS : 0);
                          complete(activeMission, xp, activeMission.explanation);
                          setOpenMission(null);
                        }}
                        className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-bold"
                      >
                        Concluir missão
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeMission.type === "reflection" && (
                <div className="mt-4">
                  <label htmlFor="reflection" className="text-sm font-medium text-white/80">
                    Sua resposta
                  </label>
                  <textarea
                    id="reflection"
                    rows={4}
                    maxLength={1000}
                    value={draft}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    placeholder="Escreva aqui..."
                    className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#0f0b1e] px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-violet-400"
                  />
                  <button
                    type="button"
                    disabled={draft.trim().length < 3}
                    onClick={() =>
                      finishReflection(activeMission, isSkip(draft) ? null : draft.trim())
                    }
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 py-3 font-bold disabled:opacity-40"
                  >
                    {route === "curso" && activeMission.room === COURSE_ROOMS[2]
                      ? quizDone
                        ? "Salvar e concluir"
                        : "Salvar e ir para o quiz"
                      : route === "curso"
                        ? "Salvar e ir para a próxima sala"
                        : "Salvar e concluir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => finishReflection(activeMission, null)}
                    className="mt-2 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-white/80"
                  >
                    {SKIP_TEXT}
                  </button>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Boas-vindas (portão) ---------------- */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center bg-[#0f0b1e]/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-title"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-5 text-center shadow-2xl"
            >
              <div className="flex justify-center">
                <GuidePortrait size="lg" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                EEEP Dr. Salomão Alves de Moura · Aracoiaba · CE
              </p>
              <h2 id="welcome-title" className="font-display text-2xl font-bold">
                Seja muito bem-vindo(a), {player.nome}! 🎉
              </h2>
              <p className="mt-3 text-white/85">
                Eu sou o <b>{guide.name}</b>, seu guia hoje. Que alegria ter você aqui na nossa
                escola!
              </p>
              <p className="mt-2 text-sm text-white/60">
                Siga a seta amarela até a placa <b>PORTARIA · ENTRADA</b>. Te encontro lá!
              </p>
              <button
                type="button"
                onClick={() => setShowWelcome(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 py-3 font-bold"
              >
                Vamos lá!
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Pergunta da portaria ---------------- */}
      <AnimatePresence>
        {showPortaria && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center bg-[#0f0b1e]/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-title"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-5 text-center shadow-2xl"
            >
              <div className="flex justify-center">
                <GuidePortrait size="lg" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                Portaria · Entrada
              </p>
              <h2 id="guide-title" className="font-display text-2xl font-bold">
                Olá, {player.nome}!
              </h2>
              <p className="mt-3 font-display text-lg font-bold text-violet-200">
                O que você gostaria de saber mais: sobre a <b className="text-white">escola</b> ou
                sobre o <b className="text-white">curso</b> (Desenvolvimento de Sistemas)?
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    chooseRoute("escola");
                  }}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.05] p-4 font-bold active:scale-[0.99]"
                >
                  <School className="h-6 w-6 text-emerald-300" />A escola
                  <span className="text-xs font-normal text-white/60">
                    Salas de aula, laboratórios, biblioteca, quadra e muito mais
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    chooseRoute("curso");
                  }}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 p-4 font-bold active:scale-[0.99]"
                >
                  <GraduationCap className="h-6 w-6 text-amber-300" />O curso de DS
                  <span className="text-xs font-normal text-white/80">
                    As salas do 1º, 2º e 3º ano, um quiz e o ranking
                  </span>
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Laboratório (exploração) ---------------- */}
      <AnimatePresence>
        {openLab && activeLab && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end justify-center bg-[#0f0b1e]/70 p-3 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="lab-title"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-violet-300">
                      Exploração · Conheça o espaço
                    </p>
                    <h2 id="lab-title" className="font-display text-xl font-bold">
                      {roomById[openLab]?.name}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={() => setOpenLab(null)}
                  className="rounded-lg border border-white/10 p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-white/80">{activeLab.intro}</p>
              <dl className="mt-3 space-y-2">
                {activeLab.sections.map((section) => (
                  <div
                    key={section.name}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm"
                  >
                    <dt className="font-bold text-violet-200">{section.name}</dt>
                    <dd className="mt-0.5 text-white/75">{section.text}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => setOpenLab(null)}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 py-3 font-bold"
              >
                Continuar explorando
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Mapa ---------------- */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-[#0f0b1e]/85 p-3 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMap(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="map-title"
              onClick={(event) => event.stopPropagation()}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-3xl border border-white/15 bg-[#171126] p-4"
            >
              <div className="flex items-center justify-between">
                <h2 id="map-title" className="font-display text-lg font-bold">
                  Mapa da EEEP
                </h2>
                <button
                  type="button"
                  aria-label="Fechar mapa"
                  onClick={() => setShowMap(false)}
                  className="rounded-lg border border-white/10 p-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SchoolMap done={done} nextRoomId={nextRoomId} player={mapSnapshot} />
              <ol className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                {trail.map((mission, index) => (
                  <li
                    key={mission.id}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                      mission.room === nextRoomId ? "bg-amber-400/15" : ""
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        done[mission.id] ? "bg-emerald-500" : "bg-white/10"
                      }`}
                    >
                      {done[mission.id] ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {roomById[mission.room]?.name}
                      <span className="text-white/45"> · {mission.title}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Final ---------------- */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0f0b1e]/85 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="my-auto w-full max-w-lg rounded-3xl border border-violet-300/25 bg-[#171126] p-6 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-[#1c1206]">
                <Flag className="h-7 w-7" />
              </div>
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-amber-300">
                Escola explorada!
              </p>
              <h2 className="font-display text-2xl font-bold">Meu Mapa do Futuro na EEEP</h2>
              <p className="mt-1 text-white/70">
                {player.nome}, você completou as {trail.length} missões e ganhou{" "}
                <b className="text-amber-300">{totalXp} XP</b>.
              </p>
              <ol className="mt-4 space-y-2 text-left">
                {trail
                  .filter((mission) => mission.type === "reflection")
                  .map((mission) => (
                    <li
                      key={mission.id}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <p className="text-sm font-semibold">{mission.title}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white/65">
                        {done[mission.id]?.answer ?? (done[mission.id]?.skipped ? SKIP_TEXT : "—")}
                      </p>
                    </li>
                  ))}
              </ol>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinal(false)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold"
                >
                  Continuar explorando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinal(false);
                    setShowQuiz(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-3 text-sm font-bold text-[#1c1206]"
                >
                  <GraduationCap className="h-4 w-4" />{" "}
                  {quizDone ? "Ver ranking" : "Quiz do curso e ranking"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    onExit();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 text-sm font-bold"
                >
                  <RotateCcw className="h-4 w-4" /> Jogar de novo
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Teletransporte para as salas de DS ---------------- */}
      <AnimatePresence>
        {teleporting && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[#0f0b1e]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-display text-lg font-bold text-violet-100">{teleporting}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Quiz do curso + ranking ---------------- */}
      <AnimatePresence>
        {showQuiz && (
          <CourseQuiz
            player={player}
            mode={quizDone ? "blocked" : "quiz"}
            onFinished={() => setQuizDone(true)}
            onClose={() => setShowQuiz(false)}
            onRestart={() => {
              stop();
              onExit();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

const MAP_LABELS: Record<string, string> = {
  professores: "Profs.",
  sala1: "1º ano",
  sala2: "2º ano",
  sala3: "3º ano",
  informatica: "Informát.",
  matematica: "Matemát.",
  linguas: "Línguas",
  biblioteca: "Biblioteca",
  auditorio: "Auditório",
  cantina: "Cantina",
  quadra: "Quadra",
};

function SchoolMap({
  done,
  nextRoomId,
  player,
}: {
  done: Done;
  nextRoomId: string | null;
  player: Vec2;
}) {
  return (
    <svg
      viewBox="-25 -42 50 72"
      className="mt-3 max-h-[45dvh] w-full rounded-xl bg-[#8cbf5f]"
      role="img"
      aria-label="Mapa da escola"
    >
      {corridors.map((c, i) => (
        <rect key={i} x={c.x0} y={c.z0} width={c.x1 - c.x0} height={c.z1 - c.z0} fill="#e8cfae" />
      ))}
      <rect
        x={courtyard.x0}
        y={courtyard.z0}
        width={courtyard.x1 - courtyard.x0}
        height={courtyard.z1 - courtyard.z0}
        fill="#6fbf4a"
        stroke="#15803d"
        strokeWidth={0.25}
      />
      <rect x={-3} y={18} width={6} height={11} fill="#d6d3d1" />
      {rooms.map((room) => {
        const [sx, sz] = worldSize(room);
        const mission = missionByRoom[room.id];
        const isDone = mission ? Boolean(done[mission.id]) : false;
        return (
          <g key={room.id}>
            <rect
              x={room.x - sx / 2}
              y={room.z - sz / 2}
              width={sx}
              height={sz}
              fill={room.accent}
              fillOpacity={room.id === nextRoomId ? 0.95 : 0.55}
              stroke={room.id === nextRoomId ? "#facc15" : "#f8fafc"}
              strokeWidth={room.id === nextRoomId ? 0.5 : 0.2}
            />
            <text
              x={room.x}
              y={room.z + 0.4}
              fontSize={1.05}
              textAnchor="middle"
              fill="#fff"
              fontWeight="bold"
            >
              {isDone ? "✓ " : ""}
              {MAP_LABELS[room.id] ?? room.name}
            </text>
          </g>
        );
      })}
      <circle cx={player.x} cy={player.z} r={1} fill="#facc15" stroke="#1c1206" strokeWidth={0.3} />
      <text x={0} y={28} fontSize={1.4} textAnchor="middle" fill="#14532d" fontWeight="bold">
        ENTRADA
      </text>
    </svg>
  );
}

function WebGLFallback() {
  return (
    <div
      role="alert"
      className="flex h-full items-center justify-center bg-[#0f0b1e] px-6 text-center text-white"
    >
      Seu navegador não oferece suporte a WebGL. Tente abrir o jogo em um navegador atualizado.
    </div>
  );
}
