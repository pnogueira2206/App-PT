import { NovaAvaliacaoForm } from "@/components/nova-avaliacao/nova-avaliacao-form";
import { obterGrelhaAtiva } from "@/lib/grelha-actions";
import { listarTreinadoresAtivos } from "@/lib/treinadores-actions";
import { listarTiposAulaAtivos } from "@/lib/tipos-aula-actions";

export default async function NovaAvaliacaoPage() {
  const [seccoes, treinadores, tiposAula] = await Promise.all([
    obterGrelhaAtiva(),
    listarTreinadoresAtivos(),
    listarTiposAulaAtivos(),
  ]);

  return (
    <NovaAvaliacaoForm
      seccoesIniciais={seccoes}
      treinadores={treinadores.map((t) => t.nome)}
      tiposDeAula={tiposAula.map((t) => t.nome)}
    />
  );
}
