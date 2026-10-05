import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";

export default async function ApplicationsPage() {
  await requireTrainer();

  const applications = await prisma.coachingApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Candidaturas</h1>
        <a
          href="/coaching"
          target="_blank"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Ver formulário ↗
        </a>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ainda não recebeste candidaturas. Partilha o link /coaching.
        </p>
      ) : (
        <ul className="space-y-3">
          {applications.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{a.fullName}</p>
                  <a
                    href={`mailto:${a.email}`}
                    className="text-sm text-slate-500 hover:underline"
                  >
                    {a.email}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                    {a.goal}
                  </span>
                  {a.competitionLevel && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {a.competitionLevel}
                    </span>
                  )}
                </div>
              </div>
              {a.lookingFor && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    O que procura num coach
                  </p>
                  <p className="whitespace-pre-line text-sm text-slate-700">
                    {a.lookingFor}
                  </p>
                </div>
              )}
              {a.trainingBackground && (
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Experiência de treino
                  </p>
                  <p className="whitespace-pre-line text-sm text-slate-700">
                    {a.trainingBackground}
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                {a.createdAt.toLocaleString("pt-PT")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
