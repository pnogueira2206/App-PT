import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "@/components/setup-form";

export default async function SetupPage() {
  await connection(); // must check the database on every request, not at build time
  const trainers = await prisma.user.count({ where: { role: "TRAINER" } });
  if (trainers > 0) redirect("/login");

  return <SetupForm />;
}
