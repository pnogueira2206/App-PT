import { GerirEspacos } from "@/components/admin/gerir-espacos";
import { listarEspacos } from "@/lib/espacos-actions";

export default async function EspacosPage() {
  const itens = await listarEspacos();
  return <GerirEspacos itens={itens} />;
}
