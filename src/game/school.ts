/**
 * Mapa da EEEP Dr. Salomão Alves de Moura (Aracoiaba - CE).
 *
 * Não há planta pública da escola. O layout segue o "Projeto Escola Padrão"
 * do MEC usado nas EEEPs do Ceará: blocos independentes em volta de uma área
 * de vivência — bloco administrativo na entrada, salas de aula, laboratórios,
 * biblioteca, auditório, refeitório e quadra poliesportiva coberta.
 * O jogo trabalha apenas o curso técnico de Desenvolvimento de Sistemas (DS).
 *
 * Coordenadas em metros. x → leste, z → sul (a entrada fica ao sul).
 */

export type DoorSide = "n" | "s" | "e" | "w";
export type RoomKind =
  | "teachers"
  | "classroom"
  | "lab-info"
  | "lab-math"
  | "lab-lang"
  | "library"
  | "auditorium"
  | "canteen"
  | "court";

export type Room = {
  id: string;
  name: string;
  kind: RoomKind;
  /** centro */
  x: number;
  z: number;
  /** largura ao longo da parede da porta */
  w: number;
  /** profundidade (da porta até o fundo) */
  d: number;
  door: DoorSide;
  floor: string;
  accent: string;
  /** texto do quadro/placa interna */
  board?: string;
  walls?: boolean;
  /** cor das paredes */
  wall?: string;
};

export const rooms: Room[] = [
  // Bloco administrativo (entrada)
  {
    id: "professores",
    wall: "#ece5d9",
    name: "Sala dos Professores",
    kind: "teachers",
    x: 12,
    z: 15,
    w: 6,
    d: 6,
    door: "n",
    floor: "#d6d3d1",
    accent: "#10b981",
    board: "PROFESSORES",
  },
  // Bloco pedagógico (salas de aula) — oeste
  {
    id: "sala1",
    wall: "#ece5d9",
    name: "Sala do 1º ano · DS",
    kind: "classroom",
    x: -17,
    z: 6,
    w: 5.5,
    d: 7,
    door: "e",
    floor: "#e7e5e4",
    accent: "#7c3aed",
    board: "1º ANO · DS",
  },
  {
    id: "sala2",
    wall: "#ece5d9",
    name: "Sala do 2º ano · DS",
    kind: "classroom",
    x: -17,
    z: 0.5,
    w: 5.5,
    d: 7,
    door: "e",
    floor: "#e7e5e4",
    accent: "#8b5cf6",
    board: "2º ANO · DS",
  },
  {
    id: "sala3",
    wall: "#ece5d9",
    name: "Sala do 3º ano · DS",
    kind: "classroom",
    x: -17,
    z: -5,
    w: 5.5,
    d: 7,
    door: "e",
    floor: "#e7e5e4",
    accent: "#a855f7",
    board: "3º ANO · DS",
  },
  // Bloco de laboratórios — leste
  {
    id: "informatica",
    wall: "#ece5d9",
    name: "Laboratório de Informática",
    kind: "lab-info",
    x: 17,
    z: 6,
    w: 5.5,
    d: 7,
    door: "w",
    floor: "#cbd5e1",
    accent: "#2563eb",
    board: "LAB. INFORMÁTICA",
  },
  {
    id: "matematica",
    wall: "#ece5d9",
    name: "Laboratório de Matemática",
    kind: "lab-math",
    x: 17,
    z: 0.5,
    w: 5.5,
    d: 7,
    door: "w",
    floor: "#e2e8f0",
    accent: "#7c3aed",
    board: "LAB. MATEMÁTICA",
  },
  {
    id: "linguas",
    wall: "#ece5d9",
    name: "Laboratório de Línguas",
    kind: "lab-lang",
    x: 17,
    z: -5,
    w: 5.5,
    d: 7,
    door: "w",
    floor: "#e2e8f0",
    accent: "#dc2626",
    board: "HELLO · HOLA",
  },
  // Bloco de convivência — norte
  {
    id: "biblioteca",
    wall: "#ece5d9",
    name: "Biblioteca",
    kind: "library",
    x: -12,
    z: -18.5,
    w: 8,
    d: 8,
    door: "s",
    floor: "#b08968",
    accent: "#b45309",
    board: "BIBLIOTECA",
  },
  {
    id: "auditorio",
    wall: "#ece5d9",
    name: "Auditório",
    kind: "auditorium",
    x: 0,
    z: -19,
    w: 12,
    d: 9,
    door: "s",
    floor: "#57534e",
    accent: "#be123c",
    board: "EXPOTEC",
  },
  {
    id: "cantina",
    wall: "#ece5d9",
    name: "Cantina / Refeitório",
    kind: "canteen",
    x: 12,
    z: -18.5,
    w: 8,
    d: 8,
    door: "s",
    floor: "#e8e1d5",
    accent: "#ea580c",
    board: "CARDÁPIO DO DIA",
  },
  // Quadra poliesportiva coberta
  {
    id: "quadra",
    name: "Quadra Poliesportiva",
    kind: "court",
    x: 0,
    z: -33,
    w: 20,
    d: 13,
    door: "s",
    floor: "#0f766e",
    accent: "#facc15",
    walls: false,
  },
];

