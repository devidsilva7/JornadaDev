import { useEffect } from "react";
import { motion } from "framer-motion";
import collage from "@/assets/collage.jpg";

export type Player = { nome: string; contato: string; local: string };

/** Tempo mínimo (ms) que a tela de abertura fica visível. */
const MIN_SPLASH_MS = 2800;

/**
 * Tela de abertura: mostra só a logo e as fotos das turmas enquanto o jogo
 * carrega; depois avança sozinha para o jogo.
 */
export function SplashScreen({
  onReady,
  preload,
}: {
  onReady: () => void;
  preload?: () => Promise<unknown>;
}) {
  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS));
    const loading = preload ? preload().catch(() => undefined) : Promise.resolve();
    Promise.all([minDelay, loading]).then(() => {
      if (!cancelled) onReady();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={collage}
        alt="Turmas da EEEP Dr. Salomão Alves de Moura"
        width={1024}
        height={1280}
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-[3px]"
      />
      <div className="absolute inset-0 bg-gradient-overlay" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <motion.div
          animate={{
            boxShadow: [
              "var(--shadow-glow)",
              "0 0 70px -4px var(--primary-glow)",
              "var(--shadow-glow)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="overflow-hidden rounded-3xl border-2 border-primary-glow bg-gradient-primary shadow-glow"
        >
          <img
            src="/logojornadadev.jpeg"
            alt="Logo JornadaDev"
            className="h-40 w-40 object-cover md:h-52 md:w-52"
          />
        </motion.div>
        <div
          role="status"
          aria-label="Carregando o jogo"
          className="mt-10 h-1.5 w-48 overflow-hidden rounded-full bg-white/15"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: MIN_SPLASH_MS / 1000, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </main>
  );
}
