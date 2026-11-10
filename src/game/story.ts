export type Stats = { energia: number; codigo: number; reputacao: number };
export type Choice = { text: string; effect: Partial<Stats>; result: string };
<<<<<<< HEAD
export type ScenarioIcon = "bug" | "users" | "book" | "code" | "trophy";
export type Scenario = {
  id: string;
  phase: string;
  title: string;
  milestone: string;
  text: string;
  icon: ScenarioIcon;
  choices: Choice[];
};
=======
export type Scenario = { id: string; phase: string; title: string; milestone: string; text: string; choices: Choice[] };
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d

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
<<<<<<< HEAD
    id: "primeiro-bug",
    phase: "Módulo 1: Lógica & Primeiros Passos",
    milestone: "O primeiro bug resolvido",
    title: "O Primeiro Bug",
    icon: "bug",
    text: "No laboratório de informática da EEEP, um laço infinito trava o sistema da turma. A aula está quase acabando e o professor precisa do programa funcionando. Você abre o código e encontra a condição de parada errada.",
    choices: [
      { text: "Rastrear o laço linha por linha e corrigir a condição", effect: { codigo: 15, energia: -10, reputacao: 5 }, result: "A condição nunca ficava falsa. Você corrigiu o laço, testou os limites e salvou a atividade antes do sinal." },
      { text: "Chamar um colega e depurar em dupla", effect: { codigo: 10, energia: -5, reputacao: 10 }, result: "Quatro olhos encontraram o erro mais rápido. A turma aprendeu junto e o programa voltou a rodar." },
      { text: "Reescrever o trecho sem testar para ganhar tempo", effect: { codigo: 5, energia: -5, reputacao: -5 }, result: "O programa abriu, mas um caso de borda ainda falha. Você anotou que testar também faz parte de programar." },
    ],
  },
  {
    id: "desafio-grupo",
    phase: "Módulo 2: POO & Banco de Dados",
    milestone: "Equipe alinhada para o projeto",
    title: "O Desafio do Grupo",
    icon: "users",
    text: "O projeto da turma precisa de um backend, modelagem de dados e uma interface. O prazo está apertado e duas pessoas do grupo ainda não sabem por onde começar. Você decide como a equipe vai trabalhar.",
    choices: [
      { text: "Assumir todo o backend para garantir a entrega", effect: { codigo: 15, energia: -20, reputacao: -10 }, result: "O backend avançou, mas o grupo ficou sem espaço para contribuir e você acumulou trabalho demais." },
      { text: "Dividir tarefas, parear no código e revisar as entregas", effect: { codigo: 10, energia: -10, reputacao: 15 }, result: "Cada pessoa assumiu uma parte, as decisões ficaram claras e a equipe entregou um backend consistente." },
      { text: "Organizar o banco e documentar as tarefas para o grupo", effect: { codigo: 12, energia: -8, reputacao: 10 }, result: "Com o modelo de dados e as responsabilidades definidos, o grupo conseguiu avançar sem retrabalho." },
    ],
  },
  {
    id: "maratona-estudos",
    phase: "Módulo 2: POO & Banco de Dados",
    milestone: "Estudos e projeto em equilíbrio",
    title: "Maratona de Estudos & Provas",
    icon: "book",
    text: "A semana junta revisão para SPAECE e ENEM com uma entrega importante do sistema. Virar a noite parece tentador, mas você precisa escolher um plano que preserve os estudos, o projeto e sua energia.",
    choices: [
      { text: "Montar blocos de estudo e reservar horários curtos para o projeto", effect: { codigo: 10, energia: -5, reputacao: 8 }, result: "Um cronograma realista manteve o projeto em movimento e abriu espaço para revisar as provas com calma." },
      { text: "Focar no SPAECE/ENEM e negociar uma entrega menor", effect: { codigo: 5, energia: 5, reputacao: 5 }, result: "Você cuidou dos estudos e combinou uma versão menor do projeto com a equipe, sem deixar ninguém no escuro." },
      { text: "Passar a noite codando e deixar a revisão para depois", effect: { codigo: 15, energia: -20, reputacao: -5 }, result: "A funcionalidade ficou pronta, mas o cansaço pesou e você chegou às provas sem a revisão planejada." },
      { text: "Estudar em grupo e dividir uma última tarefa do sistema", effect: { codigo: 8, energia: -8, reputacao: 12 }, result: "A revisão coletiva ajudou todo mundo, e a equipe concluiu a tarefa que faltava." },
    ],
  },
  {
    id: "vespera-expotec",
    phase: "Módulo 3: Projeto Final & Expotec",
    milestone: "Erro crítico corrigido na véspera",
    title: "A Véspera da Expotec",
    icon: "code",
    text: "São duas da manhã, poucas horas antes da Expotec. Uma alteração de última hora deixou um erro de sintaxe bloqueando a inicialização do projeto. O estande abre cedo; você precisa agir sem perder o controle.",
    choices: [
      { text: "Ler o erro, isolar a mudança e corrigir com um teste rápido", effect: { codigo: 18, energia: -15, reputacao: 8 }, result: "A mensagem apontava a linha exata. Você corrigiu a sintaxe, rodou os testes e confirmou a inicialização antes de parar." },
      { text: "Reverter a última alteração e avisar a equipe", effect: { codigo: 10, energia: -5, reputacao: 12 }, result: "A versão estável voltou a funcionar. A equipe foi avisada e vocês combinaram revisar a mudança depois da apresentação." },
      { text: "Pedir uma segunda revisão antes de mexer no código", effect: { codigo: 12, energia: -8, reputacao: 15 }, result: "Uma colega notou um caractere faltando. Revisar em dupla evitou uma correção apressada." },
      { text: "Fazer uma gambiarra rápida sem executar o projeto", effect: { codigo: 5, energia: -12, reputacao: -8 }, result: "O erro pareceu sumir, mas sem executar o projeto você não tem certeza de que a demo está segura." },
    ],
  },
  {
    id: "banca-expotec",
    phase: "Módulo 3: Projeto Final & Expotec",
    milestone: "Projeto apresentado na banca da Expotec",
    title: "Banca da Expotec — Chefão Final",
    icon: "trophy",
    text: "Chegou a apresentação ao vivo para a banca e os visitantes na EEEP Dr. Salomão Alves de Moura. O estande está cheio e o sistema dá um sinal de instabilidade. É hora de mostrar tanto o projeto quanto o que você aprendeu na jornada.",
    choices: [
      { text: "Apresentar o problema, demonstrar a solução e responder à banca em equipe", effect: { codigo: 15, energia: -8, reputacao: 15 }, result: "A demonstração ficou clara, a equipe dividiu as respostas e a banca viu o valor do projeto e do trabalho coletivo." },
      { text: "Explicar a arquitetura e mostrar uma demo gravada como plano B", effect: { codigo: 12, energia: -5, reputacao: 10 }, result: "A demo gravada garantiu a apresentação. Você explicou as escolhas técnicas e respondeu às perguntas com segurança." },
      { text: "Improvisar uma correção ao vivo sem combinar com a equipe", effect: { codigo: 10, energia: -15, reputacao: -5 }, result: "A correção funcionou, mas a equipe foi pega de surpresa. Você concluiu a apresentação e anotou o que faria diferente." },
=======
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
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
    ],
  },
];