export const roomById = Object.fromEntries(rooms.map((room) => [room.id, room])) as Record<
  string,
  Room
>;

/* ------------------------------------------------------------------ */
/* Geometria                                                           */
/* ------------------------------------------------------------------ */

export const WALL_H = 2.6;
const WALL_T = 0.2;
const DOOR_W = 1.7;

export const doorAngle: Record<DoorSide, number> = {
  s: 0,
  e: Math.PI / 2,
  n: Math.PI,
  w: -Math.PI / 2,
};

/** Tamanho no mundo (eixo x, eixo z). */
export function worldSize(room: Room): [number, number] {
  return room.door === "n" || room.door === "s" ? [room.w, room.d] : [room.d, room.w];
}

/** Converte coordenada local da sala (porta em +z) para o mundo. */
export function toWorld(room: Room, lx: number, lz: number): [number, number] {
  const a = doorAngle[room.door];
  return [
    room.x + lx * Math.cos(a) + lz * Math.sin(a),
    room.z - lx * Math.sin(a) + lz * Math.cos(a),
  ];
}

export function doorFront(room: Room, distance = 1.4): [number, number] {
  return toWorld(room, 0, room.d / 2 + distance);
}

export function isInside(room: Room, x: number, z: number, inset = 0.2) {
  const [sx, sz] = worldSize(room);
  return Math.abs(x - room.x) < sx / 2 - inset && Math.abs(z - room.z) < sz / 2 - inset;
}

export type Wall = {
  x: number;
  z: number;
  sx: number;
  sz: number;
  /** "x" = parede que corre no eixo x (pode tapar a câmera) */
  axis: "x" | "z";
  color: string;
  /** revestimento: placas cerâmicas escuras da fachada */
  tex?: "tiles";
};

function wallSegments(
  axis: "x" | "z",
  fixed: number,
  from: number,
  to: number,
  door: boolean,
  color: string,
): Wall[] {
  const pieces: [number, number][] = door
    ? [
        [from, (from + to) / 2 - DOOR_W / 2],
        [(from + to) / 2 + DOOR_W / 2, to],
      ]
    : [[from, to]];
  return pieces.map(([a, b]) =>
    axis === "x"
      ? { x: (a + b) / 2, z: fixed, sx: b - a + WALL_T, sz: WALL_T, axis, color }
      : { x: fixed, z: (a + b) / 2, sx: WALL_T, sz: b - a + WALL_T, axis, color },
  );
}

