import { NovaAvaliacaoForm } from "@/components/nova-avaliacao/nova-avaliacao-form";
import { obterGrelhaAtiva } from "@/lib/grelha-actions";
import { listarTreinadoresAtivos } from "@/lib/treinadores-actions";
import { listarTiposAulaAtivos } from "@/lib/tipos-aula-actions";
import { listarEspacosAtivos } from "@/lib/espacos-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";

export default async function NovaAvaliacaoPage() {
  // Consultas sequenciais (não Promise.all) — o Neon usa um pooler de ligações
  // em modo transação, que não lida bem com várias queries em paralelo na
  // mesma ligação partilhada (causava falhas intermitentes a gravar).
  const seccoes = await obterGrelhaAtiva();
  const treinadores = await listarTreinadoresAtivos();
  const tiposAula = await listarTiposAulaAtivos();
  const espacos = await listarEspacosAtivos();
  const atribuicoes = await obterAtribuicoesPilares();

  return (
    <NovaAvaliacaoForm
      seccoesIniciais={seccoes}
      treinadores={treinadores.map((t) => t.nome)}
      tiposDeAula={tiposAula.map((t) => t.nome)}
      espacos={espacos.map((e) => e.nome)}
      atribuicoes={atribuicoes}
    />
  );
}
