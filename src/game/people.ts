/**
 * Personagens (NPCs) que aparecem dentro das salas e o guia do jogo.
 * Posições em coordenadas locais da sala (porta em +z), iguais às dos móveis.
 */

export type HairStyle = "short" | "straight" | "bun" | "bald" | "curly";

export type NpcLook = {
  girl: boolean;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  shirt: string;
  pants: string;
  glasses?: boolean;
};

export type Npc = {
  id: string;
  name: string;
  role: string;
  room: string;
  look: NpcLook;
  /** posição local na sala */
  at: [number, number];
  /** rotação (rad) local; 0 = olhando para a porta, PI = olhando para o quadro */
  face: number;
  seated: boolean;
};

const SKINS = ["#f6d7c3", "#eabf9f", "#d9a27f", "#b47a55", "#8a5636", "#5c3a24"];
const HAIR = { black: "#1d1630", brown: "#4a2c1a", blonde: "#e8c26a", dark: "#24142c" };
const FARDA = "#f8fafc";
const JEANS = "#1e3a5f";

/** Carteiras das salas de aula: x em [-1.5, 0, 1.5], z em [-1, 0.5, 2]; cadeira em z + 0.45. */
function seat(col: number, row: number): [number, number] {
  return [[-1.5, 0, 1.5][col]!, [-1, 0.5, 2][row]! + 0.5];
}

type Student = [name: string, girl: boolean, skin: number, hair: HairStyle, hairColor: string];

function classroom(room: string, students: Student[], seats: [number, number][]): Npc[] {
  return students.map(([name, girl, skin, hair, hairColor], i) => ({
    id: `${room}-${name}`,
    name,
    role: "Aluno(a)",
    room,
    look: { girl, skin: SKINS[skin]!, hair, hairColor, shirt: FARDA, pants: JEANS },
    at: seats[i]!,
    face: Math.PI,
    seated: true,
  }));
}

function teacher(room: string, name: string, look: NpcLook): Npc {
  return {
    id: `${room}-prof`,
    name,
    role: "Professor(a)",
    room,
    look,
    // em pé ao lado do quadro, olhando para a turma
    at: [-0.4, -2.4],
    face: 0,
    seated: false,
  };
}

const seats5: [number, number][] = [seat(0, 0), seat(1, 0), seat(2, 0), seat(0, 1), seat(2, 1)];

export const npcs: Npc[] = [
  /* ---------------- 1º ano ---------------- */
  ...classroom(
    "sala1",
    [
      ["Vitor", false, 2, "short", HAIR.black],
      ["Rikelme", false, 3, "curly", HAIR.black],
      ["Miguel", false, 1, "short", HAIR.brown],
      ["Izabely", true, 2, "straight", HAIR.dark],
      ["Ray", false, 4, "short", HAIR.black],
    ],
    seats5,
  ),
  teacher("sala1", "Prof.ª Clara Mendes", {
    girl: true,
    skin: SKINS[1]!,
    hair: "straight",
    hairColor: HAIR.brown,
    shirt: "#a78bfa",
    pants: "#334155",
  }),

  /* ---------------- 2º ano ---------------- */
  ...classroom(
    "sala2",
    [
      ["Aloson", false, 3, "short", HAIR.black],
      ["Viny", false, 2, "curly", HAIR.brown],
      ["Vinícius", false, 1, "short", HAIR.black],
      ["Bia", true, 2, "straight", HAIR.brown],
      ["Kaio", false, 5, "short", HAIR.black],
    ],
    seats5,
  ),
  teacher("sala2", "Prof. Natan", {
    girl: false,
    skin: SKINS[2]!,
    hair: "bald",
    hairColor: HAIR.black,
    shirt: "#0ea5e9",
    pants: "#1f2937",
  }),

  /* ---------------- 3º ano ---------------- */
  ...classroom(
    "sala3",
    [
      ["Waldemiro", false, 3, "short", HAIR.black],
      ["Devid", false, 2, "short", HAIR.brown],
      ["Felipe", false, 1, "curly", HAIR.brown],
      ["Dailane", true, 4, "curly", HAIR.black],
      ["Fernanda", true, 2, "straight", HAIR.dark],
    ],
    seats5,
  ),
  teacher("sala3", "Prof. Antoine", {
    girl: false,
    skin: SKINS[3]!,
    hair: "short",
    hairColor: HAIR.black,
    shirt: "#16a34a",
    pants: "#1f2937",
  }),
];

/** Guia do jogo. A foto fica em public/chrystian.jpg. */
export const guide = {
  name: "Chrystian",
  photo: "/chrystian.jpg",
  look: {
    girl: false,
    skin: SKINS[2]!,
    hair: "short",
    hairColor: HAIR.black,
    shirt: "#7c3aed",
    pants: JEANS,
  } satisfies NpcLook,
};
