import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Rocket } from "lucide-react";
import collage from "@/assets/collage.jpg";

export type Player = { nome: string; contato: string; local: string };

export function LoginScreen({ onStart }: { onStart: (p: Player) => void }) {
  const [f, setF] = useState<Player>({ nome: "", contato: "", local: "" });
  const [err, setErr] = useState<Partial<Record<keyof Player, string>>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n: typeof err = {};
    if (f.nome.trim().length < 2) n.nome = "Informe seu nome ou apelido";
    const c = f.contato.trim();
    if (!/^\S+@\S+\.\S+$/.test(c) && c.replace(/\D/g, "").length < 10) n.contato = "WhatsApp (com DDD) ou e-mail válido";
    if (f.local.trim().length < 2) n.local = "Informe sua localidade ou turma";
    setErr(n);
    if (!Object.keys(n).length) onStart({ nome: f.nome.trim(), contato: c, local: f.local.trim() });
  };

  const fields = [
    { k: "nome" as const, label: "Nome completo ou Apelido", icon: User, ph: "Ex.: Ana Dev" },
    { k: "contato" as const, label: "WhatsApp ou E-mail", icon: Phone, ph: "(85) 9 9999-9999" },
    { k: "local" as const, label: "Sua Localidade ou Turma", icon: MapPin, ph: "Aracoiaba, 3º Ano DS" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex min-h-[45vh] items-center justify-center overflow-hidden">
        <img src={collage} alt="Turmas da EEEP Dr. Salomão Alves de Moura" width={1024} height={1280} className="absolute inset-0 h-full w-full scale-110 object-cover blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-overlay" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative z-10 px-6 text-center">
          <motion.div animate={{ boxShadow: ["var(--shadow-glow)", "0 0 70px -4px var(--primary-glow)", "var(--shadow-glow)"] }} transition={{ repeat: Infinity, duration: 3 }}
            className="mx-auto flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-primary-glow bg-gradient-primary font-mono text-4xl font-medium text-primary-foreground md:h-44 md:w-44 md:text-5xl">
            {"<DS/>"}
          </motion.div>
          <h1 className="mt-8 font-display text-3xl font-bold md:text-4xl">Jornada EEEP</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">EEEP Dr. Salomão Alves de Moura — Expotec</p>
        </motion.div>
      </section>

      <section className="tech-grid flex items-center justify-center bg-background px-5 py-12">
        <motion.form onSubmit={submit} noValidate initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="w-full max-w-md rounded-3xl border bg-card p-7 shadow-glow md:p-9">
          <p className="font-mono text-xs uppercase tracking-widest text-primary-glow">O Desafio de Desenvolvimento de Sistemas</p>
          <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">Identifique-se, Desenvolvedor!</h2>
          <div className="mt-7 space-y-5">
            {fields.map(({ k, label, icon: Icon, ph }) => (
              <label key={k} className="block">
                <span className="text-sm font-medium">{label}</span>
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border bg-secondary px-4 focus-within:ring-2 focus-within:ring-ring">
                  <Icon className="h-5 w-5 text-primary-glow" />
                  <input value={f[k]} maxLength={100} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    className="h-12 w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
                </div>
                {err[k] && <span className="mt-1 block text-xs text-destructive">{err[k]}</span>}
              </label>
            ))}
          </div>
          <button type="submit" className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-glow">
            Iniciar Jornada <Rocket className="h-5 w-5" />
          </button>
        </motion.form>
      </section>
    </div>
  );
}