export function roomWalls(room: Room): Wall[] {
  if (room.walls === false) return [];
  const [sx, sz] = worldSize(room);
  const x0 = room.x - sx / 2;
  const x1 = room.x + sx / 2;
  const z0 = room.z - sz / 2;
  const z1 = room.z + sz / 2;
  const c = room.wall ?? "#f5f5f4";
  return [
    ...wallSegments("x", z0, x0, x1, room.door === "n", c),
    ...wallSegments("x", z1, x0, x1, room.door === "s", c),
    ...wallSegments("z", x0, z0, z1, room.door === "w", c),
    ...wallSegments("z", x1, z0, z1, room.door === "e", c),
  ];
}

/* Fachada principal e Pátio SAM ------------------------------------ */

/** Cinza ardósia das placas da fachada. */
export const FACADE_COLOR = "#35393c";
/** Linha da fachada (z) e limites do Pátio SAM coberto, à esquerda do hall. */
export const FACADE_Z = 18;
export const patioSam: Rect = { x0: -10.2, x1: -3, z0: 12, z1: 18 };

const facadeWalls: Wall[] = [
  { x: -6.7, z: FACADE_Z, sx: 7, sz: WALL_T, axis: "x", color: FACADE_COLOR, tex: "tiles" },
  { x: 6.1, z: FACADE_Z, sx: 5.8, sz: WALL_T, axis: "x", color: FACADE_COLOR, tex: "tiles" },
  // parede do mural "SAM" (face leste, voltada para o pátio)
  { x: -10.3, z: 15.05, sx: WALL_T, sz: 6.1, axis: "z", color: "#2f6fb5" },
];

export const walls: Wall[] = [...rooms.flatMap(roomWalls), ...facadeWalls];

/* Corredores (varandas cobertas) em volta do pátio central --------- */

export type Rect = { x0: number; x1: number; z0: number; z1: number };

export const corridors: Rect[] = [
  { x0: -15, x1: 15, z0: 9.5, z1: 12 }, // corredor do bloco administrativo
  { x0: -16, x1: 16, z0: -14.5, z1: -12 }, // corredor da biblioteca/auditório/cantina
  { x0: -13.5, x1: -11, z0: -12, z1: 9.5 }, // corredor das salas de aula
  { x0: 11, x1: 13.5, z0: -12, z1: 9.5 }, // corredor dos laboratórios
  { x0: -3, x1: 3, z0: 12, z1: 18 }, // hall de entrada
];

/** Jardim / área de vivência no centro. */
export const courtyard: Rect = { x0: -11, x1: 11, z0: -12, z1: 9.5 };

const MURETA_H = 1;

function withGaps(
  axis: "x" | "z",
  fixed: number,
  from: number,
  to: number,
  gaps: [number, number][],
): Wall[] {
  const pieces: [number, number][] = [];
  let start = from;
  for (const [a, b] of [...gaps].sort((g, h) => g[0] - h[0])) {
    if (a > start) pieces.push([start, a]);
    start = b;
  }
  if (start < to) pieces.push([start, to]);
  return pieces.map(([a, b]) =>
    axis === "x"
      ? { x: (a + b) / 2, z: fixed, sx: b - a, sz: 0.22, axis, color: "#901a1e" }
      : { x: fixed, z: (a + b) / 2, sx: 0.22, sz: b - a, axis, color: "#901a1e" },
  );
}

/** Muretas entre corredor e jardim (com passagens). */
export const muretas: Wall[] = [
  ...withGaps("x", 9.5, -11, 11, [
    [-1.4, 1.4],
    [-8, -6],
    [6, 8],
  ]),
  ...withGaps("x", -12, -11, 11, [
    [-1.4, 1.4],
    [-8, -6],
    [6, 8],
  ]),
  ...withGaps("z", -11, -12, 9.5, [[-2.6, -0.6]]),
  ...withGaps("z", 11, -12, 9.5, [[-2.6, -0.6]]),
];
export const MURETA_HEIGHT = MURETA_H;

