import { HistoricoList } from "@/components/historico/historico-list";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";
import { listarTreinadores } from "@/lib/treinadores-actions";
import { listarTiposAula } from "@/lib/tipos-aula-actions";
import { auth } from "@/lib/auth";

export default async function HistoricoPage() {
  const [avaliacoes, treinadores, tiposAula, session] = await Promise.all([
    listarAvaliacoes(),
    listarTreinadores(),
    listarTiposAula(),
    auth(),
  ]);

  return (
    <HistoricoList
      avaliacoesIniciais={avaliacoes}
      treinadores={treinadores.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      tiposAula={tiposAula.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      papel={session!.user.papel}
    />
  );
}
