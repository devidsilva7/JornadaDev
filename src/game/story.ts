export type Stats = { energia: number; codigo: number; reputacao: number };
export type Choice = { text: string; effect: Partial<Stats>; result: string };
export type Scenario = { id: string; phase: string; title: string; milestone: string; text: string; choices: Choice[] };

export const initialStats: Stats = { energia: 70, codigo: 20, reputacao: 40 };

export const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function applyEffect(s: Stats, e: Partial<Stats>): Stats {
  return {
    energia: clamp(s.energia + (e.energia ?? 0)),
    codigo: clamp(s.codigo + (e.codigo ?? 0)),
    reputacao: clamp(s.reputacao + (e.reputacao ?? 0)),
  };
}

export const scenarios: Scenario[] = [
  {
    id: "lab", phase: "1º Ano - Módulo de Lógica", milestone: "Laboratório salvo",
    title: "O PC do laboratório travou",
    text: "Véspera da prova de Lógica. O computador do laboratório 2 não liga e sua dupla está desesperada. O professor pede ajuda.",
    choices: [
      { text: "Abrir o gabinete e testar a memória RAM", effect: { codigo: 15, energia: -10, reputacao: 5 }, result: "Era a RAM mal encaixada! Você ganhou fama de técnico." },
      { text: "Chamar a turma para resolver junto", effect: { reputacao: 15, codigo: 5, energia: -5 }, result: "Juntos vocês resolveram — e a turma ficou mais unida." },
      { text: "Ir estudar pseudocódigo para a prova", effect: { codigo: 10, energia: -5, reputacao: -5 }, result: "Você mandou bem na prova, mas a dupla ficou chateada." },
    ],
  },
  {
    id: "prova", phase: "1º Ano - Módulo de Lógica", milestone: "Prova de Lógica concluída",
    title: "Prova de Lógica de Programação",
    text: "Questão final: um laço que nunca termina. Faltam 10 minutos.",
    choices: [
      { text: "Rastrear o algoritmo no papel, linha por linha", effect: { codigo: 15, energia: -10 }, result: "Teste de mesa salvou o dia. Condição de parada corrigida!" },
      { text: "Chutar e entregar logo", effect: { energia: 10, codigo: -5 }, result: "Você descansou... mas errou a questão." },
      { text: "Pedir dica ao colega do lado", effect: { reputacao: -10, codigo: 5 }, result: "O professor percebeu. Advertência leve." },
    ],
  },
  {
    id: "feira", phase: "2º Ano - Banco de Dados", milestone: "Projeto do Ceará Científico",
    title: "Projeto para o Ceará Científico",
    text: "Sua equipe precisa de um sistema para a feira. Qual a ideia?",
    choices: [
      { text: "App de controle da merenda escolar com banco de dados", effect: { codigo: 15, reputacao: 10, energia: -15 }, result: "Ideia útil e bem modelada! Os professores amaram." },
      { text: "Um jogo em Python sobre o sertão", effect: { codigo: 10, reputacao: 15, energia: -10 }, result: "Criativo! Todo mundo quer jogar no intervalo." },
      { text: "Copiar um projeto do GitHub", effect: { codigo: -5, reputacao: -15, energia: 10 }, result: "A avaliadora reconheceu o código. Que vergonha..." },
      { text: "Sistema de caronas para alunos de Aracoiaba", effect: { codigo: 12, reputacao: 12, energia: -12 }, result: "Resolve um problema real da comunidade!" },
    ],
  },
  {
    id: "sql", phase: "2º Ano - Banco de Dados", milestone: "Banco de dados normalizado",
    title: "O banco caiu às 23h",
    text: "Um SELECT sem WHERE... ou foi um DELETE? A tabela de usuários sumiu.",
    choices: [
      { text: "Restaurar o backup e criar rotina automática", effect: { codigo: 15, energia: -10 }, result: "Lição aprendida: backup é vida." },
      { text: "Dormir e resolver amanhã", effect: { energia: 20, reputacao: -5 }, result: "Energia restaurada, mas a equipe ficou preocupada." },
      { text: "Varar a madrugada no café", effect: { codigo: 10, energia: -25 }, result: "Resolvido às 4h. Você é movido a cafeína." },
    ],
  },
  {
    id: "crunch", phase: "3º Ano - TCC & Expotec", milestone: "Crunch do TCC sobrevivido",
    title: "Crunch: TCC + SPAECE",
    text: "Prazo do TCC na sexta, simulado do SPAECE na quinta e o grupo está sumido no WhatsApp.",
    choices: [
      { text: "Montar um quadro Kanban e dividir tarefas", effect: { reputacao: 15, codigo: 10, energia: -10 }, result: "Organização de líder! O grupo voltou a render." },
      { text: "Fazer tudo sozinho", effect: { codigo: 15, energia: -25, reputacao: -10 }, result: "Entregou, mas está exausto e o grupo se sentiu excluído." },
      { text: "Focar no SPAECE e adiar o TCC", effect: { energia: -5, codigo: -5, reputacao: 5 }, result: "Boa nota no simulado, mas o TCC atrasou." },
    ],
  },
  {
    id: "expotec", phase: "3º Ano - TCC & Expotec", milestone: "Apresentação na Expotec",
    title: "Chefão Final: Banca da Expotec",
    text: "Os jurados chegam ao estande. O sistema trava na demonstração ao vivo!",
    choices: [
      { text: "Manter a calma e explicar a arquitetura enquanto reinicia", effect: { codigo: 15, reputacao: 15, energia: -10 }, result: "Os jurados ficaram impressionados com seu domínio técnico." },
      { text: "Mostrar o vídeo de backup da demo", effect: { reputacao: 10, codigo: 5 }, result: "Plano B executado com classe." },
      { text: "Deixar o colega falar e se esconder", effect: { reputacao: -10, energia: 5 }, result: "Seu colega segurou a banca... sozinho." },
    ],
  },
];

export type Ending = { title: string; desc: string; emoji: string };

export function getEnding(s: Stats): Ending {
  const total = s.energia + s.codigo + s.reputacao;
  if (s.codigo >= 75 && s.reputacao >= 65) return { emoji: "🏆", title: "Dev Master Senior: Aprovado com Louvor!", desc: "Código impecável e uma turma que te admira. O mercado te espera." };
  if (s.energia <= 15) return { emoji: "☕", title: "Sobreviveu na Base do Café", desc: "Chegou ao fim no limite das forças, mas chegou!" };
  if (s.reputacao >= 70) return { emoji: "🤝", title: "Líder da Turma", desc: "Suas habilidades sociais fizeram a equipe brilhar." };
  if (s.codigo >= 70) return { emoji: "💻", title: "Lobo Solitário do Código", desc: "Técnica afiada — falta só trabalhar mais em equipe." };
  if (total >= 150) return { emoji: "🎓", title: "Desenvolvedor Júnior Formado", desc: "Uma jornada equilibrada. Parabéns pela formatura!" };
  return { emoji: "🐛", title: "Estagiário Caçador de Bugs", desc: "A jornada foi dura, mas todo sênior começou assim." };
}

export function getScore(s: Stats) {
  return Math.round(s.codigo * 0.45 + s.reputacao * 0.35 + s.energia * 0.2) * 10;
}
