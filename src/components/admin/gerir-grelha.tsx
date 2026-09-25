"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Criterio, Seccao, TipoResposta } from "@/data/grelha";
import {
  adicionarCriterioAction,
  adicionarSeccaoAction,
  alternarCriterioAtivoAction,
  alternarSeccaoAtivaAction,
  editarCriterioAction,
  editarSeccaoAction,
  moverCriterioAction,
  moverSeccaoAction,
} from "@/lib/grelha-actions";

const inputClasses =
  "rounded-none border border-line bg-transparent px-2 py-1 text-sm text-neutral-100 focus:border-white focus:outline-none focus:ring-1 focus:ring-white";

export function GerirGrelha({ seccoes }: { seccoes: Seccao[] }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-muted underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-2 text-lg font-semibold text-neutral-100">Secções &amp; Critérios</h1>
      <div className="mb-5 rounded-none bg-panel px-3 py-2 text-xs text-muted">
        As alterações aqui feitas <strong>não mudam avaliações já guardadas</strong> — cada avaliação fica com uma
        cópia da grelha tal como estava no momento em que foi preenchida.
      </div>

      <div className="space-y-5">
        {seccoes.map((seccao, i) => (
          <SeccaoCard key={seccao.id} seccao={seccao} podeSubir={i > 0} podeDescer={i < seccoes.length - 1} />
        ))}
      </div>

      <NovaSeccaoForm />
    </div>
  );
}

