import { prisma } from "@/lib/prisma";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";
import { listarTreinadoresAtivos } from "@/lib/treinadores-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";
import { listarPlano, PlanoItem } from "@/lib/plano-actions";
import { subtotalPorPilar } from "@/lib/pilares-notas";
import { PILARES, Pilar } from "@/data/pilares";
import { hojeIso, segundaDaSemana, somarDias } from "@/lib/plano-datas";
import { avaliacoesDoTreinador, INTERVALO_DIAS, mediaUltimasAvaliacoes, Nivel, nivelDaMedia } from "@/lib/niveis";

// Dados do Painel (página inicial de Admin). Não é "use server": só é chamado pela página.

/** Quantos dias antes do prazo um treinador passa a aparecer como "a vencer". */
const DIAS_AVISO = 14;

export interface LinhaPrazo {
  nome: string;
  nivel: Nivel | null;
  media: number | null;
  ultimaData: string | null;
  /** Dias até ao prazo (negativo = em atraso); null = nunca foi avaliado. */
  diasParaPrazo: number | null;
  agendado: PlanoItem | null;
}

function diasEntre(de: string, ate: string) {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

function media(valores: number[]) {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

export async function obterDadosPainel() {
  const hoje = hojeIso();
  const semana = segundaDaSemana(hoje);

  // Sequencial, não Promise.all: o pooler do Neon falha com consultas em paralelo na mesma ligação.
  const avaliacoes = await listarAvaliacoes();
  const treinadores = await listarTreinadoresAtivos();
  const atribuicoes = await obterAtribuicoesPilares();
  const proximas = await listarPlano(semana, somarDias(semana, 7));
  const agendadasFuturas = await listarPlano(semana, "9999-12-31");
  const porFinalizar = await prisma.avaliacaoPlaneada.count({ where: { estado: "AVALIADO" } });

  const nomesAtivos = new Set(treinadores.map((t) => t.nome));
  const dasAtivas = avaliacoes.filter((a) => nomesAtivos.has(a.cabecalho.treinador));

  // Números do topo
  const mes = hoje.slice(0, 7);
  const ano = hoje.slice(0, 4);
  const ha90 = somarDias(hoje, -90);
  const ha180 = somarDias(hoje, -180);
  const notas = (de: string, ate: string) =>
    avaliacoes.filter((a) => a.cabecalho.data > de && a.cabecalho.data <= ate).map((a) => Number(a.classificacaoGeral));
  const mediaRecente = media(notas(ha90, hoje));
  const mediaAnterior = media(notas(ha180, ha90));
  const avaliadosRecentes = new Set(dasAtivas.filter((a) => a.cabecalho.data > ha90).map((a) => a.cabecalho.treinador));

  // Prazos por nível
  const prazos: LinhaPrazo[] = treinadores.map((t) => {
    const m = mediaUltimasAvaliacoes(avaliacoes, t.nome);
    const nivel = m ? nivelDaMedia(m.media) : null;
    const ultima = avaliacoesDoTreinador(avaliacoes, t.nome).at(-1)?.cabecalho.data ?? null;
    const agendado = agendadasFuturas.find((p) => p.treinadorId === t.id && p.estado === "POR_AVALIAR") ?? null;
    return {
      nome: t.nome,
      nivel,
      media: m?.media ?? null,
      ultimaData: ultima,
      diasParaPrazo: ultima && nivel ? INTERVALO_DIAS[nivel] - diasEntre(ultima, hoje) : null,
      agendado,
    };
  });
  const emAtraso = prazos
    .filter((p) => p.diasParaPrazo === null || p.diasParaPrazo < 0)
    .sort((a, b) => (a.diasParaPrazo ?? -9999) - (b.diasParaPrazo ?? -9999));
  const aVencer = prazos
    .filter((p) => p.diasParaPrazo !== null && p.diasParaPrazo >= 0 && p.diasParaPrazo <= DIAS_AVISO)
    .sort((a, b) => a.diasParaPrazo! - b.diasParaPrazo!);

  // Pilares da equipa: últimos 6 meses, só treinadores ativos
  const recentes = dasAtivas.filter((a) => a.cabecalho.data > ha180);
  const pilares = PILARES.map((pilar: Pilar) => {
    let obtidos = 0;
    let max = 0;
    for (const a of recentes) {
      const st = subtotalPorPilar(a.grelhaSnapshot, a.respostas, pilar, atribuicoes);
      obtidos += st.obtidos;
      max += st.max;
    }
    return { pilar, pct: max > 0 ? (obtidos / max) * 100 : null };
  });

  const ultimas = [...avaliacoes]
    .sort((a, b) => (a.cabecalho.data + a.cabecalho.hora < b.cabecalho.data + b.cabecalho.hora ? 1 : -1))
    .slice(0, 5)
    .map((a) => ({ id: a.id, treinador: a.cabecalho.treinador, data: a.cabecalho.data, nota: Number(a.classificacaoGeral) }));

  return {
    hoje,
    semana,
    numeros: {
      doMes: avaliacoes.filter((a) => a.cabecalho.data.startsWith(mes)).length,
      doAno: avaliacoes.filter((a) => a.cabecalho.data.startsWith(ano)).length,
      mediaRecente,
      mediaAnterior,
      avaliadosRecentes: avaliadosRecentes.size,
      totalAtivos: treinadores.length,
      porFinalizar,
    },
    proximas,
    emAtraso,
    aVencer,
    niveis: prazos.filter((p) => p.nivel !== null),
    semAvaliacao: prazos.filter((p) => p.nivel === null).map((p) => p.nome),
    pilares,
    ultimas,
  };
}

export type DadosPainel = Awaited<ReturnType<typeof obterDadosPainel>>;
