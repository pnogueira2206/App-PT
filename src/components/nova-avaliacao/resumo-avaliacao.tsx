import { Seccao } from "@/data/grelha";
import { AvaliacaoDraft, dimensoesDaSeccao, subtotalDimensao, subtotalSeccao, totalGeralObtido } from "@/types/avaliacao";

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-neutral-900 dark:text-neutral-100">{valor}</span>
    </div>
  );
}

export function ResumoAvaliacao({ draft, seccoes }: { draft: AvaliacaoDraft; seccoes: Seccao[] }) {
  const total = totalGeralObtido(seccoes, draft.respostas);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Resumo</h1>

      <section className="rounded-none border border-line p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cabeçalho</p>
        <Linha label="Treinador" valor={draft.cabecalho.treinador || "—"} />
        <Linha label="Avaliador" valor={draft.cabecalho.avaliador || "—"} />
        <Linha label="Espaço" valor={draft.cabecalho.espaco || "—"} />
        <Linha label="Data" valor={draft.cabecalho.data || "—"} />
        <Linha label="Hora" valor={draft.cabecalho.hora || "—"} />
        <Linha label="Tipo de aula" valor={draft.cabecalho.tipoAula || "—"} />
        <Linha label="Nº de alunos" valor={draft.cabecalho.nAlunos || "—"} />
      </section>

      {seccoes.map((seccao) => {
        const st = subtotalSeccao(seccao, draft.respostas);
        const dims = dimensoesDaSeccao(seccao);
        return (
          <section key={seccao.id} className="rounded-none border border-line p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{seccao.nome}</p>
              <span className="text-xs text-muted">
                {st.obtidos} / {st.max}
              </span>
            </div>
            {dims.map((dim) => {
              const dst = subtotalDimensao(seccao, dim, draft.respostas);
              return <Linha key={dim} label={dim} valor={`${dst.obtidos} / ${dst.max}`} />;
            })}
            {draft.observacoes[seccao.id]?.trim() && (
              <p className="mt-2 text-xs italic text-muted">&quot;{draft.observacoes[seccao.id]}&quot;</p>
            )}
          </section>
        );
      })}

      <section className="rounded-none border border-line p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Classificação</p>
        <Linha label="Pontuação calculada (informativa)" valor={`${total.obtidos} / ${total.max}`} />
        <Linha label="Classificação geral do avaliador" valor={draft.classificacaoGeral ? `${draft.classificacaoGeral} / 100` : "—"} />
        {draft.comentarioGeral.trim() && (
          <p className="mt-2 text-xs italic text-muted">&quot;{draft.comentarioGeral}&quot;</p>
        )}
      </section>

      {draft.planoAcao.length > 0 && (
        <section className="rounded-none border border-line p-3">
          <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Plano de Ação</p>
          <div className="space-y-2">
            {draft.planoAcao.map((item) => (
              <div key={item.origem}>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{item.origem}</p>
                <p className="text-sm text-muted">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-none border border-line p-3">
        <p className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Confirmações</p>
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
