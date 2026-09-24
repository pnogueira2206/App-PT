import { grelha } from "@/data/grelha";
import { AvaliacaoDraft, dimensoesDaSeccao, subtotalDimensao, subtotalSeccao, totalGeralObtido } from "@/types/avaliacao";

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-medium text-neutral-900">{valor}</span>
    </div>
  );
}

export function ResumoAvaliacao({ draft }: { draft: AvaliacaoDraft }) {
  const total = totalGeralObtido(draft.respostas);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Resumo</h1>

      <section className="rounded-md border border-neutral-200 p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900">Cabeçalho</p>
        <Linha label="Treinador" valor={draft.cabecalho.treinador || "—"} />
        <Linha label="Avaliador" valor={draft.cabecalho.avaliador || "—"} />
        <Linha label="Data" valor={draft.cabecalho.data || "—"} />
        <Linha label="Hora" valor={draft.cabecalho.hora || "—"} />
        <Linha label="Tipo de aula" valor={draft.cabecalho.tipoAula || "—"} />
        <Linha label="Nº de alunos" valor={draft.cabecalho.nAlunos || "—"} />
      </section>

      {grelha.map((seccao) => {
        const st = subtotalSeccao(seccao, draft.respostas);
        const dims = dimensoesDaSeccao(seccao);
        return (
          <section key={seccao.id} className="rounded-md border border-neutral-200 p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-neutral-900">{seccao.nome}</p>
              <span className="text-xs text-neutral-500">
                {st.obtidos} / {st.max}
              </span>
            </div>
            {dims.map((dim) => {
              const dst = subtotalDimensao(seccao, dim, draft.respostas);
              return <Linha key={dim} label={dim} valor={`${dst.obtidos} / ${dst.max}`} />;
            })}
            {draft.observacoes[seccao.id]?.trim() && (
              <p className="mt-2 text-xs italic text-neutral-500">&quot;{draft.observacoes[seccao.id]}&quot;</p>
            )}
          </section>
        );
      })}

      <section className="rounded-md border border-neutral-200 p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900">Classificação</p>
        <Linha label="Pontuação calculada (informativa)" valor={`${total.obtidos} / ${total.max}`} />
        <Linha label="Classificação geral do avaliador" valor={draft.classificacaoGeral ? `${draft.classificacaoGeral} / 100` : "—"} />
        {draft.comentarioGeral.trim() && (
          <p className="mt-2 text-xs italic text-neutral-500">&quot;{draft.comentarioGeral}&quot;</p>
        )}
      </section>

      <section className="rounded-md border border-neutral-200 p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900">Confirmações</p>
        <Linha
          label="Avaliador"
          valor={draft.confirmacaoAvaliador.data ? `${draft.confirmacaoAvaliador.nome} — ${draft.confirmacaoAvaliador.data}` : "—"}
        />
        <Linha
          label="Treinador"
          valor={draft.confirmacaoTreinador.data ? `${draft.confirmacaoTreinador.nome} — ${draft.confirmacaoTreinador.data}` : "Por confirmar"}
        />
      </section>
    </div>
  );
}
