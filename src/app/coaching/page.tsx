import type { Metadata } from "next";
import { CoachingApplicationForm } from "@/components/coaching-application-form";

export const metadata: Metadata = {
  title: "Candidatura a Coaching Individual | PN Coaching",
  description:
    "Coaching individualizado para atletas competitivos de Functional Fitness.",
};

// Phone/tablet: a single card with the intro on top of the form.
// Desktop (lg): intro on the left, form card on the right.
export default function CoachingPage() {
  return (
    <main className="flex min-h-screen flex-1 items-start justify-center bg-black px-4 py-10 sm:px-8 sm:py-16 lg:items-center lg:px-12">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 sm:max-w-2xl lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)] lg:items-center lg:gap-16 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
        <div className="border-b border-neutral-800 px-6 py-6 sm:px-8 sm:py-8 lg:border-0 lg:p-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#c9b37e] lg:text-xs">
            PN Coaching
          </p>
          <h1 className="mt-2 text-xl font-semibold text-neutral-100 sm:text-2xl lg:mt-4 lg:text-5xl lg:leading-tight">
            Candidatura a Coaching Individual
          </h1>
          <div className="hidden lg:mt-6 lg:block lg:h-px lg:w-16 lg:bg-[#c9b37e]" />
          <p className="mt-2 text-sm leading-relaxed text-neutral-400 sm:text-base lg:mt-6 lg:max-w-md lg:text-lg">
            Coaching individualizado para atletas competitivos de Functional
            Fitness. Diz-me em que ponto estás e respondo-te em até dois dias.
          </p>
        </div>
        <div className="lg:rounded-lg lg:border lg:border-neutral-800 lg:bg-neutral-900">
          <CoachingApplicationForm />
        </div>
      </div>
    </main>
  );
}
