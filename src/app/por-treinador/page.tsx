import { PorTreinadorView } from "@/components/por-treinador/por-treinador-view";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";
import { listarTreinadores } from "@/lib/treinadores-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";
import { auth } from "@/lib/auth";

export default async function PorTreinadorPage() {
  // Consultas sequenciais (não Promise.all) — o Neon usa um pooler de ligações
  // em modo transação, que não lida bem com várias queries em paralelo na
  // mesma ligação partilhada.
  const avaliacoes = await listarAvaliacoes();
  const treinadores = await listarTreinadores();
  const atribuicoes = await obterAtribuicoesPilares();
  const session = await auth();

  return (
    <PorTreinadorView
      avaliacoes={avaliacoes}
      treinadores={treinadores.map((t) => ({ id: t.id, nome: t.nome, ativo: t.ativo }))}
      atribuicoes={atribuicoes}
      nomeTreinadorFixo={session!.user.papel === "TREINADOR" ? session!.user.name! : undefined}
    />
  );
}
