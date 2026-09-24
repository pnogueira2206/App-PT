import { AvaliacaoDetalhe } from "@/components/historico/avaliacao-detalhe";

export default async function HistoricoDetalhePage({ params }: PageProps<"/historico/[id]">) {
  const { id } = await params;
  return <AvaliacaoDetalhe id={id} />;
}
