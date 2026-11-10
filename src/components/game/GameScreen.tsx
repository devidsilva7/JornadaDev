<<<<<<< HEAD
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  BrainCircuit,
  Bug,
  CheckCircle2,
  ChevronRight,
  Code2,
  Coffee,
  Laptop,
  LogOut,
  RotateCcw,
  Share2,
  ShieldCheck,
  Trophy,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  scenarios,
  initialStats,
  applyEffect,
  getEnding,
  getScore,
  type Choice,
  type ScenarioIcon,
  type Stats,
} from "@/game/story";
import type { Player } from "./LoginScreen";

const classIds = ["logica", "fullstack", "equipe", "debug"] as const;
type PlayerClass = (typeof classIds)[number];

const classOptions: Record<PlayerClass, { label: string; icon: LucideIcon }> = {
  logica: { label: "Aprendiz de Lógica", icon: BrainCircuit },
  fullstack: { label: "Dev Full Stack", icon: Laptop },
  equipe: { label: "Líder de Equipe", icon: Users },
  debug: { label: "Caçador de Bugs", icon: Bug },
};

const scenarioIcons: Record<ScenarioIcon, LucideIcon> = {
  bug: Bug,
  users: Users,
  book: BookOpen,
  code: Code2,
  trophy: Trophy,
};

const endingIcons = {
  senior: Trophy,
  gambiarra: Coffee,
  lider: Users,
  sobrevivente: ShieldCheck,
} as const;

