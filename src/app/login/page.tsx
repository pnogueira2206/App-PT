import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  // A fresh install has no trainer yet: send the first visitor to set one up.
  await connection(); // must check the database on every request, not at build time
  const trainers = await prisma.user.count({ where: { role: "TRAINER" } });
  if (trainers === 0) redirect("/setup");

  return <LoginForm />;
}
