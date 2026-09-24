import { AdminMenu } from "@/components/admin/admin-menu";
import { listarAvaliacoes } from "@/lib/avaliacoes-actions";

export default async function AdminPage() {
  const avaliacoes = await listarAvaliacoes();
  return <AdminMenu totalAvaliacoes={avaliacoes.length} />;
}
