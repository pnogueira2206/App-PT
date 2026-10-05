import type { Metadata } from "next";
import { CoachingApplicationForm } from "@/components/coaching-application-form";

export const metadata: Metadata = {
  title: "Candidatura a Coaching Individual | PN Coaching",
  description:
    "Coaching individualizado para atletas competitivos de Functional Fitness.",
};

export default function CoachingPage() {
  return (
    <main className="flex min-h-screen flex-1 items-start justify-center bg-black px-4 py-10 sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 px-6 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#c9b37e]">
            PN Coaching
          </p>
          <h1 className="mt-2 text-xl font-semibold text-neutral-100">
            Candidatura a Coaching Individual
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Coaching individualizado para atletas competitivos de Functional
            Fitness. Diz-me em que ponto estás e respondo-te em até dois dias.
          </p>
        </div>
        <CoachingApplicationForm />
      </div>
    </main>
  );
}
