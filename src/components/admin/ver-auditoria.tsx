import Link from "next/link";

interface Registo {
  id: string;
  utilizador: string;
  acao: string;
  detalhe: string | null;
  criadoEm: string;
}

const ROTULOS_ACAO: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FALHOU: "Login falhado",
  LOGIN_BLOQUEADO: "Conta bloqueada",
  VIU_AVALIACAO: "Viu avaliação",
  CRIOU_AVALIACAO: "Criou avaliação",
  CONFIRMOU_AVALIACAO: "Confirmou avaliação",
  EXPORTOU_CSV: "Exportou CSV",
  REPOS_PASSWORD: "Repôs palavra-passe",
  MUDOU_PASSWORD_PROPRIA: "Mudou a própria palavra-passe",
  ANONIMIZOU_CONTA: "Anonimizou conta (RGPD)",
  EXPORTOU_MEUS_DADOS: "Descarregou os próprios dados",
};

function corAcao(acao: string): string {
  if (acao === "LOGIN_FALHOU" || acao === "LOGIN_BLOQUEADO") return "text-red-600";
  if (acao === "EXPORTOU_CSV" || acao === "REPOS_PASSWORD" || acao === "ANONIMIZOU_CONTA") return "text-amber-700";
  return "text-neutral-900";
}

export function VerAuditoria({ registos }: { registos: Registo[] }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:max-w-2xl lg:max-w-3xl md:px-6 md:py-6">
      <Link href="/admin" className="mb-3 inline-block text-sm font-medium text-neutral-500 underline">
        ← Voltar ao Admin
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-neutral-900">Registo de Atividade</h1>
      <p className="mb-4 text-xs text-neutral-500">
        Últimas {registos.length} ações — logins, avaliações vistas ou criadas, exportações e alterações de conta.
        Apagado automaticamente ao fim de 12 meses.
      </p>

      {registos.length === 0 ? (
        <p className="text-sm text-neutral-500">Ainda não há registos.</p>
      ) : (
        <ul className="space-y-2">
          {registos.map((r) => (
            <li key={r.id} className="rounded-md border border-neutral-200 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-medium ${corAcao(r.acao)}`}>{ROTULOS_ACAO[r.acao] ?? r.acao}</span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {new Date(r.criadoEm).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-600">{r.utilizador}</p>
              {r.detalhe && <p className="mt-0.5 text-xs text-neutral-400">{r.detalhe}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
