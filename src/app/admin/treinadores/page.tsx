import { GerirPessoas } from "@/components/admin/gerir-pessoas";
import { listarTreinadores } from "@/lib/treinadores-actions";

export default async function TreinadoresPage() {
  const itens = await listarTreinadores();
  return (
    <GerirPessoas
      tipo="treinadores"
      itens={itens.map((t) => ({ id: t.id, nome: t.nome, email: t.email, ativo: t.ativo }))}
    />
  );
}
