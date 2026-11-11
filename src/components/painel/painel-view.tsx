import Link from "next/link";
import type { DadosPainel, LinhaPrazo } from "@/lib/painel";
import { Nivel, nivelDaMedia, ROTULO_INTERVALO, TITULO_NIVEL } from "@/lib/niveis";
import { rotuloDia, rotuloSemana } from "@/lib/plano-datas";

const COR_NIVEL: Record<Nivel, { texto: string; borda: string; fundo: string }> = {
  1: { texto: "text-red-600 dark:text-red-400", borda: "border-red-600 dark:border-red-400", fundo: "bg-red-600 dark:bg-red-400" },
  2: { texto: "text-amber-700 dark:text-amber-400", borda: "border-amber-700 dark:border-amber-400", fundo: "bg-amber-600 dark:bg-amber-400" },
  3: { texto: "text-green-700 dark:text-green-400", borda: "border-green-700 dark:border-green-400", fundo: "bg-green-700 dark:bg-green-400" },
};

const ESTADO_PLANO = {
  POR_AVALIAR: { rotulo: "Por avaliar", classes: "border-line text-muted" },
  AVALIADO: { rotulo: "Avaliado", classes: "border-amber-500 text-amber-700 dark:text-amber-300" },
  FINALIZADO: { rotulo: "Finalizado", classes: "border-green-600 text-green-700 dark:text-green-300" },
} as const;

