import { CriteriosPilares } from "@/components/admin/criterios-pilares";
import { obterGrelhaAtiva } from "@/lib/grelha-actions";
import { obterAtribuicoesPilares } from "@/lib/pilares-actions";

export default async function CriteriosPilaresPage() {
  const [seccoes, atribuicoes] = await Promise.all([obterGrelhaAtiva(), obterAtribuicoesPilares()]);
  return <CriteriosPilares seccoes={seccoes} atribuicoes={atribuicoes} />;
}
