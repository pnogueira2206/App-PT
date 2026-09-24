import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { grelhaInicial } from "../src/data/grelha";

const prisma = new PrismaClient();

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gerarRespostas(rng: () => number): Record<string, any> {
  const respostas: Record<string, unknown> = {};
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

async function main() {
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordAvaliador = await bcrypt.hash("coach123", 10);
  const passwordTreinador = await bcrypt.hash("treino123", 10);

  await prisma.utilizador.upsert({
    where: { email: "admin@cfa.pt" },
    update: {},
    create: { nome: "Admin CFA", email: "admin@cfa.pt", passwordHash: passwordAdmin, papel: "ADMIN" },
  });

  const nomesAvaliadores = ["Head Coach 1", "Head Coach 2", "Head Coach 3"];
  const avaliadores = [];
  for (let i = 0; i < nomesAvaliadores.length; i++) {
    const email = `headcoach${i + 1}@cfa.pt`;
    avaliadores.push(
      await prisma.utilizador.upsert({
        where: { email },
        update: {},
        create: { nome: nomesAvaliadores[i], email, passwordHash: passwordAvaliador, papel: "AVALIADOR" },
      })
    );
  }

  const letrasTreinadores = ["A", "B", "C", "D", "E", "F"];
  const treinadores = [];
  for (const letra of letrasTreinadores) {
    const email = `treinador${letra.toLowerCase()}@cfa.pt`;
    treinadores.push(
      await prisma.utilizador.upsert({
        where: { email },
        update: {},
        create: { nome: `Treinador ${letra}`, email, passwordHash: passwordTreinador, papel: "TREINADOR" },
      })
    );
  }

  const nomesTiposAula = ["CrossFit", "Functional Bodybuilding", "Hybrid"];
  const tiposAula = [];
  for (const nome of nomesTiposAula) {
    const existente = await prisma.tipoAula.findFirst({ where: { nome } });
    tiposAula.push(existente ?? (await prisma.tipoAula.create({ data: { nome } })));
  }

  const espacos = ["CFA Oriente", "CFA Carnaxide"];

  for (let i = 0; i < grelhaInicial.length; i++) {
    const seccao = grelhaInicial[i];
    await prisma.seccao.upsert({
      where: { id: seccao.id },
      update: {},
      create: { id: seccao.id, nome: seccao.nome, percentagem: seccao.percentagem, ordem: i },
    });
    for (let j = 0; j < seccao.criterios.length; j++) {
      const c = seccao.criterios[j];
      await prisma.criterio.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          seccaoId: seccao.id,
          texto: c.texto,
          pesoMaximo: c.pesoMaximo,
          tipoResposta: c.tipoResposta,
          dimensao: c.dimensao,
          ordem: j,
        },
      });
    }
  }

  const jaExistem = await prisma.avaliacao.count();
  if (jaExistem === 0) {
    const rng = criarRng(42);
    let contador = 0;
    for (let ti = 0; ti < treinadores.length; ti++) {
      for (let n = 0; n < 2; n++) {
        const periodoIndex = (ti + n) % periodos.length;
        const data = adicionarDias(periodos[periodoIndex], Math.floor(rng() * 15));
        const avaliador = avaliadores[(ti + n) % avaliadores.length];
        const espaco = espacos[(ti + n) % espacos.length];
        const tipoAula = tiposAula[(ti + n * 2) % tiposAula.length];
        const hora = horasPossiveis[Math.floor(rng() * horasPossiveis.length)];
        const nAlunos = 6 + Math.floor(rng() * 11);
        const respostas = gerarRespostas(rng);
        const classificacaoGeral = 55 + Math.floor(rng() * 41);

        const observacoes: Record<string, string> = {};
        for (const seccao of grelhaInicial) {
          observacoes[seccao.id] = observacoesPossiveis[Math.floor(rng() * observacoesPossiveis.length)];
        }

        const treinadorConfirmou = rng() < 0.7;
        contador += 1;

        await prisma.avaliacao.create({
          data: {
            id: `seed-${contador}`,
            treinadorId: treinadores[ti].id,
            avaliadorId: avaliador.id,
            espaco,
            tipoAulaId: tipoAula.id,
            data,
            hora,
            nAlunos,
            respostas: JSON.stringify(respostas),
            observacoes: JSON.stringify(observacoes),
            grelhaSnapshot: JSON.stringify(grelhaInicial),
            classificacaoGeral,
            comentarioGeral: comentariosPossiveis[Math.floor(rng() * comentariosPossiveis.length)],
            confirmacaoAvaliadorData: data,
            confirmacaoTreinadorData: treinadorConfirmou ? adicionarDias(data, 1 + Math.floor(rng() * 3)) : null,
            guardadaEm: new Date(data + "T20:00:00.000Z"),
          },
        });
      }
    }
  }

  console.log("Seed concluído.");
  console.log("Admin: admin@cfa.pt / admin123");
  console.log("Avaliadores: headcoach1@cfa.pt (e 2, 3) / coach123");
  console.log("Treinadores: treinadora@cfa.pt (e b..f) / treino123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
