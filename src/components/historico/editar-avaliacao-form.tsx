"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Seccao } from "@/data/grelha";
import type { AtribuicoesPilares } from "@/lib/pilares-actions";
import { origensDisponiveis, sugerirPontosFracos } from "@/lib/pilares-notas";
import { editarAvaliacaoAction } from "@/lib/avaliacoes-actions";
import {
  AvaliacaoGuardada,
  PlanoAcaoItem,
  Respostas,
  agruparPorDimensao,
  subtotal,
  subtotalSeccao,
} from "@/types/avaliacao";
import { CriterioField } from "@/components/nova-avaliacao/criterio-field";
import { DimensaoBadge } from "@/components/nova-avaliacao/dimensao-badge";

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

export function EditarAvaliacaoForm({
  avaliacao,
  treinadores,
  tiposDeAula,
  espacos,
  atribuicoes,
}: {
  avaliacao: AvaliacaoGuardada;
  treinadores: string[];
  tiposDeAula: string[];
  espacos: string[];
  atribuicoes: AtribuicoesPilares;
}) {
  const router = useRouter();
  const seccoes: Seccao[] = avaliacao.grelhaSnapshot;

  const [cabecalho, setCabecalho] = useState({
    treinador: avaliacao.cabecalho.treinador,
    espaco: avaliacao.cabecalho.espaco,
    data: avaliacao.cabecalho.data,
    hora: avaliacao.cabecalho.hora,
    tipoAula: avaliacao.cabecalho.tipoAula,
    nAlunos: avaliacao.cabecalho.nAlunos,
  });
  const [respostas, setRespostas] = useState<Respostas>(avaliacao.respostas);
  const [observacoes, setObservacoes] = useState<Record<string, string>>(avaliacao.observacoes);
  const [classificacaoGeral, setClassificacaoGeral] = useState(avaliacao.classificacaoGeral);
  const [comentarioGeral, setComentarioGeral] = useState(avaliacao.comentarioGeral);
  const [planoAcao, setPlanoAcao] = useState<PlanoAcaoItem[]>(avaliacao.planoAcao);

  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  const sugestoes = useMemo(
    () => sugerirPontosFracos(seccoes, respostas, atribuicoes),
    [seccoes, respostas, atribuicoes]
  );
  const origens = useMemo(() => origensDisponiveis(seccoes, respostas, atribuicoes), [seccoes, respostas, atribuicoes]);
  const origensNoPlano = new Set(planoAcao.map((p) => p.origem));
  const origensPorEscolher = origens.filter((o) => !origensNoPlano.has(o));

  const adicionarPonto = (origem: string) => setPlanoAcao((p) => [...p, { origem, texto: "" }]);
  const removerPonto = (origem: string) => setPlanoAcao((p) => p.filter((i) => i.origem !== origem));
  const atualizarTextoPonto = (origem: string, texto: string) =>
    setPlanoAcao((p) => p.map((i) => (i.origem === origem ? { ...i, texto } : i)));

  const classificacaoValida = /^\d+$/.test(classificacaoGeral) && Number(classificacaoGeral) >= 1 && Number(classificacaoGeral) <= 100;

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-28 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href={`/historico/${avaliacao.id}`} className="mb-4 inline-block text-sm font-medium text-muted underline">
        ← Cancelar e voltar
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Editar avaliação</h1>
      <p className="mb-5 text-xs text-muted">
        A edição fica registada (quem e quando) e visível nesta avaliação e no registo de atividade.
      </p>

      <div className="space-y-6">
        <section className="rounded-none border border-line p-3">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Cabeçalho</h2>
          <div className="space-y-3">
            <Campo label="Treinador avaliado">
              <select
                className={inputClasses}
                value={cabecalho.treinador}
                onChange={(e) => setCabecalho((c) => ({ ...c, treinador: e.target.value }))}
              >
                {treinadores.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Espaço">
              <select
                className={inputClasses}
                value={cabecalho.espaco}
                onChange={(e) => setCabecalho((c) => ({ ...c, espaco: e.target.value }))}
              >
                {espacos.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Data da aula">
                <input
                  type="date"
                  className={inputClasses}
                  value={cabecalho.data}
                  onChange={(e) => setCabecalho((c) => ({ ...c, data: e.target.value }))}
                />
              </Campo>
              <Campo label="Hora da aula">
                <input
                  type="time"
                  className={inputClasses}
                  value={cabecalho.hora}
                  onChange={(e) => setCabecalho((c) => ({ ...c, hora: e.target.value }))}
                />
              </Campo>
            </div>
            <Campo label="Tipo de aula">
              <select
                className={inputClasses}
                value={cabecalho.tipoAula}
                onChange={(e) => setCabecalho((c) => ({ ...c, tipoAula: e.target.value }))}
              >
                {tiposDeAula.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Nº de alunos">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className={inputClasses}
                value={cabecalho.nAlunos}
                onChange={(e) => setCabecalho((c) => ({ ...c, nAlunos: e.target.value }))}
              />
            </Campo>
            <p className="text-xs text-dim">Avaliador: {avaliacao.cabecalho.avaliador} (não editável)</p>
          </div>
        </section>

        {seccoes.map((seccao) => {
          const grupos = agruparPorDimensao(seccao.criterios);
          const totalSeccao = subtotalSeccao(seccao, respostas);
          return (
            <section key={seccao.id} className="rounded-none border border-line p-3">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{seccao.nome}</h2>
                <span className="text-xs text-muted">{seccao.percentagem}% da avaliação</span>
              </div>

              <div className="space-y-4">
                {grupos.map((grupo, i) => {
                  const st = subtotal(grupo.criterios, respostas);
                  return (
                    <div key={i} className="rounded-none border border-line">
                      {grupo.dimensao && <DimensaoBadge nome={grupo.dimensao} obtidos={st.obtidos} max={st.max} />}
                      <div className="px-3">
                        {grupo.criterios.map((criterio) => (
                          <CriterioField
                            key={criterio.id}
                            criterio={criterio}
                            resposta={respostas[criterio.id]}
                            onChange={(r) => setRespostas((d) => ({ ...d, [criterio.id]: r }))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-none bg-black dark:bg-white px-3 py-2 text-sm font-semibold text-white dark:text-black">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {totalSeccao.obtidos} / {totalSeccao.max}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Campo label="Observações da secção">
                  <textarea
                    className={inputClasses}
                    rows={3}
                    value={observacoes[seccao.id] ?? ""}
                    onChange={(e) => setObservacoes((o) => ({ ...o, [seccao.id]: e.target.value }))}
                  />
                </Campo>
              </div>
            </section>
          );
        })}

        <section className="rounded-none border border-line p-3">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Classificação</h2>
          <div className="space-y-3">
            <Campo label="Classificação geral (1 a 100)">
              <input
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
                className={inputClasses}
                value={classificacaoGeral}
                onChange={(e) => setClassificacaoGeral(e.target.value)}
              />
            </Campo>
            <Campo label="Comentários gerais">
              <textarea
                className={inputClasses}
                rows={3}
                value={comentarioGeral}
                onChange={(e) => setComentarioGeral(e.target.value)}
              />
            </Campo>
          </div>
        </section>

        <section className="rounded-none border border-line p-3">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Plano de Ação</h2>
          <p className="mb-3 text-xs text-muted">Prioridades e o que trabalhar até à próxima avaliação.</p>

          {sugestoes.length > 0 && (
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-muted">Sugestões desta avaliação</p>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s) => (
                  <button
                    key={s.origem}
                    type="button"
                    disabled={origensNoPlano.has(s.origem)}
                    onClick={() => adicionarPonto(s.origem)}
                    className="rounded-none border border-line px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 disabled:opacity-40"
                  >
                    {s.origem} ({Math.round(s.percentagem)}%){!origensNoPlano.has(s.origem) && " · adicionar"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {planoAcao.length === 0 ? (
            <p className="rounded-none border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
              Sem nenhum ponto no plano de ação.
            </p>
          ) : (
            <div className="space-y-3">
              {planoAcao.map((item) => (
                <div key={item.origem} className="rounded-none border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.origem}</p>
                    <button
                      type="button"
                      onClick={() => removerPonto(item.origem)}
                      className="text-xs text-red-600 dark:text-red-400 underline"
                    >
                      Remover
                    </button>
                  </div>
                  <textarea
                    className={inputClasses}
                    rows={2}
                    value={item.texto}
                    onChange={(e) => atualizarTextoPonto(item.origem, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {origensPorEscolher.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <select id="nova-origem-plano" className={inputClasses} defaultValue={origensPorEscolher[0]}>
                {origensPorEscolher.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById("nova-origem-plano") as HTMLSelectElement | null;
                  if (select?.value) adicionarPonto(select.value);
                }}
                className="shrink-0 rounded-none border border-line px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Adicionar
              </button>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-panel">
        {erro && <p className="mx-auto max-w-lg md:max-w-2xl lg:max-w-3xl px-4 pt-2 text-xs text-red-600 dark:text-red-400">{erro}</p>}
        <div className="mx-auto flex max-w-lg md:max-w-2xl lg:max-w-3xl items-center justify-end gap-3 px-4 py-3">
          <Link
            href={`/historico/${avaliacao.id}`}
            className="rounded-none border border-line px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Cancelar
          </Link>
          <button
            type="button"
            disabled={aGuardar || !classificacaoValida}
            onClick={async () => {
              setAGuardar(true);
              setErro("");
              const resultado = await editarAvaliacaoAction(avaliacao.id, {
                cabecalho,
                respostas,
                observacoes,
                classificacaoGeral,
                comentarioGeral,
                planoAcao,
              });
              if (resultado.erro) {
                setErro(resultado.erro);
                setAGuardar(false);
                return;
              }
              router.push(`/historico/${avaliacao.id}`);
            }}
            className="rounded-none bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black disabled:opacity-40"
          >
            {aGuardar ? "A guardar..." : "Guardar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
