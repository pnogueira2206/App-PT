import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Monday of the current week, as UTC midnight (same convention as src/lib/dates.ts).
function weekDay(offset: number): Date {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
  const date = new Date(`${today}T00:00:00.000Z`);
  const monday = date.getTime() - ((date.getUTCDay() + 6) % 7) * 86400000;
  return new Date(monday + offset * 86400000);
}

async function main() {
  const trainerPasswordHash = await bcrypt.hash("treinador123", 10);
  const studentPasswordHash = await bcrypt.hash("aluno123", 10);

  const trainer = await prisma.user.upsert({
    where: { email: "treinador@exemplo.com" },
    update: {},
    create: {
      name: "Rui Treinador",
      email: "treinador@exemplo.com",
      passwordHash: trainerPasswordHash,
      role: "TRAINER",
    },
  });

  const ana = await prisma.user.upsert({
    where: { email: "ana@exemplo.com" },
    update: {},
    create: {
      name: "Ana Silva",
      email: "ana@exemplo.com",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      trainerId: trainer.id,
      dateOfBirth: new Date("1996-04-12"),
      weightKg: 62.5,
      heightCm: 167,
    },
  });

  const bruno = await prisma.user.upsert({
    where: { email: "bruno@exemplo.com" },
    update: {},
    create: {
      name: "Bruno Costa",
      email: "bruno@exemplo.com",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      trainerId: trainer.id,
    },
  });

  // An archived former client: can't sign in, shows in the "Archived" tab.
  await prisma.user.upsert({
    where: { email: "carla@exemplo.com" },
    update: {},
    create: {
      name: "Carla Mendes",
      email: "carla@exemplo.com",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      trainerId: trainer.id,
      archivedAt: new Date(),
    },
  });

  const group = await prisma.group.upsert({

    where: { id: "seed-group-pt" },
    update: {},
    create: { id: "seed-group-pt", name: "PT Ana + Bruno", trainerId: trainer.id },
  });
  for (const student of [ana, bruno]) {
    await prisma.groupMember.upsert({
      where: { groupId_studentId: { groupId: group.id, studentId: student.id } },
      update: {},
      create: { groupId: group.id, studentId: student.id },
    });
  }

  const exerciseData: Prisma.ExerciseCreateWithoutTrainerInput[] = [
    { name: "Back Squat", category: "STRENGTH", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8" },
    { name: "Deadlift", category: "STRENGTH", videoUrl: "https://www.youtube.com/watch?v=op9kVnSso6Q" },
    { name: "Power Clean", category: "WEIGHTLIFTING", videoUrl: "https://www.youtube.com/watch?v=GVt4uQ0sDJE" },
    { name: "Pull-up", category: "GYMNASTICS" },
    { name: "Remo", category: "CARDIO" },
    { name: "Fran", category: "OTHER", notes: "21-15-9 Thrusters 43/30kg + Pull-ups" },
  ];
  const exercises: Record<string, string> = {};
  for (const data of exerciseData) {
    const exercise = await prisma.exercise.upsert({
      where: { trainerId_name: { trainerId: trainer.id, name: data.name } },
      update: {},
      create: { ...data, trainerId: trainer.id },
    });
    exercises[data.name] = exercise.id;
  }

  // Seeded workouts are recreated on each run so they always sit in the current week.
  await prisma.workout.deleteMany({ where: { id: { startsWith: "seed-" } } });

  await prisma.workout.create({
    data: {
      id: "seed-group-mon",
      title: "Força + Metcon",
      description: "Semana 1 do ciclo de força.",
      date: weekDay(0),
      status: "PUBLISHED",
      trainerId: trainer.id,
      groupId: group.id,
      blocks: {
        create: [
          {
            order: 1,
            type: "STRENGTH",
            title: "A. Back Squat",
            exerciseId: exercises["Back Squat"],
            prescribedSets: 5,
            prescribedReps: "5",
            percent1RM: 75,
            tempo: "30X1",
            restSeconds: 120,
            trainerNotes: "Peito alto, desce até abaixo da paralela.",
          },
          {
            order: 2,
            type: "METCON",
            title: "B. Metcon",
            exerciseId: exercises["Fran"],
            metconFormat: "FOR_TIME",
            timeCapSeconds: 600,
            description: "21-15-9\nThrusters 43/30kg\nPull-ups",
          },
        ],
      },
    },
  });

  // Individual version for Bruno (shoulder): same day, scaled metcon.
  await prisma.workout.create({
    data: {
      id: "seed-group-mon-bruno",
      title: "Força + Metcon",
      description: "Semana 1 do ciclo de força.",
      date: weekDay(0),
      status: "PUBLISHED",
      trainerId: trainer.id,
      studentId: bruno.id,
      sourceWorkoutId: "seed-group-mon",
      blocks: {
        create: [
          {
            order: 1,
            type: "STRENGTH",
            title: "A. Back Squat",
            exerciseId: exercises["Back Squat"],
            prescribedSets: 5,
            prescribedReps: "5",
            percent1RM: 70,
            restSeconds: 120,
          },
          {
            order: 2,
            type: "METCON",
            title: "B. Metcon (ombro)",
            metconFormat: "FOR_TIME",
            timeCapSeconds: 600,
            description: "21-15-9\nFront Squat 40kg\nRing rows",
            trainerNotes: "Sem pull-ups esta semana por causa do ombro.",
          },
        ],
      },
    },
  });

  const anaWednesday = await prisma.workout.create({
    data: {
      id: "seed-ana-wed",
      title: "Engine + Acessórios",
      date: weekDay(2),
      status: "PUBLISHED",
      trainerId: trainer.id,
      studentId: ana.id,
      blocks: {
        create: [
          {
            order: 1,
            type: "CARDIO",
            title: "A. Remo",
            exerciseId: exercises["Remo"],
            cardioModality: "ROW",
            targetDistanceM: 2000,
            targetPace: "2:05/500m",
          },
          {
            order: 2,
            type: "METCON",
            title: "B. AMRAP 12'",
            metconFormat: "AMRAP",
            timeCapSeconds: 720,
            description: "10 Power Cleans 40kg\n15 Wall Balls 6kg\n200m Run",
          },
          {
            order: 3,
            type: "ACCESSORY",
            title: "C. Core",
            prescribedSets: 3,
            description: "3 rondas:\n30s Hollow hold\n10 Dead bugs / lado",
          },
        ],
      },
    },
    include: { blocks: true },
  });

  await prisma.workout.create({
    data: {
      id: "seed-ana-fri",
      title: "Deadlift",
      date: weekDay(4),
      status: "DRAFT",
      trainerId: trainer.id,
      studentId: ana.id,
      blocks: {
        create: [
          {
            order: 1,
            type: "STRENGTH",
            title: "A. Deadlift",
            exerciseId: exercises["Deadlift"],
            prescribedSets: 4,
            prescribedReps: "4",
            percent1RM: 80,
            restSeconds: 150,
          },
        ],
      },
    },
  });

  // Ana's results for Wednesday.
  const [row, amrap] = anaWednesday.blocks.sort((a, b) => a.order - b.order);
  await prisma.blockResult.create({
    data: { blockId: row.id, studentId: ana.id, timeSeconds: 508, distanceM: 2000, rpe: 7 },
  });
  await prisma.blockResult.create({
    data: {
      blockId: amrap.id,
      studentId: ana.id,
      rounds: 5,
      reps: 12,
      rx: true,
      rpe: 9,
      studentNotes: "As wall balls custaram!",
    },
  });

  // Three past weeks for Ana, so the charts and adherence have history.
  const history = [
    { week: -3, squat: [70, 72.5, 72.5], fran: 290 },
    { week: -2, squat: [72.5, 75, 75], fran: 275 },
    { week: -1, squat: [75, 77.5, 80], fran: 262 },
  ];
  for (const [i, h] of history.entries()) {
    const workout = await prisma.workout.create({
      data: {
        id: `seed-ana-past-${i + 1}`,
        title: "Força + Fran",
        date: weekDay(h.week * 7 + 1),
        status: "PUBLISHED",
        trainerId: trainer.id,
        studentId: ana.id,
        blocks: {
          create: [
            {
              order: 1,
              type: "STRENGTH",
              title: "A. Back Squat",
              exerciseId: exercises["Back Squat"],
              prescribedSets: 3,
              prescribedReps: "3",
            },
            {
              order: 2,
              type: "METCON",
              title: "B. Fran",
              exerciseId: exercises["Fran"],
              metconFormat: "FOR_TIME",
              timeCapSeconds: 600,
              description: "21-15-9\nThrusters 43/30kg\nPull-ups",
            },
          ],
        },
      },
      include: { blocks: true },
    });
    const [squat, fran] = workout.blocks.sort((a, b) => a.order - b.order);
    const seenAt = new Date();
    await prisma.blockResult.create({
      data: {
        blockId: squat.id,
        studentId: ana.id,
        rpe: 8,
        seenAt,
        sets: { create: h.squat.map((loadKg, n) => ({ setNumber: n + 1, reps: 3, loadKg })) },
      },
    });
    await prisma.blockResult.create({
      data: { blockId: fran.id, studentId: ana.id, timeSeconds: h.fran, rx: true, rpe: 9, seenAt },
    });
    await prisma.workoutCompletion.create({
      data: { workoutId: workout.id, studentId: ana.id, sessionRpe: 8, seenAt },
    });
  }

  // A coach comment on Wednesday's AMRAP, still unread by Ana.
  const amrapResult = await prisma.blockResult.findFirstOrThrow({
    where: { blockId: amrap.id, studentId: ana.id },
  });
  await prisma.resultComment.create({
    data: { resultId: amrapResult.id, authorId: trainer.id, body: "Grande ritmo! Na próxima tenta 6 rondas." },
  });

  if ((await prisma.personalRecord.count({ where: { studentId: ana.id } })) === 0) {

    await prisma.personalRecord.createMany({
      data: [
        { studentId: ana.id, exerciseId: exercises["Back Squat"], type: "WEIGHT", value: "80", unit: "kg" },
        { studentId: ana.id, exerciseId: exercises["Deadlift"], type: "WEIGHT", value: "105", unit: "kg" },
        { studentId: ana.id, exerciseId: exercises["Fran"], type: "TIME", value: "4:12" },
        { studentId: bruno.id, exerciseId: exercises["Back Squat"], type: "WEIGHT", value: "120", unit: "kg" },
      ],
    });
  }

  console.log("Seed concluído.");
  console.log("Treinador: treinador@exemplo.com / treinador123");
  console.log("Aluna: ana@exemplo.com / aluno123");
  console.log("Aluno: bruno@exemplo.com / aluno123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
