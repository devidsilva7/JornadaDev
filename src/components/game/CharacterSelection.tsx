import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { Check, Code2, Palette, Play, Shirt, UserRound } from "lucide-react";
import { DevAvatar } from "./DevAvatar";
import type { Player } from "./LoginScreen";
import {
  defaultLook,
  kindOptions,
  outfitOptions,
  sanitizeLook,
  skinOptions,
  type AvatarLook,
} from "@/game/avatar";

const STORAGE_KEY = "jornada-eeep:avatar";

type Tab = "corpo" | "pele" | "roupa";
const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
  { id: "corpo", label: "Jogador", icon: UserRound },
  { id: "pele", label: "Pele", icon: Palette },
  { id: "roupa", label: "Roupa", icon: Shirt },
];

function loadLook(): AvatarLook {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeLook(JSON.parse(raw)) : defaultLook;
  } catch {
    return defaultLook;
  }
}

function chip(active: boolean) {
  return `rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
    active
      ? "border-violet-300 bg-violet-500/20 shadow-[0_0_20px_rgba(124,58,237,0.25)]"
      : "border-white/10 bg-white/[0.04] hover:border-violet-400/40"
  }`;
}

export function CharacterSelection({
  player,
  onSelect,
}: {
  player: Player;
  onSelect: (look: AvatarLook) => void;
}) {
  const [look, setLook] = useState<AvatarLook>(defaultLook);
  const [tab, setTab] = useState<Tab>("corpo");

  useEffect(() => setLook(loadLook()), []);

  const update = (patch: Partial<AvatarLook>) => setLook((current) => ({ ...current, ...patch }));
  const outfit = outfitOptions.find((item) => item.id === look.outfit) ?? outfitOptions[0]!;

  const confirm = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
    } catch {
      /* armazenamento indisponível: segue sem salvar */
    }
    onSelect(look);
  };

  return (
    <main className="relative flex min-h-[100dvh] justify-center overflow-hidden bg-[#0f0b1e] px-4 pb-28 pt-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(124,58,237,0.22),transparent_58%)]" />
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
            <Code2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold sm:text-2xl">Crie seu personagem</h1>
            <p className="truncate text-xs text-white/60">Olá, {player.nome}! Monte seu visual.</p>
          </div>
        </div>

        <div className="relative mt-4 h-[42vh] min-h-[260px] max-h-[380px] overflow-hidden rounded-[2rem] border border-violet-400/20 bg-[radial-gradient(ellipse_at_50%_60%,rgba(147,51,234,0.3),rgba(22,13,43,0.45)_58%,rgba(15,11,30,0.9))]">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ position: [0, 1.25, 3.4], fov: 38 }}
            aria-label="Prévia 3D do personagem"
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2.5, 4, 3]} intensity={1.6} castShadow />
            <pointLight position={[-2, 1.5, -1.5]} color="#a78bfa" intensity={6} />
            <Suspense fallback={null}>
              <DevAvatar look={look} />
            </Suspense>
            <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={4} blur={2.4} far={3} />
            <OrbitControls
              target={[0, 0.95, 0]}
              enablePan={false}
              enableZoom={false}
              autoRotate
              autoRotateSpeed={1.4}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.9}
            />
          </Canvas>
          <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-white/45">
            Arraste para girar
          </p>
        </div>

        <div className="mt-3 text-center">
          <p className="font-display text-lg font-semibold text-violet-100">{outfit.name}</p>
          <p className="text-xs text-white/55">{outfit.description[look.kind]}</p>
        </div>

        <nav
          className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1"
          aria-label="Personalização"
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold transition ${
                tab === id ? "bg-violet-500 text-white" : "text-white/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-3">
          {tab === "corpo" && (
            <div className="grid grid-cols-2 gap-3">
              {kindOptions.map(({ id, name }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ kind: id })}
                  aria-pressed={look.kind === id}
                  className={`${chip(look.kind === id)} flex items-center justify-between`}
                >
                  <span className="font-display font-bold">{name}</span>
                  {look.kind === id && <Check className="h-4 w-4 text-violet-200" />}
                </button>
              ))}
            </div>
          )}

          {tab === "pele" && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {skinOptions.map(({ id, name, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ skin: id })}
                  aria-pressed={look.skin === id}
                  aria-label={`Tom de pele ${name}`}
                  className={`${chip(look.skin === id)} flex flex-col items-center gap-2`}
                >
                  <span
                    className="h-10 w-10 rounded-full border-2 border-white/30"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] leading-tight text-white/70">{name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === "roupa" && (
            <div className="grid grid-cols-2 gap-3">
              {outfitOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ outfit: item.id })}
                  aria-pressed={look.outfit === item.id}
                  className={chip(look.outfit === item.id)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-white/30"
                      style={{ backgroundColor: item.swatch }}
                    />
                    <span className="font-display text-sm font-bold">{item.name}</span>
                  </span>
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-violet-300/80">
                    {item.category}
                  </span>
                  <span className="mt-1 block text-xs text-white/55">
                    {item.description[look.kind]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0f0b1e] via-[#0f0b1e]/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          onClick={confirm}
          className="mx-auto flex h-14 w-full max-w-xl items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 font-display font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] transition active:scale-[0.98]"
        >
          <Play className="h-5 w-5 fill-current" /> Começar jogo
        </button>
      </div>
    </main>
  );
}
