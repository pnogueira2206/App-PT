import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { segundaDaSemana } from "@/lib/plano-datas";

// Ligação entre avaliações gravadas e o Plano de Avaliações. Fica fora de
// plano-actions.ts ("use server") de propósito: estas funções não verificam
// permissões e não podem ficar expostas como server actions.

/**
 * Chamado ao gravar uma avaliação: liga-a ao agendamento "Por avaliar" desse treinador
 * na semana da avaliação ou, se não houver, ao mais recente que ficou para trás
 * (avaliação feita com atraso), e passa-o para "Avaliado".
 */
export async function ligarAvaliacaoAoPlano(avaliacaoId: string, treinadorId: string, data: string) {
  const plano = await prisma.avaliacaoPlaneada.findFirst({
    where: { treinadorId, estado: "POR_AVALIAR", avaliacaoId: null, semana: { lte: segundaDaSemana(data) } },
    orderBy: { semana: "desc" },
  });
  if (!plano) return;
  await prisma.avaliacaoPlaneada.update({ where: { id: plano.id }, data: { avaliacaoId, estado: "AVALIADO" } });
  revalidatePath("/admin/plano");
}

/** Chamado antes de apagar uma avaliação: o agendamento que ela cumpria volta a "Por avaliar". */
export async function desligarAvaliacaoDoPlano(avaliacaoId: string) {
  await prisma.avaliacaoPlaneada.updateMany({
    where: { avaliacaoId, estado: "AVALIADO" },
    data: { estado: "POR_AVALIAR" },
  });
  revalidatePath("/admin/plano");
}
