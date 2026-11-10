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
      </div>
    </div>
  );
}

export function GameScreen({ player, onExit }: { player: Player; onExit: () => void }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
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
  };

  return (
    <div className="tech-grid min-h-screen bg-background">
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
          </div>
        </div>
      </header>

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
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showLog && (
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
                    </li>
                  );
                })}
              </ul>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
