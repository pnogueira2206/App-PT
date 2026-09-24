import { PorTreinadorView } from "@/components/por-treinador/por-treinador-view";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";
import { listarTreinadores } from "@/lib/treinadores-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";
import { auth } from "@/lib/auth";

export default async function PorTreinadorPage() {
  const [avaliacoes, treinadores, atribuicoes, session] = await Promise.all([
    listarAvaliacoes(),
    listarTreinadores(),
    obterAtribuicoesPilares(),
    auth(),
  ]);

  return (
    <PorTreinadorView
      avaliacoes={avaliacoes}
      treinadores={treinadores.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      atribuicoes={atribuicoes}
      nomeTreinadorFixo={session!.user.papel === "TREINADOR" ? session!.user.name! : undefined}
    />
  );
}
