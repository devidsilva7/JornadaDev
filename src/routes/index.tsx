import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoginScreen, type Player } from "@/components/game/LoginScreen";
import { GameScreen } from "@/components/game/GameScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jornada EEEP: O Desafio de Desenvolvimento de Sistemas" },
      { name: "description", content: "RPG narrativo da Expotec na EEEP Dr. Salomão Alves de Moura. Viva os 3 anos do curso de DS." },
      { property: "og:title", content: "Jornada EEEP: O Desafio de DS" },
      { property: "og:description", content: "RPG narrativo interativo da Expotec — EEEP Dr. Salomão Alves de Moura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [player, setPlayer] = useState<Player | null>(null);
  return (
    <AnimatePresence mode="wait">
      {player ? (
        <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <GameScreen player={player} onExit={() => setPlayer(null)} />
        </motion.div>
      ) : (
        <motion.div key="login" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
          <LoginScreen onStart={setPlayer} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
