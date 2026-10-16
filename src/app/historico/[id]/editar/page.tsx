import { redirect } from "next/navigation";
import { EditarAvaliacaoForm } from "@/components/historico/editar-avaliacao-form";
import { obterAvaliacao } from "@/lib/avaliacoes-actions";
import { listarTreinadoresAtivos } from "@/lib/treinadores-actions";
import { listarTiposAulaAtivos } from "@/lib/tipos-aula-actions";
import { listarEspacosAtivos } from "@/lib/espacos-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";
import { auth } from "@/lib/auth";

function comValorAtual(lista: string[], atual: string): string[] {
  return lista.includes(atual) ? lista : [atual, ...lista];
}

export default async function EditarAvaliacaoPage({ params }: PageProps<"/historico/[id]/editar">) {
  const { id } = await params;
  const session = await auth();
  if (session!.user.papel !== "ADMIN") redirect(`/historico/${id}`);

  const [avaliacao, treinadores, tiposAula, espacos, atribuicoes] = await Promise.all([
    obterAvaliacao(id),
    listarTreinadoresAtivos(),
    listarTiposAulaAtivos(),
    listarEspacosAtivos(),
    obterAtribuicoesPilares(),
  ]);

  if (!avaliacao) redirect("/historico");

  return (
    <EditarAvaliacaoForm
      avaliacao={avaliacao}
      treinadores={comValorAtual(treinadores.map((t) => t.nome), avaliacao.cabecalho.treinador)}
      tiposDeAula={comValorAtual(tiposAula.map((t) => t.nome), avaliacao.cabecalho.tipoAula)}
      espacos={comValorAtual(espacos.map((e) => e.nome), avaliacao.cabecalho.espaco)}
      atribuicoes={atribuicoes}
    />
  );
}