function SeccaoCard({ seccao, podeSubir, podeDescer }: { seccao: Seccao; podeSubir: boolean; podeDescer: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aEditar, setAEditar] = useState(false);
  const [nome, setNome] = useState(seccao.nome);
  const [percentagem, setPercentagem] = useState(String(seccao.percentagem));
  const ativa = seccao.ativa !== false;

  return (
    <section className={`rounded-none border p-3 ${ativa ? "border-line" : "border-line bg-panel"}`}>
      {aEditar ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await editarSeccaoAction(seccao.id, { nome: nome.trim() || seccao.nome, percentagem: Number(percentagem) || 0 });
              router.refresh();
            });
            setAEditar(false);
          }}
        >
          <input className={`${inputClasses} flex-1`} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <input
            type="number"
            className={`${inputClasses} w-20`}
            value={percentagem}
            onChange={(e) => setPercentagem(e.target.value)}
          />
          <span className="text-xs text-muted">%</span>
          <button type="submit" className="text-xs font-medium underline">
            Guardar
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${ativa ? "text-neutral-100" : "text-dim line-through"}`}>
              {seccao.nome}
            </p>
            <p className="text-xs text-muted">{seccao.percentagem}%</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={!podeSubir}
              onClick={() => startTransition(async () => { await moverSeccaoAction(seccao.id, -1); router.refresh(); })}
              className="text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={!podeDescer}
              onClick={() => startTransition(async () => { await moverSeccaoAction(seccao.id, 1); router.refresh(); })}
              className="text-xs disabled:opacity-30"
            >
              ↓
            </button>
            <button type="button" onClick={() => setAEditar(true)} className="text-xs font-medium text-muted underline">
              Editar
            </button>
            <button
              type="button"
              onClick={() => startTransition(async () => { await alternarSeccaoAtivaAction(seccao.id, !ativa); router.refresh(); })}
              className={`text-xs font-medium underline ${ativa ? "text-red-400" : "text-green-400"}`}
            >
              {ativa ? "Desativar" : "Reativar"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-1.5 border-t border-line pt-3">
        {seccao.criterios.map((c, i) => (
          <CriterioRow
            key={c.id}
            seccaoId={seccao.id}
            criterio={c}
            podeSubir={i > 0}
            podeDescer={i < seccao.criterios.length - 1}
          />
        ))}
      </div>

      <NovoCriterioForm seccaoId={seccao.id} />
    </section>
  );
}

function CriterioRow({
  seccaoId,
  criterio,
  podeSubir,
  podeDescer,
}: {
  seccaoId: string;
  criterio: Criterio;
  podeSubir: boolean;
  podeDescer: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aEditar, setAEditar] = useState(false);
  const [texto, setTexto] = useState(criterio.texto);
  const [peso, setPeso] = useState(criterio.pesoMaximo == null ? "" : String(criterio.pesoMaximo));
  const ativo = criterio.ativo !== false;

  if (aEditar) {
    return (
      <form
        className="flex flex-wrap items-center gap-2 py-1"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            await editarCriterioAction(criterio.id, {
              texto: texto.trim() || criterio.texto,
              pesoMaximo: peso.trim() === "" ? null : Number(peso),
            });
            router.refresh();
          });
          setAEditar(false);
        }}
      >
        <input className={`${inputClasses} flex-1`} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
        <input
          type="number"
          step={0.5}
          min={0}
          placeholder="peso"
          className={`${inputClasses} w-20`}
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />
        <button type="submit" className="text-xs font-medium underline">
          Guardar
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <p className={`text-xs ${ativo ? "text-neutral-300" : "text-dim line-through"}`}>
        {criterio.texto}
        <span className="text-dim"> ({criterio.pesoMaximo == null ? "sem peso" : criterio.pesoMaximo})</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={!podeSubir}
          onClick={() => startTransition(async () => { await moverCriterioAction(seccaoId, criterio.id, -1); router.refresh(); })}
          className="text-xs disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!podeDescer}
          onClick={() => startTransition(async () => { await moverCriterioAction(seccaoId, criterio.id, 1); router.refresh(); })}
          className="text-xs disabled:opacity-30"
        >
          ↓
        </button>
        <button type="button" onClick={() => setAEditar(true)} className="text-xs font-medium text-muted underline">
          Editar
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => { await alternarCriterioAtivoAction(criterio.id, !ativo); router.refresh(); })}
          className={`text-xs font-medium underline ${ativo ? "text-red-400" : "text-green-400"}`}
        >
          {ativo ? "Desativar" : "Reativar"}
        </button>
      </div>
    </div>
  );
}

function NovoCriterioForm({ seccaoId }: { seccaoId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aAbrir, setAAbrir] = useState(false);
  const [texto, setTexto] = useState("");
  const [peso, setPeso] = useState("1");
  const [tipo, setTipo] = useState<TipoResposta>("PONTOS");

  if (!aAbrir) {
    return (
      <button type="button" onClick={() => setAAbrir(true)} className="mt-2 text-xs font-medium underline">
        + Adicionar critério
      </button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-none bg-panel p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!texto.trim()) return;
        startTransition(async () => {
          await adicionarCriterioAction(seccaoId, {
            texto: texto.trim(),
            pesoMaximo: tipo === "TEXTO_LIVRE" || peso.trim() === "" ? null : Number(peso),
            tipoResposta: tipo,
          });
          router.refresh();
        });
        setTexto("");
        setPeso("1");
        setAAbrir(false);
      }}
    >
      <input
        className={`${inputClasses} w-full`}
        placeholder="Texto do critério"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <select className={inputClasses} value={tipo} onChange={(e) => setTipo(e.target.value as TipoResposta)}>
          <option value="PONTOS">Pontos</option>
          <option value="TEXTO_LIVRE">Texto livre</option>
        </select>
        {tipo === "PONTOS" && (
          <input
            type="number"
            step={0.5}
            min={0}
            placeholder="peso máximo"
            className={`${inputClasses} w-28`}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
        )}
        <button type="submit" className="rounded-none bg-white px-3 py-1 text-xs font-medium text-black">
          Adicionar
        </button>
        <button type="button" onClick={() => setAAbrir(false)} className="text-xs text-muted underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function NovaSeccaoForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [aAbrir, setAAbrir] = useState(false);
  const [nome, setNome] = useState("");
  const [percentagem, setPercentagem] = useState("");

  if (!aAbrir) {
    return (
      <button type="button" onClick={() => setAAbrir(true)} className="mt-5 text-sm font-medium underline">
        + Adicionar secção
      </button>
    );
  }

  return (
    <form
      className="mt-5 space-y-2 rounded-none border border-line p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        startTransition(async () => {
          await adicionarSeccaoAction(nome.trim(), Number(percentagem) || 0);
          router.refresh();
        });
        setNome("");
        setPercentagem("");
        setAAbrir(false);
      }}
    >
      <input className={`${inputClasses} w-full`} placeholder="Nome da secção" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="%"
          className={`${inputClasses} w-24`}
          value={percentagem}
          onChange={(e) => setPercentagem(e.target.value)}
        />
        <button type="submit" className="rounded-none bg-white px-3 py-1 text-xs font-medium text-black">
          Adicionar secção
        </button>
        <button type="button" onClick={() => setAAbrir(false)} className="text-xs text-muted underline">
          Cancelar
        </button>
      </div>
    </form>
  );
}
