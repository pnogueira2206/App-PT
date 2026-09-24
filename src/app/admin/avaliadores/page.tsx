import { GerirPessoas } from "@/components/admin/gerir-pessoas";
import { listarAvaliadores } from "@/lib/avaliadores-actions";

export default async function AvaliadoresPage() {
  const itens = await listarAvaliadores();
  return (
    <GerirPessoas
      tipo="avaliadores"
      itens={itens.map((a) => ({ id: a.id, nome: a.nome, email: a.email, ativo: a.ativo }))}
    />
  );
}
