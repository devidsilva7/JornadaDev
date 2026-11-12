import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoginScreen, type Player } from "@/components/game/LoginScreen";
import type { AvatarLook } from "@/game/avatar";
import { GameStageErrorBoundary } from "@/components/game/GameStageErrorBoundary";

const CharacterSelection = lazy(() =>
  import("@/components/game/CharacterSelection").then((module) => ({
    default: module.CharacterSelection,
  })),
);
const SchoolGameScreen = lazy(() =>
  import("@/components/game/school/SchoolGameScreen").then((module) => ({
    default: module.SchoolGameScreen,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jornada EEEP: O Desafio de Desenvolvimento de Sistemas" },
      {
        name: "description",
        content:
          "RPG narrativo da Expotec na EEEP Dr. Salomão Alves de Moura. Viva os 3 anos do curso de DS.",
      },
      { property: "og:title", content: "Jornada EEEP: O Desafio de DS" },
      {
        property: "og:description",
        content: "RPG narrativo interativo da Expotec — EEEP Dr. Salomão Alves de Moura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [avatar, setAvatar] = useState<AvatarLook | null>(null);
  const [stage, setStage] = useState<"login" | "character" | "game">("login");
  const restart = () => {
    setAvatar(null);
    setPlayer(null);
    setStage("login");
  };
  return (
    <AnimatePresence mode="wait">
      {stage === "game" && player && avatar ? (
        <motion.div
          key="game"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <GameStageErrorBoundary
            key="game-boundary"
            fallback={(resetError) => (
              <StageFailure
                onBack={() => {
                  resetError();
                  restart();
                }}
              />
            )}
          >
            <Suspense fallback={<StageLoading label="Abrindo os portões da EEEP..." />}>
              <SchoolGameScreen player={player} avatar={avatar} onExit={restart} />
            </Suspense>
          </GameStageErrorBoundary>
        </motion.div>
      ) : stage === "character" && player ? (
        <motion.div
          key="character"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <GameStageErrorBoundary
            key="character-boundary"
            fallback={(resetError) => (
              <StageFailure
                onBack={() => {
                  resetError();
                  restart();
                }}
              />
            )}
          >
            <Suspense fallback={<StageLoading label="Carregando seleção de personagem..." />}>
              <CharacterSelection
                player={player}
                onSelect={(selectedAvatar) => {
                  setAvatar(selectedAvatar);
                  setStage("game");
                }}
              />
            </Suspense>
          </GameStageErrorBoundary>
        </motion.div>
      ) : (
        <motion.div key="login" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
          <LoginScreen
            onStart={(newPlayer) => {
              const safePlayer = normalizePlayer(newPlayer);
              if (!safePlayer) return;
              setPlayer(safePlayer);
              setStage("character");
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function normalizePlayer(player: Player | null | undefined): Player | null {
  if (!player || typeof player !== "object") return null;
  const { nome, contato, local } = player;
  if (typeof nome !== "string" || typeof contato !== "string" || typeof local !== "string")
    return null;

  const safePlayer = {
    nome: nome.trim(),
    contato: contato.trim(),
    local: local.trim(),
  };
  return safePlayer.nome && safePlayer.contato && safePlayer.local ? safePlayer : null;
}

function StageLoading({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0b1e] px-4 text-white">
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-violet-300/25 border-t-violet-300" />
        <p className="font-display text-sm text-violet-100">{label}</p>
      </div>
    </main>
  );
}

function StageFailure({ onBack }: { onBack: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0b1e] px-4 text-white">
      <section
        role="alert"
        className="max-w-md rounded-3xl border border-violet-300/25 bg-[#171126] p-8 text-center shadow-[0_0_48px_rgba(124,58,237,0.2)]"
      >
        <h1 className="font-display text-2xl font-bold">Não foi possível carregar esta etapa</h1>
        <p className="mt-3 text-sm text-white/65">
          O formulário foi enviado, mas ocorreu um erro ao abrir a próxima tela. Volte e tente
          novamente.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 font-semibold text-white"
        >
          Voltar para identificação
        </button>
      </section>
    </main>
  );
}
