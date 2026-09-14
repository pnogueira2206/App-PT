import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const group = await prisma.group.upsert({
    where: { id: "seed-group-manha" },
    update: {},
    create: {
      id: "seed-group-manha",
      name: "Turma da manhã",
      trainerId: trainer.id,
    },
  });

  await prisma.groupMember.upsert({
    where: { groupId_studentId: { groupId: group.id, studentId: ana.id } },
    update: {},
    create: { groupId: group.id, studentId: ana.id },
  });
  await prisma.groupMember.upsert({
    where: { groupId_studentId: { groupId: group.id, studentId: bruno.id } },
    update: {},
    create: { groupId: group.id, studentId: bruno.id },
  });

  const agachamento = await prisma.exercise.upsert({
    where: { trainerId_name: { trainerId: trainer.id, name: "Agachamento" } },
    update: {},
    create: { name: "Agachamento", trainerId: trainer.id },
  });
  const supino = await prisma.exercise.upsert({
    where: { trainerId_name: { trainerId: trainer.id, name: "Supino" } },
    update: {},
    create: { name: "Supino", trainerId: trainer.id },
  });

  const workout = await prisma.workout.upsert({
    where: { id: "seed-workout-1" },
    update: {},
    create: {
      id: "seed-workout-1",
      title: "Treino de força - Semana 1",
      description: "Foco em técnica e progressão de carga.",
      date: new Date(),
      trainerId: trainer.id,
      groupId: group.id,
    },
  });

  const blockA = await prisma.workoutBlock.upsert({
    where: { id: "seed-block-a" },
    update: {},
    create: {
      id: "seed-block-a",
      workoutId: workout.id,
      order: 1,
      title: "Bloco A",
      exerciseId: agachamento.id,
      prescribedSets: 4,
      prescribedReps: "8-10",
      prescribedWeight: "60kg",
      restSeconds: 90,
      trainerNotes: "Desce até à paralela, mantém o peito alto.",
    },
  });

  await prisma.workoutBlock.upsert({
    where: { id: "seed-block-b" },
    update: {},
    create: {
      id: "seed-block-b",
      workoutId: workout.id,
      order: 2,
      title: "Bloco B",
      exerciseId: supino.id,
      prescribedSets: 3,
      prescribedReps: "10",
      prescribedWeight: "40kg",
      restSeconds: 75,
      trainerNotes: "Controla a descida, não trancar os cotovelos no topo.",
    },
  });

  await prisma.blockResult.upsert({
    where: { blockId_studentId: { blockId: blockA.id, studentId: ana.id } },
    update: {},
    create: {
      blockId: blockA.id,
      studentId: ana.id,
      setsCompleted: 4,
      repsCompleted: "9",
      weightUsed: "55kg",
      rpe: 8,
      studentNotes: "Senti-me forte hoje!",
    },
  });

  await prisma.personalRecord.create({
    data: {
      studentId: ana.id,
      exerciseId: agachamento.id,
      value: "70",
      unit: "kg",
      notes: "1RM testado em ginásio",
    },
  });

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
