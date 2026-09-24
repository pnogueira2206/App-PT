import { grelhaInicial } from "@/data/grelha";
import { avaliadores, espacos, tiposDeAula, treinadores } from "@/data/mock";
import { AvaliacaoGuardada, Respostas } from "@/types/avaliacao";

// PRNG determinístico (mulberry32) para os dados fictícios serem sempre iguais.
function criarRng(seed: number) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const horasPossiveis = ["07:00", "09:00", "12:30", "18:00", "19:00", "20:00"];
const observacoesPossiveis = [
  "Boa gestão do tempo, aula fluida.",
  "Podia circular mais pela turma.",
  "Excelente energia e ligação com os alunos.",
  "Faltou reforçar os pontos de performance no fim.",
  "",
  "",
];
const comentariosPossiveis = [
  "Aula sólida, continuar a trabalhar a circulação e o feedback individual.",
  "Muito boa evolução desde a última avaliação.",
  "Precisa de melhorar a gestão do tempo entre blocos.",
  "Excelente exemplo de coaching, energia muito positiva.",
];

function gerarRespostas(rng: () => number): Respostas {
  const respostas: Respostas = {};
  for (const seccao of grelhaInicial) {
    for (const c of seccao.criterios) {
      if (c.tipoResposta === "TEXTO_LIVRE") {
        respostas[c.id] = {
          tipo: "TEXTO_LIVRE",
          texto:
            rng() < 0.85
              ? "Foi identificada uma fraqueza específica e trabalhada com correções ao longo da aula."
              : "Ainda não foi possível avaliar este ponto nesta aula.",
        };
        continue;
      }
      if (c.pesoMaximo == null) {
        const r = rng();
        respostas[c.id] =
          r < 0.1 ? { tipo: "PONTOS", valor: null, na: true } : { tipo: "PONTOS", valor: r < 0.75 ? 1 : 0, na: false };
        continue;
      }
      if (rng() < 0.05) {
        respostas[c.id] = { tipo: "PONTOS", valor: null, na: true };
        continue;
      }
      const passos = Math.round(c.pesoMaximo * 2);
      // tendencial para valores altos (staff com bom desempenho), com alguma variação
      const escolha = Math.min(passos, Math.round(passos * (0.55 + rng() * 0.55)));
      respostas[c.id] = { tipo: "PONTOS", valor: escolha / 2, na: false };
    }
  }
  return respostas;
}

const periodos = ["2026-03-05", "2026-06-10", "2026-09-12"];

function adicionarDias(dataIso: string, dias: number): string {
  const d = new Date(dataIso + "T00:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function gerarAvaliacoesFicticias(): AvaliacaoGuardada[] {
  const rng = criarRng(42);
  const avaliacoes: AvaliacaoGuardada[] = [];
  let contador = 0;

  treinadores.forEach((treinador, ti) => {
    for (let n = 0; n < 2; n++) {
      const periodoIndex = (ti + n) % periodos.length;
      const data = adicionarDias(periodos[periodoIndex], Math.floor(rng() * 15));
      const avaliador = avaliadores[(ti + n) % avaliadores.length];
      const espaco = espacos[(ti + n) % espacos.length];
      const tipoAula = tiposDeAula[(ti + n * 2) % tiposDeAula.length];
      const hora = horasPossiveis[Math.floor(rng() * horasPossiveis.length)];
      const nAlunos = String(6 + Math.floor(rng() * 11));

      const respostas = gerarRespostas(rng);
      const classificacaoGeral = String(55 + Math.floor(rng() * 41));

      const observacoes: Record<string, string> = {};
      for (const seccao of grelhaInicial) {
        observacoes[seccao.id] = observacoesPossiveis[Math.floor(rng() * observacoesPossiveis.length)];
      }

      const treinadorConfirmou = rng() < 0.7;

      contador += 1;
      avaliacoes.push({
        id: `seed-${contador}`,
        guardadaEm: data + "T20:00:00.000Z",
        grelhaSnapshot: grelhaInicial,
        cabecalho: { treinador, avaliador, espaco, data, hora, tipoAula, nAlunos },
        respostas,
        observacoes,
        classificacaoGeral,
        comentarioGeral: comentariosPossiveis[Math.floor(rng() * comentariosPossiveis.length)],
        confirmacaoAvaliador: { nome: avaliador, data },
        confirmacaoTreinador: treinadorConfirmou
          ? { nome: treinador, data: adicionarDias(data, 1 + Math.floor(rng() * 3)) }
          : { nome: "", data: "" },
      });
    }
  });

  return avaliacoes;
}
