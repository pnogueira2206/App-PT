import { GerirTreinadores } from "@/components/admin/gerir-treinadores";
import { listarTreinadores } from "@/lib/treinadores-actions";

export default async function TreinadoresPage() {
  const itens = await listarTreinadores();
  return <GerirTreinadores itens={itens.map((t) => ({ id: t.id, nome: t.nome, email: t.email, ativo: t.ativo }))} />;
}
