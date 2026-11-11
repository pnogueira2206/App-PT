import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { obterDadosPainel } from "@/lib/painel";
import { PainelView } from "@/components/painel/painel-view";

export default async function PainelPage() {
  const session = await auth();
  if (session?.user.papel !== "ADMIN") redirect("/");
  const dados = await obterDadosPainel();
  return <PainelView dados={dados} />;
}
