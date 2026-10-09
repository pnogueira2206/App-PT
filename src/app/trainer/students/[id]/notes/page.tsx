import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/require-session";
import { getI18n } from "@/i18n/server";
import { APP_TIMEZONE } from "@/lib/dates";
import { addNoteAction, deleteNoteAction, toggleNotePinAction } from "@/app/trainer/actions";
import { NoteForm } from "@/components/note-form";
import { PinIcon } from "@/components/icons";

export default async function StudentNotesPage({ params }: PageProps<"/trainer/students/[id]/notes">) {
  const { id } = await params;
  const session = await requireTrainer();
  const { t, intlLocale } = await getI18n();

  const student = await prisma.user.findFirst({
    where: { id, trainerId: session.user.id, role: "STUDENT" },
    include: { notesAbout: { orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] } },
  });
  if (!student) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("notes.title")}</h2>
        <p className="text-sm text-slate-500">{t("notes.subtitle")}</p>
      </div>
      <NoteForm action={addNoteAction.bind(null, student.id)} />
      {student.notesAbout.length === 0 ? (
        <p className="text-sm text-slate-500">{t("notes.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {student.notesAbout.map((note) => (
            <li
              key={note.id}
              className={`rounded-xl border bg-white p-4 ${note.pinned ? "border-brand/60" : "border-slate-200"}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>
                  {note.pinned && <PinIcon className="mr-1 text-brand-text" />}
                  {note.createdAt.toLocaleString(intlLocale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: APP_TIMEZONE,
                  })}
                </span>
                <span className="flex gap-3">
                  <form action={toggleNotePinAction.bind(null, student.id, note.id)}>
                    <button className="hover:text-slate-900">{note.pinned ? t("notes.unpin") : t("notes.pin")}</button>
                  </form>
                  <form action={deleteNoteAction.bind(null, student.id, note.id)}>
                    <button className="hover:text-red-600">{t("common.delete")}</button>
                  </form>
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
