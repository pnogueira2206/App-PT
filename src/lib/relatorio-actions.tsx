"use server";

import { revalidatePath } from "next/cache";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registarAuditoria } from "@/lib/auditoria";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";
import { obterAvaliacao } from "@/lib/avaliacoes-actions";
import { RelatorioAvaliacaoDocument } from "@/lib/pdf/relatorio-avaliacao";

async function gerarPdfBuffer(avaliacaoId: string) {
  const avaliacao = await obterAvaliacao(avaliacaoId);
  if (!avaliacao) throw new Error("Avaliação não encontrada.");
  const atribuicoes = await obterAtribuicoesPilares();
  const buffer = await renderToBuffer(
    <RelatorioAvaliacaoDocument avaliacao={avaliacao} atribuicoes={atribuicoes} />
  );
  return { avaliacao, buffer };
}

/** Devolve o PDF em base64 para descarregar no browser, sem enviar nada por email. */
export async function gerarRelatorioPdfAction(avaliacaoId: string): Promise<string> {
  const session = await auth();
  if (!session || session.user.papel === "TREINADOR") throw new Error("Não autorizado.");

  const { buffer } = await gerarPdfBuffer(avaliacaoId);
  await registarAuditoria(session.user.id, "GEROU_RELATORIO", avaliacaoId);
  return Buffer.from(buffer).toString("base64");
}

export async function enviarRelatorioEmailAction(avaliacaoId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.papel === "TREINADOR") throw new Error("Não autorizado.");

  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "O envio por email ainda não está configurado nesta instalação (falta a chave RESEND_API_KEY)."
    );
  }

  const linha = await prisma.avaliacao.findUnique({
    where: { id: avaliacaoId },
    include: { treinador: true },
  });
  if (!linha) throw new Error("Avaliação não encontrada.");

  const { avaliacao, buffer } = await gerarPdfBuffer(avaliacaoId);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const remetente = process.env.RESEND_FROM_EMAIL || "CFA Avaliações <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from: remetente,
    to: linha.treinador.email,
    subject: `Relatório de avaliação — ${avaliacao.cabecalho.data || ""} (${avaliacao.cabecalho.tipoAula})`,
    text: `Olá ${linha.treinador.nome},\n\nEm anexo o relatório da tua avaliação de ${avaliacao.cabecalho.data || "—"} (${avaliacao.cabecalho.tipoAula || "—"}), feita por ${avaliacao.cabecalho.avaliador || "—"}.\n\nCFA Avaliações`,
    attachments: [
      {
        filename: `relatorio-${avaliacao.cabecalho.treinador}-${avaliacao.cabecalho.data}.pdf`,
        content: Buffer.from(buffer),
      },
    ],
  });

  if (error) throw new Error(error.message || "Falha ao enviar o email.");

  await prisma.avaliacao.update({
    where: { id: avaliacaoId },
    data: { relatorioEnviadoEm: new Date() },
  });
  await registarAuditoria(session.user.id, "ENVIOU_RELATORIO", `${avaliacaoId} → ${linha.treinador.email}`);
  revalidatePath(`/historico/${avaliacaoId}`);
  revalidatePath("/historico");
}
