export type AvatarKind = "boy" | "girl";
export type SkinId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6";
export type OutfitId = "farda" | "farda-ds";

export type AvatarLook = {
  kind: AvatarKind;
  skin: SkinId;
  outfit: OutfitId;
};

export const defaultLook: AvatarLook = {
  kind: "boy",
  skin: "s3",
  outfit: "farda",
};

export const kindOptions: { id: AvatarKind; name: string }[] = [
  { id: "boy", name: "Menino" },
  { id: "girl", name: "Menina" },
];

export const skinOptions: { id: SkinId; name: string; color: string }[] = [
  { id: "s1", name: "Muito clara", color: "#f6d7c3" },
  { id: "s2", name: "Clara", color: "#eabf9f" },
  { id: "s3", name: "Média", color: "#d9a27f" },
  { id: "s4", name: "Morena", color: "#b47a55" },
  { id: "s5", name: "Morena escura", color: "#8a5636" },
  { id: "s6", name: "Negra", color: "#5c3a24" },
];

export const outfitOptions: {
  id: OutfitId;
  name: string;
  category: string;
  description: Record<AvatarKind, string>;
  swatch: string;
}[] = [
  {
    id: "farda",
    name: "Farda Padrão",
    category: "Escola · Governo do Ceará",
    description: {
      boy: "Polo branca com friso verde, brasão do Ceará no peito e nas costas e grafismo verde e amarelo na barra.",
      girl: "Polo branca com friso verde, brasão do Ceará no peito e nas costas e grafismo verde e amarelo na barra.",
    },
    swatch: "#f8fafc",
  },
  {
    id: "farda-ds",
    name: "Farda Técnica DS",
    category: "Escola · Curso de DS",
    description: {
      boy: "Polo roxa com listras brancas na gola e nas mangas, logo de Desenvolvimento de Sistemas, xícara de código e trilhas de circuito nas costas.",
      girl: "Polo roxa com listras brancas na gola e nas mangas, logo de Desenvolvimento de Sistemas, xícara de código e trilhas de circuito nas costas.",
    },
    swatch: "#6d28d9",
  },
];

const pick = <T extends { id: string }>(list: T[], id: unknown): T | undefined =>
  list.find((item) => item.id === id);

export function describeLook(look: AvatarLook) {
  const kind = look.kind === "girl" ? "Garota Dev" : "Garoto Dev";
  const outfit = pick(outfitOptions, look.outfit)?.name ?? "";
  return outfit ? `${kind} · ${outfit}` : kind;
}

/** Fardas que podem ser trocadas a qualquer momento no jogo. */
export const fardaOptions = outfitOptions;

export function sanitizeLook(value: unknown): AvatarLook {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<
    Record<keyof AvatarLook, unknown>
  >;
  return {
    kind: pick(kindOptions, raw.kind)?.id ?? defaultLook.kind,
    skin: pick(skinOptions, raw.skin)?.id ?? defaultLook.skin,
    outfit: pick(outfitOptions, raw.outfit)?.id ?? defaultLook.outfit,
  };
}

export function skinColor(id: SkinId) {
  return pick(skinOptions, id)?.color ?? "#d9a27f";
}