function Bar({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 truncate text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary-glow" />
          {label}
        </span>
        <span className="font-mono font-semibold">{value}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <motion.div
          className={`h-full rounded-full ${tone}`}
          animate={{ width: `${value}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
=======
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Code2, Users, BookOpen, X, RotateCcw, Share2, CheckCircle2, LogOut, ChevronRight } from "lucide-react";
import { scenarios, initialStats, applyEffect, getEnding, getScore, type Stats, type Choice } from "@/game/story";
import type { Player } from "./LoginScreen";

function Bar({ icon: Icon, label, value, tone }: { icon: typeof Zap; label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 truncate"><Icon className="h-3.5 w-3.5 text-primary-glow" />{label}</span>
        <span className="font-mono">{value}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div className={`h-full rounded-full ${tone}`} animate={{ width: `${value}%` }} transition={{ type: "spring", stiffness: 80 }} />
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
      </div>
    </div>
  );
}

<<<<<<< HEAD
function getStatChanges(choice: Pick<Choice, "effect">) {
  return [
    { key: "codigo", label: "XP", value: choice.effect.codigo ?? 0 },
    { key: "energia", label: "Energia", value: choice.effect.energia ?? 0 },
    { key: "reputacao", label: "Reputação", value: choice.effect.reputacao ?? 0 },
  ].filter(({ value }) => value !== 0);
}

=======
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
export function GameScreen({ player, onExit }: { player: Player; onExit: () => void }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
<<<<<<< HEAD
  const [log, setLog] = useState<{ milestone: string; choice: string; effect: Partial<Stats> }[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [classId, setClassId] = useState<PlayerClass>("logica");
  const [shareMessage, setShareMessage] = useState("");

  const done = idx >= scenarios.length;
  const scenario = scenarios[idx];
  const isScenarioActive = !done && scenario !== undefined;
  const currentClass = classOptions[classId];
  const ClassIcon = currentClass.icon;
  const ScenarioIconView = isScenarioActive ? scenarioIcons[scenario.icon] : Trophy;
  const ending = getEnding(stats);
  const EndingIcon = endingIcons[ending.badge];
  const score = getScore(stats);

  useEffect(() => {
    if (!showLog) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowLog(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showLog]);

  const choose = (choice: Choice) => {
    if (!isScenarioActive) return;
    setPicked(choice);
    setFeedbackVisible(true);
    setStats((current) => applyEffect(current, choice.effect));
    setLog((current) => [
      ...current,
      { milestone: scenario.milestone, choice: choice.text, effect: choice.effect },
    ]);
  };

  const next = () => {
    setPicked(null);
    setFeedbackVisible(false);
    setIdx((current) => current + 1);
  };

  const share = async () => {
    const message = `Joguei a Jornada EEEP na Expotec! ${ending.title} — ${score} pts`;
    setShareMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        setShareMessage("Resultado compartilhado!");
        return;
      }
      if (!navigator.clipboard) {
        setShareMessage("Compartilhamento não disponível neste navegador.");
        return;
      }
      await navigator.clipboard.writeText(message);
      setShareMessage("Resultado copiado!");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("Não foi possível compartilhar o resultado.");
    }
=======
  const [log, setLog] = useState<{ milestone: string; choice: string }[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [copied, setCopied] = useState(false);

  const done = idx >= scenarios.length;
  const sc = scenarios[Math.min(idx, scenarios.length - 1)]!;

  const choose = (c: Choice) => {
    setPicked(c);
    setStats((s) => applyEffect(s, c.effect));
    setLog((l) => [...l, { milestone: sc.milestone, choice: c.text }]);
  };
  const next = () => { setPicked(null); setIdx((i) => i + 1); };
  const restart = () => { setStats(initialStats); setIdx(0); setPicked(null); setLog([]); };

  const ending = getEnding(stats);
  const score = getScore(stats);
  const share = async () => {
    const t = `Joguei a Jornada EEEP na Expotec! ${ending.emoji} ${ending.title} — ${score} pts`;
    try { if (navigator.share) await navigator.share({ text: t }); else { await navigator.clipboard.writeText(t); setCopied(true); } } catch { /* cancelled */ }
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
  };

  return (
    <div className="tech-grid min-h-screen bg-background">
<<<<<<< HEAD
      <header className="sticky top-0 z-20 border-b bg-card/95 shadow-glow backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary-glow/50 bg-gradient-primary shadow-glow">
                <ClassIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-bold">
                  {player.nome} <span className="font-normal text-muted-foreground">· {player.local}</span>
                </p>
                <label className="mt-0.5 flex items-center gap-1.5 text-xs text-primary-glow">
                  <span>Avatar / classe</span>
                  <select
                    aria-label="Selecionar avatar e classe"
                    value={classId}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      const selectedClass = classIds.find((id) => id === value);
                      if (selectedClass) setClassId(selectedClass);
                    }}
                    className="max-w-48 cursor-pointer rounded-md border border-primary-glow/30 bg-secondary px-2 py-1 font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {classIds.map((id) => (
                      <option key={id} value={id}>{classOptions[id].label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLog(true)}
                className="flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-2 text-sm transition hover:bg-accent"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Conquistas</span>
              </button>
              <button
                onClick={onExit}
                aria-label="Voltar para identificação"
                className="rounded-lg border bg-secondary p-2 transition hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            <Bar icon={Zap} label="Energia" value={stats.energia} tone="bg-violet-600" />
            <Bar icon={Code2} label="Código / XP" value={stats.codigo} tone="bg-gradient-to-r from-white via-violet-200 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.65)]" />
            <Bar icon={Users} label="Reputação" value={stats.reputacao} tone="bg-purple-400" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary-glow sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-primary-glow shadow-[0_0_10px_var(--primary-glow)]" />
              {done ? "Jornada concluída · Expotec" : scenario?.phase}
            </p>
            <p className="shrink-0 font-mono text-xs text-muted-foreground">
              {done ? "5 / 5" : `${idx + 1} / ${scenarios.length}`}
            </p>
=======
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display font-bold">{player.nome} <span className="font-normal text-muted-foreground">· {player.local}</span></p>
              <p className="font-mono text-xs text-primary-glow">{done ? "Formatura 🎓" : sc.phase}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLog(true)} className="flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-2 text-sm hover:bg-accent"><BookOpen className="h-4 w-4" /><span className="hidden sm:inline">Coddex</span></button>
              <button onClick={onExit} aria-label="Sair" className="rounded-lg border bg-secondary p-2 hover:bg-accent"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-3 flex gap-3 sm:gap-5">
            <Bar icon={Zap} label="Energia" value={stats.energia} tone="bg-warning" />
            <Bar icon={Code2} label="Código/XP" value={stats.codigo} tone="bg-gradient-primary" />
            <Bar icon={Users} label="Reputação" value={stats.reputacao} tone="bg-success" />
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <AnimatePresence mode="wait">
          {isScenarioActive ? (
            <motion.article
              key={scenario.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="relative overflow-hidden rounded-3xl border border-primary-glow/30 bg-card p-6 shadow-glow md:p-10"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

              {picked && feedbackVisible && (
                <motion.div
                  aria-live="polite"
                  className="pointer-events-none absolute right-5 top-5 z-10 flex flex-col items-end gap-1.5 md:right-8 md:top-8"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: -18, opacity: [0, 1, 0] }}
                  transition={{ duration: 2.2, ease: "easeOut" }}
                  onAnimationComplete={() => setFeedbackVisible(false)}
                >
                  {getStatChanges(picked).map(({ key, label, value }) => (
                    <span
                      key={key}
                      className={`rounded-full border px-3 py-1 font-mono text-xs font-bold shadow-lg ${
                        value > 0
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-destructive/30 bg-destructive/15 text-destructive"
                      }`}
                    >
                      {value > 0 ? "+" : ""}{value} {label}
                    </span>
                  ))}
                </motion.div>
              )}

              <div className="relative z-[1]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary-glow/40 bg-gradient-primary shadow-glow">
                    <ScenarioIconView className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">
                      Missão {idx + 1} de {scenarios.length} <span className="text-muted-foreground">· {scenario.milestone}</span>
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">{scenario.title}</h2>
                  </div>
                </div>

                <p className="mt-6 leading-relaxed text-foreground/90 md:text-lg">{scenario.text}</p>

                {!picked ? (
                  <div className="mt-8 grid gap-3">
                    {scenario.choices.map((choice, choiceIndex) => (
                      <motion.button
                        key={choice.text}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => choose(choice)}
                        className="group flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/80 p-4 text-left transition hover:border-primary-glow hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary font-mono text-sm font-bold text-primary-foreground shadow-glow">
                          {String.fromCharCode(65 + choiceIndex)}
                        </span>
                        <span className="flex-1 font-medium leading-snug">{choice.text}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary-glow" />
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 rounded-2xl border border-primary-glow/40 bg-secondary/90 p-5 md:p-6"
                  >
                    <p className="font-medium leading-relaxed">{picked.result}</p>
                    <div className="mt-4 flex flex-wrap gap-2" aria-label="Impacto nos atributos">
                      {getStatChanges(picked).map(({ key, label, value }) => (
                        <span
                          key={key}
                          className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold ${
                            value > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {label} {value > 0 ? "+" : ""}{value}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-bold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
                    >
                      Continuar <ChevronRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.article>
          ) : (
            <motion.section
              key="ending"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="overflow-hidden rounded-3xl border border-primary-glow/40 bg-card p-8 text-center shadow-glow md:p-12"
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary-glow/50 bg-gradient-primary shadow-glow"
              >
                <EndingIcon className="h-12 w-12 text-primary-foreground" />
              </motion.div>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-primary-glow">Conquista desbloqueada · Ranking final</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">{ending.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{ending.desc}</p>
              <p className="mt-7 font-display text-5xl font-bold text-primary-glow">
                {score}<span className="ml-2 text-lg text-muted-foreground">pts</span>
              </p>
              <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border bg-secondary p-3"><span className="block text-muted-foreground">Energia</span><strong className="mt-1 block text-sm">{stats.energia}%</strong></div>
                <div className="rounded-xl border bg-secondary p-3"><span className="block text-muted-foreground">Código / XP</span><strong className="mt-1 block text-sm">{stats.codigo}%</strong></div>
                <div className="rounded-xl border bg-secondary p-3"><span className="block text-muted-foreground">Reputação</span><strong className="mt-1 block text-sm">{stats.reputacao}%</strong></div>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onExit}
                  className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" /> Jogar Novamente
                </button>
                <button
                  onClick={share}
                  className="flex items-center gap-2 rounded-xl border bg-secondary px-6 py-3 font-bold transition hover:bg-accent"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar resultado
                </button>
              </div>
              {shareMessage && <p role="status" className="mt-3 text-sm text-muted-foreground">{shareMessage}</p>}
            </motion.section>
=======
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={sc.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="rounded-3xl border bg-card p-6 shadow-glow md:p-10">
              <p className="font-mono text-xs text-muted-foreground">Desafio {idx + 1} de {scenarios.length}</p>
              <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">{sc.title}</h2>
              <p className="mt-4 text-muted-foreground md:text-lg">{sc.text}</p>
              {!picked ? (
                <div className="mt-7 grid gap-3">
                  {sc.choices.map((c, i) => (
                    <motion.button key={c.text} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => choose(c)}
                      className="flex items-center gap-3 rounded-xl border bg-secondary p-4 text-left transition hover:border-primary-glow hover:bg-accent">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary font-mono text-sm">{String.fromCharCode(65 + i)}</span>
                      <span>{c.text}</span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-7 rounded-xl border border-primary-glow bg-secondary p-5">
                  <p className="font-medium">{picked.result}</p>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
                    {Object.entries(picked.effect).map(([k, v]) => (
                      <span key={k} className={`rounded-md px-2 py-1 ${v! > 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{k} {v! > 0 ? "+" : ""}{v}</span>
                    ))}
                  </div>
                  <button onClick={next} className="mt-5 flex items-center gap-1 rounded-xl bg-gradient-primary px-5 py-3 font-bold hover:shadow-glow">Continuar <ChevronRight className="h-4 w-4" /></button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="end" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border bg-card p-8 text-center shadow-glow md:p-12">
              <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-7xl">{ending.emoji}</motion.div>
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary-glow">Ranking final</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{ending.title}</h2>
              <p className="mt-3 text-muted-foreground">{ending.desc}</p>
              <p className="mt-6 font-display text-5xl font-bold text-primary-glow">{score}<span className="text-lg text-muted-foreground"> pts</span></p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={restart} className="flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-bold hover:shadow-glow"><RotateCcw className="h-4 w-4" />Jogar novamente</button>
                <button onClick={share} className="flex items-center gap-2 rounded-xl border bg-secondary px-6 py-3 font-bold hover:bg-accent"><Share2 className="h-4 w-4" />{copied ? "Copiado!" : "Compartilhar"}</button>
                <button onClick={onExit} className="rounded-xl border bg-secondary px-6 py-3 hover:bg-accent">Próximo jogador</button>
              </div>
            </motion.div>
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showLog && (
<<<<<<< HEAD
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLog(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="achievement-log-title"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-primary-glow/40 bg-card p-6 shadow-glow md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">Sua jornada</p>
                  <h3 id="achievement-log-title" className="mt-1 font-display text-2xl font-bold">Log de Conquistas</h3>
                </div>
                <button
                  onClick={() => setShowLog(false)}
                  aria-label="Fechar log de conquistas"
                  className="rounded-lg border bg-secondary p-2 transition hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-xl border bg-secondary p-3"><span className="text-muted-foreground">Energia</span><strong className="mt-1 block">{stats.energia}%</strong></div>
                <div className="rounded-xl border bg-secondary p-3"><span className="text-muted-foreground">Código / XP</span><strong className="mt-1 block">{stats.codigo}%</strong></div>
                <div className="rounded-xl border bg-secondary p-3"><span className="text-muted-foreground">Reputação</span><strong className="mt-1 block">{stats.reputacao}%</strong></div>
              </div>

              <ul className="mt-6 space-y-3">
                {scenarios.map((item, scenarioIndex) => {
                  const entry = log[scenarioIndex];
                  const ItemIcon = scenarioIcons[item.icon];
                  return (
                    <li key={item.id} className={`rounded-2xl border p-4 ${entry ? "border-primary-glow/30 bg-secondary/70" : "opacity-55"}`}>
                      <p className="flex items-center gap-2 font-medium">
                        {entry ? <CheckCircle2 className="h-4 w-4 text-success" /> : <ItemIcon className="h-4 w-4 text-muted-foreground" />}
                        {item.milestone}
                      </p>
                      {entry ? (
                        <>
                          <p className="mt-2 text-sm text-muted-foreground">{entry.choice}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {getStatChanges({ effect: entry.effect }).map(({ key, label, value }) => (
                              <span key={key} className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${value > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                                {label} {value > 0 ? "+" : ""}{value}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{item.phase}</p>
                      )}
=======
          <motion.div className="fixed inset-0 z-30 flex justify-end bg-background/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLog(false)}>
            <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }}
              className="h-full w-full max-w-sm overflow-y-auto border-l bg-sidebar p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Coddex · Log de Missões</h3>
                <button onClick={() => setShowLog(false)} aria-label="Fechar"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="rounded-lg bg-secondary p-2">⚡ {stats.energia}%</div>
                <div className="rounded-lg bg-secondary p-2">{"</>"} {stats.codigo}%</div>
                <div className="rounded-lg bg-secondary p-2">🤝 {stats.reputacao}%</div>
              </div>
              <ul className="mt-6 space-y-3">
                {scenarios.map((s, i) => {
                  const entry = log[i];
                  return (
                    <li key={s.id} className={`rounded-xl border p-3 ${entry ? "bg-secondary" : "opacity-50"}`}>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className={`h-4 w-4 ${entry ? "text-success" : "text-muted-foreground"}`} />{s.milestone}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{entry ? entry.choice : s.phase}</p>
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
                    </li>
                  );
                })}
              </ul>
<<<<<<< HEAD

              {done && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary-glow/30 bg-secondary p-4">
                  <Award className="h-6 w-6 shrink-0 text-primary-glow" />
                  <div>
                    <p className="font-semibold">{ending.title}</p>
                    <p className="text-sm text-muted-foreground">Conquista final desbloqueada na banca da Expotec.</p>
                  </div>
                </div>
              )}
            </motion.section>
=======
            </motion.aside>
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
