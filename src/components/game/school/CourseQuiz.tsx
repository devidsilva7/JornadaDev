import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Heart, Home, Lock, Medal, Star, Trophy, X } from "lucide-react";
import { GuidePortrait } from "./GuidePortrait";
import type { Player } from "../LoginScreen";
import { guide } from "@/game/people";
import { courseQuiz, QUIZ_POINTS } from "@/game/school";
import { loadRanking, playerKey, saveScore, type RankEntry } from "@/game/ranking";

/** Mensagem oficial exibida assim que o jogador termina o quiz. */
export const GOOD_LUCK_MESSAGE =
  "Todo o seu esforço, dedicação e noites preparadas te trouxeram até aqui. Acredite no seu potencial e vá com a cabeça erguida: a banca só vai confirmar o talento que você já tem. Muita boa sorte na EEEP!";

type Stage = "intro" | "question" | "luck" | "ranking" | "blocked";

/**
 * Etapa final do curso.
 * - mode "quiz": abertura → 6 perguntas → boa sorte → ranking em tela cheia.
 * - mode "blocked": o jogador já fez o quiz; pode só ver o ranking e continuar visitando as salas.
 */
export function CourseQuiz({
  player,
  mode,
  onClose,
  onRestart,
  onFinished,
}: {
  player: Player;
  mode: "quiz" | "blocked";
  onClose: () => void;
  onRestart: () => void;
  onFinished: () => void;
}) {
  const startedAt = useRef(Date.now());
  // o modo é fixado ao abrir (concluir o quiz não deve transformá-lo em "blocked")
  const [initialMode] = useState(mode);
  const [stage, setStage] = useState<Stage>(initialMode === "quiz" ? "intro" : "blocked");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [result, setResult] = useState<{ ranking: RankEntry[]; id: string | null } | null>(null);

  const question = courseQuiz[index]!;
  const isLast = index === courseQuiz.length - 1;

  const next = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setPicked(null);
      return;
    }
    setResult(
      saveScore({
        nome: player.nome,
        local: player.local,
        key: playerKey(player.contato),
        acertos: hits,
        score: hits * QUIZ_POINTS,
        tempo: Math.round((Date.now() - startedAt.current) / 1000),
      }),
    );
    onFinished();
    setStage("luck");
  };

  const showRankingOnly = () => {
    const key = playerKey(player.contato);
    const ranking = loadRanking();
    setResult({ ranking, id: ranking.find((r) => r.key === key)?.id ?? null });
    setStage("ranking");
  };

  if (stage === "ranking" && result) {
    return (
      <RankingBoard
        ranking={result.ranking}
        myId={result.id}
        onRestart={onRestart}
        onClose={initialMode === "blocked" ? onClose : undefined}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#0f0b1e]/85 p-3 backdrop-blur sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        key={stage}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-violet-300/25 bg-[#171126] p-5 shadow-2xl"
      >
        {stage === "blocked" ? (
          <div className="text-center">
            <div className="flex justify-center">
              <GuidePortrait size="lg" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
              <Lock className="h-3 w-3" /> Quiz já realizado
            </p>
            <h2 id="quiz-title" className="font-display text-2xl font-bold">
              Que bom te ver de novo, {player.nome}!
            </h2>
            <p className="mt-3 text-white/85">
              Você já fez o quiz do curso, então ele não pode ser refeito. Mas fique à vontade para
              visitar e conhecer as salas de novo!
            </p>
            <p className="mt-1 text-sm text-white/55">— {guide.name}, seu guia</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/15 py-3 font-semibold"
              >
                Continuar visitando
              </button>
              <button
                type="button"
                onClick={showRankingOnly}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 font-bold text-[#1c1206]"
              >
                <Trophy className="h-4 w-4" /> Ver ranking
              </button>
            </div>
          </div>
        ) : stage === "intro" ? (
          <div className="text-center">
            <div className="flex justify-center">
              <GuidePortrait size="lg" />
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-amber-300">
              Hora do quiz!
            </p>
            <h2 id="quiz-title" className="font-display text-2xl font-bold">
              Mandou bem, {player.nome}!
            </h2>
            <p className="mt-3 text-white/85">
              Você conheceu as salas de DS. Agora responda {courseQuiz.length} perguntas bem fáceis
              (2 de cada ano) e veja sua posição no ranking geral. Atenção: o quiz só pode ser feito
              uma vez!
            </p>
            <p className="mt-1 text-sm text-white/55">— {guide.name}, seu guia</p>
            <button
              type="button"
              onClick={() => {
                startedAt.current = Date.now();
                setStage("question");
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 font-bold text-[#1c1206]"
            >
              Começar o quiz
            </button>
          </div>
        ) : stage === "luck" ? (
          <div className="text-center">
            <div className="flex justify-center">
              <GuidePortrait size="lg" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
              <Heart className="h-3 w-3 fill-current" /> Quiz concluído · {hits}/{courseQuiz.length}{" "}
              acertos
            </p>
            <h2 id="quiz-title" className="font-display text-2xl font-bold">
              Boa sorte, {player.nome}!
            </h2>
            <blockquote className="mt-4 rounded-2xl border border-violet-300/25 bg-violet-500/10 p-4 text-lg leading-relaxed text-white/90">
              “{GOOD_LUCK_MESSAGE}”
            </blockquote>
            <p className="mt-2 text-sm text-white/55">— {guide.name} e toda a equipe da EEEP</p>
            <button
              type="button"
              onClick={() => setStage("ranking")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 font-bold text-[#1c1206]"
            >
              <Trophy className="h-4 w-4" /> Ver o ranking geral
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                  Quiz do curso · {question.year}
                </p>
                <h2 id="quiz-title" className="font-display text-xl font-bold">
                  Pergunta {index + 1} de {courseQuiz.length}
                </h2>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-[#1c1206]">
                <Star className="h-3 w-3 fill-current" /> {hits * QUIZ_POINTS} pts
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all"
                style={{
                  width: `${((index + (picked !== null ? 1 : 0)) / courseQuiz.length) * 100}%`,
                }}
              />
            </div>

            <p className="mt-4 font-semibold text-white/90">{question.question}</p>

            <div className="mt-4 space-y-2">
              {question.options.map((option, i) => {
                const answered = picked !== null;
                const right = answered && i === question.answer;
                const wrong = answered && i === picked && i !== question.answer;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={answered}
                    onClick={() => {
                      setPicked(i);
                      if (i === question.answer) setHits((h) => h + 1);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      right
                        ? "border-emerald-300 bg-emerald-500/25"
                        : wrong
                          ? "border-rose-400/60 bg-rose-500/20"
                          : answered
                            ? "border-white/10 bg-white/[0.03] text-white/45"
                            : "border-white/15 bg-white/[0.05] active:scale-[0.99]"
                    }`}
                  >
                    {option}
                    {right && <Check className="h-4 w-4 shrink-0 text-emerald-300" />}
                    {wrong && <X className="h-4 w-4 shrink-0 text-rose-300" />}
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <div
                className={`mt-3 rounded-xl border p-3 text-sm ${
                  picked === question.answer
                    ? "border-emerald-300/40 bg-emerald-500/10"
                    : "border-rose-300/40 bg-rose-500/10"
                }`}
              >
                <p
                  className={`font-bold ${picked === question.answer ? "text-emerald-300" : "text-rose-300"}`}
                >
                  {picked === question.answer ? `Acertou! +${QUIZ_POINTS} pontos` : "Quase!"}
                </p>
                <p className="mt-1 text-white/80">{question.explanation}</p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 py-3 font-bold"
                >
                  {isLast ? "Concluir o quiz" : "Próxima pergunta"}
                </button>
              </div>
            )}
          </>
        )}
      </motion.section>
    </motion.div>
  );
}

const MEDALS = ["text-amber-300", "text-slate-200", "text-orange-400"];

/** Painel grande do ranking geral, centralizado na tela. */
function RankingBoard({
  ranking,
  myId,
  onRestart,
  onClose,
}: {
  ranking: RankEntry[];
  myId: string | null;
  onRestart: () => void;
  onClose?: (() => void) | undefined;
}) {
  const position = myId ? ranking.findIndex((r) => r.id === myId) + 1 : 0;
  const me = position > 0 ? ranking[position - 1] : undefined;
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0f0b1e]/90 p-3 backdrop-blur sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranking-title"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex h-full max-h-[94dvh] w-full max-w-4xl flex-col rounded-[2rem] border-2 border-amber-300/40 bg-[#171126] p-5 shadow-[0_0_80px_rgba(250,204,21,0.15)] sm:p-8"
      >
        <header className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-[#1c1206] sm:h-16 sm:w-16">
            <Trophy className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-amber-300">
              Quiz do curso de DS
            </p>
            <h2 id="ranking-title" className="font-display text-3xl font-bold sm:text-4xl">
              Ranking geral
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="Fechar ranking"
              onClick={onClose}
              className="rounded-xl border border-white/15 p-2.5"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {me && (
          <p className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-400/10 px-4 py-3 text-base sm:text-lg">
            <b className="text-amber-300">{me.nome}</b>, você fez{" "}
            <b className="text-amber-300">{me.score} pontos</b> ({me.acertos}/{courseQuiz.length}{" "}
            acertos) e está em <b className="text-white">{position}º lugar</b> entre{" "}
            {ranking.length} {ranking.length === 1 ? "participante" : "participantes"}.
          </p>
        )}

        <div className="mt-4 grid grid-cols-[3rem_1fr_auto] gap-3 px-4 text-xs font-bold uppercase tracking-wider text-white/45">
          <span>Pos.</span>
          <span>Jogador</span>
          <span>Pontos</span>
        </div>
        <ol className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {ranking.length === 0 && (
            <li className="rounded-xl border border-white/10 p-6 text-center text-white/55">
              Ninguém fez o quiz ainda.
            </li>
          )}
          {ranking.map((entry, i) => {
            const mine = entry.id === myId;
            return (
              <li
                key={entry.id}
                className={`grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3 ${
                  mine ? "border-amber-300/70 bg-amber-400/15" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="flex justify-center font-display text-xl font-bold">
                  {i < 3 ? <Medal className={`h-7 w-7 ${MEDALS[i]}`} /> : `${i + 1}º`}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold sm:text-lg">
                    {entry.nome}
                    {mine && <span className="text-amber-300"> (você)</span>}
                  </span>
                  <span className="block truncate text-xs text-white/50 sm:text-sm">
                    {entry.local} · {entry.acertos}/{courseQuiz.length} acertos · {entry.tempo}s
                  </span>
                </span>
                <span className="font-display text-xl font-bold text-amber-300 sm:text-2xl">
                  {entry.score}
                </span>
              </li>
            );
          })}
        </ol>

        <footer className="mt-5 flex justify-center border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={onRestart}
            className="flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-4 font-display text-lg font-bold shadow-[0_0_24px_rgba(124,58,237,0.35)]"
          >
            <Home className="h-5 w-5" /> Voltar para o início
          </button>
        </footer>
      </motion.section>
    </motion.div>
  );
}
