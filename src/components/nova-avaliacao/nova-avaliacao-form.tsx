"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Seccao } from "@/data/grelha";
import { PILARES } from "@/data/pilares";
import { guardarAvaliacaoAction } from "@/lib/avaliacoes-actions";
import { origensDisponiveis, percentagemPorPilar, sugerirPontosFracos, temPilaresCategorizados } from "@/lib/pilares-notas";
import type { AtribuicoesPilares } from "@/lib/pilares-actions";
import { PilaresRadarChart } from "@/components/por-treinador/pilares-radar-chart";
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

export function NovaAvaliacaoForm({
  seccoesIniciais,
  treinadores,
  tiposDeAula,
  espacos,
  atribuicoes,
}: {
  seccoesIniciais: Seccao[];
  treinadores: string[];
  tiposDeAula: string[];
  espacos: string[];
  atribuicoes: AtribuicoesPilares;
}) {
  const { data: session } = useSession();
  const nomeAvaliador = session?.user?.name ?? "";
  const seccoes = seccoesIniciais;

  const STEP_FINAL = seccoes.length + 1;
  const STEP_SPIDER = seccoes.length + 2;
  const STEP_PLANO_ACAO = seccoes.length + 3;
  const STEP_RESUMO = seccoes.length + 4;

  const [draft, setDraft] = useState<AvaliacaoDraft>(draftVazio());
  const [step, setStep] = useState(STEP_CABECALHO);
  const [guardada, setGuardada] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  const stepsInfo: StepInfo[] = useMemo(() => {
    const secoes = seccoes.map((s) => ({ label: s.nome, completo: seccaoCompleta(s, draft.respostas) }));
    const anteriores = [
      { label: "Cabeçalho", completo: cabecalhoCompleto(draft.cabecalho) },
      ...secoes,
      {
        label: "Classificação",
        completo:
          classificacaoValida(draft.classificacaoGeral) &&
          confirmacaoAvaliadorCompleta({ nome: nomeAvaliador, data: draft.confirmacaoAvaliador.data }),
      },
    ];
    const comSpiderEPlano = [
      ...anteriores,
      { label: "Notas por Pilar", completo: true },
      { label: "Plano de Ação", completo: true },
    ];
    const tudo = comSpiderEPlano.every((s) => s.completo);
    return [...comSpiderEPlano, { label: "Resumo", completo: tudo }];
  }, [draft, seccoes, nomeAvaliador]);

  const tudoCompleto = stepsInfo[STEP_RESUMO].completo;

  if (guardada) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl text-white">✓</div>
        <h1 className="text-xl font-semibold text-neutral-900">Avaliação guardada</h1>
        <p className="text-sm text-neutral-600">
          A avaliação de {draft.cabecalho.treinador} em {draft.cabecalho.data} foi registada e já está visível no
          Histórico.
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
            treinadores={treinadores}
            tiposDeAula={tiposDeAula}
            espacos={espacos}
          />
        )}

        {step > STEP_CABECALHO && step < STEP_FINAL && (
          <SeccaoStep draft={draft} setDraft={setDraft} seccao={seccoes[step - 1]} indice={step} />
        )}

        {step === STEP_FINAL && (
          <FinalStep draft={draft} setDraft={setDraft} seccoes={seccoes} nomeAvaliador={nomeAvaliador} />
        )}

        {step === STEP_SPIDER && <SpiderWebStep draft={draft} seccoes={seccoes} atribuicoes={atribuicoes} />}

        {step === STEP_PLANO_ACAO && (
          <PlanoAcaoStep draft={draft} setDraft={setDraft} seccoes={seccoes} atribuicoes={atribuicoes} />
        )}

        {step === STEP_RESUMO && <ResumoAvaliacao draft={{ ...draft, cabecalho: { ...draft.cabecalho, avaliador: nomeAvaliador } }} seccoes={seccoes} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white">
        {erro && <p className="mx-auto max-w-lg px-4 pt-2 text-xs text-red-600">{erro}</p>}
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
              disabled={!tudoCompleto || aGuardar}
              onClick={async () => {
                setAGuardar(true);
                setErro("");
                try {
                  await guardarAvaliacaoAction(
                    { ...draft, cabecalho: { ...draft.cabecalho, avaliador: nomeAvaliador } },
                    seccoes
                  );
                  setGuardada(true);
                } catch (e) {
                  setErro(e instanceof Error ? e.message : "Não foi possível guardar a avaliação.");
                } finally {
                  setAGuardar(false);
                }
              }}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {aGuardar ? "A guardar..." : "Guardar avaliação"}
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
  espacos,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  treinadores: string[];
  tiposDeAula: string[];
  espacos: string[];
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
  nomeAvaliador,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  seccoes: Seccao[];
  nomeAvaliador: string;
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
        <p className="mb-2 text-sm text-neutral-700">{nomeAvaliador}</p>
        <Campo label="Data de confirmação">
          <input
            type="date"
            className={inputClasses}
            value={draft.confirmacaoAvaliador.data}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                confirmacaoAvaliador: { nome: nomeAvaliador, data: e.target.value },
              }))
            }
          />
        </Campo>
      </div>

      <div className="rounded-md border border-neutral-200 p-3">
        <p className="mb-2 text-sm font-semibold text-neutral-900">Confirmação do treinador</p>
        <p className="mb-2 text-sm text-neutral-700">{draft.cabecalho.treinador || "— (define o treinador no cabeçalho)"}</p>
        <p className="text-xs text-neutral-500">
          O treinador confirma a avaliação através da própria conta, no Histórico.
        </p>
      </div>
    </div>
  );
}