function dataCurta(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a.slice(2)}`;
}

function Cartao({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-4 ${className}`}>
      <h2 className="mb-3 flex items-center gap-2 font-mono text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
        <span className="h-[3px] w-3.5 bg-accent" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Numero({ valor, rotulo, detalhe, destaque }: { valor: string; rotulo: string; detalhe?: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border bg-panel p-4 ${destaque ? "border-accent" : "border-line"}`}>
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="mt-1 font-mono text-5xl font-bold leading-none tabular-nums text-neutral-900 dark:text-neutral-100">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-muted">{detalhe}</p>}
    </div>
  );
}

function LinhaLembrete({ l }: { l: LinhaPrazo }) {
  const cor = l.nivel ? COR_NIVEL[l.nivel] : null;
  let estado: string;
  if (l.diasParaPrazo === null) estado = "Nunca avaliado";
  else if (l.diasParaPrazo < 0) estado = `Atrasado ${-l.diasParaPrazo} dias`;
  else if (l.diasParaPrazo === 0) estado = "Prazo hoje";
  else estado = `Prazo em ${l.diasParaPrazo} dias`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {l.nome}
          {l.nivel && <span className={`ml-2 text-xs font-semibold ${cor!.texto}`}>N{l.nivel} · {Math.round(l.media!)}%</span>}
        </p>
        <p className="text-xs text-muted">
          {l.ultimaData ? `Última: ${dataCurta(l.ultimaData)}` : "Sem avaliações"}
          {l.nivel && ` · ${ROTULO_INTERVALO[l.nivel]}`}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className={l.diasParaPrazo === null || l.diasParaPrazo < 0 ? "font-semibold text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}>
          {estado}
        </span>
        {l.agendado ? (
          <Link href={`/admin/plano?vista=semana&semana=${l.agendado.semana}`} className="text-muted underline">
            Agendado {rotuloSemana(l.agendado.semana)}
          </Link>
        ) : (
          <Link href="/admin/plano" className="font-medium underline">
            Agendar
          </Link>
        )}
      </div>
    </li>
  );
}

export function PainelView({ dados }: { dados: DadosPainel }) {
  const { numeros: n } = dados;
  const variacao = n.mediaRecente !== null && n.mediaAnterior !== null ? n.mediaRecente - n.mediaAnterior : null;
  const proximasPorSemana = [dados.semana, dados.proximas.find((p) => p.semana !== dados.semana)?.semana ?? null];
  const lembretes = [...dados.emAtraso, ...dados.aVencer];

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-6">
      <h1 className="mb-4 font-mono text-3xl font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">Painel</h1>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero valor={String(n.doMes)} rotulo="Avaliações este mês" detalhe={`${n.doAno} este ano`} />
        <Numero
          valor={n.mediaRecente !== null ? `${Math.round(n.mediaRecente)}%` : "—"}
          rotulo="Média (últimos 3 meses)"
          detalhe={
            variacao !== null ? (
              <span className={variacao >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {variacao >= 0 ? "▲" : "▼"} {Math.abs(Math.round(variacao))} pts vs. 3 meses antes
              </span>
            ) : undefined
          }
        />
        <Numero valor={`${n.avaliadosRecentes}/${n.totalAtivos}`} rotulo="Treinadores avaliados (90 dias)" />
        <Numero
          valor={String(n.porFinalizar)}
          rotulo="Por finalizar"
          detalhe="Avaliados, falta o feedback"
          destaque={n.porFinalizar > 0}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Cartao titulo={`Lembretes · ${dados.emAtraso.length} em atraso`} className="lg:col-span-3">
          {lembretes.length === 0 ? (
            <p className="text-sm text-muted">Todos os treinadores estão dentro do prazo.</p>
          ) : (
            <ul>
              {lembretes.map((l) => (
                <LinhaLembrete key={l.nome} l={l} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-dim">
            Nível 1: {ROTULO_INTERVALO[1]} · Nível 2: {ROTULO_INTERVALO[2]} · Nível 3: {ROTULO_INTERVALO[3]}. Aparece aqui
            quem está em atraso ou a menos de 14 dias do prazo.
          </p>
        </Cartao>

        <Cartao titulo="Próximas avaliações" className="lg:col-span-2">
          {dados.proximas.length === 0 ? (
            <p className="text-sm text-muted">Nada agendado para esta semana nem para a próxima.</p>
          ) : (
            <div className="space-y-3">
              {proximasPorSemana.filter(Boolean).map((s) => (
                <div key={s}>
                  <p className="mb-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {s === dados.semana ? "Esta semana" : "Próxima semana"} · {rotuloSemana(s!)}
                  </p>
                  <ul className="space-y-1">
                    {dados.proximas
                      .filter((p) => p.semana === s)
                      .map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-neutral-900 dark:text-neutral-100">
                            {p.treinador}
                            <span className="ml-1 text-xs text-muted">
                              {[p.dia && rotuloDia(p.dia), p.avaliador.split(" ")[0]].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ESTADO_PLANO[p.estado].classes}`}>
                            {ESTADO_PLANO[p.estado].rotulo}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/plano" className="mt-3 inline-block text-xs font-medium underline">
            Abrir plano de avaliações →
          </Link>
        </Cartao>
      </div>

      <Cartao titulo="Níveis dos treinadores" className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {([1, 2, 3] as Nivel[]).map((nivel) => {
            const doNivel = dados.niveis.filter((l) => l.nivel === nivel).sort((a, b) => a.media! - b.media!);
            const cor = COR_NIVEL[nivel];
            return (
              <div key={nivel} className={`rounded-lg border border-t-[3px] border-line p-3 ${cor.borda}`}>
                <p className={`text-sm font-semibold ${cor.texto}`}>{TITULO_NIVEL[nivel]}</p>
                <p className="mb-2 text-xs text-dim">Avaliar {ROTULO_INTERVALO[nivel]}</p>
                {doNivel.length === 0 ? (
                  <p className="text-xs text-dim">Ninguém neste nível.</p>
                ) : (
                  <ul className="space-y-1">
                    {doNivel.map((l) => (
                      <li key={l.nome} className="flex justify-between gap-2 rounded-md border border-line px-2 py-1 text-xs">
                        <span className="text-neutral-900 dark:text-neutral-100">{l.nome}</span>
                        <span className={`font-semibold ${cor.texto}`}>{Math.round(l.media!)}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        {dados.semAvaliacao.length > 0 && (
          <p className="mt-3 text-xs text-muted">Sem avaliações: {dados.semAvaliacao.join(", ")}</p>
        )}
      </Cartao>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Cartao titulo="Pilares da equipa (últimos 6 meses)">
          <ul className="space-y-2">
            {[...dados.pilares]
              .sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101))
              .map(({ pilar, pct }) => (
                <li key={pilar}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-neutral-900 dark:text-neutral-100">{pilar}</span>
                    <span className="font-semibold tabular-nums">{pct !== null ? `${Math.round(pct)}%` : "—"}</span>
                  </div>
                  <div className="h-1.5 rounded bg-line-soft">
                    <div
                      className={`h-1.5 rounded ${pct === null ? "" : COR_NIVEL[nivelDaMedia(pct)].fundo}`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-xs text-dim">Do mais fraco para o mais forte.</p>
        </Cartao>

        <Cartao titulo="Últimas avaliações">
          {dados.ultimas.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há avaliações.</p>
          ) : (
            <ul>
              {dados.ultimas.map((a) => (
                <li key={a.id} className="border-b border-line last:border-b-0">
                  <Link href={`/historico/${a.id}`} className="flex items-center justify-between gap-2 py-2 text-sm hover:underline">
                    <span className="text-neutral-900 dark:text-neutral-100">{a.treinador}</span>
                    <span className="flex items-center gap-3 text-xs text-muted">
                      {dataCurta(a.data)}
                      <span className="w-10 text-right font-semibold text-neutral-900 dark:text-neutral-100">{a.nota}%</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/historico" className="mt-3 inline-block text-xs font-medium underline">
            Ver histórico →
          </Link>
        </Cartao>
      </div>
    </div>
  );
}
