/**
 * Ranking do quiz do curso.
 *
 * Fica salvo no navegador (localStorage): todos que jogarem no mesmo
 * computador/celular — por exemplo, no estande da Expotec — entram no mesmo
 * ranking. Para um ranking compartilhado entre aparelhos, troque estas
 * funções por chamadas a um banco de dados.
 * Só guardamos nome, localidade e um código embaralhado (hash) do WhatsApp,
 * usado para saber se a pessoa já fez o quiz — o número em si nunca é salvo.
 */

export type RankEntry = {
  id: string;
  nome: string;
  local: string;
  /** pontos do quiz */
  score: number;
  acertos: number;
  /** segundos gastos no quiz (desempate) */
  tempo: number;
  data: string;
  /** hash do WhatsApp (identifica quem já fez o quiz) */
  key?: string;
};

const KEY = "jornada-eeep:ranking:v1";

function isEntry(value: unknown): value is RankEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Record<keyof RankEntry, unknown>>;
  return (
    typeof v.id === "string" &&
    typeof v.nome === "string" &&
    typeof v.local === "string" &&
    typeof v.score === "number" &&
    typeof v.acertos === "number" &&
    typeof v.tempo === "number" &&
    typeof v.data === "string" &&
    (v.key === undefined || typeof v.key === "string")
  );
}

/**
 * Identificação do jogador a partir do WhatsApp: só os dígitos, sem o 55 do Brasil,
 * passados por um hash (cyrb53) para não guardar o número.
 */
export function playerKey(contato: string) {
  let digits = contato.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) digits = digits.slice(2);
  let h1 = 0xdeadbeef ^ 7;
  let h2 = 0x41c6ce57 ^ 7;
  for (const ch of `eeep-sam:${digits}`) {
    const c = ch.charCodeAt(0);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** O jogador com este código já concluiu o quiz? */
export function hasPlayed(key: string) {
  return loadRanking().some((entry) => entry.key === key);
}

export function sortRanking(list: RankEntry[]) {
  return [...list].sort(
    (a, b) => b.score - a.score || a.tempo - b.tempo || a.data.localeCompare(b.data),
  );
}

export function loadRanking(): RankEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? sortRanking(parsed.filter(isEntry)) : [];
  } catch {
    return [];
  }
}

/** Salva a pontuação e devolve o ranking atualizado (a nova entrada sempre aparece, mesmo sem armazenamento). */
export function saveScore(entry: Omit<RankEntry, "id" | "data">): {
  ranking: RankEntry[];
  id: string;
} {
  // quem já fez o quiz não entra de novo no ranking
  const previous = entry.key ? loadRanking().find((r) => r.key === entry.key) : undefined;
  if (previous) return { ranking: loadRanking(), id: previous.id };
  const full: RankEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    data: new Date().toISOString(),
  };
  const ranking = sortRanking([...loadRanking(), full]).slice(0, 200);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ranking));
  } catch {
    /* armazenamento indisponível: mostra o ranking só nesta sessão */
  }
  return {
    ranking: ranking.some((r) => r.id === full.id) ? ranking : [...ranking, full],
    id: full.id,
  };
}
