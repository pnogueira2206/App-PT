"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EstadoPlano } from "@prisma/client";
import {
  apagarPlanoAction,
  criarPlanoAction,
  DadosPlano,
  editarPlanoAction,
  mudarEstadoPlanoAction,
  PlanoItem,
} from "@/lib/plano-actions";
import { mesAnterior, NOMES_MESES, rotuloDia, rotuloSemana, segundaDaSemana, somarDias } from "@/lib/plano-datas";

interface Opcao {
  id: string;
  nome: string;
}

const ESTADOS: { valor: EstadoPlano; rotulo: string; classes: string }[] = [
  {
    valor: "POR_AVALIAR",
    rotulo: "Por avaliar",
    classes: "border-line text-neutral-700 dark:text-neutral-300",
  },
  {
    valor: "AVALIADO",
    rotulo: "Avaliado",
    classes: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    valor: "FINALIZADO",
    rotulo: "Finalizado",
    classes: "border-green-600 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300",
  },
];

const inputClasses =
  "w-full rounded-none border border-line bg-transparent px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none";

function estadoInfo(estado: EstadoPlano) {
  return ESTADOS.find((e) => e.valor === estado)!;
}

function rotuloMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  return `${NOMES_MESES[m - 1]} ${ano}`;
}

export function GerirPlano({
  vista,
  mes,
  semanas,
  hoje,
  itens,
  meuId,
  treinadores,
  avaliadores,
  espacos,
}: {
  vista: "mes" | "semana";
  mes: string;
  semanas: string[];
  hoje: string;
  itens: PlanoItem[];
  meuId: string;
  treinadores: Opcao[];
  avaliadores: Opcao[];
  espacos: Opcao[];
}) {
  const semanaHoje = segundaDaSemana(hoje);
  const semanaVista = semanas[0];
  const contagem = ESTADOS.map((e) => ({ ...e, total: itens.filter((i) => i.estado === e.valor).length }));

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-muted underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Plano de Avaliações</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex border border-line text-sm">
          <Link
            href={`/admin/plano?mes=${mes}`}
            className={`px-3 py-1.5 ${vista === "mes" ? "bg-black text-white dark:bg-white dark:text-black" : "text-muted"}`}
          >
            Mês
          </Link>
          <Link
            href={`/admin/plano?vista=semana&semana=${vista === "semana" ? semanaVista : mes === hoje.slice(0, 7) ? semanaHoje : segundaDaSemana(`${mes}-01`)}`}
            className={`px-3 py-1.5 ${vista === "semana" ? "bg-black text-white dark:bg-white dark:text-black" : "text-muted"}`}
          >
            Semana
          </Link>
        </div>

        {vista === "mes" ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/admin/plano?mes=${mesAnterior(mes)}`} className="px-1 text-muted" aria-label="Mês anterior">
              ←
            </Link>
            <span className="min-w-36 text-center font-semibold text-neutral-900 dark:text-neutral-100">{rotuloMes(mes)}</span>
            <Link href={`/admin/plano?mes=${mesAnterior(mes, 1)}`} className="px-1 text-muted" aria-label="Mês seguinte">
              →
            </Link>
            {mes !== hoje.slice(0, 7) && (
              <Link href="/admin/plano" className="text-xs text-muted underline">
                Hoje
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={`/admin/plano?vista=semana&semana=${somarDias(semanaVista, -7)}`}
              className="px-1 text-muted"
              aria-label="Semana anterior"
            >
              ←
            </Link>
            <span className="min-w-36 text-center font-semibold text-neutral-900 dark:text-neutral-100">
              Semana de {rotuloSemana(semanaVista)}
            </span>
            <Link
              href={`/admin/plano?vista=semana&semana=${somarDias(semanaVista, 7)}`}
              className="px-1 text-muted"
              aria-label="Semana seguinte"
            >
              →
            </Link>
            {semanaVista !== semanaHoje && (
              <Link href="/admin/plano?vista=semana" className="text-xs text-muted underline">
                Hoje
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {contagem.map((e) => (
          <span key={e.valor} className={`border px-2 py-1 ${e.classes}`}>
            {e.rotulo}: <strong>{e.total}</strong>
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {semanas.map((semana) => (
          <Semana
            key={semana}
            semana={semana}
            atual={semana === semanaHoje}
            foraDoMes={vista === "mes" && !semana.startsWith(mes) && !somarDias(semana, 6).startsWith(mes)}
            detalhe={vista === "semana"}
            itens={itens.filter((i) => i.semana === semana)}
            meuId={meuId}
            treinadores={treinadores}
            avaliadores={avaliadores}
            espacos={espacos}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        Ao gravar uma avaliação de um treinador agendado, o agendamento fica ligado a ela e passa a &quot;Avaliado&quot;.
        &quot;Finalizado&quot; marca-se à mão, depois de passar o feedback e o plano de desenvolvimento ao treinador.
      </p>
    </div>
  );
}

function Semana({
  semana,
  atual,
  foraDoMes,
  detalhe,
  itens,
  meuId,
  treinadores,
  avaliadores,
  espacos,
}: {
  semana: string;
  atual: boolean;
  foraDoMes: boolean;
  detalhe: boolean;
  itens: PlanoItem[];
  meuId: string;
  treinadores: Opcao[];
  avaliadores: Opcao[];
  espacos: Opcao[];
}) {
  const [aAgendar, setAAgendar] = useState(false);

  return (
    <section className={`border px-3 py-3 ${atual ? "border-black dark:border-white" : "border-line"} ${foraDoMes ? "opacity-60" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/plano?vista=semana&semana=${semana}`}
            className="text-sm font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {rotuloSemana(semana)}
          </Link>
          {atual && <span className="bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white dark:bg-white dark:text-black">Esta semana</span>}
        </div>
        {!aAgendar && (
          <button type="button" onClick={() => setAAgendar(true)} className="text-xs font-medium underline">
            + Agendar
          </button>
        )}
      </div>

      {itens.length === 0 && !aAgendar && <p className="text-xs text-dim">Nada agendado.</p>}

      <ul className={detalhe ? "space-y-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
        {itens.map((item) => (
          <Cartao
            key={item.id}
            item={item}
            abertoInicial={detalhe}
            treinadores={treinadores}
            avaliadores={avaliadores}
            espacos={espacos}
          />
        ))}
      </ul>

      {aAgendar && (
        <FormPlano
          inicial={{ treinadorId: "", avaliadorId: meuId, espacoId: null, semana, dia: null, notas: "" }}
          treinadores={treinadores}
          avaliadores={avaliadores}
          espacos={espacos}
          rotuloGuardar="Agendar"
          aoGuardar={criarPlanoAction}
          aoFechar={() => setAAgendar(false)}
        />
      )}
    </section>
  );
}

function Cartao({
  item,
  abertoInicial,
  treinadores,
  avaliadores,
  espacos,
}: {
  item: PlanoItem;
  abertoInicial: boolean;
  treinadores: Opcao[];
  avaliadores: Opcao[];
  espacos: Opcao[];
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [aberto, setAberto] = useState(abertoInicial);
  const [aEditar, setAEditar] = useState(false);
  const estado = estadoInfo(item.estado);

  if (aEditar) {
    return (
      <li className="sm:col-span-2">
        <FormPlano
          inicial={item}
          treinadores={treinadores}
          avaliadores={avaliadores}
          espacos={espacos}
          rotuloGuardar="Guardar"
          aoGuardar={(dados) => editarPlanoAction(item.id, dados)}
          aoFechar={() => setAEditar(false)}
        />
      </li>
    );
  }

  const detalhes = [item.dia ? rotuloDia(item.dia) : null, item.espaco, `Avaliador: ${item.avaliador}`].filter(Boolean).join(" · ");

  return (
    <li className={`border ${estado.classes} ${pendente ? "opacity-60" : ""} ${aberto ? "sm:col-span-2" : ""}`}>
      <button type="button" onClick={() => setAberto(!aberto)} className="w-full px-3 py-2 text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.treinador}</span>
          <span className="shrink-0 text-[11px] font-semibold uppercase">{estado.rotulo}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted">{detalhes}</p>
      </button>

      {aberto && (
        <div className="border-t border-line px-3 py-2">
          {item.notas && <p className="mb-2 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">{item.notas}</p>}

          <div className="mb-2 flex flex-wrap gap-1">
            {ESTADOS.map((e) => (
              <button
                key={e.valor}
                type="button"
                disabled={pendente || e.valor === item.estado}
                onClick={() =>
                  startTransition(async () => {
                    await mudarEstadoPlanoAction(item.id, e.valor);
                    router.refresh();
                  })
                }
                className={`border px-2 py-1 text-xs font-medium ${
                  e.valor === item.estado ? e.classes : "border-line text-muted hover:border-black dark:hover:border-white"
                }`}
              >
                {e.rotulo}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {item.avaliacaoId && (
              <Link href={`/historico/${item.avaliacaoId}`} className="font-medium underline">
                Ver avaliação{item.classificacao != null ? ` (${item.classificacao}/100)` : ""}
              </Link>
            )}
            <button type="button" onClick={() => setAEditar(true)} className="font-medium text-muted underline">
              Editar
            </button>
            <button
              type="button"
              disabled={pendente}
              onClick={() => {
                if (!window.confirm(`Apagar o agendamento de ${item.treinador}?`)) return;
                startTransition(async () => {
                  await apagarPlanoAction(item.id);
                  router.refresh();
                });
              }}
              className="font-medium text-red-600 underline dark:text-red-400"
            >
              Apagar
            </button>
            <span className="ml-auto text-dim">Agendado por {item.criadoPor}</span>
          </div>
        </div>
      )}
    </li>
  );
}

function FormPlano({
  inicial,
  treinadores,
  avaliadores,
  espacos,
  rotuloGuardar,
  aoGuardar,
  aoFechar,
}: {
  inicial: DadosPlano;
  treinadores: Opcao[];
  avaliadores: Opcao[];
  espacos: Opcao[];
  rotuloGuardar: string;
  aoGuardar: (dados: DadosPlano) => Promise<void>;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [dados, setDados] = useState<DadosPlano>({
    treinadorId: inicial.treinadorId,
    avaliadorId: inicial.avaliadorId,
    espacoId: inicial.espacoId,
    semana: inicial.semana,
    dia: inicial.dia,
    notas: inicial.notas,
  });
  const atualizar = (patch: Partial<DadosPlano>) => setDados((d) => ({ ...d, ...patch }));

  return (
    <form
      className="mt-2 space-y-2 border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dados.treinadorId || !dados.avaliadorId) return;
        startTransition(async () => {
          await aoGuardar(dados);
          aoFechar();
          router.refresh();
        });
      }}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted">
          Treinador
          <select className={inputClasses} value={dados.treinadorId} onChange={(e) => atualizar({ treinadorId: e.target.value })} required>
            <option value="">Escolher…</option>
            {treinadores.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Avaliador
          <select className={inputClasses} value={dados.avaliadorId} onChange={(e) => atualizar({ avaliadorId: e.target.value })} required>
            {avaliadores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          Semana (qualquer dia dela)
          <input
            type="date"
            className={inputClasses}
            value={dados.semana}
            onChange={(e) => e.target.value && atualizar({ semana: segundaDaSemana(e.target.value), dia: null })}
            required
          />
        </label>
        <label className="text-xs text-muted">
          Dia (opcional)
          <input
            type="date"
            className={inputClasses}
            min={dados.semana}
            max={somarDias(dados.semana, 6)}
            value={dados.dia ?? ""}
            onChange={(e) => atualizar({ dia: e.target.value || null })}
          />
        </label>
        <label className="text-xs text-muted">
          Espaço (opcional)
          <select className={inputClasses} value={dados.espacoId ?? ""} onChange={(e) => atualizar({ espacoId: e.target.value || null })}>
            <option value="">—</option>
            {espacos.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nome}
              </option>
            ))}
          </select>
        </label>
        <p className="self-end pb-2 text-xs text-muted">Semana de {rotuloSemana(dados.semana)}</p>
      </div>
      <label className="block text-xs text-muted">
        Notas (opcional)
        <textarea className={inputClasses} rows={2} value={dados.notas} onChange={(e) => atualizar({ notas: e.target.value })} />
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-none bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {rotuloGuardar}
        </button>
        <button type="button" onClick={aoFechar} className="text-sm text-muted underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