<<<<<<< HEAD
export type Ending = {
  title: string;
  desc: string;
  badge: "senior" | "gambiarra" | "lider" | "sobrevivente";
};

export function getEnding(s: Stats): Ending {
  if (s.codigo >= 75 && s.reputacao >= 70) {
    return { badge: "senior", title: "Dev Senior Supreme", desc: "Seu domínio técnico e sua reputação mostram que você sabe entregar e crescer com a equipe." };
  }
  if (s.codigo >= 70 && s.energia <= 25) {
    return { badge: "gambiarra", title: "Mestre da Gambiarra", desc: "Você acumulou XP e chegou até a banca, mesmo com a energia no limite. Próxima missão: descansar também faz parte do trabalho." };
  }
  if (s.reputacao >= 70) {
    return { badge: "lider", title: "Líder de Equipe", desc: "Você aproximou pessoas, dividiu responsabilidades e fez a equipe brilhar na Expotec." };
  }
  return { badge: "sobrevivente", title: "Estagiário Sobrevivente", desc: "Você atravessou os desafios e chegou à apresentação. A experiência conquistada é o primeiro passo para a próxima jornada." };
=======
export type Ending = { title: string; desc: string; emoji: string };

export function getEnding(s: Stats): Ending {
  const total = s.energia + s.codigo + s.reputacao;
  if (s.codigo >= 75 && s.reputacao >= 65) return { emoji: "🏆", title: "Dev Master Senior: Aprovado com Louvor!", desc: "Código impecável e uma turma que te admira. O mercado te espera." };
  if (s.energia <= 15) return { emoji: "☕", title: "Sobreviveu na Base do Café", desc: "Chegou ao fim no limite das forças, mas chegou!" };
  if (s.reputacao >= 70) return { emoji: "🤝", title: "Líder da Turma", desc: "Suas habilidades sociais fizeram a equipe brilhar." };
  if (s.codigo >= 70) return { emoji: "💻", title: "Lobo Solitário do Código", desc: "Técnica afiada — falta só trabalhar mais em equipe." };
  if (total >= 150) return { emoji: "🎓", title: "Desenvolvedor Júnior Formado", desc: "Uma jornada equilibrada. Parabéns pela formatura!" };
  return { emoji: "🐛", title: "Estagiário Caçador de Bugs", desc: "A jornada foi dura, mas todo sênior começou assim." };
>>>>>>> 46fd15a1e33b317259ac4b8a4ebd74ccd635075d
}

export function getScore(s: Stats) {
  return Math.round(s.codigo * 0.45 + s.reputacao * 0.35 + s.energia * 0.2) * 10;
}
