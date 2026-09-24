import { AvaliacaoDetalhe } from "@/components/historico/avaliacao-detalhe";
import { obterAvaliacao } from "@/lib/avaliacoes-actions";
import { auth } from "@/lib/auth";

export default async function HistoricoDetalhePage({ params }: PageProps<"/historico/[id]">) {
  const { id } = await params;
  const [avaliacao, session] = await Promise.all([obterAvaliacao(id), auth()]);

  return <AvaliacaoDetalhe avaliacao={avaliacao ?? null} papel={session!.user.papel} />;
}
