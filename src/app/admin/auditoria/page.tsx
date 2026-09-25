import { VerAuditoria } from "@/components/admin/ver-auditoria";
import { listarAuditoria } from "@/lib/auditoria";

export default async function AuditoriaPage() {
  const registos = await listarAuditoria();
  return <VerAuditoria registos={registos} />;
}
