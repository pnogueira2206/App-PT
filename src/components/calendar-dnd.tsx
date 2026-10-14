"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveWorkoutAction } from "@/app/trainer/calendar/actions";

const TYPE = "application/x-pn-workout";

/** A workout card that can be dragged to another day (only the calendar's own workouts). */
export function DraggableCard({
  workoutId,
  date,
  enabled,
  className,
  children,
}: {
  workoutId: string;
  date: string;
  enabled: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable={enabled}
      onDragStart={(e) => {
        e.dataTransfer.setData(TYPE, JSON.stringify({ workoutId, date }));
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={`${className} ${enabled ? "cursor-grab active:cursor-grabbing" : ""} ${dragging ? "opacity-40" : ""}`}
    >
      {children}
    </div>
  );
}

/** A day of the grid that accepts dropped workouts: they move to this date. */
export function DayDropCell({
  date,
  className,
  children,
}: {
  date: string;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [isPending, startTransition] = useTransition();
  const accepts = (e: React.DragEvent) => e.dataTransfer.types.includes(TYPE);

  return (
    <div
      onDragOver={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        if (!accepts(e)) return;
        e.preventDefault();
        const { workoutId, date: from } = JSON.parse(e.dataTransfer.getData(TYPE)) as { workoutId: string; date: string };
        if (from === date) return;
        startTransition(async () => {
          await moveWorkoutAction(workoutId, date);
          router.refresh();
        });
      }}
      className={`${className} ${over ? "outline outline-2 -outline-offset-2 outline-brand bg-brand/10" : ""} ${isPending ? "opacity-60" : ""}`}
    >
      {children}
    </div>
  );
}
