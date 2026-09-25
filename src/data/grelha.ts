export type TipoResposta = "PONTOS" | "TEXTO_LIVRE";

export interface Criterio {
  id: string;
  texto: string;
  /** null = ainda sem peso atribuído (ex: "Feedback Cruzado", a definir mais tarde) */
  pesoMaximo: number | null;
  tipoResposta: TipoResposta;
  /** Nome da dimensão/subgrupo indicado na ficha original (para as notas por dimensão) */
  dimensao?: string;
  /** false = desativado pelo Admin; ausente/true = ativo */
  ativo?: boolean;
}

export interface Seccao {
  id: string;
  nome: string;
  percentagem: number;
  criterios: Criterio[];
  /** false = desativada pelo Admin; ausente/true = ativa */
  ativa?: boolean;
}

let n = 0;
const id = () => `c${++n}`;

export const grelhaInicial: Seccao[] = [
  {
    id: "s1",
    nome: "Plano de Aula",
    percentagem: 16,
    criterios: [
      { id: id(), texto: "Adaptar / Escalar", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "WUP (Warm-Up)" },
      { id: id(), texto: "Introdução Inicial", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "WUP (Warm-Up)" },
      { id: id(), texto: "Pontos de Performance", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "WUP (Warm-Up)" },
      { id: id(), texto: "Material e Organização", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "WUP (Warm-Up)" },
      { id: id(), texto: "Briefing/Instrução", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Skill/Strength" },
      { id: id(), texto: "Organização Turma", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Skill/Strength" },
      { id: id(), texto: "Aquecimento Específico / Pontos de Performance", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Skill/Strength" },
      { id: id(), texto: "Incremento de Carga", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Skill/Strength" },
      { id: id(), texto: "Adaptar / Escalar", pesoMaximo: 1.5, tipoResposta: "PONTOS", dimensao: "Skill/Strength" },
      { id: id(), texto: "Briefing/Instrução", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Wod / Acessório" },
      { id: id(), texto: "Organização Turma", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Wod / Acessório" },
      { id: id(), texto: "Aquecimento Específico / Pontos de Performance", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Wod / Acessório" },
      { id: id(), texto: "Incremento de Carga", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Wod / Acessório" },
      { id: id(), texto: "Adaptar / Escalar", pesoMaximo: 1.5, tipoResposta: "PONTOS", dimensao: "Wod / Acessório" },
      { id: id(), texto: "Tempos / Paraquedas / etc.", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Time Line" },
      { id: id(), texto: "Qualidade das escolhas, etc.", pesoMaximo: 2, tipoResposta: "PONTOS", dimensao: "Geral" },
    ],
  },
  {
    id: "s2",
    nome: "Introdução & Briefing Inicial",
    percentagem: 8,
    criterios: [
      { id: id(), texto: "Começou a aula a horas", pesoMaximo: 0.5, tipoResposta: "PONTOS" },
      { id: id(), texto: "Apresentação e fardamento", pesoMaximo: 1, tipoResposta: "PONTOS" },
      { id: id(), texto: "Chamada", pesoMaximo: 1, tipoResposta: "PONTOS" },
      { id: id(), texto: "Cumprimentou todos os alunos", pesoMaximo: 0.5, tipoResposta: "PONTOS" },
      { id: id(), texto: "Criar ambiente positivo e envolvente", pesoMaximo: 1, tipoResposta: "PONTOS" },
      { id: id(), texto: "Falou das atividades da Box", pesoMaximo: 1, tipoResposta: "PONTOS" },
      { id: id(), texto: "Briefing sucinto da aula", pesoMaximo: 1, tipoResposta: "PONTOS" },
      { id: id(), texto: "Enquadramento do treino na programação ou na semana", pesoMaximo: 0.5, tipoResposta: "PONTOS" },
      { id: id(), texto: "Lesões", pesoMaximo: 0.5, tipoResposta: "PONTOS" },
      { id: id(), texto: "Oralidade, presença, energia e ligação com os alunos", pesoMaximo: 1, tipoResposta: "PONTOS" },
    ],
  },
  {
    id: "s3",
    nome: "Aquecimento Geral",
    percentagem: 20,
    criterios: [
      { id: id(), texto: "Recurso visual na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Silêncio na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Credibilidade / Qualidade de execução dos movimentos", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Simples e claro", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Deixou claro um foco de execução por movimento (Pontos de Performance)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Reforço (Visual, Verbal ou tátil)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Escolha dos movimentos; dinamia e tempo na tarefa", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Organização do tempo; da turma; segurança", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Circulação", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Escalar / Adaptar movimentos de acordo com a necessidade do aluno", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Coerente entre o foco que verbalizou e a sua observação (o que ensinou e o que foi ver)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Deu pelo menos uma correção por pessoa", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros estáticos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros dinâmicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros grosseiros e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros clínicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Utilizou mais que um tipo de correção por movimento (verbal; visual; tátil)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Aplica de forma consciente triagem de falhas", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Tempo de feedback é o ideal (10-20\")", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Dá tempo para a prática e volta para confirmar o \"erro\" anterior", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Fez a avaliação das fraquezas de cada aluno?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
      { id: id(), texto: "Conseguiu fazer uma mudança real no movimento?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
    ],
  },
  {
    id: "s4",
    nome: "Aquecimento Específico / Work Sets",
    percentagem: 21,
    criterios: [
      { id: id(), texto: "Recurso visual na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Silêncio na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Credibilidade / Qualidade de execução dos movimentos", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Simples e claro", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Deixou claro um foco de execução por movimento (Pontos de Performance)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Utilizou progressões com foco específico do ensino", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Reforço (Visual, Verbal ou tátil)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Apresentou de forma clara a dinâmica do WUP ou Work Sets", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Escolha dos movimentos; dinamia da instrução e tempo na tarefa", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Organização do tempo; da turma; segurança", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Circulação", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Feedback cruzado", pesoMaximo: null, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Coerente entre o foco que verbalizou e a sua observação (o que ensinou e o que foi ver)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Escalar / Adaptar movimentos de acordo com a necessidade do aluno", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração" },
      { id: id(), texto: "Deu pelo menos uma correção por pessoa", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros estáticos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros dinâmicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros grosseiros e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros clínicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Aplica de forma consciente triagem de falhas", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Utilizou mais que um tipo de correção por movimento (verbal; visual; tátil)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Tempo de feedback é o ideal (10-20\")", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Dá tempo para a prática e volta para confirmar o \"erro\" anterior", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Fez a avaliação das fraquezas de cada aluno?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
      { id: id(), texto: "Conseguiu fazer uma mudança real no movimento?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
    ],
  },
  {
    id: "s5",
    nome: "Pre-Wod / Wod",
    percentagem: 21,
    criterios: [
      { id: id(), texto: "Recurso visual na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Silêncio na demonstração", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Credibilidade / Qualidade de execução dos movimentos", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Simples e claro", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Deixou claro um foco de execução por movimento (Pontos de Performance)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Usou e explicou de forma clara o pré-Wod", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Apresentou de forma clara a dinâmica e objetivo do Wod", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Geriu as expectativas de cada aluno", pesoMaximo: 0.5, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Organização do tempo; da turma; segurança", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Circulação", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Eficaz ao gerir o threshold speed de cada aluno", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Escalar / Adaptar movimentos de acordo com a necessidade do aluno", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Demonstração / Instrução" },
      { id: id(), texto: "Deu pelo menos uma correção por pessoa", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros estáticos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros dinâmicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros grosseiros e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Capacidade de reconhecer erros clínicos e intervir", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Utilizou mais que um tipo de correção por movimento (verbal; visual; tátil)", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Aplica de forma consciente triagem de falhas", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Tempo de feedback é o ideal (10-20\")", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Dá tempo para a prática e volta para confirmar o \"erro\" anterior", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Implacável entre coaching e motivação", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Capacidade de reconhecer e analisar erros mecânicos/técnicos" },
      { id: id(), texto: "Fez a avaliação das fraquezas de cada aluno?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
      { id: id(), texto: "Conseguiu fazer uma mudança real no movimento?", pesoMaximo: null, tipoResposta: "TEXTO_LIVRE" },
    ],
  },
  {
    id: "s6",
    nome: "Presença e Atitude",
    percentagem: 7,
    criterios: [
      { id: id(), texto: "Positivo; Empático; Conexão; Envolvente", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Criar ambiente de aprendizagem" },
      { id: id(), texto: "Preocupação genuína com os alunos", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Conhecer os atletas" },
      { id: id(), texto: "Capacidade para identificar sinais / Sensibilidade para gerir situações", pesoMaximo: 1, tipoResposta: "PONTOS", dimensao: "Conhecer os atletas" },
      { id: id(), texto: "Paixão", pesoMaximo: 2, tipoResposta: "PONTOS", dimensao: "Ser autêntico" },
      { id: id(), texto: "Capacidade de colocar a voz. Assertivo e confiante", pesoMaximo: 2, tipoResposta: "PONTOS", dimensao: "Oralidade" },
    ],
  },
  {
    id: "s7",
    nome: "Final da Aula",
    percentagem: 7,
    criterios: [
      { id: id(), texto: "Ambiente positivo", pesoMaximo: 2, tipoResposta: "PONTOS" },
      { id: id(), texto: "Feedback individual e verificou o estado de cada aluno / Feedback coletivo", pesoMaximo: 2, tipoResposta: "PONTOS" },
      { id: id(), texto: "Relembrar atividades extra aula", pesoMaximo: 2, tipoResposta: "PONTOS" },
      { id: id(), texto: "Fechar com até amanhã. Despedir de cada aluno", pesoMaximo: 1, tipoResposta: "PONTOS" },
    ],
  },
];
