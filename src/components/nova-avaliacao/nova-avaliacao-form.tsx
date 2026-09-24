"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Seccao } from "@/data/grelha";
import { guardarAvaliacao } from "@/lib/avaliacoes-store";
import { listarGrelhaAtiva, subscreverGrelha } from "@/lib/grelha-store";
import { treinadoresStore } from "@/lib/treinadores-store";
import { tiposAulaStore } from "@/lib/tipos-aula-store";
import { avaliadores, espacos } from "@/data/mock";
import {
  AvaliacaoDraft,
  agruparPorDimensao,
  cabecalhoCompleto,
  classificacaoValida,
  confirmacaoAvaliadorCompleta,
  draftVazio,
  seccaoCompleta,
  subtotal,
  subtotalSeccao,
  totalGeralObtido,
} from "@/types/avaliacao";
import { CriterioField } from "./criterio-field";
import { DimensaoBadge } from "./dimensao-badge";
import { StepInfo, StepperNav } from "./stepper-nav";
import { ResumoAvaliacao } from "./resumo-avaliacao";

const STEP_CABECALHO = 0;

export function NovaAvaliacaoForm() {
  const seccoes = useSyncExternalStore(subscreverGrelha, listarGrelhaAtiva, listarGrelhaAtiva);
  const treinadoresAtivos = useSyncExternalStore(
    treinadoresStore.subscrever,
    treinadoresStore.listarAtivos,
    treinadoresStore.listarAtivos
  );
  const tiposAtivos = useSyncExternalStore(tiposAulaStore.subscrever, tiposAulaStore.listarAtivos, tiposAulaStore.listarAtivos);

  const STEP_FINAL = seccoes.length + 1;
  const STEP_RESUMO = seccoes.length + 2;

  const [draft, setDraft] = useState<AvaliacaoDraft>(draftVazio());
  const [step, setStep] = useState(STEP_CABECALHO);
  const [guardada, setGuardada] = useState(false);

  const stepsInfo: StepInfo[] = useMemo(() => {
    const secoes = seccoes.map((s) => ({ label: s.nome, completo: seccaoCompleta(s, draft.respostas) }));
    const anteriores = [
      { label: "Cabeçalho", completo: cabecalhoCompleto(draft.cabecalho) },
      ...secoes,
      {
        label: "Classificação",
        completo: classificacaoValida(draft.classificacaoGeral) && confirmacaoAvaliadorCompleta(draft.confirmacaoAvaliador),
      },
    ];
    const tudo = anteriores.every((s) => s.completo);
    return [...anteriores, { label: "Resumo", completo: tudo }];
  }, [draft, seccoes]);

  const tudoCompleto = stepsInfo[STEP_RESUMO].completo;

  if (guardada) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">✓</div>
        <h1 className="text-xl font-semibold text-neutral-900">Avaliação guardada</h1>
        <p className="text-sm text-neutral-600">
          A avaliação de {draft.cabecalho.treinador} em {draft.cabecalho.data} foi registada e já está visível no
          Histórico (dados fictícios, guardados apenas neste browser).
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(draftVazio());
              setStep(STEP_CABECALHO);
              setGuardada(false);
            }}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Nova avaliação
          </button>
          <Link
            href="/historico"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700"
          >
            Ver histórico
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col pb-24">
      <StepperNav steps={stepsInfo} currentStep={step} onSelect={setStep} />

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {step === STEP_CABECALHO && (
          <CabecalhoStep
            draft={draft}
            setDraft={setDraft}
            treinadores={treinadoresAtivos.map((t) => t.nome)}
            tiposDeAula={tiposAtivos.map((t) => t.nome)}
          />
        )}

        {step > STEP_CABECALHO && step < STEP_FINAL && (
          <SeccaoStep draft={draft} setDraft={setDraft} seccao={seccoes[step - 1]} indice={step} />
        )}

        {step === STEP_FINAL && <FinalStep draft={draft} setDraft={setDraft} seccoes={seccoes} />}

        {step === STEP_RESUMO && <ResumoAvaliacao draft={draft} seccoes={seccoes} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            disabled={step === STEP_CABECALHO}
            onClick={() => setStep((s) => Math.max(STEP_CABECALHO, s - 1))}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40"
          >
            Anterior
          </button>

          {step < STEP_RESUMO ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEP_RESUMO, s + 1))}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Seguinte
            </button>
          ) : (
            <button
              type="button"
              disabled={!tudoCompleto}
              onClick={() => {
                guardarAvaliacao(draft, seccoes);
                setGuardada(true);
              }}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Guardar avaliação
            </button>
          )}
        </div>
        {step === STEP_RESUMO && !tudoCompleto && (
          <p className="mx-auto max-w-lg px-4 pb-3 text-xs text-red-600">
            Ainda há respostas por preencher — revê as secções assinaladas sem ✓ no topo.
          </p>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

const inputClasses =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function CabecalhoStep({
  draft,
  setDraft,
  treinadores,
  tiposDeAula,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  treinadores: string[];
  tiposDeAula: string[];
}) {
  const c = draft.cabecalho;
  const update = (patch: Partial<typeof c>) => setDraft((d) => ({ ...d, cabecalho: { ...d.cabecalho, ...patch } }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Cabeçalho</h1>

      <Campo label="Treinador avaliado">
        <select className={inputClasses} value={c.treinador} onChange={(e) => update({ treinador: e.target.value })}>
          <option value="">Seleciona...</option>
          {treinadores.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Avaliador">
        <select className={inputClasses} value={c.avaliador} onChange={(e) => update({ avaliador: e.target.value })}>
          <option value="">Seleciona...</option>
          {avaliadores.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Espaço">
        <select className={inputClasses} value={c.espaco} onChange={(e) => update({ espaco: e.target.value })}>
          <option value="">Seleciona...</option>
          {espacos.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data da aula">
          <input type="date" className={inputClasses} value={c.data} onChange={(e) => update({ data: e.target.value })} />
        </Campo>
        <Campo label="Hora da aula">
          <input type="time" className={inputClasses} value={c.hora} onChange={(e) => update({ hora: e.target.value })} />
        </Campo>
      </div>

      <Campo label="Tipo de aula">
        <select className={inputClasses} value={c.tipoAula} onChange={(e) => update({ tipoAula: e.target.value })}>
          <option value="">Seleciona...</option>
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
          value={c.nAlunos}
          onChange={(e) => update({ nAlunos: e.target.value })}
        />
      </Campo>
    </div>
  );
}

function SeccaoStep({
  draft,
  setDraft,
  seccao,
  indice,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  seccao: Seccao;
  indice: number;
}) {
  const grupos = agruparPorDimensao(seccao.criterios);
  const totalSeccao = subtotalSeccao(seccao, draft.respostas);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">
          {indice}. {seccao.nome}
        </h1>
        <span className="text-xs text-neutral-500">{seccao.percentagem}% da avaliação</span>
      </div>

      <div className="space-y-4">
        {grupos.map((grupo, i) => {
          const st = subtotal(grupo.criterios, draft.respostas);
          return (
            <div key={i} className="rounded-md border border-neutral-200">
              {grupo.dimensao && <DimensaoBadge nome={grupo.dimensao} obtidos={st.obtidos} max={st.max} />}
              <div className="px-3">
                {grupo.criterios.map((criterio) => (
                  <CriterioField
                    key={criterio.id}
                    criterio={criterio}
                    resposta={draft.respostas[criterio.id]}
                    onChange={(r) =>
                      setDraft((d) => ({ ...d, respostas: { ...d.respostas, [criterio.id]: r } }))
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between rounded-md bg-black px-3 py-2 text-sm font-semibold text-white">
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
            placeholder="Notas opcionais sobre esta secção..."
            value={draft.observacoes[seccao.id] ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, observacoes: { ...d.observacoes, [seccao.id]: e.target.value } }))
            }
          />
        </Campo>
      </div>
    </div>
  );
}

function FinalStep({
  draft,
  setDraft,
  seccoes,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  seccoes: Seccao[];
}) {
  const total = totalGeralObtido(seccoes, draft.respostas);

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-neutral-900">Classificação e confirmação</h1>

      <div className="rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
        Pontuação calculada pela grelha (informativa, não substitui a classificação do avaliador):{" "}
        <span className="font-semibold text-neutral-900">
          {total.obtidos} / {total.max}
        </span>
      </div>

      <Campo label="Classificação geral (1 a 100)">
        <input
          type="number"
          min={1}
          max={100}
          inputMode="numeric"
          className={inputClasses}
          value={draft.classificacaoGeral}
          onChange={(e) => setDraft((d) => ({ ...d, classificacaoGeral: e.target.value }))}
        />
      </Campo>

      <Campo label="Comentários gerais (opcional)">
        <textarea
          className={inputClasses}
          rows={3}
          value={draft.comentarioGeral}
          onChange={(e) => setDraft((d) => ({ ...d, comentarioGeral: e.target.value }))}
        />
      </Campo>

      <div className="rounded-md border border-neutral-200 p-3">
        <p className="mb-2 text-sm font-semibold text-neutral-900">Confirmação do avaliador</p>
        <p className="mb-2 text-sm text-neutral-700">{draft.cabecalho.avaliador || "— (define o avaliador no cabeçalho)"}</p>
        <Campo label="Data de confirmação">
          <input
            type="date"
            className={inputClasses}
            value={draft.confirmacaoAvaliador.data}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                confirmacaoAvaliador: { nome: d.cabecalho.avaliador, data: e.target.value },
              }))
            }
          />
        </Campo>
      </div>

      <div className="rounded-md border border-neutral-200 p-3">
        <p className="mb-2 text-sm font-semibold text-neutral-900">Confirmação do treinador</p>
        <p className="mb-2 text-sm text-neutral-700">{draft.cabecalho.treinador || "— (define o treinador no cabeçalho)"}</p>
        <Campo label="Data de confirmação (opcional)">
          <input
            type="date"
            className={inputClasses}
            value={draft.confirmacaoTreinador.data}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                confirmacaoTreinador: { nome: d.cabecalho.treinador, data: e.target.value },
              }))
            }
          />
        </Campo>
        <p className="mt-1 text-xs text-neutral-500">
          Deixa em branco se o treinador ainda não confirmou — a avaliação pode ficar &quot;por confirmar&quot;.
        </p>
      </div>
    </div>
  );
}