function SpiderWebStep({
  draft,
  seccoes,
  atribuicoes,
}: {
  draft: AvaliacaoDraft;
  seccoes: Seccao[];
  atribuicoes: AtribuicoesPilares;
}) {
  const temPilares = temPilaresCategorizados(seccoes, draft.respostas, atribuicoes);
  const notas = PILARES.map((p) => percentagemPorPilar(seccoes, draft.respostas, p, atribuicoes));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Notas por Pilar</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Com base nas respostas desta avaliação, esta é a distribuição pelos 6 pilares do ensino eficaz.
        </p>
      </div>

      {temPilares ? (
        <PilaresRadarChart ultima={notas} anterior={null} />
      ) : (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center text-xs text-neutral-500">
          Ainda não há critérios categorizados por pilar (Admin &gt; Critérios &amp; Pilares), por isso o plano de
          ação a seguir vai basear-se nas secções mais fracas.
        </p>
      )}
    </div>
  );
}

function PlanoAcaoStep({
  draft,
  setDraft,
  seccoes,
  atribuicoes,
}: {
  draft: AvaliacaoDraft;
  setDraft: React.Dispatch<React.SetStateAction<AvaliacaoDraft>>;
  seccoes: Seccao[];
  atribuicoes: AtribuicoesPilares;
}) {
  const sugestoes = useMemo(
    () => sugerirPontosFracos(seccoes, draft.respostas, atribuicoes),
    [seccoes, draft.respostas, atribuicoes]
  );
  const origens = useMemo(
    () => origensDisponiveis(seccoes, draft.respostas, atribuicoes),
    [seccoes, draft.respostas, atribuicoes]
  );
  const origensNoPlano = new Set(draft.planoAcao.map((p) => p.origem));
  const origensPorEscolher = origens.filter((o) => !origensNoPlano.has(o));

  const adicionar = (origem: string) =>
    setDraft((d) => ({ ...d, planoAcao: [...d.planoAcao, { origem, texto: "" }] }));
  const remover = (origem: string) =>
    setDraft((d) => ({ ...d, planoAcao: d.planoAcao.filter((p) => p.origem !== origem) }));
  const atualizarTexto = (origem: string, texto: string) =>
    setDraft((d) => ({ ...d, planoAcao: d.planoAcao.map((p) => (p.origem === origem ? { ...p, texto } : p)) }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Plano de Ação</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Passo opcional. Com base na spider web anterior, estes são os pontos menos desenvolvidos — confirma-os,
          ajusta-os ou adiciona outros, e escreve a ação concreta para cada um.
        </p>
      </div>

      {sugestoes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-neutral-500">Sugestões desta avaliação</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={s.origem}
                type="button"
                disabled={origensNoPlano.has(s.origem)}
                onClick={() => adicionar(s.origem)}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
              >
                {s.origem} ({Math.round(s.percentagem)}%){!origensNoPlano.has(s.origem) && " · adicionar"}
              </button>
            ))}
          </div>
        </div>
      )}

      {draft.planoAcao.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-300 px-4 py-6 text-center text-xs text-neutral-500">
          Ainda não há nenhum ponto no plano de ação.
        </p>
      ) : (
        <div className="space-y-3">
          {draft.planoAcao.map((item) => (
            <div key={item.origem} className="rounded-md border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">{item.origem}</p>
                <button type="button" onClick={() => remover(item.origem)} className="text-xs text-red-600 underline">
                  Remover
                </button>
              </div>
              <textarea
                className={inputClasses}
                rows={2}
                placeholder="O que trabalhar até à próxima avaliação..."
                value={item.texto}
                onChange={(e) => atualizarTexto(item.origem, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {origensPorEscolher.length > 0 && (
        <AdicionarPontoForm origens={origensPorEscolher} onAdicionar={adicionar} />
      )}
    </div>
  );
}

function AdicionarPontoForm({ origens, onAdicionar }: { origens: string[]; onAdicionar: (origem: string) => void }) {
  const [escolha, setEscolha] = useState(origens[0]);

  return (
    <div className="flex items-center gap-2">
      <select
        className={inputClasses}
        value={origens.includes(escolha) ? escolha : origens[0]}
        onChange={(e) => setEscolha(e.target.value)}
      >
        {origens.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onAdicionar(escolha)}
        className="shrink-0 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700"
      >
        Adicionar
      </button>
    </div>
  );
}
