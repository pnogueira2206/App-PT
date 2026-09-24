import { GerirTiposAula } from "@/components/admin/gerir-tipos-aula";
import { listarTiposAula } from "@/lib/tipos-aula-actions";

export default async function TiposAulaPage() {
  const itens = await listarTiposAula();
  return <GerirTiposAula itens={itens} />;
}