/** Pilares da cobertura dos corredores. */
export const pillars: [number, number][] = muretas.flatMap((m) => {
  const half = m.axis === "x" ? m.sx / 2 : m.sz / 2;
  const ends: [number, number][] =
    m.axis === "x"
      ? [
          [m.x - half, m.z],
          [m.x + half, m.z],
        ]
      : [
          [m.x, m.z - half],
          [m.x, m.z + half],
        ];
  return ends;
});

const solid: Wall[] = [...walls, ...muretas];

/** Limites da escola (muro). */
export const bounds = { x0: -24, x1: 24, z0: -41, z1: 29 };

export const spawn: [number, number] = [0, 26];

/** Arco da placa "PORTARIA · ENTRADA" (entre o portão e o hall). */
export const portaria = { x: 0, z: 18 };

/** O jogador passou pela portaria vindo do portão. */
export function atPortaria(x: number, z: number) {
  return Math.abs(x - portaria.x) < 3.2 && z < portaria.z + 0.8 && z > portaria.z - 4;
}

/** Resolve colisão de um círculo contra as paredes (in-place). */
export function collide(pos: { x: number; z: number }, radius = 0.3) {
  for (const wall of solid) {
    const minX = wall.x - wall.sx / 2;
    const maxX = wall.x + wall.sx / 2;
    const minZ = wall.z - wall.sz / 2;
    const maxZ = wall.z + wall.sz / 2;
    const cx = Math.max(minX, Math.min(pos.x, maxX));
    const cz = Math.max(minZ, Math.min(pos.z, maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const dist = Math.hypot(dx, dz);
    if (dist >= radius) continue;
    if (dist > 1e-5) {
      pos.x = cx + (dx / dist) * radius;
      pos.z = cz + (dz / dist) * radius;
    } else {
      const pushes = [
        { x: minX - radius, z: pos.z, d: pos.x - minX },
        { x: maxX + radius, z: pos.z, d: maxX - pos.x },
        { x: pos.x, z: minZ - radius, d: pos.z - minZ },
        { x: pos.x, z: maxZ + radius, d: maxZ - pos.z },
      ].sort((a, b) => a.d - b.d);
      pos.x = pushes[0]!.x;
      pos.z = pushes[0]!.z;
    }
  }
  pos.x = Math.max(bounds.x0 + radius, Math.min(bounds.x1 - radius, pos.x));
  pos.z = Math.max(bounds.z0 + radius, Math.min(bounds.z1 - radius, pos.z));
}

/* ------------------------------------------------------------------ */
/* Missões                                                             */
/* ------------------------------------------------------------------ */

export type CollectItem = "document" | "book" | "diary" | "ram" | "ball" | "cable";

export type Mission =
  | {
      id: string;
      room: string;
      type: "quiz";
      title: string;
      intro: string;
      question: string;
      options: string[];
      answer: number;
      explanation: string;
    }
  | {
      id: string;
      room: string;
      type: "collect";
      title: string;
      intro: string;
      item: CollectItem;
      itemName: string;
      /** posição local na sala (porta em +z) */
      at: [number, number];
      success: string;
    }
  | {
      id: string;
      room: string;
      type: "reflection";
      title: string;
      intro: string;
      question: string;
    };

/**
 * Ordem da trilha: o guia Chrystian começa pelas salas de DS.
 * Os laboratórios não têm missão: são só exploração (veja `labInfo`).
 */
export const missions: Mission[] = [
  {
    id: "m-sala1",
    room: "sala1",
    type: "reflection",
    title: "1º ano · Adaptação e fundamentos",
    intro:
      "Esta é a sala do 1º ano de DS! A professora Clara Mendes e a turma (Vitor, Rikelme, Miguel, Izabely e Ray) estão começando a jornada: adaptação ao tempo integral e os fundamentos da programação.",
    question: "Qual sua expectativa para o primeiro ano no curso de DS?",
  },
  {
    id: "m-sala2",
    room: "sala2",
    type: "reflection",
    title: "2º ano · Prática técnica e grupos do ENEM",
    intro:
      "Na sala do 2º ano, o professor Natan e a turma (Aloson, Viny, Vinícius, Bia e Kaio) intensificam a prática técnica e começam a preparação para o ENEM.",
    question: "Qual sua expectativa para o 2º ano de Desenvolvimento de Sistemas na EEEP SAM?",
  },
  {
    id: "m-sala3",
    room: "sala3",
    type: "reflection",
    title: "3º ano · Reta final: ENEM, estágio e Expotec",
    intro:
      "No 3º ano, o professor Antoine e a turma (Waldemiro, Devid, Felipe, Dailane e Fernanda) estão na reta final: ENEM, estágio e Expotec!",
    question:
      "Qual sua expectativa para o 3º ano de Desenvolvimento de Sistemas na EEEP SAM (ENEM, estágio e Expotec)?",
  },
  {
    id: "m-professores",
    room: "professores",
    type: "collect",
    title: "O diário perdido",
    intro: "Um professor esqueceu o diário de classe em algum lugar da sala. Encontre-o!",
    item: "diary",
    itemName: "Diário de classe",
    at: [-1.9, -1.8],
    success: "Diário entregue! Os professores agradecem a ajuda.",
  },
  {
    id: "m-biblioteca",
    room: "biblioteca",
    type: "collect",
    title: "O livro de lógica",
    intro: "Encontre o livro “Lógica de Programação” nas estantes da biblioteca.",
    item: "book",
    itemName: "Livro de Lógica de Programação",
    at: [2.6, -2.4],
    success: "Livro emprestado! Lembre-se de devolver no prazo.",
  },
  {
    id: "m-cantina",
    room: "cantina",
    type: "quiz",
    title: "Hora do almoço",
    intro: "Em tempo integral, alimentação é energia para estudar a tarde toda.",
    question: "Qual prato é mais equilibrado para o almoço?",
    options: [
      "Arroz, feijão, salada e frango",
      "Só refrigerante e salgadinho",
      "Apenas doces",
      "Ficar sem almoçar",
    ],
    answer: 0,
    explanation: "Um prato com carboidrato, proteína, leguminosas e verduras mantém a energia.",
  },
  {
    id: "m-auditorio",
    room: "auditorio",
    type: "quiz",
    title: "Palco da Expotec",
    intro: "O auditório recebe palestras, formaturas e a Expotec.",
    question: "O que é a Expotec?",
    options: [
      "Feira onde os alunos apresentam seus projetos técnicos",
      "Uma prova de recuperação",
      "Um jogo de futebol",
      "A reunião de pais",
    ],
    answer: 0,
    explanation:
      "Na Expotec os cursos técnicos mostram à comunidade os projetos criados pelos alunos.",
  },
  {
    id: "m-quadra",
    room: "quadra",
    type: "collect",
    title: "Intervalo na quadra",
    intro: "A turma vai jogar no intervalo. Pegue a bola no meio da quadra!",
    item: "ball",
    itemName: "Bola",
    at: [0, 0],
    success: "Bola pega! Esporte também faz parte da formação.",
  },
];

export const missionByRoom = Object.fromEntries(missions.map((m) => [m.room, m])) as Record<
  string,
  Mission
>;

export const XP_PER_MISSION = 100;
export const XP_FIRST_TRY_BONUS = 50;

/* ------------------------------------------------------------------ */
/* Rota "curso": conteúdos das salas de DS, quiz e ranking             */
/* ------------------------------------------------------------------ */

export type Route = "escola" | "curso";

/** Salas visitadas na rota do curso, em ordem. */
export const COURSE_ROOMS = ["sala1", "sala2", "sala3"] as const;

export type Topic = { name: string; text: string };

/** O que o modal de cada sala de DS apresenta, com um destaque do ano. */
export const courseContent: Record<string, { year: string; topics: Topic[]; highlight?: Topic }> = {
  sala1: {
    year: "1º ano",
    topics: [
      {
        name: "Como funcionam as aulas",
        text: "As disciplinas da base comum (Português, Matemática, Ciências…) e as do curso técnico dividem a semana. Você estuda o ensino médio e a profissão ao mesmo tempo.",
      },
      {
        name: "Introdução à lógica de programação",
        text: "O ponto de partida do curso: aprender a resolver problemas passo a passo com algoritmos, antes de escrever código de verdade.",
      },
      {
        name: "A rotina do curso técnico",
        text: "Aulas práticas no laboratório de informática, projetos em equipe e professores acompanhando de perto a evolução de cada aluno.",
      },
      {
        name: "Adaptação ao tempo integral",
        text: "As aulas vão das 7h às 17h, com almoço na escola. O primeiro ano é para se acostumar com o novo ritmo, fazer amizades e criar hábitos de estudo.",
      },
    ],
  },
  sala2: {
    year: "2º ano",
    topics: [
      {
        name: "Prática técnica intensificada",
        text: "Os conteúdos técnicos ficam mais fortes: bancos de dados, desenvolvimento web e mobile, com projetos cada vez mais completos.",
      },
      {
        name: "Início da preparação para o ENEM",
        text: "Junto com o técnico, a escola começa a preparar a turma para o ENEM, com revisões, simulados e acompanhamento do desempenho.",
      },
    ],
    highlight: {
      name: "Grupos de Estudo de Matemática e Português",
      text: "A turma é dividida em grupos para focar no fortalecimento das competências cobradas no ENEM e no SPAECE. Cada grupo trabalha no seu ritmo, revisando o que mais precisa.",
    },
  },
  sala3: {
    year: "3º ano",
    topics: [
      {
        name: "Preparação total para o ENEM",
        text: "É o ano do “agora é valendo”: revisões intensas, simulados e foco total no ENEM e nos vestibulares.",
      },
      {
        name: "Projeto final",
        text: "A turma desenvolve um sistema completo, do planejamento à entrega, aplicando tudo o que aprendeu nos três anos.",
      },
    ],
    highlight: {
      name: "Estágio supervisionado, projeto e Expotec",
      text: "O desafio do 3º ano é conciliar o Estágio Curricular Supervisionado nas empresas, com acompanhamento da escola, com a elaboração do projeto final e a apresentação para a comunidade na Expotec.",
    },
  },
};

/** Laboratórios: só exploração, sem missão. O modal abre ao entrar. */
export const labInfo: Record<string, { intro: string; sections: Topic[] }> = {
  informatica: {
    intro: "O coração do curso de Desenvolvimento de Sistemas.",
    sections: [
      {
        name: "Como funciona",
        text: "Cada aluno trabalha em um computador durante as aulas práticas. O professor demonstra no projetor e a turma programa junto.",
      },
      {
        name: "Infraestrutura",
        text: "Bancadas com computadores ligados à internet, projetor, quadro e os programas usados pelos desenvolvedores: editores de código, navegadores e bancos de dados.",
      },
      {
        name: "Nas aulas do curso técnico",
        text: "Lógica de programação, desenvolvimento web e mobile, banco de dados e os projetos em equipe — incluindo o projeto final da Expotec.",
      },
      {
        name: "Na base comum",
        text: "Pesquisas, produção de trabalhos, apresentações e simulados online das outras disciplinas.",
      },
    ],
  },
  matematica: {
    intro: "Um espaço para aprender Matemática colocando a mão na massa.",
    sections: [
      {
        name: "Como funciona",
        text: "As aulas usam materiais concretos e atividades em grupo para tornar visíveis conceitos que, no caderno, parecem abstratos.",
      },
      {
        name: "Infraestrutura",
        text: "Mesas para trabalho em grupo, sólidos geométricos, jogos matemáticos, calculadoras, réguas e instrumentos de medida e um quadro para resolver problemas juntos.",
      },
      {
        name: "Nas aulas do curso técnico",
        text: "O raciocínio lógico e a matemática são a base dos algoritmos; estatística e porcentagem ajudam a entender e analisar dados nos sistemas.",
      },
      {
        name: "Na base comum",
        text: "Geometria, funções e resolução de problemas, além dos Grupos de Estudo de Matemática para o ENEM e o SPAECE.",
      },
    ],
  },
  linguas: {
    intro: "Onde o inglês e o espanhol ganham voz.",
    sections: [
      {
        name: "Como funciona",
        text: "Atividades de escuta, fala, leitura e escrita, com áudios e vídeos para treinar a pronúncia e a compreensão.",
      },
      {
        name: "Infraestrutura",
        text: "Carteiras com fones de ouvido, recursos de áudio e vídeo, projetor e materiais didáticos de língua estrangeira.",
      },
      {
        name: "Nas aulas do curso técnico",
        text: "Inglês técnico: a maioria das linguagens, ferramentas e documentações de programação está em inglês.",
      },
      {
        name: "Na base comum",
        text: "Aulas de inglês e espanhol e a preparação para a prova de língua estrangeira do ENEM.",
      },
    ],
  },
};

export type QuizQuestion = {
  year: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** Quiz final: 6 perguntas fáceis, 2 de cada ano do curso. */
export const courseQuiz: QuizQuestion[] = [
  {
    year: "1º ano",
    question: "Em qual disciplina você acha que vai começar a aprender programação?",
    options: ["Educação Física", "Lógica de Programação", "Geografia", "Artes"],
    answer: 1,
    explanation:
      "A introdução à lógica de programação abre o curso: resolver problemas passo a passo!",
  },
  {
    year: "1º ano",
    question: "Como é o horário de aulas na EEEP?",
    options: [
      "Só pela manhã",
      "Só à noite",
      "Tempo integral, das 7h às 17h",
      "Um dia sim, outro não",
    ],
    answer: 2,
    explanation: "A EEEP é de tempo integral — o 1º ano é para se adaptar a esse novo ritmo.",
  },
  {
    year: "2º ano",
    question: "Onde ficam guardadas as informações de um sistema, como nomes e notas dos alunos?",
    options: ["No banco de dados", "Na mochila", "No mouse", "Na caixa de som"],
    answer: 0,
    explanation: "Bancos de dados são um dos conteúdos técnicos que ganham força no 2º ano.",
  },
  {
    year: "2º ano",
    question: "Para que servem os Grupos de Estudo de Matemática e Português do 2º ano?",
    options: [
      "Para organizar festas",
      "Para fortalecer as competências do ENEM e do SPAECE",
      "Para escolher o time de futebol",
      "Para trocar de curso",
    ],
    answer: 1,
    explanation: "A turma é dividida em grupos para reforçar o que o ENEM e o SPAECE cobram.",
  },
  {
    year: "3º ano",
    question: "O que o aluno de DS faz no estágio supervisionado do 3º ano?",
    options: [
      "Trabalha em uma empresa aplicando o que aprendeu",
      "Fica de férias o ano todo",
      "Só assiste vídeos em casa",
      "Muda de curso",
    ],
    answer: 0,
    explanation: "No estágio você vive a rotina de uma empresa de verdade, com apoio da escola.",
  },
  {
    year: "3º ano",
    question: "Onde os alunos apresentam o projeto final para a comunidade?",
    options: ["Na cantina", "Na Expotec", "Na quadra, no intervalo", "Em lugar nenhum"],
    answer: 1,
    explanation: "Na Expotec os alunos mostram à comunidade os projetos que criaram.",
  },
];

export const QUIZ_POINTS = 100;
