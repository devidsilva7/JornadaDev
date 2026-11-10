import { motion } from "framer-motion";
import { ArrowRight, Code2, Sparkles as SparklesIcon, UserRound } from "lucide-react";
import { useState } from "react";
import type { AvatarKind } from "./DevAvatar";
import type { Player } from "./LoginScreen";

const avatarOptions: {
  id: AvatarKind;
  name: string;
  icon: typeof UserRound;
  description: string;
}[] = [
  {
    id: "boy",
    name: "Garoto Dev",
    icon: UserRound,
    description: "Pronto para explorar cada canto da EEEP.",
  },
  {
    id: "girl",
    name: "Garota Dev",
    icon: SparklesIcon,
    description: "Curiosa, criativa e pronta para criar o futuro.",
  },
];

export function CharacterSelection({
  player,
  onSelect,
}: {
  player: Player;
  onSelect: (avatar: AvatarKind) => void;
}) {
  const [selected, setSelected] = useState<AvatarKind>("boy");
  const option = avatarOptions.find((item) => item.id === selected) ?? avatarOptions[0];
  const CharacterIcon = option.icon;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0b1e] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(124,58,237,0.22),transparent_58%)]" />
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
            <Code2 className="h-6 w-6" />
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-violet-300">
            Sua jornada começa agora
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Escolha seu personagem
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Olá, {player.nome}! Quem vai explorar a EEEP com você?
          </p>
        </div>

        <div
          role="img"
          aria-label={`Prévia do personagem: ${option.name}`}
          className="mx-auto mt-7 flex h-64 w-full max-w-md items-center justify-center overflow-hidden rounded-[2rem] border border-violet-400/20 bg-[radial-gradient(ellipse_at_50%_60%,rgba(147,51,234,0.3),rgba(22,13,43,0.45)_58%,rgba(15,11,30,0.9))]"
        >
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-violet-200/20 bg-violet-400/10 shadow-[0_0_60px_rgba(147,51,234,0.35)]">
            <CharacterIcon className="h-24 w-24 text-violet-100" strokeWidth={1.2} />
          </div>
        </div>
        <p className="mt-2 text-center font-display text-lg font-semibold text-violet-100">
          {option.name}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {avatarOptions.map(({ id, name, icon: Icon, description }) => {
            const active = selected === id;
            return (
              <motion.button
                key={id}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setSelected(id)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-violet-300 bg-violet-500/15 shadow-[0_0_24px_rgba(124,58,237,0.2)]"
                    : "border-white/10 bg-white/[0.03] hover:border-violet-400/40"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-violet-500 text-white" : "bg-white/5 text-violet-200"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-bold">{name}</span>
                    <span className="mt-0.5 block text-xs text-white/55">{description}</span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelect(selected)}
          className="mx-auto mt-6 flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3.5 font-display font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] transition hover:-translate-y-0.5"
        >
          Explorar a escola <ArrowRight className="h-4 w-4" />
        </button>
      </motion.section>
    </main>
  );
}
