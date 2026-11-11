import { GerirPlano } from "@/components/admin/gerir-plano";
import { auth } from "@/lib/auth";
import { listarPlano } from "@/lib/plano-actions";
import { listarTreinadoresAtivos } from "@/lib/treinadores-actions";
import { listarAdministradores } from "@/lib/administradores-actions";
import { listarEspacosAtivos } from "@/lib/espacos-actions";
import { hojeIso, segundaDaSemana, semanasDoMes } from "@/lib/plano-datas";

export default async function PlanoPage({ searchParams }: PageProps<"/admin/plano">) {
  const params = await searchParams;
  const hoje = hojeIso();
  const vista = params.vista === "semana" ? "semana" : "mes";
  const semanaParam = typeof params.semana === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.semana) ? params.semana : null;
  const mesParam = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : null;

  const semana = segundaDaSemana(semanaParam ?? hoje);
  const mes = mesParam ?? (semanaParam ? semana.slice(0, 7) : hoje.slice(0, 7));
  const semanas = vista === "semana" ? [semana] : semanasDoMes(mes);

  // Sequencial, não Promise.all: o pooler do Neon falha com consultas em paralelo na mesma ligação.
  const session = await auth();
  const itens = await listarPlano(semanas[0], semanas[semanas.length - 1]);
  const treinadores = await listarTreinadoresAtivos();
  const admins = await listarAdministradores();
  const espacos = await listarEspacosAtivos();

  return (
    <GerirPlano
      vista={vista}
      mes={mes}
      semanas={semanas}
      hoje={hoje}
      itens={itens}
      meuId={session!.user.id}
      treinadores={treinadores.map((t) => ({ id: t.id, nome: t.nome }))}
      avaliadores={admins.filter((a) => a.ativo).map((a) => ({ id: a.id, nome: a.nome }))}
      espacos={espacos.map((e) => ({ id: e.id, nome: e.nome }))}
    />
  );
}
