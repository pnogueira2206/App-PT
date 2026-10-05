"use client";

import { startTransition, useActionState, useState } from "react";
import {
  submitApplicationAction,
  type ApplicationState,
} from "@/app/coaching/actions";
import { COMPETITION_LEVELS, GOALS, type Goal } from "@/lib/coaching-options";

const labelClass =
  "mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300";
const fieldClass =
  "w-full rounded-md border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-[#c9b37e] focus:outline-none";
const selectClass = `${fieldClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2010%206'%3E%3Cpath%20fill='%23c9b37e'%20d='M0%200h10L5%206z'/%3E%3C/svg%3E")] bg-[length:10px_6px] bg-[right_1rem_center] bg-no-repeat pr-10`;

function FieldError({ state, name }: { state: ApplicationState; name: string }) {
  const message = state?.fieldErrors?.[name];
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

export function CoachingApplicationForm() {
  const [state, formAction, isPending] = useActionState(
    submitApplicationAction,
    undefined
  );
  const [goal, setGoal] = useState<Goal | "">("");
  const levels = goal ? COMPETITION_LEVELS[goal] : undefined;

  if (state?.success) {
    return (
      <div className="px-6 py-10 text-center">
        <h2 className="text-lg font-semibold text-neutral-100">Obrigado!</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Recebi a tua candidatura e respondo-te em até dois dias.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      // Submitting via onSubmit (instead of the action prop) stops React from
      // resetting the fields, so nothing typed is lost on a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-5 px-6 py-6"
    >
      {/* Honeypot against spam bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div>
        <label htmlFor="fullName" className={labelClass}>
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="O teu nome"
          className={fieldClass}
        />
        <FieldError state={state} name="fullName" />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className={fieldClass}
        />
        <FieldError state={state} name="email" />
      </div>

      <div>
        <label htmlFor="goal" className={labelClass}>
          Objetivo
        </label>
        <select
          id="goal"
          name="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal | "")}
          className={`${selectClass} ${goal ? "" : "text-neutral-500"}`}
        >
          <option value="" disabled>
            Escolhe o teu objetivo
          </option>
          {GOALS.map((g) => (
            <option key={g} value={g} className="text-neutral-100">
              {g}
            </option>
          ))}
        </select>
        <FieldError state={state} name="goal" />
      </div>

      {levels && (
        <div>
          <label htmlFor="competitionLevel" className={labelClass}>
            Onde competes atualmente
          </label>
          {/* key resets the choice whenever the goal changes */}
          <select
            key={goal}
            id="competitionLevel"
            name="competitionLevel"
            defaultValue=""
            className={selectClass}
          >
            <option value="" disabled>
              Escolhe o teu nível
            </option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <FieldError state={state} name="competitionLevel" />
        </div>
      )}

      <div>
        <label htmlFor="lookingFor" className={labelClass}>
          O que procuras num coach?
        </label>
        <textarea
          id="lookingFor"
          name="lookingFor"
          rows={4}
          placeholder="Os teus objetivos, a tua próxima competição e o que queres da relação de coaching."
          className={`${fieldClass} resize-none`}
        />
        <FieldError state={state} name="lookingFor" />
      </div>

      <div>
        <label htmlFor="trainingBackground" className={labelClass}>
          Experiência de treino
        </label>
        <textarea
          id="trainingBackground"
          name="trainingBackground"
          rows={4}
          placeholder="Há quanto tempo treinas, historial competitivo e o que segues atualmente."
          className={`${fieldClass} resize-none`}
        />
        <FieldError state={state} name="trainingBackground" />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#c9b37e] px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-950 transition hover:bg-[#d6c290] disabled:opacity-60"
      >
        {isPending ? "A enviar..." : "Enviar candidatura"}
      </button>
    </form>
  );
}
