import { GerirGrelha } from "@/components/admin/gerir-grelha";
import { obterGrelha } from "@/lib/grelha-actions";

export default async function GrelhaPage() {
  const seccoes = await obterGrelha();
  return <GerirGrelha seccoes={seccoes} />;
}
