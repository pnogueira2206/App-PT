import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user.papel === "TREINADOR") redirect("/historico");
  if (session?.user.papel === "ADMIN") redirect("/painel");
  redirect("/nova-avaliacao");
}
