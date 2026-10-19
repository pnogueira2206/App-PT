import { HistoricoList } from "@/components/historico/historico-list";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";
import { listarTreinadores } from "@/lib/treinadores-actions";
import { listarTiposAula } from "@/lib/tipos-aula-actions";
import { auth } from "@/lib/auth";

export default async function HistoricoPage() {
  // Consultas sequenciais (não Promise.all) — o Neon usa um pooler de ligações
  // em modo transação, que não lida bem com várias queries em paralelo na
  // mesma ligação partilhada.
  const avaliacoes = await listarAvaliacoes();
  const treinadores = await listarTreinadores();
  const tiposAula = await listarTiposAula();
  const session = await auth();

  return (
    <HistoricoList
      avaliacoesIniciais={avaliacoes}
      treinadores={treinadores.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      tiposAula={tiposAula.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      papel={session!.user.papel}
    />
  );
}
