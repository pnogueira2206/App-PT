import { GerirPessoas } from "@/components/admin/gerir-pessoas";
import { listarAdministradores } from "@/lib/administradores-actions";

export default async function AdministradoresPage() {
  const itens = await listarAdministradores();
  return (
    <GerirPessoas
      tipo="administradores"
      itens={itens.map((a) => ({ id: a.id, nome: a.nome, email: a.email, ativo: a.ativo }))}
    />
  );
}
